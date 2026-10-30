import { NextResponse } from 'next/server';
import { alertLastCall } from '@/lib/alertTriggers';
import { contestToday } from '@/lib/seasons';
import { seasonCalendar } from '@/lib/seasonConfig';

/**
 * Vercel Cron runs this every evening (see vercel.json; 02:00 UTC is 6 or 7 pm Pacific). On the last day
 * of voting it sends the "last night to vote" alert once. Vercel signs the call with CRON_SECRET.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const today = contestToday();
  const { all } = await seasonCalendar();
  const results = await Promise.all(all.filter((s) => s.enabled && s.closes === today).map(async (s) => ({ season: s.key, sent: await alertLastCall(s) })));
  return NextResponse.json({ today, results });
}
