import { describe, expect, it } from 'vitest';
import { canPay, dollars, POT_AMOUNTS, suggestedAmount, sumPot } from './pot';

describe('pot', () => {
  it('only takes payment from approved houses while the contest is open', () => {
    expect(canPay({ status: 'APPROVED', phase: 'live', paid: false })).toBe(true);
    expect(canPay({ status: 'APPROVED', phase: 'soon', paid: false })).toBe(true);
    expect(canPay({ status: 'PENDING', phase: 'live', paid: false })).toBe(false);
    expect(canPay({ status: 'APPROVED', phase: 'final', paid: false })).toBe(false);
    expect(canPay({ status: 'APPROVED', phase: 'live', paid: true })).toBe(false);
  });

  it('suggests the pledged amount, else a middle one', () => {
    expect(POT_AMOUNTS).not.toContain(0);
    expect(suggestedAmount(5000)).toBe(50);
    expect(suggestedAmount(0)).toBe(25);
    expect(suggestedAmount(1234)).toBe(25);
  });

  it('adds up paid money per season by source', () => {
    const t = sumPot([
      { season: 'h', source: 'HOST', amountCents: 2500 },
      { season: 'h', source: 'HOST', amountCents: 1000 },
      { season: 'h', source: 'SPONSOR', amountCents: 20000 },
      { season: 'c', source: 'HOST', amountCents: 5000 },
    ]);
    expect(t.get('h')).toEqual({ paidCents: 23500, hostCents: 3500, sponsorCents: 20000, hosts: 2, sponsors: 1 });
    expect(t.get('c')?.paidCents).toBe(5000);
  });

  it('formats dollars', () => {
    expect(dollars(0)).toBe('$0');
    expect(dollars(123400)).toBe('$1,234');
    expect(dollars(2550)).toBe('$25.50');
  });
});
