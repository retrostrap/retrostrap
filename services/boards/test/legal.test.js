// The legal pages (docs/11 §9): both render, disclose what the code actually does, are
// linked from every footer, and keep the house dash rule (no em/en dashes, ever).
import { describe, it, expect } from 'vitest';
import { impressumView, datenschutzView } from '../src/legal.js';
import { layout, toHtml } from '../src/views.js';

describe('legal pages', () => {
  it('impressum names the Medieninhaber duty and links the privacy policy', () => {
    const h = toHtml(impressumView());
    expect(h).toContain('Medieninhaber');
    expect(h).toContain('§ 25 Mediengesetz');
    expect(h).toContain('href="/datenschutz"');
    expect(h).toContain('English summary');
  });

  it('datenschutz discloses exactly the two cookies and the supervisory authority', () => {
    const h = toHtml(datenschutzView());
    expect(h).toContain('__Host-sid');
    expect(h).toContain('__Host-csrf');
    expect(h).toContain('argon2id');
    expect(h).toContain('Datenschutzbehörde');
    expect(h).toContain('dsb.gv.at');
    expect(h).toContain('English summary');
  });

  it('carries no em or en dashes, in either language', () => {
    for (const view of [impressumView(), datenschutzView()]) {
      const h = toHtml(view);
      expect(h).not.toMatch(/[–—]/);
      expect(h).not.toContain('&mdash;');
      expect(h).not.toContain('&ndash;');
    }
  });

  it('is linked from the layout footer on every page', () => {
    const h = toHtml(layout({ title: 'Anything', user: null, body: 'x' }));
    expect(h).toContain('href="/impressum"');
    expect(h).toContain('href="/datenschutz"');
  });
});
