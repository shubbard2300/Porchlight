'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { endTour } from '@/app/actions/tours';
import { APPROVAL_XP, CHECKIN_XP, SIGNUP_BONUS_XP, TOUR_XP, VOTE_XP } from '@/lib/rewards';
import type { Tour } from '@/lib/tours';
import { Icon3D, type Icon3DName } from './Icon3D';

type Step = { icon: Icon3DName; title: string; text: string; reward?: string };

const STEPS: Record<Tour, (name: string | null) => Step[]> = {
  viewer: (name) => [
    { icon: 'party', title: name ? `You’re in, ${name}!` : 'You’re in!', text: 'Porchlight is a neighborhood-wide vote. Everyone who visits helps decide the brightest porch, so you already have a say.', reward: `+${SIGNUP_BONUS_XP} XP · Porch Pass` },
    { icon: 'map', title: 'Find a glowing pin', text: 'Every pin is a neighbor’s display. Tap one for photos, when the lights are on and how to get there.' },
    { icon: 'pin', title: 'Stop by and check in', text: 'At the house, check in by location or the porch QR sign, then fill in a quick scorecard. Only real visits count, which keeps it fair for everyone.', reward: `+${CHECKIN_XP} XP check-in · +${VOTE_XP} XP scorecard` },
    { icon: 'sparkles', title: 'Level up as you go', text: 'Caravans with friends, critter hunts and sponsor pitstops earn more. We’ll point them out when they matter. No homework.' },
  ],
  host: (name) => [
    { icon: 'party', title: name ? `Welcome, ${name}!` : 'Welcome, host!', text: 'Every display you add makes the whole neighborhood’s light tour better. Hosts light the way; visitors vote on the most-loved porch.', reward: `+${SIGNUP_BONUS_XP} XP · Porch Pass` },
    { icon: 'camera', title: 'Get your house on the map', text: 'A night photo with the lights on and your address are all it takes. We review new houses quickly and email you when you’re live.', reward: `+${APPROVAL_XP} XP when approved` },
    { icon: 'people', title: 'Bring the neighbors by', text: 'Print your porch QR sign so visitors can check in and score your display. Then add magic decorations: holiday props that float on your house when visitors look through their phone camera.' },
    { icon: 'trophy', title: 'The most-loved porch wins', text: 'Verified likes decide the pot. Share your invite code with neighbors: more houses means a better tour for everyone.' },
  ],
};

/**
 * The short welcome tour shown once after someone confirms their email. A few cards, skippable at any point,
 * that end on the thing people came for: the map for viewers, their own entry for hosts.
 * `name` is the display name they chose, if any; the username made from their email isn't worth greeting.
 */
export function LearningPath({ tour, name }: { tour: Tour; name: string | null }) {
  const ref = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const steps = STEPS[tour](name);
  const [i, setI] = useState(0);
  const [closing, setClosing] = useState(false);
  const last = i === steps.length - 1;
  const step = steps[i];
  const host = tour === 'host';

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);

  const finish = async (finished: boolean) => {
    if (closing) return;
    setClosing(true);
    const { xp } = await endTour(tour, finished).catch(() => ({ xp: 0 }));
    ref.current?.close();
    if (xp) showXp(xp);
    if (finished && host && pathname !== '/submit') router.push('/submit');
    else if (!host && pathname === '/') document.getElementById('map')?.scrollIntoView({ behavior: 'smooth' });
    router.refresh();
  };

  return (
    <dialog
      ref={ref}
      className="modal tour"
      aria-labelledby="tour-title"
      aria-describedby="tour-text"
      // Escape counts as skipping, so the tour doesn't come back.
      onCancel={(e) => { e.preventDefault(); finish(false); }}
    >
      <div className="modal-body tour-body">
        <div className="tour-top">
          <span className="label">{host ? 'Host quick start' : 'Quick start'} · {i + 1} of {steps.length}</span>
          <button type="button" className="linkish small" onClick={() => finish(false)} disabled={closing}>
            {host ? 'Skip' : 'Skip to the map'}
          </button>
        </div>
        <ol className="tour-dots" aria-hidden="true">
          {steps.map((s, n) => <li key={s.title} className={n < i ? 'done' : n === i ? 'on' : undefined} />)}
        </ol>
        <div className="tour-card" key={i}>
          <span className="tour-art"><Icon3D name={step.icon} size={84} /></span>
          <h2 id="tour-title">{step.title}</h2>
          <p id="tour-text" className="muted">{step.text}</p>
          {step.reward && <span className="tour-reward"><Icon3D name="sparkles" size={18} />{step.reward}</span>}
        </div>
        <div className="tour-nav">
          {i > 0 ? <button type="button" className="btn ghost" onClick={() => setI(i - 1)}>Back</button> : <span />}
          {last ? (
            <button type="button" className="btn primary" onClick={() => finish(true)} disabled={closing} autoFocus>
              {host ? (pathname === '/submit' ? 'Add my house' : 'Put my house on the map') : 'Show me the map'}
              <span className="tour-xp">+{TOUR_XP} XP</span>
            </button>
          ) : (
            <button type="button" className="btn primary" onClick={() => setI(i + 1)} autoFocus>Next</button>
          )}
        </div>
        {!last && <p className="hint tour-foot">Finish the tour for +{TOUR_XP} XP.</p>}
      </div>
    </dialog>
  );
}

/** Shows the "+10 XP" toast from anywhere on the page. */
export const showXp = (xp: number) => window.dispatchEvent(new CustomEvent('pl-xp', { detail: xp }));

/**
 * A small "+10 XP" that floats up and fades. Lives in the layout, so it outlasts whatever earned the XP
 * (the welcome tour unmounts as soon as it's done).
 */
export function XpToaster() {
  const [xp, setXp] = useState(0);
  const [n, setN] = useState(0);
  useEffect(() => {
    const on = (e: Event) => { setXp((e as CustomEvent<number>).detail); setN((k) => k + 1); };
    window.addEventListener('pl-xp', on);
    return () => window.removeEventListener('pl-xp', on);
  }, []);
  useEffect(() => {
    if (!xp) return;
    const t = setTimeout(() => setXp(0), 2600);
    return () => clearTimeout(t);
  }, [xp, n]);
  return xp ? <div className="xp-toast" role="status" key={n}><Icon3D name="sparkles" size={22} />+{xp} XP</div> : null;
}
