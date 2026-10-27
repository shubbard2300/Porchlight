import { useId } from 'react';

// Porchlight mark: a glowing bulb whose filament is a little house.
export function LogoMark({ size = 40, className }: { size?: number; className?: string }) {
  const id = useId().replace(/:/g, '');
  const glow = `lg-glow-${id}`;
  const flame = `lg-flame-${id}`;
  const soft = `lg-soft-${id}`;
  const bulb = 'M47 80 C39 73 28 64 28 49 a32 32 0 0 1 64 0 C92 64 81 73 73 80 V86 H47 Z';
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className={className} aria-hidden="true">
      <defs>
        <radialGradient id={glow} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#ffc94a" stopOpacity=".95" />
          <stop offset=".45" stopColor="#ffb000" stopOpacity=".45" />
          <stop offset="1" stopColor="#ffb000" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={flame} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe08a" />
          <stop offset=".55" stopColor="#ffb000" />
          <stop offset="1" stopColor="#ff6a1f" />
        </linearGradient>
        <filter id={soft} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      <rect width="120" height="120" rx="30" fill="#14123a" />
      <circle className="logo-halo" cx="60" cy="50" r="46" fill={`url(#${glow})`} opacity=".6" />
      <path d={bulb} fill={`url(#${flame})`} />
      <path d={bulb} fill="#ffb000" filter={`url(#${soft})`} opacity=".5" />
      <path d="M46 60 V49 L60 37 L74 49 V60" fill="none" stroke="#14123a" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M55 60 V53 h10 V60 M46 60 H74 M53 60 V80 M67 60 V80" fill="none" stroke="#14123a" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="46" y="89" width="28" height="6" rx="3" fill="#fff4e4" />
      <rect x="48" y="98" width="24" height="6" rx="3" fill="#fff4e4" />
      <path d="M53 107 h14 l-3 5 h-8 Z" fill="#fff4e4" />
    </svg>
  );
}

// "porchlight" with the dot on the i drawn as a lit bulb.
export function Wordmark() {
  return (
    <span className="wordmark">
      porchl<span className="wordmark-i">ı<span className="wordmark-dot" /></span>ght
    </span>
  );
}
