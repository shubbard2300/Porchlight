/**
 * The crowd meter: how many different people checked in at a house recently.
 * Only counts leave the server, never who checked in.
 */
export const CROWD_WINDOW_MIN = 30;

export type CrowdLevel = 'quiet' | 'lively' | 'busy' | 'packed';

export const CROWD_LEVELS: Record<CrowdLevel, { label: string; color: string }> = {
  quiet: { label: 'Quiet', color: '#cfcbef' },
  lively: { label: 'Lively', color: '#1e9e6a' },
  busy: { label: 'Busy', color: '#ffb000' },
  packed: { label: 'Packed', color: '#e8364f' },
};

export function crowdLevel(visitors: number): CrowdLevel {
  if (visitors >= 10) return 'packed';
  if (visitors >= 4) return 'busy';
  if (visitors >= 1) return 'lively';
  return 'quiet';
}

export function crowdLine(visitors: number): string {
  const { label } = CROWD_LEVELS[crowdLevel(visitors)];
  return visitors === 0
    ? `${label} right now`
    : `${label}: ${visitors} ${visitors === 1 ? 'visitor' : 'visitors'} in the last ${CROWD_WINDOW_MIN} min`;
}
