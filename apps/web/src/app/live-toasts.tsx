'use client';

import { useEffect, useState } from 'react';

type Toast = {
  id: number;
  name: string;
  initials: string;
  diamonds: number;
  game: string;
};

const NAMES = ['DAN', 'MAR', 'LUIS', 'KARO', 'NEO', 'TURA', 'ANDY', 'SOFI'];
const GAMES = ['Free Fire', 'Blood Strike', 'Mobile Legends'];

function maskName(n: string): string {
  return `${n.slice(0, 3)}***`;
}

function nextToast(id: number): Toast {
  const name = NAMES[Math.floor(Math.random() * NAMES.length)]!;
  const diamonds = [110, 340, 570, 1060, 2180, 5600][Math.floor(Math.random() * 6)]!;
  const game = GAMES[Math.floor(Math.random() * GAMES.length)]!;
  return { id, name, initials: name.slice(0, 2), diamonds, game };
}

/** Simulated live recharge toasts — LevelUp home chrome. */
export function LiveToasts() {
  const [items, setItems] = useState<Toast[]>([]);

  useEffect(() => {
    let id = 0;
    let cancelled = false;

    const push = () => {
      if (cancelled) return;
      const toast = nextToast(++id);
      setItems((prev) => [...prev.slice(-2), toast]);
      window.setTimeout(() => {
        setItems((prev) => prev.filter((t) => t.id !== toast.id));
      }, 4200);
    };

    const first = window.setTimeout(push, 2200);
    const timer = window.setInterval(push, 7000);
    return () => {
      cancelled = true;
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="toasts" aria-live="polite" aria-atomic="false">
      {items.map((t) => (
        <div key={t.id} className="toast on">
          <span className="tav" aria-hidden="true">
            {t.initials}
          </span>
          <span className="ttx">
            <b>
              {maskName(t.name)} recargó {t.diamonds.toLocaleString('es-MX')} diamantes
            </b>
            <span>
              {t.game} · hace un momento
            </span>
          </span>
          <span className="tck" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M5 12l5 5L20 7" />
            </svg>
          </span>
        </div>
      ))}
    </div>
  );
}
