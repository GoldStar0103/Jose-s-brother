'use client';

import { useEffect } from 'react';

/** LevelUp `.reveal` sections start at opacity:0 until `.in` is added. */
export function RevealInit() {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));
    if (!nodes.length) return;

    if (typeof IntersectionObserver === 'undefined') {
      nodes.forEach((n) => n.classList.add('in'));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );

    nodes.forEach((n) => io.observe(n));
    // Above-the-fold items (ranking) should show immediately.
    requestAnimationFrame(() => {
      nodes.forEach((n) => {
        const rect = n.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.92) n.classList.add('in');
      });
    });

    return () => io.disconnect();
  }, []);

  return null;
}
