'use client';

import { useState, useTransition } from 'react';
import { setHouseBracket } from '../actions/houses';
import { bracketsFor } from '@/lib/brackets';

export function BracketPicker({ houseId, holiday, initial }: { houseId: string; holiday: string; initial: string | null }) {
  const [value, setValue] = useState(initial ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, start] = useTransition();
  return (
    <div className="field">
      <label htmlFor={`bracket-${houseId}`}>Bracket</label>
      <select
        id={`bracket-${houseId}`} value={value} disabled={saving}
        onChange={(e) => {
          const next = e.target.value;
          setValue(next);
          setSaved(false);
          start(async () => {
            const r = await setHouseBracket(houseId, next);
            setError(r.error ?? null);
            setSaved(!r.error);
          });
        }}
      >
        {!initial && <option value="" disabled>Pick a bracket</option>}
        {bracketsFor(holiday).map((b) => <option key={b.key} value={b.key}>{b.label}: {b.blurb}</option>)}
      </select>
      {!initial && !saved && <span className="hint">Pick one so your house shows up in its bracket on the leaderboard.</span>}
      {saving && <span className="hint">Saving…</span>}
      {saved && !saving && <span className="hint">Saved.</span>}
      {error && <span className="err" role="alert">{error}</span>}
    </div>
  );
}
