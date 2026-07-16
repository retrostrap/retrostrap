# Theming

A retrostrap theme is a *mood of 1999*, not a brand kit. Themes are deliberately
low-power: they set the token contract from
[02-design-language.md](02-design-language.md#token-reference) and a short whitelist of
skin overrides. A theme can make your page feel like a hacker terminal or a glitter
shrine; it cannot make it look modern. That's the entire design.

## Applying a theme

```html
<link rel="stylesheet" href=".../retrostrap.min.css">          <!-- includes classic -->
<link rel="stylesheet" href=".../themes/midnight.css">          <!-- overrides tokens -->
<html data-rs-theme="midnight">
```

- `data-rs-theme` on `<html>` selects the theme (theme CSS scopes to
  `[data-rs-theme="midnight"]`).
- **Scoped theming:** the same attribute works on any container, a phosphor `rs-dos`
  terminal panel inside a classic page is legal and delightful.
- `Retrostrap.theme.set('phosphor')` swaps at runtime + persists to localStorage
  (used by the docs site's theme switcher and the Boards' user setting).
- A dark-mode auto-pairing (`data-rs-theme-dark`) is not supported yet; today you
  pick one theme. The era had no dark mode either.

## The themes

Ten themes, each a mood of the era. Every one sets the same token contract; the difference
between them is values and a little skin, nothing structural.

| Theme | Mood | Body font |
| --- | --- | --- |
| classic | 1996 default | serif 16 |
| midnight | GeoCities night | sans 13 |
| bevel | system desktop | narrow 13 |
| phosphor | terminal | mono 13 |
| kawaii | glitter shrine | comic 13 |
| y2k | millennium chrome | arial 13 |
| highcontrast | accessibility-first | narrow 16 |
| cosmic | deep-space void | sans 13 |
| newspaper | 1997 broadsheet | serif 13 |
| bubble | candy-plastic desktop | sans 13 |

### Token matrix

Every theme sets the full token contract, and each theme's own CSS file
(`dist/themes/<name>.css`) is the canonical source for its values (classic ships in the
core stylesheet). The matrix below reads the contract across a spread of moods, light,
dark, terminal, glitter, chrome, so the differences show at a glance.

| Token | classic | midnight | bevel | phosphor | kawaii | y2k |
| --- | --- | --- | --- | --- | --- | --- |
| `--rs-bg-page` | `#C0C0C0` | `#000000` | `#008080` | `#000000` | `#FFCCFF` | `#000033` |
| `--rs-tile-page` | none | stars | none | none | hearts | dither-navy |
| `--rs-bg-content` | `#FFFFFF` | `#000000` | `#C0C0C0` | `#000000` | `#FFFFFF` | `#CCCCCC` |
| `--rs-text` | `#000000` | `#CCCCCC` | `#000000` | `#33FF33` | `#663366` | `#000000` |
| `--rs-text-muted` | `#666666` | `#999999` | `#333333` | `#00CC00` | `#993366` | `#333333` |
| `--rs-heading` | `#000000` | `#FFFF00` | `#000080` | `#33FF33` | `#FF33CC` | `#003399` |
| `--rs-link` | `#0000FF` | `#00FFFF` | `#000080` | `#66FF66` | `#CC0066` | `#0033CC` |
| `--rs-link-visited` | `#660099` | `#CC99FF` | `#660099` | `#339933` | `#9933CC` | `#660099` |
| `--rs-link-active` | `#FF0000` | `#FF0000` | `#FF0000` | `#FFCC00` | `#FF3399` | `#FF6600` |
| `--rs-accent` | `#000080` | `#00FF00` | `#000080` | `#33FF33` | `#FF99CC` | `#3366FF` |
| `--rs-accent-2` | `#008080` | `#FF00FF` | `#008080` | `#FFCC00` | `#99CCFF` | `#00CCCC` |
| `--rs-bevel-face` | `#C0C0C0` | `#333333` | `#C0C0C0` | `#003300` | `#FFCCFF` | `#CCCCCC` |
| `--rs-bevel-light` | `#FFFFFF` | `#666666` | `#FFFFFF` | `#009900` | `#FFFFFF` | `#FFFFFF` |
| `--rs-bevel-shadow` | `#808080` | `#000000` | `#808080` | `#006600` | `#CC99CC` | `#666666` |
| `--rs-bevel-dark` | `#000000` | `#000000` | `#000000` | `#003300` | `#996699` | `#000000` |
| `--rs-titlebar-bg` | `#000080` | `#330066` | `#000080` | `#003300` | `#FF99CC` | `#003399` |
| `--rs-titlebar-bg-2` | `#000080` | `#000033` | `#3399FF` | `#006600` | `#FFCCFF` | `#00CCCC` |
| `--rs-titlebar-text` | `#FFFFFF` | `#FFFF99` | `#FFFFFF` | `#66FF66` | `#663366` | `#FFFFFF` |
| `--rs-selection-bg` | `#000080` | `#FF00FF` | `#000080` | `#33FF33` | `#FF99CC` | `#3366FF` |
| `--rs-selection-text` | `#FFFFFF` | `#000000` | `#FFFFFF` | `#000000` | `#663366` | `#FFFFFF` |
| `--rs-focus-color` | `#000000` | `#FFFF00` | `#000000`† | `#33FF33` | `#663366` | `#000000`† |
| `--rs-font-body` | serif | sans | narrow | mono | comic | arial |
| `--rs-font-heading` | serif | comic | narrow | mono | comic | display |
| `--rs-font-size-body` | size-3 | size-2 | size-2 | size-2 | size-2 | size-2 |

† bevel and y2k don't pin the token at all: the base black ring stands, and the
reset's `currentColor` fallback covers any scope where no token reaches. y2k's
`#FF6600` manages only 1.83:1 on the silver sheet, so the token stays unpinned.

Contrast verdicts for every meaningful pair live in the
[accessibility matrix](08-accessibility-performance.md).

**Contrast-driven extra tokens** (adopted from the matrix's rulings): kawaii adds
`--rs-link-tinted: #990066` and `--rs-visited-tinted: #663399` for links sitting on its
tinted surfaces (the theme's surface classes swap them in automatically); y2k adds
`--rs-accent-text: #6699FF` (body-size accent text on the dark page) and
`--rs-accent-on-panel: #0033CC` (interactive accent on silver). Classic demotes
`#808080` to disabled-only and uses `#CC0000` for any persistent red text.

### Theme personalities (skin overrides beyond tokens)

Each theme may additionally restyle **only** items on this whitelist: `rs-btn`,
`rs-panel`, `rs-window` chrome, `rs-hr`, list bullets, form controls, `rs-table`
header and striped-row tints, the `rs-page` sheet border, tile assignments, heading
decorations, `scrollbar-color`, the `:focus-visible` ring, and per-theme one-offs
where a token can't carry the fix (phosphor's `rs-dos`/`rs-counter` blend, y2k's
`rs-splash` ink, cosmic's `rs-rainbow` bands). All of it skin. Never layout, never
spacing, never motion.

- **classic**: none. Classic *is* the reset dressed politely. Times, gray, blue links.
  The theme for "my professor has a homepage" energy.
- **midnight**: starfield page tile; h1/h2 carry a hard 2px `#FF00FF` text-shadow
  (skipped on rainbow/gradient text, which brings its own fill); the plain HR retints
  magenta; bevels go dark (`#333333` faces, legal colors only). GeoCities after dark.
- **bevel**: the full system-desktop dressing: teal desktop, silver everything,
  titlebar fade on, `rs-btn` is pixel-perfect chrome, scrollbar styling
  (`scrollbar-color`, the one place we style scrollbars), status bars everywhere
  encouraged.
- **phosphor**: green-on-black everything; bevels tint green; `rs-crt` recommended in
  docs (off by default); `rs-dos` blends invisibly into the page (that's the joke);
  selection inverts. An amber variant is planned, not yet.
- **kawaii**: hearts page tile; scalloped `rs-panel` borders via border-image
  (Shape-Law-legal rounding); the plain HR goes 2px dotted pink; headings in `#FF33CC`
  with a hard white 1px offset. Maximum 2000s shrine-site energy.
- **y2k**: banded silver chrome (hard-stop stacks of legal greys): the full four-band
  stack on toolbars, a calmer two-band `#FFFFFF→#CCCCCC` on panels and buttons, since
  panels carry prose and the dark band made it stripey; Impact display headings with
  hard cyan offset; dark navy page with dither tile. Millennium-bug chic.

- **highcontrast**: accessibility mode in the 1998 spirit: black on white, AAA on every
  pair, body text a step larger (`--rs-font-size-3`), and a 3px `:focus-visible` ring you
  can't miss. The a11y-first skin.
- **cosmic**: a starry deep-purple void (starfield page tile on `#330066`, `#330033`
  sheet); pink headings, cyan links; midnight's dreamier cousin.
- **newspaper**: the 1997 broadsheet: white paper on newsprint grey, serif body *and*
  headings, black masthead rules under `h1`/`h2`, grayscale but for the navy links.
- **bubble**: the candy-plastic 2001 desktop, a generic homage to the era's glossy look:
  white windows on a pinstriped aqua desktop, gel buttons with a two-stop web-safe sheen,
  blue titlebars, and square traffic-light window controls. Legal to the letter, the
  rounding stays 0 and nothing pulses.

## Theme authoring guide (community)

A theme is one CSS file:

```css
/* rsx-vaporwave.css, community themes use the rsx- prefix */
[data-rs-theme="rsx-vaporwave"] {
  --rs-bg-page: #330066; /* …the full contract, every token, no omissions… */
}
/* + whitelist skin overrides only */
```

**Image tiles (important):** do NOT put a relative `url()` in `--rs-tile-page`: a
relative url inside a custom property resolves inconsistently across browsers (Chromium
resolves it where the variable is *used*, in the core stylesheet; spec browsers resolve
it where it's *declared*, in the theme file). Instead set `--rs-tile-page: none` and add
a direct rule in the theme, where a plain `url()` resolves against the theme file the
same way everywhere:

```css
[data-rs-theme="rsx-vaporwave"] body:where(:not([class*="rs-tile-"])) {
  background-image: url("../assets/tile-grid.png"); /* ../ because the theme lives in dist/themes/ */
  background-repeat: repeat;
}
```

The `:where(:not([class*="rs-tile-"]))` guard costs no specificity and makes the theme's
tile a *default*: a page that puts an explicit `rs-tile-*` wallpaper class on `<body>`
gets the wallpaper it asked for. The shipped themes all guard their body tiles this way.

Checklist (also in CONTRIBUTING and the manifest schema):
1. Every contract token set; all values legal per `guardrails.json`.
2. Body-text pairs pass AA (run the contrast script from
   [08](08-accessibility-performance.md)).
3. Skin overrides touch only the whitelist; `Retrostrap.audit()` clean on the theme
   preview page.
4. Tiles/assets original, from the pixel pipeline or your own JSON grids.
5. A one-line era reference ("late-night cable-TV vaporwave, 2001 desktop wallpapers").
6. Name is `rsx-*`; bare names are reserved for core.

Community themes are listed on the docs site's theme gallery; promotion of an
`rsx-` theme into core is a deliberate, reviewed decision.
