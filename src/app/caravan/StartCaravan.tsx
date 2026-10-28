'use client';

import { startCaravan } from '../actions/caravans';
import { Field } from '@/components/Field';
import { SubmitButton } from '@/components/SubmitButton';
import { useFormAction } from '@/components/useFormAction';

export function StartCaravan() {
  const { formAction, errors: e, value } = useFormAction(startCaravan);
  return (
    <form action={formAction} className="stack" noValidate>
      {e.form && <p className="err" role="alert">{e.form}</p>}
      <Field label="Caravan name" htmlFor="c-name" error={e.name} hint="Shows on house pages next to your squad’s review.">
        <input id="c-name" name="name" maxLength={40} defaultValue={value('name', '')} placeholder="The Ghoul Gang" />
      </Field>
      <SubmitButton pendingText="Starting…" className="btn primary">Start a caravan</SubmitButton>
    </form>
  );
}
