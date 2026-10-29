'use client';

import { useRouter } from 'next/navigation';

/**
 * Circular back control in the top-left chrome (replaces the Next.js "N"
 * dev indicator position users were tapping expecting navigation).
 */
export function BackButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      className="back-fab"
      aria-label="Volver"
      onClick={() => {
        if (typeof window !== 'undefined' && window.history.length > 1) {
          router.back();
          return;
        }
        router.push('/');
      }}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
        <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
