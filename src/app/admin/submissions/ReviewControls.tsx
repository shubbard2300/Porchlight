'use client';

import { useState, useTransition } from 'react';
import type { HouseStatus } from '@prisma/client';
import { placeHousePin, removeHouse, reviewHouse } from '../../actions/admin';

export function ReviewControls({ id, name, owner, status, needsPin = false }: { id: string; name: string; owner: string; status: HouseStatus; needsPin?: boolean }) {
  const [note, setNote] = useState('');
  const [pinMiss, setPinMiss] = useState(false);
  const [pending, start] = useTransition();
  const decide = (choice: 'approve' | 'reject') => start(() => reviewHouse(id, choice, note));
  const findPin = () => start(async () => setPinMiss(!(await placeHousePin(id)).ok));
  const remove = () => {
    if (confirm(`Delete ${name} and its photos for good? This can't be undone.`)) start(() => removeHouse(id, note));
  };
  return (
    <div className="row" style={{ alignItems: 'stretch' }}>
      <input type="text" value={note} onChange={(e) => setNote(e.target.value)} aria-label={`Note to ${owner}`} placeholder="Optional note to the poster" style={{ flex: '1 1 220px' }} />
      {status !== 'APPROVED' && <button type="button" className="btn primary sm" disabled={pending} onClick={() => decide('approve')}>Approve</button>}
      {status !== 'REJECTED' && <button type="button" className="btn danger sm" disabled={pending} onClick={() => decide('reject')}>{status === 'APPROVED' ? 'Take down' : 'Reject'}</button>}
      {needsPin && <button type="button" className="btn sm" disabled={pending} onClick={findPin}>Find pin from address</button>}
      <button type="button" className="btn ghost sm" disabled={pending} onClick={remove}>Delete</button>
      {pinMiss && <p className="small muted" role="status" style={{ flexBasis: '100%' }}>We couldn&rsquo;t find that address on the map. Ask the host to check it, or to add a photo taken at the house.</p>}
    </div>
  );
}
