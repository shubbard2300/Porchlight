'use client';

import { join } from '../../actions/auth';
import { Field } from '@/components/Field';
import { SubmitButton } from '@/components/SubmitButton';
import { useFormAction } from '@/components/useFormAction';

export function JoinForm({ accountType, invite, idPrefix = '' }: { accountType: 'VIEWER' | 'HOST'; invite?: string; idPrefix?: string }) {
  const { formAction: action, errors: e, value, checked } = useFormAction(join);
  const host = accountType === 'HOST';
  return (
    <form action={action} className="stack" noValidate>
      <input type="hidden" name="accountType" value={accountType} />
      <Field label="Email" htmlFor={`${idPrefix}email`} error={e.email} hint="We'll send a link to confirm it's you.">
        <input id={`${idPrefix}email`} name="email" type="email" autoComplete="email" required defaultValue={value('email')} />
      </Field>
      <Field label="Choose a username" htmlFor={`${idPrefix}username`} error={e.username} hint="3 to 20 letters, numbers or underscores. This is how others see you.">
        <input id={`${idPrefix}username`} name="username" type="text" autoComplete="username" required defaultValue={value('username')} placeholder={host ? 'hollow_at_alder' : 'lightseeker'} />
      </Field>
      <Field label="Create a password" htmlFor={`${idPrefix}password`} error={e.password} hint="At least 8 characters.">
        <input id={`${idPrefix}password`} name="password" type="password" autoComplete="new-password" required minLength={8} />
      </Field>
      {host && (
        <Field label="Property location (optional)" htmlFor={`${idPrefix}propertyAddress`} error={e.propertyAddress} hint="You can add or change this on your profile.">
          <input id={`${idPrefix}propertyAddress`} name="propertyAddress" type="text" autoComplete="street-address" defaultValue={value('propertyAddress')} placeholder="1820 SE Alder Ct, Portland, OR" />
        </Field>
      )}
      <Field label="Invite code (optional)" htmlFor={`${idPrefix}referralCode`} error={e.referralCode}>
        <input id={`${idPrefix}referralCode`} name="referralCode" type="text" defaultValue={value('referralCode', invite)} placeholder="PORCH-7Q4K" />
      </Field>
      <label className="check" htmlFor={`${idPrefix}marketingOptIn`}><input type="checkbox" id={`${idPrefix}marketingOptIn`} name="marketingOptIn" defaultChecked={checked('marketingOptIn')} /><span>Email me when a new holiday contest opens.</span></label>
      <div className="field">
        <label className="check" htmlFor={`${idPrefix}terms`}><input type="checkbox" id={`${idPrefix}terms`} name="terms" defaultChecked={checked('terms')} /><span>I&apos;m 18 or older and I accept the <a href="/terms" target="_blank" rel="noopener">Terms and contest rules</a> and <a href="/privacy" target="_blank" rel="noopener">Privacy Policy</a>.</span></label>
        {e.terms && <span className="err" role="alert">{e.terms}</span>}
      </div>
      <SubmitButton pendingText="Sending your link…">Send my confirmation link</SubmitButton>
    </form>
  );
}
