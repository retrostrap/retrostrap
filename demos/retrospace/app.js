// app.js, the Retrospace discovery UI (docs/12). It dogfoods the service's own
// search and message catalogs, loads the founding members from data.json, and
// renders the directory in German or English. Calm on purpose: no feed, no
// metrics, no surprises.
import { messages } from '../../services/retrospace/src/i18n.js';
import { searchSites } from '../../services/retrospace/src/search.js';
import { rankSites } from '../../services/retrospace/src/toplist.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

let DATA = null;
let lang = localStorage.getItem('retrospace:lang') || (navigator.language || 'en').slice(0, 2);
if (!['en', 'de'].includes(lang)) lang = 'en';
const filter = { category: '', language: '', q: '' };

const T = (key, vars) => {
  const m = messages(lang);
  let s = m[key] != null ? m[key] : key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  return s;
};
const catLabel = (id) => { const c = DATA.categories.find((x) => x.id === id); return c ? c[lang] : id; };
const langLabel = (code) => { const l = DATA.languages.find((x) => x.code === code); return l ? l[lang] : code; };
const listed = () => DATA.sites.filter((s) => s.status === 'listed');
const safeHref = (u) => (/^https?:\/\//i.test(u || '') ? u : '#'); // only http(s) reaches an href
const focusPressed = (sel) => { const b = document.querySelector(`${sel} [aria-pressed="true"]`); if (b) b.focus(); };

// The write API's base, read from <body data-rsx-api>. Clear that attribute to run the
// page as a pure static demo (no beacons; the submit form previews only). Counting is
// best-effort, the link navigates regardless. /hit is the out endpoint (no dir needed).
const API = document.body.dataset.rsxApi || '';
function beaconOut(id) {
  if (!API || !id || !navigator.sendBeacon) return;
  try { navigator.sendBeacon(`${API}/hit?id=${encodeURIComponent(id)}`); } catch { /* best-effort */ }
}
// an outbound link to a member site that counts the click-through (out)
function siteLink(site) {
  const a = document.createElement('a');
  a.href = safeHref(site.url); a.rel = 'nofollow noopener'; a.lang = (site.languages && site.languages[0]) || '';
  a.textContent = site.title;
  if (a.href !== '#') a.addEventListener('click', () => beaconOut(site.id));
  return a;
}
// live counts (hits.json, refreshed by the schedule) win over the baked-in values
function mergeHits(hits) {
  if (!hits) return;
  for (const s of DATA.sites) {
    const h = hits[s.id];
    if (h) { s.inHits = h.inHits ?? s.inHits ?? 0; s.outHits = h.outHits ?? s.outHits ?? 0; }
  }
}

const elBtn = (text, pressed, onClick) => {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'rx-chip'; b.textContent = text;
  b.setAttribute('aria-pressed', String(!!pressed));
  b.addEventListener('click', onClick);
  return b;
};

function setLang(l) {
  lang = l; localStorage.setItem('retrospace:lang', l);
  document.documentElement.lang = l;
  render();
  focusPressed('#langtoggle'); // keep focus on the toggle the user just pressed
}

function results() {
  return searchSites(DATA.sites, filter.q, {
    category: filter.category || undefined,
    language: filter.language || undefined,
  });
}

function card(site) {
  const li = document.createElement('li');
  li.className = 'rx-card';
  const h = document.createElement('h3');
  h.className = 'rx-card__title';
  const a = siteLink(site); // marks its own language (WCAG 3.1.2) and counts the out click
  h.appendChild(a);
  const blurb = document.createElement('p');
  blurb.className = 'rx-card__blurb'; blurb.textContent = site.blurb; blurb.lang = site.languages[0] || '';
  const meta = document.createElement('p');
  meta.className = 'rx-card__meta';
  for (const c of site.categories) meta.appendChild(Object.assign(document.createElement('span'), { className: 'rx-tag', textContent: catLabel(c) }));
  const foot = document.createElement('p');
  foot.className = 'rx-card__foot';
  foot.appendChild(Object.assign(document.createElement('span'), { textContent: site.languages.map(langLabel).join(' · ') }));
  if (site.lastReviewedAt) foot.appendChild(Object.assign(document.createElement('span'), { textContent: `${T('card.reviewed')} ${site.lastReviewedAt}` }));
  li.append(h, blurb, meta, foot);
  return li;
}

// a filter change updates only the chips and the results (not the whole page), and
// returns focus to the chip just activated, a full render() would strand it on <body>
function applyChipFilter(kind, value, container) {
  filter[kind] = value;
  renderChips();
  renderResults();
  focusPressed(container);
}
function renderChips() {
  const cats = $('#cat-chips'); cats.innerHTML = '';
  cats.appendChild(elBtn(T('filter.all'), !filter.category, () => applyChipFilter('category', '', '#cat-chips')));
  for (const c of DATA.categories) cats.appendChild(elBtn(c[lang], filter.category === c.id, () => applyChipFilter('category', c.id, '#cat-chips')));

  const langs = $('#lang-chips'); langs.innerHTML = '';
  langs.appendChild(elBtn(T('filter.all'), !filter.language, () => applyChipFilter('language', '', '#lang-chips')));
  // only offer languages that actually have listed sites
  const present = new Set(listed().flatMap((s) => s.languages));
  for (const l of DATA.languages.filter((x) => present.has(x.code))) {
    langs.appendChild(elBtn(l[lang], filter.language === l.code, () => applyChipFilter('language', l.code, '#lang-chips')));
  }
}

function renderResults() {
  const list = results();
  $('#results-h').textContent = list.length === 1 ? T('search.results.one') : T('search.results', { n: list.length });
  const ul = $('#results'); ul.innerHTML = '';
  if (!list.length) {
    ul.appendChild(Object.assign(document.createElement('li'), { className: 'rx-muted', textContent: T('search.none') }));
    return;
  }
  for (const s of list) ul.appendChild(card(s));
}

function renderSotd() {
  const pool = listed();
  const sec = $('#sotd');
  if (!pool.length) { sec.hidden = true; return; } // no listed sites → no feature, no crash
  sec.hidden = false;
  const now = new Date();
  const doy = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
  const site = pool[doy % pool.length];
  const body = $('#sotd-body'); body.innerHTML = '';
  const a = siteLink(site); a.className = 'rx-card__title';
  const p = Object.assign(document.createElement('p'), { textContent: site.blurb, lang: site.languages[0] || '' });
  body.append(a, p);
}

function renderToplist() {
  const sec = $('#toplist');
  const top = rankSites(listed(), { limit: 10 });
  if (!top.length) { sec.hidden = true; return; } // no listed sites → no toplist, no crash
  sec.hidden = false;
  $('#toplist-blurb').textContent = T('toplist.blurb');
  const ol = $('#toplist-body'); ol.innerHTML = '';
  for (const s of top) {
    const li = document.createElement('li');
    const a = siteLink(s); a.className = 'rx-card__title';
    const hits = Object.assign(document.createElement('span'), {
      className: 'rs-font-1', textContent: `, ${T('toplist.hits', { in: s.inHits, out: s.outHits })}`,
    });
    li.append(a, hits);
    ol.appendChild(li);
  }
}

function renderNav() {
  const nav = $('#nav'); nav.innerHTML = '';
  const links = [['nav.browse', '#main'], ['nav.categories', '#cat-h'], ['nav.languages', '#lang-h'], ['nav.submit', '#submit-h'], ['nav.charter', '#charter-h']];
  for (const [key, href] of links) {
    const a = document.createElement('a');
    a.className = 'rs-navbar__link'; a.href = href; a.textContent = T(key);
    nav.appendChild(a);
  }
}

function renderLangToggle() {
  const box = $('#langtoggle'); box.innerHTML = '';
  for (const l of ['en', 'de']) {
    box.appendChild(elBtn(messages(l)['lang.name'], lang === l, () => setLang(l)));
  }
}

function renderSubmit() {
  const form = $('#submitform'); form.innerHTML = '';
  const field = (id, labelKey, control) => {
    const wrap = document.createElement('div'); wrap.className = 'rx-field';
    const label = document.createElement('label'); label.htmlFor = id; label.textContent = T(labelKey);
    control.id = id; control.classList.add(control.tagName === 'SELECT' ? 'rs-select' : 'rs-input');
    wrap.append(label, control); return wrap;
  };
  const url = document.createElement('input'); url.type = 'url'; url.required = true;
  const title = document.createElement('input'); title.type = 'text'; title.required = true; title.maxLength = 80;
  const blurb = document.createElement('input'); blurb.type = 'text'; blurb.maxLength = 90;
  const cat = document.createElement('select');
  for (const c of DATA.categories) cat.appendChild(Object.assign(document.createElement('option'), { value: c.id, textContent: c[lang] }));
  // "Language(s)" means it: a site may be bilingual (docs/12), so this one multi-selects
  const lg = document.createElement('select');
  lg.multiple = true; lg.size = DATA.languages.length; lg.required = true;
  for (const l of DATA.languages) lg.appendChild(Object.assign(document.createElement('option'), { value: l.code, textContent: l[lang] }));
  // honeypot: real people leave it empty, bots fill it; the handler drops filled ones
  const honeypot = document.createElement('input');
  honeypot.type = 'text'; honeypot.name = 'website'; honeypot.tabIndex = -1;
  honeypot.autocomplete = 'off'; honeypot.setAttribute('aria-hidden', 'true');
  honeypot.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px';
  const send = document.createElement('button');
  send.type = 'submit'; send.className = 'rs-btn rs-btn--primary'; send.textContent = T('submit.send');

  form.append(
    field('sub-url', 'submit.url', url),
    field('sub-title', 'submit.title', title),
    field('sub-blurb', 'submit.blurb', blurb),
    field('sub-cat', 'submit.category', cat),
    field('sub-lang', 'submit.language', lg),
    honeypot,
    send,
  );
  form.onsubmit = async (e) => {
    e.preventDefault();
    const ok = $('#submit-ok');
    if (!API) { ok.textContent = T('submit.demo'); ok.hidden = false; return; } // static preview, nothing to POST to
    const payload = {
      url: url.value, title: title.value, blurb: blurb.value,
      categories: [cat.value], languages: [...lg.selectedOptions].map((o) => o.value), website: honeypot.value,
    };
    send.disabled = true;
    try {
      const r = await fetch(`${API}/submit`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload),
      });
      if (r.ok) {
        ok.textContent = T('submit.ok'); form.reset();
      } else {
        // surface the server's specific reason (e.g. "a title is required") over the generic retry copy
        const body = await r.json().catch(() => ({}));
        ok.textContent = body.error || T('submit.err');
      }
    } catch { ok.textContent = T('submit.err'); }
    ok.hidden = false; send.disabled = false;
  };
  $('#submit-note').textContent = T('submit.note');
}

function render() {
  document.documentElement.lang = lang;
  document.querySelector('.rs-skip').textContent = T('nav.skip');
  $('#foot').textContent = T('foot');
  $('#tagline').textContent = T('site.tagline');
  $('#q-label').textContent = T('search.label');
  $('#q').placeholder = T('search.placeholder');
  $('#q-btn').textContent = T('search.button');
  for (const n of $$('[data-i18n]')) n.textContent = T(n.getAttribute('data-i18n'));
  $('#charter-list').innerHTML = '';
  for (const k of ['charter.calm', 'charter.polite', 'charter.curated']) {
    $('#charter-list').appendChild(Object.assign(document.createElement('li'), { textContent: T(k) }));
  }
  renderLangToggle();
  renderNav();
  renderChips();
  renderSotd();
  renderToplist();
  renderResults();
  renderSubmit();
}

async function boot() {
  try {
    const r = await fetch('data.json');
    if (!r.ok) throw new Error(`data.json ${r.status}`);
    DATA = await r.json();
  } catch (e) {
    console.info('retrospace: could not load data.json, run `npm run dev` and open over the server.');
    const p = document.createElement('p'); p.className = 'rx-muted'; p.textContent = T('load.fail');
    document.querySelector('#main').replaceChildren(p);
    return;
  }
  // best-effort: fold in live toplist counts if the schedule has published them
  try {
    const hr = await fetch('hits.json', { cache: 'no-store' });
    if (hr.ok) mergeHits((await hr.json()).hits);
  } catch { /* no live counts yet; the baked-in values stand */ }
  $('#searchform').addEventListener('submit', (e) => { e.preventDefault(); filter.q = $('#q').value; renderResults(); });
  $('#q').addEventListener('input', (e) => { filter.q = e.target.value; renderResults(); });
  render();
}

boot();
