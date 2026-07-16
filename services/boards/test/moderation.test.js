// Boards moderation is a permission boundary (docs/11 §8): a member can't moderate, a
// sysop can up to a 7-day ban, only the webmaster bans permanently, and every removal
// carries a reason. Pure logic, so the tests drive it directly.
import { describe, it, expect } from 'vitest';
import {
  can, canBan, nextBanLevel, issueBan, banIsActive, softDeletePost, setThreadFlag, openReports, logEntry,
} from '../src/moderation.js';

describe('boards permissions', () => {
  it('gates actions by role, member up through webmaster', () => {
    expect(can('member', 'lock')).toBe(false);
    expect(can('sysop', 'lock')).toBe(true);
    expect(can('webmaster', 'lock')).toBe(true);
    expect(can('member', 'report')).toBe(true); // anyone can report
  });
  it('treats an unknown or crafted action as forbidden, never a prototype hit', () => {
    expect(can('webmaster', 'nope')).toBe(false);
    expect(can('webmaster', '__proto__')).toBe(false);
    expect(can('webmaster', 'constructor')).toBe(false);
  });
  it('defaults an unknown role to member (fails closed)', () => {
    expect(can('hacker', 'softDelete')).toBe(false);
  });
});

describe('ban ladder', () => {
  it('climbs one rung and caps at permanent', () => {
    expect(nextBanLevel(undefined)).toBe('note');
    expect(nextBanLevel('note')).toBe('24h');
    expect(nextBanLevel('24h')).toBe('7d');
    expect(nextBanLevel('7d')).toBe('permanent');
    expect(nextBanLevel('permanent')).toBe('permanent');
  });
  it('lets a sysop ban up to 7d but reserves permanent for the webmaster', () => {
    expect(canBan('sysop', '7d')).toBe(true);
    expect(canBan('sysop', 'permanent')).toBe(false);
    expect(canBan('webmaster', 'permanent')).toBe(true);
    expect(canBan('member', 'note')).toBe(false);
    expect(canBan('sysop', 'forever')).toBe(false); // not a real level
  });
  it('issues a ban with a computed expiry and a mandatory reason', () => {
    const at = '2026-01-01T00:00:00.000Z';
    const b = issueBan('u1', { level: '24h', reason: ' spam ', by: 'mod', role: 'sysop', at });
    expect(b.expiresAt).toBe('2026-01-02T00:00:00.000Z');
    expect(b.reason).toBe('spam'); // trimmed
    expect(issueBan('u1', { level: 'permanent', reason: 'x', by: 'w', role: 'webmaster', at }).expiresAt).toBeNull();
    expect(() => issueBan('u1', { level: '7d', reason: '  ', by: 'm', role: 'sysop' })).toThrow(/reason/);
    expect(() => issueBan('u1', { level: 'permanent', reason: 'x', role: 'sysop' })).toThrow(/cannot/);
  });
  it('knows which bans are actually blocking', () => {
    const now = '2026-06-01T00:00:00.000Z';
    expect(banIsActive({ level: 'note' }, now)).toBe(false); // a warning never blocks
    expect(banIsActive({ level: '24h', expiresAt: '2026-06-02T00:00:00.000Z' }, now)).toBe(true);
    expect(banIsActive({ level: '24h', expiresAt: '2026-05-30T00:00:00.000Z' }, now)).toBe(false); // expired
    expect(banIsActive({ level: 'permanent' }, now)).toBe(true);
    expect(banIsActive({ level: 'permanent', liftedAt: now }, now)).toBe(false); // lifted
  });
});

describe('post and thread moves', () => {
  it('soft-deletes to a tombstone, never a hard delete, and needs a reason', () => {
    const post = { id: 'p1', body: 'x' };
    const t = softDeletePost(post, { reason: 'off-topic', by: 'mod', role: 'sysop', at: 'T' });
    expect(t).toMatchObject({ id: 'p1', body: 'x', deletedAt: 'T', deletedBy: 'mod', deleteReason: 'off-topic' });
    expect(() => softDeletePost(post, { reason: 'x', role: 'member' })).toThrow(/sysop/);
    expect(() => softDeletePost(post, { reason: '', role: 'sysop' })).toThrow(/reason/);
  });
  it('sets thread flags only for a sysop and only for real flags', () => {
    const th = { id: 't1', isLocked: false, isPinned: false };
    expect(setThreadFlag(th, 'lock', { role: 'sysop' }).isLocked).toBe(true);
    expect(setThreadFlag(th, 'pin', { role: 'webmaster' }).isPinned).toBe(true);
    expect(() => setThreadFlag(th, 'lock', { role: 'member' })).toThrow(/sysop/);
    expect(() => setThreadFlag(th, '__proto__', { role: 'webmaster' })).toThrow(/not a thread flag/);
  });
});

describe('queue and log', () => {
  it('lists open reports oldest-first', () => {
    const reports = [
      { id: 'r1', status: 'open', createdAt: '2026-01-03' },
      { id: 'r2', status: 'resolved', createdAt: '2026-01-01' },
      { id: 'r3', status: 'open', createdAt: '2026-01-02' },
    ];
    expect(openReports(reports).map((r) => r.id)).toEqual(['r3', 'r1']);
  });
  it('builds a mod-log entry', () => {
    const e = logEntry({ action: 'ban', by: 'w', target: 'u9', reason: ' spam ', at: 'T' });
    expect(e).toEqual({ action: 'ban', by: 'w', target: 'u9', reason: 'spam', at: 'T' });
  });
});
