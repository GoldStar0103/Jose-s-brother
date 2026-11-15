import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import postgres from 'postgres';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { createDb, type Database } from '../index.js';
import { getVipGroupUrl, reviewVipGroupUrl, saveVipGroupUrl } from './vip-settings.js';

describe('reviewVipGroupUrl', () => {
  it('accepts the invite the client sent, tracking parameters and all', () => {
    // Copied straight out of WhatsApp, which appends how it was shared.
    expect(
      reviewVipGroupUrl('https://chat.whatsapp.com/G36Z7hKEOVSJ4PYoT39lXR?s=sh&p=i&mlu=4&ilr=4'),
    ).toBe('https://chat.whatsapp.com/G36Z7hKEOVSJ4PYoT39lXR');
  });

  it('accepts a bare invite and tolerates stray whitespace and slashes', () => {
    expect(reviewVipGroupUrl('  https://chat.whatsapp.com/G36Z7hKEOVSJ4PYoT39lXR/  ')).toBe(
      'https://chat.whatsapp.com/G36Z7hKEOVSJ4PYoT39lXR',
    );
  });

  it('treats nothing typed as "no link", not an error', () => {
    expect(reviewVipGroupUrl(undefined)).toBeNull();
    expect(reviewVipGroupUrl(null)).toBeNull();
    expect(reviewVipGroupUrl('')).toBeNull();
    expect(reviewVipGroupUrl('   ')).toBeNull();
  });

  it.each([
    ['javascript:alert(1)', 'a script URL'],
    ['http://chat.whatsapp.com/G36Z7hKEOVSJ4PYoT39lXR', 'plain http'],
    ['https://chat.whatsapp.com.evil.mx/G36Z7hKEOVSJ4PYoT39lXR', 'a lookalike host'],
    ['https://chat.whatsapp.com/', 'no invite code'],
    ['https://chat.whatsapp.com/short', 'an implausibly short code'],
    ['https://chat.whatsapp.com/bad code!', 'characters an invite code cannot contain'],
    ['not a url at all', 'junk'],
  ])('rejects %s (%s)', (input) => {
    // This value lands in an href on a page every paying customer opens.
    // A bad paste must fail closed, not become a live link.
    expect(reviewVipGroupUrl(input)).toBeNull();
  });

  it('does not care about host casing', () => {
    expect(reviewVipGroupUrl('https://CHAT.WhatsApp.COM/G36Z7hKEOVSJ4PYoT39lXR')).toBe(
      'https://chat.whatsapp.com/G36Z7hKEOVSJ4PYoT39lXR',
    );
  });
});

/**
 * `getVipGroupUrl`/`saveVipGroupUrl` against real Postgres — specifically the
 * "settings row wins over env, including an explicit clear" rule, which the
 * pure-function tests above cannot reach since neither touches the database.
 */
const HERE = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS = join(HERE, '..', '..', 'migrations');
const BASE_URL = process.env.TEST_PG_URL ?? 'postgres://levelup@127.0.0.1:54330';
const TEST_DB = 'monkei_vip_settings_test';

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

const ENV_URL = 'https://chat.whatsapp.com/EnvFallbackCode01';
const SAVED_URL = 'https://chat.whatsapp.com/SavedRowCode0001';

describe.skipIf(!PG_AVAILABLE)('getVipGroupUrl / saveVipGroupUrl', () => {
  it('falls back to the env var when no settings row exists yet', async () => {
    const prior = process.env.WHATSAPP_VIP_GROUP_URL;
    process.env.WHATSAPP_VIP_GROUP_URL = ENV_URL;
    try {
      expect(await getVipGroupUrl(db)).toBe(ENV_URL);
    } finally {
      process.env.WHATSAPP_VIP_GROUP_URL = prior;
    }
  });

  it('a saved row wins over the env var once it exists', async () => {
    const prior = process.env.WHATSAPP_VIP_GROUP_URL;
    process.env.WHATSAPP_VIP_GROUP_URL = ENV_URL;
    try {
      const result = await saveVipGroupUrl(db, SAVED_URL);
      expect(result).toEqual({ ok: true, url: SAVED_URL });
      expect(await getVipGroupUrl(db)).toBe(SAVED_URL);
    } finally {
      process.env.WHATSAPP_VIP_GROUP_URL = prior;
    }
  });

  it('refuses to save a bad link, leaving the previous one in place', async () => {
    await saveVipGroupUrl(db, SAVED_URL);
    const result = await saveVipGroupUrl(db, 'not-a-whatsapp-link');
    expect(result).toEqual({ ok: false, url: null });
    expect(await getVipGroupUrl(db)).toBe(SAVED_URL);
  });

  it('an explicit clear hides the block even when the env var is still set', async () => {
    const prior = process.env.WHATSAPP_VIP_GROUP_URL;
    process.env.WHATSAPP_VIP_GROUP_URL = ENV_URL;
    try {
      await saveVipGroupUrl(db, SAVED_URL);
      const result = await saveVipGroupUrl(db, '');
      expect(result).toEqual({ ok: true, url: null });
      // The owner asked for no VIP block — the env var must not quietly win.
      expect(await getVipGroupUrl(db)).toBeNull();
    } finally {
      process.env.WHATSAPP_VIP_GROUP_URL = prior;
    }
  });
});
