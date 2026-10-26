'use client';

import { useActionState } from 'react';
import { login } from '../actions/auth';
import { Field } from '@/components/Field';
import { SubmitButton } from '@/components/SubmitButton';

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(login, undefined);
  const e = state?.errors ?? {};
  return (
    <form action={action} className="stack" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      {e.form && <p className="err" role="alert">{e.form}</p>}
      <Field label="Email" htmlFor="email" error={e.email}><input id="email" name="email" type="email" autoComplete="email" required /></Field>
      <Field label="Password" htmlFor="password" error={e.password}><input id="password" name="password" type="password" autoComplete="current-password" required /></Field>
      <SubmitButton pendingText="Logging in…">Log in</SubmitButton>
    </form>
  );
}
