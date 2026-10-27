'use client';

import { sendContact } from '@/app/actions/contact';
import { Field } from '@/components/Field';
import { Icon3D } from '@/components/Icon3D';
import { SubmitButton } from '@/components/SubmitButton';
import { useFormAction } from '@/components/useFormAction';
import { CONTACT_TOPICS } from '@/lib/contact';

export type ContactDefaults = { name?: string; email?: string; topic?: string };

export function ContactForm({ defaults = {}, idPrefix = 'contact' }: { defaults?: ContactDefaults; idPrefix?: string }) {
  const { state, formAction: action, errors: e, value } = useFormAction(sendContact);
  const id = (f: string) => `${idPrefix}-${f}`;
  if (state?.message) {
    return (
      <div className="stack" style={{ justifyItems: 'center', textAlign: 'center' }} role="status">
        <Icon3D name="envelope" size={72} />
        <h2 style={{ fontSize: 22 }}>Message sent</h2>
        <p className="muted">{state.message}</p>
      </div>
    );
  }
  const topic = value('topic', CONTACT_TOPICS.find((t) => t === defaults.topic) ?? CONTACT_TOPICS[0]);
  return (
    <form action={action} className="stack" noValidate>
      {e.form && <p className="err" role="alert">{e.form}</p>}
      <div className="two">
        <Field label="Your name" htmlFor={id('name')} error={e.name}>
          <input id={id('name')} name="name" type="text" autoComplete="name" required defaultValue={value('name', defaults.name)} />
        </Field>
        <Field label="Email" htmlFor={id('email')} error={e.email} hint="So we can write back.">
          <input id={id('email')} name="email" type="email" autoComplete="email" required defaultValue={value('email', defaults.email)} />
        </Field>
      </div>
      <Field label="What’s it about?" htmlFor={id('topic')} error={e.topic}>
        <select id={id('topic')} name="topic" defaultValue={topic}>
          {CONTACT_TOPICS.map((t) => <option key={t}>{t}</option>)}
        </select>
      </Field>
      <Field label="Message" htmlFor={id('message')} error={e.message}>
        <textarea id={id('message')} name="message" required rows={5} maxLength={2000} defaultValue={value('message')} placeholder="How can we help?" />
      </Field>
      <div className="hp" aria-hidden="true">
        <label htmlFor={id('website')}>Leave this empty</label>
        <input id={id('website')} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <SubmitButton pendingText="Sending…">Send message</SubmitButton>
    </form>
  );
}
