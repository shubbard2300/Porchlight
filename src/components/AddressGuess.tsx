'use client';

import { useCallback, useState } from 'react';
import { suggestAddress, type AddressGuess } from '@/app/actions/geo';
import type { Coords } from '@/lib/photoPrep';
import { Icon3D } from './Icon3D';

export type GuessState = { state: 'idle' } | { state: 'looking' } | { state: 'found'; guess: AddressGuess } | { state: 'none' };
export type GuessFrom = (Coords & { source: 'photo' | 'device' }) | null;

/** Asks the server for an address near a photo or phone location (or the connection's town) for the host to confirm. */
export function useAddressGuess() {
  const [guess, setGuess] = useState<GuessState>({ state: 'idle' });
  const lookUp = useCallback(async (where: GuessFrom) => {
    setGuess({ state: 'looking' });
    const g = await suggestAddress(where).catch(() => null);
    setGuess(g ? { state: 'found', guess: g } : { state: 'none' });
    return g;
  }, []);
  const clear = useCallback(() => setGuess({ state: 'idle' }), []);
  return { guess, lookUp, clear };
}

/** "Is this your house? 1820 SE Alder Ct…" with Yes / No, or a spinner while looking. */
export function AddressGuessCard({ guess, onAccept, onReject }: { guess: GuessState; onAccept: (g: AddressGuess) => void; onReject: () => void }) {
  if (guess.state === 'looking') return <p className="addr-guess small" aria-live="polite"><span className="addr-spin" aria-hidden="true" /> Finding your address…</p>;
  if (guess.state !== 'found') return null;
  const ip = guess.guess.source === 'ip';
  return (
    <div className="addr-guess" role="status">
      <Icon3D name="pin" size={30} />
      <div className="stack" style={{ gap: 2 }}>
        <span className="small muted">{ip ? 'Looks like you’re near' : 'Is this your house?'}</span>
        <b>{guess.guess.address}</b>
      </div>
      <div className="row">
        <button type="button" className="btn primary sm" onClick={() => onAccept(guess.guess)}>{ip ? 'Use it as a start' : 'Yes, that’s it'}</button>
        <button type="button" className="btn ghost sm" onClick={onReject}>No, I&apos;ll type it</button>
      </div>
    </div>
  );
}
