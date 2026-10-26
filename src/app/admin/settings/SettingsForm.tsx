'use client';

import { saveSettings } from '../../actions/admin';
import { Field } from '@/components/Field';
import { SubmitButton } from '@/components/SubmitButton';
import { useFormAction } from '@/components/useFormAction';

export function SettingsForm({ notificationEmail, emailFrom, replyTo }: { notificationEmail: string; emailFrom: string; replyTo: string }) {
  const { state, formAction: action, errors: e, value } = useFormAction(saveSettings);
  return (
    <form action={action} className="stack" noValidate>
      {state?.message && <p className="notice" role="status">{state.message}</p>}
      <Field label="Send form notifications to" htmlFor="notificationEmail" error={e.notificationEmail} hint="New sign-ups and house submissions are emailed here.">
        <input id="notificationEmail" name="notificationEmail" type="email" defaultValue={value('notificationEmail', notificationEmail)} placeholder="hello@yourdomain.com" />
      </Field>
      <Field label="Send emails from" htmlFor="emailFrom" error={e.emailFrom} hint="Must be an address on a domain you verified with Resend, for example Porchlight <hello@yourdomain.com>.">
        <input id="emailFrom" name="emailFrom" type="text" defaultValue={value('emailFrom', emailFrom)} />
      </Field>
      <Field label="Replies go to" htmlFor="replyTo" error={e.replyTo} hint="When members reply to a Porchlight email, it lands here. Use your forwarding address, for example hello@yourdomain.com.">
        <input id="replyTo" name="replyTo" type="email" defaultValue={value('replyTo', replyTo)} placeholder="hello@yourdomain.com" />
      </Field>
      <SubmitButton pendingText="Saving…" className="btn primary">Save settings</SubmitButton>
    </form>
  );
}
