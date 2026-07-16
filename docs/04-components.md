# Component catalog

Every CSS component in retrostrap core. Components are the *furniture*; decorations live
in [the Toybox](05-widgets.md). Everything here works without JavaScript; a few pieces
get optional JS enhancers (marked (js), contracts in [06-javascript-api.md](06-javascript-api.md)).

All components obey [the five laws](02-design-language.md). Every component ships with a
catalog entry + snippet ([03-architecture.md](03-architecture.md#the-catalog-system)),
the snippets below are canonical starting points for those files.

**Entry format:** purpose · markup · classes/modifiers · responsive behavior · a11y ·
notes. Compact by design; the catalog JSON carries the same facts machine-readably.

**Inventory (63):**
Layout: page, container, layout, frames, cols, center, spacer ·
Typography: font-1..7, rainbow, gradient-text, blink, marquee (js), typewriter, hr, list,
kbd, dos, quote, ascii ·
Content: panel, window (js), note, table, card-profile, figure, spoiler (js), tooltip, badge,
counter, award, button88, banner, progress, stars, avatar, construction, blinkie ·
Forms: input, select, checkbox, radio, textarea, fieldset, btn, form-table ·
Navigation: navbar, sidenav, menu (js), tabs (js), breadcrumbs, pagination, webring-bar,
footer, skip, top ·
Feedback: dialog (js), alert, loading, splash (js), error-page, statusbar (js), rollover, toolbar ·
plus the utility set.

---

## Layout

### rs-page
The content sheet that sits on the tiled/colored body, the "centered table on a
starfield" anatomy. `<body>` carries the theme tile; `.rs-page` is the opaque
`--rs-bg-content` surface with a 2px outset border.
```html
<body>
  <div class="rs-page rs-container"> …everything… </div>
</body>
```
Responsive: full-bleed below `vga`, bordered sheet above. A11y: none specific.
Note: pairs with `rs-container`; using both on one element is the default idiom.

### rs-container
Width governor. Default max 760px, centered. `--wide` → 1000px, `--fluid` → 100%.
Fluid below its max, this class is where "auto-adjusts to screens" quietly happens.

### rs-layout
Page-shape recipes via grid-template-areas. Children opt into areas with
`rs-layout__header/__nav/__main/__rail/__footer`.
Modifiers: `--sidebar-left` (nav 180px + main), `--sidebar-right`, `--holy-grail`
(header/nav/main/rail/footer), `--three-col`.
Responsive: single column below `svga`; source order is header→main→nav→rail→footer
(a11y first, grid rearranges visually). Gaps default `--rs-space-2` (4px, dense!).
```html
<div class="rs-layout rs-layout--sidebar-left">
  <header class="rs-layout__header">…</header>
  <main class="rs-layout__main">…</main>
  <nav class="rs-layout__nav">…</nav>
  <footer class="rs-layout__footer">…</footer>
</div>
```

### rs-frames
Frameset cosplay: side pane + independently scrolling main pane.
`rs-frames__side` (200px, `position: sticky`, own scrollbar) + `rs-frames__main`.
Modifier `--right`. Responsive: below `svga` the side pane becomes a horizontal sticky
strip at top (scrollable row of links). A11y: side pane is `<nav>`, main is `<main>`.
Note: the 3px `ridge` divider between panes is mandatory (ridge needs at least 2px to
draw its two tones; 3px is the classic frame-border weight). It's the whole joke.

### rs-cols
Equal columns for badge walls and link farms: `rs-cols-2/3/4`.
Responsive: 4→2→1, 3→1, 2→1 at `svga`/`vga`. Gap `--rs-space-2`.

### rs-center
`text-align: center` + centers block children. In memory of `<center>`. Used earnestly.

### rs-spacer
Vertical spacer div, `--1..5` heights from the space scale. Named for `spacer.gif`,
rest in peace. `aria-hidden="true"` in the snippet.

---

## Typography

### rs-font-1 … rs-font-7
The `<font size>` scale as utilities ([02](02-design-language.md#the-seven-sizes)).

### rs-rainbow
Per-letter rainbow text, the `<font color>`-per-character classic. Pure CSS:
`background: repeating-linear-gradient(90deg, red 0 1ch, #FF9900 1ch 2ch, yellow …)` +
`background-clip: text` with hard stops (banded, Palette-Law colors: `#FF0000`,
`#FF9900`, `#FFFF00`, `#00CC00`, `#0000FF`, `#9900CC`). Headline use only.
A11y: it's just text; contrast checked against theme bg for size ≥ 24px only.

### rs-gradient-text
Two-stop version of the same trick. Modifiers `--fire` (red→orange), `--ice`
(aqua→blue), `--toxic` (lime→teal). Display sizes only.

### rs-blink
Pure CSS: 1 Hz `steps(1)` visibility blink per Motion Law. Reduced motion → static
bold + underline. Use on `rs-badge`, "NEW!" text, and with restraint we won't
actually enforce.

### rs-marquee (js)
Scrolling text. CSS-only single-track scroll, paused on hover/focus; the enhancer
adds seamless looping (duplicated `aria-hidden` track), a keyboard-reachable pause
button, and `data-rs-marquee-speed="slow|normal|fast"` (30/60/120 px/s). A
`-direction` option isn't supported yet; the marquee scrolls left.
```html
<div class="rs-marquee"><span class="rs-marquee__content">
  ★·.·´¯`·.·★ welcome to my homepage ★·.·´¯`·.·★
</span></div>
```
Reduced motion: static, fully wrapped. A11y: content readable in DOM order; no
`role="marquee"` (deprecated pattern); treated as decoration when duplicated
(clone is `aria-hidden`).

### rs-typewriter
Courier + `letter-spacing: 1px` + optional `--reveal` steps() type-on for headings
(reduced motion: instant). 

### rs-hr
Horizontal rules with a wardrobe: `--groove` (default `<hr>` upgrade), `--dotted`,
`--rainbow` (banded gradient bar, 4px), `--stars` (tiled ★ divider image).
`<hr class="rs-hr rs-hr--rainbow">`: semantic `<hr>` required.

### rs-list
`<ul>` with pixel-art bullets via `list-style-image`: `--stars`, `--arrows`, `--paws`,
`--disks` (floppies). Nested levels alternate glyphs automatically.

### rs-kbd
`<kbd>` as a keycap: sunken bevel, mono, `--rs-space-1` padding.

### rs-dos
Block terminal: black bg, `#CCCCCC` mono text (phosphor theme retints), 2px sunken
border, optional `__title` bar ("C:\>"). For code, ASCII art, and cheat tables.
A11y: it's a `<pre>`; preserve semantics.

### rs-ascii
ASCII art and text banners on a `<pre role="img">`: tight leading, monospace, wide art
scrolls in its box. Variants `--framed` (raised bevel), `--center`, `--sig` (forum
signature). A11y: give it an `aria-label` for what the art shows, the reader announces
the label, not every slash. For text meant to be read (code, tables), use `rs-dos`.

### rs-quote
Forum-style quote block: 1px sunken border, silver header strip "Originally posted by …"
(`rs-quote__source`), plus `rs-quote__sig`: the signature divider (`--` line then
muted text, max 3 lines per Boards law). Nest sparingly; the Netiquette is watching.

---

## Content

### rs-panel
THE general-purpose box, fieldset-style: 2px `groove` border with a `rs-panel__title`
riding the border line (legend look). Modifiers: `--raised` (bevel out), `--sunken`.
```html
<section class="rs-panel">
  <h2 class="rs-panel__title">About me</h2>
  <p>…</p>
</section>
```
A11y: use real headings inside; when built on `<fieldset>` in forms, title is `<legend>`.

### rs-window (js)
Window chrome: titlebar (two-stop `--rs-titlebar-bg→bg-2` fade, white bold Tahoma title),
control buttons (`__controls` with `_` `□` `✕` as bevel buttons), `__body`, optional
`__statusbar` (sunken cells). Modifier `--inactive` grays the titlebar.
The window enhancer wires the control buttons (minimize/restore/close) and F6 cycling
([06](06-javascript-api.md)); the (js)`windows` manager widget adds dragging and
raising ([05](05-widgets.md)).
```html
<div class="rs-window" aria-labelledby="w1t">
  <div class="rs-window__titlebar"><span id="w1t" class="rs-window__title">My Computer</span>
    <span class="rs-window__controls"><button aria-label="Close">✕</button></span></div>
  <div class="rs-window__body">…</div>
  <div class="rs-window__statusbar"><span>Ready</span></div>
</div>
```
Responsive: never wider than viewport; static windows become full-width panels below `vga`.

### rs-note
Sticky note: `#FFFF99` bg, 1px `#808000` border, hard 2px shadow, optional pin icon.
For asides and "webmaster's note" boxes.

### rs-construction
The under-construction sign (docs/01 §3): a yellow board between two diagonal caution
bars, all pure CSS. `--bar` is just the striped barrier, no text. The most honest
element the era produced; say what's unfinished in the text.

### rs-blinkie
The ~150×20 glitter strip (docs/01 §4): a shiny-bordered badge of belonging for sidebars
and signatures. Modifiers `--hot`/`--cool`/`--candy`. Pair with `rs-blink` for the
shimmer (which stops under reduced motion).

### rs-table
`<table>` dressing. Base: 1px solid borders all cells, silver header row, cellpadding
feel via `--rs-space-1/2`. Modifiers: `--striped` (alternate `#FFFFFF`/`#CCCCCC`: theme
retints), `--bordered` (2px outer sunken border), `--data` (mono numerals, right-aligned
number cells via `.rs-num`).
Responsive: wrapper `rs-table-scroll` div gives horizontal scroll below `svga`: tables
never reflow into card lists (that's a modern pattern; era tables scrolled or squished).
A11y: `<th scope>`, `<caption>` encouraged in every snippet.

### rs-card-profile
The member card: 80×80 `rs-avatar` + name + rank stars + fields table (location,
interests, homepage). Used by the Boards and every "About me" page.

### rs-figure
Image with 2px outset border + optional sunken `__caption` strip. There is no
polaroid variant: it wanted a 1° rotation, and rotation is modern-cute. No rotation.

### rs-spoiler (js)
Built on a native `<details>`: the summary is the spoiler chip, the content stays
hidden until opened, and keyboard/screen readers/no-JS all get the real thing. The
enhancer only adds the `rs:spoiler:toggle` event and a `reveal()/hide()/toggle()`
handle. Reveals persist until re-hidden.

### rs-tooltip
Yellow (`#FFFFCC`, 1px black border) tip box on hover/focus via `data-rs-tip="…"`.
Pure CSS (::after) + focusable trigger requirement. Not for essential content.

### rs-badge
Inline flashing tags: `--new` ("NEW!" red/yellow), `--updated`, `--hot` (flame icon),
`--cool` (blue). Add `rs-blink` for the full effect. `<sup>` placement idiom in snippet.

### rs-counter
Display shell for the hit counter: sunken bezel, black bg, green 7-segment digit
sprites (assets), label line (`__label`, "hits since 2026", yours to write). The
(js)`hit-counter` widget populates the digits; static usage just writes them.

### rs-award
Award badge block: 88×31 or 120×90 image + caption ("This site won the Golden Floppy,
March 1999"). Grid-friendly with `rs-cols`.

### rs-button88
The 88×31 button, as an element: fixed 88×31 box, pixel border, tile bg, one line of
text. Also the class applied to *real* 88×31 images in badge walls. Never scales,
wrap many in `rs-cols`/flex-wrap (`rs-badge-wall` wrapper class).

### rs-banner
468×60 banner shell (the only ad format that ever mattered) for self-promo/webring
banners. Responsive: scales down proportionally below 500px viewport width via
`aspect-ratio`: the one sanctioned proportional scale, because a banner is an image.

### rs-progress
Segmented progress bar: sunken track, `--rs-accent` blocks of 8px with 2px gaps
(the file-copy dialog look). `<progress>` element styled, or div+`__bar` with
`role="progressbar"`. Indeterminate mode: three blocks marching (steps animation).

### rs-stars
Star rating display: pixel stars filled/empty (★★★☆☆), sized to font. Display-only
component; for an interactive rating, build a styled radio group (core ships only the
display form).

### rs-avatar
80×80 (modifier `--small` 40×40) image with 1px border and `image-rendering: pixelated`.
Any modern photo instantly reads era. Alt text required in snippet.

---

## Forms

System-look controls: sunken 2px bevels, white fields, no focus glow (dotted outline per
focus spec). All native elements, restyled, never rebuilt.

### rs-input / rs-textarea
Sunken bevel, white bg, body font. Sizes via font utilities. Invalid state:
1px `#FF0000` border + `rs-form-error` message pattern (no red glow, glow is modern).

### rs-select
Native `<select>` with bevel chrome and a pixel down-arrow (background-image). Multiple
size support. No custom dropdown re-implementation, native is era-true *and* accessible.

### rs-checkbox / rs-radio
Native inputs restyled via `accent-color`… no, `accent-color` renders modern rounded
controls. Instead: `appearance: none` + pixel-drawn sunken 13×13 box / 12×12 circle,
black check/dot glyphs, dotted focus ring on the label. Snippet always pairs
`<label for>`.

### rs-fieldset
`<fieldset>` + `<legend>` with the groove border, the native pattern rs-panel imitates;
use this one inside actual forms.

### rs-btn
The bevel button. Raised; `:active` = sunken + 1px content nudge. Modifiers:
`--primary` (bold + `--rs-accent` text or titlebar-colored face per theme), `--link`
(looks like a link, is a button), `--small`/`--large` (font steps 1/4), `--icon`
(16×16 icon + text). Disabled: gray text with white 1px "engraved" offset, the classic.
```html
<button class="rs-btn rs-btn--primary">Sign my guestbook!</button>
```

### rs-form-table
The label:field two-column table layout every 1999 form used. Grid-based, labels
right-aligned bold, collapses to stacked below `vga`. Snippet shows proper
`<label for>` wiring.

---

## Navigation

### rs-navbar
Horizontal button bar: bevel-raised links in a row (bare `<a>` children, no item
class), current page sunken (`aria-current="page"` styled). Responsive: wraps to two rows below `svga`; never a
hamburger (era pages just wrapped).

### rs-sidenav
The left-nav link list: pixel bullets, optional 16×16 icons, `__section` headers
(bold caps size-2), visited-link coloring ON (this is where purple links live).
Lives in `rs-layout__nav` or `rs-frames__side`.

### rs-menu (js)
Dropdown menu bar (the "DHTML menu"): `<nav class="rs-menu"><ul>` with nested `<ul>`
submenus. CSS: hover-open on fine pointers, instant (no transition). Enhancer adds:
click/tap toggle, full keyboard map (arrows/Home/End/Escape per
[08](08-accessibility-performance.md)), `aria-expanded`/`aria-haspopup`, focus
management, close-on-outside-click. Submenus: silver bevel panels, 1-level nesting max
(era menus nested forever; our sanity says one).

### rs-tabs (js)
Folder tabs: raised tab lips, active tab merges with panel (border-bottom removal
trick). Enhancer provides roving tabindex, arrow keys, `role=tablist/tab/tabpanel`,
`aria-selected`. Unenhanced fallback: tabs are in-page anchor links to stacked panels,
progressive enhancement exactly as the law demands.
Responsive: tabs scroll horizontally below `vga` (scrollbar visible, that's fine here).

### rs-breadcrumbs
"**You are here:** Home > Games > Star Quest 3D". `<nav aria-label="You are here">` +
`<ol>`; separator `>` via ::after. The bold prefix is part of the component. 

### rs-pagination
`Pages: [1] 2 3 4 … 12 Next>`: current page bracketed bold, not a button; numbered
links; Prev/Next with angle brackets. `<nav aria-label="Pages">`.

### rs-webring-bar
The classic centered table: `[<< Prev] [Random] [Ring Home] [Next >>]` + ring name line.
CSS shell only; the (js)`webring` widget fills the links from ring JSON ([05](05-widgets.md)).

### rs-footer
Page footer kit: `__updated` ("Last updated: …", pairs with the `last-updated` widget),
`__badges` (88×31 wall row: "made with retrostrap", "best viewed with eyes"), `__email`
(the spinning-envelope mailto), copyright line with `©` and a year range done honestly.

### rs-skip
Skip-to-content link: visually hidden until focused, then a tiny top-left bevel chip
("Skip intro →" is the sanctioned label, a11y meets the Flash-era joke).

### rs-top
"^ Top" back-to-top link idiom for long pages; smooth scrolling is **not** used
(instant jump, smooth scroll is modern).

---

## Feedback

### rs-dialog (js)
Native `<dialog>` in system-alert costume: titlebar, 32×32 pixel icon slot (`--info` ℹ,
`--warn` ⚠, `--error` ✕, original pixel icons), message, button row (OK default-focused,
Cancel). Enhancer: `Retrostrap.dialog.alert/confirm(…)` promise helpers, focus trap via
native modality, `Escape` closes. Backdrop: a black **scanline dither** (1px lines,
not opacity, era-true and Shape/Palette-legal).

### rs-alert
Inline message bar: icon + text + optional dismiss button; `--info` (silver), `--warn`
(`#FFFFCC`), `--error` (`#FFCCCC`, red border, `role="alert"`). No slide-in. It's just
there, like news.

### rs-loading
The hourglass: 16×16 animated sprite (steps) + "Loading, please wait…" text. `--bar`
variant wraps `rs-progress` indeterminate. Reduced motion: static hourglass + text.

### rs-splash (js)
Click-to-enter splash screen: full-viewport `--rs-z-splash` sheet, big `rs-font-7`
title, "[ ENTER ]" button. Enhancer: dismiss on click/Enter/Escape, remembered in
localStorage (`data-rs-splash-remember="30"` days), **content behind stays in DOM**
(SEO/SR unaffected; sheet is `aria-hidden` wrapper pattern in reverse, the splash is a
labeled dialog, the page is never hidden from AT). Reduced-motion: no type-on effect.
Default: not remembered, because re-entering is the point.

### rs-error-page
404/500 furniture: `rs-dos` box with "HTTP 404, File Not Found", sad-floppy pixel art,
"return to homepage" link, optional `konami` hint comment. Ships as a full snippet page.

### rs-statusbar
Standalone sunken status strip (also `rs-window__statusbar`): cells divided by 1px
grooves; classic pairing with the `ticker` widget docked bottom. The optional JS enhancer
revives `window.status`: hover or focus a link and its real href covers the bar in a
preview cell, then the bar's own tenants show through again (silent to assistive tech,
the link's name already says where it goes; a docked ticker keeps scrolling underneath).

### rs-rollover
The onMouseOver swap in pure CSS: `rs-rollover__off` shows at rest, `rs-rollover__on`
reveals on hover *or* focus, so keyboard users get it too. Both halves are paint; the
wrapping link or button carries the accessible name. The first interactivity most homepages
ever shipped, minus the broken JavaScript.

### rs-toolbar
Raised strip of `rs-btn--icon` buttons with groove separators; overflow wraps (never
collapses into a "⋯" menu).

---

## Utilities

The complete sanctioned set, deliberately this short:

| Class | Effect |
| --- | --- |
| `rs-text-left/center/right` | text alignment |
| `rs-pad-0..5` / `rs-gap-0..5` | padding / gap from the space scale |
| `rs-mt-0..5` / `rs-mb-0..5` | margin top/bottom |
| `rs-hide-vga/svga` | hide at ≥ breakpoint |
| `rs-show-vga/svga` | show only at ≥ breakpoint |
| `rs-pixelated` | `image-rendering: pixelated` |
| `rs-comfy` | (on `<html>`) type one step up, line-height 1.5 |
| `rs-crt` | scanline overlay on a container (pairs with phosphor) |
| `rs-cursors` | region opt-in: pixel arrow, pixel hand on links/buttons |
| `rs-cursor-arrow/hand` | single-element pixel cursors (original art) |
| `rs-cursor-hourglass/crosshair` | native `wait` / `crosshair` cursors |
| `rs-sr-only` | visually hidden, screen-reader available |
| `rs-badge-wall` | flex-wrap row for `rs-button88` collections |
| `rs-table-scroll` | horizontal scroll wrapper for tables |

Requests for new utilities are viewed with
suspicion, every utility is a door out of the component system.

---

## Adding a component (the bar to clear)

1. An era reference documented in [01-history-research.md](01-history-research.md) (add it if missing).
2. Passes the [authenticity checklist](02-design-language.md#the-era-authenticity-checklist).
3. Catalog JSON + snippet + docs page + test page (hand-written) + size budget respected.
4. A11y notes written against [08](08-accessibility-performance.md) patterns.
5. If it needs JS beyond an enhancer, it's probably a [widget](05-widgets.md) instead.
