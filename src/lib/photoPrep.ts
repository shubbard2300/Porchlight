// Browser-side photo helpers shared by the sign-up form and the house photo picker.

const MAX_EDGE = 1600;
const MAX_UPLOAD_BYTES = 2_800_000;

export type Coords = { lat: number; lng: number };

/** Asks the browser where we are. Resolves null if location is off, denied or slow. */
export function deviceLocation(): Promise<Coords | null> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  });
}

/** Scales down and re-encodes as JPEG. This also strips the original's metadata from what gets published. */
export async function toUploadJpeg(file: File) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  for (const quality of [0.84, 0.72, 0.6]) {
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', quality));
    if (blob && blob.size <= MAX_UPLOAD_BYTES) return { blob, width: canvas.width, height: canvas.height };
  }
  throw new Error('too large');
}
