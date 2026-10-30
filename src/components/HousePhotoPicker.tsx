'use client';

import { useRef, useState } from 'react';
import { makeCoverPhoto, removeHousePhoto, setHousePhotoLocation, uploadHousePhoto, type HousePhotoView } from '@/app/actions/housePhotos';
import { readPhotoMeta } from '@/lib/exif';
import { deviceLocation, toUploadJpeg } from '@/lib/photoPrep';
import css from './HousePhotoPicker.module.css';

const MAX_PHOTOS = 6;

function locationLabel(p: HousePhotoView) {
  if (p.lat === null) return 'No location';
  return p.locationSource === 'photo' ? 'From photo GPS' : 'From your phone';
}

/**
 * Take or choose photos of a house display. Reads GPS from the photo when it has it, and uses the
 * phone's location for photos taken right now. With houseId, photos save straight to that entry;
 * without it (the submit form) they are held and sent with the form as `inputName` values.
 */
export function HousePhotoPicker({ houseId, initial = [], inputName }: { houseId?: string; initial?: HousePhotoView[]; inputName?: string }) {
  const camera = useRef<HTMLInputElement>(null);
  const library = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState(initial);
  const [uploading, setUploading] = useState(0);
  const [locating, setLocating] = useState<string>();
  const [error, setError] = useState<string>();
  const full = photos.length + uploading >= MAX_PHOTOS;

  const add = async (files: FileList | null, fromCamera: boolean) => {
    const list = Array.from(files ?? []).slice(0, MAX_PHOTOS - photos.length);
    if (list.length === 0) return;
    setError(undefined);
    setUploading(list.length);
    // A photo taken just now was taken here, so the phone's position is the house's position.
    const here = fromCamera ? deviceLocation() : Promise.resolve(null);
    for (const file of list) {
      try {
        const meta = readPhotoMeta(await file.arrayBuffer());
        const { blob, width, height } = await toUploadJpeg(file);
        const fd = new FormData();
        fd.append('photo', blob, 'house.jpg');
        fd.append('width', String(width));
        fd.append('height', String(height));
        if (houseId) fd.append('houseId', houseId);
        if (meta.takenAt) fd.append('takenAt', meta.takenAt.toISOString());
        const where = meta.lat !== undefined && meta.lng !== undefined ? { lat: meta.lat, lng: meta.lng, source: 'photo' } : await here.then((c) => c && { ...c, source: 'device' });
        if (where) {
          fd.append('lat', String(where.lat));
          fd.append('lng', String(where.lng));
          fd.append('locationSource', where.source);
        }
        const res = await uploadHousePhoto(fd);
        if (res.error) setError(res.error);
        else if (res.photo) setPhotos((ps) => [...ps, res.photo!]);
      } catch {
        setError("We couldn't read that photo. Try a JPEG or PNG, or take a new one.");
      }
      setUploading((n) => n - 1);
    }
  };

  const locate = async (id: string) => {
    setError(undefined);
    setLocating(id);
    const c = await deviceLocation();
    if (!c) {
      setError('We could not get your location. Allow location for this site, or add it later.');
    } else {
      const res = await setHousePhotoLocation(id, c.lat, c.lng);
      if (res.error) setError(res.error);
      else if (res.photo) setPhotos((ps) => ps.map((p) => (p.id === id ? res.photo! : p)));
    }
    setLocating(undefined);
  };

  const makeCover = async (id: string) => {
    setPhotos((ps) => [...ps.filter((p) => p.id === id), ...ps.filter((p) => p.id !== id)]);
    if (houseId) await makeCoverPhoto(id);
  };

  const remove = async (id: string) => {
    setPhotos((ps) => ps.filter((p) => p.id !== id));
    await removeHousePhoto(id);
  };

  return (
    <div className={css.picker}>
      {(photos.length > 0 || uploading > 0) && (
        <ul className={css.grid}>
          {photos.map((p, i) => (
            <li key={p.id} className={css.tile}>
              <img src={p.url} alt={`House photo ${i + 1}`} />
              {i === 0 ? <span className={css.cover}>Cover</span> : <button type="button" className={`${css.cover} ${css.makeCover}`} onClick={() => makeCover(p.id)}>Make cover</button>}
              <button type="button" className={css.remove} onClick={() => remove(p.id)} aria-label={`Remove photo ${i + 1}`}>×</button>
              <div className={css.meta}>
                {p.lat !== null && p.lng !== null ? (
                  <a href={`https://www.google.com/maps?q=${p.lat},${p.lng}`} target="_blank" rel="noreferrer">📍 {locationLabel(p)}</a>
                ) : (
                  <button type="button" onClick={() => locate(p.id)} disabled={locating === p.id}>
                    {locating === p.id ? 'Finding you…' : '📍 Add my location'}
                  </button>
                )}
              </div>
              {inputName && <input type="hidden" name={inputName} value={p.id} />}
            </li>
          ))}
          {Array.from({ length: uploading }, (_, i) => (
            <li key={`up-${i}`} className={`${css.tile} ${css.pending}`} aria-live="polite">Uploading…</li>
          ))}
        </ul>
      )}
      <div className="row">
        <button type="button" className="btn primary sm" disabled={full} onClick={() => camera.current?.click()}>📷 Take a photo</button>
        <button type="button" className="btn ghost sm" disabled={full} onClick={() => library.current?.click()}>Choose from photos</button>
      </div>
      <span className="hint">
        {houseId
          ? `Up to ${MAX_PHOTOS} photos. The cover shows on your house card. Use × to remove a photo, then add a new one to replace it.`
          : `Up to ${MAX_PHOTOS} photos; night shots with the lights on look best. We pin your house on the map from the photo's GPS, or from your phone's location when you take one here. Location data is stripped from the photo people see.`}
      </span>
      {error && <span className="err" role="alert">{error}</span>}
      <input ref={camera} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { add(e.target.files, true); e.target.value = ''; }} aria-label="Take a photo" />
      <input ref={library} type="file" accept="image/*" multiple hidden onChange={(e) => { add(e.target.files, false); e.target.value = ''; }} aria-label="Choose photos" />
    </div>
  );
}
