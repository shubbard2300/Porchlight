import { describe, expect, it } from 'vitest';
import { confirmsDelete } from './deleteAccount';

describe('confirmsDelete', () => {
  it('accepts the phrase, ignoring case and spaces', () => {
    expect(confirmsDelete('DELETE')).toBe(true);
    expect(confirmsDelete('  delete ')).toBe(true);
  });
  it('rejects anything else', () => {
    expect(confirmsDelete('')).toBe(false);
    expect(confirmsDelete('DELET')).toBe(false);
    expect(confirmsDelete('delete my account')).toBe(false);
    expect(confirmsDelete(null)).toBe(false);
  });
});
