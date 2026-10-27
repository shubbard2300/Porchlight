'use client';

import { useState, useTransition } from 'react';
import type { HouseStatus } from '@prisma/client';
import { reviewHouse } from '../../actions/admin';

export function ReviewControls({ id, owner, status }: { id: string; owner: string; status: HouseStatus }) {
  const [note, setNote] = useState('');
  const [pending, start] = useTransition();
  const decide = (choice: 'approve' | 'reject') => start(() => reviewHouse(id, choice, note));
  return (
    <div className="row" style={{ alignItems: 'stretch' }}>
      <input type="text" value={note} onChange={(e) => setNote(e.target.value)} aria-label={`Note to ${owner}`} placeholder="Optional note to the poster" style={{ flex: '1 1 220px' }} />
      {status !== 'APPROVED' && <button type="button" className="btn primary sm" disabled={pending} onClick={() => decide('approve')}>Approve</button>}
      {status !== 'REJECTED' && <button type="button" className="btn danger sm" disabled={pending} onClick={() => decide('reject')}>{status === 'APPROVED' ? 'Take down' : 'Reject'}</button>}
    </div>
  );
}
