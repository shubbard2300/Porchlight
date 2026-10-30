import Link from 'next/link';
import { db } from '@/lib/db';
import { editableSeasons } from '@/lib/contestAdmin';
import { getSeasonConfig } from '@/lib/seasonConfig';
import { buildSeasons, contestToday, formatDay, phaseLabel, usualDates } from '@/lib/seasons';
import { seasonTheme } from '@/lib/theme';
import { ContestDatesForm, type ContestRow } from './ContestDatesForm';

export default async function ContestDates() {
  const today = contestToday();
  const seasons = editableSeasons(buildSeasons(await getSeasonConfig(), today), today);
  const counts = await db.house.groupBy({ by: ['season'], where: { season: { in: seasons.map((s) => s.key) }, status: { not: 'REJECTED' } }, _count: true });
  const entries = new Map(counts.map((c) => [c.season, c._count]));
  const rows: ContestRow[] = seasons.map((s) => {
    const usual = usualDates(s.holiday, s.year)!;
    return {
      key: s.key, holiday: s.holiday, name: s.name, year: s.year, color: s.color, icon: seasonTheme(s).icon,
      enabled: s.enabled, day: formatDay(s.day), status: phaseLabel(s, today).tag, entries: entries.get(s.key) ?? 0,
      dates: { submitOpens: s.submitOpens, submitCloses: s.submitCloses, opens: s.opens, closes: s.closes },
      usual: { submitOpens: usual.submitOpens, submitCloses: usual.submitCloses, opens: usual.opens, closes: usual.closes },
    };
  });
  return (
    <>
      <h1 style={{ fontSize: 30 }}>Contest dates</h1>
      <p className="muted">
        Tick the holidays Porchlight runs a contest for and set when hosts can enter and when voting is open.
        The home page, map, entry form, site theme and the <Link href="/rules">official rules</Link> all follow what you save here.
        Each holiday shows its next contest; the year after starts again from the usual dates.
      </p>
      <ContestDatesForm rows={rows} />
    </>
  );
}
