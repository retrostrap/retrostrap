# The Toybox: widget catalog

Widgets are the *decorations and toys*: the cat, the snow, the cursor trail, the
guestbook. They are JavaScript, individually loadable, and strictly optional, a
retrostrap page with zero widgets is still a retrostrap page.

Engine and API details live in [06-javascript-api.md](06-javascript-api.md);
accessibility/motion policy details in [08-accessibility-performance.md](08-accessibility-performance.md);
era references for each widget in [01-history-research.md](01-history-research.md).

## The Toybox contract

Every widget, no exceptions, obeys all ten:

1. **Budgeted**: declares max particles/nodes; registers with the budget governor;
   accepts degradation.
2. **Pausable**: pauses when the tab is hidden and when its host is offscreen.
3. **Destroyable**: `destroy()` removes every node, listener, and timer it created.
4. **Reduced-motion aware**: declares `motion: 'decorative' | 'informative'`;
   decorative widgets don't animate under `prefers-reduced-motion` (specific behavior
   per widget below).
5. **Pointer-aware**: declares `pointer: 'fine' | 'any'`; fine-pointer widgets no-op or
   fall back gracefully on touch devices.
6. **Invisible to assistive tech**: decoration is `aria-hidden="true"` and
   `pointer-events: none`; interactive widgets follow the a11y doc's patterns instead.
7. **Non-obstructive**: never blocks content, never traps focus (except a modal dialog
   doing its native job), never exceeds its z-band (`--rs-z-fx` 600 for overlays).
8. **Network-silent**: no requests unless the page author configured an endpoint
   (hit-counter api mode, webring JSON, guestbook endpoint), and those are documented
   loudly per Decency Law.
9. **Config via data attributes**: `data-rs-<widget>-<option>`, JS options win over
   attributes; sane defaults mean zero config works.
10. **Fails silent**: a widget error logs one warning and vanishes; the page never breaks.

One handshake on top of the ten: anything that injects new text after the first paint,
a widget (the guestbook rendering its entries) or the page's own script, announces it
with a bubbling `rs:content` event from the inserted element. Text-decorating widgets
(smilies today) listen and re-run over just that subtree. No event, no conversion;
that is the whole protocol.

## Using widgets

```html
<script defer src=".../retrostrap.min.js"></script>
<script defer src=".../retrostrap-toybox.min.js"></script>
<body data-rs-widgets="snowfall neko"
      data-rs-snowfall-density="light"
      data-rs-neko-behavior="patrol" data-rs-neko-target="header">
```
Or per-element, or programmatically, see [06](06-javascript-api.md). Loading a single
widget: `<script type="module" src=".../widgets/snowfall.js">` (self-registers).

**Rule of taste (documented default):** two decorative widgets per page is plenty.
When a `data-rs-widgets` scan finds more than two ambient effects, the engine says so
once in the console.

---

## The widgets

### cursor-trail
Things that follow your mouse. The Comet Cursor of our hearts.
- **Era:** DHTML trail scripts, Comet Cursor (see [01](01-history-research.md)).
- **Motion:** decorative · **Pointer:** fine (no-op on touch) · **Budget:** ≤ 16 nodes.
- Implementation: fixed-position DOM pool (styleable pixel sprites), one rAF, per-node
  lerp with stepped delay; nodes snap to integer px.

| Option (`data-rs-cursor-trail-*`) | Type/enum | Default | Limit |
| --- | --- | --- | --- |
| `variant` | `dots·stars·sparkle·hearts·bubbles·image` | `stars` | - |
| `count` | int | 8 | max 16 |
| `size` | px int | 12 | max 24 |
| `color` | color string | theme `--rs-accent` | keep it legal; the audit checks the paint |
| `image` | URL (variant=image) | - | 24px max |

- Reduced motion: disabled entirely. Touch: disabled.
- Events: none. A11y: nodes `aria-hidden`, `pointer-events:none`.
- Accept: trail follows within 1 frame; destroy leaves zero nodes.

### kugeln
The shiny spheres that chase your pointer, a rainbow of them, or a ring that orbits.
- **Era:** the spinning-ball DHTML cursor toys of ~2000 (see [01](01-history-research.md)).
- **Motion:** decorative · **Pointer:** fine (no-op on touch) · **Budget:** ≤ 12 spheres.
- Implementation: fixed-position DOM pool of pixel-sphere sprites (one PNG per color,
  shaded inside the palette, so the 3D sheen never leaves the legal 224). One rAF; trail
  mode is a lerp chain, orbit mode rings the pointer at a turning angle.

| Option (`data-rs-kugeln-*`) | Type/enum | Default | Limit |
| --- | --- | --- | --- |
| `colors` | `rainbow` or red·gold·green·cyan·blue·purple·pink·silver | `rainbow` | - |
| `count` | int | 7 | max 12 |
| `size` | px int | 20 | 8-32 |
| `mode` | `trail · orbit` | `trail` | - |

- Reduced motion: disabled entirely. Touch: disabled.
- Events: none. A11y: layer `aria-hidden`, `pointer-events:none`.
- Accept: spheres follow within a frame; orbit rings the cursor; destroy leaves zero nodes.

### snowfall
Falling things. Snow first, but the engine is "falling glyphs."
- **Era:** the JavaScript snow script every winter homepage had.
- **Motion:** decorative · **Pointer:** any · **Budget:** density counts, cap 100.
- Canvas overlay (fixed, full-viewport, DPR-capped at 2).

| Option | Enum/type | Default | Limit |
| --- | --- | --- | --- |
| `density` | `light=20 · normal=40 · blizzard=80` or a number | `normal` | cap 100 |
| `glyph` | `star · heart · leaf · confetti` | pixel flake | - |
| `speed` | `slow·normal·fast` | `normal` | - |
| `wind` | -2..2 | 0 | clamped |
| `melt` | bool (fade last 10%) | true | - |

- A `zone` option (snow over one element instead of the viewport) is not supported yet;
  the canvas covers the viewport.
- Reduced motion: off (canvas never created). Tab hidden: paused.
- Events: none. Accept: 60fps at blizzard on a 2020 laptop; governor degrades under load;
  flakes render *behind* open menus/dialogs (z-band).

### sparkle
Twinkles at the cursor and/or ambient twinkles on a container ("sparkling backgrounds").
- **Era:** glitter graphics and sparkle-trail scripts.
- **Motion:** decorative · **Pointer:** any (pointer mode listens on touch too; a tap
  sparks)
- **Budget:** ≤ 40 live particles.

| Option | Enum | Default |
| --- | --- | --- |
| `mode` | `pointer · ambient · both` | `pointer` |
| `trigger` | `move · click` (pointer mode; `move` sparks on clicks too) | `move` |
| `palette` | `gold · ice · rainbow · theme` | `theme` |
| `color` | one legal color (overrides `palette`) | - |
| `zone` | selector (ambient) | host element |

- Ambient mode: single ✦ glyphs fading out at deterministic spots in the zone, one
  every ~400ms, this is the "sparkling background" feature, layered over any `rs-` tile.
- Reduced motion: off. Accept: a click sparks one twinkle; ambient paces itself at
  one per ~400ms per zone.

### neko
The pixel cat. Chases your cursor, or patrols the edges of an element (the cat that
walks across your header). Default skin is Gif the cat, the mascot.
- **Era:** the desktop cat tradition (Neko/oneko lineage, history in [01](01-history-research.md)).
- **Motion:** decorative · **Pointer:** any (chase needs fine; falls back to patrol) ·
  **Budget:** 1 sprite, max 2 instances page-wide.
- Sprite: 16×16 frames drawn at 2× (a 32px cat), six frames: sit/alert/run1/run2/
  sleep/groom, mirrored for direction (sheet spec in
  [03](03-architecture.md#the-asset-pipeline)); moves at integer px, ~6 fps run steps.

| Option | Enum/type | Default | Limit |
| --- | --- | --- | --- |
| `skin` | `gif · calico · void` | `gif` | - |
| `src` | URL (custom sprite sheet, same six-frame layout) | the skin's shipped sheet | - |
| `behavior` | `chase · patrol · sleepy` | `chase` | - |
| `target` | selector (patrol path = element's top edge) | none | - |
| `speed` | `slow=40 · normal=80 · fast=140` px/s | `normal` | - |

- Behavior FSM: chase → reach cursor → sit → groom → sleep; wakes on move. Patrol:
  walks the target's top edge back and forth with a short beat at each end; without a
  target the cat just sits where it started.
- Reduced motion: **the cat stays, sitting** (one static frame, nothing moves).
  Touch + chase: auto-patrol.
- Events: `rs:neko:sleep`, `rs:neko:wake` (for easter eggs).
- Accept: never overlaps an open menu/dialog (z-band below chrome); destroy removes cat;
  two cats max, third init warns and no-ops.

### pixel-pet
A virtual pet in the corner. Feed it and it perks up; leave it and it gets hungry, then
naps. It remembers its name, coat, and last meal between visits.
- **Era:** the virtual pets of the early-2000s web, a creature that lived on your page.
- **Motion:** informative · **Pointer:** any · **Budget:** 1 pet page-wide.
- Sprite: 16×16, moods idle/happy/hungry/sleep, four coats; state persists in localStorage.

| Option (`data-rs-pixel-pet-*`) | Type/enum | Default | Limit |
| --- | --- | --- | --- |
| `name` | string | `Blobby` | - |
| `color` | `green · blue · pink · gold` | `green` | - |
| `pace` | seconds until fully hungry | 300 | - |

- The pet is a real labelled `<button>` you feed by click or keyboard; its mood shows as
  text. Appears (static) under reduced motion, no idle fidget, feeding still works.
- Events: `rs:pixel-pet:fed` (and a rare `rs:pixel-pet:gold`).
- Accept: one pet page-wide; feeding resets hunger and persists; destroy leaves nothing.

### ticker
Status-bar text scroller, docked bar or inline, the `window.status` gag, on-page.
- **Era:** status-bar scrollers ("Welcome to my page!!!").
- **Motion:** informative · **Pointer:** any · **Budget:** 1 node.

| Option | Type | Default |
| --- | --- | --- |
| `messages` | JSON array attr or child `<li>`s | required* |
| `source` | selector of a (hidden) `<ul>` to read | - (*alternative to `messages`) |
| `speed` | `slow·normal·fast` (marquee speeds) | `normal` |
| `dock` | `bottom · none` (inline) | `none` |
| `separator` | string | `+++` |

- Reduced motion: discrete message swap every 5s, no scroll (informative → not removed).
- A11y: container is a `<p>`; NOT `aria-live` (see [08](08-accessibility-performance.md));
  pauses on hover, and a real pause/resume button covers keyboard and touch.
- Accept: seamless loop; dock never overlaps content (body gets padding-bottom).

### clock
LED/LCD clock: sunken bezel, 7-segment digit sprites.
- **Motion:** informative · **Budget:** 1 node, 1 Hz interval.
- Options: `format` `12|24` (default 24), `seconds` bool (true), `label` string
  ("server time" gag encouraged in docs).
- Reduced motion: unchanged (1 Hz digit swap is not motion). A11y: `aria-hidden` digits +
  `rs-sr-only` textual time updated once a minute.

### last-updated
Prints `document.lastModified` era-style: "Last updated: Friday, July 10, 2026".
- Options: `format` `long|short`, `prefix` (default "Last updated:"), `locale`
  (default page lang), `date` (pin a date verbatim, a "reviewed on" stamp for
  period demos; skips lastModified entirely).
- Static text; motion n/a. The one widget that's pure nostalgia-by-information.
- Accept: renders SSR-plausible date; hides itself if lastModified is epoch/garbage.

### fortune
The fortune floppy: one line of old-web wisdom, a real button deals the next.
- **Era:** the command line's fortune cookie, pinned to a homepage.
- **Motion:** informative · **Budget:** 2 nodes, no timers.
- Options: `list` via an inline `<script type="application/json">` array of strings;
  fifteen house fortunes ship as the default.
- The pick is seeded off the clock and steps forward, no `Math.random`; each deal fires
  `rs:fortune:next`.
- A11y: plain text plus a real `rs-btn`; nothing moves, nothing autoplays.
- Accept: bad inline JSON falls back to the house list; `destroy()` removes both nodes.

### hit-counter
Odometer digits in the `rs-counter` shell.
- **Era:** counter services; odometer aesthetics.
- **Motion:** informative · **Budget:** 1 node.

| Option | Enum/type | Default |
| --- | --- | --- |
| `mode` | `static · local · api` | `static` |
| `value` | int (static) | 1337 |
| `src` | URL (api) | - |
| `digits` | zero-pad width | 6 |

- The label line is markup, not an option: write your own `rs-counter__label`.
- `local`: localStorage per-browser count; the spoken line says so ("This is visit
  number 5 from this browser."), honest.
- `api` contract: `GET src?page=<path>` → `{"count": n}`; `POST` same URL increments and
  returns new count. **The spec forbids the endpoint storing identifiers** (IP, UA),
  the companion services implement exactly this ([11](11-community-forum.md)).
- Reduced motion: nothing to calm, the digits are static sprites. A11y: announced once
  on load via `rs-sr-only` ("You are visitor number 4,217."), never on tick.
- Accept: api failure → renders `------` and one dev warning; no retry storms (max 1 retry).

### smilies
Text → pixel emoticons. `:)` becomes a 15×15 sprite with `alt=":)"`.
- **Era:** forum smiley packs.
- **Motion:** none (static sprites) · **Budget:** parse-once, plus a scoped re-walk
  when an `rs:content` event announces injected text (the contract handshake above).
- Pack v1 (12 faces): `:) :( ;) :D :P :o 8) :| xD <3 :3 ^_^` (dash and capital
  variants like `:-)` and `:P`/`:p` fold onto the same frames). The cry/angry/confused
  faces and the `:lol:`-style word codes are planned, not yet.
- Options: `scope` selector (default host), `src` (override the sheet URL); `pack` and an
  `extra` code→image map stay future.
- Parser: text nodes only; skips `pre, code, kbd, samp, script, style, input, textarea,
  a, button, [data-rs-no-smilies]`; idempotent; longest-match; word-boundary rules so
  `8)` inside "48)" doesn't fire.
- A11y: `alt` = original code (copy/paste and screen readers get the text back, the
  correct behavior AND the era behavior).
- Accept: 10 000-node page parses < 16ms; destroy restores original text nodes.

### starfield
Warp-speed stars on canvas. Options: `density` (`sparse=60·normal=120·dense=200`, or a
number, cap 200), `speed`, `layers` 1-3 parallax. A `direction` option is not supported
yet; the flight is always toward you. Decorative; reduced motion → **static
star sprinkle** (keeps the look, drops the motion). The midnight theme's page tile
pairs with it.

### transitions
Page wipes for multi-page sites via the View Transitions API (progressive: no support →
instant navigation, never an error). Styles: `box-in · box-out · wipe · dissolve ·
checker`, all stepped via `steps()` (the PowerPoint-meets-IE repertoire). Option:
`style`, one per page; a per-link `data-rs-transition` override is not supported yet.
Reduced motion: none (API respects it; we double-enforce). Accept:
back/forward feel instant (wipes run 150ms in six steps; checker 200ms).

### webring
Fills the `rs-webring-bar` shell from ring JSON.
- Ring file: `{"name": "…", "home": url, "sites": [{"title","url"}…]}`: hosted anywhere
  (same-origin or CORS-open; the companion services host rings too).
- Computes prev/random/next from `location.origin+path` match; graceful "not in ring"
  state links to ring home.
- Informative; no motion. Accept: works from `file://` demos with inline JSON
  (`<script type="application/json">` alternative source).

### guestbook
The frontend: entry list renderer + submission form wiring for the `rs-` form components.
- Sources: `src` option (endpoint or JSON file URL; JSON contract documented with the
  companion service) or inline JSON via `<script type="application/json">` (demo mode).
  A zero-backend mailto guestbook is plain markup (`<form action="mailto:…">`, real and
  honorable); the widget leaves that form alone apart from the traps below. Read from
  file, sign by mail = `src` + a mailto form, the homepage-classic demo's mode.
- Entries render as `rs-panel` cards: name, date, homepage link (rel=nofollow ugc),
  message (text nodes only, no HTML, no BBCode client-side). A mood smiley field is
  planned, not yet.
- Honeypot field + min-time check client-side; the service adds the real protection.
- Emits `rs:content` after rendering entries, so the smilies pass covers them too.
- Informative. Accept: an XSS attempt in a message renders as literal text; endpoint down →
  friendly "the guestbook is taking a nap" `rs-alert`.

### jukebox
Playlist audio player in `rs-window` chrome: LCD title, prev/play/stop/next bevel
buttons, volume slider, seek bar (a native range, keyboard-operable for free), track list.
- **Never autoplays. There is no autoplay option (Decency Law).**
- Options: `tracks` (title+src pairs, attribute JSON or an inline
  `<script type="application/json">`), `src` (a fallback audio URL: plays when a track
  has no src of its own, or alone as a one-track player; never fetched as a playlist),
  `loop` (playlist loop, default off).
- Fake 8-bar EQ animation while playing (steps; decorative → static bars under reduced
  motion). A real analyser is planned, not yet.
- A11y: full keyboard map ([08](08-accessibility-performance.md)); track changes announced politely.
- Events: `rs:jukebox:track` on each track change (`{index, title}`).
- Accept: keyboard-only full operation; suspended tab pauses audio? No, audio continues
  (user chose to play it); only visuals pause.

### windows
The draggable-window manager for `rs-window` elements marked `data-rs-window="floating"`.
- Drag by titlebar (pointer + keyboard: focus titlebar, arrows move 16px, Shift for finer 2px steps) and
  focus-brings-to-front within the `--rs-z-window` band. Minimize and close live on the
  `rs-window` enhancer (doc 06), not here.
- Limits: max 5 floating windows; positions clamped to viewport; below `svga` floating
  is disabled (windows render static full-width, touch dragging small titlebars is misery).
- Events: emits `rs:window:focus`; accepts `rs:window:raise`, dispatch it on a window
  and the manager lifts it (how a taskbar reaches one buried behind another).
- Accept: no window can be dragged offscreen; z war impossible (band-internal counter).

### dvd
Bounces an element around the viewport; the sacred double-edge corner hit gets its own
little celebration (you know why).
- Off unless explicitly initialized; the docs pair it with `konami`.
- Options: `target` selector (an existing element to borrow; default: a generated logo
  chip), `text` (the chip's label, default "retrostrap"), `speed`.
- Decorative; reduced motion → the chip parks visible in the top corner, holding still.
- Accept: perfect elastic bounces; a corner hit fires `rs:dvd:corner` (empty detail,
  an extension seam; the widget celebrates on its own) with a 5s cooldown; destroy
  hands a borrowed target back untouched.

### konami
Key-sequence easter-egg registrar. `Retrostrap.konami.on(seq, fn)` + data-attr
shorthand for the classic code (the `seq` argument is reserved: today every listener
fires on the classic code and on registered cheat words). Declarative mode:
`data-rs-konami-href` navigates to a secret page instead of running party mode (the
fanpage demo's egg); `Retrostrap.konami.trigger()` fires it programmatically (used by
the touch gesture); `Retrostrap.konami.code` spells the classic code out.
- Typed cheat words too: `data-rs-konami-words="gif,plugh"` arms extra words, and
  `xyzzy` is always armed; it answers "Nothing happens." first, then parties anyway.
- Ships **party mode**: the classic code triggers 30 seconds of snowfall(confetti) +
  sparkle(rainbow) + dvd("★ retrostrap ★"), then cleans up completely; Escape ends it
  early. All within budgets; reduced motion → party mode politely declines and shows a
  static "you found it!" `rs-note` (no Unicode emoji, that is what the smilies pack is
  for). The same code is the docs site's own easter egg.
- Sequences are keyboard-first by design; on touch, ten taps on the widget's host
  within five seconds trigger it.
- Accept: party mode cannot stack (re-trigger during party = ignored); auto-teardown verified.

### countdown
LED countdown to a target datetime ("party like it's 1999/2000!"). A flip-digit
style is planned, not yet.
- Options: `to` (ISO datetime, required), `done` message string (default "Happy new
  millennium!").
- Informative: a changing digit is content, so reduced motion keeps the count;
  announces remaining time via `rs-sr-only` once a minute, not every second.
- Accept: timezone-honest (UTC attr, local display); reaching zero fires `rs:countdown:done`.

### crt
The scanline/CRT overlay as a managed widget (the `rs-crt` class does the static CSS
version; the widget adds a vignette, on by default, `vignette=false` turns it off).
- **Flicker exists as an option and defaults off; capped far below photosensitivity
  thresholds; documented with a warning.** Reduced motion: static scanlines only.
- Accept: overlay never affects text selection or hit targets (`pointer-events:none`).

---

## Writing your own widget (authoring guide)

The short form:

```js
// my-widget.js, community widgets use the rsx- prefix
export default {
  id: 'rsx-fireflies',
  motion: 'decorative',
  pointer: 'any',
  factory(el, options, ctx) {      // ctx: {options, budget, ticker, reducedMotion,
                                   //       pointerCoarse, emit, announce, log}
    const max = ctx.budget.claim(30); // ask the governor; it grants what the page can afford
    const nodes = [];
    const stop = ctx.ticker.add((dt) => { /* move things, never more than max */ });
    return {
      pause() {}, resume() {},
      destroy() { stop(); nodes.forEach(n => n.remove()); }
    };
  }
};
// register: Retrostrap.widget.register(fireflies)
```

Rules for community widgets: `rsx-` id prefix (bare names are reserved for the Toybox),
obey the ten-point contract, pass `Retrostrap.audit()`, and declare an era reference in
your README. The docs site's widget page ends with a planned gallery of community
widgets.
