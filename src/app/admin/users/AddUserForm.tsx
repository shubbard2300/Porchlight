'use client';

import { addUser } from '../../actions/admin';
import { Field } from '@/components/Field';
import { SubmitButton } from '@/components/SubmitButton';
import { useFormAction } from '@/components/useFormAction';
import { ACCESS_LEVELS } from '@/lib/roles';

/** Super Admins add someone by email and pick their access. The person gets an invite link. */
export function AddUserForm() {
  const { state, formAction: action, errors: e, value } = useFormAction(addUser);
  const ok = state?.message && !state.errors;
  return (
    <form action={action} className="stack" noValidate>
      {ok && <p className="notice" role="status">{state.message}</p>}
      <div className="two">
        <Field label="Email" htmlFor="add-email" error={e.email}>
          <input id="add-email" name="email" type="email" autoComplete="off" placeholder="neighbor@example.com" defaultValue={ok ? '' : value('email')} />
        </Field>
        <Field label="Access level" htmlFor="add-level" error={e.level}>
          <select id="add-level" name="level" defaultValue={ok ? 'EDITOR' : value('level', 'EDITOR')}>
            {ACCESS_LEVELS.map((l) => <option key={l.key} value={l.key}>{l.label}</option>)}
          </select>
        </Field>
      </div>
      <div><SubmitButton pendingText="Adding…" className="btn primary">Add and send invite</SubmitButton></div>
    </form>
  );
}
