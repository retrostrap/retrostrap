# Demo sites

A framework nobody has seen running is a rumor, so they all run live: the
[demo hub](https://retrostrap.dev/demos/) is the front door, and every demo in
the roster below sits at `https://retrostrap.dev/demos/<name>/`. This document
specs the demo sites: 34 self-contained sample sites plus the docs site itself,
showpieces that prove retrostrap works, teach people how to use it, and keep
us honest in CI. (Seven demos plus the builder are specced in full below;
the rest are roster rows that follow the same rules.) Component names come from [components](04-components.md),
widget behavior from [widgets](05-widgets.md), themes from
[theming](07-theming.md).

## Why demos matter

Every demo does three jobs at once:

1. **Marketing.** Screenshots and GIFs of the demos are the README, the
   launch post, and the docs gallery. Nobody reads a class reference before
   they've seen a starfield.
2. **Teaching.** Demos are plain HTML you can view-source and copy. Every
   demo is a working answer to "how do I actually build a page with this?"
3. **Testing.** Playwright loads every demo's index page (and key subpages)
   as an integration test. If a refactor breaks Sandra's guestbook, the
   build goes red. The demos are our fixture zoo.

### Rules of the road

These are binding for every demo, hub page included:

- **Self-contained folder.** Each demo lives in `demos/<name>/` with plain
  HTML and its own assets. No build step, no bundler, no preprocessor. You
  can open `index.html` and read everything.
- **One string to the CDN.** All framework references use exactly the
  `../../dist/` prefix, so switching a demo to CDN hosting is a single
  find-and-replace:

  ```html
  <link rel="stylesheet" href="../../dist/retrostrap.min.css">
  <link rel="stylesheet" href="../../dist/themes/midnight.css">
  <script src="../../dist/retrostrap.min.js" defer></script>
  <script src="../../dist/retrostrap-toybox.min.js" defer></script>
  ```

  (The toybox line only where a page declares widgets.)

  (Exact dist layout per [theming](07-theming.md) and
  [widgets](05-widgets.md); the prefix rule is what matters here.)
- **The Laws pass.** Palette, Font, Shape, Motion, Decency, audited per
  page. The shared Decency gate (see shared infrastructure below) fails any
  demo that makes an external request, autoplays audio, or logs a console
  error.
- **Fully responsive.** Every page works from 320px up and is screenshotted
  at the three canonical widths: **375px / 800px / 1280px**.
- **Progressive enhancement.** Every page shows meaningful content with JS
  disabled; the app demos state their no-JS floor explicitly.
- **Fiction only.** No real brands, bands, games, people, or reachable URLs.
  External-looking links use `.example` hosts.
- **In-character `readme.txt`.** Demo folders ship a plain `readme.txt`
  written by the fictional webmaster. Cheap charm, and a place to credit
  fixtures.
- **Deterministic on demand.** Any demo with timers or randomness honors the
  `?rs-freeze=1` query parameter: timers stop, PRNGs seed to a
  constant. Screenshot and test tooling relies on it.

A note on widget configuration: option attributes below follow the
`data-rs-<widget>-<option>` convention from [widgets](05-widgets.md).

## The demo roster

| Demo | The fiction | Theme | What it proves |
|---|---|---|---|
| `demos/homepage-classic` | "Sandra's Space Corner", a teen astronomer's personal homepage | midnight | The archetype: counters, guestbook, webring, badges, the whole 1999 liturgy |
| `demos/smallbiz` | "Pizzeria Bella Napoli 2000", family pizzeria, est. 1987 | classic | Practical, boring, restrained use. You can build a normal site with this |
| `demos/app-todo` | "To-Do List 98", fictional shareware task manager | bevel | A modern offline CRUD app in period chrome; core JS only, zero widgets |
| `demos/fanpage` | "The Nebula Shrine", fan shrine for Star Quest 3D (1998) | y2k | Maximalism under the Laws: frames, splash, jukebox, easter eggs |
| `demos/whats-new` | "Mel's Corner ~ what's new", a teenager's diary/blog | kawaii | The soft palette, smilies, moods, personal publishing |
| `demos/portal` | "Starport", a late-90s web directory/portal | classic | Density under control: search, an eight-category grid, ticker, webring |
| `demos/band` | "Neon Divide", an unofficial basement-band fan shrine | midnight | The jukebox as centrepiece; the MP3.com fan-site genre |
| `demos/store` | "MegaByte Computers", a year-2000 online store | bevel | E-commerce: a product grid, a cart that adds up, a fully-labelled checkout |
| `demos/webcomic` | "Pixel & Byte", a slice-of-life webcomic | classic | The strip-and-archive layout: first/prev/next nav and the rant |
| `demos/tutorial` | "The Webmaster's Workshop", a learn-HTML tutorial | bevel | Dogfooding rs-tabs + rs-dos to teach the era's craft |
| `demos/clan` | "Clan Vortex", an arena-shooter clan page | phosphor | Data tables (roster, matches) under a dark theme |
| `demos/fanfic` | "The Story Nook", a fanfiction archive (invented fandom) | kawaii | Long-form reading: story index, ratings, chapter nav |
| `demos/adoptables` | "Blobby Adoptions", adopt a pixel pet | kawaii | The pixel-pet widget in context |
| `demos/radio` | "Basement FM", bedroom net radio | y2k | The jukebox as a station deck |
| `demos/webcam` | "Dana's Desk Cam", a JenniCam-era desk cam | midnight | The personal-cam genre, wholesome |
| `demos/recipes` | "Grandma Vi's Kitchen", a recipe site | classic | Honest content structure: ingredients, method, index |
| `demos/ezine` | "The Pixel Dispatch", a webzine | midnight | Editorial long-form layout |
| `demos/corporate` | "Nimbus Systems", corporate brochureware | bevel | It does boring enterprise too |
| `demos/awards` | "The Chrome Comet Award", a web-award program | y2k | The award-site genre |
| `demos/freelancer` | "PixelForge Web Design", a freelance webmaster | classic | The services-page genre |
| `demos/notfound` | "Pardon the mess", a 404 + under-construction page | classic | The error-page + construction + countdown kit, plus the one guestbook that works |
| `demos/dashboard` | "Server Room Status", NOC wall for PixelNet ISP | phosphor | Data-heavy live app skinning; discrete updates under the Motion Law |
| `demos/button-maker` | "Button Works", an 88×31 button generator | bevel | Canvas tooling, the Palette Law as UI, downloads without a server |
| `demos/builder` | "The builder", a drag-and-drop page maker | classic | The catalog as a live tool: compose, theme, and export lawful HTML |
| `demos/ascii-maker` | "Sign Painter 1.0", an ASCII banner maker | bevel | Text tooling: type, pick a font, copy the ASCII art out |
| `demos/desktop` | "My Computer", the webmaster's desktop | cosmic | The rs-window manager as a whole-page desktop metaphor |
| `demos/downloads` | "The Software Vault", a shareware index | bevel | The file-archive genre: listings, sizes, the download ritual |
| `demos/gazette` | "The Dial-Up Gazette", a small-town paper online | newspaper | The newspaper theme in full: masthead, columns, dateline |
| `demos/patterns` | "Backgrounds & baubles", a tile gallery | classic | The pattern set as a browsable swatch wall |
| `demos/quiz` | "Which theme are you?", a personality quiz | y2k | A playful interactive quiz; the theme set as the punchline |
| `demos/retrospace` | "Retrospace", the curated directory front-end | classic | The community directory: browse, search, toplist, all client-side |
| `demos/text-only` | "Sandra's Space Corner, text-only" | highcontrast | The honest text-only alternate; highcontrast end to end |
| `demos/userbar-maker` | "Userbar Factory 1.0", a 350×19 banner maker | bubble | Canvas tooling for the forum-signature userbar |
| `demos/webring` | "The Night Sky Ring", a webring hub | cosmic | The webring widget as a full ring hub: join, nav, member list |
| `site/` (docs site) | the docs are a showpiece too | all ten | Dogfooding everything, forever |

Between them the showpieces exercise every class in
[components](04-components.md) and every widget in [widgets](05-widgets.md)
at least once.

---

## demos/homepage-classic: "Sandra's Space Corner"

**The fiction.** Sandra, 16, saved two summers of pocket money for a
telescope (his name is Bruno) and one afternoon of homework time for this
homepage. Midnight theme, naturally, the page should look like the sky she
points Bruno at. Updated whenever the clouds win.

**Sitemap.**

- `index.html`: welcome, news, badges wall
- `about.html`: about me (`rs-card-profile`), Bruno's stats
- `scope.html`: observation log, eclipse sketches
- `photos.html`: deliberately unfinished: renders `rs-error-page` styled as
  "UNDER CONSTRUCTION" (the component gets tested, the fiction gets a joke)
- `guestbook.html`: seeded entries + sign-me form
- `december.html`: the winter cut of the homepage: snowfall on, its own
  masthead marquee and welcome copy (the "winter version" note on index
  points here)
- fixtures: none as files; the guestbook entries and the ring data ship as
  inline `<script type="application/json">` blocks in the pages that use
  them (view-source is the tutorial)

**Desktop wireframe (svga and up).**

```text
┌──────────────────────────────────────────────────────────────┐
│  * S A N D R A ' S   S P A C E   C O R N E R *      [masthead│
│  (rs-rainbow accent)              …neko patrols this edge…]  │
│  rs-marquee: Welcome space fans!! now with eclipse sketches  │
├───────────────┬──────────────────────────────────────────────┤
│ rs-sidenav    │ rs-panel "Welcome!"                          │
│  · home       │   welcome copy, rs-blink NEW!!               │
│  · about me   │ rs-note "In December it snows here, see     │
│  · my scope   │   december.html"                             │
│  · photos     │ rs-panel "News", 3 dated posts              │
│  · guestbook  │ rs-hr--stars                                 │
│  · cool links │ badges wall: [88×31][88×31][88×31][88×31]    │
├───────────────┴──────────────────────────────────────────────┤
│ rs-webring-bar: Night Sky Ring «prev · random · ring home · next»│
│ rs-footer: rs-counter 004096 · __updated · __badges          │
└──────────────────────────────────────────────────────────────┘
```

Mobile (below vga): masthead stacks and shrinks one font step (neko keeps
patrolling its top edge); sidenav becomes a full-width link list above the
content; panels stack single-column; badges wall wraps into rows; webring
bar wraps to two lines; footer stacks centered.

**Component checklist.** `rs-page`, `rs-container`,
`rs-layout--sidebar-left`, `rs-sidenav`, `rs-panel` + `__title`, `rs-note`,
`rs-marquee`, `rs-blink`, `rs-rainbow`, `rs-hr--stars`, `rs-list--stars`,
`rs-spacer`, `rs-badge` ("UNDER CONSTRUCTION"), `rs-badge--new`,
`rs-counter`, `rs-button88`, `rs-card-profile`, `rs-figure`, `rs-avatar`
(guestbook entries), `rs-quote`, `rs-form-table`, `rs-input`, `rs-textarea`,
`rs-btn--primary`, `rs-fieldset`, `rs-webring-bar`, `rs-footer` +
`__updated` + `__badges`, `rs-skip`, `rs-top`, `rs-error-page`
(photos.html), `rs-text-center`, `rs-mt-3`.

**Widget checklist.** Widgets sit on the elements they belong to, not in
one body-wide list:

```html
<body data-rs-widgets="neko"
      data-rs-neko-skin="gif"
      data-rs-neko-behavior="patrol" data-rs-neko-target="#masthead">
  …
  <div class="rs-panel" data-rs-widgets="fortune">…</div>
  <div class="rs-webring-bar" data-rs-widgets="webring"> …inline ring JSON… </div>
  <span class="rs-counter" data-rs-widgets="hit-counter"
        data-rs-hit-counter-mode="local"></span>
  <p class="rs-footer__updated" data-rs-widgets="last-updated"
     data-rs-last-updated-date="14 June 1999"></p>
```

The guestbook widget lives on `guestbook.html` with its entries inline; the
sign form's `action` is a `mailto:` (so Sandra keeps the real book), and a
small page script prepends the new entry, dispatches `rs:content` over it,
and calls `Retrostrap.announce('Entry added.')`. `december.html` adds
`snowfall` to the body list plus `data-rs-snowfall-density="light"`. All
spellings are canon per [widgets](05-widgets.md).

**Sample copy.**

```text
Hi!! Welcome to Sandra's Space Corner, my little homepage all about the
night sky. I'm Sandra, I'm 16, and I saved up TWO whole summers for my
telescope (his name is Bruno). This page is always under construction,
just like the universe. ~enjoy your stay~ and PLEASE sign my guestbook
before you go!

NEWS
14 June 1999, NEW sketches of the lunar eclipse on the My Scope page!
  (My camera is not good. My pencils are.)
02 June 1999, We joined The Night Sky Ring!! Hello ring surfers!
28 May 1999, Guestbook is up. Be nice, my mum reads it.
```

**Fixtures.** Both inline. The guestbook block on `guestbook.html` seeds six
entries (`{"entries": [{"name", "from", "date", "message"}…]}`, human dates
like "15 June 1999"):

```json
{ "entries": [
  {"name": "RocketRandy", "from": "Ohio, USA", "date": "15 June 1999",
   "message": "KEWL page!! Found you on the ring. Clear skies! :D"},
  {"name": "Dad", "from": "the next room", "date": "10 June 1999",
   "message": "Very nice Sandra. What do I click to go back?"},
  {"name": "Petra & Petra", "from": "astronomy club", "date": "30 May 1999",
   "message": "we are two Petras from the club, hi!!"}
] }
```

(…plus moonmaiden, comet_carl, and WebWanderer2000.) The ring block on
`index.html` carries `{"name": "The Night Sky Ring", "home": …,
"sites": [{"name", "url"}…]}`: six member sites, five on `.example` hosts
plus Sandra's own page, so the widget can find where she sits in the ring;
`home` points at the webring demo's hub.

---

## demos/smallbiz: "Pizzeria Bella Napoli 2000"

**The fiction.** The Esposito family has made pizza since 1987; the "2000"
arrived with the website, built by nephew Marco over one loud weekend.
Classic theme, Times, blue links. This is the demo for everyone who asks
"but can it look normal?" It can. It proves you can ignore the Toybox
entirely and still ship something warm.

**Sitemap.**

- `index.html`: welcome, today's special marquee, hours panel, card badge
- `menu.html`: the full menu as `rs-table--data`
- `find-us.html`: directions (`rs-cols-2`: pixel map sketch + steps)
- `contact.html`: reservation form (`rs-form-table`)
- assets: one pixel-art photo of the oven (drawn by us)

**Desktop wireframe (svga and up).**

```text
┌────────────────────────────────────────────────────────────┐
│ PIZZERIA BELLA NAPOLI 2000            since 1987           │
│ rs-navbar: Home | Menu | Find us | Contact                 │
├────────────────────────────────────────────────────────────┤
│ rs-marquee: Today's special, Quattro Stagioni + drink     │
│ rs-panel "Benvenuti!"          ┌─ rs-panel "Opening hours"─┐│
│   welcome copy, oven rs-figure │ Tue-Sun 11:30-14:30      ││
│   [rs-badge--new] we now       │         17:30-23:00      ││
│   accept card payments!        │ Monday closed            ││
│ rs-hr--groove                  └──────────────────────────┘│
│ rs-note: "Aug 15: closed. Ferragosto. The oven rests."     │
├────────────────────────────────────────────────────────────┤
│ rs-footer: __updated · rs-counter 004821 (static)          │
└────────────────────────────────────────────────────────────┘
```

Mobile (below vga): navbar collapses to stacked links; welcome and hours
panels stack (hours first, it's what phone visitors want); marquee stays
one line; menu table scrolls horizontally inside its own container; footer
stacks.

**Component checklist.** `rs-page`, `rs-container` (760px default),
`rs-navbar`, `rs-marquee` (one, tasteful), `rs-panel` + `__title`,
`rs-note`, `rs-alert--info` (holiday closure on index), `rs-figure`,
`rs-badge--new`, `rs-hr--groove`, `rs-table--data` (menu),
`rs-table--bordered` (hours), `rs-cols-2`, `rs-list--arrows` (directions),
`rs-form-table`, `rs-fieldset`, `rs-input`, `rs-select` ("how did you find
us"), `rs-radio` (pickup/delivery), `rs-checkbox` ("please ring me back"),
`rs-textarea`, `rs-btn--primary`, `rs-counter`, `rs-footer` + `__updated`,
`rs-skip`, `rs-quote` (one framed review from "the newspaper, 1994").

**Widget checklist.** The quietest demo, that is the point. Both widgets
sit in the footer, on the elements they fill:

```html
<span class="rs-counter" data-rs-widgets="hit-counter"
      data-rs-hit-counter-mode="static" data-rs-hit-counter-value="004821"></span>
<p class="rs-footer__updated" data-rs-widgets="last-updated"
   data-rs-last-updated-date="11 June 2002"></p>
```

`data-rs-hit-counter-value` fixes the display in static mode.

**Sample copy.**

```text
Benvenuti! Since 1987 the Esposito family makes pizza the slow way:
good dough, one day of patience, one very hot oven. Now we are also on
the World Wide Web (thank you to our nephew Marco). Look at the menu,
find our door, come eat.

NEW, We now accept card payments! (The machine is by the register.
Nonna still prefers cash.)

MENU (extract)          MARGHERITA 6.50 · MARINARA 5.90
DIAVOLA 8.50 · QUATTRO STAGIONI 8.90 · CAPRICCIOSA 8.90
BELLA NAPOLI SPECIALE 9.90 · CALZONE CLASSICO 8.20

Monday we rest. Even the oven.

CONTACT, Write to us for tables of 6 or more. For tonight, please
telephone: the computer is in the office and the office is far from
the kitchen.
```

**Fixtures.** None. Menu and hours are hardcoded HTML, the teaching point
is that a table is enough.

---

## demos/app-todo: "To-Do List 98"

**The fiction.** Fictional shareware from fictional Grebe Software:
"evaluate free for 30 days, then register for $12 and receive the
registered edition on floppy disk by post." The titlebar says
`To-Do List 98, [unregistered]` forever. Bevel theme: teal desktop, navy
titlebar, Tahoma. This is the modern-app proof, full CRUD on
localStorage, keyboard driven, works offline from `file://`.

**Sitemap.**

- `index.html`: the app (one `rs-window` centered on the teal desktop)
- `help.html`: a WinHelp-style help file: `rs-tabs`
  Contents / Shortcuts / Register
- `app.js`: one plain script, ~150 lines, no modules required, no build
- No widgets, core only. Adding `data-rs-widgets="windows"` makes the window
  draggable for free. With JS off, the page renders the window chrome and an
  `rs-alert--info` saying the list needs scripts, never a blank page.

**Desktop wireframe (svga and up).**

```text
        (teal desktop = rs-page, window centered via rs-center)
┌─ rs-window ────────────────────────────────────────── ▁ ▢ ✕ ┐
│ To-Do List 98, [unregistered]                               │
├──────────────────────────────────────────────────────────────┤
│ rs-menu: File ▾   Edit ▾   Help ▾                            │
│ rs-toolbar: [New] [Delete] [Mark done] [Clear completed]     │
├──────────────────────────────────────────────────────────────┤
│ rs-table--striped                                            │
│  [x] Return VHS tapes (late fees!!)                          │
│  [ ] Burn mix CD for road trip                               │
│  [ ] Defrag C:                                               │
│  [ ] Feed the neko                                           │
├──────────────────────────────────────────────────────────────┤
│ rs-input [ new task…                And ] [rs-btn--primary]  │
│ rs-progress ████████░░░░░░░░░░░░░░  25%                      │
├──────────────────────────────────────────────────────────────┤
│ rs-statusbar: 4 tasks, 1 done, 25% | saved to this computer │
└──────────────────────────────────────────────────────────────┘
```

Mobile (below vga): the window goes full-bleed (no desktop margin); menu
bar collapses into a single `rs-menu` dropdown; toolbar wraps to two rows;
table rows grow touch-height; statusbar stays pinned to the window bottom.

**Component checklist.** `rs-page`, `rs-center`, `rs-window` +
`__titlebar` + `__title` + `__controls` + `__body` + `__statusbar`,
`rs-menu`, `rs-toolbar`, `rs-tooltip` (toolbar buttons), `rs-table--striped`,
`rs-checkbox`, `rs-input`, `rs-btn--primary` / `--small`, `rs-progress`,
`rs-statusbar`, `rs-dialog` (delete confirm, clear-completed confirm,
Options, About), `rs-fieldset` + `rs-radio` (Options: sort manual/alpha) +
`rs-checkbox` ("confirm before delete"), `rs-alert--info` (empty state:
"No tasks. Go outside?"), `rs-loading` + `rs-cursor-hourglass` (300ms wink
on Clear completed), `rs-kbd` + `rs-tabs` (help.html), `rs-skip`.

**Widget checklist.** None, deliberately. The body has no
`data-rs-widgets` attribute at all, proving the CSS + core JS stand alone.

**Sample copy.**

```text
ABOUT, To-Do List 98, version 1.0. © 1998 Grebe Software. This
product is shareware. Evaluate it free for 30 days, then register for
$12 and receive the registered edition on a 3.5" floppy by post.
Registered users also receive: our gratitude.

SHORTCUTS (help.html)     Enter…add task    Space…toggle done
Del…delete selected       ↑/↓…move selection   Esc…close dialog

EMPTY STATE, No tasks. Go outside?
STATUSBAR: 4 tasks, 1 done, 25% | saved to this computer
```

**Fixtures.** No files. First run seeds three sample tasks from an inline
array in `app.js`; localStorage key `rs-demo-todo`.

---

## demos/fanpage: "The Nebula Shrine" (Star Quest 3D)

**The fiction.** Star Quest 3D (1998) is a fictional space-sim by fictional
Meteorhead Software: 40 missions, 9 flyable ships, a soundtrack its one
superfan, webmaster NovaKnight97, calls "the best ever squeezed onto a
CD-ROM." The Nebula Shrine is that fan's thank-you letter. Y2K theme,
Impact display type, banded silver chrome, maximum everything, this demo
shows how loud the Laws allow a page to get.

**Sitemap.**

- `index.html`: splash (`rs-splash`, ENTER button), then the shrine:
  news, awards wall, jukebox, sequel `rs-banner`
- `story.html`: the plot, with `rs-spoiler` for the ending
- `ships.html`: 9 ships in `rs-tabs`, stats tables, crosshair cursor
- `cheats.html`: the public cheat table
- `secret.html`: hidden page; reached via the konami code (or typing
  `starquest`), listed in no nav
- fixtures: none on disk; the tracklist is an inline JSON block and the
  three chiptune loops are synthesized in-page (see fixtures below)

**Desktop wireframe (svga and up).** Frameset look via `rs-frames`:

```text
┌ rs-frames ──────┬───────────────────────────────────────────┐
│ side pane       │  T H E   N E B U L A   S H R I N E        │
│ rs-sidenav      │  (rs-gradient-text, Impact)               │
│  » home         │  rs-breadcrumbs: You are here: Shrine     │
│  » story        ├───────────────────────────────────────────┤
│  » ships        │ rs-panel "News" [rs-badge--hot]           │
│  » cheats       │ rs-panel "Jukebox" ♪ tracklist (widget)   │
│                 │ rs-banner 468×60: STAR QUEST IV, 2000    │
│  [88×31 wall]   │ rs-hr--rainbow                            │
│                 │ awards wall: rs-award × 4                 │
│ (starfield runs ├───────────────────────────────────────────┤
│  behind it all) │ rs-footer: __updated · sign nothing, the  │
│                 │  shrine is eternal                        │
└─────────────────┴───────────────────────────────────────────┘
```

Mobile (below vga): frames stack, side pane becomes a top nav band, main
pane follows; splash becomes a full-screen tap target; jukebox panel goes
full width; awards wall wraps.

**Component checklist.** `rs-frames` + `__side`/`__main`,
`rs-container--wide`, `rs-sidenav`, `rs-splash`, `rs-btn--large` (ENTER),
`rs-gradient-text` (fire/ice/toxic), `rs-breadcrumbs`, `rs-panel` +
`__title`, `rs-badge--hot`, `rs-badge-wall`, `rs-banner`, `rs-award` +
`__caption`, `rs-hr--rainbow`, `rs-tabs` (ships), `rs-table--data` +
`rs-table--striped` + `rs-table-scroll` (cheats, ship stats), `rs-dos`
(code-entry listing), `rs-kbd` (key combos), `rs-spoiler` (story ending),
`rs-stars` (NovaKnight's 5/5 review), `rs-alert--warn` (secret page),
`rs-cursor-crosshair` (ships page), `rs-footer` + `__updated` + `__badges`,
`rs-skip`.

**Widget checklist.**

```html
<body data-rs-widgets="starfield cursor-trail konami"
      data-rs-konami-href="secret.html" data-rs-konami-words="starquest">
  …
  <div data-rs-widgets="jukebox"> …inline tracklist JSON… </div>
```

All spellings are canon per [widgets](05-widgets.md): the jukebox reads the
inline `<script type="application/json">` block inside its host; konami
`href` overrides the default 30s party mode with a navigation, per this
demo's easter egg, and `words` arms a typed cheat word. Jukebox never
autoplays (Decency Law); cursor-trail uses its default comet; last-updated
sits in the footer.

**Sample copy.**

```text
You have entered THE NEBULA SHRINE, the number one (and only?) fan
page for STAR QUEST 3D, the greatest space sim ever made. Meteorhead
gave us 40 missions and 9 ships. This page is my thank-you letter.
                                                     - NovaKnight97

NEWS · 21 Mar 2000, CONFIRMED in the official newsletter: patch 1.2
adds the Manta interceptor to skirmish!! Cheat table updated.

CHEATS (enter at the hangar screen unless noted)
BIGCHEESE…all weapons        SQHULL9…invincible hull
FISHBOWL…external camera     MOTHMODE…tiny ship (why??)
PAYDAY…+10,000 credits       REDSHIFT…nightmare difficulty
DISCOBAY…funky hangar music (this one is real, I swear)

SECRET PAGE, ok, you found it. You know the code. EVERYONE knows the
code. These are from the Meteorhead beta CD, use at your own risk…

AWARDS, Golden Floppy: Best Shrine, June 1999 · Cosmic Site Award ·
5 Alien Heads from Galaxy Reviews · "Site of the Cycle", Ring of Sims
```

**Fixtures.** None on disk. The jukebox's inline JSON names the album
("Star Quest 3D OST (as remembered by NovaKnight97)") and six tracks:
Hangar Bay, Nebula Run, Boss: The Ninth Moon, Docking Waltz, Skirmish!,
Credits (Long Way Home). A page script then renders three square-wave
chiptune loops (about half a minute each) as WAV object URLs, straight from
note strings written in the source, and deals them out across the six
titles. Three real loops reused across six tracks, era-accurate honesty
about disk space, and the sheet music is right there in view-source.

---

## demos/whats-new: "Mel's Corner ~ what's new"

**The fiction.** Mel, 15, updates her corner "whenever i feel like it!!"
(which is often). Kawaii theme: `#FFCCFF` everywhere, Comic Sans stack,
paw-print bullets. Entries are dated, mooded, and occasionally protected by
spoiler tags because her brother knows her URL.

**Sitemap.**

- `index.html`: the what's-new log, newest first (3+ entries)
- `about.html`: about me, `rs-card-profile`, quiz-result badge, `rs-comfy`
- `archive.html`: older entries, `rs-pagination`
- No fixtures, entries are hardcoded HTML (view-source is the tutorial);
  smiley sprites come from dist assets per [widgets](05-widgets.md)

**Desktop wireframe (svga and up).**

```text
┌──────────────────────────────────────────────────────────────┐
│         ~ * ~  M E L ' S   C O R N E R  ~ * ~                │
│            what's new ~ updated all the time!!               │
├────────────────────────────────────┬─────────────────────────┤
│ rs-panel "july 14 2002"            │ rs-sidenav ~friends~    │
│  mood: rs-stars ★★★★☆              │  · sarah's page         │
│  NEW LAYOUT!!! pink 4ever…         │  · pixel doll palace    │
│  :) :3 <- smilies widget           │  · waffle appreciation  │
│ rs-hr--dotted                      │    society              │
│ rs-panel "july 09 2002"            │  · kitty adoption ctr   │
│  mood: ★★☆☆☆ … rs-spoiler          │  · quiz corner          │
│  [click if you DARE]               │ rs-quote of the month   │
│ rs-panel "july 02 2002" ★★★★★      │  + rs-quote__sig        │
├────────────────────────────────────┴─────────────────────────┤
│ rs-footer: __updated · email me!! · rs-top "back to top ^^"  │
└──────────────────────────────────────────────────────────────┘
```

Mobile (below vga): title stacks to two lines; entries go full width;
blogroll sidenav drops below the entries (friends after news); quote block
follows the blogroll; footer stacks.

**Component checklist.** `rs-page`, `rs-container`,
`rs-layout--sidebar-right`, `rs-sidenav` (blogroll), `rs-panel` +
`__title` (dated entries), `rs-stars` (mood per entry), `rs-spoiler`,
`rs-quote` + `rs-quote__sig`, `rs-hr--dotted`, `rs-list--paws`,
`rs-badge--updated`, `rs-blink` ("NEW!!"), `rs-avatar` (pixel doll),
`rs-card-profile`, `rs-comfy` (about page bumps a type step),
`rs-pagination` (archive), `rs-btn--link` ("email me!!"), `rs-footer` +
`__updated`, `rs-top`, `rs-skip`, `rs-tooltip` (hover a smiley, see its
name).

**Widget checklist.**

```html
<body data-rs-widgets="sparkle smilies cursor-trail"
      data-rs-sparkle-color="#FF66CC"
      data-rs-cursor-trail-variant="hearts">
```

Both canon per [widgets](05-widgets.md): sparkle `color` takes one Palette
Law color (`#FF66CC` is web-safe); cursor-trail `variant` includes `hearts`.
Smilies run with defaults, converting ASCII faces page-wide; last-updated
sits on the footer's `rs-footer__updated` line.

**Sample copy.**

```text
july 14 2002 ~ mood: ★★★★☆
NEW LAYOUT!!! pink 4ever. i made the buttons myself in art class hehe.
also mochi (my digi-pet) evolved into the DRAGON form?? i have been
feeding him only waffles, so this is basically science. 3 more days of
school!! :)

july 09 2002 ~ mood: ★★☆☆☆
rained ALL day and the modem kept dropping :( finished my mystery book
tho. spoiler about the ending below. click if you DARE!!
   [spoiler] the dog was the detective THE WHOLE TIME. [/spoiler]

july 02 2002 ~ mood: ★★★★★
sarah came over and we made friendship bracelets and rated boy band
posters (fictional bands only, mom checks this page). best day ^_^

quote of the month: "shine like nobody is watching"
                                        - me, just now ^_^
```

**Fixtures.** None (see sitemap).

---

## demos/dashboard: "Server Room Status" (PixelNet ISP)

**The fiction.** PixelNet, a fictional dial-up ISP est. 1996, keeps this
board on the NOC wall. It is December 1999 and the Y2K freeze is in
effect. Phosphor theme plus `rs-crt`: green Courier on black, scanlines,
zero apologies. This demo proves retrostrap can skin a data-heavy,
auto-refreshing modern app, updates are discrete (`setInterval`, values
step, nothing tweens), exactly what the Motion Law wants.

**Sitemap.**

- `index.html`: the whole board: fleet table, modem pool, bandwidth
  chart, incident ticker, Y2K countdown
- Data ships inline in a `<script type="application/json">` block (works
  from `file://`, no fetch); a seeded PRNG mutates values every 5s;
  `?rs-freeze=1` stops the interval for screenshots/tests. With JS off, the
  seeded table still renders; only the live updates need scripts.

**Desktop wireframe (xga and up).** `rs-container--fluid`:

```text
┌──────────────────────────────────────────────────────────────┐
│ PIXELNET NOC ▮ SERVER ROOM STATUS      [clock 23:58:41] Y2K  │
│ rs-typewriter motd · rs-toolbar: [poll now] [freeze]  T-21d  │
├──────────────────────┬────────────────────┬──────────────────┤
│ rs-panel FLEET       │ rs-panel MODEM POOL│ rs-panel BANDW.  │
│ rs-table--data       │ pool1 ████████ 96% │ rs-dos           │
│ zeus   www   34% OK  │ pool2 ██████░░ 71% │ ##  ####   ##    │
│ hera   mail  61% WARN│ pool3 ███░░░░░ 38% │ ############# ↷  │
│ mimas  bkup  99% CRIT│ (rs-progress bars) │ (ASCII 24h bars) │
│  ^ rs-alert--error + │                    │                  │
│    rs-blink          │                    │                  │
├──────────────────────┴────────────────────┴──────────────────┤
│ ticker ► 23:58 mail2 queue cleared · Y2K FREEZE, NO DEPLOYS │
│ rs-statusbar: last poll 23:58:40 · next in 5s · 8 hosts      │
└──────────────────────────────────────────────────────────────┘
```

Mobile (below vga): three columns stack in priority order (fleet → modem
pool → bandwidth); low-priority table columns hide via `rs-hide-*`
(spelling per [components](04-components.md)); ticker stays one line;
statusbar pins to viewport bottom.

**Component checklist.** `rs-page`, `rs-container--fluid`, `rs-cols-3`,
`rs-panel` + `__title`, `rs-table--data` + `--striped`, `rs-progress`
(uptime + modem pools, `role="progressbar"`), `rs-dos` (ASCII chart),
`rs-alert--error` + `rs-blink` (the CRIT row), `rs-typewriter` (motd),
`rs-toolbar` + `rs-btn--small`, `rs-statusbar`, `rs-tooltip` (status
codes), `rs-hr--dotted`, `rs-kbd` (`F5` joke in the footer), `rs-crt`
(utility class on body; the `crt` widget adds flicker), `rs-hide-*`
responsive column trimming, `rs-skip`.

**Widget checklist.**

```html
<body class="rs-crt" data-rs-widgets="crt" data-rs-crt-flicker="true">
  …
  <span data-rs-widgets="clock" data-rs-clock-format="24"
        data-rs-clock-label="NOC 24H"></span>
  <span data-rs-widgets="countdown" data-rs-countdown-to="2000-01-01T00:00:00Z"
        data-rs-countdown-done="T-0d"></span>
  <span data-rs-widgets="ticker" data-rs-ticker-source="#incident-log"
        data-rs-ticker-speed="slow"></span>
```

All canon per [widgets](05-widgets.md): clock `format` is `12`/`24`; ticker
`source` reads a hidden `<ul id="incident-log">`; countdown `to` takes the
ISO datetime. Only `crt` rides the body; the informative widgets sit on the
board slots they fill. The `crt` widget layers flicker on the static
`rs-crt` class and stands down under `prefers-reduced-motion`.

**Sample copy.**

```text
MOTD: if it blinks red, phone Iris. if Iris does not answer, it is not
an outage, it is destiny.

INCIDENTS (ticker)
23:58 mail2 queue backlog cleared
22:41 modem pool 3 flapping, kicked it. sorry, dialers
21:02 Y2K FREEZE IN EFFECT, NO DEPLOYS UNTIL JAN 03
19:30 vending machine on NOC floor accepts coins again

Y2K COUNTDOWN, T-21 days. Readiness: 94%. (the remaining 6% is the
fax machine)
```

**Fixtures.** Inline JSON, 8 hosts:

```json
{"hosts": [
  {"host": "zeus",   "role": "www",    "cpu": 34, "uptime": "181d", "status": "OK"},
  {"host": "hera",   "role": "mail",   "cpu": 61, "uptime": "97d",  "status": "WARN"},
  {"host": "hermes", "role": "news",   "cpu": 12, "uptime": "204d", "status": "OK"},
  {"host": "atlas",  "role": "ftp",    "cpu": 28, "uptime": "155d", "status": "OK"},
  {"host": "iris",   "role": "dialup", "cpu": 47, "uptime": "63d",  "status": "OK"},
  {"host": "pan",    "role": "dns",    "cpu": 9,  "uptime": "412d", "status": "OK"},
  {"host": "mimas",  "role": "backup", "cpu": 99, "uptime": "0d",   "status": "CRIT"},
  {"host": "rhea",   "role": "sql",    "cpu": 55, "uptime": "88d",  "status": "OK"}
]}
```

---

## demos/button-maker: "Button Works"

**The fiction.** "Every homepage deserves a button. 88 by 31 pixels of
pure self-expression." Button Works is styled like a tiny paint program,
bevel theme, one `rs-window`, toolbox left, canvas center, palette right.
It is also a real tool: the docs site links here and the demos hub's own
buttons were made with it. Everything is client-side; the download is a
`canvas.toDataURL` PNG.

**Sitemap.**

- `index.html`: the whole program in one window
- `app.js`: plain script: palette data, tile painters, canvas render,
  PNG download
- `presets.json`: six starter buttons
- The swatch grid's layout is demo-local CSS in an inline `<style>`: it
  is app UI, not a framework component, and we don't invent an `rs-` class
  for it

**Desktop wireframe (svga and up).**

```text
┌─ rs-window: Button Works 1.0 ──────────────────────── ▁ ▢ ✕ ┐
├─ rs-toolbar: [Text] [Border] [Tile] [Presets ▾] [Download]  │
├──────────┬──────────────────────────────┬────────────────────┤
│ controls │   preview (4× zoom)          │ palette            │
│ rs-input │  ┌────────────────────┐      │ 216 web-safe       │
│  "MY     │  │  M Y   S I T E     │      │ swatches (grid)    │
│   SITE"  │  └────────────────────┘      │ + the named 16     │
│ rs-select│   actual size: [88×31]       │ (rs-tooltip shows  │
│  font    │   (rs-pixelated)             │  hex on hover)     │
│ rs-radio │                              │ fg/bg/pattern/     │
│  tile:   │  presets: [88×31][88×31]     │ border via rs-radio│
│  solid/  │   [88×31][88×31][88×31]      │                    │
│  checker/│   (rs-button88, click to     │                    │
│  stars   │    load)                     │                    │
├──────────┴──────────────────────────────┴────────────────────┤
│ rs-statusbar: 88×31, 3 colors, PNG ~400 bytes              │
└──────────────────────────────────────────────────────────────┘
```

Mobile (below vga): the three columns become `rs-tabs`
(Design / Preview / Palette) inside the window body; the preview tab is
default; toolbar wraps; statusbar remains at the window's bottom edge.

**Component checklist.** `rs-page`, `rs-center`, `rs-window` + full
titlebar/body/statusbar family, `rs-toolbar`, `rs-tabs` (mobile layout),
`rs-input` (button text, maxlength 14), `rs-select` (font, the era stacks
from the Font Law), `rs-radio` (tile: solid/checker/stars/stripes; and
which slot a swatch click sets: fg / bg / pattern's second colour / border,
the border radio sitting disabled while the "3D bevel edge" checkbox is on,
the bevel draws its own edges), `rs-checkbox` ("3D bevel
edge"), `rs-btn--primary` (Download PNG) / `--small`, `rs-tooltip` (swatch
hex), `rs-statusbar`, `rs-dialog` (About), `rs-button88` (preset gallery),
`rs-figure`, `rs-pixelated` (zoomed preview), `rs-kbd` (shortcut hints),
`rs-skip`.

**Widget checklist.** None, the paint program is the toy. (The konami
egg stays on the docs site; two easter eggs in one window is one too
many.)

**Sample copy.**

```text
Every homepage deserves a button. 88 by 31 pixels of pure
self-expression. Pick your colors, all 216 lawful ones, plus the
named sixteen, type your text, download your PNG, put it on your
page, join a ring.

PRESETS: classic navy · hot lava · terminal · bubblegum · roadworks
· midnight

ABOUT, Button Works 1.0, a retrostrap demonstration program. No
server, no upload: your button is drawn on your own computer, like
everything used to be.
```

**Fixtures.** `presets.json`:

```json
[
 {"name": "classic navy", "bg": "#000080", "fg": "#FFFFFF", "border": "bevel",  "tile": "solid",   "text": "MY SITE"},
 {"name": "hot lava",     "bg": "#330000", "fg": "#FF9900", "border": "ridge",  "tile": "stripes", "text": "COOL LINKS"},
 {"name": "terminal",     "bg": "#000000", "fg": "#00FF00", "border": "dotted", "tile": "solid",   "text": "root@home"},
 {"name": "bubblegum",    "bg": "#FFCCFF", "fg": "#660066", "border": "bevel",  "tile": "checker", "text": "kawaii!!"},
 {"name": "roadworks",    "bg": "#FFCC00", "fg": "#000000", "border": "ridge",  "tile": "stripes", "text": "UNDER CONSTR."},
 {"name": "midnight",     "bg": "#000033", "fg": "#FFFF00", "border": "none",   "tile": "stars",   "text": "star corner"}
]
```

Every hex must be web-safe or one of the named 16, a unit test asserts
the preset file against the Palette Law list.

---

## The docs site: a showpiece of its own

The docs site under `site/` is specced elsewhere (its information
architecture in doc 03) and is not
re-specced here. What this doc owns is the **dogfood list**: what the site
actually exercises, so that the reference is also the proof:

- the theme switcher, cycling all ten themes on the spot (classic,
  midnight, bevel, phosphor, kawaii, y2k, bubble, cosmic, newspaper,
  highcontrast); it is the site's only JS beyond the framework itself
- the "Museum" section from doc 01, presented as period exhibits
- `rs-navbar`, `rs-sidenav`, `rs-breadcrumbs` ("You are here:"),
  `rs-skip`, `rs-top`, `rs-pagination` (the museum's exhibit nav)
- `rs-dos` for code, `rs-table--data` for API tables, `rs-kbd` throughout
- `rs-badge--new`, `rs-alert--*` for admonitions, `rs-error-page` as the
  real 404
- `rs-footer__badges` hosting the 88×31 wall
- the demo screenshots from the shots pipeline, committed under
  `site/assets/shots/`

The site ships no widgets on purpose, cats would bury the documentation.

---

## demos/builder: the page builder

A WYSIWYG page maker in the GeoCities-PageBuilder tradition, except it emits clean
HTML that passes `Retrostrap.audit()`. It is the "try it in five minutes" onramp and
a live proof that the catalog is machine-usable: the component palette, the toybox
toggles, and the theme list are all generated from `manifest.json`, so the builder
never drifts from the framework.

- **Canvas in an iframe** so the user's theme and widgets can't touch the IDE chrome.
- **Keyboard-first**: click a palette item to add, block toolbars to reorder and
  delete, inline editing for text; drag is an enhancement, never the only path.
- **Export** a standalone document; **localStorage** projects; **undo/redo**; a
  responsive-width preview.

The builder's README (`demos/builder/README.md`) has the full spec.

---

## Shared demo infrastructure

### demos/_assets/

Reserved for the rare file a demo cannot own. Policy: **prefer
self-contained**; a file moves into `demos/_assets/` only when a third
demo needs it (rule of three). Candidate
tenants someday: a shared pixel-placeholder pack. Not candidates: fixtures
(always per-demo), theme CSS (that's `dist/`).

### Screenshot pipeline

`scripts/shots.mjs` (the canonical name per [architecture](03-architecture.md))
is a Playwright script, run in CI on release and on demand:

1. scans `demos/` for every folder with an `index.html`
2. serves the repo statically, appends `?rs-freeze=1` to every page
3. captures each demo's `index.html` at **375×667, 800×600, 1280×800**:
   yes, 800×600, for the culture
4. writes `site/assets/shots/<demo>--<width>.png`, overwriting; shots are
   committed so the docs site builds without running browsers

### The hub page

`demos/index.html` is the retro directory of demos: a classic-based page
of 35 `rs-panel` cards (34 demos plus the docs site), each wearing its own
demo's theme via a scoped `data-rs-theme` and holding the demo's 88×31
button (made in Button Works), its one-line fiction, and a "what it
proves" line. The hub obeys every rule in this doc; consider it the
roster's cover page, and one more page we screenshot.

### Test harness

Grouped specs under `tests/e2e/` (plain JS like the rest of the repo),
organized by what they cover: components, informative widgets, the wider
widget set, themes, and accessibility. Each loads the relevant demos and
applies the shared **Decency gate** on every page:

- zero requests to any origin other than the local static server
- zero console errors or unhandled rejections
- no media element with `autoplay`
- an axe scan with no critical violations (axe is a dev-time dependency of
  the test harness only, the zero-dependency promise binds `dist/`, not
  our toolbox)
- `rs-skip` present and focusable first

## The showcase gallery

Once real sites exist in the wild, the docs site grows a
"Showcase" page: an 88×31 button wall of community sites, because that is
how the web used to say "we exist."

**Submitting.** A pull request that (1) adds one entry to
`site/data/showcase.json` and (2) drops an 88×31 button image
into `site/assets/showcase/`. Schema sketch:

```json
{
  "url": "https://gardengnome.example",
  "title": "The Garden Gnome Registry",
  "author": "gnomekeeper",
  "button88": "gnome-registry.png",
  "added": "2026-11-03"
}
```

Button rules: exactly 88×31, ≤ 10 KB, PNG or GIF; animated GIFs welcome if
they flash below seizure thresholds and respect the spirit of the Motion
Law. The wall renders as `rs-button88` elements, order shuffled at build
time, it's a wall, not a chart.

### Alt-text guidelines for 88×31 buttons

An 88×31 button is still content for visitors using screen readers. Give each
meaningful image concise alt text that names its destination, status, or purpose;
do not describe its colors, border, or the fact that it is a button. Use empty
`alt` only when nearby text already provides the same information or the image is
purely decorative.

```html
<!-- Webring button: name the destination. -->
<a href="https://night-sky-ring.example"><img src="night-sky-ring.png" alt="Visit the Night Sky Ring"></a>

<!-- Made-with badge: state the claim. -->
<img src="made-with-retrostrap.png" alt="Made with retrostrap">

<!-- Mood badge: preserve the status it conveys. -->
<img src="mood-stargazing.png" alt="Mood: stargazing">

<!-- Link button: describe what following the link does. -->
<a href="mailto:sandra@example.com"><img src="email-me.png" alt="Email Sandra"></a>

<!-- Decorative button: surrounding link text supplies the accessible name. -->
<a href="https://sandra.example">Sandra's Space Corner <img src="sandra-button.png" alt=""></a>
```

**House rules.**

- the site visibly uses retrostrap (dist link or honest fork)
- passes the Laws audit, most importantly Decency: no tracking, no ads
  wearing a trenchcoat
- family-friendly; the wall is linked from documentation read by
  fifteen-year-olds building their first page, and we intend to keep it
  linkable
- original button art; no real-brand imitations
- link-rot patrol: quarterly we check the wall; dead sites get one polite
  email (era-appropriate: we wait two weeks) before the entry is retired
  to `showcase-archive.json`, never deleted

**Site of the month.** First Monday, monthly, once the wall has ten
buttons: the maintainers pick the site with the most *spirit*, never the
most traffic; we don't know the traffic, that's the point. The winner gets
an `rs-award` graphic ("Site of the Month" with Gif the cat holding a tiny
trophy), a pinned row atop the wall for the month, and a permanent line in
the hall-of-fame list at the page bottom. No repeat winners within twelve
months. The award graphic must itself pass the Palette Law, obviously.

## Copy tone guide

Ten rules for writing demo copy. Binding for demos, recommended for docs
prose, ignored at your peril in the showcase.

1. **Enthusiastic amateur.** The webmaster is thrilled you're here and not
   embarrassed about it. Competence optional, sincerity mandatory.
2. **Open with a welcome.** Every homepage greets: "Welcome to my corner
   of the web!" is the genre's handshake. Never skip it, never satirize
   it.
3. **Address the visitor.** "You are visitor number 004096." "Thanks for
   stopping by!" The reader is a guest, not traffic.
4. **Under-construction pride.** Unfinished is a feature. Announce what's
   coming, apologize for nothing: "photos page coming SOON (when dad
   fixes the scanner)."
5. **The guestbook is the economy.** The only conversion metric of 1999
   was signatures. Ask warmly and often: "PLEASE sign my guestbook before
   you go!"
6. **ALL CAPS, tastefully.** One word or a short burst for genuine
   excitement, "the DRAGON form??", never a whole sentence, never a
   headline convention.
7. **Tildes and garnish.** ~like this~, occasional ^_^ or :), decoration
   on the copy, not the copy. If a sentence still works with the garnish
   removed, it's the right amount.
8. **Date everything, brag about updating.** "Updated TWICE this week!"
   Era sites wore their changelogs proudly; so do our demos
   (`rs-footer__updated` exists for a reason).
9. **No growth-hacking vocabulary.** Nothing "engages," nobody
   "subscribes," there are no funnels, no "follow us," no calls to action
   that a 1999 teenager wouldn't write. The era's only CTA verbs: sign,
   email, bookmark, come back soon.
10. **Fictional everything.** No real brands, bands, games, celebrities,
    or reachable URLs, invented names with era-plausible shapes, links
    to `.example` hosts, people who never existed. If a lawyer or a
    nostalgic fan could recognize it, rename it.

One closing wink, free of charge: "best viewed in any browser at any
size", our demos make the old joke true.
