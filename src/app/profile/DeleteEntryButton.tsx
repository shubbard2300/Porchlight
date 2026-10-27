'use client';

import { useTransition } from 'react';
import { deleteMyHouse } from '../actions/houses';

export function DeleteEntryButton({ id, name }: { id: string; name: string }) {
  const [pending, start] = useTransition();
  const remove = () => {
    if (confirm(`Delete ${name} and its photos? Its votes and comments go too, and this can't be undone.`)) start(() => deleteMyHouse(id));
  };
  return <button type="button" className="btn ghost sm" disabled={pending} onClick={remove}>{pending ? 'Deleting…' : 'Delete entry'}</button>;
}
