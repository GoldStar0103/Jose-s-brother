/**
 * Generic placeholder used wherever a brand/site name is needed but
 * `LEGAL_BUSINESS_NAME` is not configured — local dev, a fresh deploy that
 * hasn't set it yet, an unconfigured preview.
 *
 * Never a real one — same reasoning as FALLBACK_DOMAIN in domain.ts: this
 * codebase gets cloned into a new deployment for a new store, and a
 * hardcoded real name here would leak whichever store it was last cloned
 * from into the new one's page titles, Open Graph tags and emails.
 */
export const FALLBACK_SITE_NAME = 'Mi Tienda';

/**
 * The store's own display name, for page titles, Open Graph tags, the
 * header wordmark and outgoing email "from" names.
 *
 * Reuses `LEGAL_BUSINESS_NAME` rather than a second env var — it is already
 * the one place the business's commercial name is configured (see
 * legal.ts), and every storefront surface showing a brand name should show
 * the same one the legal pages do.
 */
export function siteName(env: NodeJS.ProcessEnv = process.env): string {
  return env.LEGAL_BUSINESS_NAME?.trim() || FALLBACK_SITE_NAME;
}
