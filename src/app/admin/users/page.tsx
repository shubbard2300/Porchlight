import Link from 'next/link';
import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { isBootstrapAdmin, requireSuperAdmin } from '@/lib/auth';
import { ACCESS_LEVELS, accessLevel, BLOCKED, levelLabel, type AccessLevel } from '@/lib/roles';
import { seasonCalendar } from '@/lib/seasonConfig';
import { avatarUrl } from '@/lib/users';
import { deleteUser, setAccessLevel } from '../../actions/admin';
import { AddUserForm } from './AddUserForm';

const TYPES: [string, string][] = [['all', 'Everyone'], ['staff', 'Admins and editors'], ['VIEWER', 'Viewers'], ['HOST', 'Authors'], ['unverified', 'Not verified']];
const LEVEL_PILL: Record<AccessLevel, string> = { SUPER_ADMIN: 'ADMIN', EDITOR: 'ADMIN', AUTHOR: 'PENDING', VIEWER: 'live' };
const NOTES: Record<string, string> = { saved: 'Access updated.', deleted: 'Account deleted.' };

export default async function Users({ searchParams }: { searchParams: Promise<{ q?: string; type?: string; note?: string }> }) {
  const me = await requireSuperAdmin();
  const { getSeason } = await seasonCalendar();
  const sp = await searchParams;
  const blocked = sp.note && sp.note in BLOCKED ? BLOCKED[sp.note as keyof typeof BLOCKED] : null;
  const q = (sp.q ?? '').trim();
  const type = TYPES.some(([k]) => k === sp.type) ? sp.type! : 'all';
  const where: Prisma.UserWhereInput = {
    ...(q ? { OR: [{ email: { contains: q, mode: 'insensitive' } }, { username: { contains: q, mode: 'insensitive' } }, { displayName: { contains: q, mode: 'insensitive' } }] } : {}),
    ...(type === 'VIEWER' || type === 'HOST' ? { accountType: type, role: 'USER' as const } : {}),
    ...(type === 'staff' ? { role: { in: ['ADMIN' as const, 'EDITOR' as const] } } : {}),
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
      {blocked && <p className="notice warn" role="alert">{blocked}</p>}
      {sp.note && NOTES[sp.note] && <p className="notice" role="status">{NOTES[sp.note]}</p>}
      <section className="panel stack" aria-labelledby="add-user">
        <h2 id="add-user" style={{ fontSize: 20 }}>Add a user</h2>
        <AddUserForm />
        <details>
          <summary className="small">What each access level can do</summary>
          <ul className="small" style={{ marginTop: 8, paddingLeft: 18 }}>
            {ACCESS_LEVELS.map((l) => <li key={l.key}><b>{l.label}:</b> {l.blurb}</li>)}
          </ul>
          <p className="small muted">The site owner accounts (set in ADMIN_EMAILS) always stay Super Admin, and there is always at least one Super Admin.</p>
        </details>
      </section>
      <nav className="tabs">{TYPES.map(([k, l]) => <Link key={k} href={qs(k)} aria-current={k === type ? 'page' : undefined}>{l}</Link>)}</nav>
      <form className="row" role="search">
        <input type="hidden" name="type" value={type} />
        <input type="search" name="q" defaultValue={q} placeholder="Search username, name or email" aria-label="Search users" style={{ flex: '1 1 240px' }} />
        <button className="btn ghost sm">Search</button>
      </form>
      <div className="table-wrap">
        <table className="users-table">
          <thead><tr><th>User</th><th>Access</th><th>Activity</th><th>Manage</th></tr></thead>
          <tbody>
            {users.map((u) => {
              const s = getSeason(u.hostSeason);
              const level = accessLevel(u);
              const owner = isBootstrapAdmin(u.email);
              const property = u.accountType === 'HOST' ? [u.propertyAddress, s && `${s.name} ${s.year}`, u.decorationTheme].filter(Boolean).join(' · ') : '';
              return (
                <tr key={u.id}>
                  <td>
                    <div className="row" style={{ flexWrap: 'nowrap', gap: 8 }}>
                      {avatarUrl(u) ? <img src={avatarUrl(u)!} alt="" className="avatar sm" /> : <span className="avatar sm" aria-hidden="true">{u.username[0].toUpperCase()}</span>}
                      <span style={{ minWidth: 0 }}><b>@{u.username}</b>{u.displayName && <div className="small muted">{u.displayName}</div>}</span>
                    </div>
                    <div className="small user-email">{u.email}</div>
                    {(u.hometown || property) && <div className="small muted">{[u.hometown, property].filter(Boolean).join(' · ')}</div>}
                    {u.referredBy && <div className="small muted">invited by @{u.referredBy.username}</div>}
                  </td>
                  <td>
                    <div className="pills">
                      <span className={`pill ${LEVEL_PILL[level]}`}>{levelLabel(level)}</span>
                      {owner && <span className="pill">owner</span>}
                      {u.emailVerifiedAt ? <span className="pill sent">verified</span> : <span className="pill skipped">not verified</span>}
                    </div>
                  </td>
                  <td className="small">
                    <div><span className="num">{u.xp}</span> XP</div>
                    <div><span className="num">{u._count.houses}</span> {u._count.houses === 1 ? 'house' : 'houses'}</div>
                    <div className="muted">joined <span className="num">{u.createdAt.toLocaleDateString('en-US')}</span></div>
                  </td>
                  <td className="manage">
                    {u.id === me.id ? <span className="small muted">you</span> : owner ? <span className="small muted">always Super Admin</span> : (
                      <details>
                        <summary>Manage</summary>
                        <div className="stack" style={{ gap: 8, marginTop: 8 }}>
                          <form action={setAccessLevel} className="stack" style={{ gap: 6 }}>
                            <input type="hidden" name="id" value={u.id} />
                            <select name="level" defaultValue={level} aria-label={`Access level for @${u.username}`}>
                              {ACCESS_LEVELS.map((l) => <option key={l.key} value={l.key} disabled={l.key === 'VIEWER' && u._count.houses > 0}>{l.label}</option>)}
                            </select>
                            <button className="btn ghost sm">Save access</button>
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
