'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  {
    href: '/',
    label: 'Inicio',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
        <path d="M3 11l9-8 9 8" />
        <path d="M5.5 9.5V20h13V9.5" />
      </svg>
    ),
  },
  {
    href: '/promociones',
    label: 'Promociones',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
        <path d="M20 12l-7-7v4H4v6h9v4z" />
        <path d="M4 20h16" />
      </svg>
    ),
  },
  {
    href: '/cuenta',
    label: 'Mi cuenta',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
        <circle cx="12" cy="8.5" r="3.2" />
        <path d="M5.2 20c.7-3.4 3.5-5 6.8-5s6.1 1.6 6.8 5" />
      </svg>
    ),
  },
  {
    href: '/confianza',
    label: 'Confianza',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
        <path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z" />
      </svg>
    ),
  },
  {
    href: '/soporte',
    label: 'Soporte',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
        <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
        <rect x="2.5" y="13" width="4" height="6" rx="1.6" />
        <rect x="17.5" y="13" width="4" height="6" rx="1.6" />
      </svg>
    ),
  },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bnav" aria-label="Navegación principal">
      {ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link key={item.label} href={item.href} aria-current={active ? 'page' : undefined}>
            {item.icon}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
