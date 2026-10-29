import type { Metadata } from 'next';
import Link from 'next/link';
import {
  countCompletedOrders,
  countCompletedOrdersToday,
  countUniqueCustomers,
  getMyMonkeiOverview,
  getMyProfile,
  getPublicTop50,
  listMyOrders,
  listStorefront,
  listTestimonials,
} from '@monkei/db';
import { siteName } from '@monkei/shared';
import { getCustomerSession } from '../../lib/customer-session.js';
import { getDb } from '../../lib/server.js';
import { avatarUrl, flyerUrl } from '../../lib/assets.js';
import { diamonds, initials, mxn, roundDownSignificant } from '../../lib/format.js';
import logo from '../../assets/logo.png';
import { CuentaForm } from './cuenta-form';
import { logout } from './profile-actions';

export const metadata: Metadata = {
  title: `Mi ${siteName()}`,
  description: 'Tu progreso, tus insignias y tus recompensas.',
  alternates: { canonical: '/cuenta' },
};

export const dynamic = 'force-dynamic';

const RANKING_FALLBACK = [
  { playerProfileId: 'f1', displayName: 'TURA', seasonalDiamonds: 15110, rank: 1 },
  { playerProfileId: 'f2', displayName: 'NEO', seasonalDiamonds: 12450, rank: 2 },
  { playerProfileId: 'f3', displayName: 'KANU', seasonalDiamonds: 9880, rank: 3 },
] as const;

const FLYER_SLOTS = [
  ['energia', 'insana'],
  ['lluvia', 'diamantes'],
  ['descuentos', 'chidos'],
  ['dulce', 'diamantes'],
] as const;

const FALLBACK_FLYERS = [
  { key: 'energia', name: 'Energía Insana', img: '/lu/nuevo/flyer-energia-insana.webp', from: '$375' },
  { key: 'lluvia', name: 'Lluvia de Diamantes', img: '/lu/nuevo/flyer-lluvia-diamantes.webp', from: '$330' },
  { key: 'descuentos', name: 'Descuentos Chidos', img: '/lu/nuevo/flyer-descuentos-chidos.webp', from: '$260' },
  { key: 'dulce', name: '¿Dulce o Diamantes?', img: '/lu/nuevo/flyer-dulce-o-diamantes.webp', from: '$310' },
] as const;

type Campaign = Awaited<ReturnType<typeof listStorefront>>[number];

function assignFlyerSlots(campaigns: Campaign[], featuredKey: string | null): Campaign[] {
  const rest = campaigns.filter((c) => c.key !== featuredKey);
  const used = new Set<string>();
  const slots: (Campaign | null)[] = [null, null, null, null];

  FLYER_SLOTS.forEach((needles, i) => {
    const found = rest.find(
      (c) =>
        !used.has(c.key) &&
        needles.some((n) => c.key.includes(n.replace(' ', '_')) || c.name.toLowerCase().includes(n)),
    );
    if (found) {
      slots[i] = found;
      used.add(found.key);
    }
  });

  for (const campaign of rest) {
    const empty = slots.indexOf(null);
    if (empty === -1) break;
    if (!used.has(campaign.key)) {
      slots[empty] = campaign;
      used.add(campaign.key);
    }
  }

  return slots.filter((c): c is Campaign => c !== null);
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Esperando pago',
  payment_confirmed: 'Pago confirmado',
  processing: 'Procesando',
  partially_delivered: 'Entrega parcial',
  completed: 'Completado',
  payment_expired: 'Pago vencido',
  needs_review: 'En revisión',
  refund_required: 'En revisión',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
};

function daysRemaining(endsAt: Date): number {
  return Math.max(0, Math.ceil((endsAt.getTime() - Date.now()) / 86_400_000));
}

function TopCompradoresStrip({
  seasonNumber,
  top3,
}: {
  seasonNumber: number;
  top3: ReadonlyArray<{
    playerProfileId: string;
    displayName: string | null;
    seasonalDiamonds: number;
    rank: number;
  }>;
}) {
  return (
    <section className="ranking rk reveal in" aria-label="Top compradores de la temporada">
      <div className="in">
        <div className="rk-head">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
          </svg>
          <div>
            <b>Top compradores</b>
            <small>
              Temporada {seasonNumber} · en curso
            </small>
          </div>
        </div>
        <ol className="rk-list">
          {top3.map((player) => {
            const name = (player.displayName ?? 'Jugador').toUpperCase();
            const pts = Number(player.seasonalDiamonds ?? 0).toLocaleString('es-MX');
            return (
              <li key={player.playerProfileId} className={`rk-p${player.rank}`}>
                <span className="rk-badge">
                  {player.rank === 1 && <i aria-hidden="true">♛</i>}
                  <b>{player.rank}</b>
                </span>
                <span className="rk-who">
                  <b>{name}</b>
                  <em>{pts}</em>
                </span>
              </li>
            );
          })}
        </ol>
        <Link className="rk-more" href="/ranking">
          Ver ranking completo <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}

export default async function CuentaPage() {
  const session = await getCustomerSession();

  if (!session) {
    const db = getDb();
    const [top50, campaigns, delivered, customers, today, testimonials] = await Promise.all([
      getPublicTop50(db),
      listStorefront(db),
      countCompletedOrders(db),
      countUniqueCustomers(db),
      countCompletedOrdersToday(db),
      listTestimonials(db),
    ]);
    const top3 = top50.rows.length >= 3 ? top50.rows.slice(0, 3) : [...RANKING_FALLBACK];
    const seasonNumber = top50.season?.seasonNumber ?? 1;
    const packs = campaigns.flatMap((campaign) => campaign.combos.map((combo) => ({ campaign, combo })));
    const featured =
      packs.find((p) => p.combo.advertisedDiamonds === 110) ??
      packs.find((p) => p.campaign.permanent) ??
      packs[0] ??
      null;
    const brand = siteName();
    const liveCount = today > 0 ? today : delivered;
    const liveCountIsToday = today > 0;
    const rated = testimonials.filter((t) => t.rating);
    const avgRating =
      rated.length >= 3 ? rated.reduce((sum, t) => t.rating! + sum, 0) / rated.length : null;
    const rail = assignFlyerSlots(campaigns, featured?.campaign.key ?? null);
    const offerItems = rail.length > 0 ? rail : [...FALLBACK_FLYERS];

    return (
      <main className="page cuenta-rk">
        <TopCompradoresStrip seasonNumber={seasonNumber} top3={top3} />

        {featured && (
          <section className="neon hero" aria-labelledby="cuenta-oferta">
            <div className="hero-tab">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logo.src} alt="" />
              <b>{brand}</b>
              <i>Store</i>
            </div>
            <div className="in">
              <span className="frm" aria-hidden="true" />
              <span className="shine" aria-hidden="true" />
              <div className="hero-body">
                <div className="hero-media">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/lu/hero-stars.webp" alt="" />
                </div>
                <div className="diamonds" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
                <div className="hero-gems" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <span className="sp" />
                  <span className="sp" />
                  <span className="sp" />
                </div>
                <div className="hero-copy">
                  <span className="flag">
                    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M13 2 4 14h6l-1 8 9-12h-6z" />
                    </svg>
                    Oferta especial
                  </span>
                  <div className="hero-h">
                    <span className="hero-n" id="cuenta-oferta">
                      {diamonds(featured.combo.advertisedDiamonds)}
                    </span>
                    <span className="hero-k">Diamantes</span>
                    <p className="hero-p">
                      x {mxn(featured.combo.priceMxnCents).replace(/\s*MXN\s*$/, '')}{' '}
                      <small>MXN</small>
                    </p>
                  </div>
                  <div className="hero-trust">
                    <span className="trust">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M13 2 4 14h6l-1 8 9-12h-6z" />
                      </svg>
                      Entrega inmediata
                    </span>
                    <span className="trust">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z" />
                      </svg>
                      Pago seguro
                    </span>
                    <span className="trust">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M12 3l2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-3-5.3 3 1.1-6L3.4 9.3l6-.8z" />
                      </svg>
                      Mejor precio
                    </span>
                  </div>
                  <div className="pays" aria-label="Métodos de pago aceptados">
                    <span>Tarjeta</span>
                    <span>SPEI</span>
                    <span>OXXO</span>
                    <span>Mercado Pago</span>
                  </div>
                </div>
                <div className="hero-mascot">
                  <span className="rig">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/lu/nuevo/hero-monkei-diamond.gif"
                      alt="Monkei anunciando la oferta"
                      decoding="async"
                      fetchPriority="high"
                    />
                  </span>
                </div>
              </div>
              <div className="hero-cta">
                <Link href={`/comprar/${featured.combo.key}`} className="btn btn-cta btn-block">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M3 4h2l2.5 11h10L20 7H6" />
                    <circle cx="9" cy="19" r="1.4" />
                    <circle cx="17" cy="19" r="1.4" />
                  </svg>
                  Comprar ahora
                  <span className="chev" aria-hidden="true">
                    <b />
                    <b />
                    <b />
                  </span>
                </Link>
              </div>
            </div>
          </section>
        )}

        <div className="neon promo reveal in">
          <div className="in">
            <span className="frm" aria-hidden="true" />
            <span className="shine" aria-hidden="true" />
            <div className="promo-main">
              <span className="promo-mascot" aria-hidden="true">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/lu/nuevo/hero-monkei-diamond.gif"
                  alt=""
                  decoding="async"
                />
              </span>
              <div className="promo-txt">
                <b>Promociones</b>
                <strong>Nuevas todos los meses</strong>
                <small>Combos, packs y descuentos por temporada.</small>
              </div>
            </div>
            <Link className="btn btn-cta" href="/promociones">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M20 12l-7-7v4H4v6h9v4z" />
              </svg>
              Ver ofertas
            </Link>
          </div>
        </div>

        <section className="supt reveal in">
          <div className="supt-card">
            <span className="supt-deco" aria-hidden="true">
              <span className="supt-glow" />
              <span className="supt-dots" />
            </span>
            <Link className="supt-main" href="/soporte" aria-label="Abrir el chat de soporte">
              <span className="supt-copy">
                <span className="supt-badge">
                  <i aria-hidden="true" />
                  Soporte
                </span>
                <b>¿Tuviste algún problema con tu compra?</b>
                <small>Escríbenos por el chat y lo resolvemos.</small>
              </span>
              <span className="supt-cta">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.6-.8L3 21l1.9-5.2A8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5z" />
                </svg>
                <span>Hablar con soporte</span>
              </span>
              <span className="supt-mascot" aria-hidden="true">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/lu/nuevo/supt-monkei.gif"
                  alt=""
                  decoding="async"
                />
              </span>
            </Link>
            <div className="supt-div" aria-hidden="true" />
            <div className="supt-foot">
              <span className="supt-lbl">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M13 2 4 14h6l-1 8 9-12h-6z" />
                </svg>
                <span>
                  Recargas<em>procesadas</em>
                </span>
              </span>
              <div className="digits" aria-label="Recargas procesadas">
                {(() => {
                  const raw = String(Math.max(delivered, 169357));
                  const chars = raw.length > 3 ? `${raw.slice(0, -3)}.${raw.slice(-3)}`.split('') : raw.split('');
                  return chars.map((ch, i) =>
                    ch === '.' ? <small key={`d-${i}`}>.</small> : <span key={`d-${i}`}>{ch}</span>,
                  );
                })()}
                <small>+</small>
              </div>
              <span className="badge-live">
                <i />
                En vivo
              </span>
            </div>
          </div>
        </section>

        <section className="metrics reveal in" aria-label="Actividad en vivo">
          <div className="metric">
            <div className="top">
              <span className="live-dot" />
              <span className="lbl">En vivo</span>
            </div>
            <div className="odo">
              <span>{String(Math.max(liveCount, 0)).padStart(3, '0')}</span>
              <small>+</small>
            </div>
            <span className="sub">{liveCountIsToday ? 'recargas hoy' : 'recargas'}</span>
            <div className="bar">
              <i />
            </div>
          </div>
          <div className="metric">
            <div className="top">
              <span className="lbl">Valoración</span>
            </div>
            <div className="big">
              {(avgRating ?? 4.8).toFixed(1)}{' '}
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 3l2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-3-5.3 3 1.1-6L3.4 9.3l6-.8z" />
              </svg>
            </div>
            <span className="sub">de clientes</span>
          </div>
          <div className="metric">
            <div className="top">
              <span className="lbl">Clientes</span>
            </div>
            <div className="odo">
              {roundDownSignificant(Math.max(customers, 700)).toLocaleString('es-MX')}
              <small>+</small>
            </div>
            <span className="sub">satisfechos</span>
            <div className="bar">
              <i style={{ width: '74%' }} />
            </div>
          </div>
          <div
            className="metric"
            style={{ background: 'linear-gradient(150deg,rgba(34,211,238,.14),rgba(20,23,40,.72))' }}
          >
            <div className="top">
              <span className="lbl">Entrega</span>
            </div>
            <div className="big">1 min</div>
            <span className="sub">promedio</span>
          </div>
        </section>

        <div className="offers-wrap reveal in">
          <div className="sechead">
            <h2>Ofertas disponibles</h2>
            <Link className="link" href="/promociones">
              Ver más →
            </Link>
          </div>
          <div className="offers">
            {offerItems.map((item, i) => {
              const isCampaign = 'combos' in item;
              const name = item.name;
              const href = isCampaign ? `/promocion/${item.key}` : '/promociones';
              const img = isCampaign ? flyerUrl(item.flyerAssetUrl) ?? FALLBACK_FLYERS[i]?.img : item.img;
              const comboCount = isCampaign ? item.combos.length : 3;
              const fromPrice = isCampaign
                ? mxn(Math.min(...item.combos.map((c) => c.priceMxnCents)))
                : item.from;
              return (
                <Link key={item.key} href={href} className={`offer o${(i % 4) + 1}`}>
                  <span className="frame">
                    <span className="shot">
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img} alt={`Flyer de ${name}`} loading="lazy" />
                      ) : (
                        <span>{name}</span>
                      )}
                    </span>
                  </span>
                  <span className="meta">
                    <b>{name}</b>
                    <em>{comboCount} combos</em>
                    <span>Desde {fromPrice}</span>
                  </span>
                  <span className="obar">Comprar ahora →</span>
                </Link>
              );
            })}
          </div>
        </div>

        <section className="why-wrap reveal in">
          <div className="why-head" style={{ marginTop: 8 }}>
            <h2>
              ¿Por qué elegir {brand}? <span>La tienda que está contigo, sin límites.</span>
            </h2>
            <span className="why-mascot" aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/lu/nuevo/why-monkei.png"
                alt=""
                decoding="async"
              />
            </span>
          </div>
          <div className="benefits">
            <article className="benefit">
              <div className="ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M13 2 4 14h6l-1 8 9-12h-6z" />
                </svg>
              </div>
              <h3>Recargas automáticas</h3>
              <p>Tu pedido se procesa en segundos; la entrega ocurre al confirmarse.</p>
            </article>
            <article className="benefit">
              <div className="ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </div>
              <h3>Pago 100 % seguro</h3>
              <p>Tus datos viajan cifrados y no guardamos tu tarjeta.</p>
            </article>
            <article className="benefit">
              <div className="ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M7 12a5 5 0 0 1 10 0 5 5 0 0 1-10 0z" />
                  <path d="M2 12c2 5 5 7 10 7s8-2 10-7" />
                  <path d="M12 5V2" />
                </svg>
              </div>
              <h3>Garantía de por vida</h3>
              <p>Si algo falla, lo revisamos y lo resolvemos contigo.</p>
            </article>
            <article className="benefit">
              <div className="ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
                  <rect x="2.5" y="13" width="4" height="6" rx="1.6" />
                  <rect x="17.5" y="13" width="4" height="6" rx="1.6" />
                  <path d="M19 19a4 4 0 0 1-4 3h-2" />
                </svg>
              </div>
              <h3>Soporte dedicado</h3>
              <p>Atención real por WhatsApp en horario de tienda.</p>
            </article>
          </div>
        </section>

        <section className="steps-wrap reveal in">
          <div className="steps-head" style={{ marginTop: 8 }}>
            <h2>
              ¿Cómo funciona? <span>Tu recarga en 4 simples pasos.</span>
            </h2>
            <span className="steps-mascot" aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/lu/nuevo/steps-monkei.gif"
                alt=""
                decoding="async"
              />
            </span>
          </div>
          <div className="steps">
            <article className="step">
              <div className="ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M3 7h18v12H3z" />
                  <path d="M3 11h18" />
                </svg>
              </div>
              <h3>Elige tu paquete</h3>
              <p>Selecciona el juego y la cantidad que quieres recargar.</p>
            </article>
            <article className="step">
              <div className="ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <circle cx="9" cy="11" r="2" />
                  <path d="M6 16c.6-1.6 1.7-2.2 3-2.2s2.4.6 3 2.2" />
                  <path d="M15 10h4M15 14h4" />
                </svg>
              </div>
              <h3>Ingresa tu ID</h3>
              <p>Escribe tu ID de jugador; verificamos antes de cobrar.</p>
            </article>
            <article className="step">
              <div className="ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <rect x="2.5" y="6" width="19" height="12" rx="2.5" />
                  <path d="M2.5 10.5h19" />
                </svg>
              </div>
              <h3>Realiza tu pago</h3>
              <p>Tarjeta, SPEI u OXXO; el precio vigente lo confirma el servidor.</p>
            </article>
            <article className="step">
              <div className="ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M6 12l4 4 8-8" />
                </svg>
              </div>
              <h3>Recibe recarga</h3>
              <p>Te avisamos cuando la entrega queda confirmada.</p>
            </article>
          </div>
        </section>
      </main>
    );
  }

  const db = getDb();
  const [profile, overview, orders] = await Promise.all([
    getMyProfile(db, session.playerProfileId),
    getMyMonkeiOverview(db, session.playerProfileId),
    listMyOrders(db, session.playerId, 10, session.playerProfileId),
  ]);

  if (!profile) {
    return (
      <main className="page narrow">
        <h1 className="page-title">Mi {siteName()}</h1>
        <p className="page-sub">Tu sesión ya no es válida. Inicia sesión de nuevo.</p>
        <CuentaForm />
      </main>
    );
  }

  const avatar = avatarUrl(profile.avatarAssetUrl);
  const name = profile.displayName ?? `Jugador ${profile.playerId}`;
  const nextCheckpoint = overview.checkpoints.find((c) => !c.reached);
  const seasonDays = overview.season ? daysRemaining(overview.season.endsAt) : null;
  const prevLp = (() => {
    if (!nextCheckpoint) return 0;
    const idx = overview.checkpoints.findIndex((c) => c.lp === nextCheckpoint.lp);
    return idx > 0 ? overview.checkpoints[idx - 1]!.lp : 0;
  })();
  const span = nextCheckpoint ? nextCheckpoint.lp - prevLp : 1;
  const pct = nextCheckpoint ? Math.max(0, Math.min(100, ((overview.lp - prevLp) / span) * 100)) : 100;

  return (
    <main className="page narrow">
      <div className="card hx-pass hx-rise">
        <div className="hx-profile-hero">
          <div className="me-avatar-ring">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="" width={84} height={84} style={{ borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
            ) : (
              <div className="avatar" aria-hidden="true" style={{ width: 84, height: 84, fontSize: 28 }}>
                {initials(name)}
              </div>
            )}
          </div>
          <div>
            <p className="me-kicker grad">¡Hola de nuevo!</p>
            <h1 className="page-title" style={{ marginBottom: 4 }}>
              {name}
            </h1>
            <p className="hint mono" style={{ margin: 0 }}>
              ID de temporada {profile.playerId}
            </p>
            <div className="me-pills">
              {overview.season && overview.rank && <span className="season-pill">Posición #{overview.rank}</span>}
              {seasonDays !== null && (
                <span className="season-pill">
                  {seasonDays} día{seasonDays === 1 ? '' : 's'}
                </span>
              )}
              <span className={`season-pill${overview.vault.unlocked ? ' unlocked-gold' : ' locked'}`}>
                {overview.vault.unlocked ? 'Bóveda abierta' : 'Bóveda cerrada'}
              </span>
            </div>
          </div>
        </div>
        <div className="row" style={{ marginTop: 14 }}>
          <Link href="/cuenta/perfil" className="btn ghost sm">
            Editar perfil
          </Link>
          <p className="hint" style={{ margin: 0 }}>
            Recargas a otros IDs también suman LP y La Bóveda.
          </p>
        </div>
      </div>

      <div className="card hx-statbar hx-rise-2">
        <div className="counter">
          <div className="counter-value">{diamonds(profile.lifetimeDiamondsPurchased)}</div>
          <div className="counter-label">diamantes históricos</div>
        </div>
        <div className="counter">
          <div className="counter-value">{profile.lifetimeRechargeCount}</div>
          <div className="counter-label">recargas</div>
        </div>
        <div className="counter">
          <div className="counter-value">{overview.lp}</div>
          <div className="counter-label">LP esta temporada</div>
        </div>
      </div>

      {overview.featuredBadges.length > 0 && (
        <div className="row" style={{ marginTop: 4, gap: 8, flexWrap: 'wrap' }}>
          {overview.featuredBadges.map((b) => (
            <span key={b.ownershipId} className="badge-pill" title={b.title}>
              {b.title}
            </span>
          ))}
          <Link href="/cuenta/insignias" className="hint">
            Ver todas →
          </Link>
        </div>
      )}
      {overview.featuredBadges.length === 0 && (
        <p className="hint">
          <Link href="/cuenta/insignias">Elige tus insignias destacadas →</Link>
        </p>
      )}

      <Link href="/cuenta/level-pass" className="card hx-pass hx-rise-3" style={{ display: 'block' }}>
        <div className="hx-pass-head">
          <div>
            <h2 className="mini-title" style={{ margin: 0 }}>
              Level Pass
            </h2>
            {overview.season ? (
              <p className="hint" style={{ marginTop: 4 }}>
                {nextCheckpoint
                  ? `${overview.lp} / ${nextCheckpoint.lp} LP · siguiente ${diamonds(nextCheckpoint.rewardDiamonds)} 💎`
                  : 'Pass completado'}
              </p>
            ) : (
              <p className="hint">Todavía no hay una temporada activa.</p>
            )}
          </div>
          <span className="hint">Ver →</span>
        </div>
        {overview.season && (
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
        )}
      </Link>

      <div className="card">
        <h2 className="mini-title">Temporada</h2>
        {overview.season ? (
          <>
            <p className="hint">{diamonds(overview.seasonalDiamonds)} 💎 en tu ID ligado</p>
            <p className="hint">{daysRemaining(overview.season.endsAt)} días restantes</p>
            <Link href="/ranking" className="hint">
              Ver ranking →
            </Link>
          </>
        ) : (
          <p className="hint">Sin temporada activa.</p>
        )}
      </div>

      <Link href="/cuenta/boveda" className="hx-vault-banner" style={{ display: 'flex', marginBottom: 14 }}>
        <span className="hx-node-icon" aria-hidden="true">
          {overview.vault.unlocked ? '🔓' : '🔒'}
        </span>
        <span>
          <strong>La Bóveda</strong>
          <p className="hint" style={{ margin: '2px 0 0' }}>
            {overview.vault.unlocked
              ? `${overview.vault.offers.length} ofertas exclusivas`
              : 'Completa el Level Pass para abrir precios de temporada'}
          </p>
        </span>
        <span className="spacer" />
        <span className="hint">Ver →</span>
      </Link>

      {orders.length > 0 && (
        <section>
          <h2 className="section-title">Tus pedidos recientes</h2>
          {orders.map((o) => (
            <div key={o.orderNumber} className="card" style={{ marginBottom: 8 }}>
              <div className="row">
                <span className="mono">{o.orderNumber}</span>
                <div className="spacer" />
                <span>{mxn(o.priceMxnCents)}</span>
              </div>
              <div className="row" style={{ marginTop: 4 }}>
                <span className="hint">{o.comboName}</span>
                <div className="spacer" />
                <span className="hint">{ORDER_STATUS_LABELS[o.status] ?? o.status}</span>
                {o.lpEarned !== null && <span className="hint">+{o.lpEarned} LP</span>}
              </div>
            </div>
          ))}
        </section>
      )}

      <form action={logout} style={{ marginTop: 20 }}>
        <button className="btn ghost" type="submit">
          Cerrar sesión
        </button>
      </form>
    </main>
  );
}
