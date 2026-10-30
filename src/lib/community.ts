import type { Icon3DName } from '@/components/Icon3D';

/** What the whole neighborhood has done together in one contest. */
export type CommunityCounts = { porches: number; checkIns: number; scorecards: number; neighbors: number };

export type Milestone = {
  key: keyof Omit<CommunityCounts, 'neighbors'>;
  goal: number;
  icon: Icon3DName;
  /** Short name of the thing everyone unlocks together. */
  unlock: string;
  detail: string;
};

/**
 * Shared goals for each contest. When the community hits one, everyone unlocks it, not just the leader.
 * Every unlock is something Porchlight itself delivers at no cost to anyone, so none of them is a cash prize
 * or a promise made on a sponsor's behalf. Change the goals here; the home page and FAQ read from this list.
 */
export const MILESTONES: Milestone[] = [
  { key: 'porches', goal: 50, icon: 'camera', unlock: 'The season recap film', detail: 'A short tour video with a moment from every porch on the map, shared after the holiday.' },
  { key: 'checkIns', goal: 500, icon: 'medal', unlock: 'Community Choice honors', detail: 'Extra shout-outs for Best Lighting, Best Story, Best Sound and Most Creative, picked from everyone’s scorecards.' },
  { key: 'scorecards', goal: 1000, icon: 'star', unlock: 'You pick next season’s theme', detail: 'Everyone who scored a house gets a vote on the featured theme for the next contest.' },
];

export const MILESTONE_NOUN: Record<Milestone['key'], string> = { porches: 'porches lit', checkIns: 'check-ins', scorecards: 'scorecards' };

/** Progress toward each milestone, 0 to 1, plus how many are left. */
export function milestoneProgress(counts: CommunityCounts, milestones: Milestone[] = MILESTONES) {
  return milestones.map((m) => {
    const have = counts[m.key];
    return { ...m, have, left: Math.max(0, m.goal - have), pct: Math.min(1, have / m.goal), done: have >= m.goal };
  });
}

/** The milestone closest to unlocking, so the page can name one goal instead of three. */
export function nextMilestone(progress: ReturnType<typeof milestoneProgress>) {
  return progress.filter((m) => !m.done).sort((a, b) => b.pct - a.pct)[0] ?? null;
}
