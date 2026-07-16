// Discovery is browse-by-category, browse-by-language, and search over the
// curated set only. Plus the two-language plumbing (docs/12).
import { describe, it, expect } from 'vitest';
import { searchSites } from '../src/search.js';
import { normalizeCategories, normalizeLanguages, isCategory, label } from '../src/classify.js';
import { t, messages, SUPPORTED } from '../src/i18n.js';

const sites = [
  { id: 'a', status: 'listed', title: 'Space Miner', blurb: 'a game about mining asteroids', categories: ['games'], languages: ['en'] },
  { id: 'b', status: 'listed', title: 'Pixel Garden', blurb: 'space for calm pixel art', categories: ['art'], languages: ['en', 'de'] },
  { id: 'c', status: 'listed', title: 'Nachtfunk', blurb: 'radio at night', categories: ['music'], languages: ['de'] },
  { id: 'd', status: 'due_for_review', title: 'Space Hidden', blurb: 'not listed', categories: ['games'], languages: ['en'] },
];

describe('search', () => {
  it('ranks title matches above blurb matches, and ignores non-listed sites', () => {
    const r = searchSites(sites, 'space');
    expect(r.map((s) => s.id)).toEqual(['a', 'b']); // 'a' title>blurb 'b'; 'd' excluded (not listed)
  });
  it('filters by category and by language', () => {
    expect(searchSites(sites, '', { category: 'music' }).map((s) => s.id)).toEqual(['c']);
    expect(searchSites(sites, '', { language: 'de' }).map((s) => s.id)).toEqual(['c', 'b']); // empty query → title order (Nachtfunk, Pixel Garden)
  });
  it('an empty query lists everything (listed), sorted by title', () => {
    expect(searchSites(sites, '').map((s) => s.title)).toEqual(['Nachtfunk', 'Pixel Garden', 'Space Miner']);
  });
  it('is accent-insensitive and tokenises non-ASCII scripts', () => {
    const fr = [{ id: 'x', status: 'listed', title: 'Île de Pixels', blurb: '', categories: [], languages: ['fr'] }];
    expect(searchSites(fr, 'ile').map((s) => s.id)).toEqual(['x']); // île matches ile
    const ja = [{ id: 'y', status: 'listed', title: '夜のラジオ', blurb: '', categories: [], languages: ['ja'] }];
    expect(searchSites(ja, '夜のラジオ').map((s) => s.id)).toEqual(['y']); // was unsearchable before
  });
});

describe('taxonomy', () => {
  it('drops unknown categories and languages', () => {
    expect(normalizeCategories(['games', 'crypto', 'games'])).toEqual(['games']);
    expect(normalizeLanguages(['de', 'klingon', 'en'])).toEqual(['de', 'en']);
    expect(isCategory('nope')).toBe(false);
  });
  it('labels read native in each UI language', () => {
    expect(label('category', 'music', 'en')).toBe('Music & radio');
    expect(label('category', 'music', 'de')).toBe('Musik & Radio');
    expect(label('language', 'de', 'de')).toBe('Deutsch');
  });
});

describe('i18n', () => {
  it('supports German and English', () => {
    expect(SUPPORTED).toEqual(['en', 'de']);
    expect(t('de', 'nav.submit')).toBe('Seite einreichen');
    expect(t('en', 'nav.submit')).toBe('Submit a site');
  });
  it('interpolates and falls back visibly', () => {
    expect(t('en', 'search.results', { n: 7 })).toBe('7 sites');
    expect(t('de', 'search.results', { n: 7 })).toBe('7 Seiten');
    expect(t('en', 'no.such.key')).toBe('no.such.key');
    expect(t('xx', 'nav.submit')).toBe('Submit a site'); // unknown lang falls back to default
  });
  it('every English key has a German twin', () => {
    const en = Object.keys(messages('en'));
    const de = messages('de');
    for (const k of en) expect(de[k], `missing de: ${k}`).toBeTruthy();
  });
});
