import 'server-only';
import { cache } from 'react';
import { z } from 'zod';
import { getSetting, setSetting } from './settings';
import { buildSeasons, calendar, contestToday, type SeasonConfig } from './seasons';

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const configSchema = z.object({
  enabled: z.record(z.string(), z.boolean()).optional(),
  dates: z.record(z.string(), z.object({ submitOpens: day, submitCloses: day, opens: day, closes: day }).partial()).optional(),
});

/** What an admin saved on Admin > Contest dates. A missing or unreadable setting means "the usual". */
export async function getSeasonConfig(): Promise<SeasonConfig> {
  const raw = await getSetting('contestSeasons');
  if (!raw) return {};
  try {
    const parsed = configSchema.safeParse(JSON.parse(raw));
    return parsed.success ? (parsed.data as SeasonConfig) : {};
  } catch {
    return {};
  }
}

export async function saveSeasonConfig(config: SeasonConfig) {
  await setSetting('contestSeasons', JSON.stringify(config));
}

/** This request's contests, built once from the admin settings. Destructure the lookups you need. */
export const seasonCalendar = cache(async () => calendar(buildSeasons(await getSeasonConfig(), contestToday())));
