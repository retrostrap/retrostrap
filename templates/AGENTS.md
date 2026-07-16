<!--
  A drop-in instructions file for AI coding assistants working in a project that
  uses retrostrap. Copy it to your repo root (most tools read AGENTS.md; Claude
  Code reads the companion CLAUDE.md, which imports this one). Trim the parts you
  don't need, but keep the five laws and the "never" list intact, they're what
  keep a retrostrap page on-era, and Retrostrap.audit() enforces them.
-->

# Working with retrostrap

This project uses **retrostrap**, a zero-dependency CSS+JS framework that makes pages
look like the 1996-2003 web while staying responsive and accessible. When you write or
extend markup and styles here, stay inside its five laws. They aren't decoration, they
are the whole reason a retrostrap page reads as period-correct instead of "modern layout
with Comic Sans on top," and `Retrostrap.audit()` (plus CI, if it's wired) will fail a
page that breaks them. **If a change trips the audit, the change is wrong, not the audit.**

## The five laws (never break these)

1. **Color**: only the 216 web-safe values plus the 16 classic named colors, and UI
   colors are fully opaque. Style from the `--rs-*` tokens; never write an off-palette hex
   or a partial alpha on a surface.
2. **Type**: only the nine `--rs-font-*` stacks, and sizes only from the `rs-font-1`…`7`
   scale. No web fonts, no arbitrary `px`.
3. **Shape**: `border-radius: 0` always; shadows have `0` blur (hard offsets only);
   rounding, when you truly need it, comes from a `border-image` asset, never `border-radius`.
4. **Motion**: easing is `linear` or `steps()` only (never `ease`/`cubic-bezier`), and
   everything animated honors `prefers-reduced-motion`.
5. **Decency**: no autoplaying audio, no tracking, no surprise network calls (no CDN
   fonts, no third-party requests), and every CSS component works without JavaScript.

## Conventions

- **Classes** are `rs-`, BEM-ish: `rs-window__titlebar`, `rs-btn--primary`. **Your own**
  components live in the **`rsx-`** namespace (`rsx-price-tag`), never redefine an `rs-` class.
- **Tokens** are `--rs-*` (colors, spacing, type). Read them and build from them; when you
  genuinely need a new one, name it **`--rsx-*`** so it can't collide with the framework's.
- **Config** is `data-rs-*` attributes; **events** are `rs:*`; the JS entry point is the
  global `Retrostrap`.
- Prefer **logical properties** (`margin-inline`, `padding-block`) over physical ones.

## Composing a page

1. Pick **one** theme with `data-rs-theme` on `<html>`; put the wallpaper tile on `<body>`.
2. Wrap content in `<div class="rs-page rs-container">`. Use real landmarks (`header`,
   `nav`, `main`, `footer`) and headings `h1`-`h6` in order.
3. Choose **one** layout recipe (`rs-layout--sidebar-left`, `--holy-grail`, `rs-frames`…).
   Build the rest by copying **cheatsheet snippets**: don't hand-roll markup you can paste.
4. At most **two** decorative widgets per page, via `data-rs-widgets="…"` with their
   `data-rs-<widget>-<option>` attributes.

## Extending: a new component or style

The same laws apply to anything you add. Style with the existing tokens first; reach for a
new value only when there isn't a token for it, and then pick the **nearest legal** one.

- New CSS goes under an **`rsx-`** class and stays token-driven, opaque, `border-radius: 0`,
  shadows blur-`0`.
- Need a new value? Add a **`--rsx-*`** token (ideally derived from `--rs-*` tokens) rather
  than sprinkling literals, it keeps theming working and the audit happy.
- A community **widget** must ship a `destroy()` that fully tears down (listeners, timers,
  injected DOM), must not autoplay, and must make no external request. Its CSS half should
  work with JS off.
- Keep accessibility intact: label every input, never remove focus outlines, mirror the
  ARIA in the component snippets you're extending.

**A small extension done right:**

```css
/* rsx-price-tag: a bevelled tag. Tokens, opaque, no radius, no blur. */
.rsx-price-tag {
  display: inline-block;
  padding-block: var(--rs-space-1);
  padding-inline: var(--rs-space-2);
  color: var(--rs-text);
  background: var(--rs-bg-content);                    /* opaque, on-palette via the token */
  border: var(--rs-border-2) solid var(--rs-border-color);
  box-shadow: var(--rs-shadow-hard);                  /* a hard 2px offset, 0 blur */
  font-size: var(--rs-font-size-1);                   /* a step on the scale */
  font-family: var(--rs-font-body);                   /* a sanctioned stack */
}
```

## Where the specifics live (load these, don't guess)

You do not need to memorize the catalog, read it:

- **`cheatsheet.md`** (served at `/cheatsheet.md`), the one file to load into context:
  every component and widget with a canonical snippet.
- **`guardrails.json`**: the laws as data: the exact palette, the font stacks, the easing
  whitelist. Validate against this.
- **`manifest.json`**: the structured catalog for tooling.
- The **retrostrap MCP server** (`retrostrap-mcp`) exposes search + audit tools; prefer it
  for lookups and for checking a page before you hand it back.

## Never

- Never write an off-palette color, a non-zero `border-radius`, a blurred shadow, or a
  `cubic-bezier`/`ease` easing.
- Never add analytics, a CDN or web font, autoplaying audio, or any external network request.
- Never remove a focus outline or ship an input without a label.
- Never redefine an `rs-` class or a `--rs-*` token, extend under `rsx-` / `--rsx-`.
- Never invent a component when a cheatsheet snippet exists; compose from the catalog.

## Self-check before you finish

Run `Retrostrap.audit()` over the page (or the MCP `audit_html` tool over your output). It
reports palette, type, shape, motion, and decency violations the way CI does. Green means
on-era; a finding means fix the markup, not the auditor.
