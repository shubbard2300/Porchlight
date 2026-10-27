// A swag of twinkling holiday bulbs draped across the top of a dark panel.
const COLORS = ['#ffb000', '#ff4d8d', '#b9a6ff', '#ff6a1f', '#1e9e6a', '#fff4e4'];

export function StringLights({ count = 18 }: { count?: number }) {
  const bulbs = Array.from({ length: count }, (_, i) => {
    const t = (i + 0.5) / count;
    // Follow the wire: two quadratic sags, each dipping 26px at its middle.
    const u = t < 0.5 ? t * 2 : t * 2 - 1;
    return { left: `${t * 100}%`, top: 14 + 104 * u * (1 - u), color: COLORS[i % COLORS.length], delay: `${-((i * 0.37) % 2.4).toFixed(2)}s` };
  });
  return (
    <div className="string-lights" aria-hidden="true">
      <svg viewBox="0 0 1000 70" preserveAspectRatio="none">
        <path d="M0 14 Q250 66 500 14 Q750 66 1000 14" fill="none" stroke="#3b377a" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
      </svg>
      {bulbs.map((b, i) => (
        <span key={i} className="sl-bulb" style={{ left: b.left, top: b.top, background: b.color, color: b.color, animationDelay: b.delay }} />
      ))}
    </div>
  );
}

export function Ticker({ items }: { items: string[] }) {
  const row = items.map((t, i) => <span key={i}>{t}<i aria-hidden="true">✦</i></span>);
  return (
    <div className="ticker" aria-label={items.join('. ')}>
      <div className="ticker-track" aria-hidden="true">{row}{row}</div>
    </div>
  );
}
