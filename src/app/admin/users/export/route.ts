import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';

const cell = (v: unknown) => {
  const s = String(v ?? '');
  // Quote everything and neutralize spreadsheet formulas.
  return `"${(/^[=+\-@]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`;
};

export async function GET(req: Request) {
  const user = await currentUser();
  if (!user || user.role !== 'ADMIN') return new Response('Not found', { status: 404 });
  const q = new URL(req.url).searchParams.get('q')?.trim();
  const users = await db.user.findMany({
    where: q ? { OR: [{ email: { contains: q, mode: 'insensitive' } }, { name: { contains: q, mode: 'insensitive' } }] } : {},
    orderBy: { createdAt: 'asc' },
    include: { _count: { select: { houses: true, votes: true } } },
  });
  const rows = [
    ['name', 'email', 'role', 'xp', 'houses', 'votes', 'email_updates', 'referral_code', 'joined', 'last_login'],
    ...users.map((u) => [u.name, u.email, u.role, u.xp, u._count.houses, u._count.votes, u.marketingOptIn, u.referralCode, u.createdAt.toISOString(), u.lastLoginAt?.toISOString() ?? '']),
  ];
  return new Response(rows.map((r) => r.map(cell).join(',')).join('\n'), {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="porchlight-users.csv"' },
  });
}
