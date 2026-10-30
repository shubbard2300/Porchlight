/** Who runs Porchlight, as named in the footer and legal pages. Change these in one place. */
export const OWNER_NAME = 'Steven John Hubbard LLC';
export const CONTACT_EMAIL = 'hello@porchlightcontest.com';
export const SITE_URL = 'https://www.porchlightcontest.com';
/** Bump this whenever the wording of a legal page changes. Entries and payments record which version they agreed to. */
export const LEGAL_UPDATED = 'October 30, 2026';

/**
 * Where the contest is open. Houses must be in this state and hosts must live there. Set to null to open
 * the contest to the whole United States (and update the rules wording with a lawyer first).
 */
export const CONTEST_STATE: { code: string; name: string } | null = { code: 'OR', name: 'Oregon' };

export const SPONSOR_ADDRESS = '3737 NE Simpson, Portland, OR 97211';

/**
 * The prize places for each contest. An empty amount shows as a highlighted blank on the rules page,
 * so nobody mistakes a missing detail for a real one. Fill these in before a contest opens.
 */
export const PRIZE_PLACES: { place: string; amount: string }[] = [
  { place: 'First place', amount: '' },
  { place: 'Second place', amount: '' },
  { place: 'Third place', amount: '' },
];

/** The words on the agreement checkbox, shared by the submit form and the pot payment. */
export function rulesAgreementText(): string {
  const who = CONTEST_STATE ? `an ${CONTEST_STATE.name} resident aged 18 or older` : 'a U.S. resident aged 18 or older';
  return `I'm ${who}, and I agree to the Official Rules (including the content rules, the fair-voting rules and that pot contributions are non-refundable) and the Privacy Policy on how my home address is used.`;
}

/** True when a two-letter state code is inside the contest area (unknown states pass; an admin reviews every entry). */
export function inContestArea(state: string | null): boolean {
  return !CONTEST_STATE || !state || state === CONTEST_STATE.code;
}

/** The two-letter US state in a Nominatim address (tagged ISO3166-2-lvl4 "US-OR"), or null outside the US. */
export function usState(address: Record<string, string> | undefined): string | null {
  const iso = address?.['ISO3166-2-lvl4'];
  return iso?.startsWith('US-') ? iso.slice(3) : null;
}
