'use client';

import { saveBlock } from '../../actions/blocks';
import { Field } from '@/components/Field';
import { SubmitButton } from '@/components/SubmitButton';
import { useFormAction } from '@/components/useFormAction';
import { DEFAULT_BLOCK_RADIUS_M } from '@/lib/blocks';

export type BlockValues = {
  id?: string; name: string; blurb: string; address: string; radiusM: string; lat: string; lng: string; featured: boolean; active: boolean;
};

export const EMPTY_BLOCK: BlockValues = { name: '', blurb: '', address: '', radiusM: String(DEFAULT_BLOCK_RADIUS_M), lat: '', lng: '', featured: true, active: true };

export function BlockForm({ initial }: { initial: BlockValues }) {
  const { formAction, errors: e, value, checked } = useFormAction(saveBlock);
  return (
    <form action={formAction} className="stack" noValidate>
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      {e.form && <p className="err" role="alert">{e.form}</p>}
      <Field label="Block name" htmlFor="b-name" error={e.name}><input id="b-name" name="name" maxLength={60} defaultValue={value('name', initial.name)} placeholder="Peacock Lane" /></Field>
      <Field label="Why it’s worth the trip" htmlFor="b-blurb" error={e.blurb} hint="Shown on the map, the home page and the block page.">
        <textarea id="b-blurb" name="blurb" rows={2} maxLength={240} defaultValue={value('blurb', initial.blurb)} placeholder="A whole street that goes all out every year. Walk it end to end." />
      </Field>
      <div className="two">
        <Field label="Center (street or intersection)" htmlFor="b-address" error={e.address}><input id="b-address" name="address" maxLength={120} defaultValue={value('address', initial.address)} placeholder="SE Peacock Ln & SE Stark St, Portland, OR" /></Field>
        <Field label="Radius in meters" htmlFor="b-radius" error={e.radiusM} hint="Houses whose map pin is inside the zone belong to the block."><input id="b-radius" name="radiusM" inputMode="numeric" defaultValue={value('radiusM', initial.radiusM)} /></Field>
      </div>
      <div className="two">
        <Field label="Latitude (optional)" htmlFor="b-lat" error={e.lat} hint="Leave both blank to center the zone from the address."><input id="b-lat" name="lat" inputMode="decimal" defaultValue={value('lat', initial.lat)} /></Field>
        <Field label="Longitude (optional)" htmlFor="b-lng" error={e.lng}><input id="b-lng" name="lng" inputMode="decimal" defaultValue={value('lng', initial.lng)} /></Field>
      </div>
      <label className="check" htmlFor="b-featured"><input type="checkbox" id="b-featured" name="featured" defaultChecked={checked('featured', initial.featured)} /><span>Feature on the home page</span></label>
      <label className="check" htmlFor="b-active"><input type="checkbox" id="b-active" name="active" defaultChecked={checked('active', initial.active)} /><span>Show on the map</span></label>
      <SubmitButton pendingText="Saving…" className="btn primary">{initial.id ? 'Save block' : 'Add block'}</SubmitButton>
    </form>
  );
}
