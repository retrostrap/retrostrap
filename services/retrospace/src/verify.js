// verify.js, the retrospace-check (docs/12). Given a page's HTML, it reports,
// with evidence, whether the site uses retrostrap or at least looks the part,
// and whether it keeps the decency rules. It scores and advises; it NEVER
// auto-admits. A human reads the evidence and decides. The legal palette is
// imported from the framework so there is one source of truth.
import { LEGAL_HEX } from '../../../src/js/core/palette.js';

const LEGAL = new Set(LEGAL_HEX.map((h) => h.toUpperCase()));

// script/host signatures for the things the decency rule forbids
// a blocklist, not an oracle, it catches the common cases; a human catches the rest
const TRACKERS = [
  /google-analytics\.com/i, /googletagmanager\.com/i, /doubleclick\.net/i,
  /connect\.facebook\.net/i, /hotjar\.com/i, /mixpanel\.com/i, /segment\.(com|io)/i,
  /matomo/i, /clarity\.ms/i, /\bfbq\s*\(/i, /\bgtag\s*\(/i, /\b_paq\b/i,
];

const expandHex = (h) => {
  const u = h.toUpperCase();
  return u.length === 4 ? '#' + [...u.slice(1)].map((c) => c + c).join('') : u;
};

/** Check a page's HTML. Returns { score, verdict, checks }. verdict is advice. */
export function checkSite(html, { url } = {}) {
  // The scoring signals (classes, palette, trackers) live in the first stretch
  // of any page; cap the input so the era-check regexes can't be walked into a
  // quadratic hang by a malformed, unclosed-tag submission. Advisory only.
  const src = String(html || '').slice(0, 50000);

  const usesAsset = /retrostrap(-toybox)?(\.min)?\.(css|js)/i.test(src);
  const usesClasses = /class\s*=\s*["'][^"']*\brs-/i.test(src);
  const usesTokens = /--rs-[a-z]/i.test(src);
  const retrostrap = usesAsset || usesClasses || usesTokens;

  // hex is checked against the legal set; a colour we can't confirm (an rgb()/hsl()
  // function, or an 8-digit alpha hex) is unverified, not a free pass
  const hexes = (src.match(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g) || []).map(expandHex);
  const alphaHex = /#[0-9a-fA-F]{8}\b/i.test(src);
  const colourFn = /(?:rgb|hsl|hwb|lab|lch|oklab|oklch)a?\s*\(/i.test(src);
  const legalCount = hexes.filter((h) => LEGAL.has(h)).length;
  const paletteOk = !alphaHex && !colourFn && (hexes.length === 0 || legalCount / hexes.length >= 0.8);

  // a media element plus an autoplay attribute token anywhere, no length window to
  // walk past with a long attribute, and both tests are linear (ReDoS-safe under the cap)
  const autoplay = (/<(?:audio|video)\b/i.test(src) && /\bautoplay(?=[\s=>/]|$)/i.test(src)) || /<bgsound\b/i.test(src);
  const tracker = TRACKERS.find((re) => re.test(src));
  const decencyOk = !autoplay && !tracker;

  const text = src
    .replace(/<script[\s\S]{0,20000}?<\/script>/gi, ' ')
    .replace(/<style[\s\S]{0,20000}?<\/style>/gi, ' ')
    .replace(/<[^>]{1,2000}>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const noJsOk = text.length >= 200 || /<noscript[\s>]/i.test(src);

  const roundedRadius = /border-radius\s*:\s*[^;}"']*[1-9]/i.test(src);
  const blurredShadow = /box-shadow\s*:[^;}"']*?\b\d+(?:\.\d+)?(?:px|em|rem)?\s+-?\d+(?:\.\d+)?(?:px|em|rem)?\s+([1-9])/i.test(src);
  const eraOk = !roundedRadius && !blurredShadow;

  const checks = {
    retrostrap: { ok: retrostrap, note: usesAsset ? 'links retrostrap' : usesClasses ? 'uses rs- classes' : usesTokens ? 'uses --rs- tokens' : 'no retrostrap detected' },
    palette: { ok: paletteOk, note: alphaHex ? 'uses alpha (8-digit) hex' : colourFn ? 'uses rgb()/hsl() colour functions' : hexes.length ? `${legalCount}/${hexes.length} colours legal` : 'no explicit colours' },
    decency: { ok: decencyOk, note: autoplay ? 'autoplay media' : tracker ? `tracker: ${tracker.source}` : 'clean' },
    noJs: { ok: noJsOk, note: noJsOk ? 'real content in the markup' : 'looks like a blank JS mount' },
    era: { ok: eraOk, note: roundedRadius ? 'rounded corners' : blurredShadow ? 'blurred shadow' : 'era-plausible' },
  };

  const score = (retrostrap ? 40 : 0) + (paletteOk ? 20 : 0) + (decencyOk ? 20 : 0) + (noJsOk ? 10 : 0) + (eraOk ? 10 : 0);

  // a pass requires the hard admission rules to actually hold, a retrostrap class
  // alone can't carry a blank JS mount or an off-palette page over the line
  const strong = retrostrap && paletteOk && noJsOk;
  let verdict;
  if (!decencyOk) verdict = 'fail'; // decency is non-negotiable, whatever else is true
  else if (strong && score >= 80) verdict = 'pass';
  else if (score >= 60) verdict = 'review'; // plausible; a human should look
  else verdict = 'fail';

  return { score, verdict, checks, url: url || null };
}
