'use client';

import { useState } from 'react';
import { deleteMyAccount, saveHostProfile, saveProfile, setPassword } from '../actions/profile';
import { confirmsDelete, DELETE_PHRASE } from '@/lib/deleteAccount';
import { updateMyHouse } from '../actions/houses';
import { LIT_FROM, LIT_UNTIL } from '@/lib/houseOptions';
import { Field } from '@/components/Field';
import { SubmitButton } from '@/components/SubmitButton';
import { useFormAction } from '@/components/useFormAction';

type Profile = { username: string; displayName: string; hometown: string; bio: string; marketingOptIn: boolean };
type HouseDetails = { name: string; address: string; neighborhood: string; showExactAddress: boolean; litFrom: string; litUntil: string; description: string };
type Host = { propertyAddress: string; neighborhood: string; hostSeason: string; decorationTheme: string; propertyDetails: string };

export function AboutForm({ p }: { p: Profile }) {
  const { state, formAction: action, errors: e, value, checked } = useFormAction(saveProfile);
  return (
    <form action={action} className="stack" noValidate>
      {state?.message && <p className="notice" role="status">{state.message}</p>}
      <Field label="Username" htmlFor="username" error={e.username} hint="3 to 20 letters, numbers or underscores. This is your @handle on Porchlight.">
        <input id="username" name="username" type="text" maxLength={20} autoComplete="username" autoCapitalize="none" spellCheck={false} defaultValue={value('username', p.username)} />
      </Field>
      <div className="two">
        <Field label="Display name" htmlFor="displayName" error={e.displayName}><input id="displayName" name="displayName" type="text" maxLength={60} defaultValue={value('displayName', p.displayName)} placeholder="Sam R." /></Field>
        <Field label="Hometown" htmlFor="hometown" error={e.hometown}><input id="hometown" name="hometown" type="text" maxLength={60} defaultValue={value('hometown', p.hometown)} placeholder="Portland, OR" /></Field>
      </div>
      <Field label="About you" htmlFor="bio" error={e.bio}><textarea id="bio" name="bio" maxLength={500} defaultValue={value('bio', p.bio)} placeholder="Hot cocoa in hand, chasing the best lights on the east side." /></Field>
      <label className="check" htmlFor="marketingOptIn"><input type="checkbox" id="marketingOptIn" name="marketingOptIn" defaultChecked={checked('marketingOptIn', p.marketingOptIn)} /><span>Email me when a new holiday contest opens.</span></label>
      <div><SubmitButton pendingText="Saving…" className="btn primary">Save profile</SubmitButton></div>
    </form>
  );
}

export function HostForm({ h, seasons }: { h: Host; seasons: { key: string; label: string }[] }) {
  const { state, formAction: action, errors: e, value } = useFormAction(saveHostProfile);
  return (
    <form action={action} className="stack" noValidate>
      {state?.message && <p className="notice" role="status">{state.message}</p>}
      {e.form && <p className="err" role="alert">{e.form}</p>}
      <div className="two">
        <Field label="Property address" htmlFor="propertyAddress" error={e.propertyAddress}><input id="propertyAddress" name="propertyAddress" type="text" maxLength={120} autoComplete="street-address" defaultValue={value('propertyAddress', h.propertyAddress)} placeholder="1820 SE Alder Ct, Portland, OR" /></Field>
        <Field label="Neighborhood" htmlFor="neighborhood" error={e.neighborhood}><input id="neighborhood" name="neighborhood" type="text" maxLength={60} defaultValue={value('neighborhood', h.neighborhood)} placeholder="Sunnyside" /></Field>
      </div>
      <div className="two">
        <Field label="This season I'm decorating for" htmlFor="hostSeason" error={e.hostSeason}>
          <select id="hostSeason" name="hostSeason" defaultValue={value('hostSeason', h.hostSeason)}>
            <option value="">Choose a holiday</option>
            {seasons.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </Field>
        <Field label="Decoration theme" htmlFor="decorationTheme" error={e.decorationTheme}><input id="decorationTheme" name="decorationTheme" type="text" maxLength={80} defaultValue={value('decorationTheme', h.decorationTheme)} placeholder="Skeleton graveyard choir" /></Field>
      </div>
      <Field label="About your property and display" htmlFor="propertyDetails" error={e.propertyDetails} hint="Parking tips, best viewing time, what's new this year, accessibility.">
        <textarea id="propertyDetails" name="propertyDetails" maxLength={1000} defaultValue={value('propertyDetails', h.propertyDetails)} placeholder="Corner lot, best seen from 18th Ave. The choir sings every 20 minutes from 6 to 10 pm." />
      </Field>
      <div><SubmitButton pendingText="Saving…" className="btn primary">Save property details</SubmitButton></div>
    </form>
  );
}

export function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const { state, formAction: action, errors: e } = useFormAction(setPassword);
  return (
    <form action={action} className="stack" noValidate>
      {state?.message && <p className="notice" role="status">{state.message}</p>}
      <div className="two">
        <Field label={hasPassword ? 'New password' : 'Password'} htmlFor="newPassword" error={e.password} hint="At least 8 characters.">
          <input id="newPassword" name="password" type="password" autoComplete="new-password" minLength={8} />
        </Field>
        <Field label="Type it again" htmlFor="confirmPassword" error={e.confirm}>
          <input id="confirmPassword" name="confirm" type="password" autoComplete="new-password" />
        </Field>
      </div>
      <div><SubmitButton pendingText="Saving…" className="btn ghost">{hasPassword ? 'Change password' : 'Set password'}</SubmitButton></div>
    </form>
  );
}

/** Delete your own account. The button stays off until they type DELETE, so it can't happen by a stray tap. */
export function DeleteAccountForm({ houses }: { houses: number }) {
  const { formAction: action, errors: e } = useFormAction(deleteMyAccount);
  const [typed, setTyped] = useState('');
  const ready = confirmsDelete(typed);
  return (
    <form action={action} className="stack" noValidate>
      <div className="notice warn stack" style={{ gap: 6 }}>
        <b>This can&apos;t be undone.</b>
        <span className="small">
          Deleting your account removes your profile, photo, XP, votes, comments and check-ins
          {houses > 0 ? `, plus your ${houses === 1 ? 'submission' : `${houses} submissions`} and ${houses === 1 ? 'its' : 'their'} photos and votes` : ''}.
          Any pot payment already made stays in the prize pot.
        </span>
      </div>
      {e.form && <p className="err" role="alert">{e.form}</p>}
      <Field label={`Type ${DELETE_PHRASE} to confirm`} hint="Capital letters or not, either works." htmlFor="deleteConfirm" error={e.confirm}>
        <input id="deleteConfirm" name="confirm" type="text" autoComplete="off" autoCapitalize="characters" spellCheck={false} value={typed} onChange={(ev) => setTyped(ev.target.value)} placeholder={DELETE_PHRASE} />
      </Field>
      <div>
        <DeleteButton ready={ready} />
      </div>
    </form>
  );
}

function DeleteButton({ ready }: { ready: boolean }) {
  return ready ? <SubmitButton pendingText="Deleting…" className="btn danger">Delete my account forever</SubmitButton> : <button type="button" className="btn danger" disabled>Delete my account forever</button>;
}

/** Edit a posted submission: its name, address, viewing hours and description. */
export function HouseDetailsForm({ id, h, live, staff = false }: { id: string; h: HouseDetails; live: boolean; staff?: boolean }) {
  const { state, formAction: action, errors: e, value, checked } = useFormAction(updateMyHouse.bind(null, id));
  const f = (name: string) => `${name}-${id}`;
  return (
    <form action={action} className="stack" noValidate>
      {state?.message && <p className="notice" role="status">{state.message}</p>}
      {e.form && <p className="err" role="alert">{e.form}</p>}
      <Field label="Display name" htmlFor={f('name')} error={e.name}><input id={f('name')} name="name" type="text" maxLength={60} defaultValue={value('name', h.name)} /></Field>
      <div className="two">
        <Field label="Address" htmlFor={f('address')} error={e.address} hint={staff ? 'A new address moves the pin on the map right away.' : live ? 'A new address moves your pin and gets a quick review first.' : 'A new address moves your pin on the map.'}>
          <input id={f('address')} name="address" type="text" maxLength={120} autoComplete="street-address" defaultValue={value('address', h.address)} />
        </Field>
        <Field label="Neighborhood" htmlFor={f('neighborhood')} error={e.neighborhood}><input id={f('neighborhood')} name="neighborhood" type="text" maxLength={60} defaultValue={value('neighborhood', h.neighborhood)} /></Field>
      </div>
      <label className="check" htmlFor={f('showExactAddress')}><input type="checkbox" id={f('showExactAddress')} name="showExactAddress" defaultChecked={checked('showExactAddress', h.showExactAddress)} /><span>{staff ? 'Show the exact address.' : 'Show my exact address.'} Turn this off to show only {staff ? 'the' : 'your'} neighborhood until visitors check in.</span></label>
      <div className="two">
        <Field label="Lights on" htmlFor={f('litFrom')}><select id={f('litFrom')} name="litFrom" defaultValue={value('litFrom', h.litFrom)}>{[...new Set([h.litFrom, ...LIT_FROM])].map((t) => <option key={t}>{t}</option>)}</select></Field>
        <Field label="Lights off" htmlFor={f('litUntil')}><select id={f('litUntil')} name="litUntil" defaultValue={value('litUntil', h.litUntil)}>{[...new Set([h.litUntil, ...LIT_UNTIL])].map((t) => <option key={t}>{t}</option>)}</select></Field>
      </div>
      <Field label="What to look for" htmlFor={f('description')} error={e.description}><textarea id={f('description')} name="description" maxLength={600} defaultValue={value('description', h.description)} /></Field>
      <div><SubmitButton pendingText="Saving…" className="btn primary">Save details</SubmitButton></div>
    </form>
  );
}
