/**
 * `previewLevelPassBackfill`/`backfillLevelPassForOrder` against real
 * Postgres — the manual, per-order counterpart to the automatic
 * `creditOrdersForLinkedPlayerId` catch-up tested in level-pass-store.test.ts.
 * The one thing that module cannot reach is the thing this one exists for:
 * crediting into a season that is no longer the active one.
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import postgres from 'postgres';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { eq, sql as raw } from 'drizzle-orm';
import { createOrder } from '@monkei/engine';
import { ProviderSimulator, type ProviderProduct, type UsdTenK } from '@monkei/provider';
import { createDb, type Database } from '../index.js';
import {
  adminUsers,
  auditLog,
  campaigns,
  comboItems,
  combos,
  baseProducts,
  orderItems,
  orders,
  payments,
  playerProfiles,
  seasonPlayerStats,
  seasons,
} from '../schema.js';
import { DrizzleCatalogSyncStore } from './catalog-sync-store.js';
import { DrizzleOrderingStore } from './ordering-store.js';
import { saveFxRate } from './payment-settings.js';
import { syncCatalog } from '@monkei/engine';
import { backfillLevelPassForOrder, previewLevelPassBackfill } from './level-pass-backfill.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS = join(HERE, '..', '..', 'migrations');
const BASE_URL = process.env.TEST_PG_URL ?? 'postgres://levelup@127.0.0.1:54330';
const TEST_DB = 'monkei_level_pass_backfill_test';

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

const usd = (n: number) => Math.round(n * 10_000) as UsdTenK;

async function seedOneCombo() {
  const provider = new ProviderSimulator();
  provider.programCatalog([
    {
      providerProductId: 'd100',
      endpointKind: 'pins_recharge' as const,
      name: 'Free Fire 100 Diamonds',
      sku: 'FF100',
      diamondsBase: 100,
      costUsd: usd(1),
      requiresServerId: false,
      canValidate: true,
      raw: {},
    } satisfies ProviderProduct,
  ]);
  await syncCatalog({ store: new DrizzleCatalogSyncStore(db), provider });

  const [product] = await db.select().from(baseProducts);
  const [campaign] = await db.insert(campaigns).values({ key: 'test', name: 'TEST' }).returning();
  const [combo] = await db
    .insert(combos)
    .values({
      campaignId: campaign!.id,
      key: 'test_combo',
      name: 'Test Combo',
      priceMxnCents: 10_000,
      advertisedDiamonds: 100,
      active: true,
    })
    .returning();
  await db.insert(comboItems).values({ comboId: combo!.id, baseProductId: product!.id, sequence: 0 });
}

async function placeOrder(playerId: string) {
  const result = await createOrder(
    { store: new DrizzleOrderingStore(db) },
    { comboKey: 'test_combo', playerId, paymentMethod: 'transfer_manual', source: 'admin' },
  );
  if (!result.ok) throw new Error(`seed order failed: ${result.failure.code}`);
  return result.order;
}

async function completeOrder(orderId: string, completedAt: Date) {
  await db
    .update(orders)
    .set({ status: 'completed', completedAt, createdAt: completedAt })
    .where(eq(orders.id, orderId));
  await db.update(orderItems).set({ costUsd: '1.0000', status: 'succeeded' }).where(eq(orderItems.orderId, orderId));
  await db.insert(payments).values({
    orderId,
    method: 'transfer_manual',
    status: 'paid',
    gateway: null,
    amountExpectedCents: 10_000,
    amountReceivedCents: 10_000,
    paidAt: completedAt,
  });
}

async function seedAdmin() {
  const [admin] = await db
    .insert(adminUsers)
    .values({ email: `admin-${Math.random()}@test.monkei`, passwordHash: 'x' })
    .returning();
  return admin!;
}

async function seedProfile(playerId: string) {
  const [profile] = await db
    .insert(playerProfiles)
    .values({ playerId, email: `${playerId}@test.levelup` })
    .returning();
  return profile!;
}

async function seedSeason(opts: {
  seasonNumber: number;
  startsAt: Date;
  endsAt: Date;
  status: 'active' | 'closed';
}) {
  const [season] = await db
    .insert(seasons)
    .values({
      seasonNumber: opts.seasonNumber,
      startsAt: opts.startsAt,
      endsAt: opts.endsAt,
      status: opts.status,
      closedAt: opts.status === 'closed' ? opts.endsAt : null,
    })
    .returning();
  return season!;
}

beforeEach(async () => {
  if (!PG_AVAILABLE) return;
  await db.execute(
    raw`TRUNCATE orders, order_items, payments, combo_items, combos, campaigns, base_products,
        player_profiles, seasons, season_player_stats, level_pass_lp_transactions,
        level_pass_checkpoint_events, vault_entitlements, audit_log, settings, admin_users
        RESTART IDENTITY CASCADE`,
  );
  await seedOneCombo();
  await saveFxRate(db, 20);
});

describe.skipIf(!PG_AVAILABLE)('previewLevelPassBackfill', () => {
  it('returns null for an order id that does not exist', async () => {
    expect(await previewLevelPassBackfill(db, '00000000-0000-0000-0000-000000000000')).toBeNull();
  });

  it('blocks an order that is not completed', async () => {
    const order = await placeOrder('700001');
    const preview = await previewLevelPassBackfill(db, order.id);
    expect(preview).toMatchObject({ eligible: false, blockedReason: 'not_completed' });
  });

  it('blocks when the Free Fire ID still has no linked account', async () => {
    const closed = await seedSeason({
      seasonNumber: 1,
      startsAt: new Date('2026-01-01'),
      endsAt: new Date('2026-02-01'),
      status: 'closed',
    });
    const order = await placeOrder('700002');
    await completeOrder(order.id, new Date('2026-01-15'));

    const preview = await previewLevelPassBackfill(db, order.id);
    expect(preview).toMatchObject({
      eligible: false,
      blockedReason: 'still_no_linked_account',
      season: { seasonNumber: closed.seasonNumber, status: 'closed' },
    });
  });

  it('reports eligible, with the ORDER\'s own season — not whatever is active today', async () => {
    const closed = await seedSeason({
      seasonNumber: 1,
      startsAt: new Date('2026-01-01'),
      endsAt: new Date('2026-02-01'),
      status: 'closed',
    });
    await seedSeason({
      seasonNumber: 2,
      startsAt: new Date('2026-02-01'),
      endsAt: new Date('2026-03-01'),
      status: 'active',
    });
    const order = await placeOrder('700003');
    await completeOrder(order.id, new Date('2026-01-15'));
    await seedProfile('700003'); // linked after the fact

    const preview = await previewLevelPassBackfill(db, order.id);
    expect(preview).toMatchObject({
      eligible: true,
      season: { seasonNumber: closed.seasonNumber, status: 'closed' },
    });
  });
});

describe.skipIf(!PG_AVAILABLE)('backfillLevelPassForOrder', () => {
  it("credits a closed-season order into THAT season's stats, leaving the active season untouched", async () => {
    const closed = await seedSeason({
      seasonNumber: 1,
      startsAt: new Date('2026-01-01'),
      endsAt: new Date('2026-02-01'),
      status: 'closed',
    });
    const active = await seedSeason({
      seasonNumber: 2,
      startsAt: new Date('2026-02-01'),
      endsAt: new Date('2026-03-01'),
      status: 'active',
    });
    const order = await placeOrder('700004');
    await completeOrder(order.id, new Date('2026-01-15'));
    await seedProfile('700004');
    const admin = await seedAdmin();

    const result = await backfillLevelPassForOrder(db, {
      orderId: order.id,
      adminUserId: admin.id,
      reason: 'Cliente vinculó su ID después de comprar como invitado',
    });

    expect(result).toMatchObject({ ok: true, seasonNumber: closed.seasonNumber });

    const [closedStats] = await db
      .select({ lp: seasonPlayerStats.lp, diamonds: seasonPlayerStats.seasonalDiamonds })
      .from(seasonPlayerStats)
      .where(eq(seasonPlayerStats.seasonId, closed.id));
    expect(closedStats?.lp).toBeGreaterThan(0);

    const activeStats = await db
      .select()
      .from(seasonPlayerStats)
      .where(eq(seasonPlayerStats.seasonId, active.id));
    expect(activeStats).toHaveLength(0);

    const [audit] = await db
      .select()
      .from(auditLog)
      .where(eq(auditLog.action, 'order.level_pass_backfill'));
    expect(audit?.entityId).toBe(order.id);
  });

  it('refuses to double-credit an order that was already backfilled', async () => {
    await seedSeason({
      seasonNumber: 1,
      startsAt: new Date('2026-01-01'),
      endsAt: new Date('2026-02-01'),
      status: 'closed',
    });
    const order = await placeOrder('700005');
    await completeOrder(order.id, new Date('2026-01-15'));
    await seedProfile('700005');
    const admin = await seedAdmin();

    const input = {
      orderId: order.id,
      adminUserId: admin.id,
      reason: 'Backfill de prueba',
    };
    const first = await backfillLevelPassForOrder(db, input);
    expect(first.ok).toBe(true);

    const second = await backfillLevelPassForOrder(db, input);
    expect(second).toEqual({ ok: false, reason: 'already_credited' });

    const stats = await db.select().from(seasonPlayerStats);
    expect(stats).toHaveLength(1); // not doubled
  });

  it('refuses an order whose Free Fire ID is still unlinked', async () => {
    await seedSeason({
      seasonNumber: 1,
      startsAt: new Date('2026-01-01'),
      endsAt: new Date('2026-02-01'),
      status: 'closed',
    });
    const order = await placeOrder('700006');
    await completeOrder(order.id, new Date('2026-01-15'));
    const admin = await seedAdmin();

    const result = await backfillLevelPassForOrder(db, {
      orderId: order.id,
      adminUserId: admin.id,
      reason: 'Intento sin cuenta vinculada',
    });
    expect(result).toEqual({ ok: false, reason: 'still_no_linked_account' });
  });
});
