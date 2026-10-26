'use client';

import Link from 'next/link';
import { login } from '../actions/auth';
import { Field } from '@/components/Field';
import { SubmitButton } from '@/components/SubmitButton';
import { useFormAction } from '@/components/useFormAction';

export function LoginForm({ next }: { next?: string }) {
  const { formAction: action, errors: e, value } = useFormAction(login);
  const linkHref = `/login/link${next ? `?next=${encodeURIComponent(next)}` : ''}`;
  return (
    <form action={action} className="stack" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      {e.form && <p className="err" role="alert">{e.form}</p>}
      <Field label="Email" htmlFor="email" error={e.email}><input id="email" name="email" type="email" autoComplete="email" required defaultValue={value('email')} /></Field>
      <Field label="Password" htmlFor="password" error={e.password} hint={<Link href={linkHref}>Forgot your password? Get a sign-in link</Link>}>
        <input id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>
      <SubmitButton pendingText="Logging in…">Log in</SubmitButton>
    </form>
  );
}
