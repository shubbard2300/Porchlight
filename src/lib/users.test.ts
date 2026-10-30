import { describe, expect, it } from 'vitest';
import { numberedUsername, usernameFromEmail } from './users';
import { usernameSchema } from './validation';

describe('usernameFromEmail', () => {
  it('makes a valid username from the part before the @', () => {
    expect(usernameFromEmail('Sam.Rivera+lights@example.com')).toBe('sam_rivera');
    expect(usernameFromEmail('gamecat2300@gmail.com')).toBe('gamecat2300');
  });
  it('falls back for short, reserved or symbol-only names', () => {
    expect(usernameFromEmail('jo@example.com')).toBe('neighbor');
    expect(usernameFromEmail('admin@example.com')).toBe('neighbor');
    expect(usernameFromEmail('...@example.com')).toBe('neighbor');
  });
  it('always passes the username rules, even long and numbered', () => {
    const long = usernameFromEmail('a.very.long.email.address.indeed@example.com');
    expect(long.length).toBeLessThanOrEqual(15);
    expect(usernameSchema.safeParse(numberedUsername(long, 9999)).success).toBe(true);
  });
});
