import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { housesIn } from '@/lib/blockStandings';
import { forViewer } from '@/lib/mapPins';
import { crowdCounts } from '@/lib/crowdCounts';
import { CROWD_LEVELS, crowdLevel } from '@/lib/crowd';
import { seasonStandings } from '@/lib/seasonStandings';
import { contestToday, phase } from '@/lib/seasons';
import { seasonCalendar } from '@/lib/seasonConfig';
import { seasonTheme } from '@/lib/theme';
import { HouseCard } from '@/components/HouseCard';
import { Icon3D } from '@/components/Icon3D';
import { isStaff } from '@/lib/roles';

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ season?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const b = await db.anchorBlock.findUnique({ where: { id: (await params).id }, select: { name: true } });
  return { title: b ? `${b.name} · Porchlight` : 'Anchor block · Porchlight' };
}

/** An anchor block's page: the houses inside its zone, a tour from here, and an invite for neighbors to join. */
export default async function BlockPage({ params, searchParams }: Props) {
  const { visibleSeasons, getSeason, defaultSeason } = await seasonCalendar();
  const { id } = await params;
  const [block, user] = await Promise.all([db.anchorBlock.findUnique({ where: { id } }), currentUser()]);
  if (!block || block.lat === null || block.lng === null || (!block.active && !isStaff(user?.role))) notFound();
  const today = contestToday();
  const seasons = visibleSeasons(today);
  const requested = getSeason((await searchParams).season);
  const season = requested && seasons.includes(requested) ? requested : defaultSeason(today);
  const theme = seasonTheme(season);
  const houses = housesIn({ ...block, lat: block.lat, lng: block.lng }, await seasonStandings(season.key)).map((h) => forViewer(h, !!user));
  const crowd = await crowdCounts({ houseIds: houses.map((h) => h.id) });
  const here = houses.reduce((n, h) => n + (crowd[h.id] ?? 0), 0);
  const likes = houses.reduce((n, h) => n + h.likes, 0);
  const open = phase(season, today) !== 'final';

  return (
    <main className="wrap stack" style={{ gap: 28 }}>
      <Link href={`/?season=${season.key}#map`} className="small">← Back to the map</Link>
      {!block.active && <p className="notice warn">This block is hidden from the public. Only admins can see this page.</p>}
      <nav className="tabs" aria-label="Holiday contests">
        {seasons.map((s) => (
          <Link key={s.key} href={`/block/${block.id}?season=${s.key}`} aria-current={s.key === season.key ? 'page' : undefined}>
            <Icon3D name={seasonTheme(s).icon} size={24} />{s.name} {s.year}
          </Link>
        ))}
      </nav>
      <div className="page-head">
        <Icon3D name="sparkles" size={72} />
        <div>
          <span className="label">Anchor block · {block.address}</span>
          <h1 style={{ fontSize: 'clamp(28px, 4.4vw, 44px)' }}>{block.name}</h1>
          <p className="muted" style={{ maxWidth: 640 }}>{block.blurb}</p>
        </div>
      </div>
      <div className="stats">
        <div className="stat"><span className="label">{season.name} houses</span><b className="num">{houses.length}</b></div>
        <div className="stat"><span className="label">Verified likes</span><b className="num">{likes}</b></div>
        <div className="stat">
          <span className="label">Checked in now</span>
          <b className="num" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><i style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid var(--ink)', background: CROWD_LEVELS[crowdLevel(here)].color }} />{here}</b>
        </div>
      </div>
      <div className="row" style={{ gap: 12 }}>
        {houses.length > 0 && <Link href={`/route?season=${season.key}&from=block:${block.id}`} className="btn primary"><Icon3D name="map" size={22} />Plan a tour from here</Link>}
        <a className="btn ghost" href={`https://www.google.com/maps/dir/?api=1&destination=${block.lat},${block.lng}`} target="_blank" rel="noopener">Directions</a>
      </div>

      {open && (
        <section className="panel row spread" style={{ gap: 16 }} aria-label="Join the block">
          <div className="row" style={{ gap: 14, flexWrap: 'nowrap' }}>
            <Icon3D name="house" size={56} />
            <div className="stack" style={{ gap: 4 }}>
              <b style={{ fontSize: 18 }}>Live on {block.name}?</b>
              <span className="muted small">Post your house so visitors touring the block can find it, score it, and help you win the pot.</span>
            </div>
          </div>
          <Link href="/submit" data-modal={user ? undefined : 'join:host'} className="btn primary">Post your house</Link>
        </section>
      )}

      {houses.length === 0 ? (
        <div className="empty">
          <Icon3D name={theme.icon} size={72} />
          <h2>No {season.name} houses on {block.name} yet</h2>
          <p className="muted">The first porch to post here leads the block.</p>
        </div>
      ) : (
        <section className="stack" style={{ gap: 18 }} aria-labelledby="block-houses">
          <h2 id="block-houses" className="squiggle" style={{ fontSize: 'clamp(24px, 3.4vw, 32px)' }}>Brightest on the block</h2>
          <div className="grid">
            {houses.map((h, i) => <HouseCard key={h.id} house={h} rank={i + 1} icon={theme.icon} />)}
          </div>
        </section>
      )}
    </main>
  );
}
