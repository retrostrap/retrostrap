# Contributing to retrostrap

Welcome! retrostrap is a small, opinionated framework, and the opinions are the
point. Before you build, skim the [design language](docs/02-design-language.md),
it's the constitution, and it'll save us both a review round.

## The 30-second tour

- `src/css/`: the components, one file each, in cascade order.
- `src/js/`: `core/` (engine, options, audit) and `components/`/`widgets/`.
- `catalog/`: the source of truth: one JSON + one HTML snippet per component,
  widget, and theme. Docs pages, `manifest.json`, `llms.txt` and the cheatsheet
  are all generated from here.
- `src/assets-src/`: pixel art as JSON grids. `scripts/`: the build.
- `demos/`, `site/`, `tests/`: proof, docs, and safety net.

## Dev setup

```sh
npm install        # not npm ci: the lock is generated on macOS and misses a Linux-only dep
npm run build      # dist/ + manifest + llms + cheatsheet
npm run dev        # watch + a static server for demos and test pages
npm test           # vitest: the laws, the parser, the budget math
npm run test:smoke # playwright: demos, behaviors, audit, themes
```

Node LTS. No global installs, no secrets, no build config to learn.

## Definition of done

A change is done when:

1. `npm run build && npm test && npm run catalog && npm run contrast` are green,
   and `npm run test:smoke` passes.
2. For a component/widget/theme: its **catalog JSON and HTML snippet** are added
   or updated, so `manifest.json`, `llms.txt` and the cheatsheet regenerate.
3. `npm run check:size` still passes, the budgets are not suggestions.
4. Anything visual has before/after screenshots in the PR.

## The design-law checklist

Every visual change must hold the five laws, `Retrostrap.audit()` checks them,
and so does CI:

- **Palette:** only the 216 web-safe colors + the 8 off-cube named colors, opaque.
- **Fonts:** only the nine `--rs-font-*` stacks; sizes on the 7-step scale.
- **Shape:** `border-radius: 0`; shadows have 0 blur.
- **Motion:** easing is `linear` or `steps()`; everything honors `prefers-reduced-motion`.
- **Decency:** no autoplay, no tracking, no external calls; the CSS works without JS.

## Proposing something new

Components and widgets need an **era reference**: a real 1996-2003 artifact they
descend from. Open an idea issue (the template asks for it), we talk it through,
and if it earns its place it becomes a
scoped issue. No era reference, no entry, that rule is what keeps retrostrap
from drifting into "generic retro."

## Commit hygiene

Plain imperative subject, concise, lower-case start is fine, optional area prefix
(`css:`, `widgets:`, `docs:`, `site:`). Body only when the *why* isn't obvious.
No trailers of any kind, the history reads as one maintainer's voice. Small PRs,
one thing each, screenshots always.

## Etiquette

Be kind; the [code of conduct](CODE_OF_CONDUCT.md) is short and we mean it. This
is a friendly corner of the web and we intend to keep it that way.
