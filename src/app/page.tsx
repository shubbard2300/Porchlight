import type React from 'react';
import Link from 'next/link';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { HeroHouse } from '@/components/HeroHouse';
import { HouseMap, type MapHouse } from '@/components/HouseMap';
import { Icon3D, type Icon3DName } from '@/components/Icon3D';
import { StringLights, Ticker } from '@/components/StringLights';
import { publicPin } from '@/lib/mapPins';
import { bracketsFor, getBracket } from '@/lib/brackets';
import { seasonStandings } from '@/lib/seasonStandings';
import { seasonTheme } from '@/lib/theme';
import { contestToday, defaultSeason, getSeason, phase, phaseLabel, visibleSeasons } from '@/lib/seasons';

const STEPS: [Icon3DName, string, string][] = [
  ['house', 'Post your house', 'Snap your display at night, drop your pin, and you are on the map for the season.'],
  ['camera', 'Neighbors check in and score', 'Visitors prove they stopped by with their location or the porch QR sign, then score creativity, lighting, story and sound.'],
  ['trophy', 'Most-loved wins the pot', 'Only verified likes count. The top porch takes the prize, and every voter keeps their XP and badges.'],
];

export default async function Home({ searchParams }: { searchParams: Promise<{ season?: string; bracket?: string }> }) {
  const today = contestToday();
  const seasons = visibleSeasons(today);
  const query = await searchParams;
  const requested = getSeason(query.season);
  const season = requested && seasons.includes(requested) ? requested : defaultSeason(today);
  const p = phase(season, today);
  const label = phaseLabel(season, today);
  const houses = await seasonStandings(season.key);
  const pot = await db.house.aggregate({ where: { season: season.key, status: 'APPROVED' }, _sum: { contributionCents: true } });
  const brackets = bracketsFor(season.name).map((b) => ({ ...b, count: houses.filter((h) => h.bracket === b.key).length }));
  const bracket = brackets.find((b) => b.key === query.bracket && b.count > 0);
  // Inside a bracket, ranks are within that bracket: that's the race those houses are in.
  const ranked = bracket ? houses.filter((h) => h.bracket === bracket.key) : houses;

  const theme = seasonTheme(season);
  const pins: MapHouse[] = ranked.flatMap((h, i) => h.lat === null || h.lng === null ? [] : [{
    id: h.id,
    name: h.name,
    neighborhood: h.neighborhood,
    address: h.showExactAddress ? h.address : null,
    ...publicPin({ id: h.id, lat: h.lat, lng: h.lng, showExactAddress: h.showExactAddress }),
    exact: h.showExactAddress,
    photo: h.photoUrls[0] ?? null,
    likes: h.likes,
    rank: i + 1,
    lit: `${h.litFrom}–${h.litUntil}`,
  }]);
  const user = await currentUser();

  return (
    <main className="wrap stack" style={{ gap: 32 }}>
      <Ticker items={['Verified likes only', 'Check in by location or porch QR', 'Most-loved porch wins the pot', 'Earn XP and badges for every visit', 'Free to vote']} />
      <nav className="tabs" aria-label="Holiday contests">
        {seasons.map((s) => (
          <Link key={s.key} href={`/?season=${s.key}`} aria-current={s.key === season.key ? 'page' : undefined}>
            <Icon3D name={seasonTheme(s).icon} size={24} />{s.name} {s.year}
          </Link>
        ))}
      </nav>

      <section id="map" aria-label={`${season.name} ${season.year} house map`} style={{ scrollMarginTop: 16, minWidth: 0 }}>
        {brackets.some((b) => b.count > 0) && (
          <nav className="tabs filter-tabs" aria-label="Filter by theme" style={{ marginBottom: 14 }}>
            <Link href={`/?season=${season.key}#map`} aria-current={!bracket ? 'page' : undefined} scroll={false}><Icon3D name={theme.icon} size={22} />All themes <span className="count">{houses.length}</span></Link>
            {brackets.filter((b) => b.count > 0).map((b) => (
              <Link key={b.key} href={`/?season=${season.key}&bracket=${b.key}#map`} aria-current={bracket?.key === b.key ? 'page' : undefined} scroll={false}>
                <Icon3D name={b.icon} size={22} />{b.label} <span className="count">{b.count}</span>
              </Link>
            ))}
          </nav>
        )}
        <HouseMap key={`${season.key}-${bracket?.key ?? 'all'}`} houses={pins} icon={theme.icon} seasonLabel={bracket ? bracket.label : `${season.name} ${season.year}`} unplaced={ranked.length - pins.length} />
      </section>

      <section className="hero" style={{ '--accent': theme.roof } as React.CSSProperties}>
        <StringLights />
        <div className="hero-copy">
          <div className="row">
            <span className={`pill ${p}`}>{label.tag}</span>
            <span className="muted small">{label.line}</span>
          </div>
          <h1><span className="glow-text">{season.name}</span> {season.year}{p === 'final' ? ': final results' : ''}</h1>
          <p className="muted" style={{ maxWidth: 560, fontSize: 17 }}>
            {p === 'soon' && 'Houses are signing up now. Post yours early so neighbors can plan their route.'}
            {p === 'live' && `Visit houses, prove you were there, and like your favorites. The ${theme.superlative} house with the most verified likes at midnight on ${theme.day} wins the pot.`}
            {p === 'final' && 'Voting is closed. These results stay up for one week, then move to each poster’s archive.'}
          </p>
          <div className="pot">
            <Icon3D name="money" size={48} />
            <div>
              <b className="num">${((pot._sum.contributionCents ?? 0) / 100).toLocaleString('en-US')}</b>
              <div className="muted small">pledged to the pot by {houses.length} {houses.length === 1 ? 'house' : 'houses'}</div>
            </div>
          </div>
          {p !== 'final' && (
            <div className="row" style={{ gap: 14 }}>
              <Link href="/submit" data-modal={user ? undefined : 'join:host'} className="btn primary">Post your house</Link>
              {!user && <Link href="/join/viewer" data-modal="join:viewer" className="btn ghost">Join to vote</Link>}
            </div>
          )}
        </div>
        <HeroHouse theme={theme} />
      </section>

      {p !== 'final' && (
        <section className="stack" style={{ gap: 18 }} aria-labelledby="how">
          <h2 id="how" className="squiggle" style={{ fontSize: 'clamp(24px, 3.4vw, 34px)' }}>Three steps. One very bright street.</h2>
          <div className="steps">
            {STEPS.map(([icon, title, text], i) => (
              <div key={title} className={`panel step step-${i + 1} reveal`}>
                <div className="step-top"><span className="step-icon"><Icon3D name={icon} size={52} /></span><span aria-hidden="true" className="step-num">0{i + 1}</span></div>
                <h3>{title}</h3>
                <p className="muted">{text}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {houses.length === 0 ? (
        <div className="empty">
          <Icon3D name="house" size={72} />
          <h2>No {season.name} houses yet</h2>
          <p className="muted">Be the first pin on the map.</p>
          <Link href="/submit" data-modal={user ? undefined : 'join:host'} className="btn primary">Post your house</Link>
        </div>
      ) : (
        <section className="stack" style={{ gap: 18 }} aria-labelledby="brightest">
          <div className="row spread">
            <h2 id="brightest" className="squiggle" style={{ fontSize: 'clamp(24px, 3.4vw, 34px)' }}>{bracket ? bracket.label : p === 'final' ? 'Final standings' : 'The brightest so far'}</h2>
            <Link href={`/leaderboard?season=${season.key}`} className="btn sm ghost"><Icon3D name="trophy" size={20} />Full leaderboard</Link>
          </div>
          <div className="grid">
            {ranked.map((h, i) => (
              <article key={h.id} className={`house-card reveal${i === 0 ? ' leader' : ''}`}>
                <div className="house-photo">
                  {h.photoUrls[0] ? <img className="photo" src={h.photoUrls[0]} alt={`${h.name} at night`} loading="lazy" /> : <Icon3D name={theme.icon} size={96} />}
                  <span className="rank">{i < 3 ? <Icon3D name={i === 0 ? 'trophy' : 'medal'} size={20} /> : null}#{i + 1}</span>
                  <span className="likes num" title="Verified likes"><Icon3D name="heart" size={18} />{h.likes}</span>
                </div>
                <div className="house-body">
                  <span className="label">{[getBracket(h.bracket)?.label, h.neighborhood].filter(Boolean).join(' · ') || 'Neighborhood'}</span>
                  <h3><Link href={`/house/${h.id}`} className="card-link">{h.name}</Link></h3>
                  <p className="small muted">{h.showExactAddress ? h.address : `Near ${h.neighborhood ?? 'the neighborhood'} (exact spot shown at check-in)`} · lit {h.litFrom}–{h.litUntil}</p>
                  <p className="small">{h.description}</p>
                  {h.tags.length > 0 && <div className="row" style={{ gap: 6 }}>{h.tags.map((t) => <span key={t} className="tag">{t}</span>)}</div>}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
