// builder.js, the parent app. Loads the catalog, builds the palette, holds the
// project model, and drives the iframe canvas. Zero dependencies; the drag is
// pointer-based so it works across the iframe boundary and degrades to a click.

const $ = (id) => document.getElementById(id);
const iframe = $('bx-canvas');

// structural wrappers and pure utilities aren't content blocks
const EXCLUDE = new Set(['page', 'container', 'layout', 'cols', 'frames', 'skip', 'top', 'spacer', 'font-scale', 'center']);
// decorative widgets that need no markup of their own, good page-wide toggles
const TOYBOX = ['kugeln', 'snowfall', 'sparkle', 'starfield', 'cursor-trail', 'crt', 'dvd', 'neko', 'smilies', 'konami'];
const TILES = ['stars', 'hearts', 'checker', 'grid', 'blueprint', 'scanlines', 'dither', 'dots', 'candy', 'hazard', 'brick', 'zigzag', 'confetti', 'clouds', 'paws'];

// the catalog has no bare heading/paragraph, so the builder ships its own text primitives
const STARTERS = [
  { id: 'text-heading', label: 'Heading', starter: true, html: '<h2 class="rs-font-5">New heading</h2>' },
  { id: 'text-subheading', label: 'Subheading', starter: true, html: '<h3 class="rs-font-3">Subheading</h3>' },
  { id: 'text-para', label: 'Paragraph', starter: true, html: '<p>New paragraph, click to edit.</p>' },
  { id: 'text-link', label: 'Link', starter: true, html: '<p><a href="#">a hyperlink</a></p>' },
];

const CURRENT = 'rs-builder:current';
const PROJECTS = 'rs-builder:projects';

let manifest = null;
let canvas = null;
let project = null;
let history = [];
let future = [];
let selectedId = null;
let previewing = false;
let lastEditId = null;
let uidN = 0;

const cloneOf = (o) => JSON.parse(JSON.stringify(o));
const uid = () => 'b' + Date.now().toString(36) + (uidN++);
const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const compById = (id) => manifest.components.find((c) => c.id === id);

// The builder exports HTML people may publish, and imports HTML that is
// untrusted. Strip anything that could execute: script/style/frame/etc tags,
// on* handlers, and javascript: URLs. Forms and content stay.
const BAD_TAGS = 'script,style,iframe,object,embed,link,meta,base,svg,math,template,noscript';
const URL_ATTRS = new Set(['href', 'src', 'xlink:href', 'action', 'poster', 'background']);
const safeAttrUrl = (u) => {
  try { const p = new URL(u, 'https://x/').protocol; return (p === 'http:' || p === 'https:' || p === 'mailto:') ? u : '#'; }
  catch { return '#'; }
};
// widget endpoints (data-rs-*-src) must stay on the page's own origin, or an
// imported page could beacon a visitor off to a stranger's server on load
const sameOriginAttr = (u) => {
  const s = String(u).trim().replace(/\\/g, '/');
  return (/^[a-z][a-z0-9+.-]*:/i.test(s) || s.startsWith('//')) ? '' : u;
};
function sanitizeEl(el) {
  if (!el || !el.querySelectorAll) return el;
  el.querySelectorAll(BAD_TAGS).forEach((n) => n.remove());
  const nodes = el.matches(BAD_TAGS) ? [] : [el, ...el.querySelectorAll('*')];
  for (const n of nodes) {
    for (const a of [...n.attributes]) {
      const name = a.name.toLowerCase();
      if (name.startsWith('on') || name === 'srcdoc' || name === 'formaction' || name === 'ping') n.removeAttribute(a.name);
      else if (URL_ATTRS.has(name)) n.setAttribute(a.name, safeAttrUrl(a.value));
      else if (name.startsWith('data-rs-') && name.endsWith('-src')) n.setAttribute(a.name, sameOriginAttr(a.value));
    }
  }
  return el;
}

const emptyProject = () => ({ version: 1, name: 'untitled', theme: '', tile: '', widgets: {}, blocks: [] });

function rootEl(html) {
  const t = document.createElement('template');
  t.innerHTML = (html || '').trim();
  return t.content.firstElementChild;
}
function snippetTemplate(snippet) {
  const t = document.createElement('template');
  t.innerHTML = (snippet || '').trim();
  const kids = [...t.content.children];
  if (!kids.length) return `<p>${escapeHtml(snippet || 'text')}</p>`;
  if (kids.length === 1) return kids[0].outerHTML;
  // multi-root snippets (a label + its control, a set of examples) ride in one
  // plain wrapper, so a block stays a single element for the tooling
  const wrap = document.createElement('div');
  wrap.append(...kids);
  return wrap.outerHTML;
}

// ---- widgets: model + catalog-driven attributes ----------------------------
// a widget entry is { on, opts }; old projects stored a bare boolean, so migrate.
function normalizeWidgets(p) {
  const out = {};
  for (const [k, v] of Object.entries(p.widgets || {})) {
    if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue; // no pollution from stored JSON
    out[k] = v && typeof v === 'object' ? { on: !!v.on, opts: v.opts || {} } : { on: !!v, opts: {} };
  }
  p.widgets = out;
  return p;
}
const widgetsOn = (w) => Object.keys(w || {}).filter((k) => w[k] && w[k].on);
function optionDefaults(id) {
  const w = manifest.widgets.find((x) => x.id === id);
  const d = {};
  if (w && w.options) for (const o of w.options) if (o.default != null) d[o.name] = o.default;
  return d;
}
// the data-rs-* attributes a set of widgets becomes, emitting only non-default options
function widgetAttrs(widgets) {
  const on = widgetsOn(widgets);
  const attrs = {};
  if (on.length) attrs['data-rs-widgets'] = on.join(' ');
  for (const id of on) {
    const opts = (widgets[id] && widgets[id].opts) || {};
    const def = optionDefaults(id);
    for (const [k, v] of Object.entries(opts)) {
      if (v === '' || v == null || String(v) === String(def[k])) continue;
      // a widget endpoint (…-src/…-url) must stay same-origin, or an exported page
      // would fetch/beacon a visitor off to a stranger's server on load
      const val = /(?:src|url)$/i.test(k) ? sameOriginAttr(String(v)) : String(v);
      if (val === '') continue;
      attrs[`data-rs-${id}-${k}`] = val;
    }
  }
  return attrs;
}

// ---- persistence -----------------------------------------------------------
const autosave = () => { try { localStorage.setItem(CURRENT, JSON.stringify(project)); } catch (e) { /* private mode */ } };
const projectsMap = () => { try { return JSON.parse(localStorage.getItem(PROJECTS)) || {}; } catch (e) { return {}; } };
const saveProjectsMap = (m) => { try { localStorage.setItem(PROJECTS, JSON.stringify(m)); } catch (e) { /* ignore */ } };

// ---- undo/redo -------------------------------------------------------------
function mutate(fn) {
  if (previewing) setPreview(false);
  history.push(cloneOf(project));
  if (history.length > 60) history.shift();
  future = [];
  lastEditId = null;
  fn();
  autosave();
  render();
}
function undo() { if (previewing) setPreview(false); if (!history.length) return; future.push(cloneOf(project)); project = history.pop(); selectedId = null; lastEditId = null; autosave(); render(); }
function redo() { if (previewing) setPreview(false); if (!future.length) return; history.push(cloneOf(project)); project = future.pop(); selectedId = null; lastEditId = null; autosave(); render(); }

// ---- block operations ------------------------------------------------------
function addBlock(item, atIndex) {
  const html = item.starter ? item.html : snippetTemplate(item.snippet);
  const block = { id: uid(), type: item.id, html };
  mutate(() => {
    if (atIndex == null || atIndex >= project.blocks.length) project.blocks.push(block);
    else project.blocks.splice(Math.max(0, atIndex), 0, block);
    selectedId = block.id;
  });
}
function opBlock(id, op) {
  const i = project.blocks.findIndex((x) => x.id === id);
  if (i < 0) return;
  if (op === 'del') mutate(() => { project.blocks.splice(i, 1); selectedId = (project.blocks[i] || project.blocks[i - 1] || {}).id || null; });
  else if (op === 'dup') mutate(() => { const c = cloneOf(project.blocks[i]); c.id = uid(); project.blocks.splice(i + 1, 0, c); selectedId = c.id; });
  else if (op === 'up' && i > 0) mutate(() => { [project.blocks[i - 1], project.blocks[i]] = [project.blocks[i], project.blocks[i - 1]]; });
  else if (op === 'down' && i < project.blocks.length - 1) mutate(() => { [project.blocks[i + 1], project.blocks[i]] = [project.blocks[i], project.blocks[i + 1]]; });
  // keep keyboard focus on the block we just acted on instead of dropping it to <body>
  if (canvas && canvas.focusBlockOp) canvas.focusBlockOp(selectedId, op === 'del' ? null : op);
}
// inline text edits: update the model quietly, no canvas re-render (keep the caret)
function editBlock(id, html) {
  const b = project.blocks.find((x) => x.id === id);
  if (!b || b.html === html) return;
  if (lastEditId !== id) { history.push(cloneOf(project)); if (history.length > 60) history.shift(); future = []; lastEditId = id; }
  b.html = html;
  autosave();
  $('bx-undo').disabled = false;
  $('bx-redo').disabled = true;
}
function onSelect(id) { selectedId = id || null; lastEditId = null; canvas.select(selectedId); renderInspector(); }

// ---- rendering -------------------------------------------------------------
function render() {
  if (canvas) {
    canvas.setWidgets(previewing ? widgetAttrs(project.widgets) : {});
    canvas.render(project);
    if (selectedId) canvas.select(selectedId);
  }
  renderInspector();
  const active = document.activeElement;
  const undoBtn = $('bx-undo');
  const redoBtn = $('bx-redo');
  undoBtn.disabled = !history.length;
  redoBtn.disabled = !future.length;
  // a button that disables itself would strand focus on <body>; move it somewhere live
  if (active === undoBtn && undoBtn.disabled) (redoBtn.disabled ? $('bx-export') : redoBtn).focus();
  else if (active === redoBtn && redoBtn.disabled) (undoBtn.disabled ? $('bx-export') : undoBtn).focus();
  if ($('bx-name').value !== (project.name || '')) $('bx-name').value = project.name || 'untitled';
}

function renderInspector() {
  const box = $('bx-inspector');
  const block = selectedId && project.blocks.find((b) => b.id === selectedId);
  box.innerHTML = '';
  if (block) inspectBlock(box, block);
  else inspectPage(box);
}

function inspectBlock(box, block) {
  const comp = compById(block.type);
  const el = rootEl(block.html);
  const current = new Set(el ? [...el.classList] : []);
  const h = document.createElement('h2');
  h.textContent = comp ? comp.label : 'Block';
  box.appendChild(h);

  const hint = document.createElement('p');
  hint.className = 'bx-hint';
  hint.textContent = 'Click the text in the canvas to edit it. Reorder or remove with the buttons below.';
  box.appendChild(hint);

  // modifier chips from the catalog; the role text rides along as the tooltip
  const mods = comp && comp.classes ? comp.classes.filter((c) => c.name.includes('--')) : [];
  if (mods.length) {
    const f = field('Variants');
    const chips = document.createElement('div');
    chips.className = 'bx-chips';
    for (const m of mods) {
      const chip = document.createElement('button');
      chip.type = 'button'; chip.className = 'bx-chip';
      chip.textContent = m.name.split('--')[1] || m.name;
      chip.title = m.role || '';
      chip.setAttribute('aria-pressed', String(current.has(m.name)));
      chip.addEventListener('click', () => toggleClass(block.id, m.name));
      chips.appendChild(chip);
    }
    f.appendChild(chips);
    const note = document.createElement('p');
    note.className = 'bx-hint';
    note.textContent = 'Variants stack, but each family (small vs large, the color-ways) is pick-one; hover a chip for what it does or needs.';
    f.appendChild(note);
    box.appendChild(f);
  }

  // full class list, editable
  const cf = field('CSS classes');
  const input = document.createElement('input');
  input.type = 'text'; input.className = 'rs-input';
  input.value = el ? el.className : '';
  input.setAttribute('aria-label', 'CSS classes for this block');
  input.addEventListener('change', () => setClasses(block.id, input.value));
  cf.appendChild(input);
  box.appendChild(cf);

  // URL fields when the block carries a link or an image
  const link = firstMatch(el, 'a');
  if (link) box.appendChild(urlField('Link URL (href)', link.getAttribute('href') || '', (v) => setNodeAttr(block.id, 'a', 'href', v.trim())));
  const img = firstMatch(el, 'img');
  if (img) {
    box.appendChild(urlField('Image URL (src)', img.getAttribute('src') || '', (v) => setNodeAttr(block.id, 'img', 'src', v.trim())));
    box.appendChild(urlField('Alt text', img.getAttribute('alt') || '', (v) => setNodeAttr(block.id, 'img', 'alt', v)));
  }

  // block ops
  const ops = document.createElement('div');
  ops.className = 'bx-ops';
  for (const [op, label] of [['up', 'Move up'], ['down', 'Move down'], ['dup', 'Duplicate'], ['del', 'Delete']]) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'rs-btn rs-btn--small';
    b.textContent = label;
    b.addEventListener('click', () => opBlock(block.id, op));
    ops.appendChild(b);
  }
  box.appendChild(ops);
}

function inspectPage(box) {
  const h = document.createElement('h2');
  h.textContent = 'Page';
  box.appendChild(h);

  // theme
  const tf = field('Theme');
  const tsel = document.createElement('select');
  tsel.className = 'rs-select';
  tsel.setAttribute('aria-label', 'Theme');
  tsel.innerHTML = '<option value="">classic (default)</option>' +
    manifest.themes.map((t) => `<option value="${t.id}"${project.theme === t.id ? ' selected' : ''}>${escapeHtml(t.label || t.id)}</option>`).join('');
  tsel.addEventListener('change', () => mutate(() => { project.theme = tsel.value; }));
  tf.appendChild(tsel);
  box.appendChild(tf);

  // tile
  const wf = field('Wallpaper');
  const wsel = document.createElement('select');
  wsel.className = 'rs-select';
  wsel.setAttribute('aria-label', 'Wallpaper');
  wsel.innerHTML = '<option value="">none</option>' +
    TILES.map((t) => `<option value="${t}"${project.tile === t ? ' selected' : ''}>${t}</option>`).join('');
  wsel.addEventListener('change', () => mutate(() => { project.tile = wsel.value; }));
  wf.appendChild(wsel);
  box.appendChild(wf);

  // toybox: a checkbox each, and when on, its options straight from the catalog
  const bf = field('Toybox (shown in Preview and export)');
  const avail = TOYBOX.map((id) => manifest.widgets.find((w) => w.id === id)).filter(Boolean);
  for (const w of avail) {
    const entry = project.widgets[w.id] || { on: false, opts: {} };
    const row = document.createElement('label');
    row.className = 'bx-toggle';
    const cb = document.createElement('input');
    cb.type = 'checkbox'; cb.checked = !!entry.on;
    cb.addEventListener('change', () => mutate(() => {
      project.widgets = { ...project.widgets, [w.id]: { on: cb.checked, opts: entry.opts || {} } };
    }));
    row.appendChild(cb);
    row.appendChild(document.createTextNode(' ' + w.id));
    bf.appendChild(row);

    if (entry.on && Array.isArray(w.options)) {
      const opts = document.createElement('div');
      opts.className = 'bx-widget-opts';
      for (const opt of w.options) {
        const control = optionControl(w.id, opt, entry.opts || {});
        if (control) opts.appendChild(control);
      }
      if (opts.children.length) bf.appendChild(opts);
    }
  }
  // toys stay parked while you edit (they would fight the caret); say so
  // right where they were switched on instead of leaving a silent checkbox
  if (widgetsOn(project.widgets).length && !previewing) {
    const armed = document.createElement('p');
    armed.className = 'bx-hint';
    armed.textContent = 'Armed, but parked while you edit. Press Preview (top right) to run them.';
    bf.appendChild(armed);
  }
  box.appendChild(bf);

  const hint = document.createElement('p');
  hint.className = 'bx-hint';
  hint.textContent = 'Select a block to edit it. Page setup (top right) or Escape brings these settings back.';
  box.appendChild(hint);
}

function field(label) {
  const f = document.createElement('div');
  f.className = 'bx-field';
  const l = document.createElement('label');
  l.textContent = label;
  f.appendChild(l);
  return f;
}

function urlField(label, value, onChange) {
  const f = field(label);
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'rs-input';
  input.value = value;
  input.setAttribute('aria-label', label);
  input.addEventListener('change', () => onChange(input.value));
  f.appendChild(input);
  return f;
}

// one control for one catalog option; json-array and datetime stay out (no sane control)
function optionControl(widgetId, opt, opts) {
  if (!['enum', 'int', 'px', 'number', 'bool', 'color', 'string', 'url', 'selector'].includes(opt.type)) return null;
  const cur = opts[opt.name];
  const setOpt = (val) => mutate(() => {
    const entry = project.widgets[widgetId] || { on: true, opts: {} };
    const nopts = { ...(entry.opts || {}) };
    if (val === '' || val == null) delete nopts[opt.name]; else nopts[opt.name] = val;
    project.widgets = { ...project.widgets, [widgetId]: { on: true, opts: nopts } };
  });
  const wrap = document.createElement('label');
  wrap.className = 'bx-opt';
  if (opt.type === 'bool') {
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = cur != null ? !!cur : !!opt.default;
    cb.addEventListener('change', () => setOpt(cb.checked));
    wrap.appendChild(cb);
    wrap.appendChild(document.createTextNode(' ' + opt.name));
    return wrap;
  }
  const span = document.createElement('span');
  span.textContent = opt.name;
  wrap.appendChild(span);
  let control;
  if (opt.type === 'enum' && Array.isArray(opt.values)) {
    control = document.createElement('select');
    control.className = 'rs-select';
    const val = String(cur != null ? cur : (opt.default ?? ''));
    control.innerHTML = opt.values.map((v) => `<option${v === val ? ' selected' : ''}>${escapeHtml(v)}</option>`).join('');
    control.addEventListener('change', () => setOpt(control.value));
  } else if (opt.type === 'int' || opt.type === 'px' || opt.type === 'number') {
    control = document.createElement('input');
    control.type = 'number';
    control.className = 'rs-input';
    control.value = cur != null ? cur : (opt.default ?? '');
    control.addEventListener('change', () => setOpt(control.value === '' ? '' : Number(control.value)));
  } else {
    control = document.createElement('input');
    control.type = 'text';
    control.className = 'rs-input';
    control.value = cur != null ? cur : (opt.default ?? '');
    control.addEventListener('change', () => setOpt(control.value.trim()));
  }
  control.setAttribute('aria-label', `${widgetId} ${opt.name}`);
  wrap.appendChild(control);
  return wrap;
}

function toggleClass(id, cls) {
  const b = project.blocks.find((x) => x.id === id);
  const el = rootEl(b.html);
  if (!el) return;
  el.classList.toggle(cls);
  mutate(() => { b.html = el.outerHTML; });
}
function setClasses(id, str) {
  const b = project.blocks.find((x) => x.id === id);
  const el = rootEl(b.html);
  if (!el) return;
  el.className = str.trim();
  mutate(() => { b.html = el.outerHTML; });
}
// set an attribute on the block's first matching node (used for link/image URLs)
function setNodeAttr(id, selector, attr, value) {
  const b = project.blocks.find((x) => x.id === id);
  const el = rootEl(b.html);
  if (!el) return;
  const target = el.matches(selector) ? el : el.querySelector(selector);
  if (!target) return;
  if (value || attr === 'alt') {
    target.setAttribute(attr, (attr === 'href' || attr === 'src') ? safeAttrUrl(value) : value); // alt="" is legitimate (decorative)
  } else target.removeAttribute(attr);
  mutate(() => { b.html = el.outerHTML; });
}
const firstMatch = (el, sel) => (el && (el.matches(sel) ? el : el.querySelector(sel))) || null;

// ---- palette + drag --------------------------------------------------------
function paletteButton(item) {
  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'bx-pal'; btn.dataset.id = item.id;
  btn.textContent = item.label || item.id;
  btn.title = item.summary || '';
  btn.addEventListener('click', () => { if (justDragged) { justDragged = false; return; } addBlock(item); });
  btn.addEventListener('pointerdown', (e) => startDrag(e, item));
  return btn;
}
function addGroup(list, title, items) {
  const g = document.createElement('div');
  g.className = 'bx-palette__group';
  const h = document.createElement('h2');
  h.textContent = title;
  g.appendChild(h);
  for (const it of items) g.appendChild(paletteButton(it));
  list.appendChild(g);
}
function buildPalette() {
  const list = $('bx-palette-list');
  list.innerHTML = '';
  addGroup(list, 'Basics', STARTERS);
  const comps = manifest.components.filter((c) => !EXCLUDE.has(c.id) && c.snippet)
    .sort((a, b) => (a.label || a.id).localeCompare(b.label || b.id));
  addGroup(list, 'Components', comps);
}

let drag = null;
let justDragged = false;
function startDrag(e, comp) {
  if (e.button !== 0) return;
  justDragged = false; // a fresh press clears any stale drag guard from last time
  drag = { comp, x: e.clientX, y: e.clientY, active: false, ghost: null, index: null };
  window.addEventListener('pointermove', onDragMove);
  window.addEventListener('pointerup', onDragUp, { once: true });
  window.addEventListener('pointercancel', onDragUp, { once: true }); // context menu / reclaimed gesture
}
function onDragMove(e) {
  if (!drag) return;
  if (!drag.active) {
    if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 6) return;
    drag.active = true;
    iframe.style.pointerEvents = 'none'; // so the parent keeps tracking the pointer over the canvas
    drag.ghost = document.createElement('div');
    drag.ghost.className = 'bx-ghost';
    drag.ghost.textContent = drag.comp.label || drag.comp.id;
    document.body.appendChild(drag.ghost);
  }
  drag.ghost.style.transform = `translate(${e.clientX + 10}px, ${e.clientY + 10}px)`;
  const r = iframe.getBoundingClientRect();
  const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
  if (inside && canvas.dropIndicator) drag.index = canvas.dropIndicator(e.clientX - r.left, e.clientY - r.top);
  else { drag.index = null; if (canvas.clearIndicator) canvas.clearIndicator(); }
}
function onDragUp() {
  window.removeEventListener('pointermove', onDragMove);
  window.removeEventListener('pointerup', onDragUp);
  window.removeEventListener('pointercancel', onDragUp);
  iframe.style.pointerEvents = '';
  if (!drag) return;
  if (drag.ghost) drag.ghost.remove();
  if (canvas.clearIndicator) canvas.clearIndicator();
  if (drag.active) { justDragged = true; if (drag.index != null) addBlock(drag.comp, drag.index); }
  drag = null;
}

// ---- export ----------------------------------------------------------------
function buildExport() {
  const body = canvas.serializeDoc();
  const indent = body.split('\n').map((l) => (l ? '    ' + l : l)).join('\n');
  const on = widgetsOn(project.widgets);
  const links = ['  <link rel="stylesheet" href="retrostrap.min.css">',
    project.theme ? `  <link rel="stylesheet" href="themes/${escapeHtml(project.theme)}.css">` : null,
    project.tile ? '  <link rel="stylesheet" href="retrostrap-patterns.css">' : null].filter(Boolean).join('\n');
  // the core script drives component enhancers (marquee, tabs, spoiler…), so it
  // always ships; the toybox bundle only when a widget is actually on
  const scripts = '\n  <script defer src="retrostrap.min.js"><\/script>'
    + (on.length ? '\n  <script defer src="retrostrap-toybox.min.js"><\/script>' : '');
  const themeAttr = project.theme ? ` data-rs-theme="${escapeHtml(project.theme)}"` : '';
  const bodyClass = project.tile ? ` class="rs-tile-${escapeHtml(project.tile)}"` : '';
  const wattr = Object.entries(widgetAttrs(project.widgets)).map(([k, v]) => ` ${k}="${escapeHtml(v)}"`).join('');
  return `<!DOCTYPE html>
<html lang="en"${themeAttr}>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(project.name || 'my page')}</title>
  <!-- retrostrap: host these files yourself, https://retrostrap.dev -->
${links}
</head>
<body${bodyClass}${wattr}>
  <div class="rs-page rs-container">
${indent}
  </div>${scripts}
</body>
</html>
`;
}

// ---- import ----------------------------------------------------------------
function guessType(el) {
  const classes = [...el.classList];
  for (const c of manifest.components) {
    const base = c.classes && c.classes[0] && c.classes[0].name;
    if (base && classes.includes(base)) return c.id;
  }
  return el.tagName.toLowerCase();
}
// parse a pasted retrostrap page back into a project (the inverse of export)
function importHtml(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const p = emptyProject();
  p.name = (doc.querySelector('title') && doc.querySelector('title').textContent.trim()) || 'imported';
  const theme = doc.documentElement.getAttribute('data-rs-theme') || '';
  p.theme = manifest.themes.some((t) => t.id === theme) ? theme : ''; // ignore unknown themes
  const body = doc.body;
  if (body) {
    const tile = ([...body.classList].find((c) => c.startsWith('rs-tile-')) || '').replace('rs-tile-', '');
    p.tile = TILES.includes(tile) ? tile : '';
    for (const id of (body.getAttribute('data-rs-widgets') || '').split(/\s+/).filter(Boolean)) {
      if (!manifest.widgets.some((w) => w.id === id)) continue; // only real widgets
      const opts = {};
      const prefix = `data-rs-${id}-`;
      for (const a of [...body.attributes]) if (a.name.startsWith(prefix)) opts[a.name.slice(prefix.length)] = a.value;
      p.widgets[id] = { on: true, opts };
    }
  }
  const root = doc.querySelector('.rs-page') || body;
  if (root) {
    for (const el of [...root.children]) {
      if (el.matches(BAD_TAGS)) continue;      // no script/style/frame as a block
      sanitizeEl(el);                          // strip nested handlers/scripts/js: urls
      p.blocks.push({ id: uid(), type: guessType(el), html: el.outerHTML });
    }
  }
  return normalizeWidgets(p);
}

// ---- toolbar wiring --------------------------------------------------------
function buildProjectsSelect() {
  const sel = $('bx-projects');
  const m = projectsMap();
  sel.innerHTML = '<option value="">~ saved ~</option>' + Object.keys(m).sort().map((n) => `<option>${escapeHtml(n)}</option>`).join('');
}

// the one drawer serves export (read-only output) and import (editable input)
function openDrawer(mode) {
  drawerTrigger = document.activeElement; // remember the opener for focus return
  const out = $('bx-export-out');
  const isExport = mode === 'export';
  out.readOnly = isExport;
  out.value = isExport ? buildExport() : '';
  out.placeholder = isExport ? '' : 'Paste a retrostrap page (or a previous export) here, then press Load.';
  $('bx-copy').hidden = !isExport;
  $('bx-download').hidden = !isExport;
  $('bx-import-load').hidden = isExport;
  $('bx-drawer-title').textContent = isExport ? 'Export' : 'Import';
  $('bx-drawer-hint').textContent = isExport
    ? 'Paste this into an .html file, it passes the audit.'
    : 'Paste a retrostrap page or a previous export, then press Load.';
  $('bx-drawer').hidden = false;
  out.focus();
}

function setPreview(on) {
  previewing = on;
  $('bx-preview').setAttribute('aria-pressed', String(on));
  document.querySelector('.bx-palette').inert = on; // editing pauses in preview; no alpha on the panel (Palette Law)
  canvas.setWidgets(on ? widgetAttrs(project.widgets) : {});
  canvas.setMode(on ? 'preview' : 'edit');
  renderInspector(); // the toybox hint below reads the mode
}

let drawerTrigger = null;
function closeDrawer() {
  $('bx-drawer').hidden = true;
  if (drawerTrigger && drawerTrigger.focus) drawerTrigger.focus(); // hand focus back to the opener
}

function wireToolbar() {
  $('bx-name').addEventListener('change', () => { project.name = $('bx-name').value.trim() || 'untitled'; autosave(); });
  $('bx-new').addEventListener('click', () => {
    if (project.blocks.length && !confirm('Start a new page? Any unsaved changes are lost, undo can\'t bring them back.')) return;
    if (previewing) setPreview(false); project = emptyProject(); selectedId = null; history = []; future = []; autosave(); render();
  });
  $('bx-save').addEventListener('click', () => {
    const name = ($('bx-name').value.trim() || 'untitled');
    project.name = name;
    const m = projectsMap(); m[name] = cloneOf(project); saveProjectsMap(m);
    buildProjectsSelect(); $('bx-projects').value = name;
  });
  $('bx-load').addEventListener('click', () => {
    const name = $('bx-projects').value; if (!name) return;
    const m = projectsMap(); if (!m[name]) return;
    if (previewing) setPreview(false);
    project = normalizeWidgets(cloneOf(m[name]));
    if (!Array.isArray(project.blocks)) project.blocks = []; // tolerate a tampered save
    project.name = name; selectedId = null; history = []; future = []; autosave(); render();
  });
  $('bx-del').addEventListener('click', () => {
    const name = $('bx-projects').value; if (!name) return;
    if (!confirm('Delete the saved project "' + name + '"? There is no undo.')) return;
    const m = projectsMap(); delete m[name]; saveProjectsMap(m); buildProjectsSelect();
  });
  $('bx-undo').addEventListener('click', undo);
  $('bx-redo').addEventListener('click', redo);
  for (const b of document.querySelectorAll('[data-w]')) {
    b.addEventListener('click', () => {
      document.querySelectorAll('[data-w]').forEach((x) => {
        const on = x === b;
        x.classList.toggle('bx-w-on', on);
        x.setAttribute('aria-pressed', String(on));
      });
      const w = +b.dataset.w;
      $('bx-frame-wrap').style.maxInlineSize = w ? w + 'px' : 'none';
    });
  }
  $('bx-page-setup').addEventListener('click', () => onSelect(null));
  $('bx-preview').addEventListener('click', () => setPreview(!previewing));
  $('bx-export').addEventListener('click', () => openDrawer('export'));
  $('bx-import').addEventListener('click', () => openDrawer('import'));
  $('bx-import-load').addEventListener('click', () => {
    const val = $('bx-export-out').value.trim();
    if (!val) return;
    if (project.blocks.length && !confirm('Replace the current page with this imported HTML?')) return;
    if (previewing) setPreview(false);
    project = importHtml(val);
    selectedId = null; history = []; future = []; autosave();
    closeDrawer();
    render();
  });
  $('bx-drawer-close').addEventListener('click', closeDrawer);
  $('bx-copy').addEventListener('click', async () => {
    const out = $('bx-export-out');
    try { await navigator.clipboard.writeText(out.value); } catch (e) { out.select(); document.execCommand('copy'); }
    const b = $('bx-copy'); const t = b.textContent; b.textContent = 'Copied!'; setTimeout(() => { b.textContent = t; }, 1200);
  });
  $('bx-download').addEventListener('click', () => {
    const blob = new Blob([$('bx-export-out').value], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (project.name || 'page').replace(/[^a-z0-9_-]+/gi, '-') + '.html';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  $('bx-search').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    for (const btn of document.querySelectorAll('#bx-palette-list .bx-pal')) {
      btn.hidden = !!q && !btn.textContent.toLowerCase().includes(q) && !(btn.title || '').toLowerCase().includes(q);
    }
    for (const g of document.querySelectorAll('#bx-palette-list .bx-palette__group')) {
      g.hidden = ![...g.querySelectorAll('.bx-pal')].some((b) => !b.hidden);
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !$('bx-drawer').hidden) { closeDrawer(); return; }
    if (e.key === 'Escape' && selectedId) { onSelect(null); return; }
    if (!(e.ctrlKey || e.metaKey)) return;
    if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
    else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') { e.preventDefault(); redo(); }
  });
}

// ---- boot ------------------------------------------------------------------
function iframeReady() {
  return new Promise((res) => {
    const w = iframe.contentWindow;
    if (w && w.RSCanvasReady) return res();
    iframe.addEventListener('load', () => res(), { once: true });
  });
}

async function boot() {
  try {
    manifest = await fetch('../../dist/manifest.json').then((r) => r.json());
  } catch (e) {
    console.info('builder: could not load the catalog, run `npm run dev` and open over the server.');
    $('bx-palette-list').innerHTML = '<p class="bx-hint">The component catalog is taking a break. Try reloading in a moment.</p>';
    return;
  }
  buildPalette();
  buildProjectsSelect();
  try { project = JSON.parse(localStorage.getItem(CURRENT)); } catch (e) { project = null; }
  if (!project || !Array.isArray(project.blocks)) project = emptyProject();
  normalizeWidgets(project);
  await iframeReady();
  canvas = iframe.contentWindow.RSCanvas;
  canvas.mount({ onSelect, onEdit: editBlock, onOp: opBlock });
  wireToolbar();
  render();
}

boot();
