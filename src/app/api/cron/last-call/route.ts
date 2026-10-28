import { NextResponse } from 'next/server';
import { alertLastCall } from '@/lib/alertTriggers';
import { contestToday, SEASONS } from '@/lib/seasons';

/**
 * Vercel Cron runs this every evening (see vercel.json; 02:00 UTC is 6 or 7 pm Pacific). On a holiday
 * it sends the "last night to vote" alert once. Vercel signs the call with CRON_SECRET.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const today = contestToday();
  const results = await Promise.all(SEASONS.filter((s) => s.day === today).map(async (s) => ({ season: s.key, sent: await alertLastCall(s) })));
  return NextResponse.json({ today, results });
}
