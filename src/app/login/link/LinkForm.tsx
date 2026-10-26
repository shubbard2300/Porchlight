'use client';

import { requestLoginLink } from '../../actions/auth';
import { Field } from '@/components/Field';
import { SubmitButton } from '@/components/SubmitButton';
import { useFormAction } from '@/components/useFormAction';

export function LinkForm({ next }: { next?: string }) {
  const { formAction: action, errors: e, value } = useFormAction(requestLoginLink);
  return (
    <form action={action} className="stack" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      <Field label="Email" htmlFor="email" error={e.email}><input id="email" name="email" type="email" autoComplete="email" required defaultValue={value('email')} /></Field>
      <SubmitButton pendingText="Sending…">Email me a sign-in link</SubmitButton>
    </form>
  );
}
