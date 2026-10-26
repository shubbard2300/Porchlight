import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { deleteUser, setRole } from '../../actions/admin';

export default async function Users({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const me = await requireAdmin();
  const q = ((await searchParams).q ?? '').trim();
  const where = q ? { OR: [{ email: { contains: q, mode: 'insensitive' as const } }, { name: { contains: q, mode: 'insensitive' as const } }] } : {};
  const [users, total] = await Promise.all([
    db.user.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200, include: { _count: { select: { houses: true, votes: true } }, referredBy: { select: { name: true } } } }),
    db.user.count({ where }),
  ]);
  return (
    <>
      <div className="row spread">
        <h1 style={{ fontSize: 30 }}>Users <span className="muted num" style={{ fontSize: 18 }}>{total}</span></h1>
        <a className="btn ghost sm" href={`/admin/users/export${q ? `?q=${encodeURIComponent(q)}` : ''}`}>Download CSV</a>
      </div>
      <form className="row" role="search">
        <input type="search" name="q" defaultValue={q} placeholder="Search name or email" aria-label="Search users" style={{ flex: '1 1 240px' }} />
        <button className="btn ghost sm">Search</button>
      </form>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>XP</th><th>Houses</th><th>Votes</th><th>Joined</th><th>Updates</th><th></th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}{u.referredBy && <div className="small muted">invited by {u.referredBy.name}</div>}</td>
                <td>{u.email}</td>
                <td><span className={`pill ${u.role}`}>{u.role.toLowerCase()}</span></td>
                <td className="num">{u.xp}</td>
                <td className="num">{u._count.houses}</td>
                <td className="num">{u._count.votes}</td>
                <td className="num">{u.createdAt.toLocaleDateString('en-US')}</td>
                <td>{u.marketingOptIn ? 'yes' : 'no'}</td>
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
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
