'use client';

import { saveContestDates } from '../../actions/contests';
import { Icon3D, type Icon3DName } from '@/components/Icon3D';
import { SubmitButton } from '@/components/SubmitButton';
import { useFormAction } from '@/components/useFormAction';
import type { SeasonDates } from '@/lib/seasons';

export type ContestRow = {
  key: string; holiday: string; name: string; year: number; color: string; icon: Icon3DName;
  enabled: boolean; day: string; status: string; entries: number;
  dates: SeasonDates; usual: SeasonDates;
};

const FIELDS: [keyof SeasonDates, string][] = [
  ['submitOpens', 'Entries open'], ['submitCloses', 'Entries close'], ['opens', 'Voting opens'], ['closes', 'Voting closes'],
];

const short = (ymd: string) => new Date(`${ymd}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

export function ContestDatesForm({ rows }: { rows: ContestRow[] }) {
  const { state, formAction, errors: e, value, checked } = useFormAction(saveContestDates);
  const reset = (row: ContestRow) => {
    for (const [f] of FIELDS) {
      const input = document.getElementById(`${row.key}-${f}`) as HTMLInputElement | null;
      if (input) input.value = row.usual[f];
    }
  };
  return (
    <form action={formAction} className="stack" noValidate>
      {state?.message && <p className="notice" role="status">{state.message}</p>}
      {e.form && <p className="notice warn" role="alert">{e.form}</p>}
      <div className="contest-list">
        {rows.map((row) => {
          const on = checked(`on:${row.holiday}`, row.enabled);
          return (
            <section key={row.key} className="contest-card" style={{ '--contest': row.color } as React.CSSProperties}>
              <div className="contest-head">
                <input type="checkbox" id={`on-${row.holiday}`} name={`on:${row.holiday}`} defaultChecked={on} />
                <label htmlFor={`on-${row.holiday}`} className="contest-name">
                  <Icon3D name={row.icon} size={34} />
                  <span>
                    <b>{row.name} {row.year}</b>
                    <span className="small muted">{row.day}{row.entries ? ` · ${row.entries} ${row.entries === 1 ? 'entry' : 'entries'}` : ''}</span>
                  </span>
                </label>
                <span className="pill contest-status">{row.status}</span>
                <span className="pill contest-off">Off</span>
              </div>
              {row.entries > 0 && <p className="small contest-warn">Turning this off hides its {row.entries} {row.entries === 1 ? 'entry' : 'entries'} from the map and closes voting. Hosts keep them in their profile.</p>}
              <div className="contest-dates">
                {FIELDS.map(([f, label]) => {
                  const name = `${row.key}:${f}`;
                  return (
                    <div className="field" key={f}>
                      <label htmlFor={`${row.key}-${f}`}>{label}</label>
                      <input type="date" id={`${row.key}-${f}`} name={name} defaultValue={value(name, row.dates[f])} />
                      {e[name] ? <span className="err" role="alert">{e[name]}</span> : row.dates[f] !== row.usual[f] && <span className="hint">Usually {short(row.usual[f])}</span>}
                    </div>
                  );
                })}
              </div>
              <button type="button" className="btn ghost sm contest-reset" onClick={() => reset(row)}>Use the usual dates</button>
            </section>
          );
        })}
      </div>
      <div className="contest-save">
        <SubmitButton pendingText="Saving…" className="btn primary">Save contest dates</SubmitButton>
      </div>
    </form>
  );
}
