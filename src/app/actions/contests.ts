'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import type { FormState } from '@/lib/forms';
import { HOLIDAYS } from '@/lib/holidays';
import { getSeasonConfig, saveSeasonConfig } from '@/lib/seasonConfig';
import { buildSeasons, contestToday, dateProblems, usualDates, type SeasonConfig, type SeasonDates } from '@/lib/seasons';
import { editableSeasons } from '@/lib/contestAdmin';

const FIELDS = ['submitOpens', 'submitCloses', 'opens', 'closes'] as const;

/**
 * Saves Admin > Contest dates: which holidays run, and the dates for each one's upcoming contest.
 * Only dates that differ from the usual ones are stored, so untouched contests keep following holidays.ts.
 */
export async function saveContestDates(_prev: FormState, fd: FormData): Promise<FormState> {
  // Super Admins and Editors.
  await requireAdmin();
  const today = contestToday();
  const saved = await getSeasonConfig();
  const shown = editableSeasons(buildSeasons(saved, today), today);

  const enabled: SeasonConfig['enabled'] = {};
  for (const h of HOLIDAYS) enabled[h.key] = fd.get(`on:${h.key}`) === 'on';
  if (!Object.values(enabled).some(Boolean)) return { errors: { form: 'Turn on at least one contest.' } };

  const dates = { ...saved.dates };
  const errors: Record<string, string> = {};
  for (const s of shown) {
    const picked = Object.fromEntries(FIELDS.map((f) => [f, String(fd.get(`${s.key}:${f}`) ?? '')])) as SeasonDates;
    const problems = dateProblems(picked);
    if (enabled[s.holiday]) {
      for (const [f, msg] of Object.entries(problems)) errors[`${s.key}:${f}`] = msg;
    } else if (Object.keys(problems).length) {
      continue; // A contest that's off can keep half-finished dates without blocking the save; they just aren't stored.
    }
    const usual = usualDates(s.holiday, s.year)!;
    const changed = Object.fromEntries(FIELDS.filter((f) => picked[f] !== usual[f]).map((f) => [f, picked[f]]));
    if (Object.keys(changed).length) dates[s.key] = changed;
    else delete dates[s.key];
  }
  if (Object.keys(errors).length) return { errors: { ...errors, form: 'Some dates need fixing. They’re marked below.' } };

  await saveSeasonConfig({ enabled, dates });
  revalidatePath('/', 'layout');
  return { message: 'Contest dates saved. The site, map and rules now follow them.' };
}
