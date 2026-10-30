import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { AdminNav } from './AdminNav';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = await requireAdmin();
  const pending = await db.house.count({ where: { status: 'PENDING' } });
  return (
    <main className="wrap">
      <div className="admin">
        <AdminNav pending={pending} superAdmin={me.role === 'ADMIN'} />
        <div className="stack" style={{ minWidth: 0 }}>{children}</div>
      </div>
    </main>
  );
}
