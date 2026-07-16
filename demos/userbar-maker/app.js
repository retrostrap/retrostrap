/* Userbar Factory 1.0, the 350x19 signature banner of the mid-2000s forums.
   Gel gloss, diagonal scanlines, a pixel icon, your text. Drawn on a canvas and
   handed back as a PNG; no modules, no build, no network. */
(function () {
  'use strict';

  var W = 350, H = 19;

  // colour themes: name, base (fill), text, accent (stripe/gradient/2nd colour).
  // 3-element entries fall back to accent = text (see render).
  var THEMES = [
    ['midnight', '#000033', '#66CCFF'], ['toxic', '#003300', '#66FF00'],
    ['bubblegum', '#660066', '#FF99FF'], ['fire', '#330000', '#FF9900'],
    ['ice', '#003366', '#CCFFFF'], ['gold', '#333300', '#FFCC00'],
    ['blood', '#330000', '#FF3333'], ['grape', '#330066', '#CC99FF'],
    ['steel', '#333333', '#CCCCCC'], ['navy', '#000080', '#FFFFFF'],
    ['forest', '#003300', '#99CC66'], ['sunset', '#660033', '#FF9966'],
    ['aqua', '#003333', '#00FFCC'], ['void', '#000000', '#00FF66'],
    // brighter, more varied stock, light bases, mids, new hues
    ['buddy', '#0066CC', '#FFFFFF', '#FFCC00'], ['llama', '#333333', '#FFCC00', '#FF6600'],
    ['hazard', '#FFCC00', '#000000', '#663300'], ['crush', '#FF6600', '#FFFFFF', '#993300'],
    ['warez', '#6600CC', '#CCCCFF', '#9933FF'], ['plasma', '#330099', '#00FFFF', '#CC00CC'],
    ['chrome', '#C0C0C0', '#000000', '#666666'], ['dot matrix', '#99CC33', '#333300', '#CCFF66'],
    ['bluescreen', '#0000CC', '#FFFFFF', '#9999FF'], ['amber', '#000000', '#FF9900', '#663300'],
    ['cotton candy', '#FF99CC', '#663399', '#99CCFF'], ['camo', '#666633', '#FFFF99', '#333300'],
  ];

  // 9-wide pixel icons ('#' is ink), drawn in the theme's text colour
  var ICONS = {
    heart: ['.##...##.', '#########', '#########', '#########', '.#######.', '..#####..', '...###...', '....#....'],
    star: ['....#....', '...###...', '...###...', '#########', '.#######.', '..#####..', '..##.##..', '.##...##.', '.#.....#.'],
    gem: ['....#....', '...###...', '..#####..', '.#######.', '#########', '.#######.', '..#####..', '...###...', '....#....'],
    floppy: ['#########', '#..###..#', '#..###..#', '#..###..#', '#.......#', '#.#####.#', '#.#####.#', '#.#####.#', '#########'],
    cat: ['#.......#', '##.....##', '#########', '#.#...#.#', '#..#.#..#', '#########', '.#.....#.', '..#####..'],
    invader: ['..#...#..', '...#.#...', '..#####..', '.##.#.##.', '#########', '#.#####.#', '#.#...#.#', '..##.##..'],
    skull: ['.#######.', '#########', '#..###..#', '#..###..#', '####.####', '.#######.', '..#####..', '..#.#.#..'],
    bolt: ['....####.', '...####..', '..####...', '.#######.', '....###..', '...###...', '..###....', '.###.....', '.#.......'],
    mushroom: ['..#####..', '.#.###.#.', '#########', '#########', '...###...', '...###...', '..#####..'],
    cassette: ['#########', '#.......#', '#.##.##.#', '#.##.##.#', '#.......#', '#..###..#', '#########'],
    gamepad: ['.#######.', '##.######', '#...#.#.#', '##.######', '#########', '.#######.'],
    note: ['..#######', '..#.....#', '..#.....#', '..#.....#', '.##....##', '###...###', '###...###'],
    paw: ['##..#..##', '##.###.##', '..#####..', '.#######.', '.#######.', '..#####..'],
    coffee: ['..#..#...', '.#..#....', '######...', '########.', '######.#.', '########.', '######...', '.####....'],
    cd: ['..#####..', '.#######.', '#########', '###...###', '###...###', '###...###', '#########', '.#######.', '..#####..'],
    crown: ['#...#...#', '##..#..##', '##.###.##', '#########', '##.#.#.##', '#########'],
    crosshair: ['....#....', '....#....', '....#....', '.........', '###.#.###', '.........', '....#....', '....#....', '....#....'],
  };

  var byId = function (id) { return document.getElementById(id); };
  var zoom = byId('zoom'), actual = byId('actual');
  var state = { theme: 0, text: 'RETRO SINCE 1999', icon: 'none', align: 'right', gloss: 'gel', texture: 'scanlines' };

  function drawIcon(ctx, rows, ox, oy, color) {
    ctx.fillStyle = color;
    for (var y = 0; y < rows.length; y++)
      for (var x = 0; x < rows[y].length; x++)
        if (rows[y][x] === '#') ctx.fillRect(ox + x, oy + y, 1, 1);
  }

  function render(ctx) {
    var t = THEMES[state.theme], base = t[1], text = t[2], accent = t[3] || t[2];
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, W, H);

    // gloss: none / gel (linear split) / oval (the classic userbars.com dome)
    if (state.gloss === 'gel') {
      var g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, 'rgba(255,255,255,0.42)');
      g.addColorStop(0.49, 'rgba(255,255,255,0.06)');
      g.addColorStop(0.50, 'rgba(0,0,0,0.00)');
      g.addColorStop(1, 'rgba(0,0,0,0.38)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.fillRect(1, 1, W - 2, 1);
    } else if (state.gloss === 'oval') {
      ctx.save();
      ctx.beginPath(); ctx.rect(1, 1, W - 2, H - 2); ctx.clip();
      ctx.beginPath(); ctx.ellipse(W / 2, -H * 0.55, W * 0.72, H * 1.05, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.32)'; ctx.fill();
      ctx.restore();
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.fillRect(1, 1, W - 2, 1);
    }

    // texture: none / scanlines / candy stripes / brushed metal / carbon fibre
    if (state.texture === 'scanlines') {
      ctx.strokeStyle = 'rgba(255,255,255,0.09)';
      ctx.lineWidth = 1;
      for (var sx = -H; sx < W; sx += 4) {
        ctx.beginPath(); ctx.moveTo(sx + 0.5, H); ctx.lineTo(sx + H + 0.5, 0); ctx.stroke();
      }
    } else if (state.texture === 'candy') {
      ctx.fillStyle = 'rgba(255,255,255,0.16)';
      for (var cx = -H; cx < W + H; cx += 12) {
        ctx.beginPath();
        ctx.moveTo(cx, H); ctx.lineTo(cx + H, 0); ctx.lineTo(cx + H + 6, 0); ctx.lineTo(cx + 6, H);
        ctx.closePath(); ctx.fill();
      }
    } else if (state.texture === 'brushed') {
      var grain = [0.10, 0.03, 0.14, 0.00, 0.07, 0.02, 0.12, 0.05];
      for (var by = 1; by < H - 1; by++) {
        ctx.fillStyle = 'rgba(255,255,255,' + grain[by % grain.length] + ')';
        ctx.fillRect(1, by, W - 2, 1);
        if (by % 5 === 3) { ctx.fillStyle = 'rgba(0,0,0,0.10)'; ctx.fillRect(1, by, W - 2, 1); }
      }
    } else if (state.texture === 'carbon') {
      for (var wy = 0; wy < H; wy += 4)
        for (var wx = 0; wx < W; wx += 4) {
          ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(wx, wy, 2, 2);
          ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(wx + 2, wy + 2, 2, 2);
        }
    }

    // pixel icon on the left, in the theme's accent (a 2-colour pop when set)
    var pad = 4, left = pad;
    if (state.icon !== 'none' && ICONS[state.icon]) {
      var rows = ICONS[state.icon];
      drawIcon(ctx, rows, pad, Math.floor((H - rows.length) / 2), accent);
      left = pad + 9 + 3;
    }

    // text, with a hard dark shadow for legibility over the gloss
    ctx.font = 'bold 9px Tahoma, Geneva, Verdana, sans-serif';
    ctx.textBaseline = 'middle';
    var tx, ta;
    if (state.align === 'left') { ta = 'left'; tx = left; }
    else if (state.align === 'center') { ta = 'center'; tx = (left + W - pad) / 2; }
    else { ta = 'right'; tx = W - pad; }
    ctx.textAlign = ta;
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillText(state.text, tx + 1, H / 2 + 1);
    ctx.fillStyle = text;
    ctx.fillText(state.text, tx, H / 2);

    // 1px black frame
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, W, 1); ctx.fillRect(0, H - 1, W, 1);
    ctx.fillRect(0, 0, 1, H); ctx.fillRect(W - 1, 0, 1, H);
  }

  function paint() {
    render(actual.getContext('2d'));
    var zc = zoom.getContext('2d');
    zc.imageSmoothingEnabled = false;
    zc.clearRect(0, 0, zoom.width, zoom.height);
    zc.drawImage(actual, 0, 0, zoom.width, zoom.height); // 2x, crisp
    zoom.setAttribute('aria-label', state.text ? ('Userbar reading "' + state.text + '"') : 'Userbar preview');
  }

  function buildSwatches() {
    var box = byId('swatches');
    for (var i = 0; i < THEMES.length; i++) {
      (function (idx, t) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'ub-swatch';
        b.style.background = t[1];
        b.style.display = 'flex';
        b.style.alignItems = 'center';
        b.style.justifyContent = 'center';
        // preview the theme's text colour as a bar, not text, so axe's contrast rule
        // doesn't fail an era-authentic low-contrast theme (crush, cotton candy); the real
        // userbar carries such text on a shadow, and the button's name is its aria-label
        var ink = document.createElement('span');
        ink.setAttribute('aria-hidden', 'true');
        ink.style.cssText = 'inline-size:60%;block-size:6px;background:' + t[2];
        b.appendChild(ink);
        b.title = t[0];
        b.setAttribute('aria-label', 'theme ' + t[0]);
        b.setAttribute('aria-pressed', idx === state.theme ? 'true' : 'false');
        b.addEventListener('click', function () {
          state.theme = idx;
          byId('theme-name').textContent = t[0];
          var kids = box.children;
          for (var j = 0; j < kids.length; j++) kids[j].setAttribute('aria-pressed', j === idx ? 'true' : 'false');
          paint();
        });
        box.appendChild(b);
      })(i, THEMES[i]);
    }
  }

  byId('txt').addEventListener('input', function (e) { state.text = e.target.value; paint(); });
  byId('icon').addEventListener('change', function (e) { state.icon = e.target.value; paint(); });
  byId('align').addEventListener('change', function (e) { state.align = e.target.value; paint(); });
  byId('gloss').addEventListener('change', function (e) { state.gloss = e.target.value; paint(); });
  byId('texture').addEventListener('change', function (e) { state.texture = e.target.value; paint(); });

  byId('download').addEventListener('click', function () {
    var url = actual.toDataURL('image/png');
    var a = document.createElement('a');
    var name = state.text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'userbar';
    a.href = url;
    a.download = name + '-userbar.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    byId('say').textContent = 'Saved ' + name + '-userbar.png';
  });

  byId('copybb').addEventListener('click', function () {
    var bb = '[img]https://your-space.example/userbar.png[/img]';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(bb).then(
        function () { byId('say').textContent = 'Copied a [img] template, swap in your hosted URL.'; },
        function () { byId('say').textContent = bb; }
      );
    } else { byId('say').textContent = bb; }
  });

  buildSwatches();
  paint();
})();
