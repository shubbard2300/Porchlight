// A slow strip of short lines under the header, set like a record sleeve's small print.
export function Ticker({ items }: { items: string[] }) {
  const row = items.map((t, i) => <span key={i}>{t}<i aria-hidden="true">/</i></span>);
  return (
    <div className="ticker" aria-label={items.join('. ')}>
      <div className="ticker-track" aria-hidden="true">{row}{row}</div>
    </div>
  );
}
