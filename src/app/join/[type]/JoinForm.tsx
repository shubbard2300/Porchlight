'use client';

import { useState } from 'react';
import { join } from '../../actions/auth';
import { Field } from '@/components/Field';
import { SubmitButton } from '@/components/SubmitButton';
import { useFormAction } from '@/components/useFormAction';
import { HostPhotoStart, type SignupPhoto } from './HostPhotoStart';

/** Sign-up asks for an email and a password. Hosts can also start with a photo of their house. */
export function JoinForm({ accountType, invite, idPrefix = '' }: { accountType: 'VIEWER' | 'HOST'; invite?: string; idPrefix?: string }) {
  const { formAction, errors: e, value } = useFormAction(join);
  const host = accountType === 'HOST';
  const [photo, setPhoto] = useState<SignupPhoto | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showInvite, setShowInvite] = useState(Boolean(invite || e.referralCode));

  // The photo lives in state rather than a file input, so it survives a failed attempt (React resets forms after an action).
  const action = (fd: FormData) => {
    if (host && photo) {
      fd.set('photo', photo.blob, 'house.jpg');
      fd.set('width', String(photo.width));
      fd.set('height', String(photo.height));
      if (photo.takenAt) fd.set('takenAt', photo.takenAt);
      if (photo.where) {
        fd.set('lat', String(photo.where.lat));
        fd.set('lng', String(photo.where.lng));
        fd.set('locationSource', photo.where.source);
      }
    }
    return formAction(fd);
  };

  return (
    <form action={action} className="stack" noValidate>
      <input type="hidden" name="accountType" value={accountType} />
      {host && <HostPhotoStart photo={photo} onPhoto={setPhoto} idPrefix={idPrefix} initialAddress={value('propertyAddress')} error={e.photo ?? e.propertyAddress} />}
      <Field label="Email" htmlFor={`${idPrefix}email`} error={e.email}>
        <input id={`${idPrefix}email`} name="email" type="email" autoComplete="email" inputMode="email" required defaultValue={value('email')} placeholder="you@example.com" />
      </Field>
      <Field label="Password" htmlFor={`${idPrefix}password`} error={e.password} hint="At least 8 characters.">
        <span className="pw">
          <input id={`${idPrefix}password`} name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required minLength={8} />
          <button type="button" className="pw-toggle" onClick={() => setShowPassword((s) => !s)} aria-pressed={showPassword} aria-controls={`${idPrefix}password`}>{showPassword ? 'Hide' : 'Show'}</button>
        </span>
      </Field>
      {showInvite ? (
        <Field label="Invite code" htmlFor={`${idPrefix}referralCode`} error={e.referralCode}>
          <input id={`${idPrefix}referralCode`} name="referralCode" type="text" defaultValue={value('referralCode', invite)} placeholder="PORCH-7Q4K" />
        </Field>
      ) : (
        <button type="button" className="linkish small" onClick={() => setShowInvite(true)}>Have an invite code?</button>
      )}
      <SubmitButton pendingText={photo ? 'Uploading your photo…' : 'Creating your account…'}>Create my account</SubmitButton>
      <p className="hint" style={{ margin: 0 }}>
        By creating an account you confirm you&apos;re 18 or older and agree to the <a href="/terms" target="_blank" rel="noopener">Terms</a>, <a href="/rules" target="_blank" rel="noopener">Official Rules</a> and <a href="/privacy" target="_blank" rel="noopener">Privacy Policy</a>. We&apos;ll email a link to confirm it&apos;s you.
      </p>
    </form>
  );
}
