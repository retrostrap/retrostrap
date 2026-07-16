# What's new

All notable changes, in [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
shape with a friendlier accent. When anything moves, MIGRATIONS.md has the receipts.

## [Unreleased]

The whole framework, so far. Not yet published to npm, this section becomes 0.1.0
the day it is.

### Added
- **The five laws**, as tokens and as a runtime checker. `Retrostrap.audit()` walks a
  live page and reports any color, radius, shadow, easing, or font that slipped out of
  1999. Also enforced statically by the `stylelint-retrostrap` plugin, a headless
  `npm run audit` over every demo, and `audit_html` in the MCP server.
- **63 CSS components**: bevel buttons, window chrome, marquees, panels, tables, an
  a11y-safe ASCII-art block, the whole navigation and feedback set, and the layout
  recipes that quietly collapse to a phone. ~7KB gzipped.
- **The JavaScript core**: a widget engine with a budget governor, eight component
  enhancers (menu, tabs, dialog, window, marquee, spoiler, splash, statusbar) with full keyboard
  maps, hand-written type declarations, and the `Retrostrap.*` public surface. ~8.5KB
  gzipped, zero dependencies.
- **The Toybox, twenty-two widgets.** cursor-trail, sparkle, snowfall, Gif the cat
  (chase/patrol/doze, three coats), ticker, clock, last-updated, the odometer
  hit-counter, the smilies parser, starfield, CRT, View-Transition page wipes, a
  bouncing logo, a countdown, the konami code with a self-cleaning 30-second party
  mode, a webring, an XSS-safe guestbook, a jukebox that never autoplays, a draggable
  window manager, the **kugeln** (shaded spheres that trail your pointer in a rainbow),
  a **pixel-pet** you feed and that remembers you between visits, and a **fortune** box
  that deals old-web wisdom on click. Loadable one at a time or as one bundle.
- **Ten themes**: classic, midnight, bevel, phosphor, kawaii (scalloped panels via
  border-image, rounding without a single border-radius), y2k, cosmic (a starry purple
  void), newspaper (a serif broadsheet), highcontrast (an a11y-first skin at AAA), and
  bubble (the candy-plastic 2001 / aqua homage). Each behind a WCAG contrast gate.
- **A deeper wallpaper drawer**: more tiled backgrounds (dots, candy, hazard stripes,
  brick, zigzag, confetti, clouds, paws), each lawful CSS or a pixel asset.
- **The page builder**: drag components onto a canvas, pick a theme and wallpaper, wire
  up the toybox, edit text and links inline, import existing markup, and export clean
  HTML that passes the audit. The catalog as a live tool, alongside an 88×31 button-maker,
  a Sign Painter that spells words in ASCII, and a Userbar Factory for the glossy 350×19
  signature banners of the mid-2000s forums.
- **Thirty-four demo sites**: Sandra's homepage, a pizzeria, an ISP's NOC, a webcomic, a
  band shrine, an online store, a recipe box, a curated directory, and more, each a
  plain-HTML, view-source fixture that Playwright loads in CI.
- **Retrospace**: a curated, bilingual (DE/EN) directory and search for the retrostrap
  world: an admission scorer (`retrospace-check`), a moderation state machine with yearly
  re-reviews, accent-folding search, and a calm, polite frontend. Spec in `docs/12`.
- **The machine surfaces**: `manifest.json`, `guardrails.json`, `llms.txt`, a one-page
  cheatsheet, and an **MCP server** (`retrostrap-mcp`) that hands assistants the catalog
  as four tools, all generated from the catalog so they cannot go stale.
- **A docs site** built entirely with retrostrap, demos across all ten themes, and
  visual-regression goldens for the reference pages.
- **The services**: the Boards, whole: BBCode renderer, quiz, ranks, auth, the
  request layer, server-rendered views, and the single-table DynamoDB store with its
  seed; a runnable counter/guestbook/webring backend; and Retrospace's
  verify/moderation/search core. The deploys flip on at launch.

### Notes
- Nothing here is 1.0-stable yet. Class names and the JS API may still move during 0.x;
  every change will be recorded here and in MIGRATIONS.md.
