import { describe, expect, it } from 'vitest';
import { isTour, pendingTour } from './tours';

const verified = new Date();

describe('pendingTour', () => {
  it('shows each account type its own tour once', () => {
    expect(pendingTour({ accountType: 'VIEWER', emailVerifiedAt: verified, toursDone: [] })).toBe('viewer');
    expect(pendingTour({ accountType: 'HOST', emailVerifiedAt: verified, toursDone: [] })).toBe('host');
    expect(pendingTour({ accountType: 'VIEWER', emailVerifiedAt: verified, toursDone: ['viewer'] })).toBeNull();
  });
  it('gives a viewer who became a host the host tour', () => {
    expect(pendingTour({ accountType: 'HOST', emailVerifiedAt: verified, toursDone: ['viewer'] })).toBe('host');
  });
  it('waits until the email is confirmed', () => {
    expect(pendingTour({ accountType: 'VIEWER', emailVerifiedAt: null, toursDone: [] })).toBeNull();
  });
  it('only accepts known tours', () => {
    expect(isTour('host')).toBe(true);
    expect(isTour('admin')).toBe(false);
  });
});
