'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'monkei_whatsapp_popup_hide_until';

/** "Hoy" means the Mexico City calendar day, not the visitor's own clock. */
function todayMexicoCity(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City' }).format(new Date());
}

/**
 * Neon welcome / WhatsApp channel modal — pixel-matched to the Monkei
 * neon-green reference. Animated project monkey stays in the left slot.
 */
export function WhatsappChannelPopup({
  channelUrl,
  brandName,
}: {
  channelUrl: string;
  brandName: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let hideUntil: string | null = null;
    try {
      hideUntil = localStorage.getItem(STORAGE_KEY);
    } catch {
      /* Private browsing or blocked storage — fall through and show it. */
    }
    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    if (params?.get('wa') === '0') return;
    const force = params?.get('wa') === '1';
    if (!force && hideUntil === todayMexicoCity()) return;

    const timer = setTimeout(() => setVisible(true), force ? 0 : 1200);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  const dismiss = () => setVisible(false);
  const dismissForToday = () => {
    try {
      localStorage.setItem(STORAGE_KEY, todayMexicoCity());
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  const brandDisplay = brandName.trim().toUpperCase();

  return (
    <div className="wa-overlay" role="dialog" aria-modal="true" aria-labelledby="waTitle">
      <div className="wa-sheet">
        <div className="wa-sheet-bg" aria-hidden="true">
          <span className="wa-hex-glow wa-hex-glow--tl" />
          <span className="wa-hex-glow wa-hex-glow--br" />
          <svg className="wa-hex-grid" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="waHexPat" width="56" height="48.5" patternUnits="userSpaceOnUse">
                <g fill="none" stroke="rgba(0,253,145,.22)" strokeWidth=".85">
                  <path d="M14 1 27 8.5v15L14 31 1 23.5v-15Z" />
                  <path d="M42 1 55 8.5v15L42 31 29 23.5v-15Z" />
                  <path d="M28 25.25 41 32.75v15L28 55.25 15 47.75v-15Z" />
                </g>
              </pattern>
              <radialGradient id="waHexFade" cx="50%" cy="42%" r="70%">
                <stop offset="0%" stopColor="#fff" stopOpacity="0" />
                <stop offset="42%" stopColor="#fff" stopOpacity=".3" />
                <stop offset="100%" stopColor="#fff" stopOpacity="1" />
              </radialGradient>
              <mask id="waHexMask">
                <rect width="100%" height="100%" fill="url(#waHexFade)" />
              </mask>
            </defs>
            <rect className="wa-hex-base" width="100%" height="100%" fill="url(#waHexPat)" mask="url(#waHexMask)" />
            <rect className="wa-hex-lit" width="100%" height="100%" fill="url(#waHexPat)" />
          </svg>
        </div>

        <button type="button" className="wa-close" aria-label="Cerrar" onClick={dismiss}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <div className="wa-hero">
          <div className="wa-char" aria-hidden="true">
            <span className="wa-char-glow" />
            <span className="wa-char-ring" />
            <span className="wa-fighter">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/lu/nuevo/popup-monkei.gif" alt="" decoding="async" />
            </span>
          </div>

          <div className="wa-intro">
            <p className="wa-kicker">¡Bienvenido a</p>
            <b id="waTitle" className="wa-brand">
              {brandDisplay}!
              <svg className="wa-brand-swoosh" viewBox="0 0 120 12" preserveAspectRatio="none" aria-hidden="true">
                <path
                  d="M2 8 C28 2, 55 10, 88 4 C100 2, 112 5, 118 7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                />
              </svg>
            </b>
            <p className="wa-sub">Tus diamantes de Free Fire al instante, seguros y al mejor precio.</p>
          </div>
        </div>

        <div className="wa-dual">
          <a href="/cuenta" className="wa-btn" onClick={dismiss}>
            <span className="wa-btn-ic" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                <circle cx="12" cy="8" r="3.4" />
                <path d="M5.2 19c1.5-3.1 3.9-4.7 6.8-4.7s5.3 1.6 6.8 4.7" />
              </svg>
            </span>
            <span>Crear cuenta</span>
          </a>
          <a href="/#oferta" className="wa-btn" onClick={dismiss}>
            <span className="wa-btn-ic" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                <path d="M3.8 9.2 12 4.5l8.2 4.7v6.6L12 20.5 3.8 15.8V9.2z" />
                <path d="M12 12.2v8M3.8 9.2l8.2 3.6 8.2-3.6" />
              </svg>
            </span>
            <span>Ver paquetes</span>
          </a>
        </div>

        <a href={channelUrl} target="_blank" rel="noreferrer" className="wa-follow" onClick={dismiss}>
          <span className="wa-follow-ic" aria-hidden="true">
            {/* White WhatsApp glyph on neon green disc — matches reference */}
            <svg viewBox="0 0 24 24" fill="#ffffff">
              <path d="M12.04 2a9.94 9.94 0 0 0-8.56 14.95L2 22l5.2-1.36A9.96 9.96 0 1 0 12.04 2zm5.52 14.24c-.23.65-1.36 1.2-1.9 1.27-.5.07-1.13.1-1.83-.11-.42-.13-.97-.31-1.67-.61-2.94-1.27-4.84-4.22-4.98-4.42-.14-.2-1.16-1.54-1.16-2.94s.73-2.08.99-2.37c.26-.29.57-.36.76-.36h.55c.18 0 .41-.07.64.49.23.58.79 2 .86 2.15.07.14.12.32.02.51-.1.2-.15.32-.3.49-.14.17-.3.38-.43.51-.14.14-.29.29-.12.56.16.28.73 1.2 1.56 1.95 1.08.96 1.98 1.26 2.26 1.4.28.14.44.12.6-.07.16-.2.7-.81.88-1.09.19-.28.37-.23.62-.14.26.1 1.63.77 1.91.91.28.14.47.21.54.32.07.12.07.67-.16 1.32z" />
            </svg>
          </span>
          <span className="wa-follow-copy">
            <b>Únete a nuestro canal WhatsApp</b>
            <small>Promos, avisos y novedades primero</small>
          </span>
          <span className="wa-follow-cta">
            <span>Seguir</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden="true">
              <path d="M5 12h12.5M13 6.5 18.5 12 13 17.5" />
            </svg>
          </span>
        </a>

        <button type="button" className="wa-skip" onClick={dismissForToday}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
            <path d="M12 3.2 18.5 6v5.1c0 4.3-2.9 7.4-6.5 8.6C8.4 18.5 5.5 15.4 5.5 11.1V6L12 3.2z" />
            <path d="m9.3 11.8 1.9 1.9 3.6-3.7" />
          </svg>
          No mostrar más por hoy
        </button>
      </div>
    </div>
  );
}
