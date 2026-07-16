/* Button Works 1.0, an 88x31 button painter.
   Plain JavaScript, no modules, no build, no network. Colours are drawn onto a
   canvas and handed back as a PNG via toDataURL, the button is made on your
   own computer, like everything used to be. */
(function () {
  'use strict';

  var W = 88, H = 31;
  var STEPS = [0x00, 0x33, 0x66, 0x99, 0xCC, 0xFF];

  // --- the palette -------------------------------------------------------
  function hex2(n) { return n.toString(16).padStart(2, '0').toUpperCase(); }

  // 216 web-safe, generated programmatically.
  var WEBSAFE = [];
  for (var ri = 0; ri < 6; ri++)
    for (var gi = 0; gi < 6; gi++)
      for (var bi = 0; bi < 6; bi++)
        WEBSAFE.push('#' + hex2(STEPS[ri]) + hex2(STEPS[gi]) + hex2(STEPS[bi]));

  // The named sixteen (VGA/HTML). Eight are web-safe, eight are the extra
  // lawful greys and darks, together they are exactly retrostrap's palette.
  var NAMED = [
    ['black', '#000000'], ['white', '#FFFFFF'], ['red', '#FF0000'], ['lime', '#00FF00'],
    ['blue', '#0000FF'], ['yellow', '#FFFF00'], ['aqua', '#00FFFF'], ['fuchsia', '#FF00FF'],
    ['silver', '#C0C0C0'], ['gray', '#808080'], ['maroon', '#800000'], ['olive', '#808000'],
    ['green', '#008000'], ['purple', '#800080'], ['teal', '#008080'], ['navy', '#000080']
  ];

  // Legal-palette set, for validating the presets against the Palette Law.
  var LEGAL = new Set(WEBSAFE);
  NAMED.forEach(function (n) { LEGAL.add(n[1]); });

  // --- presets (inline; also mirrored in presets.json) -------------------
  var PRESETS = [
    // accent is the pattern's second colour: a quiet step off the background,
    // never the text colour, or the label drowns in its own stripes
    { name: 'classic navy', bg: '#000080', fg: '#FFFFFF', accent: '#000080', border: 'bevel',  tile: 'solid',   text: 'MY SITE' },
    { name: 'hot lava',     bg: '#330000', fg: '#FF9900', accent: '#660000', border: 'ridge',  tile: 'stripes', text: 'COOL LINKS' },
    { name: 'terminal',     bg: '#000000', fg: '#00FF00', accent: '#000000', border: 'dotted', tile: 'solid',   text: 'root@home' },
    { name: 'bubblegum',    bg: '#FFCCFF', fg: '#660066', accent: '#FF99FF', border: 'bevel',  tile: 'checker', text: 'kawaii!!' },
    { name: 'roadworks',    bg: '#FFCC00', fg: '#000000', accent: '#CC9900', border: 'ridge',  tile: 'stripes', text: 'UNDER CONSTR.' },
    { name: 'midnight',     bg: '#000033', fg: '#FFFF00', accent: '#FFFFFF', border: 'none',   tile: 'stars',   text: 'star corner' }
  ];
  PRESETS.forEach(function (p) {
    if (!LEGAL.has(p.bg) || !LEGAL.has(p.fg)) console.error('Button Works: preset "' + p.name + '" is off palette');
  });

  var FONTS = {
    narrow: 'Tahoma, Verdana, sans-serif',
    mono: '"Courier New", Courier, monospace',
    sans: 'Arial, Helvetica, sans-serif',
    serif: '"Times New Roman", Times, serif',
    fancy: '"Comic Sans MS", "Comic Neue", cursive',
    impact: 'Impact, Haettenschweiler, sans-serif'
  };

  var state = {
    text: 'MY SITE', font: 'narrow', tile: 'solid', bevel: true,
    colors: { fg: '#FFFFFF', bg: '#000080', accent: '#FFFFFF', border: '#FFFFFF' },
    slot: 'bg', lastPicked: '#000080'
  };

  var cvs, actual, textInput, fontSel, bevelChk, slotName;
  var sbColors, sbSize, sbPicked;

  // --- painting ----------------------------------------------------------
  function paintTile(ctx) {
    ctx.fillStyle = state.colors.bg;
    ctx.fillRect(0, 0, W, H);
    // the pattern's second colour is its own slot; the border slot only ever
    // paints the border (people kept recolouring their stripes by accident)
    var accent = state.colors.accent, x, y;
    if (state.tile === 'checker') {
      ctx.fillStyle = accent;
      for (y = 0; y < H; y += 4)
        for (x = 0; x < W; x += 4)
          if ((((x >> 2) + (y >> 2)) & 1)) ctx.fillRect(x, y, 4, 4);
    } else if (state.tile === 'stripes') {
      ctx.strokeStyle = accent; ctx.lineWidth = 4;
      for (x = -H; x < W; x += 8) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + H, H); ctx.stroke(); }
    } else if (state.tile === 'stars') {
      ctx.fillStyle = accent;
      var stars = [[8, 6], [22, 20], [36, 8], [50, 22], [64, 6], [78, 18], [16, 24], [70, 26], [44, 14], [30, 4]];
      stars.forEach(function (s) {
        ctx.fillRect(s[0], s[1] - 1, 1, 3);
        ctx.fillRect(s[0] - 1, s[1], 3, 1);
      });
    }
  }

  function paintBorder(ctx) {
    if (state.bevel) {
      ctx.fillStyle = '#FFFFFF';                 // light top + left
      ctx.fillRect(0, 0, W, 1); ctx.fillRect(0, 0, 1, H);
      ctx.fillStyle = '#808080';                 // dark bottom + right
      ctx.fillRect(0, H - 1, W, 1); ctx.fillRect(W - 1, 0, 1, H);
    } else {
      ctx.fillStyle = state.colors.border;
      ctx.fillRect(0, 0, W, 1); ctx.fillRect(0, H - 1, W, 1);
      ctx.fillRect(0, 0, 1, H); ctx.fillRect(W - 1, 0, 1, H);
    }
  }

  function paintText(ctx) {
    var t = state.text;
    if (!t) return;
    ctx.fillStyle = state.colors.fg;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    var size = 14;
    ctx.font = 'bold ' + size + 'px ' + FONTS[state.font];
    while (size > 6 && ctx.measureText(t).width > W - 8) {
      size -= 1;
      ctx.font = 'bold ' + size + 'px ' + FONTS[state.font];
    }
    ctx.fillText(t, W / 2, H / 2 + 1);
  }

  function render() {
    var ctx = cvs.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, W, H);
    paintTile(ctx);
    paintBorder(ctx);
    paintText(ctx);
    var actx = actual.getContext('2d');
    actx.imageSmoothingEnabled = false;
    actx.clearRect(0, 0, W, H);
    actx.drawImage(cvs, 0, 0);
    updateStatus();
  }

  function updateStatus() {
    // count what actually lands on the canvas, not every slot in the state
    var used = [state.colors.fg, state.colors.bg];
    if (state.tile !== 'solid') used.push(state.colors.accent);
    if (state.bevel) used.push('#FFFFFF', '#808080'); else used.push(state.colors.border);
    var set = new Set(used);
    sbColors.textContent = set.size + ' colour' + (set.size === 1 ? '' : 's');
    var url = cvs.toDataURL('image/png');
    var b64 = url.slice(url.indexOf(',') + 1);
    sbSize.textContent = 'PNG ~' + Math.round(b64.length * 3 / 4) + ' bytes';
    sbPicked.textContent = 'picked ' + state.lastPicked;
  }

  // --- palette grids -----------------------------------------------------
  function buildGrid(container, entries, cols) {
    entries.forEach(function (e, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'bw-swatch rs-tooltip';
      b.style.background = e.hex;
      b.dataset.hex = e.hex;
      b.setAttribute('data-rs-tip', e.hex);
      b.setAttribute('aria-label', e.label);
      b.tabIndex = i === 0 ? 0 : -1;
      container.appendChild(b);
    });
    container.addEventListener('click', function (ev) {
      var b = ev.target.closest('.bw-swatch');
      if (b) pick(b.dataset.hex);
    });
    container.addEventListener('keydown', function (ev) {
      var btns = [].slice.call(container.querySelectorAll('.bw-swatch'));
      var i = btns.indexOf(document.activeElement);
      if (i < 0) return;
      var n = i;
      if (ev.key === 'ArrowRight') n = Math.min(i + 1, btns.length - 1);
      else if (ev.key === 'ArrowLeft') n = Math.max(i - 1, 0);
      else if (ev.key === 'ArrowDown') n = Math.min(i + cols, btns.length - 1);
      else if (ev.key === 'ArrowUp') n = Math.max(i - cols, 0);
      else if (ev.key === 'Home') n = 0;
      else if (ev.key === 'End') n = btns.length - 1;
      else return;
      ev.preventDefault();
      btns[i].tabIndex = -1; btns[n].tabIndex = 0; btns[n].focus();
    });
  }

  function pick(hex) {
    state.colors[state.slot] = hex;
    state.lastPicked = hex;
    render();
  }

  // --- presets -----------------------------------------------------------
  function loadPreset(p) {
    state.text = p.text.slice(0, 14);
    state.tile = p.tile;
    state.bevel = (p.border === 'bevel' || p.border === 'ridge');
    state.colors.bg = p.bg;
    state.colors.fg = p.fg;
    state.colors.accent = p.accent || p.bg;
    state.colors.border = (p.border === 'none') ? p.bg : p.fg;
    state.lastPicked = p.bg;
    // reflect into the controls so the UI and the canvas never disagree
    textInput.value = state.text;
    bevelChk.checked = state.bevel;
    var tileRadio = document.getElementById('tile-' + state.tile);
    if (tileRadio) tileRadio.checked = true;
    render();
  }

  // --- wiring ------------------------------------------------------------
  function download() {
    var url = cvs.toDataURL('image/png');
    var a = document.createElement('a');
    a.href = url; a.download = 'button.png';
    document.body.appendChild(a); a.click(); a.remove();
    var say = document.getElementById('bw-say');
    if (say) say.textContent = 'Saved button.png';
  }

  function start() {
    cvs = document.getElementById('preview');
    actual = document.getElementById('preview-actual');
    textInput = document.getElementById('btn-text');
    fontSel = document.getElementById('btn-font');
    bevelChk = document.getElementById('bevel-edge');
    slotName = document.getElementById('slot-name');
    sbColors = document.getElementById('sb-colors');
    sbSize = document.getElementById('sb-size');
    sbPicked = document.getElementById('sb-picked');

    buildGrid(document.getElementById('ws-grid'),
      WEBSAFE.map(function (h) { return { hex: h, label: 'web-safe ' + h }; }), 18);
    buildGrid(document.getElementById('named-grid'),
      NAMED.map(function (n) { return { hex: n[1], label: 'named colour ' + n[0] + ' ' + n[1] }; }), 8);

    textInput.addEventListener('input', function () { state.text = textInput.value; render(); });
    fontSel.addEventListener('change', function () { state.font = fontSel.value; render(); });
    bevelChk.addEventListener('change', function () { state.bevel = bevelChk.checked; syncBorderRadio(); render(); });

    document.querySelectorAll('input[name="tile"]').forEach(function (r) {
      r.addEventListener('change', function () { if (r.checked) { state.tile = r.value; render(); } });
    });
    var SLOT_NAMES = { fg: 'text colour', bg: 'background', accent: 'pattern colour', border: 'border' };
    document.querySelectorAll('input[name="slot"]').forEach(function (r) {
      r.addEventListener('change', function () {
        if (!r.checked) return;
        state.slot = r.value;
        slotName.textContent = SLOT_NAMES[r.value];
      });
    });

    // with the bevel on, the border paints itself white/grey; park its radio
    // so a swatch click can't land somewhere invisible
    var borderRadio = document.getElementById('slot-border');
    function syncBorderRadio() {
      borderRadio.disabled = state.bevel;
      if (state.bevel && state.slot === 'border') {
        document.getElementById('slot-bg').checked = true;
        state.slot = 'bg';
        slotName.textContent = SLOT_NAMES.bg;
      }
    }
    syncBorderRadio();

    document.querySelectorAll('.bw-preset').forEach(function (btn) {
      btn.addEventListener('click', function () { loadPreset(PRESETS[+btn.dataset.preset]); syncBorderRadio(); });
    });

    document.getElementById('download-btn').addEventListener('click', download);
    document.getElementById('download-top').addEventListener('click', download);

    var aboutDlg = document.getElementById('about-dlg');
    document.getElementById('about-btn').addEventListener('click', function () {
      if (aboutDlg.showModal) aboutDlg.showModal(); else aboutDlg.setAttribute('open', '');
    });

    // Toolbar shortcuts jump to the matching control. On a small screen the
    // target can sit in a hidden tab panel, so switch to its tab first, then
    // scroll and focus; the presets are plain links, so they count too.
    document.querySelectorAll('.rs-toolbar [data-focus]').forEach(function (b) {
      b.addEventListener('click', function () {
        var el = document.querySelector(b.dataset.focus);
        if (!el) return;
        var panel = el.closest('.rs-tabs__panel');
        if (panel && !panel.offsetParent) {
          var tab = document.querySelector('.rs-tabs__tab[href="#' + panel.id + '"]');
          if (tab) tab.click();
        }
        if (el.scrollIntoView) el.scrollIntoView({ block: 'center' });
        var focusable = el.matches('input,select,button,textarea,a[href]') ? el
          : el.querySelector('input,select,button,textarea,a[href],[tabindex]');
        if (focusable && focusable.focus) {
          // ask for the ring; mouse-initiated focus() hides it otherwise
          try { focusable.focus({ preventScroll: true, focusVisible: true }); }
          catch (e) { focusable.focus(); }
        }
        // and flash the whole target so the jump is visible either way
        el.classList.add('bw-flash');
        clearTimeout(el.__bwFlashTimer);
        el.__bwFlashTimer = setTimeout(function () { el.classList.remove('bw-flash'); }, 900);
      });
    });

    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
