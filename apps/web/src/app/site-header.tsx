import Link from 'next/link';
import { getCustomerSession } from '../lib/customer-session';
import { socialLinks } from '../lib/social';
import { siteName } from '@monkei/shared';
import logo from '../assets/logo.png';

function SocialSvg({ kind }: { kind: 'tiktok' | 'instagram' | 'facebook' }) {
  if (kind === 'tiktok') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M16.6 5.8a5 5 0 0 1-3-2.8h-2.7v12.1a2.6 2.6 0 1 1-1.9-2.5V9.8a5.4 5.4 0 1 0 4.6 5.3V9.3a7.6 7.6 0 0 0 4 1.2V7.8a4.8 4.8 0 0 1-1-.2z" />
      </svg>
    );
  }
  if (kind === 'instagram') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M13.5 21v-7h2.4l.4-3h-2.8V9.2c0-.9.3-1.5 1.5-1.5h1.4V5c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.1V11H8v3h2.5v7z" />
    </svg>
  );
}

export async function SiteHeader() {
  const social = socialLinks();
  const session = await getCustomerSession();
  const brand = siteName();

  return (
    <header className="hdr">
      <div className="hdr-in">
        <div className="socials">
          {social.tiktok && (
            <a href={social.tiktok} target="_blank" rel="noreferrer" aria-label="TikTok">
              <SocialSvg kind="tiktok" />
            </a>
          )}
          {social.instagram && (
            <a href={social.instagram} target="_blank" rel="noreferrer" aria-label="Instagram">
              <SocialSvg kind="instagram" />
            </a>
          )}
          {social.facebook && (
            <a href={social.facebook} target="_blank" rel="noreferrer" aria-label="Facebook">
              <SocialSvg kind="facebook" />
            </a>
          )}
        </div>
        <Link className="brand" href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo.src} alt="" width={34} height={34} />
          <span>
            {brand}
            <i>México</i>
          </span>
        </Link>
        <div className="hdr-actions">
          <span className="icon-btn" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M18 15V10a6 6 0 1 0-12 0v5l-1.5 2.5h15z" />
              <path d="M10 19a2 2 0 0 0 4 0" />
            </svg>
            <span className="badge-dot">2</span>
          </span>
          <Link href="/cuenta" className="icon-btn" aria-label={session ? 'Mi cuenta' : 'Crear mi cuenta'}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="8.5" r="3.2" />
              <path d="M5.2 20c.7-3.4 3.5-5 6.8-5s6.1 1.6 6.8 5" />
            </svg>
          </Link>
        </div>
      </div>
    </header>
  );
}
