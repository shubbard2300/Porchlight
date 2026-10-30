import { describe, expect, it } from 'vitest';
import { forViewer, publicPin } from './mapPins';

describe('publicPin', () => {
  it('keeps the exact spot when the host shows their address', () => {
    expect(publicPin({ id: 'a', lat: 45.523064, lng: -122.676483, showExactAddress: true })).toEqual({ lat: 45.523064, lng: -122.676483 });
  });

  it('moves hidden addresses off the real spot, the same way every time', () => {
    const h = { id: 'house_1', lat: 45.523064, lng: -122.676483, showExactAddress: false };
    const pin = publicPin(h);
    expect(pin).toEqual(publicPin(h));
    expect(pin).not.toEqual({ lat: h.lat, lng: h.lng });
    expect(Math.abs(pin.lat - h.lat)).toBeLessThan(0.01);
    expect(Math.abs(pin.lng - h.lng)).toBeLessThan(0.01);
  });

  it('gives two hidden houses on the same block different pins', () => {
    const a = publicPin({ id: 'one', lat: 45.5231, lng: -122.6765, showExactAddress: false });
    const b = publicPin({ id: 'two', lat: 45.5232, lng: -122.6766, showExactAddress: false });
    expect(a).not.toEqual(b);
  });
});

describe('forViewer', () => {
  const h = { id: 'h1', lat: 45.5, lng: -122.6, showExactAddress: true };
  it('hides exact addresses from logged-out visitors', () => {
    expect(forViewer(h, false).showExactAddress).toBe(false);
    expect(forViewer(h, true).showExactAddress).toBe(true);
    expect(forViewer({ ...h, showExactAddress: false }, true).showExactAddress).toBe(false);
  });
});
