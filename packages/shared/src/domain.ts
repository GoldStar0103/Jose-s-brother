/**
 * Generic placeholder used wherever `PUBLIC_DOMAIN` is not configured —
 * local dev, a fresh deploy that hasn't set it yet, an unconfigured preview.
 *
 * Never a real one: this codebase gets cloned into a new deployment for a
 * new store, and a hardcoded real domain here would leak whichever store it
 * was last cloned from into the new one's canonical tags, Pixel events and
 * SMTP greeting.
 */
export const FALLBACK_DOMAIN = 'example.com';
