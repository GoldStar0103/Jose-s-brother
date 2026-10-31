import type { Metadata, Viewport } from 'next';
import { Outfit } from 'next/font/google';
import { facebookDomainVerification, googleSiteVerification } from '../lib/google-verification';
import { siteOrigin } from '../lib/site';
import { metaPixelId, tiktokPixelId } from '../lib/pixel-ids';
import { MetaPixel } from './meta-pixel';
import { TikTokPixel } from './tiktok-pixel';
import { BottomNav } from './bottom-nav';
import { WhatsappChannelPopup } from './whatsapp-channel-popup';
import { whatsappChannelUrl } from '../lib/whatsapp-channel';
import { legalIdentity, pending } from '../lib/legal';
import { supportUrl } from '../lib/support';
import { socialLinks } from '../lib/social';
import { siteName } from '@monkei/shared';
import logo from '../assets/logo.png';
import { AppBg } from './app-bg';
import { SupportFab } from './support-fab';
import { SiteHeader } from './site-header';
import { BackButton } from './back-button';
import { RevealInit } from './reveal';
import './globals.css';
import './levelup-home.css';
import './levelup-appbg-layers.css';
import './levelup-hero-gems.css';
import './levelup-ia-live.css';
import './levelup-rk-patch.css';
import './levelup-bridge.css';
import './levelup-wa-popup.css';
import './levelup-home-polish.css';
import './monkei-theme.css';
import './monkei-3d.css';

const outfit = Outfit({ subsets: ['latin'], display: 'swap' });

const DESCRIPTION =
  'Recargas de diamantes para Free Fire directo a tu cuenta. Entrega automática, pago seguro.';

/**
 * Per request, because `metadataBase` and the Search Console token both come
 * from the environment. A prerendered layout would bake in whatever the image
 * was built with — including an empty verification tag — and no restart would
 * fix it. Same trap as the sitemap and the legal pages.
 */
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const google = googleSiteVerification();
  const facebook = facebookDomainVerification();
  const verification = {
    ...(google ? { google } : {}),
    ...(facebook ? { other: { 'facebook-domain-verification': facebook } } : {}),
  };

  const brand = siteName();
  const title = `${brand} — Recargas Free Fire`;

  return {
    metadataBase: new URL(siteOrigin()),
    title: {
      default: title,
      template: `%s · ${brand}`,
    },
    description: DESCRIPTION,
    applicationName: brand,
    icons: {
      icon: [{ url: '/icon.png', type: 'image/png' }],
      apple: [{ url: '/apple-icon.png', type: 'image/png' }],
    },
    ...(Object.keys(verification).length > 0 ? { verification } : {}),
    openGraph: {
      type: 'website',
      siteName: brand,
      locale: 'es_MX',
      title,
      description: DESCRIPTION,
      url: '/',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: DESCRIPTION,
    },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0b0d18',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const metaId = metaPixelId();
  const tiktokId = tiktokPixelId();
  const channelUrl = whatsappChannelUrl();
  const waSupport = supportUrl() ?? '/soporte';
  const social = socialLinks();
  const brand = siteName();
  const legal = legalIdentity();

  return (
    <html lang="es-MX" className={outfit.className}>
      <body>
        {metaId && <MetaPixel pixelId={metaId} />}
        {tiktokId && <TikTokPixel pixelId={tiktokId} />}
        <AppBg />
        <RevealInit />
        {channelUrl && <WhatsappChannelPopup channelUrl={channelUrl} />}
        <BackButton />
        <SiteHeader />
        <div className="wrap">
          {children}
          <footer className="foot">
            <div className="foot-grid">
              <div className="foot-brand">
                <div className="b">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logo.src} alt="" width={36} height={36} loading="lazy" decoding="async" />
                  <b>{brand}</b>
                </div>
                <p>Recargas de diamantes y monedas para tus juegos, hechas por gamers para gamers.</p>
              </div>
              <div>
                <h4>Navegación</h4>
                <ul>
                  <li>
                    <a href="/">Inicio</a>
                  </li>
                  <li>
                    <a href="/promociones">Promociones</a>
                  </li>
                  <li>
                    <a href="/cuenta">Mi cuenta</a>
                  </li>
                  <li>
                    <a href="/pedidos">Pedidos</a>
                  </li>
                  <li>
                    <a href="/confianza">Confianza</a>
                  </li>
                </ul>
              </div>
              <div>
                <h4>Legal</h4>
                <ul>
                  <li>
                    <a href="/legal/terminos">Términos y condiciones</a>
                  </li>
                  <li>
                    <a href="/legal/privacidad">Privacidad</a>
                  </li>
                  <li>
                    <a href="/soporte">Soporte</a>
                  </li>
                  <li>
                    <a href="/ranking">Ranking</a>
                  </li>
                </ul>
              </div>
              <div>
                <h4>Síguenos</h4>
                <ul>
                  {social.tiktok && (
                    <li>
                      <a href={social.tiktok} target="_blank" rel="noreferrer">
                        TikTok
                      </a>
                    </li>
                  )}
                  {social.instagram && (
                    <li>
                      <a href={social.instagram} target="_blank" rel="noreferrer">
                        Instagram
                      </a>
                    </li>
                  )}
                  {social.facebook && (
                    <li>
                      <a href={social.facebook} target="_blank" rel="noreferrer">
                        Facebook
                      </a>
                    </li>
                  )}
                  <li>
                    <a href={channelUrl ?? waSupport} target="_blank" rel="noreferrer">
                      WhatsApp
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="foot-base">
              <span>
                © {new Date().getFullYear()} {brand}. Todos los derechos reservados.
              </span>
              <span>Operado por {pending(legal.legalName, 'razón social')}.</span>
            </div>
          </footer>
        </div>
        <SupportFab supportHref={waSupport} />
        <BottomNav />
      </body>
    </html>
  );
}
