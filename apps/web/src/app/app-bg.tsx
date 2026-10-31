/** Monkei backdrop — floating 3D diamonds + sparks over the teal arena. */

type Diamond = {
  left: string;
  top: string;
  s: number;
  d: number;
  delay: string;
  tone: 'teal' | 'gold' | 'ember' | 'ice';
  drift: string;
};

const DIAMONDS: Diamond[] = [
  { left: '5%', top: '10%', s: 42, d: 16, delay: '0s', tone: 'teal', drift: '22s' },
  { left: '78%', top: '8%', s: 28, d: 13, delay: '-4s', tone: 'gold', drift: '19s' },
  { left: '88%', top: '32%', s: 34, d: 18, delay: '-2s', tone: 'ice', drift: '24s' },
  { left: '12%', top: '38%', s: 24, d: 14, delay: '-7s', tone: 'ember', drift: '17s' },
  { left: '48%', top: '22%', s: 20, d: 11, delay: '-3s', tone: 'teal', drift: '15s' },
  { left: '68%', top: '52%', s: 46, d: 20, delay: '-6s', tone: 'gold', drift: '26s' },
  { left: '22%', top: '62%', s: 30, d: 15, delay: '-1s', tone: 'ice', drift: '21s' },
  { left: '8%', top: '78%', s: 36, d: 17, delay: '-9s', tone: 'teal', drift: '23s' },
  { left: '82%', top: '72%', s: 26, d: 12, delay: '-5s', tone: 'ember', drift: '18s' },
  { left: '42%', top: '84%', s: 22, d: 14, delay: '-8s', tone: 'gold', drift: '20s' },
  { left: '58%', top: '40%', s: 18, d: 10, delay: '-2.5s', tone: 'ice', drift: '16s' },
  { left: '34%', top: '48%', s: 38, d: 19, delay: '-11s', tone: 'teal', drift: '25s' },
];

/** HEXZ-style gem: light table, orange body, purple lower-right facet. */
const DiamondFaces = () => (
  <svg className="gem-svg" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
    <polygon points="24,10 76,10 66,36 34,36" fill="url(#gemTop)" />
    <polygon points="24,10 34,36 3,36" fill="url(#gemUL)" />
    <polygon points="76,10 97,36 66,36" fill="url(#gemUR)" />
    <polygon points="3,36 34,36 50,94" fill="url(#gemLL)" />
    <polygon points="34,36 66,36 50,94" fill="url(#gemLC)" />
    <polygon points="66,36 97,36 50,94" fill="url(#gemLR)" />
    <path
      d="M24 10 L76 10 L97 36 L50 94 L3 36 Z M3 36 L97 36 M34 36 L50 94 L66 36 M24 10 L34 36 M76 10 L66 36"
      fill="none"
      stroke="rgba(255,255,255,.38)"
      strokeWidth="1"
      strokeLinejoin="round"
    />
    <polygon points="38,15 52,15 47,26 36,26" fill="rgba(255,255,255,.55)" />
  </svg>
);

function GemDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="gemTop" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff0d6" />
          <stop offset="1" stopColor="#ffc47e" />
        </linearGradient>
        <linearGradient id="gemUL" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffc27a" />
          <stop offset="1" stopColor="#f59a3a" />
        </linearGradient>
        <linearGradient id="gemUR" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f7a444" />
          <stop offset="1" stopColor="#e07a1a" />
        </linearGradient>
        <linearGradient id="gemLL" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f28f2a" />
          <stop offset="1" stopColor="#c9610d" />
        </linearGradient>
        <linearGradient id="gemLC" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffb04f" />
          <stop offset="1" stopColor="#e8801c" />
        </linearGradient>
        <linearGradient id="gemLR" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8a4ad8" />
          <stop offset="1" stopColor="#3b1a86" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function DiamondNode({ d }: { d: Diamond }) {
  return (
    <i
      className={`d3 tone-${d.tone}`}
      style={{
        left: d.left,
        top: d.top,
        ['--s' as string]: `${d.s}px`,
        ['--spin' as string]: `${d.d}s`,
        ['--drift' as string]: d.drift,
        animationDelay: d.delay,
      }}
    >
      <span className="d3-orbit">
        <span className="d3-gem">
          <DiamondFaces />
        </span>
      </span>
    </i>
  );
}

type SweepDiamond = { s: number; spin: string; bob: string; sweep: string; delay: string };

// A larger, amber/purple-faceted diamond that actually travels across the
// screen (vs. the teal/gold/ember/ice field above, which only bobs in place)
// — matches the HEXZ reference's hero diamond, drifting slowly bottom-left
// to top-right on a multi-point path so the motion reads as organic rather
// than a mechanical straight line.
const SWEEP_DIAMONDS: SweepDiamond[] = [
  { s: 64, spin: '22s', bob: '13s', sweep: '78s', delay: '0s' },
  { s: 44, spin: '17s', bob: '10s', sweep: '96s', delay: '-46s' },
];

function SweepDiamondNode({ d }: { d: SweepDiamond }) {
  return (
    <i
      className="d3-sweep tone-amber"
      style={{
        ['--s' as string]: `${d.s}px`,
        ['--spin' as string]: d.spin,
        ['--bob' as string]: d.bob,
        ['--sweep' as string]: d.sweep,
        animationDelay: d.delay,
      }}
    >
      <span className="d3-orbit">
        <span className="d3-gem">
          <DiamondFaces />
        </span>
      </span>
    </i>
  );
}

export function AppBg() {
  return (
    <div className="appbg" aria-hidden="true">
      <GemDefs />
      <div className="layer diamonds3d">
        {DIAMONDS.map((d, i) => (
          <DiamondNode key={i} d={d} />
        ))}
        {SWEEP_DIAMONDS.map((d, i) => (
          <SweepDiamondNode key={i} d={d} />
        ))}
      </div>
      <div className="layer sparks">
        <i style={{ left: '16%', top: '24%', ['--s' as string]: '12px', ['--d' as string]: '4.2s' }} />
        <i style={{ left: '62%', top: '14%', ['--s' as string]: '9px', ['--d' as string]: '5.4s', animationDelay: '-1.4s' }} />
        <i style={{ left: '82%', top: '48%', ['--s' as string]: '14px', ['--d' as string]: '3.8s', animationDelay: '-2.2s' }} />
        <i style={{ left: '28%', top: '54%', ['--s' as string]: '10px', ['--d' as string]: '6.1s', animationDelay: '-.8s' }} />
        <i style={{ left: '48%', top: '78%', ['--s' as string]: '11px', ['--d' as string]: '4.8s', animationDelay: '-3s' }} />
        <i style={{ left: '92%', top: '70%', ['--s' as string]: '8px', ['--d' as string]: '5.2s', animationDelay: '-1s' }} />
        <i style={{ left: '6%', top: '80%', ['--s' as string]: '13px', ['--d' as string]: '4.4s', animationDelay: '-2.6s' }} />
        <i style={{ left: '70%', top: '34%', ['--s' as string]: '9px', ['--d' as string]: '5.8s', animationDelay: '-3.6s' }} />
      </div>
    </div>
  );
}
