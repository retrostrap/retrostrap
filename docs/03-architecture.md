# Technical architecture

How retrostrap is built. The look is 1999; nothing in this document is.

Contents: [Principles](#principles) · [Repository layout](#repository-layout) ·
[Distribution](#distribution-what-users-get) · [CSS architecture](#css-architecture) ·
[JS architecture](#js-architecture) · [The catalog system](#the-catalog-system) ·
[Asset pipeline](#the-asset-pipeline) · [Build system](#build-system) ·
[Docs site](#the-docs-site) · [Testing](#testing-strategy) ·
[Browser support](#browser-support) · [Security](#security-posture) ·
[Dependency policy](#dependency-policy)

## Principles

1. **Zero runtime dependencies.** Not one. `package.json` `dependencies` is empty forever.
2. **Zero build for users.** Two CDN tags produce a working site. npm/ESM is offered,
   never required.
3. **Progressive enhancement.** CSS ships the complete UI; JS enhances (menus, dialogs)
   and decorates (the Toybox). Removing every `<script>` leaves a working site.
4. **Plain, boring technology.** Hand-written CSS, ES2022 JavaScript with light JSDoc.
   No TypeScript, no preprocessor, no CSS-in-JS. Anyone who knew jQuery-era code can
   read this codebase, that's on purpose, culturally and practically.
5. **One source of truth per fact.** Components are described once (the catalog) and
   everything else, docs pages, manifest, llms.txt, is generated from it.
6. **Small.** Every artifact has a gzip ceiling, enforced in CI. The numbers live in one
   place, the budget table in [08-accessibility-performance.md](08-accessibility-performance.md#performance-budgets);
   we don't restate them here.

## Repository layout

```
retrostrap/
├── README.md, LICENSE, CHANGELOG.md, CONTRIBUTING.md,
│   GOVERNANCE.md, MIGRATIONS.md, THIRD_PARTY.md, …     (the house files)
├── package.json                 name: retrostrap; dependencies: {}, forever
├── playwright.config.js         e2e suite · playwright.visual.config.js  the goldens
├── docs/                        the design docs (this folder), 00-12
├── src/
│   ├── css/
│   │   ├── retrostrap.css       entry, @imports in cascade order
│   │   ├── 00-tokens.css        every --rs-* token, annotated
│   │   ├── 01-reset.css         our own ~60-line reset (see below)
│   │   ├── 02-base.css          body, links, headings, selection, focus
│   │   ├── 03-layout/           container.css, page.css, layout.css, frames.css,
│   │   │                        cols.css, center.css, spacer.css
│   │   ├── 04-components/       mostly one file per component: btn.css, window.css, marquee.css, …
│   │   ├── 05-utilities.css     the small utility set (pad/gap/mt/mb/text/hide/show/pixelated/cursors)
│   │   ├── 06-print.css         print flattens the chrome: black on white, no tiles
│   │   ├── patterns.css         tile classes: CSS gradients + pixel-art PNGs → dist/retrostrap-patterns.css
│   │   └── themes/              nine files (bevel, bubble, cosmic, highcontrast, kawaii,
│   │                            midnight, newspaper, phosphor, y2k); classic is core-inlined
│   ├── js/
│   │   ├── index.js             public surface: Retrostrap global / ESM exports; boot + init
│   │   ├── toybox.js            the all-widgets bundle entry (retrostrap-toybox)
│   │   ├── core/                engine (registry & lifecycle), options, budget (FPS governor),
│   │   │                        events, audit, palette, motion, announce, theme, registry
│   │   ├── components/          the eight enhancers: menu, tabs, dialog, window, marquee,
│   │   │                        spoiler, splash, statusbar
│   │   └── widgets/             one file per Toybox widget: snowfall.js, neko.js, …
│   └── assets-src/              pixel-grid JSON: bullets/, icons/, smilies/, sprites/neko.json,
│                                tiles/, ui/ (cursors, counter digits, select button)
├── catalog/                     THE source of truth (see below)
│   ├── components/<id>.json     one per component
│   ├── widgets/<id>.json
│   ├── themes/<id>.json
│   └── snippets/<id>.html       the canonical copy-paste example per item
├── scripts/
│   ├── build.mjs                esbuild: CSS bundles + JS bundles (IIFE + ESM) + minify
│   ├── assets.mjs               pixel JSON → PNG sheets + steps() CSS + asset manifest
│   ├── catalog.mjs              validate catalog against schema
│   ├── guardrails.mjs           emit dist/guardrails.json (the laws as data)
│   ├── manifest.mjs             emit dist/manifest.json + llms.txt + cheatsheet.md + prompt.txt
│   ├── contrast.mjs             WCAG contrast gate · audit.mjs headless audit · badges.mjs buttons
│   ├── sizes.mjs                gzip size check vs budgets (CI gate) · check-fonts.mjs size scale
│   ├── check-pack.mjs           the npm tarball shape gate
│   ├── serve.mjs                the tiny static server (dev, audit, shots)
│   ├── publish-retrospace.mjs   curated source → the directory's sites.json
│   └── shots.mjs                Playwright screenshots of demos (3 viewports)
├── dist/                        build output, gitignored, published to npm/CDN
├── site/                        Eleventy docs site (dogfoods retrostrap)
├── demos/                       self-contained demo sites (see docs/10)
├── services/                    boards/ (forum), homepage-services/ (counter, guestbook,
│                                webring), retrospace/ (directory), mcp/ (assistant tools)
│                                (separate package.jsons, never imported by the framework)
├── infra/                       infrastructure-as-code for the reference site (infra/README.md)
├── templates/                   drop-in assistant briefings: AGENTS.md and friends (docs/09)
├── tools/                       stylelint-retrostrap, the lint plugin (own package.json)
└── tests/
    ├── unit/                    vitest: options parsing, budget math, the laws (audit
    │                            rules), palette, catalog-vs-CSS, the stylelint plugin
    └── e2e/                     Playwright specs + pages/ (hand-written test pages) +
                                 visual.spec.js-snapshots/ (the golden screenshots)
```

## Distribution: what users get

| File | Contents |
| --- | --- |
| `dist/retrostrap.css` (+`.min`) | reset+base+layout+components+utilities+classic theme |
| `dist/themes/<name>.css` | one theme's token values + skin overrides |
| `dist/retrostrap-patterns.css` | tile classes: gradients inline, pixel tiles via `dist/assets/` |
| `dist/retrostrap.js` (+`.min`) | IIFE: core + component enhancers, global `Retrostrap` |
| `dist/retrostrap.esm.js` | same, ESM |
| `dist/widgets/<name>.js` | one widget, ESM, self-registering |
| `dist/retrostrap-toybox.min.js` | all widgets, IIFE |
| `dist/assets/` | sprite sheets, tiles, cursors, smilies (PNG) |
| `dist/manifest.json` | machine-readable catalog (spec in [09](09-ai-integration.md)) |
| `dist/guardrails.json` | the design laws as data |
| `dist/llms.txt` | AI entry point |

Each bundle, theme, and widget carries a gzip budget that CI enforces; the canonical
figures live in [08-accessibility-performance.md](08-accessibility-performance.md#performance-budgets).

Canonical CDN block (the first thing every doc and every AI sees):

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/retrostrap@0.1.0/dist/retrostrap.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/retrostrap@0.1.0/dist/themes/midnight.css">
<script defer src="https://cdn.jsdelivr.net/npm/retrostrap@0.1.0/dist/retrostrap.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/retrostrap@0.1.0/dist/retrostrap-toybox.min.js"></script>
```

(Real integrations pin exact versions + SRI; see [09](09-ai-integration.md) and [MIGRATIONS.md](../MIGRATIONS.md).)

## CSS architecture

- **Cascade order** (fixed): tokens → reset → base → layout → components → utilities →
  theme file (loaded after core, wins by order not specificity).
- **Specificity discipline:** components are single-class selectors (`.rs-btn`), elements
  `.rs-window__title`, modifiers `.rs-btn--primary`. Max compound depth 2. No IDs. No
  `!important` except where overriding is the point: utilities, the print stylesheet,
  the reset's `.rs-paused` freeze, and the marquee's focus-revealed pause button.
- **Nesting:** native CSS nesting allowed, max one level, only for states/elements of the
  block in the same file.
- **Media queries:** plain `@media (min-width: 800px)` with a `/* svga */` comment, no
  preprocessor variables in queries (custom properties don't work there; we accept the
  repetition, it's four numbers).
- **Reset:** our own ~60 lines. Notably it does *not* strip default underlines on links,
  keeps focus outlines dotted, sets `box-sizing: border-box`, and sets
  `image-rendering: pixelated` opt-in via utility only. `modern-normalize` is not used,
  reading it is homework, shipping it is a dependency.
- Every component file begins with a one-line comment naming its era reference (e.g.
  `/* fieldset-with-legend panels, the way every 1999 form did it */`), the comment
  standard is "webmaster explaining to a friend."

## JS architecture

Full API contract in [06-javascript-api.md](06-javascript-api.md). Structural rules:

- **Boot:** `retrostrap.js` runs `boot()` on `DOMContentLoaded` (or immediately if
  already loaded): initializes component enhancers found by class, then widgets declared
  in `data-rs-widgets` on `<body>` (or any element). Idempotent; `Retrostrap.init(root)`
  re-scans a subtree (SPA support).
- **No-DOM guard:** every entry is SSR-safe, `typeof document === 'undefined'` → no-op.
- **Widget contract:** a widget module default-exports
  `{ id, motion: 'decorative'|'informative', pointer: 'fine'|'any', factory(el, options) }`;
  `factory` returns `{ destroy() }`. The engine handles: option parsing from data
  attributes, reduced-motion policy, coarse-pointer policy, visibility/offscreen pausing
  (engine calls optional `pause()`/`resume()` if the instance exposes them), budget
  registration, and `rs:widget:init` / `rs:widget:destroy` events.
- **The budget governor** (`core/budget.js`): a global registry of live particle counts.
  Each widget declares its ask; when the total exceeds the ceiling, grants scale down
  proportionally. An rAF watchdog keeps an exponential moving average of frame time; a
  sustained slow spell steps the ambient density down a ladder one rung at a time, and at
  the bottom rung ambient effects pause with a single `console.warn`. Every step fires
  `rs:budget:degraded`; a calm stretch climbs back up a rung at a time. The exact ceiling,
  frame budget, ladder, and timings are canonical in
  [08](08-accessibility-performance.md#the-budget-governor).
- **Timing:** one shared rAF loop owned by the engine; widgets register tick callbacks.
  Movement uses `transform: translate3d` **except** pixel-art sprites, which snap to
  integer px via `Math.round` (crispness beats subpixel smoothness, a design-law thing).
- **Events:** `rs:*` CustomEvents on the relevant element, bubbling: `rs:ready`,
  `rs:widget:init`, `rs:widget:destroy`, `rs:budget:degraded`, `rs:theme:change`,
  component events per [06](06-javascript-api.md).
- **Errors:** shipped code never throws for decoration. Widget factory errors are caught,
  logged once (`console.warn` with widget id), widget skipped, page unharmed.
- **CSP:** no `eval`, no `new Function`, no inline event handlers, no injected `<style>`
  (inline `style=""` attributes on generated decoration elements are used and documented;
  strict `style-src` without `unsafe-inline` guidance provided in docs).

## The catalog system

The keystone pattern. Every component, widget, and theme has exactly one catalog entry:

```
catalog/components/window.json      metadata (schema-validated in CI)
catalog/snippets/window.html        the canonical example (plain HTML fragment)
```

`window.json` (schema shipped as `catalog/schema/`):

```json
{
  "id": "window",
  "kind": "component",
  "label": "Window",
  "summary": "Title-barred window chrome with controls, body and status bar.",
  "era": "Desktop application windows, and every DHTML fake-window script of 1999.",
  "since": "0.1.0",
  "stability": "stable",
  "requiresJs": false,
  "jsEnhancer": "window",
  "classes": [
    { "name": "rs-window", "role": "block" },
    { "name": "rs-window__titlebar", "role": "title bar (drag handle when enhanced)" },
    { "name": "rs-window--inactive", "role": "modifier: grayed titlebar" }
  ],
  "a11y": "role note + keyboard map reference",
  "assets": [],
  "tags": ["chrome", "panel", "desktop"]
}
```

Generated from the catalog, by `scripts/`:

1. **Docs pages**: one page per item on the site (snippet rendered live + source shown).
2. **`dist/manifest.json`**: the whole catalog in one machine-readable file.
3. **`dist/llms.txt`** + `cheatsheet.md` + `manifest.json` + `guardrails.json`: AI surfaces ([09](09-ai-integration.md)).

Test pages are *not* generated: `tests/e2e/pages/` holds a small set of hand-written
scenario pages (the kitchen sink, the widget gyms) that exercise many catalog items
each. We don't generate one page per catalog entry; the hand-written scenarios cover
more ground per file.

**Definition of done for any component/widget change:** source + catalog JSON + snippet
updated together, `npm run catalog` green. CONTRIBUTING restates this.

## The asset pipeline

Pixel art as reviewable, diffable text. Source format (`assets-src/**/*.json`):

```json
{
  "id": "smiley-wink",
  "size": [15, 15],
  "palette": { ".": null, "y": "#FFFF00", "k": "#000000", "w": "#FFFFFF" },
  "frames": [
    [ "....kkkkkkk....",
      "..kkyyyyyyykk..",
      ".kyyyyyyyyyyyk.",
      "…13 more rows…" ]
  ],
  "fps": 0,
  "states": null
}
```

`scripts/assets.mjs` (node + pngjs, the only image dependency):

1. Validates: palette colors legal per `guardrails.json`, sizes on-grid, frames consistent.
2. Renders PNGs; multi-frame items become horizontal sprite sheets.
3. Emits `dist/assets/**` plus a generated `sprites.css` with
   `steps()` keyframe animations per animated asset (GIF energy, crisp forever).
4. Emits `dist/assets/manifest.json` (id → file, size, frames) for the widget code and
   the docs.

Animated items (cat, construction barrier, sparkle) define named `states` mapping to
frame ranges; `neko.js` drives states directly, CSS animations serve the simple loops.
Drawing happens in JSON by hand; it's surprisingly pleasant, the rows are strings.

## Build system

- `npm run build` → `scripts/build.mjs`: esbuild bundles
  - CSS: `src/css/retrostrap.css` (inlines `@import`s) → `dist/retrostrap.css` + minified;
    each theme and patterns.css likewise.
  - JS: `src/js/index.js` → IIFE (`Retrostrap` global) + ESM; each widget → own ESM file;
    all widgets → `retrostrap-toybox.min.js`.
  - Then `assets.mjs` → `guardrails.mjs` → `manifest.mjs` in sequence (build.mjs); the
    catalog/contrast/audit/size gates run as their own steps.
- Everything else is a one-line script. The full set, which CI and the PR template
  reference by these exact names:

| Command | What it does |
| --- | --- |
| `npm run dev` | esbuild **watch** plus a static server on `demos/` and `tests/e2e/pages/` |
| `npm run serve` | build **once**, then that same static server (no watch) |
| `npm test` | vitest: the laws, the options parser, budget math, framework + services |
| `npm run test:smoke` | Playwright: demos, catalog pages, axe, the audit |
| `npm run test:visual` | Playwright golden-screenshot diff (its own config) |
| `npm run site` | Eleventy serve of `site/`; `npm run site:build` builds it (reads `dist/`, so build first) |
| `npm run catalog` | validate the catalog against its schema |
| `npm run contrast` | recompute the [doc-08](08-accessibility-performance.md) contrast matrix per theme |
| `npm run check:size` | gzip budgets vs the doc-08 table |
| `npm run check:fonts` | Font Law: every size comes from the seven-step scale |
| `npm run check:pack` | the npm tarball shape gate |
| `npm run audit` | headless `Retrostrap.audit()` over the kitchen sink and demos |
| `npm run shots` | demo screenshots at the three canonical viewports |
| `npm run badges` | render the 88×31 "made with retrostrap" buttons |
- Node LTS; everything runs from a fresh `npm install`, no global installs.

## The docs site

- `site/` is an Eleventy project: Markdown + Nunjucks templates, styled entirely by
  retrostrap (dogfood #1).
- Sections: Home (party mode lives here) · Get started · Components (generated) ·
  Widgets (generated) · Themes (live switcher) · Playground (textarea → sandboxed iframe
  preview) · The Museum (public version of [01](01-history-research.md)) · For robots
  (AI surfaces) · Community.
- The site must pass its own audit and its own budgets, it is the
  reference deployment.

## Testing strategy

| Layer | Tool | What |
| --- | --- | --- |
| Unit | vitest | options parsing/casting, budget math, the design laws over the CSS source, the palette, the stylelint plugin |
| Smoke | Playwright | the hand-written test pages + every demo: loads, no console errors, `rs:ready` fires, axe-core clean |
| Behavior | Playwright | keyboard maps (menu/tabs/dialog/window), reduced-motion behaviors via emulation, touch no-ops |
| Visual | Playwright screenshots | golden PNGs of the kitchen sink + three demos at 1000×800, committed to the repo (`shots.mjs` does the 375/800/1280 demo triple, for eyes, not for the gate) |
| Size | `sizes.mjs` | gzip budgets per artifact, hard CI gate |

Rule of thumb: unit tests for logic, Playwright for anything with a DOM, and no test
that re-asserts what the type of thing already guarantees.

## Browser support

Evergreen: last 2 major versions of Chrome/Edge/Firefox/Safari. No IE, no polyfills.
Feature policy: baseline-widely-available features free to use; newer ones
(View Transitions API, `::details-content`) must degrade to nothing behind `@supports`/
feature checks, the `transitions` widget is a no-op where unsupported, never an error.

## Security posture

- Shipped JS never parses HTML from strings: decoration nodes are built with
  `createElement`; the smilies parser operates on text nodes only and sets `alt`
  attributes via properties.
- Anything accepting user content (guestbook frontend) renders text nodes, full stop.
  Server-side rules live with the services ([11](11-community-forum.md)).
- No secrets anywhere in this repo; services get their own env handling.
- `SECURITY.md` + private vulnerability reporting per [SECURITY.md](../SECURITY.md).

## Dependency policy

Runtime: **zero, forever** (enforced by CI: `dependencies` must be `{}`).
Dev allowlist: `esbuild`, `@11ty/eleventy`, `vitest`, `@playwright/test`, `axe-core`
(+ `@axe-core/playwright`), `pngjs`, `stylelint` (+ our plugin). Adding anything else
requires a written justification and maintainer sign-off first. Every dev
dependency must be replaceable in a weekend, we felt the left-pad tremors of the old
web and learned.
