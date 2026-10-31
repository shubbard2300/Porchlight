import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { forViewer } from '@/lib/mapPins';
import { votingOpen } from '@/lib/checkIns';
import { seasonCalendar } from '@/lib/seasonConfig';
import { getBracket } from '@/lib/brackets';
import { seasonStandings } from '@/lib/seasonStandings';
import { CROWD_LEVELS, crowdLevel, crowdLine } from '@/lib/crowd';
import { crowdCounts } from '@/lib/crowdCounts';
import { seasonTheme } from '@/lib/theme';
import { avatarUrl, displayName } from '@/lib/users';
import { SCORE_CATEGORIES, averageScore, formatDistance } from '@/lib/visits';
import { MIN_SQUAD_REVIEWERS, squadReview } from '@/lib/caravans';
import { BOOST_HOURS, TIERS, getCategory, nearestPitstop } from '@/lib/pitstops';
import { Icon3D } from '@/components/Icon3D';
import { critterFor } from '@/lib/hunt';
import { decorFor, forHoliday } from '@/lib/arDecor';
import { VisitPanel, type VisitState } from '@/components/VisitPanel';
import { CHECKIN_XP } from '@/lib/rewards';
import { Tip } from '@/components/Tip';
import styles from './house.module.css';
import { isStaff } from '@/lib/roles';

const FLASH: Record<string, string> = {
  'qr-first': 'Checked in with the porch sign and earned XP! Now fill in your scorecard.',
  qr: 'Checked in with the porch sign.',
  nearby: 'You’re checked in. Fill in your scorecard and leave the host a cheer.',
  'bad-code': 'That QR code doesn’t match this house. Try scanning the sign again.',
  own: 'That’s your own porch sign. It works for visitors.',
  closed: 'Voting isn’t open for this contest right now.',
  missing: 'That house isn’t in the contest.',
};

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ checkin?: string }> };

async function load(id: string) {
  return db.house.findUnique({ where: { id }, include: { owner: { select: { username: true, displayName: true } } } });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const house = await load((await params).id);
  return { title: house?.status === 'APPROVED' ? `${house.name} · Porchlight` : 'Porchlight' };
}

export default async function HousePage({ params, searchParams }: Props) {
  const { getSeason } = await seasonCalendar();
  const { id } = await params;
  const { checkin } = await searchParams;
  const [house, user] = await Promise.all([load(id), currentUser()]);
  const canPreview = user && house && (house.ownerId === user.id || isStaff(user.role));
  if (!house || (house.status !== 'APPROVED' && !canPreview)) notFound();

  const season = getSeason(house.season);
  const theme = season ? seasonTheme(season) : null;
  const verified = { houseId: id, verifiedAt: { not: null } };
  const [likes, visitors, avg, comments, myCheckIn, myVote, squadVotes, myCatch, arDecor] = await Promise.all([
    db.vote.count({ where: { ...verified, liked: true } }),
    db.checkIn.groupBy({ by: ['userId'], where: { houseId: id } }).then((g) => g.length),
    db.vote.aggregate({ where: verified, _avg: { creativity: true, lighting: true, storytelling: true, sound: true }, _count: { creativity: true } }),
    db.vote.findMany({
      where: { ...verified, comment: { not: null } },
      orderBy: { updatedAt: 'desc' },
      take: 30,
      select: { id: true, comment: true, liked: true, user: { select: { id: true, username: true, displayName: true, avatarUpdatedAt: true } } },
    }),
    user ? db.checkIn.findFirst({ where: { userId: user.id, houseId: id }, select: { id: true } }) : null,
    user ? db.vote.findUnique({ where: { userId_houseId: { userId: user.id, houseId: id } } }) : null,
    db.vote.findMany({
      where: { ...verified, caravanId: { not: null } },
      select: { liked: true, comment: true, creativity: true, lighting: true, storytelling: true, sound: true, caravan: { select: { id: true, name: true } } },
    }),
    user ? db.arCatch.findUnique({ where: { userId_houseId: { userId: user.id, houseId: id } }, select: { id: true } }) : null,
    db.arDecoration.findMany({ where: { houseId: id }, select: { kind: true } }),
  ]);
  const arProps = forHoliday(arDecor, season?.name).length;
  const critter = critterFor(house.id, season?.name);
  const open = await votingOpen(house.season);
  const squads = [...Map.groupBy(squadVotes, (v) => v.caravan!.id).values()]
    .filter((vs) => vs.length >= MIN_SQUAD_REVIEWERS)
    .map((vs) => ({ caravan: vs[0].caravan!, ...squadReview(vs) }))
    .sort((a, b) => b.reviewers - a.reviewers);

  const state: VisitState = !user ? 'guest'
    : house.ownerId === user.id ? 'own'
    : house.status !== 'APPROVED' || !open ? 'closed'
    : myCheckIn ? 'checked-in' : 'needs-checkin';
  const overall = averageScore({
    creativity: avg._avg.creativity, lighting: avg._avg.lighting, storytelling: avg._avg.storytelling, sound: avg._avg.sound,
  });
  const bracket = getBracket(house.bracket);
  const here = (await crowdCounts({ houseIds: [house.id] }))[house.id] ?? 0;
  const standings = house.status === 'APPROVED' ? await seasonStandings(house.season) : [];
  const overallPlace = standings.findIndex((h) => h.id === house.id) + 1 || null;
  const bracketPlace = bracket ? standings.filter((h) => h.bracket === bracket.key).findIndex((h) => h.id === house.id) + 1 || null : null;
  const pitstop = house.lat !== null && house.lng !== null
    ? nearestPitstop({ lat: house.lat, lng: house.lng }, await db.merchant.findMany({ where: { active: true }, select: { id: true, name: true, category: true, tier: true, offer: true, lat: true, lng: true } }))
    : null;
  // Exact addresses are for signed-in members only (see the privacy policy).
  const exact = forViewer(house, !!user).showExactAddress;
  const where = exact ? house.address
    : house.showExactAddress ? `Near ${house.neighborhood ?? 'the neighborhood'}. Sign in to see the exact address.`
    : `Near ${house.neighborhood ?? 'the neighborhood'}. The exact spot is shared when you check in.`;

  return (
    <main className="wrap stack" style={{ gap: 28 }} data-season={theme?.look}>
      <Link href={`/?season=${house.season}#map`} className="small">← Back to the {season ? `${season.name} ${season.year}` : ''} map</Link>
      {house.status !== 'APPROVED' && <p className="notice warn">Only you can see this page until the house is approved.</p>}
      <div className={styles.layout}>
        <div className="stack" style={{ gap: 24 }}>
          <div className={styles.gallery}>
            <div className={styles.hero}>
              {house.photoUrls[0] ? <img src={house.photoUrls[0]} alt={`${house.name} at night`} /> : <Icon3D name={theme?.icon ?? 'house'} size={120} />}
            </div>
            {house.photoUrls.length > 1 && (
              <div className={styles.thumbs}>
                {house.photoUrls.slice(1).map((u, i) => <a key={u} href={u} target="_blank" rel="noopener"><img src={u} alt={`${house.name}, photo ${i + 2}`} loading="lazy" /></a>)}
              </div>
            )}
          </div>
          <div className={styles.title}>
            {house.neighborhood && <span className="label">{house.neighborhood}</span>}
            <h1>{house.name}</h1>
            {(bracket || overallPlace) && (
              <div className="row" style={{ gap: 8 }}>
                {bracket && <Link href={`/?season=${house.season}&bracket=${bracket.key}#map`} className="pill chip-link"><Icon3D name={bracket.icon} size={18} />{bracket.label}{bracketPlace ? ` · #${bracketPlace}` : ''}</Link>}
                {overallPlace && <Link href={`/leaderboard?season=${house.season}`} className="pill chip-link"><Icon3D name="trophy" size={18} />#{overallPlace} overall</Link>}
              </div>
            )}
            <p className="muted">{where} · lit {house.litFrom}–{house.litUntil}</p>
            <p className="small muted">Decorated by {displayName(house.owner)}</p>
          </div>
          <p>{house.description}</p>
          {house.tags.length > 0 && <div className="row" style={{ gap: 6 }}>{house.tags.map((t) => <span key={t} className="tag">{t}</span>)}</div>}
          {exact && house.lat !== null && (
            <a className="btn ghost" style={{ justifySelf: 'start' }} href={`https://www.google.com/maps/dir/?api=1&destination=${house.lat},${house.lng}`} target="_blank" rel="noopener">
              <Icon3D name="map" size={22} />Directions
            </a>
          )}

          {squads.length > 0 && (
            <section id="squad-reviews" className="stack" aria-labelledby="squad-reviews-title" style={{ scrollMarginTop: 16 }}>
              <h2 id="squad-reviews-title" style={{ fontSize: 22 }}>Squad reviews</h2>
              <ul className={styles.squads}>
                {squads.map((q) => (
                  <li key={q.caravan.id}>
                    <div className="row spread">
                      <span className="row" style={{ gap: 8 }}><Icon3D name="people" size={26} /><b>{q.caravan.name}</b></span>
                      {q.overall !== null && <b className={styles.squadScore}>{q.overall}<span>/10</span></b>}
                    </div>
                    <span className="small muted">{q.reviewers} squadmates scored it · {q.likes} loved it{q.favorite ? ` · best at ${q.favorite.toLowerCase()}` : ''}</span>
                    {q.cheers.slice(0, 3).map((c, i) => <q key={i} className={styles.squadCheer}>{c}</q>)}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="stack" aria-labelledby="cheers">
            <h2 id="cheers" style={{ fontSize: 22 }}>Cheers from visitors</h2>
            {comments.length === 0 ? <p className="muted small">No cheers yet. Visit, check in and be the first.</p> : (
              <ul className={styles.comments}>
                {comments.map((c) => (
                  <li key={c.id} className={styles.comment}>
                    {avatarUrl(c.user) ? <img src={avatarUrl(c.user)!} alt="" className={styles.ava} /> : <span className={styles.ava} aria-hidden="true">{c.user.username[0].toUpperCase()}</span>}
                    <div>
                      <span className={styles.who}>{displayName(c.user)}{c.liked && <Icon3D name="heart" size={16} label="loved it" />}</span>
                      <p className="small">{c.comment}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className={styles.side}>
          <div className="stats">
            <div className="stat"><span className="label">Verified likes</span><b className="num">{likes}</b></div>
            <div className="stat"><span className="label">Visitors</span><b className="num">{visitors}</b></div>
          </div>
          {house.status === 'APPROVED' && (
            <p className={styles.crowd}><i style={{ background: CROWD_LEVELS[crowdLevel(here)].color }} />{crowdLine(here)}</p>
          )}
          {house.status === 'APPROVED' && house.lat !== null && <Link href={`/route?season=${house.season}&from=${house.id}`} className="btn ghost"><Icon3D name="map" size={22} />Plan a tour from here</Link>}
          {user && (house.ownerId === user.id || isStaff(user.role)) && <Link href={`/house/${house.id}/stats`} className="btn ghost"><Icon3D name="sparkles" size={22} />{house.ownerId === user.id ? 'My flex stats' : 'Host stats'}</Link>}
          {user && (house.ownerId === user.id || isStaff(user.role)) && <Link href={`/house/${house.id}/sign`} className="btn ghost"><Icon3D name="clipboard" size={22} />Print QR sign</Link>}
          <div className="panel stack" style={{ gap: 14 }}>
            <div className="row spread">
              <h2 style={{ fontSize: 20 }}>Scorecard</h2>
              <span className="muted small">{overall === null ? 'No scores yet' : `${overall} / 10 from ${avg._count.creativity} ${avg._count.creativity === 1 ? 'visitor' : 'visitors'}`}</span>
            </div>
            <div className={styles.scores}>
              {SCORE_CATEGORIES.map((c) => {
                const v = avg._avg[c.key];
                return (
                  <div key={c.key} className={styles.score}>
                    <span>{c.label}</span>
                    <span className={styles.bar}><i style={{ width: `${v ? (v / 10) * 100 : 0}%` }} /></span>
                    <b className="num">{v ? v.toFixed(1) : '–'}</b>
                  </div>
                );
              })}
            </div>
          </div>
          {state === 'needs-checkin' && <Tip id="check-in">Standing out front? Check in to unlock your scorecard. Your first check-in here earns {CHECKIN_XP} XP.</Tip>}
          <VisitPanel
            houseId={house.id}
            state={state}
            flash={checkin ? FLASH[checkin] ?? null : null}
            myVote={myVote && { liked: myVote.liked, comment: myVote.comment, creativity: myVote.creativity, lighting: myVote.lighting, storytelling: myVote.storytelling, sound: myVote.sound }}
          />
          {state === 'own' && arProps === 0 && <Tip id="ar-decor-house" news>Add virtual {season?.name ?? 'holiday'} props that visitors see through their phone camera when they visit.</Tip>}
          {(arProps > 0 || house.arGreeting || state === 'own') && (
            <Link href={arProps > 0 || house.arGreeting ? `/house/${house.id}/ar` : `/house/${house.id}/ar/edit`} className={styles.pitstop}>
              <span className={styles.pitBadge} style={{ background: 'var(--amber-soft)' }}><Icon3D name="sparkles" size={34} /></span>
              <span className="stack" style={{ gap: 2 }}>
                <span className={styles.pitLabel}>AR decorations</span>
                <b>{arProps > 0 ? `${arProps} virtual ${arProps === 1 ? 'prop' : 'props'} on this porch` : state === 'own' && !house.arGreeting ? 'Decorate your porch in AR' : 'A message floats over this porch'}</b>
                <span className="small muted">
                  {state === 'own' ? (arProps > 0 ? 'Preview what visitors see, or edit your props.' : `Add ${decorFor(season?.name).slice(0, 2).map((d) => d.name.toLowerCase()).join(', ')} and more that visitors see through their camera.`)
                    : 'Point your camera at the house to see what the host added.'}
                </span>
              </span>
            </Link>
          )}
          {house.status === 'APPROVED' && open && (
            <Link href={myCatch ? '/hunt' : `/house/${house.id}/hunt`} className={styles.pitstop}>
              <span className={styles.pitBadge} style={{ background: 'var(--lilac)' }}><Icon3D name={critter.icon} size={34} /></span>
              <span className="stack" style={{ gap: 2 }}>
                <span className={styles.pitLabel}>AR porch hunt{myCatch ? ' · caught' : ''}</span>
                <b>{critter.name} the {critter.kind} is hiding here</b>
                <span className="small muted">
                  {myCatch ? 'Already in your collection. See everyone you’ve caught.'
                    : state === 'own' ? 'Visitors can catch them with their camera after checking in.'
                    : myCheckIn ? 'You’re checked in. Open your camera and find them for XP.'
                    : 'Check in, then open your camera and find them for XP.'}
                </span>
              </span>
            </Link>
          )}
          {pitstop && (
            <Link href={`/pitstop/${pitstop.id}`} className={styles.pitstop}>
              <span className={styles.pitBadge} style={{ background: TIERS[pitstop.tier].color }}><Icon3D name={getCategory(pitstop.category).icon} size={30} /></span>
              <span className="stack" style={{ gap: 2 }}>
                <span className={styles.pitLabel}>Pitstop nearby{exact ? ` · ${formatDistance(pitstop.distanceM)}` : ''}</span>
                <b>{pitstop.name}</b>
                <span className="small">{pitstop.offer}</span>
                <span className="small muted">Scan their counter QR for {BOOST_HOURS} hours of double XP. No purchase necessary.</span>
              </span>
            </Link>
          )}
        </aside>
      </div>
    </main>
  );
}
