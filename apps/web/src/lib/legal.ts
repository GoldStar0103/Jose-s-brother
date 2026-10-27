/**
 * Business identity for the legal pages.
 *
 * Read from configuration rather than written into the copy: a privacy notice
 * naming the wrong entity, or an invented RFC, is worse than no notice at all.
 * Anything unset renders as a visible placeholder so a missing value is
 * obvious on the page instead of quietly shipping as fact.
 */

import { FALLBACK_DOMAIN, siteName } from '@monkei/shared';

export interface LegalIdentity {
  businessName: string;
  legalName: string | null;
  rfc: string | null;
  address: string | null;
  contactEmail: string | null;
  whatsapp: string | null;
  domain: string;
}

const orNull = (value: string | undefined): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

export function legalIdentity(): LegalIdentity {
  return {
    businessName: siteName(),
    legalName: orNull(process.env.LEGAL_ENTITY_NAME),
    rfc: orNull(process.env.LEGAL_RFC),
    address: orNull(process.env.LEGAL_ADDRESS),
    contactEmail: orNull(process.env.LEGAL_CONTACT_EMAIL),
    whatsapp: orNull(process.env.WHATSAPP_SUPPORT_NUMBER),
    // `||`, not `??`: a blank `PUBLIC_DOMAIN=` line in .env reads back as ''
    // (set, not unset), which `??` would not catch — same bug `siteOrigin`
    // guards against in site.ts.
    domain: process.env.PUBLIC_DOMAIN?.trim() || FALLBACK_DOMAIN,
  };
}

/** Renders a missing value visibly, so nobody ships a placeholder unnoticed. */
export const pending = (value: string | null, label: string): string =>
  value ?? `[PENDIENTE: ${label}]`;
