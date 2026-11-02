/** Monkei backdrop — floating cyan 3D diamonds + sparks over the teal arena. */

type Diamond = {
  left: string;
  top: string;
  s: number;
  d: number;
  delay: string;
  drift: string;
};

const DIAMONDS: Diamond[] = [
  { left: '5%', top: '10%', s: 42, d: 16, delay: '0s', drift: '22s' },
  { left: '78%', top: '8%', s: 28, d: 13, delay: '-4s', drift: '19s' },
  { left: '88%', top: '32%', s: 34, d: 18, delay: '-2s', drift: '24s' },
  { left: '12%', top: '38%', s: 24, d: 14, delay: '-7s', drift: '17s' },
  { left: '48%', top: '22%', s: 20, d: 11, delay: '-3s', drift: '15s' },
  { left: '68%', top: '52%', s: 46, d: 20, delay: '-6s', drift: '26s' },
  { left: '22%', top: '62%', s: 30, d: 15, delay: '-1s', drift: '21s' },
  { left: '8%', top: '78%', s: 36, d: 17, delay: '-9s', drift: '23s' },
  { left: '82%', top: '72%', s: 26, d: 12, delay: '-5s', drift: '18s' },
  { left: '42%', top: '84%', s: 22, d: 14, delay: '-8s', drift: '20s' },
  { left: '58%', top: '40%', s: 18, d: 10, delay: '-2.5s', drift: '16s' },
  { left: '34%', top: '48%', s: 38, d: 19, delay: '-11s', drift: '25s' },
];

/** Faceted gem: sky-blue → deep-blue — matches the hero card's blue diamante. */
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
          <stop offset="0" stopColor="#eafdff" />
          <stop offset="1" stopColor="#8fe9ff" />
        </linearGradient>
        <linearGradient id="gemUL" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8fe3ff" />
          <stop offset="1" stopColor="#3cc6f5" />
        </linearGradient>
        <linearGradient id="gemUR" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5fd0ff" />
          <stop offset="1" stopColor="#1f9fe0" />
        </linearGradient>
        <linearGradient id="gemLL" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#38b6ec" />
          <stop offset="1" stopColor="#1670ac" />
        </linearGradient>
        <linearGradient id="gemLC" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5cc9fb" />
          <stop offset="1" stopColor="#1a7fc0" />
        </linearGradient>
        <linearGradient id="gemLR" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1f88c7" />
          <stop offset="1" stopColor="#0a3a5c" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function DiamondNode({ d }: { d: Diamond }) {
  return (
    <i
      className="d3"
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

const SWEEP_DIAMONDS: SweepDiamond[] = [
  { s: 64, spin: '22s', bob: '13s', sweep: '78s', delay: '0s' },
  { s: 44, spin: '17s', bob: '10s', sweep: '96s', delay: '-46s' },
];

function SweepDiamondNode({ d }: { d: SweepDiamond }) {
  return (
    <i
      className="d3-sweep"
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
