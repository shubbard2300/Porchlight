import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { BOOST_HOURS, SCAN_REPEAT_HOURS } from '@/lib/pitstops';
import { validPitstopCode } from '@/lib/porchCode';
import { PITSTOP_XP } from '@/lib/rewards';

/**
 * Where a merchant's counter QR lands. A counted scan doubles the visitor's XP for a couple of hours.
 * No purchase is needed, and contest votes are never affected.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const code = new URL(req.url).searchParams.get('k');
  const go = (path: string) => NextResponse.redirect(new URL(path, req.url));

  if (!validPitstopCode(id, code)) return go(`/pitstop/${id}?scan=bad-code`);
  const user = await currentUser();
  if (!user) return go(`/login?next=${encodeURIComponent(`/pitstop/${id}/scan?k=${code}`)}`);
  const merchant = await db.merchant.findFirst({ where: { id, active: true }, select: { id: true } });
  if (!merchant) return go(`/pitstop/${id}?scan=closed`);

  const recent = await db.pitstopScan.findFirst({
    where: { userId: user.id, merchantId: id, createdAt: { gte: new Date(Date.now() - SCAN_REPEAT_HOURS * 3600_000) } },
  });
  if (recent) return go(`/pitstop/${id}?scan=again`);

  const before = await db.pitstopScan.count({ where: { userId: user.id, merchantId: id } });
  await db.$transaction([
    db.pitstopScan.create({ data: { userId: user.id, merchantId: id } }),
    db.user.update({
      where: { id: user.id },
      data: { xpBoostUntil: new Date(Date.now() + BOOST_HOURS * 3600_000), ...(before === 0 ? { xp: { increment: PITSTOP_XP } } : {}) },
    }),
  ]);
  return go(`/pitstop/${id}?scan=${before === 0 ? 'first' : 'ok'}`);
}
