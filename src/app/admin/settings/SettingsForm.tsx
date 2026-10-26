'use client';

import { useActionState } from 'react';
import { saveSettings } from '../../actions/admin';
import { Field } from '@/components/Field';
import { SubmitButton } from '@/components/SubmitButton';

export function SettingsForm({ notificationEmail, emailFrom }: { notificationEmail: string; emailFrom: string }) {
  const [state, action] = useActionState(saveSettings, undefined);
  const e = state?.errors ?? {};
  return (
    <form action={action} className="stack" noValidate>
      {state?.message && <p className="notice" role="status">{state.message}</p>}
      <Field label="Send form notifications to" htmlFor="notificationEmail" error={e.notificationEmail} hint="New sign-ups and house submissions are emailed here.">
        <input id="notificationEmail" name="notificationEmail" type="email" defaultValue={notificationEmail} placeholder="hello@yourdomain.com" />
      </Field>
      <Field label="Send emails from" htmlFor="emailFrom" error={e.emailFrom} hint="Must be an address on a domain you verified with Resend, for example Porchlight <hello@yourdomain.com>.">
        <input id="emailFrom" name="emailFrom" type="text" defaultValue={emailFrom} />
      </Field>
      <SubmitButton pendingText="Saving…" className="btn primary">Save settings</SubmitButton>
    </form>
  );
}
