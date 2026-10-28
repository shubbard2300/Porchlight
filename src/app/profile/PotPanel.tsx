import Link from 'next/link';
import { Icon3D } from '@/components/Icon3D';
import { SubmitButton } from '@/components/SubmitButton';
import { canPay, dollars, POT_AMOUNTS, suggestedAmount } from '@/lib/pot';
import type { Phase } from '@/lib/seasons';
import { payPledge } from '../actions/pot';

/** A host entry's prize pot status: paid, ready to pay, or why not yet. */
export function PotPanel({ houseId, status, phase, pledgeCents, paid, online }: {
  houseId: string;
  status: string;
  phase: Phase;
  pledgeCents: number;
  paid: { amountCents: number; paidAt: Date | null } | null;
  online: boolean;
}) {
  if (paid) {
    return (
      <div className="pot-panel paid">
        <Icon3D name="money" size={32} />
        <div><b>{dollars(paid.amountCents)} paid into the pot</b><div className="small muted">Thank you! Your receipt came from Stripe.</div></div>
      </div>
    );
  }
  if (!canPay({ status, phase, paid: false })) {
    if (status === 'PENDING' && pledgeCents > 0) {
      return <p className="small muted pot-note">You pledged {dollars(pledgeCents)} to the pot. You can pay it here once your house is approved.</p>;
    }
    return null;
  }
  if (!online) {
    return pledgeCents > 0 ? <p className="small muted pot-note">You pledged {dollars(pledgeCents)}. Online payment opens soon; we&apos;ll email you when it does.</p> : null;
  }
  const pick = suggestedAmount(pledgeCents);
  return (
    <form action={payPledge.bind(null, houseId)} className="pot-panel">
      <Icon3D name="money" size={32} />
      <div className="stack" style={{ gap: 10, flex: 1, minWidth: 0 }}>
        <div>
          <b>{pledgeCents > 0 ? `Pay your ${dollars(pledgeCents)} pledge` : 'Add to the prize pot'}</b>
          <div className="small muted">Optional. Free entries compete for the same prize, and paying never changes your ranking. <Link href="/rules">Official rules</Link></div>
        </div>
        <div className="row" style={{ gap: 10 }}>
          <div className="chips" role="radiogroup" aria-label="Amount">
            {POT_AMOUNTS.map((a) => (
              <span key={a}>
                <input type="radio" id={`pay-${houseId}-${a}`} name="amount" value={a} defaultChecked={a === pick} />
                <label htmlFor={`pay-${houseId}-${a}`}>${a}</label>
              </span>
            ))}
          </div>
          <SubmitButton pendingText="Opening checkout…" className="btn primary sm">Pay with Stripe</SubmitButton>
        </div>
      </div>
    </form>
  );
}
