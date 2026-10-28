import Link from 'next/link';
import { getBracket } from '@/lib/brackets';
import type { HouseStanding } from '@/lib/seasonStandings';
import { Icon3D, type Icon3DName } from './Icon3D';

/** A contest entry in a grid: cover photo, rank, verified likes and the basics. */
export function HouseCard({ house: h, rank, icon }: { house: HouseStanding; rank: number; icon: Icon3DName }) {
  return (
    <article className={`house-card reveal${rank === 1 ? ' leader' : ''}`}>
      <div className="house-photo">
        {h.photoUrls[0] ? <img className="photo" src={h.photoUrls[0]} alt={`${h.name} at night`} loading="lazy" /> : <Icon3D name={icon} size={96} />}
        <span className="rank">{rank <= 3 ? <Icon3D name={rank === 1 ? 'trophy' : 'medal'} size={20} /> : null}#{rank}</span>
        <span className="likes num" title="Verified likes"><Icon3D name="heart" size={18} />{h.likes}</span>
      </div>
      <div className="house-body">
        <span className="label">{[getBracket(h.bracket)?.label, h.neighborhood].filter(Boolean).join(' · ') || 'Neighborhood'}</span>
        <h3><Link href={`/house/${h.id}`} className="card-link">{h.name}</Link></h3>
        <p className="small muted">{h.showExactAddress ? h.address : `Near ${h.neighborhood ?? 'the neighborhood'} (exact spot shown at check-in)`} · lit {h.litFrom}–{h.litUntil}</p>
        <p className="small">{h.description}</p>
        {h.tags.length > 0 && <div className="row" style={{ gap: 6 }}>{h.tags.map((t) => <span key={t} className="tag">{t}</span>)}</div>}
      </div>
    </article>
  );
}
