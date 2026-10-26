'use client';

import { useActionState, useState } from 'react';
import { submitHouse } from '../actions/houses';
import { Field } from '@/components/Field';
import { SubmitButton } from '@/components/SubmitButton';
import { CONTRIBUTIONS, HOUSE_TAGS } from '@/lib/houseOptions';

type Option = { key: string; label: string; note: string };
export type Prefill = { name: string; address: string; neighborhood: string; description: string };

export function SubmitForm({ seasons, defaultSeason, prefill }: { seasons: Option[]; defaultSeason: string; prefill: Prefill }) {
  const [state, action] = useActionState(submitHouse, undefined);
  const [amount, setAmount] = useState(0);
  const e = state?.errors ?? {};
  return (
    <form action={action} className="stack" noValidate>
      {e.form && <p className="err" role="alert">{e.form}</p>}
      <Field label="Which holiday?" error={e.season} hint="You can post for the next holiday early. Finished contests are closed to new entries.">
        <div className="chips">
          {seasons.map((s) => (
            <span key={s.key}>
              <input type="radio" id={`season-${s.key}`} name="season" value={s.key} defaultChecked={s.key === defaultSeason} />
              <label htmlFor={`season-${s.key}`}>{s.label} <span className="muted small">{s.note}</span></label>
            </span>
          ))}
        </div>
      </Field>
      <Field label="Name your display" htmlFor="name" error={e.name}><input id="name" name="name" type="text" maxLength={60} defaultValue={prefill.name} placeholder="The Hollow at Alder" /></Field>
      <Field label="Street address" htmlFor="address" error={e.address}><input id="address" name="address" type="text" maxLength={120} autoComplete="street-address" defaultValue={prefill.address} placeholder="1820 SE Alder Ct, Portland, OR" /></Field>
      <Field label="Neighborhood (optional)" htmlFor="neighborhood" error={e.neighborhood}><input id="neighborhood" name="neighborhood" type="text" maxLength={60} defaultValue={prefill.neighborhood} placeholder="Sunnyside" /></Field>
      <label className="check" htmlFor="showExactAddress"><input type="checkbox" id="showExactAddress" name="showExactAddress" defaultChecked /><span>Show my exact address. Turn this off to show only your neighborhood until visitors check in.</span></label>
      <Field label="What makes it special?" error={e.tags}>
        <div className="chips">
          {HOUSE_TAGS.map((t, i) => (
            <span key={t}><input type="checkbox" id={`tag-${i}`} name="tags" value={t} /><label htmlFor={`tag-${i}`}>{t}</label></span>
          ))}
        </div>
      </Field>
      <div className="two">
        <Field label="Lights on" htmlFor="litFrom"><select id="litFrom" name="litFrom" defaultValue="6 pm"><option>4:30 pm</option><option>5 pm</option><option>6 pm</option><option>7 pm</option></select></Field>
        <Field label="Lights off" htmlFor="litUntil"><select id="litUntil" name="litUntil" defaultValue="10 pm"><option>9 pm</option><option>10 pm</option><option>11 pm</option><option>Midnight</option></select></Field>
      </div>
      <Field label="Tell visitors what to look for" htmlFor="description" error={e.description}>
        <textarea id="description" name="description" maxLength={600} defaultValue={prefill.description} placeholder="The skeleton choir sings every 20 minutes. Park on 18th and walk down." />
      </Field>
      <Field label="Add to the pot (optional)" error={e.contribution} hint="Free entries compete for the same prize. This records your pledge; payment is collected separately.">
        <div className="chips">
          {CONTRIBUTIONS.map((a) => (
            <span key={a}>
              <input type="radio" id={`amt-${a}`} name="contribution" value={a} checked={amount === a} onChange={() => setAmount(a)} />
              <label htmlFor={`amt-${a}`}>{a ? `$${a}` : 'Free entry'}</label>
            </span>
          ))}
        </div>
      </Field>
      <div className="field">
        <label className="check" htmlFor="permission"><input type="checkbox" id="permission" name="permission" /><span>I live here or have the owner&apos;s permission, and the display is visible from the sidewalk.</span></label>
        {e.permission && <span className="err" role="alert">{e.permission}</span>}
      </div>
      <SubmitButton pendingText="Posting…">Light it up</SubmitButton>
    </form>
  );
}
