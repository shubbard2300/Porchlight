'use client';

import { useTransition } from 'react';
import { refundPayment, removeSponsor } from '../../actions/pot';

export function PaymentAction({ id, kind, label }: { id: string; kind: 'refund' | 'remove'; label: string }) {
  const [pending, start] = useTransition();
  const run = () => {
    const ok = kind === 'refund'
      ? confirm(`Refund ${label} in full? Stripe sends the money back to their card, and this can't be undone.`)
      : confirm(`Remove ${label} from the pot?`);
    if (ok) start(() => (kind === 'refund' ? refundPayment(id) : removeSponsor(id)));
  };
  return <button type="button" className="btn ghost sm" disabled={pending} onClick={run}>{pending ? 'Working…' : kind === 'refund' ? 'Refund' : 'Remove'}</button>;
}
