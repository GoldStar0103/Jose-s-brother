'use client';

import { useState } from 'react';

export function SupportFab({ supportHref }: { supportHref: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fab">
      <button
        type="button"
        className="fab-btn"
        aria-expanded={open}
        aria-controls="fabPanel"
        aria-label="Abrir soporte en línea"
        onClick={() => setOpen((v) => !v)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/lu/poses/presenta_r0c1.webp" alt="" loading="lazy" />
        <span className="fab-dot" aria-hidden="true" />
        <span className="fab-txt">
          Soporte en línea
          <small>En línea ahora</small>
        </span>
      </button>
      {open && (
        <div className="fab-panel" id="fabPanel">
          <button type="button" className="fp-close" aria-label="Cerrar soporte" onClick={() => setOpen(false)}>
            ×
          </button>
          <div className="fp-head">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/lu/poses/saluda_r1c0.webp" alt="" loading="lazy" />
            <div>
              <b>Soporte</b>
              <span>En línea · responde en minutos</span>
            </div>
          </div>
          <p>¿Dudas con tu recarga o con tu pedido? Escríbenos por WhatsApp y lo vemos contigo.</p>
          <a className="btn btn-wa btn-block btn-sm" href={supportHref} target="_blank" rel="noreferrer">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.4A10 10 0 1 0 12 2z" />
            </svg>
            Abrir WhatsApp
          </a>
        </div>
      )}
    </div>
  );
}
