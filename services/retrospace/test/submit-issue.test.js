// The submission → GitHub issue path fences every value so a submitter can't
// inject markdown (a heading, a link, a code span) into the issue a maintainer reads.
import { describe, it, expect } from 'vitest';
import { flat, fence } from '../src/submit-issue.js';

describe('submit-issue sanitizers', () => {
  it('flat collapses control chars, so a newline can\'t break the issue body', () => {
    expect(flat('ok\n\n# heading\n[x](http://evil)')).toBe('ok # heading [x](http://evil)');
    expect(flat('a\tb\rc')).toBe('a b c');
  });

  it('fence neutralizes inner backticks and stays on one line', () => {
    const out = fence('a`b`c\n# h');
    expect(out.startsWith('`') && out.endsWith('`')).toBe(true);
    expect((out.match(/`/g) || []).length).toBe(2); // only the wrapping pair; inner ` became '
    expect(out).not.toMatch(/[\n\r\t]/);
  });

  it('fence truncates a long value', () => {
    expect(fence('x'.repeat(1000)).length).toBeLessThanOrEqual(502); // 500 + the two backticks
  });
});
