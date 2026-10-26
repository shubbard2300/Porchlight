import Link from 'next/link';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { contestToday, getSeason, phase, phaseLabel } from '@/lib/seasons';

const LEVELS: [number, string][] = [[0, 'Candle'], [150, 'Lantern'], [400, 'Porchlight'], [800, 'Beacon'], [1400, 'Lighthouse'], [2200, 'Aurora']];

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ welcome?: string; submitted?: string }> }) {
  const user = await requireUser('/account');
  const { welcome, submitted } = await searchParams;
  const houses = await db.house.findMany({ where: { ownerId: user.id }, orderBy: { createdAt: 'desc' } });
  const today = contestToday();
  const lvl = LEVELS.filter(([t]) => user.xp >= t).length - 1;
  const withSeason = houses.map((h) => ({ h, s: getSeason(h.season) }));
  const active = withSeason.filter(({ s }) => s && phase(s, today) !== 'expired');
  const archived = withSeason.filter(({ s }) => !s || phase(s, today) === 'expired');

  return (
    <main className="wrap stack" style={{ maxWidth: 760 }}>
      {welcome && <p className="notice">Welcome to Porchlight, {user.name}. Your 100 XP signup bonus is in.</p>}
      {submitted && <p className="notice">Thanks! Your house is in review. We&apos;ll email you when it&apos;s live.</p>}
      <div className="row spread">
        <div className="stack" style={{ gap: 4 }}>
          <span className="label">Level {lvl + 1} · {LEVELS[lvl][1]}</span>
          <h1 style={{ fontSize: 32 }}>{user.name}</h1>
          <span className="muted small">{user.email}</span>
        </div>
        <Link href="/submit" className="btn primary">Post a house</Link>
      </div>
      <div className="stats">
        <div className="stat"><span className="label">XP</span><b className="num">{user.xp}</b></div>
        <div className="stat"><span className="label">Houses posted</span><b className="num">{houses.length}</b></div>
        <div className="stat"><span className="label">Invite code</span><b className="num" style={{ fontSize: 20, fontFamily: 'var(--font-mono)' }}>{user.referralCode}</b></div>
      </div>

      <section className="stack">
        <h2 style={{ fontSize: 22 }}>My houses</h2>
        {active.length === 0 ? <p className="muted">Nothing posted for the current contests yet.</p> : active.map(({ h, s }) => (
          <div key={h.id} className="panel row spread">
            <div><b>{h.name}</b><div className="small muted">{s!.name} {s!.year} · {phaseLabel(s!, today).tag}</div>{h.reviewNote && <div className="small muted">Note: {h.reviewNote}</div>}</div>
            <span className={`pill ${h.status}`}>{h.status === 'PENDING' ? 'In review' : h.status === 'APPROVED' ? 'Live' : 'Not approved'}</span>
          </div>
        ))}
      </section>

      <section className="stack">
        <h2 style={{ fontSize: 22 }}>Archive</h2>
        <p className="small muted">Contests leave the public map one week after the holiday. Your past entries stay here.</p>
        {archived.length === 0 ? <p className="muted small">No past contests yet.</p> : archived.map(({ h, s }) => (
          <div key={h.id} className="panel row spread">
            <div><b>{h.name}</b><div className="small muted">{s ? `${s.name} ${s.year}` : h.season}</div></div>
            <span className="pill">Archived</span>
          </div>
        ))}
      </section>
    </main>
  );
}
