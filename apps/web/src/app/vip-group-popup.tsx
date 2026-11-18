'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * One-time nudge to join the VIP WhatsApp group, shown the moment a customer
 * lands on their completed order. The static `.vip` card below it on the page
 * stays as a passive fallback for anyone who dismisses this; the popup is the
 * version that actually gets noticed, which is what the client's other
 * storefront found converts into sign-ups far more often than a card alone.
 *
 * Shown once per order, not once per visit — a customer bookmarking their
 * order link and checking it again later should not see this again. The
 * "shown" flag is only written once the customer actually dismisses it or
 * taps through, not the moment it mounts — see the dismiss()/join handling
 * below.
 *
 * Rendered through a portal straight into `document.body`: this component
 * lives inside the page content, which sits inside `.wrap`
 * (`levelup-home.css`), and `.wrap` has `position:relative;z-index:1` —
 * enough to start its own CSS stacking context. Without the portal, this
 * popup's own `z-index:200` only competes within that stacking context, so
 * anything else holding `z-index:200` at the true top level (e.g. the
 * site-wide welcome popup, if not yet dismissed for the day) silently paints
 * over this one completely, even though both declare the same z-index.
 */
export function VipGroupPopup({ orderNumber, groupUrl }: { orderNumber: string; groupUrl: string }) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const key = `mk:vip-popup:${orderNumber}`;
    try {
      if (window.localStorage.getItem(key)) return;
    } catch {
      /* Private browsing or blocked storage — fall through and show it once. */
    }

    const timer = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(timer);
  }, [orderNumber]);

  if (!visible || !mounted) return null;

  const markShown = () => {
    try {
      window.localStorage.setItem(`mk:vip-popup:${orderNumber}`, '1');
    } catch {
      /* ignore */
    }
  };
  const dismiss = () => {
    markShown();
    setVisible(false);
  };

  return createPortal(
    <div className="vipp-overlay" role="dialog" aria-modal="true" aria-labelledby="vippTitle">
      <div className="vipp-sheet">
        <button type="button" className="vipp-close" aria-label="Cerrar" onClick={dismiss}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <div className="vipp-icon" aria-hidden="true">
          🎁
        </div>
        <b id="vippTitle" className="vipp-title">
          ¡Ya eres parte VIP!
        </b>
        <p className="vipp-text">
          Entra al grupo de WhatsApp para promos exclusivas, sorteos y los combos nuevos antes que
          nadie. Solo para clientes que ya compraron.
        </p>

        <a href={groupUrl} target="_blank" rel="noreferrer" className="btn primary wide" onClick={dismiss}>
          Entrar al grupo VIP
        </a>

        <button type="button" className="vipp-skip" onClick={dismiss}>
          Ahora no
        </button>
      </div>
    </div>,
    document.body,
  );
}
