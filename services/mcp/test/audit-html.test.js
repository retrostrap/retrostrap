import { describe, it, expect, beforeAll } from 'vitest';
import { loadManifest } from '../src/manifest.js';
import { auditHtml } from '../src/audit-html.js';

let laws;
const run = (html) => auditHtml(html, laws);
const rules = (html) => run(html).violations.map((v) => v.rule);
beforeAll(() => { laws = loadManifest().laws; });

describe('auditHtml, clean input', () => {
  it('passes a class-only snippet with no inline CSS', () => {
    expect(run('<div class="rs-window"><p>hi</p></div>').ok).toBe(true);
  });

  it('passes legal web-safe and named colors', () => {
    const html = '<p style="color:#FF0000;background:#C0C0C0;border-color:navy">x</p>';
    expect(run(html).ok).toBe(true);
  });

  it('does not flag transparent / inherit / currentColor', () => {
    expect(run('<p style="color:inherit;background:transparent">x</p>').ok).toBe(true);
  });

  it('allows linear and steps() easing', () => {
    const html = '<p style="transition-timing-function:steps(4);animation-timing-function:linear">x</p>';
    expect(run(html).ok).toBe(true);
  });
});

describe('auditHtml, palette', () => {
  it('flags an off-cube hex with a snap-to-legal hint', () => {
    const { violations } = run('<p style="color:#FA8072">x</p>');
    expect(violations[0].rule).toBe('palette');
    expect(violations[0].hint).toMatch(/nearest legal is #FF9966/);
  });

  it('expands 3-digit hex before judging', () => {
    // #F00 -> #FF0000, legal
    expect(run('<p style="color:#F00">x</p>').ok).toBe(true);
    // #FAB -> #FFAABB, off cube
    expect(rules('<p style="color:#FAB">x</p>')).toContain('palette');
  });

  it('flags translucent UI (alpha < 1) but not fully transparent', () => {
    expect(rules('<p style="background:rgba(0,0,0,0.5)">x</p>')).toContain('translucent-ui');
    expect(run('<p style="background:rgba(0,0,0,0)">x</p>').ok).toBe(true);
  });

  it('checks rgb() against the cube', () => {
    expect(run('<p style="color:rgb(255,0,0)">x</p>').ok).toBe(true);   // #FF0000
    expect(rules('<p style="color:rgb(250,128,114)">x</p>')).toContain('palette');
  });

  it('flags a common illegal named color', () => {
    expect(rules('<p style="color:orange">x</p>')).toContain('palette');
  });
});

describe('auditHtml, shape', () => {
  it('flags nonzero border-radius, allows 0', () => {
    expect(rules('<div style="border-radius:8px">x</div>')).toContain('radius');
    expect(run('<div style="border-radius:0">x</div>').ok).toBe(true);
  });

  it('flags shadow blur, allows a hard offset', () => {
    expect(rules('<div style="box-shadow:2px 2px 4px #000000">x</div>')).toContain('shadow-blur');
    expect(run('<div style="box-shadow:2px 2px 0 #000000">x</div>').ok).toBe(true);
  });
});

describe('auditHtml, motion & fonts', () => {
  it('flags ease in a transition shorthand', () => {
    expect(rules('<p style="transition:all .3s ease-in-out">x</p>')).toContain('easing');
  });

  it('flags a cubic-bezier timing function', () => {
    expect(rules('<p style="animation-timing-function:cubic-bezier(.1,.7,1,.1)">x</p>')).toContain('easing');
  });

  it('flags an unsanctioned first font family, allows a legal stack', () => {
    expect(rules('<p style="font-family:Helvetica Neue, sans-serif">x</p>')).toContain('font');
    expect(run('<p style="font-family:Verdana, Geneva, sans-serif">x</p>').ok).toBe(true);
  });
});

describe('auditHtml, links and <style> blocks', () => {
  it('flags an inline text-decoration:none on a link', () => {
    expect(rules('<a href="#" style="text-decoration:none">x</a>')).toContain('link-underline');
  });

  it('reads <style> blocks and keeps the selector', () => {
    const { violations } = run('<style>.box { color: #FA8072; border-radius: 4px }</style>');
    expect(violations.map((v) => v.rule).sort()).toEqual(['palette', 'radius']);
    expect(violations[0].selector).toBe('.box');
  });

  it('ignores commented-out CSS in a style block', () => {
    expect(run('<style>/* .box { color:#FA8072 } */ .ok { color:#FF0000 }</style>').ok).toBe(true);
  });
});
