import { expect, it } from 'vitest';
import { milestoneProgress, nextMilestone, type Milestone } from './community';

const goals: Milestone[] = [
  { key: 'porches', goal: 10, icon: 'camera', unlock: 'A', detail: '' },
  { key: 'checkIns', goal: 100, icon: 'medal', unlock: 'B', detail: '' },
  { key: 'scorecards', goal: 40, icon: 'star', unlock: 'C', detail: '' },
];

it('caps progress at the goal and counts what is left', () => {
  const [a, b] = milestoneProgress({ porches: 14, checkIns: 25, scorecards: 0, neighbors: 3 }, goals);
  expect(a).toMatchObject({ have: 14, left: 0, pct: 1, done: true });
  expect(b).toMatchObject({ have: 25, left: 75, pct: 0.25, done: false });
});

it('points at the unfinished goal that is furthest along', () => {
  const p = milestoneProgress({ porches: 10, checkIns: 25, scorecards: 20, neighbors: 0 }, goals);
  expect(nextMilestone(p)?.unlock).toBe('C');
});

it('has no next goal once everything is unlocked', () => {
  expect(nextMilestone(milestoneProgress({ porches: 10, checkIns: 100, scorecards: 40, neighbors: 0 }, goals))).toBeNull();
});
