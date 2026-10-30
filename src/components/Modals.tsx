'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { LoginForm } from '@/app/login/LoginForm';
import { JoinForm } from '@/app/join/[type]/JoinForm';
import { ContactForm, type ContactDefaults } from './ContactForm';
import { Icon3D } from './Icon3D';
import { XpGuide, type XpStanding } from './XpGuide';
import { SIGNUP_BONUS_XP } from '@/lib/rewards';

/**
 * Popups for logging in, signing up, contacting us and explaining XP.
 *
 * Any link with data-modal opens one instead of navigating, so server components only need an attribute:
 *   <Link href="/login" data-modal="login">   <Link href="/join/host" data-modal="join:host">
 *   <Link href="/contact" data-modal="contact:Accessibility">   <a href="/profile#about-xp" data-modal="xp">
 * The href stays a real page, which is what loads without JavaScript, in a new tab, or from an email link.
 */
type Open =
  | { kind: 'login' }
  | { kind: 'join'; as?: 'viewer' | 'host' }
  | { kind: 'contact'; topic?: string }
  | { kind: 'xp' };

const JOIN = {
  viewer: { type: 'VIEWER' as const, label: 'Viewer / rater', title: 'Find the best lights in town', blurb: 'Just an email and a password. You start with 100 XP and the Porch Pass badge.' },
  host: { type: 'HOST' as const, label: 'Host / decorator', title: 'Put your house on the map', blurb: 'Snap your house, confirm the address, and you’re most of the way onto the map.' },
};

function parse(attr: string): Open | null {
  const [kind, arg] = attr.split(':');
  if (kind === 'login') return { kind };
  if (kind === 'join') return { kind, as: arg === 'viewer' || arg === 'host' ? arg : undefined };
  if (kind === 'contact') return { kind, topic: arg };
  if (kind === 'xp') return { kind };
  return null;
}

export function Modals({ signedIn, contact, xp }: { signedIn: boolean; contact: ContactDefaults; xp?: XpStanding | null }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState<Open | null>(null);
  // Bumped on every open so each popup starts with a fresh form.
  const [nonce, setNonce] = useState(0);
  const pathname = usePathname();
  const [here, setHere] = useState('');

  const show = useCallback((o: Open) => {
    setHere(window.location.pathname + window.location.search);
    setOpen(o);
    setNonce((n) => n + 1);
  }, []);
  const close = useCallback(() => ref.current?.close(), []);

  useEffect(() => {
    // Capture on window runs before Next's Link handler, so the page doesn't navigate underneath the popup.
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.('a[data-modal]');
      if (!(a instanceof HTMLAnchorElement)) return;
      const o = parse(a.dataset.modal ?? '');
      if (!o) return;
      // Already on that page: just follow the link. The XP guide is a popup everywhere, even on the profile.
      if (o.kind !== 'xp' && a.pathname === window.location.pathname && !ref.current?.open) return;
      e.preventDefault();
      e.stopPropagation();
      show(o);
    };
    window.addEventListener('click', onClick, true);
    return () => window.removeEventListener('click', onClick, true);
  }, [show]);

  useEffect(() => {
    const d = ref.current;
    if (open && d && !d.open) d.showModal();
  }, [open, nonce]);

  // A form that redirects (check your email, profile) or signs the person in is done with the popup.
  useEffect(() => { close(); }, [pathname, signedIn, close]);

  const contactDefaults = open?.kind === 'contact' ? { ...contact, topic: open.topic } : contact;
  const join = open?.kind === 'join' && open.as ? JOIN[open.as] : null;

  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby="modal-title"
      onClose={() => setOpen(null)}
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      {open && (
        <div className="modal-body" key={nonce}>
          <button type="button" className="modal-x" onClick={close} aria-label="Close">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" /></svg>
          </button>

          {open.kind === 'login' && (
            <div className="stack">
              <div className="page-head"><Icon3D name="key" size={56} /><div><h2 id="modal-title">Welcome back</h2><p className="muted small">Log in to vote, check in and track your XP.</p></div></div>
              <LoginForm next={here} idPrefix="m-" />
              <p className="small muted">New here? <a href="/join" data-modal="join">Join Porchlight</a></p>
            </div>
          )}

          {open.kind === 'join' && !join && (
            <div className="stack">
              <div className="stack" style={{ gap: 6 }}>
                <span className="label">Join Porchlight</span>
                <h2 id="modal-title">How do you want to light up the season?</h2>
                <p className="muted small">Pick one to start. You can become a host later from your profile.</p>
              </div>
              <div className="choices compact">
                <button type="button" className="choice" onClick={() => setOpen({ kind: 'join', as: 'viewer' })}>
                  <Icon3D name="heart" size={48} />
                  <span className="label">Viewer / rater</span>
                  <h3>I want to find and rate houses</h3>
                  <span className="go">Sign up as a viewer →</span>
                </button>
                <button type="button" className="choice host" onClick={() => setOpen({ kind: 'join', as: 'host' })}>
                  <Icon3D name="house" size={48} />
                  <span className="label">Host / decorator</span>
                  <h3>I decorate my house</h3>
                  <span className="go">Sign up as a host →</span>
                </button>
              </div>
              <p className="small muted">Already joined? <a href="/login" data-modal="login">Log in</a></p>
            </div>
          )}

          {join && (
            <div className="stack">
              <div className="stack" style={{ gap: 6 }}>
                <button type="button" className="linkish small" onClick={() => setOpen({ kind: 'join' })}>← Choose a different way to join</button>
                <span className="label">{join.label}</span>
                <h2 id="modal-title">{join.title}</h2>
                <p className="muted small">{join.blurb}</p>
              </div>
              <JoinForm accountType={join.type} idPrefix="m-" />
              <p className="small muted">Already joined? <a href="/login" data-modal="login">Log in</a></p>
            </div>
          )}

          {open.kind === 'xp' && (
            <div className="stack">
              <div className="page-head"><Icon3D name="sparkles" size={56} /><div><h2 id="modal-title">How XP works</h2><p className="muted small">Points you earn for getting out and seeing the lights. They level you up, and that&apos;s all they do.</p></div></div>
              <XpGuide me={xp} />
              {xp
                ? <a href="/profile#about-xp" className="btn ghost sm" style={{ justifySelf: 'start' }} onClick={close}>See it on my profile</a>
                : <p className="small muted"><a href="/join/viewer" data-modal="join:viewer">Join free</a> and start with {SIGNUP_BONUS_XP} XP.</p>}
            </div>
          )}

          {open.kind === 'contact' && (
            <div className="stack">
              <div className="page-head"><Icon3D name="envelope" size={56} /><div><h2 id="modal-title">Say hello</h2><p className="muted small">Questions, ideas or trouble with the site. A real person reads every message.</p></div></div>
              <ContactForm defaults={contactDefaults} idPrefix="m-contact" />
            </div>
          )}
        </div>
      )}
    </dialog>
  );
}
