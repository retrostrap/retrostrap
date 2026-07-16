// The data-attribute option parser (docs/06): one grammar, cast by shape.
import { describe, it, expect } from 'vitest';
import { cast, parseOptions } from '../../src/js/core/options.js';

describe('cast', () => {
  it('reads booleans', () => {
    expect(cast('true')).toBe(true);
    expect(cast('false')).toBe(false);
  });
  it('reads numbers', () => {
    expect(cast('8')).toBe(8);
    expect(cast('1.5')).toBe(1.5);
    expect(cast('-2')).toBe(-2);
  });
  it('reads JSON arrays and objects', () => {
    expect(cast('[1,2,3]')).toEqual([1, 2, 3]);
    expect(cast('{"density":"light"}')).toEqual({ density: 'light' });
  });
  it('falls back to the raw string on bad JSON', () => {
    expect(cast('[not json')).toBe('[not json');
  });
  it('leaves plain strings alone', () => {
    expect(cast('patrol')).toBe('patrol');
    expect(cast('#FF6600')).toBe('#FF6600');
  });
});

describe('parseOptions', () => {
  // parseOptions only reads el.dataset, so a plain object stands in for a node
  const fake = (dataset) => ({ dataset });

  it('picks out this widget’s attributes and casts them', () => {
    const el = fake({
      rsNekoBehavior: 'patrol',
      rsNekoSpeed: '80',
      rsSnowfallDensity: 'light', // a different widget: ignored
    });
    expect(parseOptions(el, 'neko')).toEqual({ behavior: 'patrol', speed: 80 });
  });

  it('handles multi-word widget names and options', () => {
    const el = fake({ rsCursorTrailVariant: 'hearts', rsCursorTrailCount: '12' });
    expect(parseOptions(el, 'cursor-trail')).toEqual({ variant: 'hearts', count: 12 });
  });

  it('lets JS overrides win over attributes', () => {
    const el = fake({ rsMarqueeSpeed: 'slow' });
    expect(parseOptions(el, 'marquee', { speed: 'fast' })).toEqual({ speed: 'fast' });
  });

  it('returns empty options when there are none', () => {
    expect(parseOptions(fake({}), 'clock')).toEqual({});
  });
});
