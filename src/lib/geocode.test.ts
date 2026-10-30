import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
const { formatAddress } = await import('./geocode');

describe('formatAddress', () => {
  it('builds a US street address with the state code', () => {
    const r = formatAddress({ house_number: '1820', road: 'SE Alder Ct', suburb: 'Sunnyside', city: 'Portland', state: 'Oregon', postcode: '97214', 'ISO3166-2-lvl4': 'US-OR' });
    expect(r).toEqual({ address: '1820 SE Alder Ct, Portland, OR 97214', neighborhood: 'Sunnyside', hasStreet: true });
  });
  it('keeps what it has when there is no house number or city', () => {
    expect(formatAddress({ road: 'Main St', village: 'Cannon Beach', state: 'Oregon', 'ISO3166-2-lvl4': 'US-OR' }).address).toBe('Main St, Cannon Beach, OR');
    expect(formatAddress({ town: 'Hood River', state: 'Oregon' })).toMatchObject({ address: 'Hood River, Oregon', hasStreet: false });
  });
});
