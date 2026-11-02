'use client';

import { useEffect } from 'react';

export function HeaderScroll() {
  useEffect(() => {
    const header = document.querySelector<HTMLElement>('.site-header');
    if (!header) return;

    let lastY = window.scrollY;

    const onScroll = () => {
      const y = window.scrollY;
      if (y <= 0) {
        header.classList.remove('is-hidden');
      } else if (y > lastY + 4) {
        header.classList.add('is-hidden');
      }
      lastY = y;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return null;
}
