import { crowdCounts } from '@/lib/crowdCounts';
import { getSeason } from '@/lib/seasons';

/** Live crowd meter for one contest's map: { houseId: visitors in the last 30 minutes }. */
export async function GET(req: Request) {
  const season = getSeason(new URL(req.url).searchParams.get('season'));
  if (!season) return Response.json({}, { status: 404 });
  return Response.json(await crowdCounts({ season: season.key }), { headers: { 'Cache-Control': 'no-store' } });
}
