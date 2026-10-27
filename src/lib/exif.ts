/**
 * Just enough of an EXIF reader to pull GPS position and capture time out of a JPEG.
 * Runs in the browser before the photo is resized, because re-encoding drops all metadata.
 */

export type PhotoMeta = { lat?: number; lng?: number; takenAt?: Date };

const TAG_EXIF_IFD = 0x8769;
const TAG_GPS_IFD = 0x8825;
const TAG_DATE_ORIGINAL = 0x9003;
const GPS_LAT_REF = 1;
const GPS_LAT = 2;
const GPS_LNG_REF = 3;
const GPS_LNG = 4;
const TYPE_SIZES: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 };

export function readPhotoMeta(buf: ArrayBuffer): PhotoMeta {
  try {
    const tiff = findTiff(new DataView(buf));
    return tiff ? parseTiff(tiff) : {};
  } catch {
    return {};
  }
}

/** Finds the TIFF block inside a JPEG's APP1 "Exif" segment. */
function findTiff(v: DataView): DataView | null {
  if (v.byteLength < 4 || v.getUint16(0) !== 0xffd8) return null;
  let off = 2;
  while (off + 4 <= v.byteLength) {
    if (v.getUint8(off) !== 0xff) return null;
    const marker = v.getUint8(off + 1);
    if (marker === 0xda || marker === 0xd9) return null; // image data starts; no EXIF before it
    const len = v.getUint16(off + 2);
    if (marker === 0xe1 && len >= 8 && v.getUint32(off + 4) === 0x45786966 && v.getUint16(off + 8) === 0) {
      const start = off + 10;
      return new DataView(v.buffer, v.byteOffset + start, Math.min(len - 8, v.byteLength - start));
    }
    off += 2 + len;
  }
  return null;
}

function parseTiff(t: DataView): PhotoMeta {
  const order = t.getUint16(0);
  if (order !== 0x4949 && order !== 0x4d4d) return {};
  const le = order === 0x4949;
  const u16 = (o: number) => t.getUint16(o, le);
  const u32 = (o: number) => t.getUint32(o, le);

  type Entry = { type: number; count: number; at: number };
  const readIfd = (off: number) => {
    const out = new Map<number, Entry>();
    const n = u16(off);
    for (let i = 0; i < n; i++) {
      const e = off + 2 + i * 12;
      const type = u16(e + 2);
      const count = u32(e + 4);
      const size = (TYPE_SIZES[type] ?? 1) * count;
      out.set(u16(e), { type, count, at: size > 4 ? u32(e + 8) : e + 8 });
    }
    return out;
  };
  const ascii = (e?: Entry) => {
    if (!e) return undefined;
    let s = '';
    for (let i = 0; i < e.count; i++) {
      const c = t.getUint8(e.at + i);
      if (!c) break;
      s += String.fromCharCode(c);
    }
    return s;
  };
  const rationals = (e?: Entry) => {
    if (!e || e.type !== 5) return undefined;
    return Array.from({ length: e.count }, (_, i) => {
      const den = u32(e.at + i * 8 + 4);
      return den ? u32(e.at + i * 8) / den : 0;
    });
  };

  const ifd0 = readIfd(u32(4));
  const meta: PhotoMeta = {};

  const gpsPtr = ifd0.get(TAG_GPS_IFD);
  if (gpsPtr) {
    const gps = readIfd(u32(gpsPtr.at));
    const lat = toDegrees(rationals(gps.get(GPS_LAT)), ascii(gps.get(GPS_LAT_REF)));
    const lng = toDegrees(rationals(gps.get(GPS_LNG)), ascii(gps.get(GPS_LNG_REF)));
    if (lat !== undefined && lng !== undefined && isPlausible(lat, lng)) Object.assign(meta, { lat, lng });
  }

  const exifPtr = ifd0.get(TAG_EXIF_IFD);
  if (exifPtr) {
    const when = parseExifDate(ascii(readIfd(u32(exifPtr.at)).get(TAG_DATE_ORIGINAL)));
    if (when) meta.takenAt = when;
  }
  return meta;
}

function toDegrees(dms: number[] | undefined, ref: string | undefined) {
  if (!dms || dms.length < 3) return undefined;
  const deg = dms[0] + dms[1] / 60 + dms[2] / 3600;
  return ref === 'S' || ref === 'W' ? -deg : deg;
}

/** Rejects the 0,0 placeholder some cameras write when they have no fix. */
export function isPlausible(lat: number, lng: number) {
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0);
}

/** EXIF dates look like "2026:10:24 19:42:07" in the camera's local time. */
function parseExifDate(s: string | undefined) {
  const m = s?.match(/^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
  if (!m) return undefined;
  const d = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
  return Number.isNaN(d.getTime()) || +m[1] < 1990 ? undefined : d;
}
