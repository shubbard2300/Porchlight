'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { submitHouse } from '../actions/houses';
import type { HousePhotoView } from '../actions/housePhotos';
import { Field } from '@/components/Field';
import { HousePhotoPicker } from '@/components/HousePhotoPicker';
import { AddressGuessCard, useAddressGuess } from '@/components/AddressGuess';
import { deviceLocation } from '@/lib/photoPrep';
import { neighborhoodFor, type AddressGuess } from '../actions/geo';
import { SubmitButton } from '@/components/SubmitButton';
import { useFormAction } from '@/components/useFormAction';
import { CONTRIBUTIONS, HOUSE_TAGS, LIT_FROM, LIT_UNTIL } from '@/lib/houseOptions';
import { bracketsFor } from '@/lib/brackets';
import { Icon3D } from '@/components/Icon3D';
import { CONTEST_STATE, rulesAgreementText } from '@/lib/legal';

type Option = { key: string; holiday: string; label: string; note: string };
export type Prefill = { name: string; address: string; neighborhood: string; description: string };

export function SubmitForm({ seasons, defaultSeason, prefill, photos, neighborhoods = [] }: { seasons: Option[]; defaultSeason: string; prefill: Prefill; photos: HousePhotoView[]; neighborhoods?: string[] }) {
  const { formAction: action, errors: e, value, checked } = useFormAction(submitHouse);
  const [amount, setAmount] = useState(0);
  const [season, setSeason] = useState(value('season', defaultSeason));
  const brackets = bracketsFor(seasons.find((s) => s.key === season)?.holiday ?? '');
  const address = useRef<HTMLInputElement>(null);
  const neighborhood = useRef<HTMLInputElement>(null);
  const { guess, lookUp, clear } = useAddressGuess();
  const [locateError, setLocateError] = useState<string>();
  const triedTown = useRef(false);
  const [nbHint, setNbHint] = useState(false);

  /** Fills an empty Neighborhood field, from a suggestion or by looking up the typed address. */
  const fillNeighborhood = async (name: string | null, fromAddress?: string) => {
    const field = neighborhood.current;
    if (!field || field.value.trim()) return;
    const found = name ?? (fromAddress ? await neighborhoodFor(fromAddress).catch(() => null) : null);
    if (found && !field.value.trim()) {
      field.value = found;
      setNbHint(true);
    }
  };

  /** Suggests an address for the host to confirm, unless it's what the field already says. */
  const suggest = async (where: Parameters<typeof lookUp>[0]) => {
    const g = await lookUp(where);
    if (g && g.address.toLowerCase() === address.current?.value.trim().toLowerCase()) clear();
  };

  // A photo with a location suggests the street address; one without suggests the town, once, if the field is empty.
  const onLocated = (p: HousePhotoView) => {
    if (p.lat !== null && p.lng !== null) suggest({ lat: p.lat, lng: p.lng, source: p.locationSource === 'photo' ? 'photo' : 'device' });
    else if (!triedTown.current && !address.current?.value.trim()) {
      triedTown.current = true;
      suggest(null);
    }
  };

  const atHouse = async () => {
    setLocateError(undefined);
    const c = await deviceLocation();
    if (c) suggest({ ...c, source: 'device' });
    else setLocateError('We could not get your location. Allow location for this site, or type your address.');
  };

  const accept = (g: AddressGuess) => {
    const input = address.current;
    if (input) {
      // A town from the connection is only a start: leave the cursor in front of it for the street.
      input.value = g.source === 'ip' ? `, ${g.address}` : g.address;
      input.focus();
      if (g.source === 'ip') input.setSelectionRange(0, 0);
    }
    fillNeighborhood(g.neighborhood, g.source === 'ip' ? undefined : g.address);
    clear();
  };

  return (
    <form action={action} className="stack" noValidate>
      {e.form && <p className="err" role="alert">{e.form}</p>}
      <Field label="Which holiday?" error={e.season} hint="You can post for the next holiday early. Finished holidays are closed to new submissions.">
        <div className="chips">
          {seasons.map((s) => (
            <span key={s.key}>
              <input type="radio" id={`season-${s.key}`} name="season" value={s.key} defaultChecked={checked('season', s.key === defaultSeason, s.key)} onChange={() => setSeason(s.key)} />
              <label htmlFor={`season-${s.key}`}>{s.label} <span className="muted small">{s.note}</span></label>
            </span>
          ))}
        </div>
      </Field>
      <Field label="Which bracket are you competing in?" error={e.bracket} hint="You only go head to head with houses in your bracket, and visitors can filter the map by it.">
        <div className="chips">
          {brackets.map((b) => (
            <span key={b.key}>
              <input type="radio" id={`bracket-${b.key}`} name="bracket" value={b.key} defaultChecked={checked('bracket', false, b.key)} />
              <label htmlFor={`bracket-${b.key}`} title={b.blurb} className="chip-icon"><Icon3D name={b.icon} size={20} />{b.label}</label>
            </span>
          ))}
        </div>
      </Field>
      <Field label="Photos of your display" error={e.photoIds}>
        <HousePhotoPicker inputName="photoIds" initial={photos} onLocated={onLocated} />
      </Field>
      <AddressGuessCard guess={guess} onAccept={accept} onReject={() => { clear(); address.current?.focus(); }} />
      <Field label="Name your display" htmlFor="name" error={e.name}><input id="name" name="name" type="text" maxLength={60} defaultValue={value('name', prefill.name)} placeholder="The Hollow at Alder" /></Field>
      <Field label="Street address" htmlFor="address" error={e.address} hint={<>{CONTEST_STATE && `Contests are open to homes in ${CONTEST_STATE.name} right now. `}<button type="button" className="linkish" onClick={atHouse}>📍 I&apos;m at the house now</button>{locateError && <span className="err" role="alert"> {locateError}</span>}</>}><input ref={address} id="address" name="address" type="text" maxLength={120} autoComplete="street-address" defaultValue={value('address', prefill.address)} placeholder="1820 SE Alder Ct, Portland, OR" onBlur={(ev) => fillNeighborhood(null, ev.target.value)} /></Field>
      <Field label="Neighborhood (optional)" htmlFor="neighborhood" error={e.neighborhood} hint={nbHint ? 'Filled in from your address. Change it if neighbors call it something else.' : 'We’ll suggest one from your address.'}>
        <input ref={neighborhood} id="neighborhood" name="neighborhood" type="text" maxLength={60} defaultValue={value('neighborhood', prefill.neighborhood)} placeholder="Sunnyside" list="neighborhood-options" autoComplete="off" onInput={() => setNbHint(false)} />
        <datalist id="neighborhood-options">{neighborhoods.map((n) => <option key={n} value={n} />)}</datalist>
      </Field>
      <label className="check" htmlFor="showExactAddress"><input type="checkbox" id="showExactAddress" name="showExactAddress" defaultChecked={checked('showExactAddress', true)} /><span>Show my exact address to signed-in members. Turn this off to show only your neighborhood until visitors check in. People who aren&apos;t signed in never see your address.</span></label>
      <Field label="What makes it special?" error={e.tags}>
        <div className="chips">
          {HOUSE_TAGS.map((t, i) => (
            <span key={t}><input type="checkbox" id={`tag-${i}`} name="tags" value={t} defaultChecked={checked('tags', false, t)} /><label htmlFor={`tag-${i}`}>{t}</label></span>
          ))}
        </div>
      </Field>
      <div className="two">
        <Field label="Lights on" htmlFor="litFrom"><select id="litFrom" name="litFrom" defaultValue={value('litFrom', '6 pm')}>{LIT_FROM.map((t) => <option key={t}>{t}</option>)}</select></Field>
        <Field label="Lights off" htmlFor="litUntil"><select id="litUntil" name="litUntil" defaultValue={value('litUntil', '10 pm')}>{LIT_UNTIL.map((t) => <option key={t}>{t}</option>)}</select></Field>
      </div>
      <Field label="Tell visitors what to look for" htmlFor="description" error={e.description}>
        <textarea id="description" name="description" maxLength={600} defaultValue={value('description', prefill.description)} placeholder="The skeleton choir sings every 20 minutes. Park on 18th and walk down." />
      </Field>
      <Field label="Add to the pot (optional)" error={e.contribution} hint={<>Free submissions compete for the same prize. This records your pledge; you can pay it by card once your house is approved. <Link href="/rules">Official rules</Link></>}>
        <div className="chips">
          {CONTRIBUTIONS.map((a) => (
            <span key={a}>
              <input type="radio" id={`amt-${a}`} name="contribution" value={a} checked={amount === a} onChange={() => setAmount(a)} />
              <label htmlFor={`amt-${a}`}>{a ? `$${a}` : 'Free'}</label>
            </span>
          ))}
        </div>
      </Field>
      <div className="field">
        <label className="check" htmlFor="permission"><input type="checkbox" id="permission" name="permission" defaultChecked={checked('permission')} /><span>I live here or have the owner&apos;s permission, and the display is visible from the sidewalk.</span></label>
        {e.permission && <span className="err" role="alert">{e.permission}</span>}
      </div>
      <div className="field">
        <label className="check" htmlFor="agreeRules"><input type="checkbox" id="agreeRules" name="agreeRules" defaultChecked={checked('agreeRules')} /><span>{rulesAgreementText()} <Link href="/rules" target="_blank">Official rules</Link> · <Link href="/privacy" target="_blank">Privacy</Link></span></label>
        {e.agreeRules && <span className="err" role="alert">{e.agreeRules}</span>}
      </div>
      <SubmitButton pendingText="Posting…">Light it up</SubmitButton>
    </form>
  );
}
