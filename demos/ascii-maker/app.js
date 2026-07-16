// Sign Painter, type a word, get a banner. The font is a small hand-drawn
// 5-row bitmap, no dependency, no server. It writes into the real rs-ascii
// component, aria-label and all, so the output is as accessible as the docs say.
(function () {
  'use strict';

  // Five rows per glyph, '#' is ink. Every row of a glyph is the same width.
  var F = {
    'A': [' ### ', '#   #', '#####', '#   #', '#   #'],
    'B': ['#### ', '#   #', '#### ', '#   #', '#### '],
    'C': [' ### ', '#   #', '#    ', '#   #', ' ### '],
    'D': ['#### ', '#   #', '#   #', '#   #', '#### '],
    'E': ['#####', '#    ', '#### ', '#    ', '#####'],
    'F': ['#####', '#    ', '#### ', '#    ', '#    '],
    'G': [' ####', '#    ', '#  ##', '#   #', ' ####'],
    'H': ['#   #', '#   #', '#####', '#   #', '#   #'],
    'I': ['#####', '  #  ', '  #  ', '  #  ', '#####'],
    'J': ['#####', '    #', '    #', '#   #', ' ### '],
    'K': ['#   #', '#  # ', '###  ', '#  # ', '#   #'],
    'L': ['#    ', '#    ', '#    ', '#    ', '#####'],
    'M': ['#   #', '## ##', '# # #', '#   #', '#   #'],
    'N': ['#   #', '##  #', '# # #', '#  ##', '#   #'],
    'O': [' ### ', '#   #', '#   #', '#   #', ' ### '],
    'P': ['#### ', '#   #', '#### ', '#    ', '#    '],
    'Q': [' ### ', '#   #', '#   #', '#  # ', ' ## #'],
    'R': ['#### ', '#   #', '#### ', '#  # ', '#   #'],
    'S': [' ####', '#    ', ' ### ', '    #', '#### '],
    'T': ['#####', '  #  ', '  #  ', '  #  ', '  #  '],
    'U': ['#   #', '#   #', '#   #', '#   #', ' ### '],
    'V': ['#   #', '#   #', '#   #', ' # # ', '  #  '],
    'W': ['#   #', '#   #', '# # #', '## ##', '#   #'],
    'X': ['#   #', ' # # ', '  #  ', ' # # ', '#   #'],
    'Y': ['#   #', ' # # ', '  #  ', '  #  ', '  #  '],
    'Z': ['#####', '   # ', '  #  ', ' #   ', '#####'],
    '0': [' ### ', '#  ##', '# # #', '##  #', ' ### '],
    '1': ['  #  ', ' ##  ', '  #  ', '  #  ', '#####'],
    '2': [' ### ', '#   #', '  ## ', ' #   ', '#####'],
    '3': ['#### ', '    #', ' ### ', '    #', '#### '],
    '4': ['#   #', '#   #', '#####', '    #', '    #'],
    '5': ['#####', '#    ', '#### ', '    #', '#### '],
    '6': [' ####', '#    ', '#### ', '#   #', ' ### '],
    '7': ['#####', '    #', '   # ', '  #  ', '  #  '],
    '8': [' ### ', '#   #', ' ### ', '#   #', ' ### '],
    '9': [' ### ', '#   #', ' ####', '    #', '#### '],
    ' ': ['  ', '  ', '  ', '  ', '  '],
    '!': ['#', '#', '#', ' ', '#'],
    '?': [' ### ', '#   #', '  ## ', '     ', '  #  '],
    '.': [' ', ' ', ' ', ' ', '#'],
    '-': ['     ', '     ', '#####', '     ', '     '],
    ',': ['  ', '  ', '  ', ' #', '# '],
    "'": ['#', '#', ' ', ' ', ' '],
    ':': [' ', '#', ' ', '#', ' '],
    '&': [' ##  ', '#  # ', ' ##  ', '# # #', ' # ##'],
    '/': ['    #', '   # ', '  #  ', ' #   ', '#    '],
    '(': [' #', '# ', '# ', '# ', ' #'],
    ')': ['# ', ' #', ' #', ' #', '# '],
    '+': ['     ', '  #  ', '#####', '  #  ', '     ']
  };

  // Poster, a second face: six rows, strokes two columns wide, so it carries
  // weight in block ink and stays crisp in hash. Silhouette only ('#' is ink).
  var POSTER = {
    'A': ['  ##  ', ' #### ', '##  ##', '######', '##  ##', '##  ##'],
    'B': ['##### ', '##  ##', '##### ', '##  ##', '##  ##', '##### '],
    'C': [' #### ', '##  ##', '##    ', '##    ', '##  ##', ' #### '],
    'D': ['##### ', '##  ##', '##  ##', '##  ##', '##  ##', '##### '],
    'E': ['######', '##    ', '##### ', '##    ', '##    ', '######'],
    'F': ['######', '##    ', '##### ', '##    ', '##    ', '##    '],
    'G': [' #### ', '##  ##', '##    ', '## ###', '##  ##', ' #### '],
    'H': ['##  ##', '##  ##', '######', '##  ##', '##  ##', '##  ##'],
    'I': ['######', '  ##  ', '  ##  ', '  ##  ', '  ##  ', '######'],
    'J': ['  ####', '    ##', '    ##', '    ##', '##  ##', ' #### '],
    'K': ['##  ##', '## ## ', '####  ', '## ## ', '##  ##', '##  ##'],
    'L': ['##    ', '##    ', '##    ', '##    ', '##    ', '######'],
    'M': ['##   ##', '### ###', '## # ##', '##   ##', '##   ##', '##   ##'],
    'N': ['##   ##', '###  ##', '## # ##', '##  ###', '##   ##', '##   ##'],
    'O': [' #### ', '##  ##', '##  ##', '##  ##', '##  ##', ' #### '],
    'P': ['##### ', '##  ##', '##  ##', '##### ', '##    ', '##    '],
    'Q': [' #### ', '##  ##', '##  ##', '##  ##', ' #####', '    ##'],
    'R': ['##### ', '##  ##', '##  ##', '##### ', '## ## ', '##  ##'],
    'S': [' #####', '##    ', ' #### ', '    ##', '##  ##', ' #### '],
    'T': ['######', '  ##  ', '  ##  ', '  ##  ', '  ##  ', '  ##  '],
    'U': ['##  ##', '##  ##', '##  ##', '##  ##', '##  ##', ' #### '],
    'V': ['##  ##', '##  ##', '##  ##', '##  ##', ' #### ', '  ##  '],
    'W': ['##   ##', '##   ##', '##   ##', '## # ##', '### ###', '##   ##'],
    'X': ['##  ##', ' #### ', '  ##  ', '  ##  ', ' #### ', '##  ##'],
    'Y': ['##  ##', '##  ##', ' #### ', '  ##  ', '  ##  ', '  ##  '],
    'Z': ['######', '   ## ', '  ##  ', ' ##   ', '##    ', '######'],
    '0': [' #### ', '##  ##', '## ###', '### ##', '##  ##', ' #### '],
    '1': ['  ##  ', ' ###  ', '  ##  ', '  ##  ', '  ##  ', '######'],
    '2': [' #### ', '##  ##', '   ## ', '  ##  ', ' ##   ', '######'],
    '3': [' #### ', '##  ##', '  ### ', '    ##', '##  ##', ' #### '],
    '4': ['   ## ', '  ### ', ' #### ', '## ## ', '######', '   ## '],
    '5': ['######', '##    ', '##### ', '    ##', '##  ##', ' #### '],
    '6': [' #### ', '##    ', '##### ', '##  ##', '##  ##', ' #### '],
    '7': ['######', '    ##', '   ## ', '  ##  ', ' ##   ', ' ##   '],
    '8': [' #### ', '##  ##', ' #### ', '##  ##', '##  ##', ' #### '],
    '9': [' #### ', '##  ##', '##  ##', ' #####', '    ##', ' #### '],
    ' ': ['   ', '   ', '   ', '   ', '   ', '   '],
    '!': ['##', '##', '##', '##', '  ', '##'],
    '?': [' #### ', '##  ##', '   ## ', '  ##  ', '      ', '  ##  '],
    '.': ['  ', '  ', '  ', '  ', '##', '##'],
    ',': ['  ', '  ', '  ', '  ', '##', '# '],
    '-': ['    ', '    ', '####', '####', '    ', '    '],
    "'": ['##', '##', '  ', '  ', '  ', '  '],
    ':': ['  ', '##', '##', '  ', '##', '##'],
    '&': [' ###  ', '## ## ', ' ###  ', '## ###', '##  # ', ' ### #'],
    '+': ['      ', '  ##  ', '######', '######', '  ##  ', '      '],
    '/': ['    ##', '   ## ', '  ##  ', '  ##  ', ' ##   ', '##    '],
    '(': ['  ##', ' ## ', '##  ', '##  ', ' ## ', '  ##'],
    ')': ['##  ', ' ## ', '  ##', '  ##', ' ## ', '##  ']
  };

  // fonts declare their own height; the renderer reads it, so a face can be any size
  var FONTS = {
    'sign-painter': { height: 5, glyphs: F },
    'poster': { height: 6, glyphs: POSTER }
  };

  var byId = function (id) { return document.getElementById(id); };
  var txt = byId('txt'), ink = byId('ink'), border = byId('border'), out = byId('out'), say = byId('say');
  var face = byId('face'), shadow = byId('shadow');

  var rep = function (s, n) { var o = ''; for (var i = 0; i < n; i++) o += s; return o; };
  function currentFont() { return FONTS[face && face.value] || FONTS['sign-painter']; }

  // Rows for the whole word, one space column between letters. A missing glyph is
  // reported to the status line instead of silently becoming a space.
  var missing = [];
  function bannerRows(text) {
    var font = currentFont(), glyphs = font.glyphs, h = font.height;
    var chars = text.toUpperCase().split('');
    var rows = []; for (var r = 0; r < h; r++) rows.push('');
    missing = [];
    for (var c = 0; c < chars.length; c++) {
      var ch = chars[c], g = glyphs[ch];
      if (!g) { if (ch !== ' ' && missing.indexOf(ch) < 0) missing.push(ch); g = glyphs[' ']; }
      for (r = 0; r < h; r++) rows[r] += g[r] + (c < chars.length - 1 ? ' ' : '');
    }
    return rows;
  }

  // Cast a shadow one cell down-right; '%' marks shade. Works on any '#' silhouette.
  function shadowed(rows) {
    var h = rows.length, w = rows[0].length + 1, grid = [], r, c;
    for (r = 0; r < h + 1; r++) grid.push(((rows[r] || '') + rep(' ', w)).slice(0, w).split(''));
    for (r = 1; r <= h; r++)
      for (c = 1; c < w; c++)
        if ((rows[r - 1] || '')[c - 1] === '#' && grid[r][c] === ' ') grid[r][c] = '%';
    return grid.map(function (g) { return g.join(''); });
  }

  function frame(rows, style) {
    if (style === 'none') return rows;
    var width = 0, i;
    for (i = 0; i < rows.length; i++) width = Math.max(width, rows[i].length);
    var body = rows.map(function (s) { return s + rep(' ', width - s.length); });
    if (style === 'box') {
      var bar = '+' + rep('-', width + 2) + '+';
      return [bar].concat(body.map(function (s) { return '| ' + s + ' |'; })).concat([bar]);
    }
    if (style === 'stars') {
      var stars = rep('~*', Math.ceil(width / 2)).slice(0, width);
      return [stars].concat(body).concat([stars]);
    }
    if (style === 'dashes') {
      var dash = rep('-', width);
      return [dash].concat(body).concat([dash]);
    }
    return body;
  }

  // Build the art, then swap the '#' ink for the chosen character. Border
  // glyphs (+ - | ~ *) aren't '#', so they're left alone.
  function currentText() {
    var rows = bannerRows(txt.value || ' ');
    if (shadow && shadow.checked) rows = shadowed(rows);
    rows = frame(rows, border.value);
    var shade = ink.value === '█' ? '░' : ':'; // block ink casts a light-shade, else a dotted shade
    return rows.join('\n').replace(/#/g, ink.value).replace(/%/g, shade);
  }

  function render() {
    out.textContent = currentText();
    var word = (txt.value || '').trim();
    out.setAttribute('aria-label', word ? ('ASCII banner spelling ' + word) : 'ASCII banner');
    say.textContent = missing.length ? ('No glyph yet for: ' + missing.join(' ')) : '';
  }

  byId('copy').addEventListener('click', function () {
    var art = currentText();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(art).then(
        function () { say.textContent = 'Copied.'; },
        function () { say.textContent = 'Copy failed, select the preview and copy by hand.'; }
      );
    } else {
      say.textContent = 'Select the preview and copy by hand.';
    }
  });

  byId('download').addEventListener('click', function () {
    var blob = new Blob([currentText() + '\n'], { type: 'text/plain' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    var name = (txt.value || 'sign').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'sign';
    a.href = url;
    a.download = name + '.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    say.textContent = 'Saved ' + name + '.txt';
  });

  txt.addEventListener('input', render);
  ink.addEventListener('change', render);
  border.addEventListener('change', render);
  if (face) face.addEventListener('change', render);
  if (shadow) shadow.addEventListener('change', render);
  render();
})();
