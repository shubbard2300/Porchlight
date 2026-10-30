import type { Metadata } from 'next';
import Link from 'next/link';
import { bracketsFor, getBracket } from '@/lib/brackets';
import { seasonStandings, type HouseStanding } from '@/lib/seasonStandings';
import { contestToday, defaultSeason, getSeason, phase, phaseLabel, visibleSeasons } from '@/lib/seasons';
import { seasonTheme } from '@/lib/theme';
import { Icon3D, type Icon3DName } from '@/components/Icon3D';
import styles from './leaderboard.module.css';

export const metadata: Metadata = { title: 'Leaderboard · Porchlight' };

const PODIUM = 3;

export default async function Leaderboard({ searchParams }: { searchParams: Promise<{ season?: string }> }) {
  const today = contestToday();
  const seasons = visibleSeasons(today);
  const requested = getSeason((await searchParams).season);
  const season = requested && seasons.includes(requested) ? requested : defaultSeason(today);
  const theme = seasonTheme(season);
  const houses = await seasonStandings(season.key);
  const label = phaseLabel(season, today);
  const unbracketed = houses.filter((h) => !getBracket(h.bracket));

  return (
    <main className="wrap stack" style={{ gap: 30 }} data-season={theme.look}>
      <nav className="tabs" aria-label="Holiday contests">
        {seasons.map((s) => (
          <Link key={s.key} href={`/leaderboard?season=${s.key}`} aria-current={s.key === season.key ? 'page' : undefined}>
            <Icon3D name={seasonTheme(s).icon} size={24} />{s.name} {s.year}
          </Link>
        ))}
      </nav>
      <div className="page-head">
        <Icon3D name="trophy" size={72} />
        <div>
          <span className="label">{label.tag} · {label.line}</span>
          <h1 style={{ fontSize: 'clamp(28px, 4.4vw, 40px)' }}>{season.name} {season.year} leaderboard</h1>
          <p className="muted">Ranked by verified likes from visitors who checked in. Ties go to the higher scorecard average.</p>
        </div>
      </div>

      {houses.length === 0 ? (
        <div className="empty"><Icon3D name={theme.icon} size={72} /><h2>No houses yet</h2><p className="muted">{phase(season, today) === 'soon' ? 'Submissions are coming in. Check back when voting opens.' : 'Be the first on the board.'}</p></div>
      ) : (
        <>
          <section className="stack" aria-labelledby="overall">
            <h2 id="overall" className="squiggle" style={{ fontSize: 'clamp(22px, 3vw, 30px)' }}>Overall: the pot race</h2>
            <ol className={styles.list}>{houses.slice(0, 10).map((h, i) => <Entry key={h.id} h={h} place={i + 1} showBracket />)}</ol>
          </section>

          <section className="stack" aria-labelledby="by-bracket">
            <h2 id="by-bracket" className="squiggle" style={{ fontSize: 'clamp(22px, 3vw, 30px)' }}>Bracket champions</h2>
            <div className={styles.podiums}>
              {bracketsFor(season.name).map((b) => {
                const inBracket = houses.filter((h) => h.bracket === b.key);
                return (
                  <div key={b.key} className={styles.bracket}>
                    <div className={styles.bracketHead}>
                      <Icon3D name={b.icon} size={40} />
                      <div><h3>{b.label}</h3><p>{b.blurb}</p></div>
                    </div>
                    {inBracket.length === 0
                      ? <p className={styles.empty}>No submissions yet. <Link href="/submit">Claim this bracket</Link></p>
                      : <ol className={styles.list}>{inBracket.slice(0, PODIUM).map((h, i) => <Entry key={h.id} h={h} place={i + 1} />)}</ol>}
                    {inBracket.length > PODIUM && <Link href={`/?season=${season.key}&bracket=${b.key}#map`} className="small">See all {inBracket.length} on the map</Link>}
                  </div>
                );
              })}
            </div>
            {unbracketed.length > 0 && <p className="small muted">{unbracketed.length} {unbracketed.length === 1 ? 'house hasn’t' : 'houses haven’t'} picked a bracket yet, so {unbracketed.length === 1 ? 'it counts' : 'they count'} only in the overall race.</p>}
          </section>
        </>
      )}
    </main>
  );
}

const MEDALS: Record<number, Icon3DName> = { 1: 'trophy', 2: 'medal', 3: 'medal' };

function Entry({ h, place, showBracket }: { h: HouseStanding; place: number; showBracket?: boolean }) {
  const b = getBracket(h.bracket);
  return (
    <li>
      <Link href={`/house/${h.id}`} className={`${styles.entry}${place === 1 ? ` ${styles.lead}` : ''}`}>
        <span className={styles.place}>{MEDALS[place] ? <Icon3D name={MEDALS[place]} size={26} label={`#${place}`} /> : place}</span>
        {h.photoUrls[0] ? <img src={h.photoUrls[0]} alt="" className={styles.thumb} loading="lazy" /> : <span className={styles.thumb} aria-hidden="true"><Icon3D name={b?.icon ?? 'house'} size={24} /></span>}
        <span>
          <span className={styles.name}>{h.name}</span>
          <span className={styles.sub}>{[showBracket ? b?.label : null, h.neighborhood].filter(Boolean).join(' · ')}</span>
        </span>
        <span className={styles.nums}>
          <span className="num"><Icon3D name="heart" size={16} />{h.likes}</span>
          <span className="num muted">{h.avgScore === null ? 'no scores' : `${h.avgScore} / 10`}</span>
        </span>
      </Link>
    </li>
  );
}
