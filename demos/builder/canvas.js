// canvas.js, the page-under-construction, living in the builder's iframe. The
// parent drives it directly (same origin) through window.RSCanvas. Everything
// bx- is scaffolding; serializeDoc() hands back the clean page.
(function () {
  const root = document.getElementById('bx-root');
  const themeLink = document.getElementById('bx-theme');
  let cb = {};
  let mode = 'edit';
  let dropLine = null;

  const componentOf = (block) => block.querySelector(':scope > :not(.bx-bar)');

  // strip the editing scaffolding AND anything that could execute in the
  // exported page, script/frame tags, on* handlers, javascript: URLs. The
  // export is meant to be safe to publish, whatever a block picked up.
  const BAD = 'script,style,iframe,object,embed,link,meta,base,svg,math,template,noscript';
  const URL_ATTRS = new Set(['href', 'src', 'xlink:href', 'action', 'poster', 'background']);
  const safeAttrUrl = (u) => {
    try { const p = new URL(u, 'https://x/').protocol; return (p === 'http:' || p === 'https:' || p === 'mailto:') ? u : '#'; }
    catch { return '#'; }
  };
  // widget endpoints stay same-origin, so an exported page can't beacon visitors away
  const sameOriginAttr = (u) => {
    const s = String(u).trim().replace(/\\/g, '/');
    return (/^[a-z][a-z0-9+.-]*:/i.test(s) || s.startsWith('//')) ? '' : u;
  };
  // the catalog placeholders ("avatar.gif", "my-cat.jpg") are the page author's
  // to supply; in the canvas we stand shipped pixels in for them so a fresh
  // block doesn't greet you as a broken-image icon. clean() puts the honest
  // placeholder name back before anything reaches the model or the export.
  const PREVIEW_ART = {
    'avatar.gif': '../../dist/assets/tile-stars.png',
    'golden-floppy.gif': '../../dist/assets/icon-floppy.png',
    // the real 88x31s (the build mirrors them into dist/assets/badges/), so
    // badge and banner slots hold readable buttons instead of navy dither
    'banner-468x60.gif': '../../dist/assets/badges/made-with-retrostrap-crt.png',
    'valid-html.gif': '../../dist/assets/badges/made-with-retrostrap.png',
    'my-cat.jpg': '../../dist/assets/tile-hearts.png',
  };
  const dressImages = (el) => {
    const imgs = el.matches && el.matches('img') ? [el] : [...el.querySelectorAll('img')];
    for (const img of imgs) {
      const src = img.getAttribute('src');
      if (PREVIEW_ART[src]) { img.setAttribute('data-bx-art', src); img.setAttribute('src', PREVIEW_ART[src]); }
    }
  };
  const clean = (el) => {
    const c = el.cloneNode(true);
    c.querySelectorAll(BAD).forEach((n) => n.remove());
    const nodes = c.matches && c.matches(BAD) ? [] : [c, ...c.querySelectorAll('*')];
    for (const n of nodes) {
      if (!n.attributes) continue;
      n.removeAttribute('contenteditable');
      if (n.hasAttribute('data-bx-art')) n.setAttribute('src', n.getAttribute('data-bx-art'));
      for (const a of [...n.attributes]) {
        const name = a.name.toLowerCase();
        if (name.startsWith('on') || name === 'srcdoc' || name === 'formaction' || name === 'ping' || name.startsWith('data-bx-')) n.removeAttribute(a.name);
        else if (URL_ATTRS.has(name)) n.setAttribute(a.name, safeAttrUrl(a.value));
        else if (name.startsWith('data-rs-') && name.endsWith('-src')) n.setAttribute(a.name, sameOriginAttr(a.value));
      }
    }
    return c;
  };

  function makeBlock(b) {
    const wrap = document.createElement('div');
    wrap.className = 'bx-block';
    wrap.dataset.id = b.id;
    wrap.tabIndex = 0;

    const bar = document.createElement('div');
    bar.className = 'bx-bar';
    bar.innerHTML =
      '<button type="button" data-op="up" aria-label="Move block up" title="Move up">▲</button>' +
      '<button type="button" data-op="down" aria-label="Move block down" title="Move down">▼</button>' +
      '<button type="button" data-op="dup" aria-label="Duplicate block" title="Duplicate">⧉</button>' +
      '<button type="button" data-op="del" aria-label="Delete block" title="Delete">✕</button>';
    wrap.appendChild(bar);

    const tmp = document.createElement('div');
    tmp.innerHTML = b.html;
    const el = tmp.firstElementChild || Object.assign(document.createElement('p'), { textContent: b.html });
    dressImages(el);
    wrap.appendChild(el);
    return wrap;
  }

  function applyMode() {
    document.body.classList.toggle('bx-preview', mode === 'preview');
    for (const block of root.querySelectorAll('.bx-block')) {
      const el = componentOf(block);
      if (el) el.contentEditable = mode === 'edit' ? 'true' : 'false';
    }
  }

  // delegated selection + block ops
  root.addEventListener('click', (e) => {
    const block = e.target.closest('.bx-block');
    if (!block) { cb.onSelect && cb.onSelect(null); return; }
    const opBtn = e.target.closest('.bx-bar button');
    if (opBtn) { e.preventDefault(); cb.onOp && cb.onOp(block.dataset.id, opBtn.dataset.op); return; }
    cb.onSelect && cb.onSelect(block.dataset.id);
  });

  // Escape drops the selection (back to page settings)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && cb.onSelect) cb.onSelect(null);
  });

  // inline text commits, synchronous, so the model never lags the canvas DOM and no
  // pending timer can fire against a re-rendered (detached) node
  root.addEventListener('input', (e) => {
    const block = e.target.closest('.bx-block');
    if (!block || mode !== 'edit') return;
    const el = componentOf(block);
    if (el) cb.onEdit && cb.onEdit(block.dataset.id, clean(el).outerHTML);
  });

  window.RSCanvas = {
    mount(callbacks) { cb = callbacks || {}; },

    render(project) {
      // theme: swap the linked stylesheet, set the attribute
      if (project.theme) {
        themeLink.href = `../../dist/themes/${project.theme}.css`;
        document.documentElement.setAttribute('data-rs-theme', project.theme);
      } else {
        themeLink.removeAttribute('href');
        document.documentElement.removeAttribute('data-rs-theme');
      }
      // tile wallpaper on the body
      document.body.className = document.body.classList.contains('bx-preview') ? 'bx-preview' : '';
      if (project.tile) document.body.classList.add(`rs-tile-${project.tile}`);

      root.innerHTML = '';
      if (!project.blocks.length) {
        root.innerHTML = '<div class="bx-empty">Click a component on the left to add it here.<br>Then click its text to edit, and use the block buttons to move it.</div>';
      } else {
        for (const b of project.blocks) root.appendChild(makeBlock(b));
      }
      applyMode();
    },

    select(id) {
      for (const b of root.querySelectorAll('.bx-block')) {
        const on = b.dataset.id === id;
        b.classList.toggle('bx-selected', on);
        if (on) b.scrollIntoView({ block: 'nearest' }); // keep a just-added block in view
      }
    },

    // move keyboard focus to a block's op button (or the block) after an operation
    focusBlockOp(id, op) {
      const sel = (window.CSS && CSS.escape) ? CSS.escape(id) : id;
      const block = id && root.querySelector(`.bx-block[data-id="${sel}"]`);
      if (!block) return;
      const btn = op && block.querySelector(`.bx-bar button[data-op="${op}"]`);
      (btn || block).focus();
    },

    setMode(m) {
      mode = m === 'preview' ? 'preview' : 'edit';
      const rs = window.Retrostrap;
      if (mode === 'preview') {
        applyMode();
        if (rs && rs.init) rs.init();      // start any declared widgets
      } else {
        if (rs && rs.destroy) rs.destroy(); // tear widgets down before editing
        applyMode();
      }
    },

    // apply the data-rs-* attribute set the parent built from the catalog
    setWidgets(attrs) {
      for (const a of [...document.body.attributes]) if (a.name.startsWith('data-rs-')) document.body.removeAttribute(a.name);
      for (const [k, v] of Object.entries(attrs || {})) document.body.setAttribute(k, v);
    },

    // during a drag: draw a line where the drop would land, return the index
    dropIndicator(x, y) {
      if (dropLine) { dropLine.remove(); dropLine = null; }
      const blocks = [...root.querySelectorAll(':scope > .bx-block')];
      dropLine = document.createElement('div');
      dropLine.className = 'bx-drop';
      let idx = blocks.length;
      for (let i = 0; i < blocks.length; i++) {
        const r = blocks[i].getBoundingClientRect();
        if (y < r.top + r.height / 2) { idx = i; break; }
      }
      if (idx >= blocks.length) root.appendChild(dropLine);
      else root.insertBefore(dropLine, blocks[idx]);
      return idx;
    },

    clearIndicator() { if (dropLine) { dropLine.remove(); dropLine = null; } },

    serializeDoc() {
      const parts = [];
      for (const block of root.querySelectorAll(':scope > .bx-block')) {
        const el = componentOf(block);
        if (el) parts.push(clean(el).outerHTML);
      }
      return parts.join('\n\n');
    },
  };

  window.RSCanvasReady = true;
})();
