import { CONTRIBUTIONS } from './houseOptions';
import type { Phase } from './seasons';

/** Amounts a host can pay into the pot, in dollars. Free entry (0) is always an option at submit. */
export const POT_AMOUNTS = CONTRIBUTIONS.filter((a) => a > 0);
export const MAX_SPONSOR_DOLLARS = 10_000;

/**
 * A host pays once their house is approved (so nobody pays for an entry we turn down) and
 * before voting ends. Paying never changes a house's standing.
 */
export function canPay(o: { status: string; phase: Phase; paid: boolean }) {
  return o.status === 'APPROVED' && !o.paid && (o.phase === 'soon' || o.phase === 'live');
}

/** The pledge to suggest on the pay form: what they pledged at submit, or the middle amount. */
export function suggestedAmount(pledgeCents: number): number {
  const dollars = pledgeCents / 100;
  return (POT_AMOUNTS as readonly number[]).includes(dollars) ? dollars : POT_AMOUNTS[Math.floor(POT_AMOUNTS.length / 2)];
}

export type PotRow = { season: string; source: 'HOST' | 'SPONSOR'; amountCents: number };
export type PotTotal = { paidCents: number; hostCents: number; sponsorCents: number; hosts: number; sponsors: number };
export const EMPTY_POT: PotTotal = { paidCents: 0, hostCents: 0, sponsorCents: 0, hosts: 0, sponsors: 0 };

/** Adds up paid rows per season. Callers pass only PAID rows. */
export function sumPot(rows: PotRow[]): Map<string, PotTotal> {
  const out = new Map<string, PotTotal>();
  for (const r of rows) {
    const t = { ...(out.get(r.season) ?? EMPTY_POT) };
    t.paidCents += r.amountCents;
    if (r.source === 'HOST') { t.hostCents += r.amountCents; t.hosts += 1; } else { t.sponsorCents += r.amountCents; t.sponsors += 1; }
    out.set(r.season, t);
  }
  return out;
}

export const dollars = (cents: number) =>
  `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;
