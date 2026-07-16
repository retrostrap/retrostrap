// The retrospace-check advises admission (docs/12). It must never wave through a
// site that breaks the decency rule, and never auto-admit anything.
import { describe, it, expect } from 'vitest';
import { checkSite } from '../src/verify.js';

const retrostrapPage = `<!DOCTYPE html><html><head>
<link rel="stylesheet" href="retrostrap.min.css"></head>
<body class="rs-tile-stars"><div class="rs-page rs-container">
<h1 class="rs-font-6">Sandra's Space Corner</h1>
<p>Welcome to my homepage. It has been here since 1999 and it will outlive us all.
Here is a paragraph long enough to look like real content, because a page with real
content in the markup works without JavaScript, which is the whole point.</p>
</div></body></html>`;

describe('retrospace-check', () => {
  it('passes a clean retrostrap page with strong evidence', () => {
    const r = checkSite(retrostrapPage, { url: 'https://sandra.example' });
    expect(r.checks.retrostrap.ok).toBe(true);
    expect(r.checks.decency.ok).toBe(true);
    expect(r.verdict).toBe('pass');
    expect(r.score).toBeGreaterThanOrEqual(80);
  });

  it('hard-fails on autoplay media, whatever else is true', () => {
    const r = checkSite(retrostrapPage.replace('<body', '<body><audio autoplay src="x">') );
    expect(r.checks.decency.ok).toBe(false);
    expect(r.verdict).toBe('fail');
  });

  it('hard-fails on a known tracker', () => {
    const r = checkSite(retrostrapPage + '<script src="https://www.google-analytics.com/analytics.js"></script>');
    expect(r.checks.decency.ok).toBe(false);
    expect(r.verdict).toBe('fail');
  });

  it('flags a blank JS mount as not working without JS', () => {
    const r = checkSite('<!DOCTYPE html><html><body><div id="root"></div><script src="app.js"></script></body></html>');
    expect(r.checks.noJs.ok).toBe(false);
    expect(r.verdict).toBe('fail');
  });

  it('marks a modern page (rounded corners, off-palette) era-implausible', () => {
    const r = checkSite('<html><body style="border-radius: 12px"><p style="color:#4a90e2">' + 'x'.repeat(300) + '</p></body></html>');
    expect(r.checks.era.ok).toBe(false);
    expect(r.checks.palette.ok).toBe(false);
    expect(r.verdict).not.toBe('pass');
  });

  it('a retrostrap class cannot carry a blank JS mount to a pass', () => {
    const r = checkSite('<div class="rs-app" id="root"></div><script src="app.js"></script>');
    expect(r.checks.retrostrap.ok).toBe(true);
    expect(r.checks.noJs.ok).toBe(false);
    expect(r.verdict).not.toBe('pass');
  });

  it('gives no free palette pass to rgb()/hsl() or alpha hex', () => {
    const body = 'x'.repeat(220);
    expect(checkSite(`<div class="rs-x" style="color:rgb(255,0,153)">${body}</div>`).checks.palette.ok).toBe(false);
    expect(checkSite(`<div class="rs-x" style="color:#ff009980">${body}</div>`).checks.palette.ok).toBe(false);
  });

  it('catches rounded corners and blurred shadows in their common forms', () => {
    const b = 'x'.repeat(220);
    expect(checkSite(`<div style="border-radius:0.5em">${b}</div>`).checks.era.ok).toBe(false);
    expect(checkSite(`<div style="box-shadow:0 0 8px #000">${b}</div>`).checks.era.ok).toBe(false);
    expect(checkSite(`<div style="box-shadow:2px 2px 0 #000000">${b}</div>`).checks.era.ok).toBe(true); // hard shadow, 0 blur
  });

  it('sends an era-authentic non-retrostrap page to a human (review)', () => {
    const page = `<html><body bgcolor="#000080"><font color="#FFFF00"><h1>My Page</h1>
    <p>${'a real sentence of content. '.repeat(20)}</p></font></body></html>`;
    const r = checkSite(page);
    expect(r.checks.retrostrap.ok).toBe(false);
    expect(r.checks.decency.ok).toBe(true);
    expect(r.verdict).toBe('review');
  });

  it('flags autoplay even behind a long attribute (no 300-char escape window)', () => {
    const html = `<audio data-x="${'y'.repeat(500)}" autoplay src="z"></audio>`;
    expect(checkSite(html).checks.decency.ok).toBe(false);
  });
});
