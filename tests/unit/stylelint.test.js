// The stylelint plugin enforces the laws in user CSS (docs/09). It reads the
// legal palette from dist/guardrails.json, so the build must have run.
import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import stylelint from 'stylelint';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const config = {
  plugins: ['./tools/stylelint-retrostrap/index.cjs'],
  rules: { 'retrostrap/laws': true },
};

beforeAll(() => {
  if (!existsSync(`${ROOT}/dist/guardrails.json`)) execFileSync('node', ['scripts/build.mjs'], { cwd: ROOT });
});

const lint = (code) => stylelint.lint({ code, config, cwd: ROOT });

describe('retrostrap/laws stylelint rule', () => {
  it('passes lawful CSS', async () => {
    const { results } = await lint('.x { color: #000080; border-radius: 0; box-shadow: 2px 2px 0 #808080; transition: all .1s linear; }');
    expect(results[0].warnings).toEqual([]);
  });

  it('flags an off-palette color', async () => {
    const { results } = await lint('.x { color: #FA8072; }');
    expect(results[0].warnings.map((w) => w.text).join(' ')).toMatch(/off the retrostrap palette/);
  });

  it('flags a non-zero border-radius', async () => {
    const { results } = await lint('.x { border-radius: 8px; }');
    expect(results[0].warnings.map((w) => w.text).join(' ')).toMatch(/border-radius must be 0/);
  });

  it('flags a blurred shadow', async () => {
    const { results } = await lint('.x { box-shadow: 2px 2px 6px #000000; }');
    expect(results[0].warnings.map((w) => w.text).join(' ')).toMatch(/must have 0 blur/);
  });

  it('flags non-linear easing', async () => {
    const { results } = await lint('.x { transition: all .2s ease-in-out; }');
    expect(results[0].warnings.map((w) => w.text).join(' ')).toMatch(/easing must be linear or steps/);
  });

  it('flags a translucent color', async () => {
    const { results } = await lint('.x { color: #00008080; }');
    expect(results[0].warnings.map((w) => w.text).join(' ')).toMatch(/off the retrostrap palette/);
  });
});
