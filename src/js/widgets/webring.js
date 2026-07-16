// webring.js - sites holding hands in a circle (docs/05). Fills an
// rs-webring-bar from a ring's JSON: prev, random, next, computed from where
// this page sits in the ring. Works from an inline <script type="application/
// json"> so a ring can live on a static page with no service at all.
import { selfRegister, safeUrl } from './_overlay.js';

function readRing(el, options) {
  const inline = el.querySelector('script[type="application/json"]');
  if (inline) { try { return Promise.resolve(JSON.parse(inline.textContent)); } catch { /* fall through */ } }
  if (typeof options.src === 'string') {
    return fetch(options.src).then((r) => r.json()).catch(() => null);
  }
  return Promise.resolve(null);
}

function factory(el, options, ctx) {
  let destroyed = false;
  const link = (label, href) => {
    if (!href) {
      // no destination: a placeholder span, never a live link to "./undefined"
      const span = document.createElement('span');
      span.textContent = label;
      span.setAttribute('aria-disabled', 'true');
      return span;
    }
    const a = document.createElement('a');
    a.textContent = label;
    a.href = safeUrl(href);
    return a;
  };

  readRing(el, options).then((ring) => {
    if (destroyed) return; // torn down before the ring (inline or fetched) resolved
    if (!ring || !Array.isArray(ring.sites) || !ring.sites.length) {
      ctx.log('webring: no ring data');
      return;
    }
    // the bar is site navigation; say so when the host isn't already a <nav>
    if (el.tagName !== 'NAV' && !el.getAttribute('role')) {
      el.setAttribute('role', 'navigation');
      if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', ring.name || 'Webring');
    }
    // find this page in the ring: a member's url may be a full address (a real
    // deployed ring) or a site-root path (a local or relative ring), so match either
    const herePath = location.pathname.replace(/\/$/, '');
    const hereFull = (location.origin + location.pathname).replace(/\/$/, '');
    let i = ring.sites.findIndex((s) => {
      const u = (s.url || '').replace(/\/$/, '');
      return u === hereFull || u === herePath;
    });
    const inRing = i >= 0;
    if (!inRing) i = 0;

    const n = ring.sites.length;
    const prev = ring.sites[(i - 1 + n) % n];
    const next = ring.sites[(i + 1) % n];
    // deterministic "random": step a fixed distance so it needs no Math.random
    const rand = ring.sites[(i + Math.max(1, Math.floor(n / 2))) % n];

    el.textContent = '';
    if (ring.name) {
      const name = document.createElement('span');
      name.className = 'rs-webring-bar__name';
      name.textContent = ring.name;
      el.appendChild(name);
    }
    el.append(
      link('« prev', prev.url), document.createTextNode(' · '),
      link('random', rand.url), document.createTextNode(' · '),
      link('ring home', ring.home), document.createTextNode(' · '),
      link('next »', next.url)
    );
    if (!inRing) {
      const note = document.createElement('span');
      note.className = 'rs-webring-bar__name';
      note.textContent = '(this page is not in the ring yet)';
      el.appendChild(note);
    }
  });

  return { destroy() { destroyed = true; el.textContent = ''; } };
}

export default selfRegister({ id: 'webring', motion: 'informative', pointer: 'any', factory });
