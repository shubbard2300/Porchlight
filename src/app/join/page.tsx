import Link from 'next/link';

export const metadata = { title: 'Join Porchlight' };

export default function JoinPage() {
  return (
    <main className="wrap stack" style={{ maxWidth: 860, gap: 24 }}>
      <div className="stack" style={{ gap: 8, textAlign: 'center', justifyItems: 'center' }}>
        <span className="label">Join Porchlight</span>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', lineHeight: 1.05 }}>How do you want to light up the season?</h1>
        <p className="muted" style={{ maxWidth: 520 }}>Pick one to start. You can become a host later from your profile.</p>
      </div>
      <div className="choices">
        <Link href="/join/viewer" className="choice">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></svg>
          <span className="label">Viewer / rater</span>
          <h2>I want to find and rate houses</h2>
          <p className="muted">Browse the map, swipe on displays, and prove your visits to earn XP, badges and rewards.</p>
          <span className="go">Sign up as a viewer →</span>
        </Link>
        <Link href="/join/host" className="choice host">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11 12 4l8 7v9H4z" /><path d="M10 20v-5h4v5" /></svg>
          <span className="label">Host / decorator</span>
          <h2>I decorate my house</h2>
          <p className="muted">Put your display on the map, collect verified likes from visitors, and compete for the pot.</p>
          <span className="go">Sign up as a host →</span>
        </Link>
      </div>
      <p className="small muted" style={{ textAlign: 'center' }}>Already joined? <Link href="/login">Log in</Link></p>
    </main>
  );
}
