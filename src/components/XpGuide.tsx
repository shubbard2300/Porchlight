import { BOOST_HOURS, boostActive } from '@/lib/pitstops';
import { XP_SOURCES } from '@/lib/rewards';
import { LEVELS, level } from '@/lib/users';
import { Icon3D } from './Icon3D';

const timeFmt = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles' });

export type XpStanding = { xp: number; boostUntil: Date | string | null };

/** Shared bar + "N XP · M to Lantern" line, used on the profile header and in the XP popup. */
export function XpProgress({ xp }: { xp: number }) {
  const lvl = level(xp);
  return (
    <>
      <div className="xpbar" aria-label={`${xp} XP`}><i style={{ width: `${lvl.next ? Math.min(100, (xp / lvl.next[0]) * 100) : 100}%` }} /></div>
      <span className="small muted num row" style={{ gap: 6 }}><Icon3D name="sparkles" size={20} />{xp} XP{lvl.next ? ` · ${lvl.next[0] - xp} to ${lvl.next[1]}` : ''}</span>
    </>
  );
}

/**
 * How XP works: the ways to earn it, the pitstop boost, the levels, and the promise that it never touches votes.
 * Shown in the XP popup (any link with data-modal="xp") and in the About XP section of the profile.
 */
export function XpGuide({ me, showProgress = true }: { me?: XpStanding | null; showProgress?: boolean }) {
  const until = me?.boostUntil ? new Date(me.boostUntil) : null;
  const boosted = boostActive(until);
  const current = me ? level(me.xp).number - 1 : -1;

  return (
    <div className="stack xp-guide">
      {me && showProgress && (
        <div className="stack" style={{ gap: 6 }}>
          <span className="label">Level {current + 1} · {LEVELS[current][1]}</span>
          <XpProgress xp={me.xp} />
        </div>
      )}

      {me && (
        <p className={`xp-boost-note${boosted ? ' on' : ''}`} role="status">
          <Icon3D name={boosted ? 'fire' : 'gift'} size={28} />
          {boosted && until
            ? <span><b>2× boost is on</b> until {timeFmt.format(until)}. Every XP you earn until then counts double.</span>
            : <span><b>No boost right now.</b> Scan a pitstop&apos;s counter QR for {BOOST_HOURS} hours of double XP. No purchase necessary.</span>}
        </p>
      )}

      <div className="stack" style={{ gap: 8 }}>
        <h3 className="xp-sub">Ways to earn XP</h3>
        <ul className="xp-ways">
          {XP_SOURCES.map((s) => (
            <li key={s.title}>
              <Icon3D name={s.icon} size={32} />
              <span><b>{s.title}</b><span className="small muted">{s.detail}</span></span>
              <b className="xp-amt num">+{s.xp}</b>
            </li>
          ))}
        </ul>
      </div>

      <div className="stack" style={{ gap: 8 }}>
        <h3 className="xp-sub">Levels</h3>
        <ol className="xp-levels">
          {LEVELS.map(([at, name], i) => (
            <li key={name} className={i === current ? 'here' : i < current ? 'done' : undefined} aria-current={i === current ? 'step' : undefined}>
              <b>{name}</b><span className="num">{at} XP</span>
            </li>
          ))}
        </ol>
      </div>

      <p className="small muted xp-fine">
        <Icon3D name="shield" size={20} />
        <span>XP is just for fun: it levels you up and earns badges, but it <b>never changes contest votes</b>. Every visitor gets one vote per house, boost or not. XP has no cash value.</span>
      </p>
    </div>
  );
}
