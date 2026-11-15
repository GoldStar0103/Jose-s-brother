/**
 * The VIP WhatsApp group invite shown on a completed order.
 *
 * Previously an env var (`WHATSAPP_VIP_GROUP_URL`), which was wrong for the
 * same reason `payment-settings.ts` gives for bank details: the owner rotates
 * this link on their own — a WhatsApp invite can be revoked from inside the
 * group at any time — and until now that meant asking a developer to edit an
 * env var and redeploy. Same settings-row pattern: the env var is honoured as
 * a bootstrap, a saved settings row (including one the owner deliberately
 * cleared) always wins once it exists.
 */

import { eq } from 'drizzle-orm';
import type { Database } from '../index.js';
import { settings } from '../schema.js';

export const VIP_GROUP_URL_KEY = 'vip_group_url';

/**
 * WhatsApp invite codes are 22 URL-safe characters today, but that is an
 * undocumented implementation detail, so the length is not pinned — only the
 * shape. Query parameters are dropped: copying an invite from the app tacks
 * on share-source tracking (`?s=sh&p=i&…`) that says how it was copied, not
 * anything a customer needs.
 */
const INVITE_HOST = 'chat.whatsapp.com';

/**
 * Validates a candidate VIP group link, whether it came from the admin form
 * or the env-var bootstrap. An href is an injection point: anything that is
 * not an https link to the real WhatsApp invite host is dropped rather than
 * stored or rendered, so a typo or a bad paste can never become a
 * `javascript:` URL on a page every paying customer lands on.
 */
export function reviewVipGroupUrl(raw: string | undefined | null): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'https:' || parsed.hostname.toLowerCase() !== INVITE_HOST) return null;

  const code = parsed.pathname.replace(/^\/+/, '').replace(/\/+$/, '');
  if (!/^[A-Za-z0-9_-]{6,64}$/.test(code)) return null;

  return `https://${INVITE_HOST}/${code}`;
}

interface VipSetting {
  url: unknown;
}

function isVipSetting(value: unknown): value is VipSetting {
  return typeof value === 'object' && value !== null && 'url' in value;
}

/**
 * Null means: show no VIP block at all. That covers two different real
 * states the same way — nobody has ever configured one, or the owner
 * explicitly cleared it — neither is a misconfiguration to paper over with a
 * dead button, same reasoning as `supportUrl`'s own null case.
 */
export async function getVipGroupUrl(db: Database): Promise<string | null> {
  const [row] = await db
    .select({ value: settings.value })
    .from(settings)
    .where(eq(settings.key, VIP_GROUP_URL_KEY))
    .limit(1);

  if (isVipSetting(row?.value)) {
    // Re-validated, not trusted blindly: a row written before a stricter rule
    // existed should not outlive that rule.
    return reviewVipGroupUrl(typeof row.value.url === 'string' ? row.value.url : null);
  }

  // No settings row yet at all — the pre-settings env-var bootstrap.
  return reviewVipGroupUrl(process.env.WHATSAPP_VIP_GROUP_URL);
}

export interface SaveVipGroupUrlResult {
  ok: boolean;
  /** The value actually saved — null for "cleared", same as `getVipGroupUrl`'s off state. */
  url: string | null;
}

/** An empty string is a deliberate clear, not an error — see the module comment. */
export async function saveVipGroupUrl(db: Database, raw: string): Promise<SaveVipGroupUrlResult> {
  const trimmed = raw.trim();
  if (!trimmed) {
    await db
      .insert(settings)
      .values({ key: VIP_GROUP_URL_KEY, value: { url: null } })
      .onConflictDoUpdate({ target: settings.key, set: { value: { url: null } } });
    return { ok: true, url: null };
  }

  const validated = reviewVipGroupUrl(trimmed);
  if (!validated) return { ok: false, url: null };

  await db
    .insert(settings)
    .values({ key: VIP_GROUP_URL_KEY, value: { url: validated } })
    .onConflictDoUpdate({ target: settings.key, set: { value: { url: validated } } });
  return { ok: true, url: validated };
}
