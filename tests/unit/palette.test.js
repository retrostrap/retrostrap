// The legal palette is generated, not typed by hand, so test the generator.
import { describe, it, expect } from 'vitest';
import { LEGAL_HEX, LEGAL_RGB } from '../../src/js/core/palette.js';

describe('the legal palette', () => {
  it('has exactly 224 colors (216 cube + 8 off-cube named)', () => {
    expect(LEGAL_HEX.length).toBe(224);
    expect(LEGAL_RGB.size).toBe(224);
  });

  it('includes the era load-bearing colors', () => {
    for (const hex of ['#000000', '#FFFFFF', '#C0C0C0', '#000080', '#008080', '#FF0000', '#00FF00']) {
      expect(LEGAL_HEX).toContain(hex);
    }
  });

  it('rejects an off-cube color like salmon', () => {
    expect(LEGAL_HEX).not.toContain('#FA8072');
    expect(LEGAL_RGB.has('250,128,114')).toBe(false);
  });

  it('every cube channel is one of the six steps', () => {
    const steps = new Set(['00', '33', '66', '99', 'CC', 'FF']);
    // the 216 cube members only (named-8 are allowed to break the rule)
    const named = new Set(['#C0C0C0', '#808080', '#800000', '#800080', '#008000', '#808000', '#000080', '#008080']);
    for (const hex of LEGAL_HEX) {
      if (named.has(hex)) continue;
      expect(steps.has(hex.slice(1, 3))).toBe(true);
      expect(steps.has(hex.slice(3, 5))).toBe(true);
      expect(steps.has(hex.slice(5, 7))).toBe(true);
    }
  });
});
