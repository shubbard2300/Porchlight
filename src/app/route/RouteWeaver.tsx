'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Icon3D, type Icon3DName } from '@/components/Icon3D';
import { CROWD_LEVELS, crowdLevel } from '@/lib/crowd';
import { BOOST_HOURS, TIERS, type Tier } from '@/lib/pitstops';
import { MODES, TIME_CHOICES, addPitstop, appleStopUrl, googleRouteUrl, planRoute, withLegs, type Point, type TravelMode } from '@/lib/routeWeaver';
import styles from './route.module.css';

export type RouteHouse = Point & {
  id: string; name: string; bracket: string | null; neighborhood: string | null; address: string | null;
  exact: boolean; rank: number; likes: number; avgScore: number | null; value: number; crowd: number; lit: string;
};
export type RoutePitstop = Point & { id: string; name: string; tier: Tier; offer: string };
type Stop = (RouteHouse & { kind: 'house' }) | (RoutePitstop & { kind: 'pitstop' });

const fmtMin = (m: number) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ''}`);
const houseCount = (stops: { kind: string }[]) => stops.filter((s) => s.kind === 'house').length;
const fmtKm = (km: number) => (km < 1 ? `${Math.round(km * 1000 / 10) * 10} m` : `${km.toFixed(1)} km`);

export function RouteWeaver({ houses, pitstops, blocks, brackets, seasonIcon, initialFrom }: {
  houses: RouteHouse[]; pitstops: RoutePitstop[]; blocks: (Point & { id: string; name: string })[]; brackets: { key: string; label: string; icon: Icon3DName }[];
  seasonIcon: Icon3DName; initialFrom?: string;
}) {
  const [from, setFrom] = useState<string>(initialFrom ?? '');
  const [here, setHere] = useState<Point | null>(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [minutes, setMinutes] = useState<number>(60);
  const [mode, setMode] = useState<TravelMode>('driving');
  const [bracket, setBracket] = useState('');
  const [withPitstop, setWithPitstop] = useState(pitstops.length > 0);

  const startHouse = houses.find((h) => h.id === from);
  const startBlock = blocks.find((b) => `block:${b.id}` === from);
  const start: Point | null = from === 'here' ? here : startHouse ?? startBlock ?? null;

  const plan = useMemo(() => {
    if (!start) return null;
    const pool = houses.filter((h) => h.id !== startHouse?.id && (!bracket || h.bracket === bracket));
    const base = planRoute(start, pool.map((h) => ({ ...h, kind: 'house' as const })), minutes, mode);
    let stops: Stop[] = base.stops;
    let pitstop: RoutePitstop | null = null;
    if (withPitstop) {
      const added = addPitstop(start, base.stops, pitstops.map((p) => ({ ...p, kind: 'pitstop' as const })), minutes, mode);
      stops = added.stops;
      pitstop = added.pitstop;
    }
    return { ...withLegs(start, stops, mode), pitstop };
  }, [start, startHouse?.id, houses, pitstops, bracket, minutes, mode, withPitstop]);

  const locate = () => {
    setError(null);
    if (!('geolocation' in navigator)) return setError('This browser can’t share its location. Pick a house to start from instead.');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLocating(false); setHere({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setFrom('here'); },
      () => { setLocating(false); setError('We couldn’t get your location. Check that location is allowed for this site, or pick a house to start from.'); },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 120000 },
    );
  };

  return (
    <div className={styles.layout}>
      <section className={`panel stack ${styles.controls}`} aria-label="Route options">
        <div className="stack" style={{ gap: 10 }}>
          <h2 className={styles.step}><span>1</span>Where are you starting?</h2>
          <button type="button" className={`btn ${from === 'here' ? 'primary' : 'ghost'}`} onClick={locate} disabled={locating}>
            <Icon3D name="pin" size={22} />{locating ? 'Finding you…' : from === 'here' ? 'Using my location' : 'Use my location'}
          </button>
          <label className="small muted" htmlFor="route-from">or start at {blocks.length ? 'an anchor block or a house' : 'a house'}</label>
          <select id="route-from" value={from === 'here' ? '' : from} onChange={(e) => setFrom(e.target.value)}>
            <option value="">{blocks.length ? 'Choose a block or house…' : 'Choose a house…'}</option>
            {blocks.length > 0 && (
              <optgroup label="Anchor blocks">
                {blocks.map((b) => <option key={b.id} value={`block:${b.id}`}>{b.name}</option>)}
              </optgroup>
            )}
            <optgroup label="Houses">
              {houses.map((h) => <option key={h.id} value={h.id}>{h.name}{h.neighborhood ? ` · ${h.neighborhood}` : ''}</option>)}
            </optgroup>
          </select>
          {error && <p className="err small" role="alert">{error}</p>}
          <p className="small muted">Your location stays in your browser. Porchlight never stores it.</p>
        </div>

        <div className="stack" style={{ gap: 10 }}>
          <h2 className={styles.step}><span>2</span>How long do you have?</h2>
          <div className="chips" role="radiogroup" aria-label="Time">
            {TIME_CHOICES.map((t) => (
              <span key={t}>
                <input type="radio" id={`time-${t}`} name="time" checked={minutes === t} onChange={() => setMinutes(t)} />
                <label htmlFor={`time-${t}`}>{fmtMin(t)}</label>
              </span>
            ))}
          </div>
        </div>

        <div className="stack" style={{ gap: 10 }}>
          <h2 className={styles.step}><span>3</span>Walking or driving?</h2>
          <div className="chips" role="radiogroup" aria-label="Travel mode">
            {(Object.keys(MODES) as TravelMode[]).map((m) => (
              <span key={m}>
                <input type="radio" id={`mode-${m}`} name="mode" checked={mode === m} onChange={() => setMode(m)} />
                <label htmlFor={`mode-${m}`}>{MODES[m].label}</label>
              </span>
            ))}
          </div>
        </div>

        {brackets.length > 1 && (
          <div className="stack" style={{ gap: 10 }}>
            <h2 className={styles.step}><span>4</span>Any theme?</h2>
            <div className="chips" role="radiogroup" aria-label="Theme">
              <span>
                <input type="radio" id="theme-all" name="theme" checked={!bracket} onChange={() => setBracket('')} />
                <label htmlFor="theme-all" className="chip-icon"><Icon3D name={seasonIcon} size={20} />All themes</label>
              </span>
              {brackets.map((b) => (
                <span key={b.key}>
                  <input type="radio" id={`theme-${b.key}`} name="theme" checked={bracket === b.key} onChange={() => setBracket(b.key)} />
                  <label htmlFor={`theme-${b.key}`} className="chip-icon"><Icon3D name={b.icon} size={20} />{b.label}</label>
                </span>
              ))}
            </div>
          </div>
        )}

        {pitstops.length > 0 && (
          <label className={styles.toggle}>
            <input type="checkbox" checked={withPitstop} onChange={(e) => setWithPitstop(e.target.checked)} />
            <span><b>Add a pitstop</b> <span className="muted">for {BOOST_HOURS} hours of double XP (no purchase necessary)</span></span>
          </label>
        )}
      </section>

      <section className={`stack ${styles.result}`} aria-live="polite" aria-label="Your route">
        {!plan ? (
          <div className={styles.empty}>
            <Icon3D name="map" size={64} />
            <p><b>Pick a starting point</b> and your loop shows up here.</p>
          </div>
        ) : plan.stops.length === 0 ? (
          <div className={styles.empty}>
            <Icon3D name="moon" size={64} />
            <p><b>No houses fit in {fmtMin(minutes)}{bracket ? ' with that theme' : ''}.</b> Try more time{bracket ? ', another theme' : ''} or {mode === 'walking' ? 'driving' : 'a different start'}.</p>
          </div>
        ) : (
          <>
            <div className={styles.summary}>
              <div>
                <span className="label">Your loop</span>
                <b className={styles.big}>{houseCount(plan.stops)} {houseCount(plan.stops) === 1 ? 'house' : 'houses'} · about {fmtMin(plan.totalMin)}</b>
                <span className="small muted">{fmtKm(plan.totalKm)} {MODES[mode].label.toLowerCase()}, back where you started, with ~{MODES[mode].dwellMin} min at each stop</span>
              </div>
              <a className="btn primary" href={googleRouteUrl(start!, plan.stops, mode)} target="_blank" rel="noopener">
                <Icon3D name="map" size={22} />Open in Google Maps
              </a>
            </div>
            <ol className={styles.stops}>
              <li className={styles.stop}>
                <span className={`${styles.num} ${styles.home}`}><Icon3D name="pin" size={20} /></span>
                <div><b>Start</b><span className="small muted">{startHouse?.name ?? startBlock?.name ?? 'Your location'}</span></div>
              </li>
              {plan.stops.map((s, i) => {
                const prev: Point = i === 0 ? start! : plan.stops[i - 1];
                return s.kind === 'pitstop' ? (
                  <li key={s.id} className={`${styles.stop} ${styles.pit}`}>
                    <span className={styles.num} style={{ background: TIERS[s.tier].color }}><Icon3D name="gift" size={20} /></span>
                    <div>
                      <span className="small muted">~{s.arriveMin} min in · {fmtKm(s.legKm)}</span>
                      <Link href={`/pitstop/${s.id}`}><b>{s.name}</b></Link>
                      <span className="small">{s.offer}</span>
                      <span className="small muted">Scan the counter QR for double XP.</span>
                    </div>
                    <a className={styles.apple} href={appleStopUrl(prev, s, mode)} target="_blank" rel="noopener">Apple Maps</a>
                  </li>
                ) : (
                  <li key={s.id} className={styles.stop}>
                    <span className={styles.num}>{plan.stops.slice(0, i + 1).filter((x) => x.kind === 'house').length}</span>
                    <div>
                      <span className="small muted">~{s.arriveMin} min in · {fmtKm(s.legKm)}</span>
                      <Link href={`/house/${s.id}`}><b>{s.name}</b></Link>
                      <span className="small">
                        #{s.rank} overall · {s.likes} {s.likes === 1 ? 'like' : 'likes'}{s.avgScore !== null ? ` · ${s.avgScore}/10` : ''} · lit {s.lit}
                      </span>
                      {s.crowd > 0 && <span className={styles.crowd}><i style={{ background: CROWD_LEVELS[crowdLevel(s.crowd)].color }} />{CROWD_LEVELS[crowdLevel(s.crowd)].label} right now</span>}
                      {!s.exact && <span className="small muted">Approximate area. The exact address shows when you check in.</span>}
                    </div>
                    <a className={styles.apple} href={appleStopUrl(prev, s, mode)} target="_blank" rel="noopener">Apple Maps</a>
                  </li>
                );
              })}
            </ol>
            <p className="small muted">Check in at each porch to vote and earn XP. Times are estimates; Google Maps has the live directions. Apple Maps opens one leg at a time.</p>
          </>
        )}
      </section>
    </div>
  );
}
