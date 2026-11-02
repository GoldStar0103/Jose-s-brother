import Link from 'next/link';

function DotField({ className }: { className: string }) {
  return <div aria-hidden="true" className={`nsc-dot-field ${className}`} />;
}

function digitChars(count: number): string[] {
  const raw = String(Math.max(count, 169357));
  return raw.length > 3 ? `${raw.slice(0, -3)}.${raw.slice(-3)}`.split('') : raw.split('');
}

export function NeonSupportCard({
  processedCount,
  className = '',
}: {
  processedCount: number;
  className?: string;
}) {
  const chars = digitChars(processedCount);

  return (
    <section
      className={`nsc-card reveal in ${className}`.trim()}
      aria-label="Soporte para recargas"
    >
      <div aria-hidden="true" className="nsc-wedge" />
      <div aria-hidden="true" className="nsc-slashes" />
      <div aria-hidden="true" className="nsc-orb" />
      <div aria-hidden="true" className="nsc-swoosh" />
      <DotField className="nsc-dots-top-left" />
      <DotField className="nsc-dots-bottom-left" />
      <DotField className="nsc-dots-right" />

      <span className="nsc-mascot" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/lu/nuevo/supt-monkei.gif" alt="" decoding="async" />
      </span>

      <div className="nsc-content">
        <div className="nsc-status-pill">
          <span aria-hidden="true" className="nsc-status-light" />
          <span>SOPORTE</span>
        </div>

        <h2>
          ¿Tuviste algún problema
          <br />
          con tu <strong>compra?</strong>
        </h2>

        <p className="nsc-copy">Escríbenos por el chat y lo resolvemos.</p>
        <div aria-hidden="true" className="nsc-copy-underline" />

        <Link className="nsc-button" href="/soporte" aria-label="Hablar con soporte">
          <span aria-hidden="true" className="nsc-chat-icon">
            <i />
            <i />
            <i />
          </span>
          <span aria-hidden="true" className="nsc-button-divider" />
          <span className="nsc-button-label">HABLAR CON SOPORTE</span>
          <span aria-hidden="true" className="nsc-button-arrow">
            ›
          </span>
        </Link>
      </div>

      <footer className="nsc-activity">
        <div className="nsc-activity-label">
          <span aria-hidden="true" className="nsc-bolt" />
          <p>
            <span>RECARGAS</span>
            <strong>PROCESADAS</strong>
          </p>
        </div>

        <span aria-hidden="true" className="nsc-activity-divider" />

        <div className="nsc-counter" aria-label={`${Math.max(processedCount, 169357)} recargas procesadas`}>
          {chars.map((ch, index) =>
            ch === '.' ? (
              <span className="nsc-counter-dot" key={`d-${index}`}>
                .
              </span>
            ) : (
              <span className="nsc-counter-digit" key={`d-${index}`}>
                {ch}
              </span>
            ),
          )}
          <span className="nsc-counter-plus">+</span>
        </div>

        <div className="nsc-live">
          <span aria-hidden="true" className="nsc-live-light" />
          <span>EN VIVO</span>
        </div>
      </footer>
    </section>
  );
}
