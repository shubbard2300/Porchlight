/** The phrase people type on their profile to delete their account, so nobody wipes it by accident. */
export const DELETE_PHRASE = 'DELETE';

/** True when what they typed matches the phrase. Case and stray spaces don't matter. */
export function confirmsDelete(typed: unknown): boolean {
  return typeof typed === 'string' && typed.trim().toUpperCase() === DELETE_PHRASE;
}
