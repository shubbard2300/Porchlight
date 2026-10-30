import Link from 'next/link';
import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { seasonCalendar } from '@/lib/seasonConfig';
import { avatarUrl } from '@/lib/users';
import { deleteUser, setRole } from '../../actions/admin';

const TYPES: [string, string][] = [['all', 'Everyone'], ['VIEWER', 'Viewers'], ['HOST', 'Hosts'], ['unverified', 'Not verified']];

export default async function Users({ searchParams }: { searchParams: Promise<{ q?: string; type?: string }> }) {
  const { getSeason } = await seasonCalendar();
  const me = await requireAdmin();
  const sp = await searchParams;
  const q = (sp.q ?? '').trim();
  const type = TYPES.some(([k]) => k === sp.type) ? sp.type! : 'all';
  const where: Prisma.UserWhereInput = {
    ...(q ? { OR: [{ email: { contains: q, mode: 'insensitive' } }, { username: { contains: q, mode: 'insensitive' } }, { displayName: { contains: q, mode: 'insensitive' } }] } : {}),
    ...(type === 'VIEWER' || type === 'HOST' ? { accountType: type } : {}),
    ...(type === 'unverified' ? { emailVerifiedAt: null } : {}),
  };
  const [users, total] = await Promise.all([
    db.user.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200, include: { _count: { select: { houses: true, votes: true } }, referredBy: { select: { username: true } } } }),
    db.user.count({ where }),
  ]);
  const qs = (t: string) => `/admin/users?type=${t}${q ? `&q=${encodeURIComponent(q)}` : ''}`;
  return (
    <>
      <div className="row spread">
        <h1 style={{ fontSize: 30 }}>Users <span className="muted num" style={{ fontSize: 18 }}>{total}</span></h1>
        <a className="btn ghost sm" href={`/admin/users/export${q ? `?q=${encodeURIComponent(q)}` : ''}`}>Download CSV</a>
      </div>
      <nav className="tabs">{TYPES.map(([k, l]) => <Link key={k} href={qs(k)} aria-current={k === type ? 'page' : undefined}>{l}</Link>)}</nav>
      <form className="row" role="search">
        <input type="hidden" name="type" value={type} />
        <input type="search" name="q" defaultValue={q} placeholder="Search username, name or email" aria-label="Search users" style={{ flex: '1 1 240px' }} />
        <button className="btn ghost sm">Search</button>
      </form>
      <div className="table-wrap">
        <table>
          <thead><tr><th>User</th><th>Email</th><th>Type</th><th>Status</th><th>XP</th><th>Houses</th><th>Joined</th><th></th></tr></thead>
          <tbody>
            {users.map((u) => {
              const s = getSeason(u.hostSeason);
              return (
                <tr key={u.id}>
                  <td>
                    <div className="row" style={{ flexWrap: 'nowrap', gap: 8 }}>
                      {avatarUrl(u) ? <img src={avatarUrl(u)!} alt="" className="avatar sm" /> : <span className="avatar sm" aria-hidden="true">{u.username[0].toUpperCase()}</span>}
                      <span><b>@{u.username}</b>{u.displayName && <div className="small muted">{u.displayName}</div>}</span>
                    </div>
                    {u.referredBy && <div className="small muted">invited by @{u.referredBy.username}</div>}
                  </td>
                  <td>{u.email}{u.hometown && <div className="small muted">{u.hometown}</div>}</td>
                  <td>
                    <span className={`pill ${u.accountType === 'HOST' ? 'PENDING' : 'live'}`}>{u.accountType === 'HOST' ? 'host' : 'viewer'}</span>
                    {u.accountType === 'HOST' && (u.propertyAddress || s) && <div className="small muted" style={{ minWidth: 180 }}>{[u.propertyAddress, s && `${s.name} ${s.year}`, u.decorationTheme].filter(Boolean).join(' · ')}</div>}
                  </td>
                  <td>
                    {u.emailVerifiedAt ? <span className="pill sent">verified</span> : <span className="pill skipped">not verified</span>}
                    {u.role === 'ADMIN' && <> <span className="pill ADMIN">admin</span></>}
                  </td>
                  <td className="num">{u.xp}</td>
                  <td className="num">{u._count.houses}</td>
                  <td className="num">{u.createdAt.toLocaleDateString('en-US')}</td>
                  <td>
                    {u.id === me.id ? <span className="small muted">you</span> : (
                      <details>
                        <summary>Manage</summary>
                        <div className="stack" style={{ gap: 8, marginTop: 8, minWidth: 180 }}>
                          <form action={setRole}>
                            <input type="hidden" name="id" value={u.id} />
                            <input type="hidden" name="role" value={u.role === 'ADMIN' ? 'USER' : 'ADMIN'} />
                            <button className="btn ghost sm">{u.role === 'ADMIN' ? 'Remove admin' : 'Make admin'}</button>
                          </form>
                          <form action={deleteUser} className="stack" style={{ gap: 6 }}>
                            <input type="hidden" name="id" value={u.id} />
                            <label className="check small" htmlFor={`confirm-${u.id}`}><input type="checkbox" id={`confirm-${u.id}`} name="confirm" required /><span>Delete this account and its houses</span></label>
                            <button className="btn danger sm">Delete user</button>
                          </form>
                        </div>
                      </details>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
