'use client';

import { addSponsor } from '../../actions/pot';
import { Field } from '@/components/Field';
import { SubmitButton } from '@/components/SubmitButton';
import { useFormAction } from '@/components/useFormAction';

export function SponsorForm({ seasons, season, merchants }: { seasons: { key: string; label: string }[]; season: string; merchants: { id: string; name: string }[] }) {
  const { state, formAction, errors: e, value } = useFormAction(addSponsor);
  return (
    <form action={formAction} className="stack" noValidate>
      {e.form && <p className="err" role="alert">{e.form}</p>}
      {state?.message && <p className="notice" role="status">{state.message}</p>}
      <div className="two">
        <Field label="Contest" htmlFor="sp-season" error={e.season}>
          <select id="sp-season" name="season" defaultValue={value('season', season)}>
            {seasons.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </Field>
        <Field label="Amount (dollars)" htmlFor="sp-amount" error={e.amount}><input id="sp-amount" name="amount" type="number" min={1} step="0.01" inputMode="decimal" defaultValue={value('amount')} placeholder="250" /></Field>
      </div>
      <div className="two">
        <Field label="Pitstop (optional)" htmlFor="sp-merchant" error={e.merchantId}>
          <select id="sp-merchant" name="merchantId" defaultValue={value('merchantId')}>
            <option value="">Not a pitstop</option>
            {merchants.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </Field>
        <Field label="Sponsor name" htmlFor="sp-name" error={e.sponsorName} hint="Leave blank to use the pitstop's name."><input id="sp-name" name="sponsorName" maxLength={80} defaultValue={value('sponsorName')} placeholder="Alder Street Coffee" /></Field>
      </div>
      <SubmitButton pendingText="Adding…" className="btn primary">Add to the pot</SubmitButton>
    </form>
  );
}
