// moderation.js, the site lifecycle and the yearly-review clock (docs/12). A
// site never lists itself; only a reviewer moves it, and the moves defined here
// are the only legal ones. Dates are passed in so the logic stays pure and
// testable; ISO 8601 strings compare correctly with <=.
export const STATUS = [
  'submitted', 'in_review', 'listed', 'due_for_review', 'delisted', 'rejected', 'withdrawn',
];
const REVIEWER = new Set(['moderator', 'admin']);

// action -> { from: [allowed statuses], to, reviewer?, stamps? }
const MOVES = {
  claim: { from: ['submitted'], to: 'in_review', reviewer: true },
  approve: { from: ['submitted', 'in_review'], to: 'listed', reviewer: true, stamps: 'approve' },
  reject: { from: ['submitted', 'in_review'], to: 'rejected', reviewer: true },
  flag: { from: ['listed'], to: 'due_for_review', reviewer: true },
  relist: { from: ['due_for_review'], to: 'listed', reviewer: true, stamps: 'review' },
  delist: { from: ['listed', 'due_for_review'], to: 'delisted', reviewer: true },
  withdraw: { from: ['submitted', 'in_review', 'listed', 'due_for_review'], to: 'withdrawn' },
};

const YEAR_MS = 365 * 24 * 60 * 60 * 1000;
export const nextReviewAt = (fromISO) => new Date(new Date(fromISO).getTime() + YEAR_MS).toISOString();

export const canApply = (status, action, role = 'member') => {
  const m = Object.hasOwn(MOVES, action) ? MOVES[action] : null;
  return !!m && m.from.includes(status) && (!m.reviewer || REVIEWER.has(role));
};

/** Apply an action, returning a NEW site, or throw if the move is illegal. */
export function apply(site, action, { role = 'member', by = null, at } = {}) {
  // hasOwn, so a crafted action like "__proto__" is "unknown", not a TypeError
  const move = Object.hasOwn(MOVES, action) ? MOVES[action] : null;
  if (!move) throw new Error(`unknown action: ${action}`);
  if (!move.from.includes(site.status)) throw new Error(`cannot ${action} from ${site.status}`);
  if (move.reviewer && !REVIEWER.has(role)) throw new Error(`${action} needs a reviewer`);
  // withdraw is the owner's move: only the site's submitter (or a reviewer) may
  // do it, otherwise any member could delist anyone's site
  if (action === 'withdraw' && !REVIEWER.has(role) && (!by || by !== site.submittedBy)) {
    throw new Error('only the submitter can withdraw');
  }
  const now = at || new Date().toISOString();
  const next = { ...site, status: move.to };
  if (move.stamps === 'approve') { next.approvedAt = now; next.lastReviewedAt = now; next.nextReviewAt = nextReviewAt(now); }
  if (move.stamps === 'review') { next.lastReviewedAt = now; next.nextReviewAt = nextReviewAt(now); }
  return next;
}

/** Listed sites whose yearly review is due as of nowISO. */
export const dueForReview = (sites, nowISO) =>
  sites.filter((s) => s.status === 'listed' && s.nextReviewAt && s.nextReviewAt <= nowISO);
