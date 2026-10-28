'use client';

import { saveMerchant } from '../../actions/merchants';
import { Field } from '@/components/Field';
import { SubmitButton } from '@/components/SubmitButton';
import { useFormAction } from '@/components/useFormAction';
import { PITSTOP_CATEGORIES, TIERS, type Tier } from '@/lib/pitstops';

export type MerchantValues = {
  id?: string; name: string; category: string; tier: Tier; address: string; offer: string;
  hours: string; website: string; lat: string; lng: string; active: boolean;
};

export const EMPTY_MERCHANT: MerchantValues = { name: '', category: 'cafe', tier: 'SILVER', address: '', offer: '', hours: '', website: '', lat: '', lng: '', active: true };

export function MerchantForm({ initial }: { initial: MerchantValues }) {
  const { formAction, errors: e, value, checked } = useFormAction(saveMerchant);
  return (
    <form action={formAction} className="stack" noValidate>
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      {e.form && <p className="err" role="alert">{e.form}</p>}
      <div className="two">
        <Field label="Business name" htmlFor="m-name" error={e.name}><input id="m-name" name="name" maxLength={60} defaultValue={value('name', initial.name)} placeholder="Alder Street Coffee" /></Field>
        <Field label="Category" htmlFor="m-category" error={e.category}>
          <select id="m-category" name="category" defaultValue={value('category', initial.category)}>
            {PITSTOP_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Sponsorship tier" error={e.tier} hint="Gold pins are biggest and win the “pitstop nearby” slot on house pages over slightly closer lower tiers.">
        <div className="chips">
          {(Object.keys(TIERS) as Tier[]).map((t) => (
            <span key={t}><input type="radio" id={`tier-${t}`} name="tier" value={t} defaultChecked={checked('tier', initial.tier === t, t)} /><label htmlFor={`tier-${t}`}>{TIERS[t].label}</label></span>
          ))}
        </div>
      </Field>
      <Field label="Offer for visitors" htmlFor="m-offer" error={e.offer} hint="Shown on the map pin and the pitstop page."><input id="m-offer" name="offer" maxLength={120} defaultValue={value('offer', initial.offer)} placeholder="20% off hot cocoa after 5 pm" /></Field>
      <Field label="Street address" htmlFor="m-address" error={e.address}><input id="m-address" name="address" maxLength={120} defaultValue={value('address', initial.address)} placeholder="2100 SE Alder St, Portland, OR" /></Field>
      <div className="two">
        <Field label="Hours (optional)" htmlFor="m-hours" error={e.hours}><input id="m-hours" name="hours" maxLength={60} defaultValue={value('hours', initial.hours)} placeholder="Open until 10 pm" /></Field>
        <Field label="Website (optional)" htmlFor="m-website" error={e.website}><input id="m-website" name="website" type="url" maxLength={200} defaultValue={value('website', initial.website)} placeholder="https://" /></Field>
      </div>
      <div className="two">
        <Field label="Latitude (optional)" htmlFor="m-lat" error={e.lat} hint="Leave both blank to place the pin from the address."><input id="m-lat" name="lat" inputMode="decimal" defaultValue={value('lat', initial.lat)} /></Field>
        <Field label="Longitude (optional)" htmlFor="m-lng" error={e.lng}><input id="m-lng" name="lng" inputMode="decimal" defaultValue={value('lng', initial.lng)} /></Field>
      </div>
      <label className="check" htmlFor="m-active"><input type="checkbox" id="m-active" name="active" defaultChecked={checked('active', initial.active)} /><span>Show on the map</span></label>
      <SubmitButton pendingText="Saving…" className="btn primary">{initial.id ? 'Save pitstop' : 'Add pitstop'}</SubmitButton>
    </form>
  );
}
