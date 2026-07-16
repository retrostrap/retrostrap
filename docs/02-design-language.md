# The retrostrap design language

This document is the constitution. When any other doc, component, theme, demo or code
comment disagrees with this one, **this one wins.** Its job is to define the *sane limits*
that make everything built with retrostrap look like 1996-2003 instead of like a modern
site wearing a costume.

The historical justification for every rule here lives in
[01-history-research.md](01-history-research.md). This doc only states the rules.

Contents: [The five laws](#the-five-laws) · [Color](#1-color-the-palette-law) ·
[Typography](#2-typography-the-font-law) · [Shape](#3-shape-the-shape-law) ·
[Motion](#4-motion-the-motion-law) · [Decency](#5-decency-the-decency-law) ·
[Spacing](#spacing) · [Borders and bevels](#borders-and-bevels) ·
[Backgrounds and tiles](#backgrounds-and-tiles) · [Layout](#layout-system) ·
[Iconography](#iconography-and-pixel-art) · [Z-axis](#the-z-axis) ·
[Token reference](#token-reference) · [Enforcement](#enforcement) ·
[Anti-patterns](#the-anti-pattern-gallery) · [Authenticity checklist](#the-era-authenticity-checklist)

---

## The five laws

1. **Palette Law**: every UI color is one of the 216 web-safe colors or the 16 classic
   HTML named colors. UI colors are fully opaque.
2. **Font Law**: only the nine sanctioned font stacks; only the seven sanctioned sizes.
   No `@font-face` in core.
3. **Shape Law**: `border-radius: 0`, everywhere, always. Decorative rounding is done
   with pixel-art `border-image` assets, the way it was done with corner GIFs in 2002.
4. **Motion Law**: UI animation uses only `linear` or `steps()` easing. Blink is 1 Hz.
   Marquee runs at 30/60/120 px/s. Everything honors `prefers-reduced-motion`.
5. **Decency Law**: no autoplaying audio (not even as an option), no tracking or
   analytics, no network calls from shipped code except those the page author explicitly
   configures, and every styled component works without JavaScript.

The laws are machine-checkable. `Retrostrap.audit()` (dev tool) and the
stylelint-retrostrap plugin flag violations. A machine-readable copy ships as
`dist/guardrails.json` (spec in [03-architecture.md](03-architecture.md)).

---

## 1. Color: the Palette Law

### The legal colors

**The web-safe 216.** Every channel of every color must be one of `00`, `33`, `66`, `99`,
`CC`, `FF`. That's 6 × 6 × 6 = 216 colors, the palette that rendered without dithering
on 256-color displays, and the reason the old web looked the way it did.

**Plus the named 16.** The HTML 3.2 named colors, several of which are *not* web-safe but
are indispensable to the era (silver is the color of every button ever pressed in the 90s):

| Name | Hex | Name | Hex |
| --- | --- | --- | --- |
| black | `#000000` | green | `#008000` |
| silver | `#C0C0C0` | lime | `#00FF00` |
| gray | `#808080` | olive | `#808000` |
| white | `#FFFFFF` | yellow | `#FFFF00` |
| maroon | `#800000` | navy | `#000080` |
| red | `#FF0000` | blue | `#0000FF` |
| purple | `#800080` | teal | `#008080` |
| fuchsia | `#FF00FF` | aqua | `#00FFFF` |

That's the entire legal color space: **224 distinct values** (216 on the cube + the 8
named colors that live off it). Nothing else, no exceptions, no `oklch()`, no brand
colors "just this once."

### Alpha and gradients

- UI colors (text, backgrounds, borders) are **opaque**. Transparency reads as modern.
- Alpha is permitted **only** inside canvas/particle effects (a snowflake may fade as it
  melts) and for the fade-out of decorative overlays. Never on panels, never on text.
- Gradients: `linear-gradient` only, in two flavors:
  - **Simple**: exactly two stops, both legal colors (the classic title-bar fade).
  - **Banded**: hard stops every N pixels simulating 8-bit dither bands (the y2k chrome
    look). There is no gradient token; presets ship as component classes
    (`rs-gradient-text--fire/ice/toxic`) and as theme recipes, and hand-rolled banded
    gradients must use only legal colors.
- No radial, conic, or mesh gradients in UI. Two fenced exemptions, both hard-stop and
  palette-legal: pixel-art *assets*, and the tile pack's checker (conic) and dots
  (radial) tiles. Never a smooth blend.

### Usage rules

- Links are always underlined, and `:visited` must render differently from unvisited.
  The visited-purple is sacred. Default pair: `#0000FF` / `#660099`.
- Muted text is `#666666` (never `rgba(0,0,0,.6)`); `#808080` is reserved for disabled
  controls only, the [contrast matrix](08-accessibility-performance.md#the-contrast-matrix)
  measured it below AA for body text and demoted it.
- Selection color is themed (`--rs-selection-bg/text`), a detail everyone notices.
- Contrast: the accessibility doc ([08](08-accessibility-performance.md)) maintains a
  computed contrast matrix per theme. A theme may not ship a body-text pair below WCAG AA.
  The palette is small; the matrix keeps us honest inside it.

---

## 2. Typography: the Font Law

### The nine stacks

Themes and components may reference **only** these tokens. No other `font-family` value
may appear anywhere in retrostrap CSS.

| Token | Stack | Era role |
| --- | --- | --- |
| `--rs-font-serif` | `"Times New Roman", Times, serif` | the browser default look, 1996 |
| `--rs-font-sans` | `Verdana, Geneva, "DejaVu Sans", sans-serif` | the webmaster's favorite |
| `--rs-font-narrow` | `Tahoma, "Segoe UI", Geneva, sans-serif` | system dialogs |
| `--rs-font-arial` | `Arial, Helvetica, sans-serif` | the default sans |
| `--rs-font-comic` | `"Comic Sans MS", "Comic Neue", "Chalkboard SE", cursive` | personal pages, kawaii |
| `--rs-font-mono` | `"Courier New", Courier, monospace` | code, terminals, ASCII art |
| `--rs-font-display` | `Impact, "Arial Black", Haettenschweiler, sans-serif` | headers that SHOUT |
| `--rs-font-fancy` | `Georgia, "Times New Roman", serif` | the "elegant" serif |
| `--rs-font-trebuchet` | `"Trebuchet MS", Tahoma, sans-serif` | late-90s "modern" |

No web fonts in core, the era's fonts were whatever the machine had, and that's also a
0 KB download. If a pixel-font pack ever ships, it would be an optional, self-hosted
add-on, never a core dependency.

### The seven sizes

The old `<font size="1..7">` scale, resurrected as tokens. Values are rem under the hood
(so browser zoom and user font settings keep working) but are named and documented in px:

| Token | px | rem | Old world | Typical use |
| --- | --- | --- | --- | --- |
| `--rs-font-size-1` | 10 | 0.625 | `size=1` | fine print, counters, footers |
| `--rs-font-size-2` | 13 | 0.8125 | `size=2` | body text (sans themes), h5 |
| `--rs-font-size-3` | 16 | 1.0 | `size=3` | body text (serif themes), h4 |
| `--rs-font-size-4` | 18 | 1.125 | `size=4` | h3, lead paragraphs |
| `--rs-font-size-5` | 24 | 1.5 | `size=5` | h2 |
| `--rs-font-size-6` | 32 | 2.0 | `size=6` | h1, welcome banners |
| `--rs-font-size-7` | 48 | 3.0 | `size=7` | splash pages, WordArt-adjacent |

Utility classes `rs-font-1` … `rs-font-7` expose the scale directly, in loving memory of
`<font size="7">`.

### Rules

- Heading map (defaults): h1-h6 walk the ladder 6 · 5 · 4 · 3 · 2 · 1, all bold, h6 in
  caps, the browsers' own old default mapping, which is the whole point. Heading
  margins stay the UA's em-scaled defaults.
- Line-height: `1.4` everywhere, headings included; comfy mode raises it to 1.5. (The
  era used ~1.2; 1.4 is an invisible modernization we allow ourselves.)
- No `letter-spacing` except `rs-typewriter` and the `rs-construction` tape (both +1px).
  No `font-weight` values besides normal and bold, the era had two weights and so do we.
- No fluid `clamp()` typography. Sizes may step at breakpoints, never slide.
- **Comfy mode:** the `rs-comfy` class on `<html>` bumps body text one step up the scale
  and line-height to 1.5. Authentically tiny by default, mercifully readable on demand.
  Demos and the docs site expose the toggle.

---

## 3. Shape: the Shape Law

- `border-radius: 0` on every element, in every theme, forever. There is deliberately no
  radius token, so there is nothing to override.
- Rounded corners, scallops, and pill shapes are achieved **only** with `border-image`
  pixel assets (9-slice), exactly like the corner-GIF hacks of 2002. The kawaii theme's
  scalloped panels work this way.
- Box shadows and text shadows must have **blur radius 0**: hard offsets only.
  - Sanctioned shadow recipes: `--rs-shadow-hard: 2px 2px 0` (+ legal color) and the bevel
    system below. Text may use `1px 1px 0` / `2px 2px 0` offsets (the classic "3D text").
- No `filter: drop-shadow()`, no `backdrop-filter`, no blur of any kind in UI. (Canvas
  decorations may glow; panels may not.)

---

## 4. Motion: the Motion Law

- **Easing whitelist:** `linear` and `steps(n)`. Nothing else. One `ease-in-out` and the
  whole page feels like 2015, this single rule carries enormous weight.
- UI transition durations: `0ms`, `100ms`, or `150ms`. Anything slower reads as modern
  choreography. State changes of the era were instant; we allow 100-150ms as a concession
  to comprehension, linear only.
- **Blink:** `steps(1)` opacity toggle at 1 Hz (on 0.5s / off 0.5s). 1 flash/second is
  well under the 3/s photosensitivity threshold. Under reduced motion, blink renders as
  bold + underline instead (emphasis survives, motion doesn't).
- **Marquee:** three speeds, slow 30 px/s, normal 60 px/s, fast 120 px/s. Pauses on hover
  and on focus-within. Under reduced motion it renders as static, fully wrapped text.
- Sprite animations use `steps()` over sprite sheets (that's what makes GIF-style motion
  crisp). Frame rates 2-12 fps, era GIFs were slow.
- Decorative canvas widgets (snow, trails, starfield) may use smooth per-frame physics,
  smoothness was authentic *for those* (see research doc), but obey budgets and
  reduced-motion policy defined in [08](08-accessibility-performance.md) and
  [05-widgets.md](05-widgets.md).
- Nothing may flash more than 3 times per second. Party mode included.

---

## 5. Decency: the Decency Law

- **No autoplaying audio.** The jukebox has no autoplay option. This is not configurable;
  it is the one piece of the era we refuse to revive.
- **No tracking.** No analytics, no fingerprinting, no beacons, no external requests from
  shipped CSS/JS. The hit-counter API spec explicitly forbids storing identifiers.
- **Progressive enhancement.** Every CSS component is complete and usable with JavaScript
  disabled. Widgets are decoration on top, never load-bearing.
- **Decoration never obstructs.** Toybox overlays are `pointer-events: none` (except
  explicitly interactive ones like windows), `aria-hidden="true"`, and respect the z-band
  system below. The cat walks *behind* your dialog.
- Popups (the fake-window kind) are opt-in, capped, always closable, and default off.

---

## Spacing

Pixel-based, tight, and small, era pages were dense. The scale:

| Token | Value | Era feel |
| --- | --- | --- |
| `--rs-space-0` | 0 | table cells touching |
| `--rs-space-1` | 2px | `cellpadding=2` |
| `--rs-space-2` | 4px | `cellpadding=4` |
| `--rs-space-3` | 8px | comfortable panel padding |
| `--rs-space-4` | 16px | section gaps |
| `--rs-space-5` | 32px | big page breaks |

Utilities: `rs-pad-0..5`, `rs-gap-0..5`, `rs-mt-0..5`, `rs-mb-0..5`. The utility set is
deliberately tiny, retrostrap is a component framework, not an atomic-CSS framework;
generous whitespace is one of the strongest "modern" tells and we do not make it easy.

Touch targets: interactive elements may *look* tiny but must *hit* at ≥ 44×44px via
invisible pseudo-element extension (recipe in [08](08-accessibility-performance.md)).

## Borders and bevels

The forgotten border styles are first-class citizens:

- Widths: `1px` or `2px` (`--rs-border-1/2`). Nothing wider except `ridge`/`groove` HRs.
- Styles celebrated: `solid`, `dashed`, `dotted`, `double`, `inset`, `outset`, `ridge`,
  `groove`. (When did you last see a legitimate `groove`? You'll see plenty here.)
- **The bevel recipe**: the load-bearing 3D look of every era button and panel:

```css
/* raised (buttons, toolbars, windows) */
border: 2px solid;
border-color: var(--rs-bevel-light) var(--rs-bevel-dark)
              var(--rs-bevel-dark) var(--rs-bevel-light);
background: var(--rs-bevel-face);
/* sunken (inputs, wells, statusbar cells): swap light and dark */
```

Default bevel tokens: face `#C0C0C0` (silver), light `#FFFFFF`, shadow `#808080`,
dark `#000000`. Themes may retint within the palette (phosphor bevels are greens).
Active/pressed state = sunken + 1px content nudge down-right. That nudge is
non-negotiable; it is 50% of what makes a button feel 1998.

## Backgrounds and tiles

The tiled background is the wallpaper of the era and a pillar of the look.

- The **page** (body) carries a tile or flat color; **content** sits on an opaque sheet
  (`rs-page` on top of the tile, the "centered table on a starfield" anatomy).
- Tile pack (opt in with `rs-tile-*`, shipped in `retrostrap-patterns.css`). CSS-only, a
  gradient apiece and no bytes: `checker`, `grid`, `blueprint`, `scanlines`, `dither`,
  `dots`, `candy`, `hazard`, `brick`, `zigzag`. Pixel-art from the asset pipeline:
  `stars`, `hearts`, `confetti`, `clouds`, `paws`.
- Tiles are small (8-64px square), low-color, and must tile seamlessly. All original
  pixel art from our asset pipeline ([03](03-architecture.md)).
- Sparkle/twinkle overlays are the `sparkle` widget's job, not the CSS tile's.

## Layout system

Modern responsive behavior wearing an 800×600 costume. Mobile-first CSS.

- **Breakpoints** (min-width), named after the monitors:
  vga 640px · svga 800px · xga 1024px · sxga 1280px. Not tokens: custom properties
  cannot live in media queries, so the numbers appear literally in the CSS, each with its
  monitor comment (documented in `00-tokens.css`). The built-in recipes lean on vga and
  svga; xga and sxga are the naming scheme for the wider breakpoints you write yourself.
- **Containers:** `rs-container` maxes at **760px** (the classic "designed for 800×600"
  content width) and centers; `rs-container--wide` maxes at 1000px; `rs-container--fluid`
  is 100%. Below its max, every container is fluid, that's the modern part.
- **Layout recipes** instead of a generic 12-column grid. Era pages had shapes, not grids:
  - `rs-layout--sidebar-left` / `--sidebar-right`: nav column (180px) + content.
  - `rs-layout--holy-grail`: header / left nav / content / right rail / footer.
  - `rs-layout--three-col`: the portal look.
  - `rs-frames`: frameset cosplay: fixed side pane + independently scrolling main pane
    on desktop; stacked with a sticky nav strip on mobile.
  - `rs-cols-2/3/4`: equal columns for badge walls and link farms.
  - All recipes collapse to a single column below `svga` (800px). Order: nav after
    content in source (a11y), repositioned visually by grid areas.
- `rs-center` exists, works, and is culturally load-bearing. `<center>` walked so we
  could run.
- `rs-spacer--1..5` is a vertical spacer div. It is named in memory of `spacer.gif` and
  the docs will say so.

## Iconography and pixel art

- Grid: icons 16×16 (the award medallion runs 30×30), smilies 15×15, cat and pet
  sprites 16×16, the kugeln 24×24, cursors 12×18 and 14×18, tiles 8-64px.
- Style: 1px black (or darkest-legal) outline, flat fills from the legal palette, no
  anti-aliasing, crisp pixels or nothing.
- Scaling: integer factors only, always with `image-rendering: pixelated`
  (`rs-pixelated` utility). A 16px icon may render at 32 or 48, never at 24.
- All assets are original work compiled from JSON pixel grids (pipeline in
  [03](03-architecture.md)). **No traced, ripped, or trademarked art. Homages are
  redrawn from scratch and differ in detail.**
- `rs-avatar` renders user images at 80×80 with `image-rendering: pixelated`: modern
  photos instantly read as era avatars.

## The z-axis

Small, human-readable z-index bands. Nothing above 600. No z-index wars.

| Token | Value | Occupants |
| --- | --- | --- |
| `--rs-z-raised` | 10 | tooltips' anchors, dropdown triggers |
| `--rs-z-sticky` | 100 | sticky navs, `rs-frames` side pane |
| `--rs-z-menu` | 200 | open menus, tooltips |
| `--rs-z-window` | 300 | draggable `rs-window`s |
| `--rs-z-dialog` | 400 | modal dialogs (native `<dialog>` sits in top layer anyway) |
| `--rs-z-splash` | 500 | splash/intro screens |
| `--rs-z-fx` | 600 | cursor trails, snow, sparkles, the cat |

Decoration on top of chrome, chrome on top of content, but decoration is
`pointer-events: none`, so it can never *block* anything it overlaps.

## Token reference

The complete theme contract. A theme is exactly: values for these tokens + a whitelisted
set of component skin overrides ([07-theming.md](07-theming.md)). Nothing else.

```css
:root {
  /* identity */
  --rs-theme: "classic";

  /* page & content */
  --rs-bg-page: #C0C0C0;          /* body: flat color or tile fallback   */
  --rs-tile-page: none;           /* flat/none; IMAGE tiles use a direct  */
                                  /* body rule in the theme, not this     */
                                  /* token, a relative url() inside a    */
                                  /* custom property does not resolve      */
                                  /* portably across browsers. See doc 07. */
  --rs-bg-content: #FFFFFF;       /* the content sheet                   */
  --rs-text: #000000;
  --rs-text-muted: #666666;      /* #808080 is disabled-only, see doc 08 */
  --rs-heading: #000000;

  /* links (always underlined; visited MUST differ) */
  --rs-link: #0000FF;
  --rs-link-visited: #660099;
  --rs-link-active: #FF0000;

  /* accents & state */
  --rs-accent: #000080;
  --rs-accent-2: #008080;
  --rs-good: #008000;
  --rs-warn: #808000;
  --rs-bad: #FF0000;

  /* bevel system */
  --rs-bevel-face: #C0C0C0;
  --rs-bevel-light: #FFFFFF;
  --rs-bevel-shadow: #808080;
  --rs-bevel-dark: #000000;

  /* window/panel chrome */
  --rs-titlebar-bg: #000080;
  --rs-titlebar-bg-2: #000080;    /* second stop of the 2-stop fade      */
  --rs-titlebar-text: #FFFFFF;
  --rs-border-color: #808080;

  /* selection & focus */
  --rs-selection-bg: #000080;
  --rs-selection-text: #FFFFFF;
  --rs-focus-color: #000000;      /* the dotted outline                  */

  /* type */
  --rs-font-body: var(--rs-font-serif);
  --rs-font-heading: var(--rs-font-serif);
  --rs-font-size-body: var(--rs-font-size-3);

  /* shadows */
  --rs-shadow-hard: 2px 2px 0 #808080;
}
```

Plus the global (non-theme) tokens defined above: the nine font stacks, the seven sizes,
spacing 0-5, borders 1-2, and the z-band. (Breakpoints are literals, not tokens; see the
layout section.) Full annotated listing ships in `src/css/00-tokens.css` and
`dist/manifest.json`.

## Enforcement

Guardrails you can run, not just read:

1. **`Retrostrap.audit()`** (dev API, spec in [06](06-javascript-api.md)) walks computed
   styles of `rs-` elements and warns on: off-palette colors, non-zero radii, blurred
   shadows, illegal easing, illegal font families, missing underline on links, translucent
   UI colors. Output is a console table + a JSON report (CI-consumable via Playwright).
2. **`dist/guardrails.json`**: the laws as data (legal colors array, font stacks, easing
   whitelist, size scale, budgets) so external tools and assistants can validate without
   parsing prose.
3. **stylelint-retrostrap** (ships in `tools/`, covered by the unit suite), the same
   checks at lint time for people building sites with their own extra CSS.
4. **The escape hatch policy:** we cannot stop anyone from writing their own CSS on top,
   and we don't try. The deal: stay inside `rs-` vocabulary and the audit, and your site
   is era-true; fight it, and you're on your own. Documented as "Here be dragons."

## The anti-pattern gallery

The fastest ways to accidentally look modern, each forbidden or fenced by the laws:

| Modern tell | Why it breaks the spell | Do instead |
| --- | --- | --- |
| Soft drop shadows | screams 2014 material | hard 2px offset or a bevel |
| Rounded corners | screams 2010 | Shape Law: 0; border-image scallops |
| Generous whitespace | modern editorial rhythm | tight `--rs-space-1..3`, dense tables |
| `ease-in-out` everything | modern choreography | instant, or 100ms linear |
| Thin/variable fonts | didn't exist on the desktop | two weights, nine stacks |
| Desaturated pastel palettes | Tailwind-era default | legal palette only, saturated or gray |
| Full-bleed hero sections | 2016 landing page | 760px sheet on a tiled page |
| Skeleton loaders | modern async theater | hourglass `rs-loading`, instantly |
| Glassmorphism/blur | physically impossible in 1999 | opaque panels, bevels |
| Toast notifications sliding in | modern | `rs-alert` bar or a system dialog |
| Infinite scroll | modern engagement tech | `rs-pagination`: `[1] 2 3 ... Next>` |
| Emoji in UI copy | wrong decade | the smilies pack :) |

## The era-authenticity checklist

Ten questions we ask of every new component, theme, or widget before it ships:

1. Can you point to a 1996-2003 artifact it's based on? (Cite it in the catalog entry,
   the [research doc](01-history-research.md) probably already has it.)
2. Does it pass all five laws mechanically (`audit()` clean)?
3. Would it render believably on a 256-color display at 800×600?
4. Does it collapse gracefully to a phone without looking like a modern responsive site
   (no hamburger icons, era pages just stack)?
5. Is it complete without JavaScript?
6. What does it do under `prefers-reduced-motion`, and is that documented?
7. Is every decoration `aria-hidden` and every control keyboard-reachable?
8. Is it within its size budget?
9. Is every asset original work from our pipeline?
10. Does it make someone smile?

If any answer is no, it goes back to the drawing board with a note.
