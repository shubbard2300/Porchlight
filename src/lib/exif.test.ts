import { describe, expect, it } from 'vitest';
import { readPhotoMeta } from './exif';

/** Builds a minimal JPEG with an EXIF block holding GPS and DateTimeOriginal. */
function jpegWithExif({ le, lat, latRef, lng, lngRef, date }: { le: boolean; lat: number[]; latRef: string; lng: number[]; lngRef: string; date: string }) {
  const t = new DataView(new ArrayBuffer(400));
  const u16 = (o: number, v: number) => t.setUint16(o, v, le);
  const u32 = (o: number, v: number) => t.setUint32(o, v, le);
  const entry = (at: number, tag: number, type: number, count: number, value: number) => { u16(at, tag); u16(at + 2, type); u32(at + 4, count); u32(at + 8, value); };
  t.setUint16(0, le ? 0x4949 : 0x4d4d);
  u16(2, 42);
  u32(4, 8);
  // IFD0 at 8: GPS pointer and EXIF pointer
  u16(8, 2);
  entry(10, 0x8825, 4, 1, 40);
  entry(22, 0x8769, 4, 1, 200);
  u32(34, 0);
  // GPS IFD at 40 with 4 entries; rationals at 100 and 130
  u16(40, 4);
  entry(42, 1, 2, 2, 0);
  t.setUint8(50, latRef.charCodeAt(0));
  entry(54, 2, 5, 3, 100);
  entry(66, 3, 2, 2, 0);
  t.setUint8(74, lngRef.charCodeAt(0));
  entry(78, 4, 5, 3, 130);
  lat.forEach((v, i) => { u32(100 + i * 8, Math.round(v * 100)); u32(104 + i * 8, 100); });
  lng.forEach((v, i) => { u32(130 + i * 8, Math.round(v * 100)); u32(134 + i * 8, 100); });
  // EXIF IFD at 200 with DateTimeOriginal string at 240
  u16(200, 1);
  entry(202, 0x9003, 2, 20, 240);
  [...date].forEach((c, i) => t.setUint8(240 + i, c.charCodeAt(0)));

  const tiff = new Uint8Array(t.buffer);
  const app1Len = 2 + 6 + tiff.length;
  const out = new Uint8Array(4 + app1Len + 2);
  out.set([0xff, 0xd8, 0xff, 0xe1, app1Len >> 8, app1Len & 0xff, 0x45, 0x78, 0x69, 0x66, 0, 0], 0);
  out.set(tiff, 12);
  out.set([0xff, 0xd9], 12 + tiff.length);
  return out.buffer;
}

describe('readPhotoMeta', () => {
  it('reads GPS and capture time from little-endian EXIF (iPhone, most Android)', () => {
    const m = readPhotoMeta(jpegWithExif({ le: true, lat: [45, 30, 36], latRef: 'N', lng: [122, 39, 0], lngRef: 'W', date: '2026:10:24 19:42:07' }));
    expect(m.lat).toBeCloseTo(45.51, 4);
    expect(m.lng).toBeCloseTo(-122.65, 4);
    expect(m.takenAt?.getFullYear()).toBe(2026);
    expect(m.takenAt?.getHours()).toBe(19);
  });
  it('reads big-endian EXIF and southern / eastern references', () => {
    const m = readPhotoMeta(jpegWithExif({ le: false, lat: [33, 52, 4.8], latRef: 'S', lng: [151, 12, 36], lngRef: 'E', date: '2026:12:20 21:00:00' }));
    expect(m.lat).toBeCloseTo(-33.868, 3);
    expect(m.lng).toBeCloseTo(151.21, 3);
  });
  it('ignores a 0,0 placeholder fix', () => {
    const m = readPhotoMeta(jpegWithExif({ le: true, lat: [0, 0, 0], latRef: 'N', lng: [0, 0, 0], lngRef: 'E', date: '2026:10:24 19:42:07' }));
    expect(m.lat).toBeUndefined();
  });
  it('returns nothing for non-JPEG or broken data', () => {
    expect(readPhotoMeta(new Uint8Array([0x89, 0x50, 0x4e, 0x47]).buffer)).toEqual({});
    expect(readPhotoMeta(new Uint8Array([0xff, 0xd8, 0xff, 0xe1, 0x00, 0x40]).buffer)).toEqual({});
  });
});
