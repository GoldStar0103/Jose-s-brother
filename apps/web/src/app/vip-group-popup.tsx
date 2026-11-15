'use client';

import { useEffect, useState } from 'react';

/**
 * One-time nudge to join the VIP WhatsApp group, shown the moment a customer
 * lands on their completed order. The static `.vip` card below it on the page
 * stays as a passive fallback for anyone who dismisses this; the popup is the
 * version that actually gets noticed, which is what the client's other
 * storefront found converts into sign-ups far more often than a card alone.
 *
 * Shown once per order, not once per visit — a customer bookmarking their
 * order link and checking it again later should not see this again.
 */
export function VipGroupPopup({ orderNumber, groupUrl }: { orderNumber: string; groupUrl: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const key = `mk:vip-popup:${orderNumber}`;
    try {
      if (window.localStorage.getItem(key)) return;
    } catch {
      /* Private browsing or blocked storage — fall through and show it once. */
    }

    const timer = setTimeout(() => {
      setVisible(true);
      try {
        window.localStorage.setItem(key, '1');
      } catch {
        /* ignore */
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [orderNumber]);

  if (!visible) return null;

  const dismiss = () => setVisible(false);

  return (
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
    </div>
  );
}
