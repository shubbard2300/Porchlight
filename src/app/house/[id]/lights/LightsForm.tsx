'use client';

import { useState, useTransition } from 'react';
import { removeLights, rotateLightsSecret, saveLights, testLights } from '../../../actions/lights';
import { Field } from '@/components/Field';
import { SubmitButton } from '@/components/SubmitButton';
import { useFormAction } from '@/components/useFormAction';
import { LIGHT_EVENTS } from '@/lib/porchLights';

type Saved = { url: string; enabled: boolean; onCheckIn: boolean; onLike: boolean; onCatch: boolean } | null;

export function LightsForm({ houseId, saved }: { houseId: string; saved: Saved }) {
  const { state, formAction, errors: e, value, checked } = useFormAction(saveLights.bind(null, houseId));
  const [note, setNote] = useState('');
  const [pending, start] = useTransition();
  return (
    <form action={formAction} className="stack" noValidate>
      {e.form && <p className="err" role="alert">{e.form}</p>}
      {state?.message && <p className="notice" role="status">{state.message}</p>}
      <Field label="Webhook link" htmlFor="lt-url" error={e.url} hint="From IFTTT, Home Assistant, Zapier or any service that takes a POST. It must start with https://">
        <input id="lt-url" name="url" type="url" inputMode="url" autoComplete="off" spellCheck={false} defaultValue={value('url', saved?.url ?? '')} placeholder="https://maker.ifttt.com/trigger/porch_flash/with/key/…" />
      </Field>
      <fieldset className="alert-kinds">
        <legend className="label">Flash my lights when</legend>
        {LIGHT_EVENTS.map((ev) => (
          <label key={ev.key} className="check" htmlFor={`lt-${ev.key}`}>
            <input type="checkbox" id={`lt-${ev.key}`} name={ev.flag} defaultChecked={checked(ev.flag, saved ? saved[ev.flag] : true)} />
            <span><b>{ev.label}</b><span className="small muted"> · {ev.hint}</span></span>
          </label>
        ))}
      </fieldset>
      <label className="check" htmlFor="lt-enabled">
        <input type="checkbox" id="lt-enabled" name="enabled" defaultChecked={checked('enabled', saved?.enabled ?? true)} />
        <span><b>Lights on</b><span className="small muted"> · Untick to pause without losing your setup.</span></span>
      </label>
      <div className="row" style={{ gap: 10 }}>
        <SubmitButton pendingText="Saving…" className="btn primary">{saved ? 'Save changes' : 'Connect my lights'}</SubmitButton>
        {saved && <>
          <button type="button" className="btn ghost" disabled={pending} onClick={() => start(async () => setNote(await testLights(houseId)))}>{pending ? 'Sending…' : 'Send a test flash'}</button>
          <button type="button" className="btn ghost sm" disabled={pending} onClick={() => { if (confirm('Make a new signing secret? Anything checking the old one will need the new one.')) start(() => rotateLightsSecret(houseId)); }}>New secret</button>
          <button type="button" className="btn ghost sm" disabled={pending} onClick={() => { if (confirm('Disconnect your lights from Porchlight?')) start(() => removeLights(houseId)); }}>Disconnect</button>
        </>}
      </div>
      {note && <p className="small" role="status">Test: {note}</p>}
    </form>
  );
}
