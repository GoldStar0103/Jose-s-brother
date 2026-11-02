import type { Metadata } from 'next';
import Link from 'next/link';
import {
  countCompletedOrders,
  countCompletedOrdersToday,
  countUniqueCustomers,
  getPublicTop50,
  listStorefront,
  listTestimonials,
} from '@monkei/db';
import { getDb } from '../lib/server';
import { diamonds, mxn, roundDownSignificant } from '../lib/format';
import { flyerUrl } from '../lib/assets';
import { siteName } from '@monkei/shared';
import { DiamondOfferCard } from './diamond-offer-card';
import { TopCompradoresCard } from './top-compradores-card';
import { PromocionesCard } from './promociones-card';
import { NeonSupportCard } from './neon-support-card';
import {
  IconBadge,
  IconBolt,
  IconCard,
  IconCheck,
  IconGift,
  IconHeadset,
  IconIdCard,
  IconShield,
} from './why-steps-icons';

const RANKING_FALLBACK = [
  { playerProfileId: 'f1', displayName: 'TURA', seasonalDiamonds: 15110, rank: 1 },
  { playerProfileId: 'f2', displayName: 'NEO', seasonalDiamonds: 12450, rank: 2 },
  { playerProfileId: 'f3', displayName: 'KANU', seasonalDiamonds: 9880, rank: 3 },
] as const;

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { alternates: { canonical: '/' } };

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

export default async function HomePage() {
  const [campaigns, delivered, customers, today, top50, testimonials] = await Promise.all([
    listStorefront(getDb()),
    countCompletedOrders(getDb()),
    countUniqueCustomers(getDb()),
    countCompletedOrdersToday(getDb()),
    getPublicTop50(getDb()),
    listTestimonials(getDb()),
  ]);

  const rated = testimonials.filter((t) => t.rating);
  const avgRating =
    rated.length >= 3 ? rated.reduce((sum, t) => t.rating! + sum, 0) / rated.length : null;

  const packs = campaigns.flatMap((campaign) => campaign.combos.map((combo) => ({ campaign, combo })));
  const featured =
    packs.find((p) => p.combo.advertisedDiamonds === 110) ??
    packs.find((p) => p.campaign.permanent) ??
    packs[0] ??
    null;

  const top3 =
    top50.rows.length >= 3
      ? [...top50.rows].sort((a, b) => a.rank - b.rank).slice(0, 3)
      : [...RANKING_FALLBACK];
  const rail = assignFlyerSlots(campaigns, featured?.campaign.key ?? null);
  const offerItems = rail.length > 0 ? rail : [...FALLBACK_FLYERS];
  const liveCount = today > 0 ? today : delivered;
  const liveCountIsToday = today > 0;
  const brand = siteName();
  const rankingBlock = (
    <TopCompradoresCard seasonNumber={top50.season?.seasonNumber ?? 1} top3={top3} />
  );

  const supportBlock = <NeonSupportCard processedCount={delivered} />;

  return (
      <>
        <div className="layout">
          <div className="col-main">
          {rankingBlock}
          {featured && (
              <DiamondOfferCard
                href={`/comprar/${featured.combo.key}`}
                diamondsLabel={diamonds(featured.combo.advertisedDiamonds)}
                priceLabel={mxn(featured.combo.priceMxnCents)}
              />
            )}

            <PromocionesCard />

            {supportBlock}

            <section className="metrics reveal" aria-label="Actividad en vivo">
              <article className="metric metric--live">
                <div className="metric-head top">
                  <span className="live-dot" aria-hidden="true" />
                  <span className="lbl">En vivo</span>
                </div>
                <div className="odo metric-value">
                  <span>{String(Math.max(liveCount, 0)).padStart(3, '0')}</span>
                  <small>+</small>
                </div>
                <span className="sub">{liveCountIsToday ? 'recargas hoy' : 'recargas'}</span>
                <div className="bar" aria-hidden="true">
                  <i />
                </div>
              </article>
              <article className="metric metric--rating">
                <div className="metric-head top">
                  <span className="lbl">Valoración</span>
                </div>
                <div className="big metric-value">
                  {(avgRating ?? 4.8).toFixed(1)}
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 3l2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-3-5.3 3 1.1-6L3.4 9.3l6-.8z" />
                  </svg>
                </div>
                <span className="sub">de clientes</span>
              </article>
              <article className="metric metric--customers">
                <div className="metric-head top">
                  <span className="lbl">Clientes</span>
                </div>
                <div className="odo metric-value">
                  {roundDownSignificant(Math.max(customers, 700)).toLocaleString('es-MX')}
                  <small>+</small>
                </div>
                <span className="sub">satisfechos</span>
                <div className="bar" aria-hidden="true">
                  <i style={{ width: '74%' }} />
                </div>
              </article>
              <article className="metric metric--delivery">
                <div className="metric-head top">
                  <span className="lbl">Entrega</span>
                </div>
                <div className="big metric-value">1 min</div>
                <span className="sub">promedio</span>
              </article>
            </section>

            <div className="offers-wrap reveal">
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

            <section className="why-wrap reveal">
              <div className="why-head">
                <h2>
                  ¿Por qué elegir {brand}? <span>La tienda que está contigo, sin límites.</span>
                </h2>
                <span className="why-mascot" aria-hidden="true">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/lu/nuevo/why-monkei.png" alt="" decoding="async" />
                </span>
              </div>
              <div className="benefits">
                <article className="benefit benefit--auto">
                  <div className="ic">
                    <IconBolt />
                  </div>
                  <h3>Recargas automáticas</h3>
                  <p>Tu pedido se procesa en segundos; la entrega ocurre al confirmarse.</p>
                </article>
                <article className="benefit benefit--secure">
                  <div className="ic">
                    <IconShield />
                  </div>
                  <h3>Pago 100 % seguro</h3>
                  <p>Tus datos viajan cifrados y no guardamos tu tarjeta.</p>
                </article>
                <article className="benefit benefit--warranty">
                  <div className="ic">
                    <IconBadge />
                  </div>
                  <h3>Garantía de por vida</h3>
                  <p>Si algo falla, lo revisamos y lo resolvemos contigo.</p>
                </article>
                <article className="benefit benefit--support">
                  <div className="ic">
                    <IconHeadset />
                  </div>
                  <h3>Soporte dedicado</h3>
                  <p>Atención real por WhatsApp en horario de tienda.</p>
                </article>
              </div>
            </section>

            <section className="steps-wrap reveal">
              <div className="steps-head">
                <h2>
                  ¿Cómo funciona? <span>Tu recarga en 4 simples pasos.</span>
                </h2>
                <span className="steps-mascot" aria-hidden="true">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/lu/nuevo/steps-monkei.png" alt="" decoding="async" />
                </span>
              </div>
              <div className="steps">
                <article className="step step--1">
                  <span className="step-index" aria-hidden="true">
                    01
                  </span>
                  <div className="ic">
                    <IconGift />
                  </div>
                  <h3>Elige tu paquete</h3>
                  <p>Selecciona el juego y la cantidad que quieres recargar.</p>
                </article>
                <article className="step step--2">
                  <span className="step-index" aria-hidden="true">
                    02
                  </span>
                  <div className="ic">
                    <IconIdCard />
                  </div>
                  <h3>Ingresa tu ID</h3>
                  <p>Escribe tu ID de jugador; verificamos antes de cobrar.</p>
                </article>
                <article className="step step--3">
                  <span className="step-index" aria-hidden="true">
                    03
                  </span>
                  <div className="ic">
                    <IconCard />
                  </div>
                  <h3>Realiza tu pago</h3>
                  <p>Tarjeta, SPEI u OXXO; el precio vigente lo confirma el servidor.</p>
                </article>
                <article className="step step--4">
                  <span className="step-index" aria-hidden="true">
                    04
                  </span>
                  <div className="ic">
                    <IconCheck />
                  </div>
                  <h3>Recibe recarga</h3>
                  <p>Te avisamos cuando la entrega queda confirmada.</p>
                </article>
              </div>
            </section>
          </div>
        </div>
      </>
  );
}
