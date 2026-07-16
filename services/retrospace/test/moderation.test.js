// A site never lists itself; only a reviewer moves it, and only along legal
// edges. The yearly-review clock is the other half of the contract (docs/12).
import { describe, it, expect } from 'vitest';
import { apply, canApply, dueForReview, nextReviewAt } from '../src/moderation.js';

const YEAR = 365 * 24 * 60 * 60 * 1000;
const submitted = { id: 's1', status: 'submitted' };

describe('moderation lifecycle', () => {
  it('approving needs a reviewer and stamps the yearly clock', () => {
    expect(() => apply(submitted, 'approve', { role: 'member' })).toThrow(/reviewer/);
    const at = '2024-03-01T00:00:00.000Z';
    const listed = apply(submitted, 'approve', { role: 'moderator', at });
    expect(listed.status).toBe('listed');
    expect(listed.approvedAt).toBe(at);
    expect(new Date(listed.nextReviewAt) - new Date(at)).toBe(YEAR);
  });

  it('refuses illegal transitions', () => {
    expect(() => apply({ status: 'listed' }, 'approve', { role: 'admin' })).toThrow(/cannot approve from listed/);
    expect(() => apply(submitted, 'relist', { role: 'admin' })).toThrow(/cannot relist/);
    expect(() => apply(submitted, 'teleport', { role: 'admin' })).toThrow(/unknown action/);
  });

  it('re-review must use relist, not approve (approve would clobber the approval date)', () => {
    const due = { status: 'due_for_review', approvedAt: '2020-01-01T00:00:00.000Z' };
    expect(() => apply(due, 'approve', { role: 'admin' })).toThrow(/cannot approve/);
  });

  it('lets the submitter or a reviewer withdraw, but not a stranger', () => {
    const mine = { status: 'submitted', submittedBy: 'alice' };
    expect(apply(mine, 'withdraw', { by: 'alice' }).status).toBe('withdrawn');       // the owner
    expect(apply(mine, 'withdraw', { role: 'moderator' }).status).toBe('withdrawn'); // a reviewer
    expect(() => apply(mine, 'withdraw', { by: 'mallory' })).toThrow(/submitter/);   // a stranger
    expect(canApply('submitted', 'approve', 'member')).toBe(false); // members still can't approve
  });

  it('treats a prototype key as an unknown action, not a crash', () => {
    expect(() => apply({ status: 'listed' }, '__proto__', { role: 'admin' })).toThrow(/unknown action/);
  });

  it('re-review resets the clock; delist ends it', () => {
    const due = { status: 'due_for_review', approvedAt: '2023-01-01T00:00:00.000Z' };
    const at = '2024-02-02T00:00:00.000Z';
    const relisted = apply(due, 'relist', { role: 'moderator', at });
    expect(relisted.status).toBe('listed');
    expect(relisted.lastReviewedAt).toBe(at);
    expect(apply(relisted, 'delist', { role: 'admin' }).status).toBe('delisted');
  });

  it('finds only listed sites whose review is overdue', () => {
    const now = '2025-01-01T00:00:00.000Z';
    const sites = [
      { id: 'a', status: 'listed', nextReviewAt: '2024-06-01T00:00:00.000Z' }, // overdue
      { id: 'b', status: 'listed', nextReviewAt: '2026-01-01T00:00:00.000Z' }, // future
      { id: 'c', status: 'delisted', nextReviewAt: '2020-01-01T00:00:00.000Z' }, // not listed
    ];
    expect(dueForReview(sites, now).map((s) => s.id)).toEqual(['a']);
  });

  it('nextReviewAt is exactly a year on', () => {
    expect(new Date(nextReviewAt('2024-01-01T00:00:00.000Z')) - new Date('2024-01-01T00:00:00.000Z')).toBe(YEAR);
  });
});
