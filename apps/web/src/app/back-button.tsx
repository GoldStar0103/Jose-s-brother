'use client';

import { useRouter } from 'next/navigation';

/**
 * Wide flat back bar for `.page-back` (under the header, above first content).
 */
export function BackButton({ className }: { className?: string } = {}) {
  const router = useRouter();

  return (
    <button
      type="button"
      className={['back-fab', className].filter(Boolean).join(' ')}
      aria-label="Volver"
      onClick={() => {
        if (window.history.length > 1) {
          router.back();
          return;
        }
        router.push('/');
      }}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
        <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="back-fab__label">Volver</span>
    </button>
  );
}
