'use client';

import { useActionState } from 'react';
import { signup } from '../actions/auth';
import { Field } from '@/components/Field';
import { SubmitButton } from '@/components/SubmitButton';

export function SignupForm({ next, invite }: { next?: string; invite?: string }) {
  const [state, action] = useActionState(signup, undefined);
  const e = state?.errors ?? {};
  return (
    <form action={action} className="stack" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      <Field label="Your name" htmlFor="name" error={e.name}><input id="name" name="name" type="text" autoComplete="name" required /></Field>
      <Field label="Email" htmlFor="email" error={e.email}><input id="email" name="email" type="email" autoComplete="email" required /></Field>
      <Field label="Password" htmlFor="password" error={e.password} hint="At least 8 characters."><input id="password" name="password" type="password" autoComplete="new-password" required /></Field>
      <Field label="Invite code (optional)" htmlFor="referralCode" error={e.referralCode} hint="You and your neighbor both get bonus XP after your first verified visit.">
        <input id="referralCode" name="referralCode" type="text" defaultValue={invite} placeholder="PORCH-7Q4K" />
      </Field>
      <label className="check" htmlFor="marketingOptIn"><input type="checkbox" id="marketingOptIn" name="marketingOptIn" /><span>Email me when a new holiday contest opens.</span></label>
      <div className="field">
        <label className="check" htmlFor="terms"><input type="checkbox" id="terms" name="terms" /><span>I&apos;m 18 or older and I accept the contest rules.</span></label>
        {e.terms && <span className="err" role="alert">{e.terms}</span>}
      </div>
      <SubmitButton pendingText="Creating your account…">Create account and claim 100 XP</SubmitButton>
    </form>
  );
}
