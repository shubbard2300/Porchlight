import Link from 'next/link';
import { db } from '@/lib/db';
import { housesIn, type PlacedBlock } from '@/lib/blockStandings';
import { seasonStandings } from '@/lib/seasonStandings';
import { contestToday, defaultSeason } from '@/lib/seasons';
import { BlockForm, EMPTY_BLOCK } from './BlockForm';

export default async function Blocks() {
  const season = defaultSeason(contestToday());
  const [blocks, standings] = await Promise.all([db.anchorBlock.findMany({ orderBy: { name: 'asc' } }), seasonStandings(season.key)]);
  return (
    <>
      <h1 style={{ fontSize: 30 }}>Anchor blocks</h1>
      <p className="muted">Well-known decorated streets and neighborhoods to seed the contest around. Each one glows on the map, gets its own page that invites neighbors to post their houses, and can start a Route Weaver tour. Print a flyer for each block to hand out or post nearby.</p>
      {blocks.length === 0 ? <div className="empty"><p className="muted">No blocks yet. Add the first one below.</p></div> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Block</th><th>Radius</th><th>{season.name} houses</th><th>Home page</th><th>Map</th></tr></thead>
            <tbody>
              {blocks.map((b) => (
                <tr key={b.id}>
                  <td><Link href={`/admin/blocks/${b.id}`}><b>{b.name}</b></Link><div className="small muted">{b.address}</div></td>
                  <td className="num">{b.radiusM} m</td>
                  <td className="num">{b.lat === null ? '–' : housesIn({ ...b, lat: b.lat, lng: b.lng! } as PlacedBlock, standings).length}</td>
                  <td className="small">{b.featured ? 'Featured' : '–'}</td>
                  <td className="small">{!b.active ? 'Hidden' : b.lat === null ? 'No pin' : 'Live'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <section className="panel stack">
        <h2 style={{ fontSize: 20 }}>Add a block</h2>
        <BlockForm initial={EMPTY_BLOCK} />
      </section>
    </>
  );
}
