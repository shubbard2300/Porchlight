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
    where: q ? { OR: [{ email: { contains: q, mode: 'insensitive' } }, { username: { contains: q, mode: 'insensitive' } }, { displayName: { contains: q, mode: 'insensitive' } }] } : {},
    orderBy: { createdAt: 'asc' },
    include: { _count: { select: { houses: true, votes: true } } },
  });
  const rows = [
    ['username', 'display_name', 'email', 'account_type', 'email_verified', 'role', 'xp', 'houses', 'votes', 'email_updates', 'referral_code', 'joined', 'last_login', 'hometown', 'property_address', 'neighborhood', 'host_season', 'decoration_theme'],
    ...users.map((u) => [u.username, u.displayName ?? '', u.email, u.accountType, u.emailVerifiedAt?.toISOString() ?? '', u.role, u.xp, u._count.houses, u._count.votes, u.marketingOptIn, u.referralCode, u.createdAt.toISOString(), u.lastLoginAt?.toISOString() ?? '', u.hometown ?? '', u.propertyAddress ?? '', u.neighborhood ?? '', u.hostSeason ?? '', u.decorationTheme ?? '']),
  ];
  return new Response(rows.map((r) => r.map(cell).join(',')).join('\n'), {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="porchlight-users.csv"' },
  });
}
