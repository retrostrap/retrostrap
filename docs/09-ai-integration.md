# AI and tooling integration

retrostrap is designed to be **machine-legible**. Coding assistants are how a huge share
of pages get built now, and a framework whose vocabulary, constraints, and examples are
machine-readable gets used *correctly* by them, which means every generated page
strengthens the aesthetic instead of diluting it.

The deeper insight: **our design laws are exactly what assistants need.** Left alone, a
model asked for "a retro website" produces a modern layout with Comic Sans on top. Given
a closed vocabulary (`rs-` classes), a legal palette, an easing whitelist, and an
auditor, the model *cannot drift modern*, the same constraints that keep humans on-era
keep machines on-era. Constraint is the product; legibility is the delivery.

## The machine surfaces

All generated from [the catalog](03-architecture.md#the-catalog-system) by `scripts/manifest.mjs`
(with `scripts/guardrails.mjs`) and validated by `scripts/catalog.mjs`: never hand-maintained,
never stale.

| Surface | Where | For |
| --- | --- | --- |
| `llms.txt` | site root + `dist/` | entry point per the llms.txt convention |
| `cheatsheet.md` | site root `/cheatsheet.md` + `dist/` (For robots links it) | the one file to load into a context window |
| `manifest.json` | `dist/` + site root | structured catalog for tools |
| `guardrails.json` | `dist/` | the laws as data (validators, linters) |
| snippets | `catalog/snippets/*.html` + docs pages | canonical copy-paste examples |
| `prompt.txt` | `dist/` + site root + `manifest.prompt` | the canonical system prompt, generated |
| MIGRATIONS.md | repo | machine-readable version deltas (repo-only; the site does not serve it) |

### llms.txt (structure)

```
# retrostrap
> A CSS+JS framework for building responsive, accessible websites that look like
> the web of 1996-2003. Closed palette (216 web-safe + 8 off-cube named colors),
> nine era font stacks, bevel components, and optional decoration widgets.

## Install
- the two CDN tags (min.css + min.js), plus one theme file and data-rs-theme

## Reference
- Cheatsheet: /cheatsheet.md, every class and widget, one page
- manifest.json, the full catalog, structured (its `prompt` field is the system prompt)
- guardrails.json, the five laws as data; validate against this
- prompt.txt, a canonical system prompt to paste into an assistant

## The five laws
1-5, one line each (palette, fonts, shape, motion, decency)

## Components (63)
- one line per class, name plus what it is, straight from the catalog
```

(The generated file in `dist/llms.txt` is the source of truth; this sketch just
shows the shape.)

### manifest.json (spec)

Versioned (`schemaVersion`), one file, three content arrays: components, widgets,
themes. Every entry is its catalog JSON ([03](03-architecture.md#the-catalog-system))
with the snippet text resolved in; widget entries add their option tables with
types/defaults/notes, their events, and their motion and pointer policies. Around
the arrays sit `cdn` (the four CDN URLs, with `{name}` templating the theme file),
`laws` (palette, fonts, shape, motion, decency, breakpoints, as data), and `prompt`
(the canonical system prompt, the same string as `prompt.txt`):

```json
{
  "schemaVersion": 1,
  "version": "0.0.1",
  "cdn": { "css": "https://…retrostrap.min.css", "js": "…", "patterns": "…",
           "theme": "https://…/themes/{name}.css" },
  "laws": { "palette": ["#000000", "…"], "fonts": {...}, "shape": {...},
            "motion": {...}, "decency": [...], "breakpointsPx": {...} },
  "prompt": "You are building a web page with retrostrap…",
  "components": [ { "id": "window", "classes": [...], "snippet": "<div class=…>", "a11y": "…" } ],
  "widgets": [ { "id": "snowfall", "motion": "decorative", "pointer": "any",
                 "options": [ { "name": "density", "type": "enum",
                                "values": ["light","normal","blizzard"], "default": "normal" } ] } ],
  "themes": [ { "id": "midnight", "label": "Midnight", "summary": "…", "era": "…" } ]
}
```

JSON Schema ships in-repo (`catalog/schema/catalog-item.schema.json`); CI validates. Tools
(and the stylelint plugin) consume `laws` rather than hard-coding them.

### cheatsheet.md (the context-window file)

One generated markdown file, currently 127 lines (target stays **< 400**), containing:
the CDN block, the five laws, the page-structure primer, every class name with a
half-line description, every widget with a one-line description, the theme list, and a
closing "Verify" pointer at `Retrostrap.audit()`. Design goal: an assistant with *only
this file* in context produces a correct page. The cheatsheet is regenerated on every
release and treated as an API surface (a class missing from the cheatsheet is a release
blocker).

## The prompt pack

Shipped on the docs site and in the repo. The canonical system prompt lives in exactly
one place, [`catalog/prompt.txt`](../catalog/prompt.txt), and is generated with the
rest of the machine surfaces: the build stamps the version into it and emits it to
`dist/prompt.txt`, the manifest's `prompt` field, and the [For robots](#the-for-robots-docs-page)
page, so all three read the same string and cannot drift. It is the file to paste into
any assistant's instructions. It sets seven hard rules, closed `rs-` vocabulary, one
theme, at most two widgets, the font scale, links stay underlined, on-era copy, and
non-negotiable accessibility, then a four-step process that mirrors `Retrostrap.audit()`.

Today the prompt pack is the one canonical prompt.

## Project templates for assistants

The prompt pack is a *string you paste*; the templates in [`templates/`](../templates/) are
*files a downstream project keeps*. Copied to a repo root, they sit in the assistant's
context on every turn, so someone building or **extending** a site on retrostrap gets the
laws and conventions without re-pasting anything.

- [`AGENTS.md`](../templates/AGENTS.md), the cross-tool standard (Cursor, Copilot, Windsurf,
  Zed, Aider…). The full file: the five laws, the `rs-`/`rsx-` and `--rs-`/`--rsx-` naming
  split, composing a page, and a dedicated **extending** section, style with tokens, add new
  values as `--rsx-*`, ship a widget with `destroy()`, keep it opaque and radius-0, anchored
  by a worked `rsx-` example.
- [`CLAUDE.md`](../templates/CLAUDE.md), a short wrapper that `@`-imports `AGENTS.md`, so
  Claude Code and everything else read one source; `copilot-instructions.md` ships
  alongside for the tools that want that filename.

They deliberately teach the **stable** parts (the laws, the namespaces, the audit loop) and
point at the generated surfaces, `cheatsheet.md`, `guardrails.json`, `manifest.json`, the
MCP server, for the parts that change (the component list, the exact palette). That keeps a
copied template useful without going stale: the rules hold, and the specifics are always one
`cheatsheet.md` fetch away. The extension guidance is why they exist, the prompt pack aims a
model at *composing* a page; the templates keep it lawful when it starts *adding to* the
framework, where the `rsx-`/`--rsx-` convention and `Retrostrap.audit()` do the enforcing.

## Integration recipes (humans and machines)

- **Plain HTML**: the canonical CDN block ([03](03-architecture.md#distribution-what-users-get)),
  pinned version + SRI for production. The only "install" most sites need.
- **npm/ESM**: `npm i retrostrap`; `import 'retrostrap/retrostrap.css'`;
  `import { Retrostrap } from 'retrostrap'`; widget modules import individually.
- **React/Next**: render retrostrap markup; `useEffect(() => { Retrostrap.init(ref.current);
  return () => Retrostrap.destroy(ref.current); })`. Dialogs are native; no portals.
  Client-only for widgets (`'use client'` / dynamic import).
- **Vue/Svelte/Astro**: same contract: mounted/onMount → init; unmount → destroy.
  Astro: widgets inside `client:load` islands or a plain deferred script, the framework
  is island-native by temperament.
- **WordPress/CMS**: enqueue the two CDN files; theme templates use rs- markup; a
  proper WP theme is community territory.
- **CodePen/JSFiddle**: the CDN block pastes straight into a new pen or fiddle; a curated
  set of starter pens is community territory.
- **CSP guidance**: no `unsafe-eval` needed ever; decoration uses inline `style`
  attributes (allow `style-src 'unsafe-inline'` or accept the documented nonce recipe).

## Feedback loop for machines

Generation without verification drifts. The loop we support:

1. Generate against the cheatsheet/manifest.
2. Run **`Retrostrap.audit()`** (in-page, or headless via the Playwright recipe we ship)
   → JSON violations.
3. Feed violations back; regenerate. The audit's `hint` strings are written to be
   actionable by a model ("replace #FA8072 with nearest legal #FF9966").

Built, **MCP server** (the `retrostrap-mcp` npm package, run with `npx retrostrap-mcp`;
source in [`services/mcp/`](../services/mcp/)): tools
`search_catalog(query)`, `get_snippet(id)`, `get_theme(id)`, `audit_html(html)`: the
catalog, conversationally. It reads `dist/manifest.json` and stays a thin wrapper; the
tools are pure functions with a suite, and only the stdio transport needs the SDK.
`audit_html` is the static half of the feedback loop above (inline styles and `<style>`
blocks, same hint strings), with `Retrostrap.audit()` still owning the cascade.

Also shipped, **stylelint-retrostrap** ([`tools/stylelint-retrostrap/`](../tools/stylelint-retrostrap/)):
a stylelint plugin that holds a project's own CSS to the palette, shape, and easing laws
at lint time, reading them from `guardrails.json` so it never drifts from the framework.

## Versioning discipline for machine consumers

- Machines copy exact strings, so the end state is pinned-version CDN URLs in all
  generated surfaces plus published SRI hashes. Today, honestly: every surface ships
  the floating `@0` range, which tracks 0.x while the framework is pre-1.0; pinning
  and SRI land with the 1.0 stability policy, and the launch checklist pins the
  README quickstart at the first real release.
- Every manifest entry carries `since` and `stability`; removals appear in
  MIGRATIONS.md as `old → new` pairs with regex-safe patterns where mechanical.
- `llms.txt`/cheatsheet regenerate per release; previous major's cheatsheet stays
  hosted at a versioned path (assistants cache hard; we don't fight it, we date it).
- The `rs:*` event names and `data-rs-*` grammar freeze at 1.0 ([MIGRATIONS.md](../MIGRATIONS.md)).

## The "For robots" docs page

A human-readable page (dogfooding `rs-dos`, obviously) that says exactly this, shorter:
here's llms.txt, here's the cheatsheet, here's the system prompt, paste and go. It ends
with the era-appropriate sign-off: *"This page is best viewed by any user agent."*
