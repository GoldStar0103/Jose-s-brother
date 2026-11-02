'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/', label: 'Inicio', icon: '/lu/nuevo/neon-bottom-nav/inicio.svg' },
  { href: '/promociones', label: 'Promociones', icon: '/lu/nuevo/neon-bottom-nav/promociones.svg' },
  { href: '/cuenta', label: 'Mi cuenta', icon: '/lu/nuevo/neon-bottom-nav/cuenta.svg' },
  { href: '/confianza', label: 'Confianza', icon: '/lu/nuevo/neon-bottom-nav/confianza.svg' },
  { href: '/soporte', label: 'Soporte', icon: '/lu/nuevo/neon-bottom-nav/soporte.svg' },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bnav neon-nav" aria-label="Navegación principal">
      <div className="neon-nav__surface">
        {ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`neon-nav__item${active ? ' neon-nav__item--active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="neon-nav__icon" src={item.icon} alt="" aria-hidden="true" />
              <span className="neon-nav__label">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
