/**
 * Admin-triggered, per-order Level Pass backfill — the deliberate, reviewed
 * counterpart to `creditOrdersForLinkedPlayerId`'s automatic reach.
 *
 * That automatic path only ever catches up the CURRENTLY active season, on
 * purpose: crediting a closed season's order into today's season would
 * attribute a sale to the wrong leaderboard, and a closed season's own
 * standings are already final. A guest order from an already-closed season
 * that only gets a matching account afterward is a real, harder case — it
 * needs a human to confirm which season it actually belongs to before
 * anything is written, not an automatic sweep. This module is that path:
 * preview first, write only on an explicit admin confirmation, audited.
 *
 * Note this does not reopen a closed season's public podium: `hall_of_fame_entries`
 * is a frozen snapshot taken when the season closed (see season-admin-queries.ts),
 * and this never touches it. Backfilling updates the player's own lifetime
 * stats and that season's `season_player_stats` row, not the already-published
 * standings — worth saying out loud to whoever runs this.
 */

import { and, eq, gt, lte } from 'drizzle-orm';
import { creditOrderForSeason, LEVEL_PASS_REWARD_COMBO_KEY, type LevelPassDecision } from '@monkei/engine';
import type { Database } from '../index.js';
import { auditLog, orders, seasons } from '../schema.js';
import { DrizzleLevelPassStore } from './level-pass-store.js';

export type LevelPassBackfillBlockReason =
  | 'not_completed'
  | 'reward_order'
  | 'already_credited'
  | 'no_season_covers_order'
  | 'still_no_linked_account';

export interface LevelPassBackfillPreview {
  orderId: string;
  orderNumber: string;
  playerId: string;
  completedAt: Date | null;
  eligible: boolean;
  /** Present whenever a season could be matched to `completedAt`, eligible or not. */
  season?: { seasonNumber: number; status: 'active' | 'closed' };
  /** Undefined exactly when `eligible` is true. */
  blockedReason?: LevelPassBackfillBlockReason;
}

async function findSeasonCovering(
  db: Database,
  completedAt: Date,
): Promise<{ id: string; seasonNumber: number; status: 'active' | 'closed' } | null> {
  const [row] = await db
    .select({ id: seasons.id, seasonNumber: seasons.seasonNumber, status: seasons.status })
    .from(seasons)
    .where(and(lte(seasons.startsAt, completedAt), gt(seasons.endsAt, completedAt)))
    .limit(1);
  return row ?? null;
}

/** What crediting this order would actually do, before anyone commits to it. */
export async function previewLevelPassBackfill(
  db: Database,
  orderId: string,
): Promise<LevelPassBackfillPreview | null> {
  const [order] = await db
    .select({
      orderNumber: orders.orderNumber,
      playerId: orders.playerId,
      playerProfileId: orders.playerProfileId,
      status: orders.status,
      comboKey: orders.comboKey,
      completedAt: orders.completedAt,
    })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);
  if (!order) return null;

  const base = {
    orderId,
    orderNumber: order.orderNumber,
    playerId: order.playerId,
    completedAt: order.completedAt,
  };

  if (order.status !== 'completed') return { ...base, eligible: false, blockedReason: 'not_completed' };
  if (order.comboKey === LEVEL_PASS_REWARD_COMBO_KEY) {
    return { ...base, eligible: false, blockedReason: 'reward_order' };
  }

  const store = new DrizzleLevelPassStore(db);
  if (await store.hasProcessedOrder(orderId)) {
    return { ...base, eligible: false, blockedReason: 'already_credited' };
  }

  // `completedAt` is set the instant `status` becomes 'completed' — never
  // null past the two checks above, but the schema still allows it.
  const season = order.completedAt ? await findSeasonCovering(db, order.completedAt) : null;
  if (!season) return { ...base, eligible: false, blockedReason: 'no_season_covers_order' };

  const seasonInfo = { seasonNumber: season.seasonNumber, status: season.status };
  const state = await store.getPlayerState(season.id, order.playerId, order.playerProfileId);
  if (!state) {
    return { ...base, eligible: false, blockedReason: 'still_no_linked_account', season: seasonInfo };
  }

  return { ...base, eligible: true, season: seasonInfo };
}

export type LevelPassBackfillResult =
  | { ok: true; seasonNumber: number; decision: LevelPassDecision }
  | { ok: false; reason: LevelPassBackfillBlockReason | 'not_found' };

/**
 * Re-checks everything fresh rather than trusting a preview the admin may
 * have been looking at for a while, and reuses `creditOrderForSeason` — the
 * exact same idempotency guard and checkpoint math a timely order goes
 * through — so double-confirming this can never double-credit it.
 */
export async function backfillLevelPassForOrder(
  db: Database,
  input: { orderId: string; adminUserId: string; reason: string },
): Promise<LevelPassBackfillResult> {
  const preview = await previewLevelPassBackfill(db, input.orderId);
  if (!preview) return { ok: false, reason: 'not_found' };
  if (!preview.eligible || !preview.completedAt) {
    return { ok: false, reason: preview.blockedReason ?? 'no_season_covers_order' };
  }

  const season = await findSeasonCovering(db, preview.completedAt);
  if (!season) return { ok: false, reason: 'no_season_covers_order' };

  const store = new DrizzleLevelPassStore(db);
  const financials = await store.getOrderFinancials(input.orderId);
  if (!financials) return { ok: false, reason: 'not_found' };

  const outcome = await creditOrderForSeason({ store }, financials, season.id);
  if (outcome.status !== 'applied') {
    return {
      ok: false,
      reason: outcome.status === 'already_processed' ? 'already_credited' : 'still_no_linked_account',
    };
  }

  await db.insert(auditLog).values({
    adminUserId: input.adminUserId,
    action: 'order.level_pass_backfill',
    entityType: 'order',
    entityId: input.orderId,
    detail: {
      seasonId: season.id,
      seasonNumber: season.seasonNumber,
      reason: input.reason,
      decision: outcome.decision,
    },
  });

  return { ok: true, seasonNumber: season.seasonNumber, decision: outcome.decision };
}
