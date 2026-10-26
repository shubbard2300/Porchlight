'use client';

import { useActionState } from 'react';
import { join } from '../../actions/auth';
import { Field } from '@/components/Field';
import { SubmitButton } from '@/components/SubmitButton';

export function JoinForm({ accountType, invite }: { accountType: 'VIEWER' | 'HOST'; invite?: string }) {
  const [state, action] = useActionState(join, undefined);
  const e = state?.errors ?? {};
  const host = accountType === 'HOST';
  return (
    <form action={action} className="stack" noValidate>
      <input type="hidden" name="accountType" value={accountType} />
      <Field label="Email" htmlFor="email" error={e.email} hint="We'll send a link to confirm it's you. No password needed.">
        <input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Choose a username" htmlFor="username" error={e.username} hint="3 to 20 letters, numbers or underscores. This is how others see you.">
        <input id="username" name="username" type="text" autoComplete="username" required placeholder={host ? 'hollow_at_alder' : 'lightseeker'} />
      </Field>
      {host && (
        <Field label="Property location (optional)" htmlFor="propertyAddress" error={e.propertyAddress} hint="You can add or change this on your profile.">
          <input id="propertyAddress" name="propertyAddress" type="text" autoComplete="street-address" placeholder="1820 SE Alder Ct, Portland, OR" />
        </Field>
      )}
      <Field label="Invite code (optional)" htmlFor="referralCode" error={e.referralCode}>
        <input id="referralCode" name="referralCode" type="text" defaultValue={invite} placeholder="PORCH-7Q4K" />
      </Field>
      <label className="check" htmlFor="marketingOptIn"><input type="checkbox" id="marketingOptIn" name="marketingOptIn" /><span>Email me when a new holiday contest opens.</span></label>
      <div className="field">
        <label className="check" htmlFor="terms"><input type="checkbox" id="terms" name="terms" /><span>I&apos;m 18 or older and I accept the contest rules.</span></label>
        {e.terms && <span className="err" role="alert">{e.terms}</span>}
      </div>
      <SubmitButton pendingText="Sending your link…">Send my confirmation link</SubmitButton>
    </form>
  );
}
