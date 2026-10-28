import { describe, expect, it } from 'vitest';
import { checkHookUrl, isPrivateAddress, LIGHT_EVENTS, lightPayload } from './porchLights';

describe('checkHookUrl', () => {
  it('accepts public https links', () => {
    expect(checkHookUrl(' https://maker.ifttt.com/trigger/porch_flash/with/key/abc ').ok).toBe(true);
    expect(checkHookUrl('https://x.ui.nabu.casa:443/api/webhook/porch').ok).toBe(true);
  });
  it.each([
    ['not a url', 'full webhook link'],
    ['http://maker.ifttt.com/x', 'https://'],
    ['https://me:pw@hooks.example.com/x', 'username'],
    ['https://hooks.example.com:8123/x', 'port'],
    ['https://192.168.1.20/api/webhook/x', 'public'],
    ['https://[::1]/x', 'public'],
    ['https://homeassistant.local/api/webhook/x', 'public'],
    ['https://localhost/x', 'public'],
  ])('refuses %s', (url, msg) => {
    const r = checkHookUrl(url);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain(msg);
  });
});

describe('isPrivateAddress', () => {
  it.each(['127.0.0.1', '10.0.0.8', '172.16.4.1', '172.31.255.255', '192.168.0.10', '169.254.169.254', '100.64.0.1', '0.0.0.0', '224.0.0.1', '::1', '::', 'fd00::1', 'fe80::1', '::ffff:10.1.2.3', '64:ff9b::a00:1'])('blocks %s', (ip) => {
    expect(isPrivateAddress(ip)).toBe(true);
  });
  it.each(['8.8.8.8', '172.32.0.1', '100.128.0.1', '52.1.2.3', '2606:4700::1111', '::ffff:8.8.8.8'])('allows %s', (ip) => {
    expect(isPrivateAddress(ip)).toBe(false);
  });
});

describe('lightPayload', () => {
  it('fills IFTTT values and named fields alike', () => {
    const p = lightPayload('like', 'Pumpkin Patch', 'Maya', new Date('2026-10-31T19:30:00Z'));
    expect(p).toEqual({ event: 'like', house: 'Pumpkin Patch', visitor: 'Maya', at: '2026-10-31T19:30:00.000Z', value1: 'like', value2: 'Pumpkin Patch', value3: 'Maya' });
    expect(lightPayload('checkin', 'H', null).value3).toBe('');
  });
  it('maps every event to a trigger flag', () => {
    expect(LIGHT_EVENTS.map((e) => e.flag)).toEqual(['onCheckIn', 'onLike', 'onCatch']);
  });
});
