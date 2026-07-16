// Docs must not lie about the CSS. Every class a component catalog entry
// names has to exist in the built stylesheet, this is the tripwire that
// catches catalog/CSS drift before it reaches anyone reading the docs.
import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const DIST = join(ROOT, 'dist', 'retrostrap.css');
const COMPONENTS = join(ROOT, 'catalog', 'components');

beforeAll(() => {
  // the check is meaningless without a fresh build; make one if it's missing
  if (!existsSync(DIST)) execFileSync('node', ['scripts/build.mjs'], { cwd: ROOT });
});

describe('catalog matches the CSS', () => {
  it('every documented component class exists in the built stylesheet', () => {
    const css = readFileSync(DIST, 'utf8');
    const present = new Set([...css.matchAll(/\.(rs-[a-z0-9_-]+)/g)].map((m) => m[1]));

    const missing = [];
    for (const file of readdirSync(COMPONENTS)) {
      if (!file.endsWith('.json')) continue;
      const item = JSON.parse(readFileSync(join(COMPONENTS, file), 'utf8'));
      for (const cls of item.classes) {
        if (!present.has(cls.name)) missing.push(`${item.id} → ${cls.name}`);
      }
    }
    expect(missing).toEqual([]);
  });
});
