// audit.js - the laws, checked against a live page (docs/06). Walks computed
// styles and reports every place the paint slips out of 1999. This is how a
// page author, or a machine, verifies era-fidelity: console table in dev, a
// JSON report for CI.
import { LEGAL_RGB } from './palette.js';

const SANCTIONED_FONTS = new Set([
  'times new roman', 'times', 'verdana', 'tahoma', 'arial', 'comic sans ms',
  'courier new', 'courier', 'impact', 'georgia', 'trebuchet ms',
  // documented fallbacks inside the nine stacks
  'geneva', 'helvetica', 'segoe ui', 'arial black', 'dejavu sans',
  'comic neue', 'chalkboard se', 'haettenschweiler', 'monospace', 'serif',
  'sans-serif', 'cursive',
]);

// chrome and graphical links are intentionally not underlined; only content
// links must be. rs-banner/rs-award/rs-button88 are image links, not prose.
const CHROME = '.rs-navbar,.rs-menu,.rs-tabs,.rs-breadcrumbs,.rs-pagination,' +
  '.rs-webring-bar,.rs-footer__badges,.rs-button88,.rs-banner,.rs-award,' +
  '.rs-btn,.rs-skip,.rs-top';

const parseRgb = (v) => {
  const m = v.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const p = m[1].split(',').map((x) => parseFloat(x.trim()));
  return { r: p[0], g: p[1], b: p[2], a: p[3] ?? 1 };
};

const legal = (c) => LEGAL_RGB.has(`${c.r},${c.g},${c.b}`);

function describe(el) {
  const cls = [...el.classList].find((c) => c.startsWith('rs-'));
  return el.tagName.toLowerCase() + (el.id ? `#${el.id}` : cls ? `.${cls}` : '');
}

export function audit({ root = document, budgets = false, paint = false } = {}) {
  const violations = [];
  const marks = []; // elements to outline when paint mode is on
  const add = (rule, el, value, hint) => {
    violations.push({ rule, selector: describe(el), value, hint });
    if (paint) marks.push({ el, rule });
  };

  const scope = root.querySelectorAll ? root : document;
  const rsEls = scope.querySelectorAll('[class*="rs-"]');

  // Assets inside a stylesheet resolve against that stylesheet's host, so an
  // origin that already serves this page's CSS is no surprise (the CDN quickstart).
  const trustedOrigins = new Set([location.origin]);
  for (const sheet of document.styleSheets) {
    if (sheet.href) { try { trustedOrigins.add(new URL(sheet.href).origin); } catch { /* opaque origin */ } }
  }

  for (const el of rsEls) {
    const cs = getComputedStyle(el);

    // Shape Law: radius 0, shadow blur 0
    for (const corner of ['borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomLeftRadius', 'borderBottomRightRadius']) {
      if (cs[corner] !== '0px') { add('radius', el, cs[corner], 'border-radius must be 0 (Shape Law)'); break; }
    }
    for (const prop of ['boxShadow', 'textShadow']) {
      const blur = shadowBlur(cs[prop]);
      if (blur > 0) add('shadow-blur', el, cs[prop], `${prop} blur must be 0; use a hard offset or a bevel`);
    }

    // Palette Law: opaque UI colors on the cube, no partial alpha
    for (const prop of ['color', 'backgroundColor', 'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor', 'outlineColor']) {
      const c = parseRgb(cs[prop]);
      if (!c) continue;
      if (c.a === 0) continue;               // fully transparent is absence, not a color
      if (c.a < 1) add('translucent-ui', el, cs[prop], 'UI colors are opaque (alpha 1)');
      else if (!legal(c)) add('palette', el, cs[prop], nearestHint(c));
    }

    // Decency: a background-image url() to another host is a surprise network
    // request the solid-color checks never see. (Gradient colors are left to
    // decorative fx like the CRT overlay, which are legitimately translucent.)
    const bg = cs.backgroundImage;
    if (bg && bg !== 'none') {
      for (const m of bg.matchAll(/url\((["']?)([^"')]+)\1\)/g)) {
        const u = m[2];
        if (/^[a-z][a-z0-9+.-]*:\/\//i.test(u)) {
          let uo = '';
          try { uo = new URL(u).origin; } catch { /* not fetchable, not a request */ }
          if (!trustedOrigins.has(uo)) {
            add('network', el, u, 'no external requests: background-image url() must come from your page or its stylesheets (Decency Law)');
          }
        }
      }
    }

    // Motion Law: linear / steps easing only, but a timing function only
    // matters when something actually animates. Every element computes
    // transition-timing-function to `ease` by default; that's not a violation
    // unless a transition is really running.
    const badEase = (f) =>
      f && f !== 'linear' && !f.startsWith('steps') && f !== 'step-start' && f !== 'step-end';
    if (!/^0s(,\s*0s)*$/.test(cs.transitionDuration)) {
      for (const fn of cs.transitionTimingFunction.split(',')) {
        if (badEase(fn.trim())) add('easing', el, fn.trim(), 'transition easing must be linear or steps() (Motion Law)');
      }
    }
    if (cs.animationName !== 'none') {
      for (const fn of cs.animationTimingFunction.split(',')) {
        if (badEase(fn.trim())) add('easing', el, fn.trim(), 'animation easing must be linear or steps() (Motion Law)');
      }
    }

    // Font Law: first family sanctioned
    const first = cs.fontFamily.split(',')[0].trim().replace(/^["']|["']$/g, '').toLowerCase();
    if (first && !SANCTIONED_FONTS.has(first)) add('font', el, cs.fontFamily, 'use one of the nine era font stacks (Font Law)');
  }

  // content links must be underlined (era-true and the a11y answer to color-only)
  for (const a of scope.querySelectorAll('a')) {
    if (a.closest(CHROME)) continue;
    if (!getComputedStyle(a).textDecorationLine.includes('underline')) {
      add('link-underline', a, 'none', 'content links are always underlined');
    }
  }

  const report = { ok: violations.length === 0, violations, stats: { checked: rsEls.length, violations: violations.length } };
  if (budgets) report.stats.note = 'size budgets are checked by the build, not the browser';
  if (paint) report.clear = paintMarks(marks);
  logReport(report);
  return report;
}

// paint mode: outline each offender in red and name the broken law on hover.
// Returns a clear() that puts every element back exactly as it was.
function paintMarks(marks) {
  const undo = [];
  for (const { el, rule } of marks) {
    const po = el.style.outline;
    const poo = el.style.outlineOffset;
    const pt = el.getAttribute('title');
    el.style.outline = '2px solid #FF0000';
    el.style.outlineOffset = '1px';
    el.setAttribute('title', `audit: ${rule}${pt ? ` | ${pt}` : ''}`);
    undo.push(() => {
      el.style.outline = po;
      el.style.outlineOffset = poo;
      if (pt === null) el.removeAttribute('title'); else el.setAttribute('title', pt);
    });
  }
  if (typeof console !== 'undefined' && marks.length) {
    // eslint-disable-next-line no-console
    console.warn(`[retrostrap] painted ${marks.length} spot(s) in red, call the report's clear() to wipe them off.`);
  }
  return () => undo.forEach((fn) => fn());
}

function shadowBlur(value) {
  if (!value || value === 'none') return 0;
  let max = 0;
  // each shadow: optional color, then lengths; the third length is blur
  for (const part of value.split(/,(?![^(]*\))/)) {
    const lengths = part.match(/-?\d*\.?\d+px/g);
    if (lengths && lengths[2]) max = Math.max(max, parseFloat(lengths[2]));
  }
  return max;
}

function nearestHint(c) {
  const snap = (n) => [0, 51, 102, 153, 204, 255].reduce((a, b) => (Math.abs(b - n) < Math.abs(a - n) ? b : a));
  const hex = (n) => n.toString(16).padStart(2, '0').toUpperCase();
  return `off palette; nearest legal is #${hex(snap(c.r))}${hex(snap(c.g))}${hex(snap(c.b))}`;
}

function logReport(report) {
  if (typeof console === 'undefined') return;
  if (report.ok) {
    // eslint-disable-next-line no-console
    console.log(`%c[retrostrap] audit clean, ${report.stats.checked} elements, all lawful. The year holds at 1999.`, 'color:#008000');
  } else if (console.table) {
    // eslint-disable-next-line no-console
    console.warn(`[retrostrap] audit found ${report.violations.length} anachronism(s), these slipped out of 1999:`);
    // eslint-disable-next-line no-console
    console.table(report.violations);
  }
}
