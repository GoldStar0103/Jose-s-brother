import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import postgres from 'postgres';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { createDb, type Database } from '../index.js';
import {
  getPaymentDetails,
  isValidCardNumber,
  isValidClabe,
  paymentDetailsFromEnv,
  reviewFxRate,
  reviewPaymentDetails,
  savePaymentDetails,
} from './payment-settings.js';

/** Real CLABEs whose check digits are correct. */
const VALID = ['032180000118359719', '002010077777777771', '646180157042875763'];

/** Well-known Luhn-valid test card numbers (Stripe's own published test cards). */
const VALID_CARDS = ['4242424242424242', '5555555555554444'];

const draft = (over: Record<string, string> = {}) => ({
  bank: 'BBVA',
  clabe: VALID[0]!,
  holder: 'TITULAR DE PRUEBA',
  ...over,
});

describe('isValidClabe', () => {
  it.each(VALID)('accepts %s', (clabe) => {
    expect(isValidClabe(clabe)).toBe(true);
  });

  it('accepts the spacing a bank statement uses', () => {
    expect(isValidClabe('032 180 00011835971 9')).toBe(true);
  });

  it('rejects a transposed digit, which a length check would let through', () => {
    // The whole reason for validating the check digit rather than the length.
    const swapped = '032180000118359791';
    expect(swapped).toHaveLength(18);
    expect(isValidClabe(swapped)).toBe(false);
  });

  it('rejects a wrong check digit', () => {
    expect(isValidClabe('032180000118359710')).toBe(false);
  });

  it.each(['', '12345', '0321800001183597199', 'abcdefghijklmnopqr'])(
    'rejects %p',
    (value) => {
      expect(isValidClabe(value)).toBe(false);
    },
  );
});

describe('isValidCardNumber', () => {
  it.each(VALID_CARDS)('accepts %s', (card) => {
    expect(isValidCardNumber(card)).toBe(true);
  });

  it('accepts the spacing printed on the card', () => {
    expect(isValidCardNumber('4242 4242 4242 4242')).toBe(true);
  });

  it('rejects a transposed digit', () => {
    const swapped = '4242424242424224';
    expect(swapped).toHaveLength(16);
    expect(isValidCardNumber(swapped)).toBe(false);
  });

  it.each(['', '123', '42424242424242424', 'abcdefghijklmnop'])('rejects %p', (value) => {
    expect(isValidCardNumber(value)).toBe(false);
  });
});

describe('reviewPaymentDetails', () => {
  it('accepts a complete set and normalises it', () => {
    const { details, issues } = reviewPaymentDetails({
      bank: '  BBVA  ',
      clabe: '032 180 00011835971 9',
      holder: '  Jose Manuel Ramirez  ',
      oxxo: '4189 1420 0012 3456',
      cardNumber: '4242 4242 4242 4242',
    });
    expect(issues).toEqual([]);
    expect(details).toEqual({
      bank: 'BBVA',
      clabe: '032180000118359719',
      holder: 'Jose Manuel Ramirez',
      oxxo: '4189142000123456',
      cardNumber: '4242424242424242',
    });
  });

  it('treats OXXO as optional', () => {
    const { details, issues } = reviewPaymentDetails(draft({ oxxo: '' }));
    expect(issues).toEqual([]);
    expect(details?.oxxo).toBeNull();
  });

  it('accepts an OXXO-only configuration — no CLABE, no bank account at all', () => {
    // The real bug: an owner who only takes OXXO deposits (no CLABE set up)
    // used to be rejected outright, which made the storefront report no
    // payment methods configured at all, OXXO included.
    const { details, issues } = reviewPaymentDetails({
      bank: 'SPIN by OXXO',
      clabe: '',
      holder: 'José Manuel Ramírez Sánchez',
      oxxo: '2242170260285635',
    });
    expect(issues).toEqual([]);
    expect(details).toMatchObject({ clabe: null, oxxo: '2242170260285635' });
  });

  it('rejects when neither CLABE nor OXXO is given — nothing to actually pay into', () => {
    const { details, issues } = reviewPaymentDetails(draft({ clabe: '', oxxo: '' }));
    expect(details).toBeNull();
    expect(issues.some((i) => i.field === 'clabe' && /al menos uno/i.test(i.message))).toBe(true);
  });

  it('treats the card number as optional', () => {
    const { details, issues } = reviewPaymentDetails(draft());
    expect(issues).toEqual([]);
    expect(details?.cardNumber).toBeNull();
  });

  it('rejects an implausible card number', () => {
    expect(reviewPaymentDetails(draft({ cardNumber: '123' })).issues[0]?.field).toBe(
      'cardNumber',
    );
  });

  it('rejects a card number with the wrong check digit', () => {
    expect(
      reviewPaymentDetails(draft({ cardNumber: '4242424242424241' })).issues[0]?.field,
    ).toBe('cardNumber');
  });

  it('never returns details alongside an issue', () => {
    // The caller writes `details` straight to the database. Handing back a
    // half-valid object next to a complaint is how bad data gets saved.
    const { details, issues } = reviewPaymentDetails(draft({ clabe: '123' }));
    expect(issues.length).toBeGreaterThan(0);
    expect(details).toBeNull();
  });

  it.each([
    ['bank', { bank: '' }],
    ['holder', { holder: '' }],
    ['clabe', { clabe: '' }],
  ])('requires %s', (field, over) => {
    const { issues } = reviewPaymentDetails(draft(over));
    expect(issues.some((i) => i.field === field)).toBe(true);
  });

  it('says how many digits are actually there', () => {
    const { issues } = reviewPaymentDetails(draft({ clabe: '0321800001' }));
    expect(issues[0]?.message).toContain('10');
  });

  it('distinguishes a typo from a wrong length', () => {
    const { issues } = reviewPaymentDetails(draft({ clabe: '032180000118359710' }));
    expect(issues[0]?.message).toMatch(/no es válida/i);
  });

  it('rejects an implausible OXXO number', () => {
    expect(reviewPaymentDetails(draft({ oxxo: '123' })).issues[0]?.field).toBe('oxxo');
  });
});

describe('paymentDetailsFromEnv', () => {
  afterEach(() => {
    // The function takes an env object, so nothing global is touched — this is
    // only a guard against a future signature change.
  });

  it('reads a complete set', () => {
    expect(
      paymentDetailsFromEnv({
        PAY_BANK: 'BBVA',
        PAY_CLABE: VALID[0]!,
        PAY_HOLDER: 'MONKEI',
        PAY_OXXO: '4189142000123456',
        PAY_CARD_NUMBER: '4242424242424242',
      }),
    ).toEqual({
      bank: 'BBVA',
      clabe: VALID[0],
      holder: 'MONKEI',
      oxxo: '4189142000123456',
      cardNumber: '4242424242424242',
    });
  });

  it('treats the card number as optional too', () => {
    expect(
      paymentDetailsFromEnv({ PAY_BANK: 'BBVA', PAY_CLABE: VALID[0]!, PAY_HOLDER: 'X' })?.cardNumber,
    ).toBeNull();
  });

  it('returns null when anything required is missing, rather than a blank', () => {
    // Returning a partial set is exactly how an empty account number reached a
    // customer standing at the payment step.
    expect(paymentDetailsFromEnv({})).toBeNull();
    expect(paymentDetailsFromEnv({ PAY_BANK: 'BBVA' })).toBeNull();
    expect(paymentDetailsFromEnv({ PAY_BANK: 'BBVA', PAY_CLABE: VALID[0]! })).toBeNull();
    // Neither CLABE nor OXXO: still nothing to actually pay into.
    expect(paymentDetailsFromEnv({ PAY_CLABE: '', PAY_BANK: 'BBVA', PAY_HOLDER: 'X' })).toBeNull();
  });

  it('accepts an OXXO-only bootstrap — this project\'s own real configuration', () => {
    // PAY_CLABE deliberately blank: the account only has a SPIN by OXXO
    // number, no bank CLABE. This used to make paymentDetailsFromEnv return
    // null entirely, which took every payment method off the storefront, not
    // just OXXO.
    expect(
      paymentDetailsFromEnv({
        PAY_BANK: 'SPIN by OXXO',
        PAY_CLABE: '',
        PAY_HOLDER: 'José Manuel Ramírez Sánchez',
        PAY_OXXO: '2242170260285635',
      }),
    ).toEqual({
      bank: 'SPIN by OXXO',
      clabe: null,
      holder: 'José Manuel Ramírez Sánchez',
      oxxo: '2242170260285635',
      cardNumber: null,
    });
  });
});

/**
 * `getPaymentDetails`/`savePaymentDetails` against real Postgres — the
 * settings-table round trip, and `isPaymentDetails`'s own CLABE-vs-OXXO
 * validation, which the pure-function tests above cannot reach since neither
 * is exported.
 */
const HERE = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS = join(HERE, '..', '..', 'migrations');
const BASE_URL = process.env.TEST_PG_URL ?? 'postgres://levelup@127.0.0.1:54330';
const TEST_DB = 'monkei_payment_settings_test';

const PG_AVAILABLE = await (async () => {
  const probe = postgres(`${BASE_URL}/postgres`, { max: 1, connect_timeout: 3 });
  try {
    await probe`SELECT 1`;
    return true;
  } catch {
    return false;
  } finally {
    await probe.end({ timeout: 2 }).catch(() => undefined);
  }
})();

let db: Database;
let client: ReturnType<typeof createDb>['client'];

beforeAll(async () => {
  if (!PG_AVAILABLE) return;
  const admin = postgres(`${BASE_URL}/postgres`, { max: 1 });
  try {
    await admin.unsafe(`DROP DATABASE IF EXISTS ${TEST_DB} WITH (FORCE)`);
    await admin.unsafe(`CREATE DATABASE ${TEST_DB}`);
  } finally {
    await admin.end({ timeout: 5 });
  }
  ({ db, client } = createDb(`${BASE_URL}/${TEST_DB}`, { max: 5 }));
  await migrate(db, { migrationsFolder: MIGRATIONS });
}, 180_000);

afterAll(async () => {
  await client?.end({ timeout: 5 });
}, 30_000);

describe.skipIf(!PG_AVAILABLE)('getPaymentDetails / savePaymentDetails', () => {
  it('saves and reads back an OXXO-only configuration, CLABE null throughout', async () => {
    await savePaymentDetails(db, {
      bank: 'SPIN by OXXO',
      clabe: null,
      holder: 'José Manuel Ramírez Sánchez',
      oxxo: '2242170260285635',
      cardNumber: null,
    });
    expect(await getPaymentDetails(db)).toEqual({
      bank: 'SPIN by OXXO',
      clabe: null,
      holder: 'José Manuel Ramírez Sánchez',
      oxxo: '2242170260285635',
      cardNumber: null,
    });
  });

  it('a later save overwrites the earlier one rather than merging', async () => {
    await savePaymentDetails(db, {
      bank: 'BBVA',
      clabe: VALID[0]!,
      holder: 'Titular',
      oxxo: null,
      cardNumber: null,
    });
    expect(await getPaymentDetails(db)).toMatchObject({ bank: 'BBVA', clabe: VALID[0] });
  });
});

describe('reviewFxRate', () => {
  it('accepts a normal rate', () => {
    expect(reviewFxRate('18.5')).toEqual({ rate: 18.5, issues: [] });
  });

  it('accepts a comma as the decimal separator', () => {
    expect(reviewFxRate('18,75').rate).toBe(18.75);
  });

  it.each(['', 'abc', '0', '-3'])('rejects %p', (value) => {
    expect(reviewFxRate(value).rate).toBeNull();
  });

  it('catches a missing decimal point', () => {
    // 185 instead of 18.5 would misreport every margin in the panel tenfold.
    expect(reviewFxRate('185').rate).toBeNull();
    expect(reviewFxRate('1.85').rate).toBeNull();
  });
});
