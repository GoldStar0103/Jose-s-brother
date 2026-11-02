import Link from 'next/link';

/**
 * Featured offer card from the Figma Make "Diamond Offer Card" export.
 * Visuals are a single composite PNG; the CTA is an invisible hit target
 * over "COMPRAR AHORA" that routes to the real buy flow.
 */
export function DiamondOfferCard({
  href,
  diamondsLabel,
  priceLabel,
  titleId = 'oferta',
  className = '',
}: {
  href: string;
  diamondsLabel: string;
  priceLabel: string;
  titleId?: string;
  className?: string;
}) {
  const label = `Oferta especial: ${diamondsLabel} diamantes por ${priceLabel}`;

  return (
    <article
      className={`doc-card ${className}`.trim()}
      aria-labelledby={titleId}
      aria-label={label}
    >
      <h2 id={titleId} className="sr-only">
        {label}
      </h2>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="doc-card-art"
        src="/lu/nuevo/diamond-offer-card.png?v=2"
        alt=""
        width={1127}
        height={1396}
        decoding="async"
        fetchPriority="high"
        draggable={false}
      />
      <span className="doc-card-mark" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/lu/nuevo/header-monkey.png"
          alt=""
          decoding="async"
          draggable={false}
        />
      </span>
      <span className="doc-card-mascot" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/lu/nuevo/hero-monkei-diamond.gif"
          alt=""
          decoding="async"
          draggable={false}
        />
      </span>
      <Link
        href={href}
        className="doc-card-cta"
        aria-label={`Comprar ahora: ${diamondsLabel} diamantes por ${priceLabel}`}
      >
        <span className="sr-only">Comprar ahora</span>
      </Link>
    </article>
  );
}
