'use client';

import { useActionState } from 'react';
import { saveHostProfile, saveProfile } from '../actions/profile';
import { Field } from '@/components/Field';
import { SubmitButton } from '@/components/SubmitButton';

type Profile = { displayName: string; hometown: string; bio: string; marketingOptIn: boolean };
type Host = { propertyAddress: string; neighborhood: string; hostSeason: string; decorationTheme: string; propertyDetails: string };

export function AboutForm({ p }: { p: Profile }) {
  const [state, action] = useActionState(saveProfile, undefined);
  const e = state?.errors ?? {};
  return (
    <form action={action} className="stack" noValidate>
      {state?.message && <p className="notice" role="status">{state.message}</p>}
      <div className="two">
        <Field label="Display name" htmlFor="displayName" error={e.displayName}><input id="displayName" name="displayName" type="text" maxLength={60} defaultValue={p.displayName} placeholder="Sam R." /></Field>
        <Field label="Hometown" htmlFor="hometown" error={e.hometown}><input id="hometown" name="hometown" type="text" maxLength={60} defaultValue={p.hometown} placeholder="Portland, OR" /></Field>
      </div>
      <Field label="About you" htmlFor="bio" error={e.bio}><textarea id="bio" name="bio" maxLength={500} defaultValue={p.bio} placeholder="Hot cocoa in hand, chasing the best lights on the east side." /></Field>
      <label className="check" htmlFor="marketingOptIn"><input type="checkbox" id="marketingOptIn" name="marketingOptIn" defaultChecked={p.marketingOptIn} /><span>Email me when a new holiday contest opens.</span></label>
      <div><SubmitButton pendingText="Saving…" className="btn primary">Save profile</SubmitButton></div>
    </form>
  );
}

export function HostForm({ h, seasons }: { h: Host; seasons: { key: string; label: string }[] }) {
  const [state, action] = useActionState(saveHostProfile, undefined);
  const e = state?.errors ?? {};
  return (
    <form action={action} className="stack" noValidate>
      {state?.message && <p className="notice" role="status">{state.message}</p>}
      {e.form && <p className="err" role="alert">{e.form}</p>}
      <div className="two">
        <Field label="Property address" htmlFor="propertyAddress" error={e.propertyAddress}><input id="propertyAddress" name="propertyAddress" type="text" maxLength={120} autoComplete="street-address" defaultValue={h.propertyAddress} placeholder="1820 SE Alder Ct, Portland, OR" /></Field>
        <Field label="Neighborhood" htmlFor="neighborhood" error={e.neighborhood}><input id="neighborhood" name="neighborhood" type="text" maxLength={60} defaultValue={h.neighborhood} placeholder="Sunnyside" /></Field>
      </div>
      <div className="two">
        <Field label="This season I'm decorating for" htmlFor="hostSeason" error={e.hostSeason}>
          <select id="hostSeason" name="hostSeason" defaultValue={h.hostSeason}>
            <option value="">Choose a holiday</option>
            {seasons.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </Field>
        <Field label="Decoration theme" htmlFor="decorationTheme" error={e.decorationTheme}><input id="decorationTheme" name="decorationTheme" type="text" maxLength={80} defaultValue={h.decorationTheme} placeholder="Skeleton graveyard choir" /></Field>
      </div>
      <Field label="About your property and display" htmlFor="propertyDetails" error={e.propertyDetails} hint="Parking tips, best viewing time, what's new this year, accessibility.">
        <textarea id="propertyDetails" name="propertyDetails" maxLength={1000} defaultValue={h.propertyDetails} placeholder="Corner lot, best seen from 18th Ave. The choir sings every 20 minutes from 6 to 10 pm." />
      </Field>
      <div><SubmitButton pendingText="Saving…" className="btn primary">Save property details</SubmitButton></div>
    </form>
  );
}
