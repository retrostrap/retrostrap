# Accessibility and performance

Retro look, modern conscience. This document is the binding spec for everything retrostrap does about accessibility, motion safety, contrast, and speed. The [design language](02-design-language.md) says what 1999 looked like; this document says what 2026 demands underneath it. The [widget catalog](05-widgets.md) cross-references the rulings here, where the two disagree, this document wins.

Everything below is written so an implementer never has to re-decide: exact keys, exact ratios, exact budgets, exact CSS.

## Philosophy

Accessibility in retrostrap is non-negotiable and mostly invisible. A visitor sees a page that could have been served off a beige tower in a university basement. A screen reader, a keyboard, a zoom setting, or a motion preference sees a thoroughly modern site. The trick is that none of our guardrails cost us the aesthetic, the era's look survives intact; only the era's mistakes are quietly repaired.

The invisible modernizations, in one list:

- **Semantic HTML under the retro paint.** The `<table>`-for-layout look is reproduced with grid and real landmarks. Buttons are `<button>`, navigation is `<nav>`, dialogs are `<dialog>`. View-source is a time machine; the accessibility tree is not.
- **Real focus order.** DOM order is reading order is tab order. No positive `tabindex`, ever; the axe gate and review hold this line.
- **Zoom-safe sizing.** The [type scale](02-design-language.md) has pixel names (10/13/16/18/24/32/48) but is `rem` under the hood. 200% browser zoom and user font-size overrides work everywhere; nothing is locked to `px` except decorative chrome (borders, bevels, sprites).
- **Honored motion preferences.** Every animated thing in the framework, all of it, has a defined `prefers-reduced-motion` behavior. See [the motion policy matrix](#the-motion-policy-matrix).
- **Honest decoration.** Everything that is glitter says so: `aria-hidden="true"`, `pointer-events: none`, out of the tab order, zero layout shift. Everything that carries meaning (smilies, tickers, counters) keeps a real text form.
- **Underlined links.** Era-true and the correct answer to color-only distinction (WCAG 1.4.1) in one move. Body-copy links are always underlined; no theme may remove this.

If a component cannot be made accessible without breaking a Law, the component gets cut, not the Law. It has not happened yet.

## Semantic HTML mapping

The required skeleton for every interactive component. "Required" means the JS enhancers skip markup that doesn't match rather than guess at it. (`Retrostrap.audit()` polices the paint, not the skeleton: its eight rules are radius, shadow-blur, translucent-ui, palette, network, easing, font, and link-underline.)

| Component | Native skeleton | Required ARIA / attributes | Notes |
|---|---|---|---|
| `rs-skip` | `<a class="rs-skip" href="#main">` as first focusable in `<body>` | none | Visually hidden until focused, then styled as a classic 3D button. Every demo ships one. |
| Page frame | `<header>` `<nav>` `<main id="main">` `<aside>` `<footer>` inside `rs-container` | `aria-label` on repeated landmarks | The "table layout" recipes are grid over these landmarks, never actual layout tables. |
| `rs-menu` | `<nav aria-label="…"> <ul> <li>` with `<a>` or `<button>` per item | Submenu triggers are `<button aria-expanded aria-controls>`; submenus are plain `<ul>` of links | Disclosure-navigation pattern, not `role="menu"`: this is site nav, not an app menubar. |
| `rs-tabs` | `<div class="rs-tabs">` with buttons + sections | `role="tablist"` / `role="tab"` + `aria-selected` + roving `tabindex` / `role="tabpanel"` + `aria-labelledby`; panel gets `tabindex="0"` when it has no focusable child | Without JS, degrades to in-page links + headed sections (Decency Law). |
| `rs-dialog` | native `<dialog>`, opened with `showModal()` | `aria-labelledby` pointing at the titlebar text; forms use `method="dialog"` | Focus trap, `Esc`, and top-layer come free from the platform. We only add return-focus-to-opener. |
| `rs-window` | `<section class="rs-window" role="dialog">` (non-modal, no `aria-modal`) | `aria-labelledby` → titlebar text `<span id>`; controls are real `<button aria-label="Minimize">` etc. | The windows widget caps floating windows at 5. Never traps focus; it is furniture, not a modal. |
| `rs-marquee` | `<div class="rs-marquee">` containing the full text once | the enhancer adds the seamless-loop duplicate (`aria-hidden="true"`) and a `rs-marquee__pause` button; no `role="marquee"` (deprecated pattern, docs/04) | AT reads the static text in DOM order, never the scroll. |
| `rs-spoiler` | `<details class="rs-spoiler"><summary>` | none needed, native semantics | Zero-JS component. `summary` announces expanded/collapsed for free. |
| `rs-splash` | native `<dialog>` covering the viewport | `aria-label="Welcome"`; the Enter button is `<button autofocus>` | Skippable, dismissed by `Enter`/`Space`/`Esc`/click. Remembering is opt-in: `data-rs-splash-remember` (days) stores a timestamp under `rs:splash:<pathname>`; by default the ceremony plays every visit. |
| `rs-table` | `<table><caption><thead><th scope="col">` … `<th scope="row">` | none beyond correct `scope` | Data tables only. Layout-flavored borders are CSS; semantics stay honest. |
| Forms / `rs-field` | `<label for>` on every control; groups in `<fieldset><legend>` | errors: `aria-describedby` → error text, `aria-invalid="true"` | No placeholder-as-label, ever. The axe gate (`label` rule) flags unlabeled controls. |
| `jukebox` | the widget builds its own chrome: host gets `role="region"` `aria-label="Jukebox"`; transport is `<button>`s; seek/volume are `<input type="range">`; tracklist is `<ol>` of `<button>`s | `aria-pressed` on play/pause is forbidden, swap `aria-label` "Play"/"Pause" instead; the loaded track carries `aria-current="true"` (even while paused), the rest `"false"` | Never autoplays (Decency Law). Playback runs through a detached `Audio()` object; no `<audio>` element ever enters the DOM, so no double-UI to hide. |
| `guestbook` | `<form>` + a `div` of `<article class="rs-panel">` entries, each headed by its author line | none; entries render as text nodes only, markup in a message shows as literal text | See [screen reader patterns](#screen-reader-patterns) for who announces what. |
| `webring` | `<nav aria-label="Webring">` (or any host) with prev / random / ring home / next links | when the host is not a `<nav>`, the widget stamps `role="navigation"` + `aria-label` (the ring's name, or "Webring") | Plain links from JSON; the bar can hold static links until the widget fills it. |
| `ticker` | the widget builds a bar from a message list (its own `<ul>`, or the `source` selector's) | none; the scrolling track is ordinary text, each message in it exactly once, never `aria-live` | A persistent pause button rides in the bar. No `role="marquee"` (docs/04). |
| `hit-counter` | host gets `.rs-counter`: visually-hidden text + `aria-hidden` 7-segment sprite digits | none live | "You are visitor 4,660." rendered once, instantly. See live-region policy. |
| `clock` | host gets `.rs-clock`: `aria-hidden` LED digits + an sr-only `<time datetime="…">` | none live | sr-only `<time>` refreshed once per minute; LED digits tick visually 1/s. |
| `countdown` | host gets `.rs-countdown` + `role="timer"`: `aria-hidden` LED digits + sr-only remaining-time text | `aria-live` off; completion message announced once, politely (default text "Happy new millennium!") | sr-only text refreshed on the minute, never per second. |
| `last-updated` | `<p>` with `<time>` from `document.lastModified` | none | Static text; nothing to rule on. |
| `smilies` | `<img class="rs-smiley" src="…" alt=":)" width="15" height="15">` | `alt` is the original typed text, verbatim | Copy-paste and SR output preserve the author's `:)`. |
| Decorative overlays (cursor-trail, snowfall, sparkle, neko, starfield, dvd, crt) | `<canvas>` or `<div>` appended to `<body>` | `aria-hidden="true"`, `pointer-events: none`, `position: fixed`, no focusable descendants | The engine injects these attributes itself; authors cannot forget them. |

## Keyboard maps

One table per JS component, following the WAI-ARIA Authoring Practices patterns. Keys not listed do nothing (we never swallow keys we don't use).

### rs-menu (disclosure navigation)

| Key | Where | Action |
|---|---|---|
| `Tab` / `Shift+Tab` | anywhere | Move through top-level items; leaving a submenu closes it |
| `Enter` / `Space` | on a trigger button | Toggle its submenu; when opening, focus stays on the trigger |
| `ArrowDown` | on a trigger | Open submenu (if closed) and focus first item |
| `ArrowDown` / `ArrowUp` | inside a submenu | Move to next / previous item, no wrap |
| `Home` / `End` | inside a submenu | First / last item |
| `Esc` | inside a submenu | Close submenu, return focus to its trigger |
| printable character | inside a submenu | Typeahead to next item starting with that letter (optional enhancement) |

### rs-tabs

| Key | Action |
|---|---|
| `Tab` | Into the tablist (lands on the selected tab); next `Tab` leaves to the panel |
| `ArrowRight` / `ArrowLeft` | Move focus to next / previous tab, wrapping; selects it (automatic activation, the default) |
| `ArrowDown` / `ArrowUp` | Same as Left/Right; the arrows are not orientation-locked |
| `Enter` / `Space` | Activate the focused tab (redundant under automatic activation, which is what ships) |
| `Home` / `End` | First / last tab (and select, in automatic mode) |

### rs-dialog (native `<dialog>`)

| Key | Action |
|---|---|
| `Esc` | Close (native `cancel`); we then return focus to the stored opener |
| `Tab` / `Shift+Tab` | Cycle within the dialog (native top-layer focus containment) |
| `Enter` | Submit the `method="dialog"` form / activate default button |
| on open | Focus goes to `[autofocus]`, else first focusable, else the dialog element |

### rs-window

| Key | Where | Action |
|---|---|---|
| `Tab` | anywhere | Normal DOM order: move-handle, minimize, close, then window content |
| `Enter` / `Space` | on minimize / close / restore buttons | Activate |
| `ArrowUp/Down/Left/Right` | on the focused titlebar | Move window 16px |
| `Shift+Arrow` | on the titlebar | Move window 2px (fine positioning) |
| `Home` | on the titlebar | Snap window to the viewport's top-left corner |
| `F6` | anywhere inside any rs-window | Cycle focus to the next open window's titlebar |
| `Esc` | - | Nothing: a window is furniture, not a modal |

The core enhancer wires the control buttons and `F6`; the arrow moves and `Home`
come with the `windows` widget, which floats windows marked
`data-rs-window="floating"` and gives their titlebars real focus.

### rs-marquee

| Key | Action |
|---|---|
| `Tab` | Reaches the always-visible pause button |
| `Enter` / `Space` | Toggle pause (the button label swaps Pause/Resume) |
| focus within the marquee | Auto-pauses while focus remains inside; resumes on blur |

### rs-spoiler (native `<details>`)

| Key | Action |
|---|---|
| `Tab` | Reaches the `<summary>` |
| `Enter` / `Space` | Toggle reveal (native), screen readers announce the expanded/collapsed state for free |

### rs-splash

| Key | Action |
|---|---|
| on load | Focus lands on the "Enter site" button (`autofocus`) |
| `Enter` / `Space` | Dismiss and remember |
| `Esc` | Dismiss and remember (identical, the splash is never a gate) |
| `Tab` | Cycles within the splash (it is a modal `<dialog>`); the enter button is always reachable |

### jukebox

| Key | Where | Action |
|---|---|---|
| `Tab` | - | Through prev, play/pause, stop, next, volume, seek, then the tracklist |
| `Enter` / `Space` | transport buttons, track buttons | Activate; a track button starts that track |
| arrow keys | seek slider | Scrub 1 second per press (a native range, step 1) |
| arrow keys | volume slider | Volume 1% per press (same, 0-100) |
| `Home` / `End` | either slider | Jump to start / end |
| `PageUp` / `PageDown` | either slider | Whatever the browser does natively; we add no custom keydown handling |
| - | document | We never bind global shortcuts; `Space` outside the player scrolls the page as God and Tim Berners-Lee intended |

## Focus styling spec

The era's focus indicator was the 1px dotted rectangle, and it happens to be a perfectly good modern one, if we guarantee its contrast. Canonical implementation:

```css
/* 01-reset.css */
:where(a, button, input, select, textarea, summary, [tabindex]):focus {
  outline: 1px dotted var(--rs-focus-color, currentColor);
  outline-offset: 1px;
}

/* Pointer clicks on widgets stay clean… */
:where(a, button, summary, [tabindex]):focus:not(:focus-visible) {
  outline: none;
}

/* …keyboard and assistive tech always get the ring. */
:where(:focus-visible) {
  outline: 1px dotted var(--rs-focus-color, currentColor);
  outline-offset: 1px;
}
```

Policy rulings:

1. **`:focus-visible` is the trigger, `:focus` is the fallback.** Keyboard focus always shows the ring. Mouse clicks on buttons/links don't (modern politeness); text inputs match `:focus-visible` on click natively, so they always show it, correct.
2. **`--rs-focus-color` is the ring color, `currentColor` the fallback.** Most themes pin a ring color chosen to clear the 3:1 non-text requirement (WCAG 1.4.11) on their surfaces: black for classic, yellow for midnight, the phosphor green, and so on. Two themes deliberately pin nothing: bevel and y2k ride the `currentColor` fallback, so the ring follows the ink it sits beside, white on a navy titlebar, black on a silver sheet, and clears 3:1 on both faces of the theme without a single compromise color.
3. **Never remove without replacing.** `outline: none` on a focusable element with no replacement indicator does not ship, full stop; review and the manual keyboard pass hold the line.
4. **`outline-offset: 1px`** keeps the dots off the bevel edges so they read as a ring, not border noise. Components with inset content (window titlebars, tabs) may set offset `-2px` to keep the ring inside their own box; they may not change style or width. One shipped exception: range inputs (the jukebox's seek and volume) wear a 2px solid `--rs-focus-color` ring, because 1px dots vanish along a slider track.
5. **Forced colors:** under `@media (forced-colors: active)` we leave the outline alone, the UA recolors `currentColor` to `Highlight` and strips box-shadows. The dotted ring survives Windows High Contrast untouched. Do not set `forced-color-adjust: none` on focusables.

### rs-focus-loud

For low-vision users (and anyone who finds 1px dots too subtle, fair), a page-level high-visibility mode:

```css
html.rs-focus-loud :is(:focus, :focus-visible) {
  outline: 3px solid #FFFF00;
  outline-offset: 0;
  box-shadow: 0 0 0 5px #000000;  /* square, per the Shape Law */
}
```

Two layers, guaranteed visible on any of the 224 legal colors: the yellow ring measures 19.56:1 against black and the black halo 21.00:1 against white; yellow alone would die on white (1.07:1), which is exactly why both layers ship. At least one layer clears 3:1 against every background the Palette Law permits. Enable via `<html class="rs-focus-loud">`. Loud mode also drops the `:focus:not(:focus-visible)` exemption, everything ringed, always.

## The motion policy matrix

Motion Law recap: linear/`steps()` easing only, blink is `1s steps(1)`, marquee speeds 30/60/120 px/s, and **everything** honors `prefers-reduced-motion`. The engine listens to `matchMedia("(prefers-reduced-motion: reduce)")` live: flipping the OS setting re-initializes every decorative widget on the spot, no reload. Informative widgets and component enhancers (ticker, marquee) read the preference at init and keep their mode until the next init; the CSS side flips instantly either way. Below, "PRM" = behavior under reduced motion. Decorative widgets disappear or freeze; informative ones keep their information and lose their motion.

| Widget / component | Class | Default motion | Under prefers-reduced-motion |
|---|---|---|---|
| cursor-trail | decorative | up to 16 DOM trailers follow pointer | Off entirely, never spawns |
| snowfall | decorative | canvas flakes, density 20/40/80 | Off, canvas not mounted |
| sparkle | decorative | pointer sparkles, cap 40 | Off, no ambient or tap sparkles |
| neko | decorative | 24px sprite chases cursor / patrols | Sits still (idle/sleep frame) but **stays visible**: the cat is not motion, the chasing is |
| ticker | informative | horizontal scroll at 60 px/s | Discrete swap: shows one item as static text, replaces it every 5s, no scroll |
| clock | informative | LED digits update 1/s | Unchanged, a digit changing value is content, not motion; no transition animation exists |
| last-updated | static | none | n/a |
| hit-counter | informative | none, digits render instantly | n/a, nothing moved to begin with |
| smilies | static | none (v1 smilies are static GIFs) | If an animated set ever ships, PRM shows frame 1 |
| starfield | decorative | canvas warp-speed stars | Still sprinkle: the canvas mounts and paints the stars once, the look without the flight |
| transitions | decorative | View Transitions wipes (box-in/out, wipe, dissolve, checker) | None, instant navigation; also skipped if the UA itself reduces |
| webring | static | none | n/a |
| guestbook | static | none | n/a |
| jukebox | informative | the fake EQ dances while a track plays | EQ holds still at its resting bars; audio playback itself is user-initiated and unaffected |
| windows | informative | none, state changes are instant already | n/a |
| dvd | decorative | bouncing logo (off by default) | Cannot start; if enabled by the author, it renders parked in a corner, motionless |
| konami / party mode | decorative | 30s of confetti snow + rainbow sparkle + dvd (or until `Esc`) | The party politely declines: one `role="status"` note ("You found it!") for about six seconds, no decorations |
| countdown | informative | LED digits update 1/s, no flip flourish | Unchanged; a value update is content, not motion |
| crt | decorative | static scanline texture; optional flicker variant | Scanlines stay (a static texture is not motion); flicker force-disabled regardless of author opt-in |
| rs-marquee | informative | scroll 30/60/120 px/s | Static: full text shown, wrapped; pause button hidden (nothing to pause) |
| `.rs-blink` | decorative emphasis | `1s steps(1)` visibility blink | Static bold + underline, emphasis survives, blinking doesn't |
| rs-splash | - | any animated intro | First/final frame shown statically; never delays the enter button |
| menu / tabs / dialog / spoiler open effects | chrome | `steps()` micro-animations | Instant open/close |

Implementation rule: PRM handling lives in the engine, not in each widget's goodwill: every widget factory receives the current preference as `ctx.reducedMotion` (with `Retrostrap.motion.allowed()` as the public reading), the engine re-initializes decorative widgets when the preference changes, and the stylesheets carry `@media (prefers-reduced-motion: reduce)` blocks that zero the animation utilities.

### Photosensitivity rules

- **Nothing in retrostrap flashes more than 3 times per second** (WCAG 2.3.1). This is a hard framework invariant, not a guideline.
- **Blink passes by construction**: `1s steps(1)` = 1 flash/s. `.rs-blink` is for inline text runs, never banner-sized blocks, era-authentic obnoxiousness has a ceiling.
- **CRT flicker** is off by default. When explicitly enabled it nudges the overlay's opacity by 0.06 at most 2 changes per second, below flash thresholds in both frequency and luminance delta, and is force-disabled under PRM.
- **Party mode** composes only non-flashing widgets (snow, sparkle, dvd, none of which flash), so it passes the 3/s rule by construction.
- No full-viewport luminance swings: transitions wipes move a boundary across the screen once; they never strobe.

## The contrast matrix

Method: WCAG 2.1 relative luminance and contrast ratio, computed, not eyeballed, with this exact function (also the basis of the CI check in [testing](#testing-checklist)):

```js
const lin = c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
const L = hex => {
  const [r, g, b] = [0, 2, 4].map(i => lin(parseInt(hex.slice(i + 1, i + 3), 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [hi, lo] = [L(a), L(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
```

Verdict thresholds: **AA** ≥ 4.5:1 (body text), **AA-large** ≥ 3:1, **AAA** ≥ 7:1. On our type scale, "large" means 24/32/48px always, and 18px only when bold. 10px and 13px are emphatically body text. Non-text UI parts (rings, edges) need ≥ 3:1. And globally: **links are always underlined**: era-true, and it removes any reliance on color alone.

The tables below spell out six themes (classic, midnight, bevel, phosphor, kawaii, y2k) as a representative spread of moods, light, dark, terminal, glitter, chrome, so the reasoning shows at a glance; the other four (bubble, cosmic, highcontrast, newspaper) follow the same method inside the same legal palette. The gate in `scripts/contrast.mjs` measures all ten shipped themes on every run, so a theme is covered whether or not its table is printed here.

### classic

| Pair | FG | BG | Ratio | Verdict |
|---|---|---|---|---|
| text on content sheet | `#000000` | `#FFFFFF` | 21.00 | AAA |
| text on page bg | `#000000` | `#C0C0C0` | 11.54 | AAA |
| link on sheet | `#0000FF` | `#FFFFFF` | 8.59 | AAA |
| link on page bg | `#0000FF` | `#C0C0C0` | 4.72 | AA |
| visited on sheet | `#660099` | `#FFFFFF` | 10.37 | AAA |
| visited on page bg | `#660099` | `#C0C0C0` | 5.70 | AA |
| active on sheet | `#FF0000` | `#FFFFFF` | 4.00 | AA-large only |
| active on page bg | `#FF0000` | `#C0C0C0` | 2.20 | fail |
| muted on sheet | `#808080` | `#FFFFFF` | 3.95 | AA-large only |
| muted on page bg | `#808080` | `#C0C0C0` | 2.17 | fail |
| accent navy on sheet | `#000080` | `#FFFFFF` | 16.01 | AAA |
| white on navy band | `#FFFFFF` | `#000080` | 16.01 | AAA |

Rulings:

- **Muted fails body-text AA.** Fix, shipped: `--rs-text-muted: #666666`, 5.74 on white, 3.16 on `#C0C0C0`. `#808080` is demoted to disabled-control text only (WCAG exempts inactive controls). Muted text belongs on the white sheet; directly on the gray page bg it must be `#333333` (6.94) or ≥ 18px bold. (The contrast gate measures the token pair.)
- **Active red is transient-only.** `#FF0000` may appear solely as the momentary `:active` flash (era-true, sub-second, not a resting state, always on already-underlined links). Any *persistent* red text (e.g. a "new!" label) must use `#CC0000` on white (5.89), and never sits directly on the gray page bg.
- Link on page bg passes at 4.72 with no margin to spare, underline is mandatory anyway; don't lighten this blue, ever.

### midnight

| Pair | FG | BG | Ratio | Verdict |
|---|---|---|---|---|
| text | `#CCCCCC` | `#000000` | 13.08 | AAA |
| headings | `#FFFF00` | `#000000` | 19.56 | AAA |
| link | `#00FFFF` | `#000000` | 16.75 | AAA |
| visited | `#CC99FF` | `#000000` | 9.57 | AAA |
| accent | `#00FF00` | `#000000` | 15.30 | AAA |

Ruling: nothing to fix. The theme every 1998 GeoCities page wanted to be, and it's AAA across the board.

### bevel

| Pair | FG | BG | Ratio | Verdict |
|---|---|---|---|---|
| text on face | `#000000` | `#C0C0C0` | 11.54 | AAA |
| link on face | `#000080` | `#C0C0C0` | 8.80 | AAA |
| titlebar text | `#FFFFFF` | `#000080` | 16.01 | AAA |
| desktop label (white) | `#FFFFFF` | `#008080` | 4.77 | AA |
| black on desktop teal | `#000000` | `#008080` | 4.40 | AA-large only |
| bevel shadow vs face (non-text) | `#808080` | `#C0C0C0` | 2.17 | below 3:1 |
| bevel light vs face (non-text) | `#FFFFFF` | `#C0C0C0` | 1.82 | below 3:1 |
| window face vs desktop (non-text) | `#C0C0C0` | `#008080` | 2.62 | below 3:1 |

Rulings:

- **Bevel highlights and shadows are decorative depth**, not the component boundary. Every interactive bevel control therefore carries the era-correct `#000000` dark edge, `--rs-bevel-dark` on the bevel recipe's bottom/right borders, plus the full black ring on `rs-btn--primary`, 11.54 vs the face, 4.40 vs the desktop, and *that* edge satisfies non-text contrast (1.4.11). The dark edge is baked into the recipe, not a styling option.
- Text directly on the teal desktop defaults to white (4.77). Black-on-teal is restricted to large text.
- Disabled bevel controls use the authentic `#808080`-with-white-emboss treatment, exempt as inactive UI, and it still *reads* disabled, which is the point.

### phosphor

| Pair | FG | BG | Ratio | Verdict |
|---|---|---|---|---|
| text | `#33FF33` | `#000000` | 15.49 | AAA |
| dim | `#00CC00` | `#000000` | 9.64 | AAA |
| link | `#66FF66` | `#000000` | 16.06 | AAA |
| visited | `#339933` | `#000000` | 5.75 | AA |
| alert amber | `#FFCC00` | `#000000` | 13.89 | AAA |

Ruling: fully passing, even the "dim" green clears AAA. Visited vs unvisited link greens differ only by color, which WCAG permits for visited state; the underline carries link identity regardless.

### kawaii

| Pair | FG | BG | Ratio | Verdict |
|---|---|---|---|---|
| text on sheet | `#663366` | `#FFFFFF` | 9.42 | AAA |
| text on page bg | `#663366` | `#FFCCFF` | 6.87 | AA |
| link on sheet | `#CC0066` | `#FFFFFF` | 5.59 | AA |
| link on page bg | `#CC0066` | `#FFCCFF` | 4.08 | AA-large only |
| visited on sheet | `#9933CC` | `#FFFFFF` | 5.68 | AA |
| visited on page bg | `#9933CC` | `#FFCCFF` | 4.14 | AA-large only |
| text on blue accent | `#663366` | `#99CCFF` | 5.58 | AA |
| text on yellow accent | `#663366` | `#FFFF99` | 8.97 | AAA |
| link on blue accent | `#CC0066` | `#99CCFF` | 3.31 | AA-large only |
| visited on blue accent | `#9933CC` | `#99CCFF` | 3.36 | AA-large only |

Rulings:

- Canon link/visited colors are fine **on the white sheet** and stay canonical there.
- **On tinted surfaces** (pink page bg, `#99CCFF` / `#FFFF99` accent panels) they fail body-text AA. Fix, shipped: tinted-surface tokens `--rs-link-tinted: #990066` and `--rs-visited-tinted: #663399`, both web-safe. Measured: `#990066`: 6.02 on pink, 4.88 on blue accent, 8.25 on white; `#663399`: 6.14 on pink, 4.98 on blue accent, 8.41 on white. The theme's surface rules swap the tokens automatically, the body rule takes the tinted pair, the white `.rs-page` sheet restores the canonical one; page authors never pick.

### y2k

| Pair | FG | BG | Ratio | Verdict |
|---|---|---|---|---|
| text on silver panel | `#000000` | `#CCCCCC` | 13.08 | AAA |
| text on dark page | `#CCFFFF` | `#000033` | 18.43 | AAA |
| link on dark | `#00CCFF` | `#000033` | 10.58 | AAA |
| accent as body text on dark | `#3366FF` | `#000033` | 4.28 | AA-large only |
| accent on silver (non-text) | `#3366FF` | `#CCCCCC` | 2.92 | below 3:1 |
| white on accent | `#FFFFFF` | `#3366FF` | 4.68 | AA |
| black on accent | `#000000` | `#3366FF` | 4.49 | AA-large only |
| silver panel vs dark page (non-text) | `#CCCCCC` | `#000033` | 12.48 | AAA |

Rulings:

- **`#3366FF` is chrome, not prose.** As text on the dark page it is restricted to large text, which suits it: the accent's natural habitat is 24px+ Impact display type. Body-size accent text on dark uses `#6699FF` (7.22, AAA) via `--rs-accent-text`, shipped.
- **`#3366FF` on silver fails even non-text 3:1 (2.92).** On silver panels it is decorative-graphics-only; anything interactive or meaning-bearing on silver uses `#0033CC` (5.58) via `--rs-accent-on-panel`, shipped, and the theme's link color takes it too.
- Text on the accent itself is white (4.68), not black (4.49, just misses AA).

### Matrix maintenance

The gate behind this matrix is `scripts/contrast.mjs`: it reads the `--rs-*` color tokens from each theme file and measures six meaning-bearing pairs (body text, muted, link, visited, heading, titlebar text on titlebar) against static AA / AA-large thresholds; any failing pair fails CI. The full matrix above is hand-maintained prose.

## Screen reader patterns

### Decorations are structurally silent

All eye-candy overlays, cursor-trail, snowfall, sparkle, neko, starfield, dvd, crt, are injected by the engine with the full silence kit, so authors cannot half-apply it:

```html
<canvas class="rs-snowfall" aria-hidden="true"></canvas>
```

```css
.rs-snowfall, .rs-cursor-trail, .rs-sparkle-layer, .rs-neko,
.rs-starfield, .rs-dvd, .rs-crt {
  position: fixed;
  inset: 0;
  pointer-events: none;
}
```

Invariant: an `aria-hidden` subtree never contains a focusable element. The injected overlays satisfy it by construction, `pointer-events: none`, no focusable descendants; axe's `aria-hidden-focus` covers the CI side.

### Live region policy

One page-wide polite announcer, owned by the engine, widgets never create their own:

```html
<div id="rs-live" aria-live="polite" class="rs-sr-only"></div>
```

`Retrostrap.announce(text)` writes to it, debounced 150ms, deduplicating consecutive identical messages.

| Widget | Live announcements | Ruling |
|---|---|---|
| ticker | none | The full item list is ordinary readable DOM; announcing a repeating loop is spam |
| clock | none | sr-only `<time>` value refreshed once per minute; read on demand, never pushed |
| hit-counter | none | Announced exactly once, as normal page text ("You are visitor 4,660."), not on any tick |
| countdown | completion only | The done text (default "Happy new millennium!", author-customizable via `data-rs-countdown-done`) via `announce()` |
| windows | state changes | "Notes minimized / restored / closed"; on close, focus is handed to the next open window's titlebar, never stranded |
| jukebox | track changes | "Now playing: …" on any track start, including auto-advance |
| guestbook | nothing itself | The widget renders and stays quiet; a page's own sign script announces ("Entry added." in homepage-classic) and validation is native `required`, the browser focuses and names the invalid field |
| marquee | none | no live region: the static copy reads in DOM order, the scroll never announces |

### Meaning-preserving details

- **Smilies:** `alt` equals the original typed text (`alt=":)"`), screen readers say "smiley colon closing-paren"-free honest text, and copy-paste reproduces the source. Never `alt="smiling face emoticon"`.
- **Neko** is `aria-hidden` and announces nothing, ever. The cat is a cat.

## Touch and pointer policy

We detect capability, not device: `(pointer: coarse)` / `(hover: none)` media queries plus Pointer Events throughout (no touch/mouse forked code paths).

| Widget / component | Fine pointer | Coarse pointer |
|---|---|---|
| cursor-trail | follows pointer | No-op, never activates (pointer-only by definition) |
| sparkle | pointer-move sparkles | Responds to taps: a small burst per `pointerdown`, cap unchanged |
| neko | chases the cursor | Falls back to patrolling element edges (no cursor to chase) |
| snowfall / starfield | ambient | Ambient, unchanged; the governor thins them if the device struggles |
| dvd / crt | ambient | Unchanged |
| rs-menu | click/tap and keyboard toggle; hover-open is a CSS bonus, never the mechanism | Tap toggles submenus, open is never hover-dependent |
| rs-window | drag via titlebar; keyboard arrows | Titlebar drag works with touch (Pointer Events + `touch-action: none` on the handle); controls get 44px hit-areas and a wider gap |
| rs-marquee / ticker | pause button; marquee also pauses on hover and focus-within, ticker on hover | The persistent pause button (ticker's rides visibly in the bar; marquee's appears on keyboard focus) |
| jukebox | buttons + sliders | All transport controls carry 44px hit-areas; sliders keep native touch behavior |
| rs-spoiler | click summary | The whole `<summary>` row is the target, full width, ≥ 44px tall |
| konami | keyboard sequence (or a typed cheat word) | Tap alternative, shipped: 10 taps on the widget's host element within 5s fires the same easter egg; also `Retrostrap.konami.trigger()` |
| forms / guestbook / webring | normal | Controls and links spaced to ≥ 24px targets minimum, 44px where isolated |

### The 44px invisible hit-area

Tiny retro controls (16px titlebar buttons, 15px pause glyphs) keep their pixel-perfect size on screen and grow invisibly for fingers:

```css
.rs-hit {
  position: relative;
}
.rs-hit::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: max(100%, 44px);
  height: max(100%, 44px);
  transform: translate(-50%, -50%);
}
```

The `::after` belongs to the button, so taps on it activate the button. Rules: hit-areas must not overlap, where era geometry packs controls tighter than 44px (window control clusters), the coarse-pointer stylesheet widens the gap instead of shrinking the promise:

```css
@media (pointer: coarse) {
  .rs-window__controls { gap: 12px; }
  .rs-titlebar { overflow: visible; }  /* never clip the hit-areas */
}
```

This is a sanctioned bend of the aesthetic: on a phone, a Win95 titlebar breathes a little. WCAG 2.2 asks for 24px (2.5.8); we build to 44px because thumbs did not get smaller since 1999.

### Hover-dependence audit

Nothing essential may be hover-only. Shipping components comply by construction: menus open on tap/click and keyboard; marquee's pause is a persistent button (hover-pause is a bonus, not the mechanism); status-bar link previews in the bevel theme also render on `:focus-visible`; no component reveals content exclusively on `:hover`. Hover adds glitter; it never gates function.

## Performance budgets

Hard numbers. The bundle, theme, and widget rows are enforced by `scripts/sizes.mjs`
(`npm run check:size`) in CI; the page-level rows hold by construction and get checked in
review. All sizes gzipped.

| Asset | Budget |
|---|---|
| core CSS (`retrostrap.css`) | ≤ 25 KB |
| each theme CSS | ≤ 6 KB |
| patterns CSS (tiling background assets, embedded) | ≤ 15 KB |
| core JS (`retrostrap.js`, incl. engine, governor, and all component enhancers) | ≤ 12 KB |
| each widget JS | ≤ 6 KB |
| full toybox bundle (all toybox widgets) | ≤ 30 KB |
| any demo page, total transfer | ≤ 250 KB (about a sixth of a floppy) |
| webfonts | 0 bytes, the Font Law stacks are system fonts |
| third-party requests from shipped code | 0, Decency Law |
| layout shift caused by widgets (CLS) | 0.00 |
| animation target | 60 fps, governor floor at 24 ms frame time |

What the gate actually measures: the first six rows (the file budgets, with `retrostrap.esm.js` held to the core-JS budget alongside the IIFE) plus the `dependencies: {}` invariant. The zero-request rows are enforced by the demos' Decency gate in the e2e suite; the demo-transfer, CLS, and fps rows are design targets, not yet gated.

### The budget governor

The engine owns one global governor; widgets ask it for capacity instead of self-allocating.

```js
// src/js/core/budget.js, constants are canonical
const FRAME_BUDGET = 24;      // ms, sustained frames slower than this trigger degradation
const ALPHA        = 0.1;     // EMA smoothing factor
const DEGRADE_AFTER = 2000;   // ms above budget before stepping down
const RECOVER_AFTER = 10000;  // ms below 16 ms before stepping back up
const PARTICLE_CAP  = 150;    // global live-particle ceiling
const LADDER = [1, 0.75, 0.56, 0.42, 0];  // density multiplier per rung; 0 = ambient off
```

Algorithm:

1. Each rAF tick, update a frame-time EMA: `ema += ALPHA * (dt - ema)`. Deltas over 100ms (tab wake, debugger) are discarded, not averaged.
2. EMA above 24ms continuously for 2s → step down one rung. Every ambient widget multiplies its particle allocation by the rung value on the next spawn cycle (no mass despawn; attrition).
3. Rung 4 (`0`): ambient particles thin to nothing; one `console.warn("[retrostrap] frame budget exceeded, ambient effects disabled")`, and every rung change dispatches `rs:budget:degraded`. Informative widgets are never killed by the governor.
4. Recovery: EMA below 16ms for 10s → step up one rung (hysteresis prevents flapping). The author-configured density is a ceiling the governor never exceeds.
5. Particle ledger: each particle widget claims through its instance handle (`ctx.budget.claim(n)`). Default claims: snowfall its density (20/40/80, numeric cap 100), sparkle 40, cursor-trail 8 (cap 16), starfield its density (60/120/200); dvd and neko claim nothing, one sprite is not a particle system. When the claimed sum exceeds 150, all grants scale proportionally.

### Mandatory engine behaviors

- **Tab hidden ⇒ everything pauses.** One `visibilitychange` listener suspends all rAF loops and CSS animation utility classes (via a root `rs-paused` class).
- **Offscreen ⇒ paused.** Every element-hosted widget registers with the engine's shared `IntersectionObserver` (`rootMargin: "100px"`); full-viewport fixed overlays skip this (they are never offscreen) and rely on `visibilitychange`.
- **Canvas DPR cap:** backing stores scale by `Math.min(devicePixelRatio, 2)`; the full-viewport canvases rebuild on a passive window `resize` listener (a still starfield repaints, since resizing wipes a canvas).
- **Zero layout shift:** overlays are `position: fixed`; in-flow widgets pre-reserve their box, digit widgets set `min-width` in `ch` (fixed-width digits per the Font Law stacks), ticker fixes its bar height, smilies carry `width`/`height` attributes. A widget that moves layout on init is a bug by definition.

### The transform rule

Inside any rAF loop, movement is `transform` only, never `top`/`left`/`width`/`height`, which force layout.

```js
el.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
```

The pixel-crispness ruling: subpixel transforms blur `image-rendering: pixelated` sprites (neko, dvd logo, LED digits), so sprite transforms are **integer-snapped** with `Math.round()`: compositor-fast *and* crisp; we do not fall back to `top`/`left` for crispness, because rounding already solves it. One sanctioned exception: a single `top`/`left` write when a drag or animation *ends* (e.g. committing an rs-window's resting position and clearing its transform), one layout, outside any loop. CSS-driven movement (marquee) uses transform keyframes, with `steps()` where pixel-snapping matters.

## Internationalization posture

The era was resolutely LTR and Latin-1. We reproduce the look, not the parochialism.

- **Logical properties from day one:** `margin-inline`, `padding-block`, `inset-inline-start`, `border-inline-end`: physical `left`/`right` properties are banned in layout code and lint-checked. One deliberate exception: bevel edges. The Win95 light source shines from the top-left as a *physical* metaphor, not a reading direction, so bevel mixins use physical `border-top`/`border-left` on purpose, in exactly one file.
- **`lang` attributes** on `<html>` in every demo, and on inline foreign phrases. All demos are UTF-8.
- **Diacritics are safe:** the nine era stacks (Times, Verdana, Tahoma, Courier New, Georgia, Arial, Comic Sans, Impact, and friends, see [design language](02-design-language.md)) all carry broad Latin coverage; Umlauts, accents, and caron-bearing names render fine at every size in the scale. CJK and non-Latin scripts fall through to system fallbacks, acceptable, noted in docs.
- **RTL is not themed yet, not foreclosed:** we hard-code no directions, scroll direction can follow `dir`, and the layout recipes are logical-property-clean. An RTL pass should be a token audit, not a rewrite.
- **Zoom and reflow:** rem-based type plus mobile-first recipes mean 400% zoom / 320px width reflow (WCAG 1.4.10) works without horizontal scrolling; components tolerate user text-spacing overrides (1.4.12), no fixed-height text boxes except `aria-hidden` LED visuals, which have text equivalents.

## Testing checklist

What "verified" means, repeatable by anyone.

### Automated (every CI run)

- **axe-core via Playwright** (`@axe-core/playwright`) against the kitchen sink and every demo's index page (plus key subpages, 38 pages in the suite); any violation fails the build:

  ```js
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
  ```

  Rules that matter most for us (never disabled without an inline comment and an issue link): `color-contrast`, `button-name`, `link-name`, `label`, `aria-required-children` / `aria-required-parent` (tabs), `aria-allowed-attr`, `nested-interactive` (windows, jukebox), `bypass` (skip link), `region`, `page-has-heading-one`.
- **Contrast regression:** `scripts/contrast.mjs` parses `--rs-*` color tokens from each theme file and measures the six meaning-bearing pairs with the function in [the contrast matrix](#the-contrast-matrix); any pair below its AA / AA-large threshold fails CI.
- **Size budgets:** `scripts/sizes.mjs` against the table in [performance budgets](#performance-budgets).
- **Reduced-motion smoke test:** Playwright `page.emulateMedia({ reducedMotion: "reduce" })`, then assert: no `.rs-snowfall` canvas mounted, no cursor-trail or sparkle layers, neko still visible and motionless, the ticker swaps static text instead of scrolling, `.rs-blink` computed `animation-name` is `none`.

### Manual keyboard-only walkthrough (every release)

1. Unplug the mouse. Really.
2. `Tab` once, the skip link appears, styled, and `Enter` lands focus in `<main>`.
3. Traverse the whole demo: every interactive element reachable, dotted ring visible on each, order matches reading order.
4. Run each keyboard map above against its component, key by key.
5. Open an rs-dialog: focus trapped, `Esc` closes, focus returns to the opener.
6. Open two rs-windows: `F6` cycles them, arrows move via the titlebar, close hands focus to the remaining window's titlebar.
7. Confirm nothing ever traps focus except modal dialogs, and `Space` never scrolls when a control is focused.

### Manual screen-reader pass (VoiceOver + Safari, every release)

1. `Cmd+F5` to start VoiceOver on the kitchen-sink demo.
2. Rotor (`VO+U`) → Landmarks: header, nav, main, footer present and labelled once each.
3. Rotor → Headings: exactly one h1; hierarchy has no gaps.
4. `VO+Right` read-through: decorations (snow, neko, trails, the counters' sprite digits) are never announced; the counter reads once as "You are visitor …".
5. Tabs: arrow between tabs, hear "selected"; panel content reachable.
6. Marquee: hear the news items as plain text, exactly once, no re-announcements while it scrolls.
7. Minimize and restore a window: hear the polite announcement; nothing double-announces.
8. Fill the guestbook form with an error: hear the label, the error text via `aria-describedby`, and land on the invalid field.
9. Play a jukebox track: hear "Now playing: …" once.

### Manual reduced-motion verification (every release)

1. macOS: System Settings → Accessibility → Display → Reduce motion (or DevTools rendering emulation).
2. Walk the [motion policy matrix](#the-motion-policy-matrix) top to bottom against the toybox demo and check every row's PRM column, live, without reloading.
3. Flip the setting back on while the page is open, motion resumes (live `matchMedia` listener works both ways).

## The webmaster's oath

The last page of every retrostrap tutorial, suitable for printing on a dot-matrix printer. Page authors self-certify before shipping; the framework holds up its half of each line.

1. My page works without a mouse.
2. My cat is aria-hidden, and so is every other decoration.
3. My links are underlined, not merely blue.
4. My colors pass the matrix, or honestly wear the large-text badge.
5. My animations bow to prefers-reduced-motion, every last one.
6. Nothing on my page flashes more than three times a second.
7. My tiniest buttons carry invisible 44-pixel hit-areas.
8. My marquee can be paused, and my jukebox never plays first.
9. My page ships no trackers, no autoplay, and no surprise kilobytes.
10. My HTML means what it says beneath the paint.

Sign it, date it, set it in `<blink>` if you must, it blinks at exactly one hertz, and it stands still for those who ask.
