import { describe, expect, it } from 'vitest';
import { accessLevel, deleteBlocked, isStaff, isSuperAdmin, levelData, roleChangeBlocked } from './roles';

const target = (o: Partial<{ id: string; role: 'USER' | 'EDITOR' | 'ADMIN'; owner: boolean }> = {}) => ({ id: 't', role: 'USER' as const, owner: false, ...o });
const admin = { id: 'me', role: 'ADMIN' as const };
const editor = { id: 'me', role: 'EDITOR' as const };

describe('access levels', () => {
  it('reads the level from role and account type', () => {
    expect(accessLevel({ role: 'ADMIN', accountType: 'HOST' })).toBe('SUPER_ADMIN');
    expect(accessLevel({ role: 'EDITOR', accountType: 'VIEWER' })).toBe('EDITOR');
    expect(accessLevel({ role: 'USER', accountType: 'HOST' })).toBe('AUTHOR');
    expect(accessLevel({ role: 'USER', accountType: 'VIEWER' })).toBe('VIEWER');
  });
  it('round-trips every level', () => {
    for (const l of ['SUPER_ADMIN', 'EDITOR', 'AUTHOR', 'VIEWER'] as const) {
      const d = levelData(l);
      expect(accessLevel({ role: d.role, accountType: d.accountType ?? 'VIEWER' })).toBe(l);
    }
  });
  it('lets Editors into content tools but not Super Admin areas', () => {
    expect(isStaff('EDITOR')).toBe(true);
    expect(isSuperAdmin('EDITOR')).toBe(false);
    expect(isStaff('USER')).toBe(false);
    expect(isSuperAdmin('ADMIN')).toBe(true);
  });
});

describe('roleChangeBlocked', () => {
  it('allows normal changes', () => {
    expect(roleChangeBlocked(admin, target(), 'EDITOR', 1)).toBeNull();
    expect(roleChangeBlocked(admin, target({ role: 'ADMIN' }), 'EDITOR', 2)).toBeNull();
  });
  it('never changes your own access', () => {
    expect(roleChangeBlocked({ id: 't', role: 'ADMIN' }, target({ role: 'ADMIN' }), 'EDITOR', 3)).toBe('self');
  });
  it('keeps the owner a Super Admin', () => {
    expect(roleChangeBlocked(admin, target({ role: 'ADMIN', owner: true }), 'VIEWER', 5)).toBe('owner');
    expect(roleChangeBlocked(admin, target({ role: 'ADMIN', owner: true }), 'SUPER_ADMIN', 5)).toBeNull();
  });
  it('keeps at least one Super Admin', () => {
    expect(roleChangeBlocked(admin, target({ role: 'ADMIN' }), 'AUTHOR', 1)).toBe('last');
  });
  it('lets a member with houses become a Viewer', () => {
    expect(roleChangeBlocked(admin, target(), 'VIEWER', 1)).toBeNull();
  });
  it('keeps Editors to switching members between Author and Viewer', () => {
    expect(roleChangeBlocked(editor, target(), 'VIEWER', 1)).toBeNull();
    expect(roleChangeBlocked(editor, target(), 'AUTHOR', 1)).toBeNull();
    expect(roleChangeBlocked(editor, target(), 'EDITOR', 1)).toBe('editor');
    expect(roleChangeBlocked(editor, target({ role: 'EDITOR' }), 'VIEWER', 1)).toBe('editor');
    expect(roleChangeBlocked(editor, target({ role: 'ADMIN' }), 'VIEWER', 3)).toBe('editor');
    expect(roleChangeBlocked(editor, target({ role: 'ADMIN', owner: true }), 'VIEWER', 3)).toBe('owner');
  });
});

describe('deleteBlocked', () => {
  it('guards self, owner and the last Super Admin', () => {
    expect(deleteBlocked('t', target(), 2)).toBe('self');
    expect(deleteBlocked('me', target({ role: 'ADMIN', owner: true }), 3)).toBe('owner');
    expect(deleteBlocked('me', target({ role: 'ADMIN' }), 1)).toBe('last');
    expect(deleteBlocked('me', target({ role: 'EDITOR' }), 1)).toBeNull();
  });
});
