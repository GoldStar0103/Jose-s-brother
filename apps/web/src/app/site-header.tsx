import Link from 'next/link';
import { getCustomerSession } from '../lib/customer-session';
import { socialLinks } from '../lib/social';

function TikTokIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path
        className="tiktok-cyan"
        d="M38 8h8c.6 6.1 4.1 10 10 11.9v8.5a23 23 0 0 1-10-3.1V42c0 10.1-7.8 17-17.5 17C18.7 59 12 51.6 12 42.8c0-10.7 9.4-18.4 20-16.1v9c-5.8-1.8-11 1.4-11 7 0 4.3 3.1 7.4 7.5 7.4 5.3 0 8.4-3.6 8.4-9.1L38 8Z"
      />
      <path
        className="tiktok-pink"
        d="M42 6h8c.6 6.1 4.1 10 10 11.9v8.5a23 23 0 0 1-10-3.1V40c0 10.1-7.8 17-17.5 17C22.7 57 16 49.6 16 40.8c0-10.7 9.4-18.4 20-16.1v9c-5.8-1.8-11 1.4-11 7 0 4.3 3.1 7.4 7.5 7.4 5.3 0 8.4-3.6 8.4-9.1L42 6Z"
      />
      <path
        className="tiktok-white"
        d="M40 7h8c.6 6.1 4.1 10 10 11.9v8.5a23 23 0 0 1-10-3.1V41c0 10.1-7.8 17-17.5 17C20.7 58 14 50.6 14 41.8c0-10.7 9.4-18.4 20-16.1v9c-5.8-1.8-11 1.4-11 7 0 4.3 3.1 7.4 7.5 7.4 5.3 0 8.4-3.6 8.4-9.1L40 7Z"
      />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <rect x="10" y="10" width="44" height="44" rx="13" />
      <circle cx="32" cy="32" r="10.5" />
      <circle cx="47" cy="17.5" r="2.8" className="filled" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path
        className="filled"
        d="M37.7 58V35.1h8.1l1.2-9h-9.3v-5.8c0-2.6.8-4.4 4.7-4.4h5V8a68 68 0 0 0-7.2-.4c-7.1 0-12 4.3-12 12.3v6.2h-8v9h8V58h9.5Z"
      />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path d="M16 47h32c-4.2-4.7-5.3-9.7-5.3-17.2 0-7.4-4.5-12.6-10.7-12.6s-10.7 5.2-10.7 12.6C21.3 37.3 20.2 42.3 16 47Z" />
      <path d="M27 52c1.1 5.2 8.9 5.2 10 0" />
      <path d="M32 10v6" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="22" r="9" />
      <path d="M14 53c1.5-11 8-16 18-16s16.5 5 18 16" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg className="chevron" viewBox="0 0 24 24" aria-hidden="true">
      <path d="m5 9 7 7 7-7" />
    </svg>
  );
}

export async function SiteHeader() {
  const social = socialLinks();
  const session = await getCustomerSession();

  return (
    <header className="site-header" aria-label="Cabecera principal">
      <div className="header-surface">
        <nav className="socials" aria-label="Redes sociales">
          {social.tiktok && (
            <a className="header-control social-control" href={social.tiktok} target="_blank" rel="noreferrer" aria-label="TikTok">
              <TikTokIcon />
            </a>
          )}
          {social.instagram && (
            <a className="header-control social-control" href={social.instagram} target="_blank" rel="noreferrer" aria-label="Instagram">
              <InstagramIcon />
            </a>
          )}
          {social.facebook && (
            <a className="header-control social-control" href={social.facebook} target="_blank" rel="noreferrer" aria-label="Facebook">
              <FacebookIcon />
            </a>
          )}
        </nav>

        <Link className="brand" href="/" aria-label="Monkei inicio">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/lu/nuevo/neon-monkei-logo.png" alt="Monkei" width={120} height={80} />
        </Link>

        <div className="account-actions">
          <span className="light-divider" aria-hidden="true" />
          <span className="header-control notification-control" aria-label="Notificaciones, 2 sin leer">
            <BellIcon />
            <span className="notification-count">2</span>
          </span>
          <Link
            className="header-control profile-control"
            href="/cuenta"
            aria-label={session ? 'Mi cuenta' : 'Crear mi cuenta'}
          >
            <UserIcon />
            <ChevronIcon />
          </Link>
        </div>
      </div>
    </header>
  );
}
