import { describe, it, expect, beforeAll } from 'vitest';
import { loadManifest } from '../src/manifest.js';
import { searchCatalog, getSnippet, getTheme } from '../src/tools.js';

let m;
beforeAll(() => { m = loadManifest(); });

describe('searchCatalog', () => {
  it('finds a component by name', () => {
    const r = searchCatalog(m, 'window');
    expect(r.results.some((x) => x.id === 'window')).toBe(true);
    expect(r.results[0].kind).toBeTruthy();
  });

  it('floats the exact id to the top', () => {
    const r = searchCatalog(m, 'snowfall');
    expect(r.results[0].id).toBe('snowfall');
  });

  it('filters by kind', () => {
    const r = searchCatalog(m, 'a', { kind: 'theme' });
    expect(r.results.every((x) => x.kind === 'theme')).toBe(true);
  });

  it('rejects an unknown kind', () => {
    expect(() => searchCatalog(m, 'x', { kind: 'gadget' })).toThrow(/unknown kind/);
  });

  it('an empty query browses everything, capped by limit', () => {
    const r = searchCatalog(m, '', { limit: 5 });
    expect(r.results).toHaveLength(5);
    expect(r.count).toBe(m.components.length + m.widgets.length + m.themes.length);
  });

  it('returns nothing for a nonsense query', () => {
    expect(searchCatalog(m, 'zzzqqq').count).toBe(0);
  });
});

describe('getSnippet', () => {
  it('returns the canonical snippet for a real id', () => {
    const s = getSnippet(m, 'window');
    expect(s.snippet).toContain('rs-');
    expect(s).toHaveProperty('a11y');
    expect(s).toHaveProperty('requiresJs');
  });

  it('throws on an unknown id', () => {
    expect(() => getSnippet(m, 'nope')).toThrow(/no catalog entry/);
  });
});

describe('getTheme', () => {
  it('returns how to apply a theme', () => {
    const t = getTheme(m, 'midnight');
    expect(t.apply.attribute).toBe('data-rs-theme="midnight"');
    expect(t.apply.stylesheet).toBe('dist/themes/midnight.css');
  });

  it('knows the pack themes', () => {
    for (const id of ['cosmic', 'newspaper', 'highcontrast']) {
      expect(getTheme(m, id).id).toBe(id);
    }
  });

  it('throws with the list on an unknown theme', () => {
    expect(() => getTheme(m, 'sunset')).toThrow(/available:/);
  });
});
