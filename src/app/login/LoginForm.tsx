'use client';

import { useActionState } from 'react';
import { requestLoginLink } from '../actions/auth';
import { Field } from '@/components/Field';
import { SubmitButton } from '@/components/SubmitButton';

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(requestLoginLink, undefined);
  const e = state?.errors ?? {};
  return (
    <form action={action} className="stack" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      <Field label="Email" htmlFor="email" error={e.email}><input id="email" name="email" type="email" autoComplete="email" required /></Field>
      <SubmitButton pendingText="Sending…">Email me a sign-in link</SubmitButton>
    </form>
  );
}
