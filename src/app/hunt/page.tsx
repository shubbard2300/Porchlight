import type { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { CRITTERS, getCritter } from '@/lib/hunt';
import { contestToday, defaultSeason, getSeason, visibleSeasons } from '@/lib/seasons';
import { Icon3D } from '@/components/Icon3D';
import { AR_CATCH_XP } from '@/lib/rewards';

export const metadata: Metadata = { title: 'My critter collection · Porchlight' };

/** Every AR critter you've caught this season, the set still to find, and how many porches are left. */
export default async function Collection({ searchParams }: { searchParams: Promise<{ season?: string }> }) {
  const user = await requireUser('/hunt');
  const today = contestToday();
  const seasons = visibleSeasons(today);
  const requested = getSeason((await searchParams).season);
  const season = requested && seasons.includes(requested) ? requested : defaultSeason(today);
  const [catches, porches] = await Promise.all([
    db.arCatch.findMany({ where: { userId: user.id, season: season.key }, orderBy: { createdAt: 'desc' }, include: { house: { select: { id: true, name: true, neighborhood: true } } } }),
    db.house.count({ where: { season: season.key, status: 'APPROVED', ownerId: { not: user.id } } }),
  ]);
  const set = CRITTERS[season.name] ?? [];
  const kinds = new Set(catches.map((c) => c.critter));

  return (
    <main className="wrap stack" style={{ gap: 24, maxWidth: 860 }}>
      <nav className="tabs" aria-label="Contest">
        {seasons.map((s) => <Link key={s.key} href={`/hunt?season=${s.key}`} aria-current={s.key === season.key ? 'page' : undefined}>{s.name} {s.year}</Link>)}
      </nav>
      <header className="stack" style={{ gap: 6 }}>
        <span className="label">AR porch hunt</span>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 40px)' }}>My critter collection</h1>
        <p className="muted">Every porch hides a critter. Check in, open your camera, and catch it for +{AR_CATCH_XP} XP. You&apos;ve found <b className="num">{catches.length}</b> of <b className="num">{porches}</b> this {season.name}.</p>
        <div className="xpbar" aria-hidden="true"><i style={{ width: `${porches ? Math.min(100, (catches.length / porches) * 100) : 0}%` }} /></div>
      </header>

      {set.length > 0 && (
        <section className="stack" style={{ gap: 12 }} aria-labelledby="set">
          <h2 id="set" style={{ fontSize: 20 }}>The {season.name} set · {set.filter((c) => kinds.has(c.key)).length} of {set.length}</h2>
          <ul className="critter-set">
            {set.map((c) => (
              <li key={c.key} className={kinds.has(c.key) ? 'got' : ''}>
                <Icon3D name={c.icon} size={64} label={kinds.has(c.key) ? c.name : 'Not found yet'} />
                <b>{kinds.has(c.key) ? c.name : '???'}</b>
                <span className="small muted">{kinds.has(c.key) ? c.kind : 'Still hiding'}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="stack" style={{ gap: 12 }} aria-labelledby="caught">
        <h2 id="caught" style={{ fontSize: 20 }}>Caught</h2>
        {catches.length === 0 ? (
          <div className="empty">
            <Icon3D name="ghost" size={72} />
            <p className="muted">Nothing caught yet. Plan a route, check in at a porch, and look for its critter.</p>
            <Link href={`/route?season=${season.key}`} className="btn primary">Plan my light tour</Link>
          </div>
        ) : (
          <ul className="catch-list">
            {catches.map((c) => {
              const k = getCritter(c.critter);
              return (
                <li key={c.id}>
                  {k && <Icon3D name={k.icon} size={40} />}
                  <span className="stack" style={{ gap: 2 }}>
                    <b>{k?.name ?? 'A critter'}</b>
                    <span className="small muted">{c.house ? <Link href={`/house/${c.house.id}`}>{c.house.name}</Link> : 'A past porch'} · {c.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Los_Angeles' })}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
