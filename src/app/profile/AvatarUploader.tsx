'use client';

import { useRef, useState, useTransition } from 'react';
import { removeAvatar, uploadAvatar } from '../actions/profile';

const SIZE = 512;

/** Crops to a centered square and re-encodes as JPEG so uploads stay small. */
async function toSquareJpeg(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = SIZE;
  canvas.getContext('2d')!.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, SIZE, SIZE);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode failed'))), 'image/jpeg', 0.86));
}

export function AvatarUploader({ src, initial }: { src: string | null; initial: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>();
  const [preview, setPreview] = useState(src);
  const [pending, start] = useTransition();

  const pick = (file: File | undefined) => {
    if (!file) return;
    setError(undefined);
    start(async () => {
      try {
        const blob = await toSquareJpeg(file);
        const fd = new FormData();
        fd.append('avatar', blob, 'avatar.jpg');
        const res = await uploadAvatar(fd);
        if (res.error) setError(res.error);
        else setPreview(URL.createObjectURL(blob));
      } catch {
        setError("We couldn't read that file. Try a JPEG or PNG photo.");
      }
    });
  };

  return (
    <div className="row" style={{ gap: 16 }}>
      {preview ? <img src={preview} alt="Your profile photo" className="avatar" /> : <span className="avatar" aria-hidden="true">{initial}</span>}
      <div className="stack" style={{ gap: 6 }}>
        <div className="row">
          <button type="button" className="btn ghost sm" disabled={pending} onClick={() => input.current?.click()}>{pending ? 'Uploading…' : preview ? 'Change photo' : 'Add a profile photo'}</button>
          {preview && <button type="button" className="btn ghost sm" disabled={pending} onClick={() => start(async () => { await removeAvatar(); setPreview(null); })}>Remove</button>}
        </div>
        <span className="hint">JPEG, PNG or WebP. We crop it to a square.</span>
        {error && <span className="err" role="alert">{error}</span>}
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => pick(e.target.files?.[0])} aria-label="Profile photo" />
      </div>
    </div>
  );
}
