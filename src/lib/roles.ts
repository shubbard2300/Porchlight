// Access levels, kept free of database calls so they can be tested and used on any page.
// Stored as two columns: `role` (USER, EDITOR, ADMIN) and, for regular members, `accountType`.
// Super Admin = ADMIN. Editor = EDITOR. Author = a USER host. Viewer = a USER viewer.
import type { AccountType, Role } from '@prisma/client';

export type AccessLevel = 'SUPER_ADMIN' | 'EDITOR' | 'AUTHOR' | 'VIEWER';

export const ACCESS_LEVELS: { key: AccessLevel; label: string; blurb: string }[] = [
  { key: 'SUPER_ADMIN', label: 'Super Admin', blurb: 'Everything: users, roles, settings, prize pot and all content.' },
  { key: 'EDITOR', label: 'Editor', blurb: 'Reviews, edits and removes anyone’s submissions, pitstops and blocks, and sets contest dates. No users or settings.' },
  { key: 'AUTHOR', label: 'Author', blurb: 'A host. Posts, edits and deletes only their own submissions.' },
  { key: 'VIEWER', label: 'Viewer', blurb: 'Browses the map, checks in and votes.' },
];

export const levelLabel = (l: AccessLevel) => ACCESS_LEVELS.find((x) => x.key === l)!.label;
export const isAccessLevel = (v: unknown): v is AccessLevel => ACCESS_LEVELS.some((x) => x.key === v);

export function accessLevel(u: { role: Role; accountType: AccountType }): AccessLevel {
  if (u.role === 'ADMIN') return 'SUPER_ADMIN';
  if (u.role === 'EDITOR') return 'EDITOR';
  return u.accountType === 'HOST' ? 'AUTHOR' : 'VIEWER';
}

/** The columns to save for a level. Staff keep their account type so their own houses still work. */
export function levelData(level: AccessLevel): { role: Role; accountType?: AccountType } {
  if (level === 'SUPER_ADMIN') return { role: 'ADMIN' };
  if (level === 'EDITOR') return { role: 'EDITOR' };
  return { role: 'USER', accountType: level === 'AUTHOR' ? 'HOST' : 'VIEWER' };
}

/** Can open the admin portal and work on anyone's content. */
export const isStaff = (role: Role | undefined | null) => role === 'ADMIN' || role === 'EDITOR';
/** Can manage users, roles, settings, the prize pot and the form inbox. */
export const isSuperAdmin = (role: Role | undefined | null) => role === 'ADMIN';

type Target = { id: string; role: Role; houses: number; owner: boolean };

/** Shown on Admin > Users when a change is refused. Keyed so the page can be told which one by URL. */
export const BLOCKED = {
  self: 'You can’t change or delete your own account here. Ask another Super Admin.',
  owner: 'That’s the site owner’s account. It always stays Super Admin and can’t be deleted.',
  last: 'That’s the last Super Admin. Make someone else Super Admin first.',
  houses: 'That member has houses posted, so they stay an Author. Remove their houses first to make them a Viewer.',
} satisfies Record<string, string>;
export type BlockReason = keyof typeof BLOCKED;

/**
 * Why a Super Admin can't make this change (a BLOCKED key), or null when they can. Guards the
 * owner's account, the last Super Admin, and the signed-in admin's own access.
 */
export function roleChangeBlocked(actorId: string, target: Target, to: AccessLevel, superAdmins: number): BlockReason | null {
  if (target.id === actorId) return 'self';
  if (target.owner && to !== 'SUPER_ADMIN') return 'owner';
  if (target.role === 'ADMIN' && to !== 'SUPER_ADMIN' && superAdmins <= 1) return 'last';
  if (to === 'VIEWER' && target.houses > 0) return 'houses';
  return null;
}

export function deleteBlocked(actorId: string, target: Omit<Target, 'houses'>, superAdmins: number): BlockReason | null {
  if (target.id === actorId) return 'self';
  if (target.owner) return 'owner';
  if (target.role === 'ADMIN' && superAdmins <= 1) return 'last';
  return null;
}
