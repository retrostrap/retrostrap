// The budget governor's particle allocation (docs/08). The time-based
// degradation ladder runs in the browser's rAF loop; the allocation math,
// fair shares scaled to the global cap, is pure and lives here.
import { describe, it, expect, afterEach } from 'vitest';
import { budgetFor, status } from '../../src/js/core/budget.js';

const handles = [];
const make = (id) => { const b = budgetFor(id); handles.push(b); return b; };
afterEach(() => { handles.forEach((b) => b.release()); handles.length = 0; });

describe('budget allocation', () => {
  it('grants the full ask when under the cap', () => {
    const snow = make('snow');
    expect(snow.claim(100)).toBe(100);
    expect(snow.grant()).toBe(100);
  });

  it('scales all claims proportionally when they exceed the 150 cap', () => {
    const a = make('a');
    const b = make('b');
    a.claim(100);
    b.claim(100); // total 200 > 150 → each gets 75
    expect(a.grant()).toBe(75);
    expect(b.grant()).toBe(75);
    expect(a.grant() + b.grant()).toBeLessThanOrEqual(150);
  });

  it('gives a released widget’s share back to the others', () => {
    const a = make('a2');
    const b = make('b2');
    a.claim(100);
    b.claim(100);
    expect(a.grant()).toBe(75);
    b.release();
    expect(a.grant()).toBe(100); // b's share returned
  });

  it('reports live particle totals', () => {
    make('c').claim(40);
    make('d').claim(20);
    const s = status();
    expect(s.particles).toBeGreaterThanOrEqual(60);
    expect(s.cap).toBe(150);
    expect(s.level).toBe(0);
  });
});
