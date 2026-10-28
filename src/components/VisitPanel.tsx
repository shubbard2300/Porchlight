'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { castVote, checkInByLocation } from '@/app/actions/visits';
import { useFormAction } from './useFormAction';
import { SubmitButton } from './SubmitButton';
import { Icon3D } from './Icon3D';
import { SCORE_CATEGORIES, type ScoreKey } from '@/lib/visits';
import styles from './VisitPanel.module.css';

export type VisitState = 'guest' | 'own' | 'closed' | 'needs-checkin' | 'checked-in';
type MyVote = { liked: boolean; comment: string | null } & Record<ScoreKey, number | null>;

export function VisitPanel({ houseId, state, myVote, flash }: { houseId: string; state: VisitState; myVote: MyVote | null; flash?: string | null }) {
  return (
    <section id="vote" className={`panel ${styles.panel}`} aria-labelledby="vote-title" style={{ scrollMarginTop: 16 }}>
      <div className={styles.head}>
        <Icon3D name={state === 'checked-in' ? 'star' : 'pin'} size={40} />
        <h2 id="vote-title">{state === 'checked-in' ? (myVote ? 'Your scorecard' : 'Score this house') : 'Check in to vote'}</h2>
      </div>
      {flash && <p className="notice" role="status">{flash}</p>}
      {state === 'guest' && <Guest houseId={houseId} />}
      {state === 'own' && <p className="muted">This is your house. Print your porch sign from your profile so visitors can scan in and vote.</p>}
      {state === 'closed' && <p className="muted">Voting isn&rsquo;t open for this contest right now.</p>}
      {state === 'needs-checkin' && <CheckIn houseId={houseId} />}
      {state === 'checked-in' && <Scorecard houseId={houseId} myVote={myVote} showCheckedIn={!flash} />}
    </section>
  );
}

function Guest({ houseId }: { houseId: string }) {
  return (
    <>
      <p className="muted">Only people who actually visit can vote. Join free, then check in at the house by location or by scanning the QR sign on the porch.</p>
      <div className="row" style={{ gap: 12 }}>
        <Link href="/join/viewer" data-modal="join:viewer" className="btn primary">Join to vote</Link>
        <Link href={`/login?next=${encodeURIComponent(`/house/${houseId}#vote`)}`} data-modal="login" className="btn ghost">Log in</Link>
      </div>
    </>
  );
}

function CheckIn({ houseId }: { houseId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [saving, startSaving] = useTransition();

  const go = () => {
    setError(null);
    if (!('geolocation' in navigator)) return setError('This browser can’t share its location. Scan the porch QR sign instead.');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        startSaving(async () => {
          const r = await checkInByLocation(houseId, pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy ?? null);
          if (r.ok) router.refresh();
          else setError(r.message);
        });
      },
      (err) => {
        setLocating(false);
        setError(err.code === err.PERMISSION_DENIED
          ? 'Location is blocked for this site. Allow it in your browser settings, or scan the porch QR sign.'
          : 'Couldn’t get your location. Step outside for a clearer signal and try again.');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    );
  };

  return (
    <div className={styles.ways}>
      <div className={styles.way}>
        <b>I&rsquo;m here</b>
        <span className="small muted">Your phone shares its location once to confirm you&rsquo;re within 150 m. We never store where you were.</span>
        <button type="button" className="btn primary" onClick={go} disabled={locating || saving}>
          <Icon3D name="pin" size={22} />{locating ? 'Finding you…' : saving ? 'Checking in…' : 'Check in by location'}
        </button>
        {error && <span className="err" role="alert">{error}</span>}
      </div>
      <div className={styles.way}>
        <b>Scan the porch sign</b>
        <span className="small muted">Hosts can post a Porchlight QR sign on their porch. Point your phone camera at it and you&rsquo;re checked in.</span>
      </div>
    </div>
  );
}

function Scorecard({ houseId, myVote, showCheckedIn }: { houseId: string; myVote: MyVote | null; showCheckedIn: boolean }) {
  const { state, formAction, errors } = useFormAction(castVote);
  const [scores, setScores] = useState<Record<ScoreKey, number>>(() =>
    Object.fromEntries(SCORE_CATEGORIES.map((c) => [c.key, myVote?.[c.key] ?? 7])) as Record<ScoreKey, number>);
  const [comment, setComment] = useState(myVote?.comment ?? '');

  return (
    <form action={formAction} className="stack" style={{ gap: 18 }}>
      {showCheckedIn && <div className={styles.checked}><Icon3D name="check" size={24} />You&rsquo;re checked in. Your vote counts.</div>}
      <input type="hidden" name="houseId" value={houseId} />
      <div className={styles.sliders}>
        {SCORE_CATEGORIES.map((c) => (
          <div key={c.key} className={styles.slider}>
            <div className={styles.sliderTop}>
              <div><label htmlFor={`s-${c.key}`}>{c.label}</label> <span>{c.hint}</span></div>
              <output className={styles.value} htmlFor={`s-${c.key}`}>{scores[c.key]}</output>
            </div>
            <input
              id={`s-${c.key}`} name={c.key} type="range" min={1} max={10} step={1} value={scores[c.key]}
              onChange={(e) => setScores((s) => ({ ...s, [c.key]: Number(e.target.value) }))}
              className={styles.range} style={{ '--fill': `${((scores[c.key] - 1) / 9) * 100}%` } as React.CSSProperties}
            />
            {errors[c.key] && <span className="err" role="alert">{errors[c.key]}</span>}
          </div>
        ))}
      </div>
      <div className="field">
        <label htmlFor="comment">Leave the host a cheer <span className="muted small">(optional)</span></label>
        <textarea id="comment" name="comment" maxLength={280} className={styles.comment} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="The singing pumpkins made our whole night!" />
        <span className={styles.count}>{comment.length}/280</span>
        {errors.comment && <span className="err" role="alert">{errors.comment}</span>}
      </div>
      {errors.form && <p className="err" role="alert">{errors.form}</p>}
      {state?.message && <p className="notice" role="status">{state.message}</p>}
      <div className={styles.actions}>
        <PassButton />
        <SubmitButton pendingText="Saving…" className={`btn ${styles.love}`} name="liked" value="yes">
          <Icon3D name="heart" size={22} />{myVote?.liked ? 'Still love it' : 'Love it'}
        </SubmitButton>
      </div>
    </form>
  );
}

function PassButton() {
  const { pending } = useFormStatus();
  return <button type="submit" name="liked" value="no" className="btn ghost" disabled={pending}>Not my favorite</button>;
}
