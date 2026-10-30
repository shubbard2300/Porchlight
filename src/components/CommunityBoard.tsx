import type React from 'react';
import Link from 'next/link';
import { Icon3D } from '@/components/Icon3D';
import { MILESTONE_NOUN, milestoneProgress, nextMilestone, type CommunityCounts } from '@/lib/community';

const n = (v: number) => v.toLocaleString('en-US');
const plural = (v: number, one: string, many: string) => `${n(v)} ${v === 1 ? one : many}`;

/** The neighborhood's shared scoreboard: what everyone has done together, and the next thing it unlocks. */
export function CommunityBoard({ counts, mine, seasonName, signedIn }: {
  counts: CommunityCounts;
  mine: { porches: number; checkIns: number; scorecards: number } | null;
  seasonName: string;
  signedIn: boolean;
}) {
  const progress = milestoneProgress(counts);
  const next = nextMilestone(progress);
  const myParts = mine && [
    mine.porches > 0 && plural(mine.porches, 'porch', 'porches'),
    mine.checkIns > 0 && plural(mine.checkIns, 'check-in', 'check-ins'),
    mine.scorecards > 0 && plural(mine.scorecards, 'scorecard', 'scorecards'),
  ].filter(Boolean);

  return (
    <section className="community" aria-labelledby="together">
      <div className="community-head">
        <span className="label">Built by neighbors</span>
        <h2 id="together" className="squiggle">We’re lighting this up together</h2>
        <p className="muted">
          Every porch added, every visit and every scorecard moves the whole neighborhood toward shared goals.
          {next ? <> Next up: <b>{next.unlock}</b> at {n(next.goal)} {MILESTONE_NOUN[next.key]}.</> : <> Every {seasonName} goal is unlocked. Thank you, neighbors!</>}
        </p>
      </div>

      <dl className="community-stats">
        <div><dt>Porches lit</dt><dd className="num">{n(counts.porches)}</dd></div>
        <div><dt>Neighbors out</dt><dd className="num">{n(counts.neighbors)}</dd></div>
        <div><dt>Check-ins</dt><dd className="num">{n(counts.checkIns)}</dd></div>
        <div><dt>Scorecards</dt><dd className="num">{n(counts.scorecards)}</dd></div>
      </dl>

      <ol className="milestones">
        {progress.map((m) => (
          <li key={m.key} className={m.done ? 'done' : undefined} style={{ '--pct': m.pct } as React.CSSProperties}>
            <span className="milestone-icon"><Icon3D name={m.done ? 'check' : m.icon} size={34} /></span>
            <div>
              <b>{m.unlock}</b>
              <p className="small muted">{m.detail}</p>
              <div className="meter" role="progressbar" aria-label={`${m.unlock}: ${n(m.have)} of ${n(m.goal)} ${MILESTONE_NOUN[m.key]}`} aria-valuemin={0} aria-valuemax={m.goal} aria-valuenow={Math.min(m.have, m.goal)}><i /></div>
              <span className="small milestone-count num">{m.done ? 'Unlocked for everyone' : `${n(m.have)} of ${n(m.goal)} ${MILESTONE_NOUN[m.key]} · ${n(m.left)} to go`}</span>
            </div>
          </li>
        ))}
      </ol>

      <p className="community-you">
        <Icon3D name="people" size={26} />
        {myParts && myParts.length > 0
          ? <span>You’re part of this: <b>{myParts.join(', ')}</b> so far. Thank you!</span>
          : signedIn
            ? <span>Your first check-in counts toward every goal. <Link href="/route">Plan a light tour</Link>.</span>
            : <span>Everyone who joins in shares the unlocks. <Link href="/join" data-modal="join">Join free</Link> to add yours.</span>}
      </p>
    </section>
  );
}
