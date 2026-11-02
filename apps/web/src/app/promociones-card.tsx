import Link from 'next/link';

const asset = (name: string) => `/lu/nuevo/promociones-card/${name}.svg`;

const decorations = [
  ['09543', 'promociones-card__atmosphere promociones-card__atmosphere--top-left'],
  ['e01bc', 'promociones-card__atmosphere promociones-card__atmosphere--top-right'],
  ['19acd', 'promociones-card__atmosphere promociones-card__atmosphere--bottom-left'],
  ['f2ce9', 'promociones-card__atmosphere promociones-card__atmosphere--bottom-right'],
  ['97999', 'promociones-card__panel promociones-card__panel--left-top'],
  ['20597', 'promociones-card__panel promociones-card__panel--left-edge'],
  ['df191', 'promociones-card__panel promociones-card__panel--left-bottom'],
  ['c7085', 'promociones-card__panel promociones-card__panel--left-bottom-edge'],
  ['cfcc8', 'promociones-card__panel promociones-card__panel--right-top'],
  ['5e7d2', 'promociones-card__panel promociones-card__panel--right-top-edge'],
  ['e5042', 'promociones-card__panel promociones-card__panel--right-bottom'],
  ['718c0', 'promociones-card__panel promociones-card__panel--right-bottom-edge'],
  ['cd474', 'promociones-card__panel promociones-card__panel--black-slash'],
  ['ada06', 'promociones-card__corner promociones-card__corner--top-right'],
  ['af071', 'promociones-card__corner promociones-card__corner--bottom-left'],
] as const;

export function PromocionesCard() {
  return (
    <article className="promociones-card reveal in" aria-labelledby="promociones-card-title">
      <div className="promociones-card__art" aria-hidden="true">
        {decorations.map(([name, className]) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={name} className={className} src={asset(name)} alt="" />
        ))}

        <div className="promociones-card__halftone" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="promociones-card__specular" src={asset('ab019')} alt="" />

        <div className="promociones-card__slashes">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset('66b74')} alt="" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset('66b74')} alt="" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset('66b74')} alt="" />
        </div>

        <div className="promociones-card__rim promociones-card__rim--outer" />
        <div className="promociones-card__rim promociones-card__rim--dark" />
        <div className="promociones-card__rim promociones-card__rim--inner" />
      </div>

      <span className="promociones-card__mascot" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/lu/nuevo/promo-monkei.gif" alt="" decoding="async" />
      </span>

      <div className="promociones-card__copy">
        <p className="promociones-card__eyebrow">PROMOCIONES</p>
        <h2 id="promociones-card-title">Nuevas todos los meses</h2>
        <div className="promociones-card__accent" aria-hidden="true" />
        <p className="promociones-card__description">
          Combos, packs y descuentos por temporada.
        </p>
      </div>

      <div className="promociones-card__button-glow" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset('2c9ca')} alt="" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset('3d6b8')} alt="" />
      </div>

      <Link className="promociones-card__button" href="/promociones" aria-label="Ver ofertas">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset('8d99c')} alt="" />
        <span>VER OFERTAS</span>
      </Link>
    </article>
  );
}
