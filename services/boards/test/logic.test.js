// The forum's pure logic (docs/11 §6): quiz, ranks, and auth. No database
// needed, these are the parts we can prove correct in isolation.
import { describe, it, expect } from 'vitest';
import { QUESTIONS, normalizeAnswer, checkAnswer, pickQuestion } from '../src/quiz.js';
import { rankFor } from '../src/ranks.js';
import { hashPassword, verifyPassword, newSessionToken, hashToken } from '../src/auth.js';

describe('quiz', () => {
  it('ships ten questions, each with answers and a hint', () => {
    expect(QUESTIONS).toHaveLength(10);
    for (const q of QUESTIONS) { expect(q.a.length).toBeGreaterThan(0); expect(q.hint).toBeTruthy(); }
  });
  it('normalizes answers before matching', () => {
    expect(normalizeAnswer('  World Wide Web!! ')).toBe('world wide web');
    expect(checkAnswer(0, 'World Wide Web')).toBe(true);
    expect(checkAnswer(0, 'the internet')).toBe(false);
  });
  it('accepts any listed answer', () => {
    const gif = QUESTIONS.findIndex((q) => q.a.includes('gif'));
    expect(checkAnswer(gif, 'GIF')).toBe(true);
  });
  it('pickQuestion avoids the previous one', () => {
    expect(pickQuestion(3, 3)).not.toBe(3);
    expect(pickQuestion(3, 3)).toBeGreaterThanOrEqual(0);
  });
});

describe('ranks', () => {
  it('climbs the ladder by post count', () => {
    expect(rankFor(0).title).toBe('Lurker');
    expect(rankFor(1).title).toBe('Newbie');
    expect(rankFor(10).title).toBe('Member');
    expect(rankFor(50).title).toBe('Regular');
    expect(rankFor(200).title).toBe('Old-Timer');
    expect(rankFor(9999).title).toBe('Old-Timer');
  });
  it('roles outrank post count', () => {
    expect(rankFor(0, 'sysop')).toMatchObject({ title: 'Sysop', color: 'green' });
    expect(rankFor(0, 'webmaster')).toMatchObject({ title: 'Webmaster', color: 'red' });
  });
});

describe('auth', () => {
  it('hashes and verifies a password, and rejects the wrong one', () => {
    const h = hashPassword('correct horse battery staple');
    expect(h.startsWith('scrypt$')).toBe(true);
    expect(verifyPassword('correct horse battery staple', h)).toBe(true);
    expect(verifyPassword('Tr0ub4dor&3', h)).toBe(false);
  });
  it('never accepts a malformed or truncated hash, and never throws', () => {
    for (const bad of ['', 'garbage', 'scrypt', 'scrypt$16384', 'scrypt$x$y$z',
      'bcrypt$1$2$3', null, undefined, 'scrypt$16384$zzzz$', 'scrypt$16384$$deadbeef']) {
      expect(() => verifyPassword('anything', bad)).not.toThrow();
      expect(verifyPassword('anything', bad)).toBe(false); // esp. the empty-hash bypass
    }
  });

  it('makes unique session tokens and stores only their hash', () => {
    const a = newSessionToken();
    const b = newSessionToken();
    expect(a).not.toBe(b);
    expect(hashToken(a)).toHaveLength(64); // sha256 hex
    expect(hashToken(a)).not.toBe(a); // the token itself is never stored
  });
});
