# The builder: retrostrap's drag-and-drop page maker

A WYSIWYG page builder, in the spirit of GeoCities PageBuilder and FrontPage 98,
except it emits clean modern HTML that passes our own audit. It is a demo, a tool,
and the best "try it in five minutes" onramp we have.

Open `demos/builder/` on the dev server (`npm run dev`). No build step of its own,
it reads the generated catalog.

## How it fits together

- **`index.html`**: the IDE shell: toolbar, a component palette, the canvas, an
  inspector, and an export drawer. Skinned in retrostrap itself (the system look).
- **`builder.js`**: the parent app. Loads `dist/manifest.json`, builds the palette
  from the catalog, holds the project model, and drives the canvas.
- **`canvas.html` + `canvas.js`**: the page-under-construction, in an **iframe**.
  Isolation is the whole point: the user's theme and toybox widgets run in there
  without touching the builder's own chrome. Same-origin, so the parent calls
  `iframe.contentWindow.RSCanvas` directly.

The palette, the toybox toggles, and the theme list are all generated from the
catalog (`manifest.components`, `manifest.widgets`, `manifest.themes`). Add a
component to the catalog and it shows up in the builder for free.

## The project model

```js
{
  version: 1,
  theme: 'midnight',        // '' = classic
  tile:  'stars',           // '' = none; an rs-tile-* wallpaper on the body
  widgets: { kugeln: true, snowfall: false, ... },   // toybox toggles
  blocks: [ { id, type, html } ]                      // ordered content blocks
}
```

A block's `html` is its live markup, edited in place. Each palette drop clones the
first element of that component's catalog snippet, so a "button" is one button, a
"window" is one window.

## Interaction, and the accessibility contract

Drag-and-drop is an **enhancement**. Every action has a keyboard path:

- **Add:** click (or Enter) a palette button appends the component. Drag places it
  precisely between existing blocks.
- **Edit text:** blocks are `contenteditable`; click in and type.
- **Reorder / duplicate / delete:** real buttons on each block's toolbar and in the
  inspector, never a drag-only or a swallowed key. (We never bind Delete to remove a
  block; it would fight text editing.)
- **Everything else**: theme, tile, widgets, responsive width, undo/redo, export,
  is a labelled control.

Undo/redo is `Ctrl/Cmd+Z` and `Ctrl/Cmd+Shift+Z`. The canvas and export both stay
inside the five laws; the exported page passes `Retrostrap.audit()`.

## Edit vs. Preview

The canvas has two gears. **Edit** keeps the page still: blocks are contenteditable
and the toybox stays parked, because a snowstorm fights the caret, so widgets are
torn down (`destroy()`) while you type. **Preview** locks editing and starts every
armed widget for real. Theme and wallpaper apply in both modes; only the moving toys
wait for Preview. The inspector says so beside the toybox toggles, and the sunken
Preview button is the mode light. Catalog placeholder images (`avatar.gif`,
`my-cat.jpg`) are dressed with shipped pixel art on the canvas but export under
their honest placeholder names, those files are yours to supply.

## Persistence

Autosaves the current project to `localStorage` (`rs-builder:current`). Named
projects live under `rs-builder:projects`. No network, no accounts, Decency Law.

## Export

The export drawer builds a full standalone HTML document: the composed blocks inside
`rs-page rs-container`, the chosen theme and tile, and any toybox widgets wired onto
the body. Copy it or download it. It references the retrostrap files by relative name
with a comment on where to host them; it is the same markup you would hand-write.

## Editing beyond text

Inline editing covers text; the inspector covers the rest:

- **Variant classes** as chips (from the catalog) plus a free class field.
- **Link and image URLs**: a selected block containing an `<a>` or `<img>` gets href /
  src / alt fields.
- **Widget options**: an enabled toybox widget shows its catalog options (kugeln's
  `mode`/`colours`, snow `density`…); only non-default values reach the export.

## Import

The Import button opens the same drawer in paste mode: drop in a retrostrap page (or a
previous export) and it becomes a project, theme, wallpaper, widgets, and one block per
top-level element. The inverse of Export, so the tool is two-way.

## Deliberately deferred

- Arbitrary nesting / dragging blocks *into* containers (the canvas is a vertical stack,
  which is how era pages were actually built).
- Full per-component field schemas, the inspector edits classes, URLs, and widget
  options, but not a table's rows or a form's individual fields.
