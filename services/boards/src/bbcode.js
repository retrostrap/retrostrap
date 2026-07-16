// bbcode.js, the Boards' post renderer (docs/11 §7). Era-true BBCode, and a
// hard security boundary: NO raw HTML ever. Input is entity-escaped first, then
// only a whitelist of tags becomes markup. The pipeline is ordered so [code]
// stays verbatim and nothing can smuggle a tag through. Zero dependencies,
// the services package never imports the framework, and this file imports
// nothing at all.

// The Palette Law reaches even here: [color=] accepts only the 216 web-safe
// colors plus the 16 named ones. An illegal color renders as literal text.
const STEPS = ['00', '33', '66', '99', 'CC', 'FF'];
const LEGAL = new Set();
for (const r of STEPS) for (const g of STEPS) for (const b of STEPS) LEGAL.add(`#${r}${g}${b}`);
for (const n of ['#C0C0C0', '#808080', '#800000', '#800080', '#008000', '#808000', '#000080', '#008080']) LEGAL.add(n);
const NAMED = {
  black: '#000000', silver: '#C0C0C0', gray: '#808080', white: '#FFFFFF',
  maroon: '#800000', red: '#FF0000', purple: '#800080', fuchsia: '#FF00FF',
  green: '#008000', lime: '#00FF00', olive: '#808000', yellow: '#FFFF00',
  navy: '#000080', blue: '#0000FF', teal: '#008080', aqua: '#00FFFF',
};

const SMILIES = {
  ':)': 'smile', ':-)': 'smile', ':(': 'sad', ':-(': 'sad', ';)': 'wink', ';-)': 'wink',
  ':D': 'grin', ':-D': 'grin', ':P': 'tongue', ':-P': 'tongue', ':p': 'tongue',
  ':o': 'surprise', ':O': 'surprise', '8)': 'cool', '8-)': 'cool',
  ':3': 'catface', '^_^': 'happy',
};

const MAX_DEPTH = 8;

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function safeUrl(url) {
  const u = url.trim();
  // A real http(s) URL has no raw whitespace or angle/quote chars. Reject them so that a
  // smiley (or anything) turned into markup inside a link/image target can't assemble into a
  // broken tag; the [url]/[img] then renders literally instead.
  if (/[\s<>"']/.test(u)) return null;
  return /^https?:\/\//i.test(u) ? u : null; // http(s) only, no javascript:, no data:
}

function legalColor(c) {
  const v = c.trim().toLowerCase();
  if (Object.hasOwn(NAMED, v)) return NAMED[v]; // hasOwn: [color=constructor] must not read a builtin
  let up = c.trim().toUpperCase();
  if (/^#[0-9A-F]{3}$/.test(up)) up = '#' + [...up.slice(1)].map((x) => x + x).join(''); // #0C0 → #00CC00
  return LEGAL.has(up) ? up : null;
}

/** Render a BBCode string to safe HTML. The output is built only from a fixed
    element/attribute whitelist; nothing from the input reaches the DOM as markup. */
// assetBase: where the retrostrap sheet lives on this origin; the Boards serve
// the framework under /dist (views.js CDN), so the default matches that
export function bbcodeToHtml(input, { assetBase = '/dist/assets' } = {}) {
  if (typeof input !== 'string') return '';
  // The schema caps a post body at 30k, but a caller that renders to compute
  // body_html before the DB enforces that cap could be walked into a quadratic
  // hang by a flood of unclosed tags, so bound the input here too.
  if (input.length > 30000) input = input.slice(0, 30000);
  // We delimit extracted [code] blocks with NUL bytes below. NUL can't come
  // from an HTML form, but a hand-crafted API request could send one, so strip
  // any first, that makes it impossible for user text to collide with, or
  // break out of, a placeholder.
  input = input.replace(/\x00/g, '');

  // (0) pull [code] blocks out so nothing inside them is ever transformed
  const codes = [];
  let text = input.replace(/\[code\]([\s\S]*?)\[\/code\]/gi, (_, body) => {
    codes.push(body);
    return `\x00${codes.length - 1}\x00`;
  });

  // (1) escape everything, this is the security boundary
  text = escapeHtml(text);

  // (2) smilies, on the escaped text, before any tag is generated. Running this
  // after inline tags let a smiley code sitting inside a URL inject the <img>
  // template's quotes/brackets into an href/src attribute; here it can't.
  text = renderSmilies(text, assetBase);

  // (3) line breaks: collapse 3+ blank lines to 2, then \n -> <br>
  text = text.replace(/(\r?\n){3,}/g, '\n\n').replace(/\r?\n/g, '<br>\n');

  // (4) block tags (quote, spoiler), depth-limited
  text = transformBlocks(text);

  // (5) inline tags
  text = transformInline(text, assetBase);

  // restore [code] blocks, escaped and verbatim, in a mono box. The ?? '' is a
  // belt to the NUL-stripping suspenders: a stray placeholder can never crash.
  text = text.replace(/\x00(\d+)\x00/g, (_, i) =>
    `<pre class="rs-dos"><code>${escapeHtml(codes[Number(i)] ?? '')}</code></pre>`);

  return text;
}

function transformBlocks(text, depth = 0) {
  if (depth > MAX_DEPTH) return text;
  let out = text;

  // [quote=author] ... [/quote]  and  [quote] ... [/quote]
  out = out.replace(/\[quote(?:=([^\]]*))?\]([\s\S]*?)\[\/quote\]/gi, (_, who, body) => {
    const src = who ? `<span class="rs-quote__source">${who} wrote:</span>` : '';
    return `<blockquote class="rs-quote">${src}<div class="rs-quote__body">${transformBlocks(body, depth + 1)}</div></blockquote>`;
  });

  // [spoiler] ... [/spoiler] -> native details, works without JS
  out = out.replace(/\[spoiler\]([\s\S]*?)\[\/spoiler\]/gi, (_, body) =>
    `<details class="rs-spoiler"><summary>spoiler</summary><div>${transformBlocks(body, depth + 1)}</div></details>`);

  // if we changed anything and there are still block tags, recurse
  if (out !== text && /\[(quote|spoiler)/i.test(out)) return transformBlocks(out, depth + 1);
  return out;
}

function transformInline(text, assetBase) {
  let out = text;
  // simple inline pairs
  out = out.replace(/\[b\]([\s\S]*?)\[\/b\]/gi, '<strong>$1</strong>');
  out = out.replace(/\[i\]([\s\S]*?)\[\/i\]/gi, '<em>$1</em>');
  out = out.replace(/\[u\]([\s\S]*?)\[\/u\]/gi, '<span style="text-decoration:underline">$1</span>');
  out = out.replace(/\[s\]([\s\S]*?)\[\/s\]/gi, '<span style="text-decoration:line-through">$1</span>');

  // [url=href]text[/url]  and  [url]href[/url]. href/label/u are ALREADY escaped by step (1)
  // above, so they go in verbatim: re-escaping here would double-encode `&` and corrupt real
  // query-string links. safeUrl also pins the scheme to http(s).
  out = out.replace(/\[url=([^\]]+)\]([\s\S]*?)\[\/url\]/gi, (m, href, label) => {
    const u = safeUrl(href);
    return u ? `<a href="${u}" rel="nofollow ugc">${label}</a>` : m;
  });
  out = out.replace(/\[url\]([\s\S]*?)\[\/url\]/gi, (m, href) => {
    const u = safeUrl(href.replace(/<br>\n?/g, ''));
    return u ? `<a href="${u}" rel="nofollow ugc">${u}</a>` : m;
  });

  // [img]https://...[/img], https only, clamped, lazy (u already escaped at step 1)
  out = out.replace(/\[img\]([\s\S]*?)\[\/img\]/gi, (m, src) => {
    const u = safeUrl(src.replace(/<br>\n?/g, ''));
    return u && /^https:/i.test(u)
      ? `<img src="${u}" alt="" loading="lazy" style="max-width:100%;max-height:480px">`
      : m;
  });

  // [color=...], Palette Law only, else literal
  out = out.replace(/\[color=([^\]]+)\]([\s\S]*?)\[\/color\]/gi, (m, color, body) => {
    const c = legalColor(color);
    return c ? `<span style="color:${c}">${body}</span>` : m;
  });

  return out;
}

function renderSmilies(text, assetBase) {
  // longest codes first so :-) beats :)
  const codes = Object.keys(SMILIES).sort((a, b) => b.length - a.length);
  const escaped = codes.map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const re = new RegExp(`(^|[\\s>])(${escaped.join('|')})(?=[\\s<]|$)`, 'g');
  // the size lives in the style too: the framework reset's img { height: auto }
  // would otherwise squash the 15px crop to the sheet's aspect ratio
  return text.replace(re, (m, pre, code) =>
    `${pre}<img class="rs-smiley" src="${assetBase}/smilies.png" alt="${escapeHtml(code)}" width="15" height="15" style="inline-size:15px;block-size:15px;object-fit:none;object-position:-${frameX(code)}px 0;vertical-align:-3px">`);
}

const FRAME = { smile: 0, sad: 1, wink: 2, grin: 3, tongue: 4, surprise: 5, cool: 6, catface: 10, happy: 11 };
function frameX(code) { return (FRAME[SMILIES[code]] || 0) * 15; }

export { legalColor, safeUrl }; // exported for the test
