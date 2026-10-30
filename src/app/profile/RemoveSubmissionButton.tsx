'use client';

import { useTransition } from 'react';
import { deleteMyHouse } from '../actions/houses';

export function RemoveSubmissionButton({ id, name }: { id: string; name: string }) {
  const [pending, start] = useTransition();
  const remove = () => {
    if (confirm(`Remove ${name} from Porchlight? Its photos, votes and comments go too, and this can't be undone.`)) start(() => deleteMyHouse(id));
  };
  return (
    <button type="button" className="btn sm danger" disabled={pending} onClick={remove}>
      {pending ? 'Removing…' : 'Remove submission'}
    </button>
  );
}
