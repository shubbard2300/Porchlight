import { describe, expect, it } from 'vitest';
import { CONTEST_STATE, inContestArea, rulesAgreementText, usState } from './legal';

describe('contest area', () => {
  it('reads the state from a Nominatim address', () => {
    expect(usState({ 'ISO3166-2-lvl4': 'US-OR' })).toBe('OR');
    expect(usState({ 'ISO3166-2-lvl4': 'CA-BC' })).toBeNull();
    expect(usState(undefined)).toBeNull();
  });
  it('turns away homes in another state but lets unknown ones through to review', () => {
    expect(inContestArea(CONTEST_STATE?.code ?? 'OR')).toBe(true);
    expect(inContestArea(null)).toBe(true);
    if (CONTEST_STATE) expect(inContestArea('WA')).toBe(false);
  });
  it('names the contest area in the agreement', () => {
    expect(rulesAgreementText()).toContain(CONTEST_STATE ? CONTEST_STATE.name : 'U.S.');
  });
});
