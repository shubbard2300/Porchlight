'use client';

import { useEffect, useRef, useState } from 'react';
import { suggestAddress, type AddressGuess } from '../../actions/geo';
import { Icon3D } from '@/components/Icon3D';
import { readPhotoMeta } from '@/lib/exif';
import { deviceLocation, toUploadJpeg, type Coords } from '@/lib/photoPrep';

/** The resized photo plus what the server stores with it. Sent with the sign-up form. */
export type SignupPhoto = { blob: Blob; width: number; height: number; takenAt?: string; where?: Coords & { source: 'photo' | 'device' } };

type Guess = { state: 'idle' } | { state: 'looking' } | { state: 'found'; guess: AddressGuess } | { state: 'none' } | { state: 'done' };

/**
 * The optional first step of host sign-up: a photo of the house, then its address. The address is suggested
 * from the photo's GPS, the phone's location, or (roughly) the connection's town, and the host confirms or types it.
 */
export function HostPhotoStart({ photo, onPhoto, idPrefix, initialAddress = '', error }: {
  photo: SignupPhoto | null;
  onPhoto: (p: SignupPhoto | null) => void;
  idPrefix: string;
  initialAddress?: string;
  error?: string;
}) {
  const camera = useRef<HTMLInputElement>(null);
  const library = useRef<HTMLInputElement>(null);
  const addressInput = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [readError, setReadError] = useState<string>();
  const [address, setAddress] = useState(initialAddress);
  const [neighborhood, setNeighborhood] = useState('');
  const [guess, setGuess] = useState<Guess>({ state: initialAddress ? 'done' : 'idle' });
  const [showAddress, setShowAddress] = useState(Boolean(initialAddress));

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const lookUp = async (where: SignupPhoto['where'] | null) => {
    setShowAddress(true);
    setGuess({ state: 'looking' });
    const g = await suggestAddress(where ?? null).catch(() => null);
    setGuess(g ? { state: 'found', guess: g } : { state: 'none' });
  };

  const pick = async (file: File | undefined, fromCamera: boolean) => {
    if (!file) return;
    setReadError(undefined);
    setBusy(true);
    // A photo taken just now was taken here, so the phone's position is the house's position.
    const here = fromCamera ? deviceLocation() : Promise.resolve(null);
    try {
      const meta = readPhotoMeta(await file.arrayBuffer());
      const { blob, width, height } = await toUploadJpeg(file);
      const gps = meta.lat !== undefined && meta.lng !== undefined ? { lat: meta.lat, lng: meta.lng, source: 'photo' as const } : null;
      const device = gps ? null : await here;
      const where = gps ?? (device ? { ...device, source: 'device' as const } : undefined);
      setPreview(URL.createObjectURL(blob));
      onPhoto({ blob, width, height, takenAt: meta.takenAt?.toISOString(), where });
      if (!address) await lookUp(where);
    } catch {
      setReadError("We couldn't read that photo. Try a JPEG or PNG, or take a new one.");
    }
    setBusy(false);
  };

  const useHere = async () => {
    const c = await deviceLocation();
    if (!c) {
      setGuess({ state: 'none' });
      setReadError('We could not get your location. Allow location for this site, or type your address.');
      return;
    }
    await lookUp({ ...c, source: 'device' });
  };

  const accept = (g: AddressGuess) => {
    setAddress(g.source === 'ip' ? `, ${g.address}` : g.address);
    setNeighborhood(g.neighborhood ?? '');
    setGuess({ state: 'done' });
    // A town from the IP is only a start: put the cursor in front of it for the street.
    if (g.source === 'ip') requestAnimationFrame(() => { addressInput.current?.focus(); addressInput.current?.setSelectionRange(0, 0); });
  };

  const typeIt = () => {
    setGuess({ state: 'done' });
    requestAnimationFrame(() => addressInput.current?.focus());
  };

  return (
    <div className="host-start">
      {preview ? (
        <div className="host-start-photo">
          <img src={preview} alt="Your house" />
          <div className="host-start-photo-bar">
            <span className="small"><Icon3D name="check" size={18} /> {photo?.where ? 'Photo added with its location' : 'Photo added'}</span>
            <button type="button" className="linkish small" onClick={() => { onPhoto(null); setPreview(undefined); }}>Remove</button>
          </div>
        </div>
      ) : (
        <div className="host-start-drop">
          <Icon3D name="camera" size={52} />
          <div className="stack" style={{ gap: 4 }}>
            <b>Start with a photo of your house</b>
            <span className="hint">Optional, and the quickest way onto the map. We&apos;ll suggest your address from it.</span>
          </div>
          <div className="row">
            <button type="button" className="btn primary sm" disabled={busy} onClick={() => camera.current?.click()}>{busy ? 'Reading photo…' : '📷 Take a photo'}</button>
            <button type="button" className="btn ghost sm" disabled={busy} onClick={() => library.current?.click()}>Choose from photos</button>
          </div>
        </div>
      )}
      {(readError || error) && <span className="err" role="alert">{readError ?? error}</span>}

      {guess.state === 'looking' && <p className="addr-guess small" aria-live="polite"><span className="addr-spin" aria-hidden="true" /> Finding your address…</p>}
      {guess.state === 'found' && (
        <div className="addr-guess" role="status">
          <Icon3D name="pin" size={30} />
          <div className="stack" style={{ gap: 2 }}>
            <span className="small muted">{guess.guess.source === 'ip' ? 'Looks like you’re near' : 'Is this your house?'}</span>
            <b>{guess.guess.address}</b>
          </div>
          <div className="row">
            <button type="button" className="btn primary sm" onClick={() => accept(guess.guess)}>{guess.guess.source === 'ip' ? 'Use it as a start' : 'Yes, that’s it'}</button>
            <button type="button" className="btn ghost sm" onClick={typeIt}>No, I&apos;ll type it</button>
          </div>
        </div>
      )}

      {showAddress ? (
        <div className="field" hidden={guess.state === 'found' || guess.state === 'looking'}>
          <label htmlFor={`${idPrefix}propertyAddress`}>House address <span className="muted small">(optional)</span></label>
          <input ref={addressInput} id={`${idPrefix}propertyAddress`} name="propertyAddress" type="text" autoComplete="street-address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="1820 SE Alder Ct, Portland, OR" />
          <span className="hint">
            Only used to place your pin; you choose later whether visitors see the exact address.{' '}
            <button type="button" className="linkish" onClick={useHere}>📍 I&apos;m at the house now</button>
          </span>
          {neighborhood && <input type="hidden" name="neighborhood" value={neighborhood} />}
        </div>
      ) : (
        <button type="button" className="linkish small" onClick={() => setShowAddress(true)}>No photo handy? Add your address instead</button>
      )}

      <input ref={camera} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { pick(e.target.files?.[0], true); e.target.value = ''; }} aria-label="Take a photo of your house" />
      <input ref={library} type="file" accept="image/*" hidden onChange={(e) => { pick(e.target.files?.[0], false); e.target.value = ''; }} aria-label="Choose a photo of your house" />
    </div>
  );
}
