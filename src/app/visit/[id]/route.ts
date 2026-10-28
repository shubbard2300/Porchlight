import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { recordCheckIn, votableHouse } from '@/lib/checkIns';
import { validPorchCode } from '@/lib/porchCode';

/**
 * Where a porch sign's QR code lands. A valid code checks the visitor in, the same as standing
 * inside the geofence, then shows them the house page with the scorecard open.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(req.url);
  const code = url.searchParams.get('k');
  const go = (path: string) => NextResponse.redirect(new URL(path, req.url));

  if (!validPorchCode(id, code)) return go(`/house/${id}?checkin=bad-code`);
  const user = await currentUser();
  if (!user) return go(`/login?next=${encodeURIComponent(`/visit/${id}?k=${code}`)}`);

  const found = await votableHouse(id, user.id);
  if ('error' in found) return go(`/house/${id}?checkin=${found.code}`);
  const { first } = await recordCheckIn(user.id, id, 'QR', null);
  return go(`/house/${id}?checkin=${first ? 'qr-first' : 'qr'}#vote`);
}
