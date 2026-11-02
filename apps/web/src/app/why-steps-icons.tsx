/** Modern duotone icons for why/benefits + how/steps cards */

type IconProps = { className?: string };

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  xmlns: 'http://www.w3.org/2000/svg',
  'aria-hidden': true,
} as const;

/** Recargas automáticas */
export function IconBolt({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path
        fill="currentColor"
        fillOpacity="0.2"
        d="M13.2 2.4 4.6 13.3c-.35.44-.03 1.08.53 1.08h5.2l-1.05 7.02c-.1.66.74 1.05 1.2.55l8.6-10.9c.35-.44.03-1.08-.53-1.08h-5.2l1.05-7.02c.1-.66-.74-1.05-1.2-.55Z"
      />
      <path
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
        strokeLinecap="round"
        d="M13 2.5 4.5 13.2h5.4l-1.1 7.3L19.5 10.8H14.1L15.2 3.5 13 2.5Z"
      />
    </svg>
  );
}

/** Pago 100% seguro */
export function IconShield({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path
        fill="currentColor"
        fillOpacity="0.2"
        d="M12 2.6 19.2 5.5v5.8c0 4.35-2.85 7.7-7.2 9.55C7.65 19 4.8 15.65 4.8 11.3V5.5L12 2.6Z"
      />
      <path
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
        d="M12 3.2 18.5 5.9v5.4c0 3.9-2.55 6.9-6.5 8.55C8.05 18.2 5.5 15.2 5.5 11.3V5.9L12 3.2Z"
      />
      <path
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m9.2 11.8 1.9 1.9 3.8-3.9"
      />
    </svg>
  );
}

/** Garantía de por vida */
export function IconBadge({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="11" r="5.2" fill="currentColor" fillOpacity="0.2" />
      <circle cx="12" cy="11" r="5.2" stroke="currentColor" strokeWidth="1.7" />
      <path
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 5.8V3.4M8.4 17.6 7 20.4M15.6 17.6 17 20.4M9.6 19.2h4.8"
      />
      <path
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m10.2 11.1 1.3 1.3 2.5-2.6"
      />
    </svg>
  );
}

/** Soporte dedicado */
export function IconHeadset({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path
        fill="currentColor"
        fillOpacity="0.2"
        d="M5.2 12.2v-.6a6.8 6.8 0 0 1 13.6 0v.6"
      />
      <path
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        d="M5.5 12.4v-.7a6.5 6.5 0 0 1 13 0v.7"
      />
      <rect x="3.2" y="12.2" width="3.6" height="5.4" rx="1.5" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.7" />
      <rect x="17.2" y="12.2" width="3.6" height="5.4" rx="1.5" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.7" />
      <path
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18.8 17.6a3.6 3.6 0 0 1-3.5 2.7h-2.1"
      />
      <circle cx="13.6" cy="20.3" r="0.9" fill="currentColor" />
    </svg>
  );
}

/** Elige tu paquete */
export function IconGift({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3.5" y="10" width="17" height="10.5" rx="2" fill="currentColor" fillOpacity="0.2" />
      <rect x="3.5" y="10" width="17" height="10.5" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path stroke="currentColor" strokeWidth="1.7" d="M3.5 14.2h17" />
      <path stroke="currentColor" strokeWidth="1.7" d="M12 10v10.5" />
      <path
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        d="M12 10c-2.2-2.8-5.2-2.6-5.2-.4S9.4 12 12 10c2.2-2.8 5.2-2.6 5.2-.4S14.6 12 12 10Z"
      />
    </svg>
  );
}

/** Ingresa tu ID */
export function IconIdCard({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="2.8" y="5.5" width="18.4" height="13" rx="2.4" fill="currentColor" fillOpacity="0.2" />
      <rect x="2.8" y="5.5" width="18.4" height="13" rx="2.4" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="9" cy="11" r="2.1" stroke="currentColor" strokeWidth="1.7" />
      <path
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        d="M6.4 15.4c.7-1.4 1.8-2 2.6-2s1.9.6 2.6 2"
      />
      <path stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" d="M14.4 10.2h4.2M14.4 13.6h4.2" />
    </svg>
  );
}

/** Realiza tu pago */
export function IconCard({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="2.5" y="6" width="19" height="12.2" rx="2.6" fill="currentColor" fillOpacity="0.2" />
      <rect x="2.5" y="6" width="19" height="12.2" rx="2.6" stroke="currentColor" strokeWidth="1.7" />
      <path stroke="currentColor" strokeWidth="1.7" d="M2.5 10.4h19" />
      <path stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" d="M6.2 14.6h4.4M16.8 14.6h1.5" />
    </svg>
  );
}

/** Recibe recarga */
export function IconCheck({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="8.2" fill="currentColor" fillOpacity="0.2" />
      <circle cx="12" cy="12" r="8.2" stroke="currentColor" strokeWidth="1.7" />
      <path
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m8.2 12.2 2.6 2.6 5.2-5.4"
      />
    </svg>
  );
}
