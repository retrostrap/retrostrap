// The BBCode parser is a security boundary (docs/11 §7). These tests care most
// about what must NEVER happen: no raw HTML, no dangerous URLs, no tag smuggled
// through [code]. Then the happy path.
import { describe, it, expect } from 'vitest';
import { bbcodeToHtml, legalColor, safeUrl } from '../src/bbcode.js';

describe('bbcode, the security boundary', () => {
  it('escapes all raw HTML', () => {
    const out = bbcodeToHtml('<script>alert(1)</script> & <b>not bold</b>');
    expect(out).not.toContain('<script>');
    expect(out).toContain('&lt;script&gt;');
    expect(out).toContain('&amp;');
    expect(out).toContain('&lt;b&gt;'); // literal, not a real <b>
  });

  it('rejects dangerous url schemes, keeping the tag literal', () => {
    expect(bbcodeToHtml('[url=javascript:alert(1)]x[/url]')).toContain('[url=javascript:alert(1)]');
    expect(bbcodeToHtml('[url=data:text/html,evil]x[/url]')).toContain('[url=data:');
    const ok = bbcodeToHtml('[url=https://good.example]hi[/url]');
    expect(ok).toContain('href="https://good.example"');
    expect(ok).toContain('rel="nofollow ugc"');
  });

  it('img allows https only and clamps size', () => {
    expect(bbcodeToHtml('[img]http://x.example/a.png[/img]')).toContain('[img]'); // http rejected
    const ok = bbcodeToHtml('[img]https://x.example/a.png[/img]');
    expect(ok).toContain('<img src="https://x.example/a.png"');
    expect(ok).toContain('loading="lazy"');
    expect(ok).toContain('max-height:480px');
  });

  it('keeps [code] verbatim, no tag inside it is ever transformed', () => {
    const out = bbcodeToHtml('[code][b]not bold[/b] <script>x</script> :)[/code]');
    expect(out).toContain('[b]not bold[/b]'); // BBCode not applied
    expect(out).toContain('&lt;script&gt;'); // HTML still escaped
    expect(out).not.toContain('<img'); // smiley not applied inside code
    expect(out).toContain('<pre class="rs-dos"><code>');
  });

  it('cannot be crashed or fooled by the internal code placeholder', () => {
    // the parser delimits extracted [code] with NUL bytes; user text must never
    // collide with that, and a hand-crafted NUL must never crash the render.
    expect(() => bbcodeToHtml('look: \x000\x00 here')).not.toThrow();       // raw NUL, no code block
    expect(bbcodeToHtml('look: \x000\x00 here')).not.toContain('\x00');      // no NUL leaks out
    // a real block plus an attacker's NUL sequence: the block renders once,
    // the injected sequence cannot re-emit it
    const out = bbcodeToHtml('[code]SECRET[/code] then \x000\x00 done');
    expect((out.match(/SECRET/g) || []).length).toBe(1);
    expect(out).not.toContain('\x00');
    // the old space-delimited shape is now just text
    expect(bbcodeToHtml(' CODE0 ')).toBe(' CODE0 ');
    expect(() => bbcodeToHtml('CODE9999')).not.toThrow();
  });

  it('color honors the Palette Law', () => {
    expect(bbcodeToHtml('[color=#FF0000]red[/color]')).toContain('style="color:#FF0000"');
    expect(bbcodeToHtml('[color=navy]n[/color]')).toContain('style="color:#000080"');
    // off-palette salmon renders as literal text, not a color span
    expect(bbcodeToHtml('[color=#FA8072]x[/color]')).toContain('[color=#FA8072]');
  });
});

describe('bbcode, the happy path', () => {
  it('renders the basic inline tags', () => {
    expect(bbcodeToHtml('[b]bold[/b] [i]em[/i]')).toBe('<strong>bold</strong> <em>em</em>');
  });

  it('renders quotes with attribution', () => {
    const out = bbcodeToHtml('[quote=mika]radius 0[/quote]');
    expect(out).toContain('rs-quote');
    expect(out).toContain('mika wrote:');
    expect(out).toContain('radius 0');
  });

  it('renders spoilers as native details', () => {
    expect(bbcodeToHtml('[spoiler]secret[/spoiler]')).toContain('<details class="rs-spoiler">');
  });

  it('turns smilies into images with the code as alt', () => {
    const out = bbcodeToHtml('hello :) world');
    expect(out).toContain('class="rs-smiley"');
    expect(out).toContain('alt=":)"');
  });

  it('converts newlines to <br> and collapses runs', () => {
    expect(bbcodeToHtml('a\nb')).toContain('a<br>');
    expect((bbcodeToHtml('a\n\n\n\nb').match(/<br>/g) || []).length).toBeLessThanOrEqual(2);
  });

  it('stops runaway nesting', () => {
    const deep = '[quote]'.repeat(20) + 'x' + '[/quote]'.repeat(20);
    expect(() => bbcodeToHtml(deep)).not.toThrow();
  });
});

describe('helpers', () => {
  it('legalColor maps names and validates hex', () => {
    expect(legalColor('navy')).toBe('#000080');
    expect(legalColor('#33CC99')).toBe('#33CC99');
    expect(legalColor('#FA8072')).toBeNull();
  });
  it('safeUrl passes http(s) and rejects the rest', () => {
    expect(safeUrl('https://x.example')).toBe('https://x.example');
    expect(safeUrl('https://x.example/a?b=1#c')).toBe('https://x.example/a?b=1#c'); // query + fragment ok
    expect(safeUrl('javascript:alert(1)')).toBeNull();
    expect(safeUrl('https://x.example :) ')).toBeNull();  // whitespace (a smuggled smiley) rejected
    expect(safeUrl('https://x"onerror=y')).toBeNull();    // quote rejected
  });
  it('renders a [url] literally when its target holds a smiley (no broken tag)', () => {
    const html = bbcodeToHtml('[url=https://x.example :) ]hi[/url]');
    expect(html).not.toContain('<a '); // no anchor built from the polluted target
    expect(html).toContain('[url='); // the tag renders literally instead
  });
  it('accepts 3-digit hex shorthand for legal web-safe colors', () => {
    expect(legalColor('#0C0')).toBe('#00CC00');
    expect(legalColor('#F00')).toBe('#FF0000');
    expect(legalColor('#ABC')).toBeNull(); // #AABBCC is not web-safe even expanded
  });
  it('keeps a smiley inside a URL out of the href attribute', () => {
    const html = bbcodeToHtml('[url=https://x.example]hi :) ok[/url]');
    expect(html).toMatch(/href="https:\/\/x\.example"/); // clean href
    expect(html).not.toMatch(/href="[^"]*rs-smiley/); // no <img> smuggled into the attribute
    expect(html).toContain('rs-smiley'); // the smiley still renders, in the link text
  });
  it('knows the cat face and the happy face, and points at the real sheet', () => {
    const html = bbcodeToHtml('hello :3 and ^_^');
    expect(html).toContain('alt=":3"');
    expect(html).toContain('object-position:-150px 0');  // frame 10
    expect(html).toContain('alt="^_^"');
    expect(html).toContain('object-position:-165px 0');  // frame 11
    expect(html).toContain('src="/dist/assets/smilies.png"'); // where views.js CDN serves it
    expect(html).toContain('inline-size:15px;block-size:15px'); // survives the img height:auto reset
  });
});
