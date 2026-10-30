import { describe, expect, it } from 'vitest';
import { accessLevel, deleteBlocked, isStaff, isSuperAdmin, levelData, roleChangeBlocked } from './roles';

const target = (o: Partial<{ id: string; role: 'USER' | 'EDITOR' | 'ADMIN'; houses: number; owner: boolean }> = {}) => ({ id: 't', role: 'USER' as const, houses: 0, owner: false, ...o });

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
    expect(roleChangeBlocked('me', target(), 'EDITOR', 1)).toBeNull();
    expect(roleChangeBlocked('me', target({ role: 'ADMIN' }), 'EDITOR', 2)).toBeNull();
  });
  it('never changes your own access', () => {
    expect(roleChangeBlocked('t', target({ role: 'ADMIN' }), 'EDITOR', 3)).toBe('self');
  });
  it('keeps the owner a Super Admin', () => {
    expect(roleChangeBlocked('me', target({ role: 'ADMIN', owner: true }), 'VIEWER', 5)).toBe('owner');
    expect(roleChangeBlocked('me', target({ role: 'ADMIN', owner: true }), 'SUPER_ADMIN', 5)).toBeNull();
  });
  it('keeps at least one Super Admin', () => {
    expect(roleChangeBlocked('me', target({ role: 'ADMIN' }), 'AUTHOR', 1)).toBe('last');
  });
  it('keeps members with houses as Authors', () => {
    expect(roleChangeBlocked('me', target({ houses: 2 }), 'VIEWER', 1)).toBe('houses');
    expect(roleChangeBlocked('me', target({ houses: 2 }), 'EDITOR', 1)).toBeNull();
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
