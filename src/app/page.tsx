import Link from 'next/link';
import { db } from '@/lib/db';
import { contestToday, defaultSeason, getSeason, phase, phaseLabel, visibleSeasons } from '@/lib/seasons';

export default async function Home({ searchParams }: { searchParams: Promise<{ season?: string }> }) {
  const today = contestToday();
  const seasons = visibleSeasons(today);
  const requested = getSeason((await searchParams).season);
  const season = requested && seasons.includes(requested) ? requested : defaultSeason(today);
  const p = phase(season, today);
  const label = phaseLabel(season, today);
  const houses = await db.house.findMany({
    where: { season: season.key, status: 'APPROVED' },
    include: { _count: { select: { votes: { where: { liked: true, verifiedAt: { not: null } } } } } },
    orderBy: { createdAt: 'asc' },
  });
  const pot = await db.house.aggregate({ where: { season: season.key, status: 'APPROVED' }, _sum: { contributionCents: true } });
  const ranked = [...houses].sort((a, b) => b._count.votes - a._count.votes);

  return (
    <main className="wrap stack" style={{ gap: 24 }}>
      <nav className="tabs" aria-label="Holiday contests">
        {seasons.map((s) => (
          <Link key={s.key} href={`/?season=${s.key}`} aria-current={s.key === season.key ? 'page' : undefined}>
            <span className="dot" style={{ background: s.color }} />{s.name} {s.year}
          </Link>
        ))}
      </nav>

      <section className="hero">
        <div className="row">
          <span className={`pill ${p}`}>{label.tag}</span>
          <span className="muted small">{label.line}</span>
        </div>
        <h1>{season.name} {season.year}{p === 'final' ? ': final results' : ''}</h1>
        <p className="muted" style={{ maxWidth: 620 }}>
          {p === 'soon' && 'Houses are signing up now. Post yours early so neighbors can plan their route.'}
          {p === 'live' && 'Visit houses, prove you were there, and like your favorites. The house with the most verified likes at midnight on the holiday wins the pot.'}
          {p === 'final' && 'Voting is closed. These results stay up for one week, then move to each poster’s archive.'}
        </p>
        <div className="row">
          <span className="label">Pot pledged</span>
          <b className="num" style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--gold)' }}>
            ${((pot._sum.contributionCents ?? 0) / 100).toLocaleString('en-US')}
          </b>
          <span className="muted small">from {houses.length} {houses.length === 1 ? 'house' : 'houses'}</span>
        </div>
        {p !== 'final' && <div><Link href="/submit" className="btn primary">Post your house</Link></div>}
      </section>

      {houses.length === 0 ? (
        <div className="empty">
          <h2>No {season.name} houses yet</h2>
          <p className="muted">Be the first pin on the map.</p>
          <Link href="/submit" className="btn primary">Post your house</Link>
        </div>
      ) : (
        <section className="grid" aria-label="Houses">
          {ranked.map((h, i) => (
            <article key={h.id} className="panel house">
              <div className="row spread">
                <span className="label">#{i + 1} · {h.neighborhood ?? 'Neighborhood'}</span>
                <span className="small num" title="Verified likes">{h._count.votes} verified</span>
              </div>
              <h3>{h.name}</h3>
              <p className="small muted">{h.showExactAddress ? h.address : `Near ${h.neighborhood ?? 'the neighborhood'} (exact spot shown at check-in)`} · lit {h.litFrom}–{h.litUntil}</p>
              <p className="small">{h.description}</p>
              {h.tags.length > 0 && <div className="row">{h.tags.map((t) => <span key={t} className="tag">{t}</span>)}</div>}
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
