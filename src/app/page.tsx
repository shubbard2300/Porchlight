import type React from 'react';
import Link from 'next/link';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { CommunityBoard } from '@/components/CommunityBoard';
import { HeroHouse } from '@/components/HeroHouse';
import { HouseCard } from '@/components/HouseCard';
import { Tip } from '@/components/Tip';
import { HouseMap, type MapBlock, type MapHouse, type MapNotice, type MapPitstop } from '@/components/HouseMap';
import { housesIn, placedBlocks } from '@/lib/blockStandings';
import { Icon3D, type Icon3DName } from '@/components/Icon3D';
import { StringLights, Ticker } from '@/components/StringLights';
import { forViewer, publicPin } from '@/lib/mapPins';
import { bracketsFor } from '@/lib/brackets';
import { seasonStandings } from '@/lib/seasonStandings';
import { crowdCounts } from '@/lib/crowdCounts';
import { communityCounts, myContribution } from '@/lib/communityCounts';
import { seasonTheme } from '@/lib/theme';
import { dollars } from '@/lib/pot';
import { potTotal, unpaidPledgeCents } from '@/lib/potServer';
import { contestToday, defaultSeason, getSeason, phase, phaseLabel, visibleSeasons } from '@/lib/seasons';
import { isStaff } from '@/lib/roles';

const STEPS: [Icon3DName, string, string][] = [
  ['house', 'Add your porch to the map', 'Snap your display at night and drop your pin. Every porch makes the map brighter for everyone.'],
  ['camera', 'Visit, check in and vote', 'Stop by in person, check in with your location or the porch QR sign, and score what you love. Every visit counts toward shared goals.'],
  ['people', 'Celebrate together', 'The community picks its favorites, milestones unlock for everyone who took part, and every voter keeps their XP and badges.'],
];

const potFrom = (hosts: number, sponsors: number) => [
  hosts && `${hosts} ${hosts === 1 ? 'host' : 'hosts'}`,
  sponsors && `${sponsors} ${sponsors === 1 ? 'sponsor' : 'sponsors'}`,
].filter(Boolean).join(' and ');

export default async function Home({ searchParams }: { searchParams: Promise<{ season?: string; bracket?: string }> }) {
  const today = contestToday();
  const seasons = visibleSeasons(today);
  const query = await searchParams;
  const requested = getSeason(query.season);
  const season = requested && seasons.includes(requested) ? requested : defaultSeason(today);
  const p = phase(season, today);
  const label = phaseLabel(season, today);
  const signedIn = !!(await currentUser());
  const houses = (await seasonStandings(season.key)).map((h) => forViewer(h, signedIn));
  const [pot, pledged] = await Promise.all([potTotal(season.key), unpaidPledgeCents(season.key)]);
  const brackets = bracketsFor(season.name).map((b) => ({ ...b, count: houses.filter((h) => h.bracket === b.key).length }));
  const bracket = brackets.find((b) => b.key === query.bracket && b.count > 0);
  // Inside a bracket, ranks are within that bracket: that's the race those houses are in.
  const ranked = bracket ? houses.filter((h) => h.bracket === bracket.key) : houses;

  const theme = seasonTheme(season);
  const crowd = await crowdCounts({ season: season.key });
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
    litFrom: h.litFrom,
    litUntil: h.litUntil,
    crowd: crowd[h.id] ?? 0,
  }]);
  const pitstops: MapPitstop[] = (await db.merchant.findMany({
    where: { active: true, lat: { not: null }, lng: { not: null } },
    select: { id: true, name: true, category: true, tier: true, offer: true, address: true, lat: true, lng: true },
  })).map((m) => ({ ...m, lat: m.lat!, lng: m.lng! }));
  const blocks = (await placedBlocks()).map((b) => ({ ...b, inside: housesIn(b, houses) }));
  const mapBlocks: MapBlock[] = blocks.map(({ inside, ...b }) => ({ ...b, houses: inside.length }));
  const featured = blocks.filter((b) => b.featured);
  const user = await currentUser();
  const [community, mine] = await Promise.all([communityCounts(season.key), user ? myContribution(user.id, season.key) : null]);
  const unplaced = ranked.filter((h) => h.lat === null || h.lng === null);
  // Pins still on their way: admins get a shortcut to sort them out, hosts hear where their own house stands, everyone else sees nothing.
  let notice: MapNotice | null = null;
  if (isStaff(user?.role)) {
    const waiting = await db.house.count({ where: { season: season.key, status: 'PENDING' } });
    notice = { for: 'admin', waiting, unplaced: unplaced.length, firstUnplacedId: unplaced[0]?.id ?? null };
  } else if (user) {
    const own = await db.house.findMany({ where: { season: season.key, ownerId: user.id, status: { in: ['PENDING', 'APPROVED'] } }, select: { status: true, lat: true, lng: true } });
    notice = {
      for: 'host',
      waiting: own.filter((h) => h.status === 'PENDING').length,
      unplaced: own.filter((h) => h.status === 'APPROVED' && (h.lat === null || h.lng === null)).length,
    };
  }

  return (
    <main className="wrap stack home" data-season={theme.look}>
      <Ticker items={['Built by neighbors', 'Every visit counts', 'Check in by location or porch QR', 'The community picks its favorites', 'Shared goals unlock for everyone', 'Free to join and vote']} />
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
        <div style={{ position: 'relative' }}>
          <HouseMap key={`${season.key}-${bracket?.key ?? 'all'}`} seasonKey={season.key} houses={pins} pitstops={pitstops} blocks={mapBlocks} icon={theme.icon} seasonLabel={bracket ? bracket.label : `${season.name} ${season.year}`} notice={notice} />
          {user && pins.length > 0 && <Tip id="map-pins" arrow="float">Tap a glowing pin to see the house, its photos and when the lights are on.</Tip>}
        </div>
        {pins.length > 1 && (
          <>
            <Link href={`/route?season=${season.key}`} className="btn primary" style={{ marginTop: 14 }}><Icon3D name="map" size={22} />Plan my light tour</Link>
            {user && <Tip id="route" arrow="up">Short on time? Pick a few favorites and we’ll plan the drive between them.</Tip>}
          </>
        )}
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
            {p === 'soon' && 'We’re building this year’s light map together. Add your porch early so neighbors can plan their route.'}
            {p === 'live' && `This map is made by all of us. Add your porch, visit your neighbors in person, and help the community choose its ${theme.superlative.toLowerCase()} house by ${theme.day}.`}
            {p === 'final' && 'Voting is closed. Thank you for lighting it up together. These results stay up for one week, then move to each host’s archive.'}
          </p>
          <div className="pot">
            <Icon3D name="money" size={48} />
            <div>
              {pot.paidCents > 0 ? (
                <>
                  <b className="num">{dollars(pot.paidCents)}</b>
                  <div className="muted small">
                    in the community pot from {potFrom(pot.hosts, pot.sponsors)}
                    {pledged > 0 && <> · {dollars(pledged)} more pledged</>} · <Link href="/rules">Official rules</Link>
                  </div>
                </>
              ) : (
                <>
                  <b className="num">{dollars(pledged)}</b>
                  <div className="muted small">pledged to the community pot · free to enter · <Link href="/rules">Official rules</Link></div>
                </>
              )}
            </div>
          </div>
          {p !== 'final' && (
            <div className="row" style={{ gap: 14 }}>
              <Link href="/submit" data-modal={user ? undefined : 'join:host'} className="btn primary">Add your porch</Link>
              {!user && <Link href="/join/viewer" data-modal="join:viewer" className="btn ghost">Join the vote</Link>}
            </div>
          )}
        </div>
        <HeroHouse theme={theme} />
      </section>

      <CommunityBoard counts={community} mine={mine} seasonName={season.name} signedIn={Boolean(user)} />

      {p !== 'final' && (
        <section className="stack" style={{ gap: 18 }} aria-labelledby="how">
          <h2 id="how" className="squiggle" style={{ fontSize: 'clamp(24px, 3.4vw, 34px)' }}>Three steps. One very bright neighborhood.</h2>
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

      {featured.length > 0 && (
        <section className="stack" style={{ gap: 18 }} aria-labelledby="blocks">
          <h2 id="blocks" className="squiggle" style={{ fontSize: 'clamp(24px, 3.4vw, 34px)' }}>Anchor blocks: start here</h2>
          <div className="block-grid">
            {featured.map((b) => (
              <Link key={b.id} href={`/block/${b.id}?season=${season.key}`} className="block-card">
                <span className="label">{b.inside.length} {b.inside.length === 1 ? 'house' : 'houses'} · {b.inside.reduce((n, h) => n + h.likes, 0)} likes</span>
                <b>{b.name}</b>
                <span className="small muted">{b.blurb}</span>
                {b.inside[0] && <span className="small block-lead"><Icon3D name="trophy" size={18} /> Leading: {b.inside[0].name}</span>}
              </Link>
            ))}
          </div>
        </section>
      )}

      {houses.length === 0 ? (
        <div className="empty">
          <Icon3D name="house" size={72} />
          <h2>No {season.name} houses yet</h2>
          <p className="muted">Light the first porch and the rest of the street will follow.</p>
          <Link href="/submit" data-modal={user ? undefined : 'join:host'} className="btn primary">Add your porch</Link>
        </div>
      ) : (
        <section className="stack" style={{ gap: 18 }} aria-labelledby="brightest">
          <div className="row spread">
            <h2 id="brightest" className="squiggle" style={{ fontSize: 'clamp(24px, 3.4vw, 34px)' }}>{bracket ? bracket.label : p === 'final' ? 'The community’s favorites' : 'Neighborhood favorites so far'}</h2>
            <Link href={`/leaderboard?season=${season.key}`} className="btn sm ghost"><Icon3D name="trophy" size={20} />Full leaderboard</Link>
          </div>
          <div className="grid">
            {ranked.map((h, i) => <HouseCard key={h.id} house={h} rank={i + 1} icon={theme.icon} />)}
          </div>
        </section>
      )}
    </main>
  );
}
