import Link from 'next/link';
import type { HouseStatus } from '@prisma/client';
import { db } from '@/lib/db';
import { getSeason } from '@/lib/seasons';
import { ReviewControls } from './ReviewControls';

const FILTERS: [HouseStatus, string][] = [['PENDING', 'Waiting'], ['APPROVED', 'Live'], ['REJECTED', 'Not approved']];

export default async function Submissions({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const raw = (await searchParams).status;
  const status: HouseStatus = FILTERS.some(([k]) => k === raw) ? (raw as HouseStatus) : 'PENDING';
  const houses = await db.house.findMany({ where: { status }, include: { owner: true }, orderBy: { createdAt: status === 'PENDING' ? 'asc' : 'desc' }, take: 100 });
  return (
    <>
      <h1 style={{ fontSize: 30 }}>Submissions</h1>
      <nav className="tabs">{FILTERS.map(([k, l]) => <Link key={k} href={`/admin/submissions?status=${k}`} aria-current={k === status ? 'page' : undefined}>{l}</Link>)}</nav>
      {houses.length === 0 && <div className="empty"><p className="muted">Nothing here right now.</p></div>}
      {houses.map((h) => {
        const s = getSeason(h.season);
        return (
          <article key={h.id} className="panel stack" style={{ gap: 10 }}>
            <div className="row spread">
              <div><h2 style={{ fontSize: 20 }}>{h.name}</h2><span className="small muted">{s ? `${s.name} ${s.year}` : h.season} · posted {h.createdAt.toLocaleDateString('en-US')} by {h.owner.name} &lt;{h.owner.email}&gt;</span></div>
              <span className={`pill ${h.status}`}>{h.status.toLowerCase()}</span>
            </div>
            <p className="small">{h.address}{h.neighborhood ? ` · ${h.neighborhood}` : ''} · {h.showExactAddress ? 'exact address public' : 'address hidden until check-in'} · lit {h.litFrom}–{h.litUntil} · pledge ${h.contributionCents / 100}</p>
            <p>{h.description}</p>
            {h.tags.length > 0 && <div className="row">{h.tags.map((t) => <span key={t} className="tag">{t}</span>)}</div>}
            {h.reviewNote && <p className="small muted">Note: {h.reviewNote}</p>}
            <ReviewControls id={h.id} owner={h.owner.name} status={h.status} />
          </article>
        );
      })}
    </>
  );
}
