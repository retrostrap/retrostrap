# JavaScript API

The complete public surface of `retrostrap.js` and the widget engine. Small on purpose:
if the API fits in your head, it fits in a prompt, and it fits in 1999.

Architecture context in [03-architecture.md](03-architecture.md); widget catalog in
[05-widgets.md](05-widgets.md).

## The global surface

IIFE build exposes `window.Retrostrap` (alias `window.RS`). ESM build exports the same
object as named exports.

```js
Retrostrap.version          // "0.0.1"
Retrostrap.init(root?)          // scan & enhance a subtree (default: document)
Retrostrap.destroy(root?)       // tear down everything init created in a subtree
Retrostrap.config(opts?)        // get/merge global config (assetBase lives here)
Retrostrap.widget               // the widget engine (below)
Retrostrap.ui(el, name?)        // a component enhancer's per-element handle
Retrostrap.audit(opts?)         // guardrail checker (dev)
Retrostrap.budget.status()      // { particles, cap, degraded, level, frameMs }
Retrostrap.motion.allowed()     // reduced-motion gate every rAF loop consults
Retrostrap.motion.reduced()     // the same reading, inverted
Retrostrap.motion.onChange(fn)  // run fn on every preference flip; returns an off()
Retrostrap.on(type, fn)         // listen for an rs: event on document
Retrostrap.emit(el, type, detail?)  // fire an rs: event from an element
Retrostrap.announce(text)       // the one polite live region (see doc 08)
Retrostrap.theme.set(name)      // set data-rs-theme + persist to localStorage (helper)
Retrostrap.theme.get()
Retrostrap.enhancers            // the registered component enhancers (tooling looks here)
Retrostrap.dialog.alert(msg, opts?)    // Promise<void>   system-styled
Retrostrap.dialog.confirm(msg, opts?)  // Promise<boolean>
Retrostrap.konami.on(seq, fn)   // when the konami widget is loaded (seq reserved, 05)
Retrostrap.konami.trigger()     // fire the default egg (touch gesture uses this)
Retrostrap.konami.code          // the classic sequence, spelled out
```

That is the whole global API. Component enhancers attach per-element handles instead of
globals (below).

## Boot sequence

1. `retrostrap.js` registers `DOMContentLoaded` (or runs now if ready).
2. `boot()` = `Retrostrap.init(document)`:
   a. enhance components found by class (`.rs-menu`, `.rs-tabs`, `.rs-window`,
      `.rs-marquee`, `.rs-spoiler`, `.rs-splash`, `.rs-statusbar`, `dialog.rs-dialog`);
   b. initialize widgets declared in `data-rs-widgets` (space-separated ids) on any
      element (usually `<body>`);
   c. fire `rs:ready` from `<html>` (it bubbles; listen on `document`).
3. `init()` is idempotent, elements are marked with a private property; re-scanning is
   safe and is the official SPA hook (call after mounting new DOM).

No MutationObserver by default (surprise DOM watching is modern magic; explicit `init`
is boring and predictable). An opt-in `Retrostrap.config({observe:true})` is planned,
not yet.

## Global config

```js
Retrostrap.config({ assetBase: '/vendor/retrostrap/assets' })  // merge
Retrostrap.config()                                            // read it back
```

`config()` merges what you pass into a plain settings object and returns a copy. One
key is consumed today: `assetBase`, where the Toybox loads its pixel sprites (default:
the `assets/` folder next to the retrostrap script tag). A set of tuning knobs (a budget
cap, an ambient-effect cap, a forced reduced-motion, a locale, a debug overlay) is not
exposed yet; their values are currently fixed in the engine (150 particles, the taste
warning above two ambient effects). One thing will stay true whenever they land: there
will be no motion `ignore`, you cannot opt out of respecting the user. Deliberate.

Widget option precedence everywhere: JS options argument > `data-rs-*` attribute > defaults.

## Data-attribute option parsing

One parser (`core/options.js`), one grammar, every widget:

- `data-rs-<widget>-<option-name>`: kebab-case option names map to camelCase.
- Casting rules: `"true"/"false"` → boolean; numeric strings → number; strings starting
  with `[` or `{` → `JSON.parse` (on failure: warn once, use default); everything else →
  string. Color options pass through as strings, the parser does not police them;
  `Retrostrap.audit()` checks the painted result, so keep them legal.
- Selector-typed options resolve at init time; an empty resolution falls back quietly
  (sparkle twinkles its host, neko sits without a target), and a widget left with
  nothing to do at all (a ticker without messages) logs one warning and no-ops. Never
  throws either way.

## The widget engine

```js
Retrostrap.widget.register(def)      // def per the authoring contract (05-widgets.md)
Retrostrap.widget.init(name, el, options?)  // manual init → instance handle
Retrostrap.widget.get(el, name?)     // instance handle(s) attached to el
Retrostrap.widget.list()             // registered ids
```

Instance handle: `{ id, el, options, pause(), resume(), destroy() }`.

The engine owns (widgets never reimplement): option parsing · reduced-motion gate ·
pointer gate · visibilitychange + IntersectionObserver pausing · budget registration ·
the shared rAF ticker (`ctx.ticker.add(fn)` receives `dt` ms; returns remover) ·
lifecycle events.

Registration of an id twice: last one wins with a dev warning (enables local overrides).
Bare ids are reserved for the Toybox; community widgets use `rsx-`.

## Component enhancer APIs

Enhancers auto-attach on `init()`. Each exposes a per-element handle, reachable via
`Retrostrap.ui(el, name?)`:

| Enhancer | Handle methods | Events (bubble from el) |
| --- | --- | --- |
| menu | `open(trigger) close(trigger) closeAll()` | `rs:menu:open`, `rs:menu:close` |
| tabs | `select(idOrIndex)` | `rs:tabs:change` |
| dialog | native `showModal()/close()` + helpers | `rs:dialog:open`, `rs:dialog:close` |
| window | `focus() minimize() restore() close()` | `rs:window:*` (05) |
| marquee | `pause() resume() setSpeed(name)` | `rs:marquee:pause`, `rs:marquee:resume` |
| spoiler | `reveal() hide() toggle()` | `rs:spoiler:toggle` |
| splash | `enter() reset()` (reset forgets localStorage) | `rs:splash:enter` |
| statusbar | passive: shows a hovered/focused link's href | - |
| theme | `Retrostrap.theme.set/get` (global, not per-element) | `rs:theme:change` |

Keyboard behavior for every enhancer is specified in
[08-accessibility-performance.md](08-accessibility-performance.md) and is part of the
enhancer's acceptance criteria, not optional polish.

## Events reference

All events are bubbling, cancelable-where-meaningful `CustomEvent`s with `detail`:

| Event | Target | detail |
| --- | --- | --- |
| `rs:ready` | `<html>` (bubbles to document) | `{version}` |
| `rs:widget:init` | widget host | `{id, instance}` |
| `rs:widget:destroy` | widget host | `{id}` |
| `rs:budget:degraded` | document | `{level, multiplier, frameMs}` |
| `rs:theme:change` | `<html>` (bubbles to document) | `{theme, previous}` |
| `rs:menu:open/close` | menu root | `{item}` |
| `rs:tabs:change` | tabs root | `{selected, previous}` |
| `rs:dialog:open/close` | dialog | `{returnValue?}` |
| `rs:window:minimize/restore/close/focus` | window | `{}` |
| `rs:marquee:pause/resume` | marquee root | `{}` |
| `rs:spoiler:toggle` | spoiler | `{revealed}` |
| `rs:splash:enter` | splash | `{remembered}` |
| `rs:neko:sleep/wake` | cat host | `{}` |
| `rs:pixel-pet:fed` | pet host | `{}` |
| `rs:pixel-pet:gold` | pet host | `{}` · the seven-day coat, once per page load |
| `rs:fortune:next` | fortune host | `{}` · each fresh deal |
| `rs:jukebox:track` | jukebox host | `{index, title}` · every track change, first load included |
| `rs:dvd:corner` | dvd host | `{}` |
| `rs:countdown:done` | countdown | `{}` |
| `rs:content` | the element whose text was injected | `{}` · emitted by the guestbook (and welcome from page scripts); smilies listen and re-walk that subtree |

Events are the extension seam: easter eggs, analytics-free curiosity, community widgets
reacting to the cat. Names are frozen at 1.0 per the
[compatibility promise](../MIGRATIONS.md).

## Retrostrap.audit()

The guardrail checker, how a page author (or a machine) verifies era-fidelity.

```js
const report = Retrostrap.audit({ root: document, budgets: true });
// report: { ok: boolean, violations: [{rule, selector, value, hint}], stats: {...} }
```

Checks (v1 rule ids):

| Rule | What it flags |
| --- | --- |
| `palette` | computed colors (text/bg/border) outside the legal 224 |
| `radius` | any non-zero border-radius on `rs-` or descendant elements |
| `shadow-blur` | box/text shadows with blur > 0 |
| `easing` | computed transition/animation timing functions ∉ {linear, steps} |
| `font` | font-family not resolving to a sanctioned stack |
| `link-underline` | `a` without underline in content areas |
| `translucent-ui` | alpha < 1 on non-canvas UI colors |
| `network` | cross-origin `background-image` `url()`s: shipped CSS makes no third-party request |

Output: console table (dev) + the returned JSON (CI: a Playwright test runs audit on
every demo and catalog page and fails on violations, the laws are tests, not vibes).
`paint: true` outlines every offender in 2px red (of course) and names the broken rule
in its tooltip; the report's `clear()` wipes the marks off again.

## SPA / framework integration contract

The rules that make React/Vue/Svelte/Astro wrappers trivial:

1. Import CSS once; render retrostrap markup; call `Retrostrap.init(container)` after
   mount; call `Retrostrap.destroy(container)` before unmount. That's the whole story.
2. Enhancers never move your DOM nodes outside their subtree (dialogs use the native
   top layer, not portals), so virtual-DOM reconciliation stays sane.
3. Widgets attach overlays to `document.body` but register them against the host
   element's lifecycle, `destroy(container)` cleans them up.
4. Handles are plain objects; no classes to subclass, nothing to extend. Composition
   happens with events.

The copy-paste recipe, a React hook plus the Vue and Svelte equivalents and the caveat
about widgets and re-renders, is in [the get-started guide](99-get-started.md#using-a-spa-framework-react-vue-svelte-astro).

## Error handling contract

- Shipped code never throws past its own boundary: every enhancer/widget init is
  wrapped; failures log `console.warn('[retrostrap] <id>: <reason>')` exactly once and
  degrade to no-op.
- `audit()` and dev-mode messages are stripped-able: the `.min` builds keep them (they're
  tiny and useful); a `retrostrap.lean.js` without dev tooling is planned, not yet.
- Nothing retries network requests more than once. Failure states are designed (the
  counter shows `------`, the guestbook naps), an era-true aesthetic of honest breakage.

## Stability tiers

Every API/catalog item carries `stability: "stable" | "experimental"` in the manifest.
Experimental items may change in minors (documented in MIGRATIONS.md); stable items
follow [SemVer policy](../MIGRATIONS.md). Everything in this doc is stable-track
except `Retrostrap.budget.status()` (still marked experimental).

## TypeScript

The source stays plain JS + JSDoc. We ship a hand-written `dist/retrostrap.d.ts`
(small API, small file) so typed projects and editors get completions without
us adopting a compiler. The `.d.ts` is generated-by-hand; `check:pack` makes sure it
ships in the tarball. (Types are modern; nobody needs to know.)
