# The museum: how the web looked, 1995-2004

This document is retrostrap's research foundation: a loving, fact-checked tour of the vernacular web from the gray Mosaic years to the eve of Web 2.0. For every phenomenon we document three things, the technical constraint that caused it, the aesthetic it produced, and the exact piece of retrostrap that inherits it (marked **Design DNA →** with canonical names). We hold it to museum standards: real names, real dates, honest hedging where the record is fuzzy, and no invented citations. Where we say "as far as we can tell," we mean it, retro enthusiasts will check our work, and they should.

## Contents

1. [The eras](#1-the-eras)
2. [The technology that shaped the look](#2-the-technology-that-shaped-the-look)
3. [Anatomy of a personal homepage](#3-anatomy-of-a-personal-homepage)
4. [The decorations bestiary](#4-the-decorations-bestiary)
5. [Forum culture](#5-forum-culture)
6. [Sound and motion culture](#6-sound-and-motion-culture)
7. [A field guide to era color and type](#7-a-field-guide-to-era-color-and-type)
8. [What we deliberately do not revive](#8-what-we-deliberately-do-not-revive)
9. [The revival scene and prior art](#9-the-revival-scene-and-prior-art)
10. [Sources and further reading](#10-sources-and-further-reading)

## 1. The eras

Our subject is not "the nineties" as a mood board. It is four distinct visual periods, each caused by specific software shipping in specific years.

### 1993-96: the gray web

CERN put the web in the public domain in April 1993; NCSA Mosaic shipped the same year and made inline images possible. The default rendering *was* the design: a battleship-gray page (on most platforms a shade in the `#C0C0C0` family, the very silver that later got its own name in the HTML color list), black Times, blue underlined links, and that unmistakable visited-link purple (`#551A8B` in Netscape lore). Pages were academic: an `h1`, a photo, an `hr`, a "Last modified" line. Netscape 1.1 (spring 1995) lit the fuse with `bgcolor` and tables; Internet Explorer 1.0 arrived in August 1995 the same month Netscape went public. By late 1995 a page could finally *look like something*, and everyone immediately made it look like everything.

### 1996-99: the homestead boom

Netscape 2.0 (March 1996) shipped frames, JavaScript, Java, and looping animated GIFs, the complete toolkit of the personal homepage. GeoCities (born Beverly Hills Internet, 1994) organized millions of free "homesteaders" into themed neighborhoods; Angelfire, Tripod, and FortuneCity followed. Table layouts, tiled star backgrounds, hit counters, guestbooks, webrings, MIDI, `<font>` soup, 88×31 buttons, "under construction" forever. This is the web of the Hampster Dance (1998) and of theglobe.com's record-pop IPO (November 1998). It is the heart of our project.

### 1999-2002: DHTML, Flash, and chrome

IE4 and Netscape 4 (1997) had introduced DHTML, scriptable pages, and by 1999 copy-paste script culture (cursor trails, falling snow, status-bar tickers) was everywhere. Flash intros with "Skip intro" buttons became the front door of every studio and band site. The look chromed over: brushed metal, silver bevels, dark navy, Impact headlines, Winamp-skin futurism, Matrix green. Meanwhile the dot-com crash (March 2000) emptied a lot of office chairs without changing a single pixel of the amateur web.

### 2002-04: forums, blogs, and the last days

phpBB 2 (spring 2002) put a gradient-headered, post-count-ranked forum behind every hobby on earth; vBulletin ran the big ones. LiveJournal and Blogger (both 1999), then Movable Type (2001) and WordPress (2003), turned "What's New" pages into blogs. The end arrives on a schedule: CSS Zen Garden (May 2003) proves layout without tables; Facebook (2004), Gmail (2004), and Firefox 1.0 (November 2004) usher in the professional, anti-aliased, rounded-and-gradiented Web 2.0. MySpace (2003) was the vernacular web's loud last stand, the final time normal people were expected to decorate their own corner of the internet.

### Dates to hang exhibits on

These anchor dates are all verifiable, and the fuzzy ones are flagged where they appear later in this document.

| Year | What happened | Why the museum cares |
| --- | --- | --- |
| 1993 | CERN releases the web into the public domain; NCSA Mosaic ships | the gray web begins |
| 1994 | Netscape founded; Beverly Hills Internet (later GeoCities) opens; first banner ads run on HotWired (October 27) | homesteading and advertising are born the same year |
| 1995 | Netscape 1.1 brings tables and `bgcolor`; IE 1.0; JavaScript debuts; Netscape IPO; the 88×31 "Netscape Now!" buttons appear | pages can finally be *designed* |
| 1996 | Netscape 2.0 (frames, Java, looping GIFs); CSS1 on paper; FutureSplash becomes Flash; LinkExchange; Core fonts program begins | the personal-homepage toolkit is complete |
| 1997 | HTML 3.2 blesses `font`/`center`; IE4 and Netscape 4 ship DHTML; UBB-era forums spread | scripts and boards arrive |
| 1998 | Mozilla goes open source; Google incorporated; Microsoft buys LinkExchange; the Hampster Dance; GeoCities absorbs WebRing's parent | peak homestead |
| 1999 | Yahoo buys GeoCities (~$3.6B); LiveJournal and Blogger; "Burn All GIFs" day (November 5); IE5 | the commons gets a landlord |
| 2000 | dot-com crash; phpBB project born; "Flash: 99% Bad"; Yahoo's September WebRing overhaul | the professionalization begins |
| 2001 | IE6; the Wayback Machine opens to the public; Movable Type | the archive era starts just in time |
| 2002 | phpBB 2 and subSilver everywhere; Microsoft ends the Core fonts program | the forum web at full power |
| 2003 | CSS Zen Garden; WordPress; MySpace | the last vernacular stand |
| 2004 | Facebook, Gmail, Firefox 1.0, the first Web 2.0 conference | our era doors close |

### Why our core era is ~1996-2003

Before 1996 there is really only one look (gray page, Times, blue links, we keep it; it is the `classic` theme). After 2003 the look is Web 2.0, which is somebody else's revival to run. In between lies the period of maximum vernacular variety, table layouts, GIF ecology, OS chrome, terminal green, kawaii pink, y2k silver, all buildable with era-plausible primitives and all mappable to modern, accessible CSS. So: 1996-2003 core, with respectful excursions to 1993 and 2004 at the edges.

**Design DNA →**
- Era window 1996-2003 defines every component's reference look; `classic` anchors the early edge, `y2k` the late edge.
- The themes (`classic`, `midnight`, `bevel`, `phosphor`, `kawaii`, `y2k`, `cosmic`, `newspaper`, `bubble`) are era samples, not fantasies; the core themes trace to a documented genre (section 7); `highcontrast` is the one deliberate exception, an accessibility-first skin in period dress.
- Demos map to eras: homepage-classic (1996-99), fanpage (1997-2000), smallbiz (1999-2001), app-todo and dashboard (bevel-era software), whats-new (2002-04).

## 2. The technology that shaped the look

The early web did not look that way on purpose. It looked that way because of hardware, licensing deals, and browser-war one-upmanship. This section is the most important in the museum: every retrostrap law and component descends from a constraint documented here.

### 256 colors and the mathematics of the 216

Most mid-90s machines ran displays in 8-bit color: 256 simultaneous colors, period. Windows reserved 20 of them for its own interface, Macs reserved their own set, and any color a browser couldn't get, it faked by dithering, speckling two colors together. Netscape's answer was a 6×6×6 color cube: six values per channel (0, 51, 102, 153, 204, 255, hex `00/33/66/99/CC/FF`), giving 6³ = 216 colors that fit under the 236 slots Windows left free *and* matched what the Mac version used. Stay on the cube and your color rendered solid everywhere; stray off it and you got porridge. Lynda Weinman popularized (and arguably named) the "browser-safe" palette in her 1996 book *Designing Web Graphics*. The aesthetic consequences: flat saturated fields, hard edges, no subtle gradients (they banded), and deliberate dither used as texture. Alongside the cube lived the 16 named HTML colors, aqua, black, blue, fuchsia, gray, green, lime, maroon, navy, olive, purple, red, silver, teal, white, yellow, lifted from the Windows VGA palette and blessed by HTML 3.2. By 2000 the constraint was dying (a Webmonkey study by David Lehn and Hadley Stern found only 22 of the 216 rendered truly consistently on then-modern displays), but the *look* of the 216 had already defined an era.

**Design DNA →**
- Palette Law: all `--rs-*` color tokens live on the 216 cube plus the 16 named colors, silver `#C0C0C0` included. Canon in doc 02.
- Netscape's exact defaults (`#0000EE` links, `#551A8B` visited) sit just off the cube; `classic` rounds them to lawful values (`#0000FF`, `#660099`), by era taste rather than nearest-neighbor arithmetic, and documents the rounding.
- Dither patterns ship as original pixel assets, texture where the era would have dithered, never a smooth gradient.

### Core fonts for the web

There was no `@font-face` worth using, so type meant "whatever is installed." In 1996 Microsoft started the *Core fonts for the Web* program: free downloads of Andalé Mono, Arial, Arial Black, Comic Sans MS, Courier New, Georgia, Impact, Times New Roman, Trebuchet MS, Verdana, and Webdings. Verdana and Georgia were commissioned from Matthew Carter and hinted for the screen; Vincent Connare drew Comic Sans (1994, for a Microsoft product's speech balloons) and Trebuchet MS (1996); Impact predates the web by three decades (Geoffrey Lee, 1965); Times New Roman by six (Morison and Lardent, 1932). Because Internet Explorer was the default Mac browser from 1997, the pack landed on both platforms, and the entire visible web set itself in about ten faces. Tahoma is the one ringer in our list: it came with Windows and Office rather than the download pack, and by Windows 2000 it was the system UI face, which is exactly why it reads as "software" rather than "document." Microsoft ended the program in 2002, but the fonts never left the machines. Sizes came off the `<font size=1..7>` ladder, which modern browsers still map to 10/13/16/18/24/32/48 CSS pixels.

The sanctioned nine, with provenance and semantics:

| Face | Provenance | How it got everywhere | What it *means* on a page |
| --- | --- | --- | --- |
| Times (New Roman) | Morison & Lardent, 1932 | browser default | "document," "unstyled," academia |
| Arial | Monotype, 1982 | Windows, plus the core pack | "neutral," the beige of type |
| Courier New | Kettler's Courier, 1955; "New" since early Windows | Windows, plus the core pack | "machine," code, terminals |
| Verdana | Matthew Carter, 1996 | the core pack | "professional," legible at tiny sizes |
| Georgia | Matthew Carter, 1996 | the core pack | "editorial," early-blog elegance |
| Comic Sans MS | Vincent Connare, 1994 | Windows 95 era, then the pack | "friendly," kids' pages, shrines |
| Trebuchet MS | Vincent Connare, 1996 | the core pack | "webby," the 2000-era navbar face |
| Impact | Geoffrey Lee, 1965 | the core pack | "attitude," headlines, y2k |
| Tahoma | Matthew Carter, mid-90s | Windows and Office, not the pack | "software," OS chrome |

And the size ladder, straight from the `<font>` element to our tokens:

| `<font size>` | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CSS pixels (today's mapping) | 10 | 13 | 16 | 18 | 24 | 32 | 48 |
| retrostrap scale step | 1 | 2 | 3 (body) | 4 | 5 | 6 | 7 |

**Design DNA →**
- Font Law: nine sanctioned stacks, Times, Verdana, Tahoma, Arial, Comic Sans MS, Courier New, Impact, Georgia, Trebuchet MS.
- Sizes only on the 7-step scale 10/13/16/18/24/32/48, the real browser mapping of `<font size>`, not an invented scale.
- Arial Black folds into the Arial stack as a weight; Webdings' job is done by our original pixel assets; Andalé Mono lost the terminal beat to Courier New.
- `bevel` sets UI text in Tahoma because Windows 2000 did; `rs-dos` and `rs-kbd` use the Courier New stack.

### 640×480, 800×600, and "best viewed at"

The web was designed for CRTs: 640×480 (VGA) early on, 800×600 dominant by the turn of the millennium, 1024×768 for the fancy. Subtract scrollbar and browser chrome and you get the era's magic number: a table about 760 pixels wide, centered or left-flushed. WebTV squeezed pages into a canvas roughly 544 pixels across, ruining wider tables (as far as we can tell, to the surprise of every webmaster who never owned one). Since nobody could test everywhere, sites simply declared their assumptions with badges: "Best viewed at 800×600 in 16-bit color." A resolution was not a media query; it was a *promise the visitor had to keep*.

**Design DNA →**
- `rs-container` defaults to era-plausible measure (the 760px feeling) while `rs-layout` recipes stay honestly responsive underneath, the badge becomes a joke, not a requirement.
- The button-maker demo ships "best viewed" badge templates as `rs-button88` art, pointed firmly at ourselves.
- We test at 320px up; "best viewed at any size" is the actual contract.

### Table layout and the 1×1 spacer GIF

Before CSS layout there were tables. Netscape 1.1 shipped them in 1995 for data; designers immediately used them for geometry. The liturgy was `border=0 cellpadding=0 cellspacing=0`, nested five deep, with sliced images pinned into cells. The load-bearing miracle was the single-pixel transparent GIF, stretched via `width`/`height` into invisible struts, popularized by David Siegel's *Creating Killer Web Sites* (1996), a book so influential its author published a mea culpa the next year titled "The Web Is Ruined and I Ruined It." The aesthetic: boxy, tightly seamed, grid-locked compositions with beveled table borders, accidental Mondrian at 72dpi.

**Design DNA →**
- `rs-layout` recipes reproduce the classic geometries (holy-grail nav/content, sliced-header pages) in grid and flex, table *looks*, no table markup.
- `rs-table` is reserved for actual data and dresses it in era chrome: beveled borders, header fills, alternating rows.
- `rs-spacer`: a spacing component named in loving memory of the 1×1 GIF, implemented as honest margin.
- Shape Law: crisp rectangles everywhere; border-radius 0.

### Frames and framesets

Netscape 2.0 (1996) introduced `<frameset>`: the window carved into independent scrolling panes, classically a navigation frame on the left, content on the right, maybe a banner on top and a status strip below. It was the first app shell, persistent chrome around changing content, and it broke everything else: bookmarks pointed at the frameset, the back button became a riddle, search engines indexed orphan frames, and pages had to carry "frame-buster" scripts to escape other people's framesets. Every framed site politely offered a `<noframes>` ghost town. HTML5 finally declared framesets obsolete, but the *layout idea* was correct all along.

**Design DNA →**
- `rs-frames`: the frameset look, bordered panes, independent scroll, optional fake resize grips, built on CSS grid with real URLs, so deep links and the back button work.
- `rs-sidenav` is the eternal left nav frame; `rs-statusbar` the bottom strip.
- Decency Law says navigation may never trap the visitor: no frame-jail behaviors, ever.

### The font/center/bgcolor school of styling

Styling lived in markup: the `<body bgcolor text link vlink alink>` quintet, `<font face color size>`, `<center>`, `align` attributes on everything. HTML 3.2 (January 1997) standardized this reality; CSS1 (December 1996) existed on paper, but Netscape 4's CSS support was cursed enough that attribute soup stayed rational until roughly 2001. The consequence was per-page identity: every page carried its own five-color scheme like a flag, and changing your link colors was a personality update.

**Design DNA →**
- `--rs-*` tokens deliberately mirror the body-attribute quintet, page, text, link, visited, active, so theming feels like editing a `<body>` tag from 1997.
- `rs-page` is the body quintet reborn; themes are bgcolor culture formalized.
- We keep the *idiom* and discard the markup: semantic HTML, tokens on top.

### The animated GIF

CompuServe's GIF (1987, animation-capable in the 89a revision) ran the decorative economy. Constraints: 256 colors per frame, frame delays in centiseconds, palette-locked dithering, and looping, which arrived when Netscape 2.0 honored an application extension that literally spells `NETSCAPE2.0` inside the file bytes. Because dial-up made every kilobyte expensive, backgrounds were tiny tiles (stars, clouds, texture squares) repeated to infinity, and animations were small, few-framed, and hypnotic. The Unisys LZW patent squeeze gave us both PNG (1996) and the gloriously indignant "Burn All GIFs" day (November 5, 1999). The GIF look, hard pixels, short loops, dithered shading, is the era's signature texture.

**Design DNA →**
- All retrostrap art is original pixel work compiled from JSON pixel grids, GIF-shaped constraints (tiny palette, hard edges, short loops), modern delivery.
- Motion Law's `steps()` easing is the GIF frame-delay model as CSS; `rs-blink` and `rs-marquee` are GIF-culture motion without GIFs.
- Tiled-background utilities and `rs-page` textures honor the tiny-tile tradition; no tile we ship exceeds a few kilobytes.

### Embedded MIDI and the autoplay plague

MIDI files are sheet music, not sound, a few kilobytes that your sound card performed as well or as badly as it could, so the same song was lush on a wavetable card and kazoo-like on FM synthesis. Internet Explorer offered `<bgsound>`, Netscape 3's LiveAudio played `<embed>`, and plugins (Crescendo; Thomas Dolby's Beatnik) filled gaps. The result: pages that *started singing the moment they opened*, usually at full velocity, with a tiny "music off" button as the era's most-clicked act of folk mercy. We document this with affection and zero nostalgia for the behavior itself.

**Design DNA →**
- The jukebox widget is the MIDI shrine done right: visible player, explicit play, remembers being muted.
- The music-toggle *button aesthetic* survives in demo toolbars (`rs-toolbar`) as an homage control.

### Browser-war badges

From 1995 to about 2001, Netscape and Microsoft shipped incompatible features on purpose, and sites picked sides with 88×31 flair: "Netscape Now!", "Best experienced with Internet Explorer," each badge a tiny propaganda poster. The dark side was sniffing scripts that bounced the "wrong" browser to an insult page. The resistance had a badge too: the "Viewable With Any Browser" campaign, whose position we adopt wholesale.

**Design DNA →**
- `rs-button88` ships original homage badges; the button-maker demo lets anyone make their own.
- Decency Law: progressive enhancement, never user-agent gatekeeping. Our badges are jokes; our compatibility is not.

### window.status scrollers

JavaScript's first mass-deployed special effect: writing into the browser's status bar, usually a scrolling welcome ("*** Welcome to my homepage!!! ***") or a typewriter loop. Browsers eventually ignored `window.status` because it let pages lie about link destinations, a fair trade, but it deleted a whole genre of ambient text motion.

**Design DNA →**
- `rs-statusbar` gives pages an in-page status strip that can't spoof the browser's own; the ticker widget performs the scroll inside it.
- Motion Law timing applies: linear crawl at 30/60/120 px/s, pausable, reduced-motion aware.
- A planned title-ticker widget is the genre's other survivor, strictly opt-in.

### Java applets and the rippling lake

Netscape 2.0 shipped Java support, and the web got gray rectangles that said "Applet loading…" and occasionally delivered wonders. The undisputed folk classic was the "lake" applet, commonly credited to David Griffiths, which reflected any photo in gently rippling water; applet packs (the Anfy-style collections) added fire, lenses, and scrolling 3D text to a million homepages. Applets were slow, crash-prone, and sandboxed awkwardly, and they died with browser plugin support in the 2010s. What survives is the *desire*: one drop-in file that makes your page do something impossible.

**Design DNA →**
- The Toybox is our applet tray: separately loadable, one script tag, degrades to nothing if absent, the drop-in wonder without the plugin.
- `rs-loading` keeps the hourglass-patience aesthetic honest (it reflects real waits, never fakes one).
- A planned aquarium widget is the lake applet's spiritual heir; until then the fanpage demo keeps a still pond.

### The DHTML script era

When IE4 and Netscape 4 (1997) exposed the page to scripts, incompatibly, `document.all` versus `document.layers`: a copy-paste folk economy bloomed: cursor trails, image rollovers (with the sacred image-preload block), falling snow, fireworks, page-transition filters. Libraries of free scripts (Dynamic Drive is the famous survivor, running since the late 90s; Webmonkey, HTML Goodies, and kid-friendly Lissa Explains It All taught the rest) established a norm we consider sacred: view source, take the script, keep the credit comment. It was open source before most participants knew the term.

**Design DNA →**
- Several Toybox widgets are straight from this canon: cursor-trail, snowfall, sparkle, ticker, clock, last-updated, hit-counter, smilies.
- Configuration via `data-rs-*` attributes mirrors the era's "edit these variables" config blocks, readable by view-source, in the tradition.
- The `Retrostrap` global is the one-script-tag ritual, formalized and MIT-licensed.

### Flash splash pages and "Skip intro"

FutureSplash Animator (1996) became Macromedia Flash within the year, and by 1999 the serious-looking web opened with a plugin movie: tweened logos, techno stings, and the genre-defining "Skip intro" link. Usability's most famous grump rated it "99% Bad" in 2000, and he had a point, full-Flash sites broke links, back buttons, screen readers, and search. Flash the platform died officially at the end of 2020 (Ruffle and Flashpoint now preserve the artifacts). Retrostrap deliberately does not do Flash, emulated or otherwise: it was a proprietary plugin then and it is a museum piece now. We keep the *ceremony*, the ta-da of arrival, with standard tech that respects the visitor.

**Design DNA →**
- `rs-splash`: the intro screen as a component, always skippable, skip remembered, content reachable without it.
- transitions widget: View Transitions wipes stand in for Flash scene changes, under Motion Law easing.
- konami's 30-second party mode is our licensed dose of intro-movie exuberance, strictly user-summoned.

## 3. Anatomy of a personal homepage

Take one archetypal homestead page, circa 1998, and dissect it on the table. Every organ maps to a retrostrap part.

### The parts list

| Organ | Field description | retrostrap part |
| --- | --- | --- |
| Welcome banner | "Welcome to my Homepage!!" in WordArt or spinning 3D text (Xara3D was the tool of choice) | `rs-page` header patterns + original banner art |
| Under-construction sign | striped barricade, digging worker, permanently temporary | `rs-construction` |
| Visitor counter | "You are visitor number 004221 since 1997", odometer digits, occasionally starting from a flattering number | `rs-counter` + hit-counter |
| Guestbook links | the sacred pair: "Sign my guestbook" / "View my guestbook" | guestbook |
| Webring bar | Previous · Random · Next, at the very bottom | `rs-webring-bar` + webring |
| Awards wall | "This site won the Golden Something Award" | `rs-award` |
| About Me page | age, pets, hobbies, favorite bands, photo of the dog | `rs-card-profile` + `rs-avatar` |
| Links page | a wall of 88×31 buttons and blue underlines | `rs-button88` |
| "What's New" log | dated bullets, newest on top, the proto-blog | whats-new demo + last-updated + `rs-badge--new` |
| MIDI toggle | tiny note icon; the page is already singing | jukebox (which never autoplays) |
| Spinning email GIF | a rotating envelope or `@`, mailto link attached | original pixel asset in the mail set |
| "Best viewed" badges | resolution and browser loyalty oaths | `rs-button88` via button-maker |

Tooling flavor: pages like this were built in Notepad, FrontPage (whose Java "hover buttons" haunted a generation), Netscape Composer, or HotDog, with graphics from Paint Shop Pro and Animation Shop, Microsoft or Ulead GIF Animator, and online logo mills like Cool Text.

The whole organism, as a museum plate, is the layout the homepage-classic demo reproduces:

```text
+--------------------------------------------------------------+
|        ~*~ WELCOME TO MY HOMEPAGE ~*~   [spinning logo GIF]  |
|   <blink>NEW!</blink>   best viewed 800x600   [counter: 4221]|
+--------------+-----------------------------------------------+
| [nav frame]  | [main frame]                                  |
|  * home      |  Hi!! Welcome to my little corner of the      |
|  * about me  |  web!! Last updated: 04/17/1998               |
|  * my dog    |                                               |
|  * links     |  [== UNDER CONSTRUCTION ==]                   |
|  * webrings  |                                               |
|              |  What's new: added 3 new MIDIs!!              |
| [MIDI: on]   |  ~~~~~~~~ [flame divider] ~~~~~~~~            |
| [mail me @]  |  My awards: [88x31] [88x31] [88x31]           |
+--------------+-----------------------------------------------+
|  Sign my guestbook | View my guestbook | You are visitor 4221|
|        << prev | [The Cool Ring] | random | next >>          |
+--------------------------------------------------------------+
```

A homepage was a verb, not a noun. The maintenance ritual: edit in Notepad, upload by FTP or the host's clunky file manager, bump the "What's New" entry, move the `NEW!` badge to the newest thing, then go sign three friends' guestbooks so they'd come sign yours, and maybe submit the update to your ring. The page was never finished, that is what the construction sign *meant*, and the site's real product was the visiting.

### The free-host culture

GeoCities organized itself as a city: themed neighborhoods, then suburbs, then your four-digit lot, an address like `geocities.com/Area51/Vault/4227` told everyone what tribe you belonged to before a single GIF loaded. The famous neighborhoods, as the folklore and the archives have it:

| Neighborhood | Theme |
| --- | --- |
| Area51 | sci-fi and fantasy fandom |
| Tokyo | anime and Japan fandom |
| SiliconValley | computers and tech |
| EnchantedForest | kids' pages |
| Heartland | family, pets, hometown life |
| CapeCanaveral | space and science |
| SoHo | art and writing |
| SunsetStrip | rock and punk |
| Colosseum | sports |
| Vienna | classical music |
| WestHollywood | LGBT community |
| Petsburgh | pets, more pets |

Yahoo bought GeoCities in early 1999 for roughly $3.6 billion in stock, promptly claimed sweeping rights to homesteader content in its terms, and faced a genuine user revolt, many homesteaders grayed-out or blanked their pages until Yahoo retreated. The US service closed October 26, 2009; Archive Team raced the bulldozer and saved the better part of a terabyte (GeoCities Japan held on until 2019). Angelfire began, the oft-told story goes, as a sideline of a medical transcription outfit before Lycos absorbed it; Tripod was Bo Peabody's college startup (Lycos bought it in 1998, and a Tripod engineer, Ethan Zuckerman, later apologized for inventing the pop-up ad there); FortuneCity ran the same city metaphor from London; AOL Hometown hosted millions until its abrupt 2008 shutdown taught everyone the word "link rot."

### The German-speaking homestead

The Boards launch with a German-language board ("Der Stammtisch"), and the German scene earns it. Beepworld, launched in 1999 by David Finkenstädt, then a 16-year-old, later run from Düsseldorf as a family business, was *the* Homepage-Baukasten: click-together pages with counters, photo galleries, and above all the Gästebuch. German homepage culture ran disproportionately on guestbook sociality: you visited, you left a "GB-Eintrag" with greetings ("Grüße gehen raus an…", "hdl!"), and you expected one back, a friend-feed years before feeds. Beepworld reportedly grew past four million members; alongside it lived ISP freebie space (members pages at the big German providers and AOL) and, later, successor kit-hosts. The glitter-graphics dialect of these pages feeds our `kawaii` theme as much as any English-language source.

**Design DNA →**
- homepage-classic demo is this whole section, playable: banner, counter, guestbook links, webring bar, badge wall.
- `rs-counter`, `rs-award`, `rs-webring-bar`, `rs-badge--new`, `rs-card-profile`, `rs-avatar`, `rs-button88` cover the organ inventory; guestbook, webring, hit-counter, last-updated animate it.
- `rs-construction`: an under-construction sign as component + original pixel asset, because no museum of this era can lack one.
- Retrostrap Boards' "Der Stammtisch" inherits Gästebuch warmth: greeting-first, low-stakes posting, no metrics.

## 4. The decorations bestiary

The ornamental fauna of the era, one exhibit per genus: history first, then where it lives in retrostrap. The index, for people who alphabetize their GIF folders:

| Exhibit | Habitat, at its peak | retrostrap heir | Theme affinity |
| --- | --- | --- | --- |
| Bullets, rules, flames | every list and section break | `rs-hr--rainbow` + asset sets | all |
| Sparkles and glitter | shrines, blinkie pages | sparkle | `kawaii` |
| Cursors and trails | "enhanced" homepages | cursor-trail | `kawaii`, `midnight` |
| The desktop cat | desktops since the 1980s | neko | all |
| Falling snow | Decembers, everywhere | snowfall | `classic`, `midnight` |
| Hit counters | page footers | hit-counter + `rs-counter` | all |
| 88×31 buttons | links pages, footers | `rs-button88` | all |
| 468×60 banners | page tops | `rs-banner` | `y2k` |
| Guestbooks | the social organ | guestbook | all |
| Webrings | page bottoms | webring + `rs-webring-bar` | all |
| Site awards | trophy walls | `rs-award` | `classic` |
| NEW!/UPDATED! tags | beside anything recent | `rs-badge--new` | all |
| Blinkies and dollz | sidebars, sig lines | `rs-blinkie`, `rs-avatar` | `kawaii` |
| Smilies | forums, guestbooks | smilies | all |

### Pixel bullets, divider rules, and flame GIFs

Lists got jeweled bullets (spinning balls, gems, tiny arrows), sections got horizontal-rule GIFs, braided ropes, chasing lights, rainbows, and anything cool got flames. These existed because `<hr>` and `<li>` were the only rhythm instruments HTML offered, and a 2KB GIF upgraded both.
**Design DNA →** `rs-hr--rainbow` and its rule family; original bullet sets in the asset library; list utilities that take pixel bullets without breaking semantics.

### Sparkles and glitter graphics

Transparent GIF overlays that made text and dolls twinkle, a genre that peaked in the kawaii and glitter-graphics scenes and never really died (it re-blooms on every platform that allows images).
**Design DNA →** sparkle widget (pointer-following twinkles, reduced-motion aware); `kawaii` theme's decorative layer.

### Custom cursors and cursor trails

Two lineages. Software: Comet Cursor (Comet Systems, late 90s) let sites replace your pointer and became an early cautionary tale about bundled tracking. Folk scripting: DHTML trails, sparkles, clocks, or text orbiting the pointer, copy-pasted from script libraries onto everything.
**Design DNA →** cursor-trail widget, strictly page-scoped and tracking-free (the Comet lesson is Decency Law in miniature); CSS pixel-art cursors shipped as PNGs from the asset pipeline.

### The desktop cat (the Neko lineage)

The cat that chases your pointer is older than the web. As far as we can tell the line starts with NEKO.COM by Naoshi Watanabe on the NEC PC-9801 in the 1980s; Kenji Gotoh's 1989 Macintosh desk accessory "NekoDA" redrew the cat and released the now-canonical sprites generously into the wild; 1990 brought xneko (Masayuki Koba) and oneko (Tatsuya Kato) to Unix desktops, 1991 the Windows ports, and eventually the browser adaptations that put a cat on many a homepage. It may be the longest-running piece of software folklore in existence.
**Design DNA →** neko widget: a pixel cat that chases the cursor or patrols an element edge. Our sprites are original work (Gif the cat's scrappy cousin), drawn in tribute, ripped from nowhere.

### Falling snow

Every December, the DHTML snow script fell across the personal web, absolutely positioned flakes drifting down the viewport, a screensaver aesthetic (the flying-toaster tradition of After Dark 2.0, 1990, in browser form). Snow scripts were often the first JavaScript a homepage owner ever installed.
**Design DNA →** snowfall widget: seasonal, capped particle count, off under prefers-reduced-motion, removable in one line.

### Hit counters

CGI counters rendered your visitor total as odometer digit strips, proof of life in a pre-analytics world. Free services (Web-Counter at digits.com was among the mid-90s giants; Bravenet, founded 1997, bundled counters with everything) served the digits; folk practice occasionally started the count somewhere flattering. Counters later curdled into tracking beacons, which is a different exhibit (section 8).
**Design DNA →** hit-counter widget: odometer aesthetics, self-hosted or storage-backed, zero third-party calls; `rs-counter` renders the digit chrome for any number you can defend.

### 88×31 buttons

The mightiest standard nobody wrote down. The earliest instances we can find are Netscape's 1995 "Netscape Now!" buttons at 88×31; LinkExchange's button network and GeoCities' link-back buttons spread the size everywhere, and ad bodies later canonized it as the "micro bar." Why those pixels exactly is folklore, accounts differ, and we hedge. The button was identity compressed: your site, your ring, your browser loyalty, in 2,728 pixels.
**Design DNA →** `rs-button88`: the 88×31 shell as a component, plus the button-maker demo for rolling your own. Retrostrap's own button ships in the assets, obviously.

### 468×60 banners

The first web banner ran on HotWired on October 27, 1994 (AT&T's, of "you will" fame), and by the end of 1996 the industry had standardized the 468×60 "full banner." LinkExchange (founded 1996, sold to Microsoft in 1998) turned it into a barter economy for amateurs: show banners, earn credits, be shown. The proportions are burned into every survivor's retina.
**Design DNA →** `rs-banner`: the 468×60 shell for self-promotion and demo dressing; a planned banner-rotator widget recreates the exchange carousel, pointing only where you tell it.

### Guestbooks

The comment section's gentle ancestor: a form, a list of entries, and social obligation. Most ran on free hosted services, Dreambook and Bravenet were staples, and GuestWorld (which, as far as we can tell, began as Lpage before folding into the Tripod/Lycos world) was among the biggest, until spam ate the genre alive in the 2000s.
**Design DNA →** guestbook widget: storage-agnostic entries, honeypot fields standard, moderation optional (the classic book is open by default), the warmth without the spam autopsy. House rules inherit from the Retrostrap Boards netiquette charter.

### Webrings

Sites holding hands in a circle: Previous, Next, Random, all curated by a ringmaster. Sage Weil, a teenager then; he later created the Ceph filesystem, got the CGI-scripted WebRing running in the mid-90s (retellings differ between 1994 and 1995) and it grew into the web's community cartography. Sold to Starseed, absorbed into GeoCities in 1998, swallowed by Yahoo in 1999, WebRing was then "improved" in September 2000 into a Yahoo product that members fled; Yahoo dropped it entirely in 2001. A perfect parable: the ring survived everything except professional management.
**Design DNA →** webring widget + `rs-webring-bar`: static-config or JSON-fed rings for the modern indie web, no central service to be acquired.

### Site awards

"This site has won the [something] Award!", a cottage economy of mutual recognition, from Cool Site of the Day (launched 1994 by Glenn Davis, the genre's patient zero) down to thousands of homemade award programs that mostly existed to farm reciprocal links. The award GIF wall was the era's trophy shelf, and everyone knew the trophies were participation medals, and nobody cared.
**Design DNA →** `rs-award`: ribbon, medallion, and plaque shells for jokes, changelogs, and genuinely earned kudos. The docs site awards itself something tasteful.

### "NEW!" and "UPDATED!" tags

The attention economy at 88 bytes: a blinking or flashing "NEW!" beside anything recent, an "UPDATED!" for repeat visitors, ideally with a date. This is versioning as decoration, and it is the most honest UI pattern the era produced.
**Design DNA →** `rs-badge--new` and its calmer sibling `rs-badge--updated`; `rs-blink` supplies the pulse under Motion Law's 1-second `steps()` cadence.

### Blinkies and pixel dolls

Blinkies: skinny animated strips (around 150×20) with glitter borders and declarations ("I ♥ my cat"). Pixel dolls ("dollz"): dress-up-style avatar art traded and "adopted" between sites, a lineage that, as far as we can tell, runs back through avatar culture in The Palace chat software of the late 90s. Both were badges of belonging, made by hand, credited scrupulously.
**Design DNA →** `rs-blinkie`: the strip shell with `rs-blink`-powered shimmer; `rs-avatar` and the pixel-pet widget carry the doll and adoptable traditions with original art.

### Smilies

Scott Fahlman proposed `:-)` on a Carnegie Mellon bulletin board on September 19, 1982; Usenet spread the dialect; and the forum age made smilies graphical, every phpBB install shipping its yellow pack of `:D`, `:lol:`, and `:roll:`. The emoticon-to-image pipeline (type the code, see the face) is one of the web's oldest text-expansion rituals.
**Design DNA →** smilies widget: an original pixel smiley pack plus the classic type-`:code:`-get-face behavior, alt text included, for Boards and guestbook alike.

## 5. Forum culture

The message board is the era's great social architecture, and its look is weirdly stable across engines: a gradient header bar, a logo left, tables of forums with folder icons, and rows of threads flanked by poster identity columns. The lineage runs from Matt Wright's WWWBoard (mid-90s Perl, the primordial soup) through UBB (Infopop's Perl juggernaut, whose UBBCode became everyone's BBCode), hosted ezboard communities (late 90s), then the PHP wave: vBulletin (2000) for the big leagues and phpBB (2000; the epochal phpBB 2 arrived in spring 2002) for everyone, its default subSilver theme (credited to Tom Beddard) is probably the single most-seen piece of web design of the early 2000s.

The social structure was visible on every post: avatar (80×80-ish and a few kilobytes, by the defaults of the day), rank title and star pips earned by post count, join date, location line, then the post, then the signature, a banner, a quote, a pixel doll, under its horizontal rule. Quotes nested into `[quote]` pyramids that recorded conversations like sediment. Moderation was human and legible: sticky threads, locked threads, "Who's online," and a Sysop whose word was law.

The post, as a museum plate, is the anatomy `rs-quote` reproduces:

```text
+------------------+--------------------------------------------------+
| GifTheCat        | Posted: Thu Apr 04, 2002 9:12 pm     [quote][!]  |
| [ 80x80 avatar ] |--------------------------------------------------|
| Old-Timer        | [quote="Webmaster"] the marquee stays. [/quote]  |
| * * * *          | Agreed -- but only at 60 px/s, we are not        |
| Posts: 1337      | animals.                                         |
| Joined: Jun 2000 | ________________                                 |
| Location: /home  | ~ visit my homepage! ~   [88x31] [88x31]         |
+------------------+--------------------------------------------------+
```

Behind it all sat older custom. RFC 1855, the Netiquette Guidelines (Sally Hambridge, Intel, October 1995, an actual IETF document), codified Usenet manners: lurk before posting, don't SHOUT, keep signatures to about four lines, remember there's a human on the other end. And "Eternal September" named the fall from grace: Usenet had absorbed its newbie wave each academic September until AOL connected its subscribers in 1993 and September stopped ending (the phrase crystallized in an early-1994 Usenet quip). Every community since has been arguing about the same thing.

**Design DNA →**
- The Boards take the classic anatomy: forums named "Retrostrap Talk," "The Off-Topic Lounge," and "Der Stammtisch," rank titles Lurker/Newbie/Member/Regular/Old-Timer, and staff roles named Sysop and Webmaster.
- The netiquette charter is RFC 1855, adapted and credited; no like buttons, approval is typed, like nature intended.
- Components: `rs-quote` with `__sig` for the pyramid-and-signature look, `rs-avatar`, `rs-table` for forum indexes, `rs-pagination`, `rs-breadcrumbs` ("You are here:"), `rs-badge--new` on unread threads.
- The dashboard demo's header gradient is pure subSilver homage, redrawn.

## 6. Sound and motion culture

The era's motion has two founding myths, both true-ish. `<blink>` was born at Netscape, Lou Montulli tells the story of joking in a Mountain View bar (summer 1994) that blinking text was the fanciest effect his text browser Lynx could ever support, and finding it implemented by an unnamed colleague soon after; he insists he wrote none of the code. Which Navigator release first shipped it is surprisingly fuzzy, accounts differ between the 1.x line and 2.0, so we won't pretend to know. Microsoft answered in Internet Explorer 2.0 (1995) with `<marquee>`, scrolling text with knobs (`scrollamount`, `scrolldelay`) whose defaults worked out to roughly 70 pixels per second. The two never crossed: IE didn't blink, Netscape didn't scroll, and both tags became bywords for excess. Blink died formally when Firefox 23 removed it (2013, the last major holdout); marquee lives on in browsers as an officially obsolete zombie the HTML spec still describes so nobody breaks the old web.

The support matrix, for the record, the browser wars in one table:

| Trick | Netscape | Internet Explorer | Today |
| --- | --- | --- | --- |
| `<blink>` | yes, early, though 1.x-vs-2.0 accounts differ | never | gone; Firefox 23 (2013) was the last holdout |
| `<marquee>` | never | yes, from 2.0 (1995) | still renders; spec-listed obsolete |
| `<bgsound>` | never | yes | dead |
| autoplaying `<embed>` audio | Navigator 3+ (LiveAudio) | yes (plugins) | blocked by autoplay policies |
| `window.status` scrollers | yes | yes | ignored by browsers (phishing) |

Sound was worse, because it was uninvited: `<bgsound>` and autoplaying `<embed>` MIDI meant the page performed *at* you, differently on every sound card, often with no visible off switch. Popups bred; status bars lied; the lesson the web eventually learned, motion and sound require consent, took two decades and is now built into browsers (autoplay blocking, `prefers-reduced-motion`) and accessibility guidance (WCAG's pause-stop-hide rule).

Retrostrap's position: the *aesthetic* of blink and marquee is genuinely great, rhythmic, honest, mechanical. The *behavior* was rude. So we keep the beat and add manners.

**Design DNA →**
- Motion Law: only `linear` and `steps()` easing; `rs-blink` at a tidy 1s `steps()` cycle; `rs-marquee` quantized to 30/60/120 px/s (a respectful rounding of IE's defaults); everything honors `prefers-reduced-motion`. Canon in doc 02.
- `rs-marquee` pauses on hover and focus and exposes controls, pause-stop-hide as chrome, not chore.

## 7. A field guide to era color and type

Real sites clustered into visual dialects. Each retrostrap theme is a documented dialect, not an invention.

### The dialects

- **Default-gray academic**: the unstyled look worn proudly: gray page, black Times, blue/purple links, `<hr>` dividers, "Last modified" footers. University physics departments still speak it.
- **Hacker green-on-black**: terminal cosplay on the web: black page, `#00FF00`/`#33FF33` text, Courier New, ASCII art headers; the dialect of textfiles, zines, and everyone who missed their VT220.
- **Kawaii pastel shrine**: fan shrines and glitter pages: `#FFCCFF`/`#FFCCCC`/`#CCFFFF` pastels, Comic Sans MS, sparkles, dolls, marquee'd dedications; strongest in anime fandom and the German Gästebuch scene.
- **Corporate navy-and-silver**: the trustworthy look: navy `#000080`/`#003366` headers, silver `#C0C0C0` panels, small Verdana or Arial, beveled buttons. Banks, intranets, and Windows itself (teal desktop `#008080`, navy titlebars, Tahoma labels).
- **GeoCities midnight**: black page, tiled starfield, neon lime/fuchsia/yellow text, rainbow rules; the default costume of the amateur cool page.
- **Y2K chrome**: the 1999-2002 tech look: dark navy fields, banded silver chrome, Impact headlines, LED greens; Winamp skins and gadget packaging were its fashion press.

### The mapping

| Dialect | Page | Text | Accent | Type | retrostrap theme |
| --- | --- | --- | --- | --- | --- |
| Academic gray | `#C0C0C0` | `#000000` | blue links, purple visited | Times | `classic` |
| Terminal | `#000000` | `#00FF00` | `#33FF33` glow | Courier New | `phosphor` |
| Kawaii shrine | `#FFCCFF` | `#660066` | pastel rotation | Comic Sans MS | `kawaii` |
| System chrome | `#C0C0C0` | `#000000` | teal `#008080`, navy `#000080` | Tahoma | `bevel` |
| GeoCities night | `#000000` | `#FFFF00`/`#00FF00` | fuchsia `#FF00FF`, starfield | Verdana/Arial | `midnight` |
| Y2K chrome | dark navy | silver bands | LED green | Impact | `y2k` |

Every cell above sits on the 216 cube or the 16 named colors, the dialects were *already* web-safe, which is exactly why the Palette Law costs so little. Type follows genre just as tightly: Times means document, Verdana-small means professional, Tahoma means software, Comic Sans means friendly, Courier means machine, Impact means attitude, Georgia means editorial (the early blogs loved it), Trebuchet means "webby", it haunted a thousand 2000-era navbars.

Field trips, one per dialect, for anyone auditing our color sheets:

- `classic`: surviving university department pages; wiby.me surfaces fresh specimens daily.
- `phosphor`: textfiles.com and the zine mirrors it keeps.
- `kawaii`: GifCities searches for "sparkle" and "doll"; the Neocities shrine scene carries the torch.
- `bevel`: period Windows 95/2000 screenshots (the GUI galleries and the Wayback Machine are full of them).
- `midnight`: the One Terabyte of Kilobyte Age screenshot stream, roughly every third frame.
- `y2k`: the Winamp Skin Museum and CARI's y2k collections.

**Design DNA →**
- Ten themes = documented dialects; the six core ones map one-to-one to this table, and their token sheets cite it.
- Theme voices pair palette with the Font Law stack the genre actually used (`bevel`→Tahoma, `phosphor`→Courier New, `kawaii`→Comic Sans MS, `y2k`→Impact, `classic`→Times, `midnight`→Verdana/Arial).
- starfield and crt widgets are theme accessories (`midnight`, `phosphor`); sparkle belongs to `kawaii`.

## 8. What we deliberately do not revive

We revive the joy, not the pain. The pain, itemized:

| Not revived | Why it hurt | What we do instead |
| --- | --- | --- |
| Autoplaying audio | ambushed ears, shared offices, sleeping babies | jukebox is click-to-play, always (Decency Law) |
| Popups and popunders | the X10-ad plague; the pattern's own inventor apologized | `rs-dialog` opens only on user action |
| Tracking counters and web bugs | "free" widgets that phoned home (see Comet Cursor) | hit-counter and everything else make zero external calls (Decency Law) |
| Unreadable tiny text | 7px Verdana as a personality | Font Law's floor is 10px, body 13/16, plus comfy mode (`rs-comfy`) that steps the whole scale up |
| Dial-up slowness | 45 seconds to see a title | performance budgets; `rs-loading` reflects real waits, never theatrical ones |
| `<blink>` abuse | seizure-adjacent, attention-hostile | `rs-blink` is opt-in, 1s `steps()`, off under reduced motion |
| Hotlinking | bandwidth theft, broken-image graveyards | all assets ship in the package, addressed locally |
| MIDI on page load | see autoplay, but wearing a tuxedo of kazoo | never; not even the demos |
| Browser-sniffing lockouts | "This site requires Netscape 4" | progressive enhancement; badges are jokes, support is universal |
| Right-click blockers | insulted visitors, protected nothing | view source is a founding virtue here |
| Frameset amnesia | unbookmarkable, unindexable pages | `rs-frames` keeps real URLs and a working back button |

**Design DNA →** the Decency Law and Motion Law (doc 02) are this table compressed into rules; comfy mode lives in doc 02 with its accessibility rationale in doc 08.

## 9. The revival scene and prior art

We are not first to this museum, and we're glad of the company. Positioning below is honest: what each does brilliantly, and what retrostrap does differently.

### Research tools we lean on

- **Wayback Machine** (archive.org; public since 2001), the primary source. Screenshot nothing from memory; look it up.
- **GifCities** (Internet Archive, 2016), full-text search over the GeoCities GIF corpus; our reference for what decoration genres *actually* looked like. We study it and then draw our own (asset rule: no ripped art, ever).
- **Cameron's World** (Cameron Askin, mid-2010s), a scrolling collage love letter built from GeoCities fragments; the best single page for showing someone what this project is about.
- **One Terabyte of Kilobyte Age** (Olia Lialina & Dragan Espenschied), screenshots from the rescued GeoCities archive, plus Lialina's *A Vernacular Web* essays, the closest thing this field has to scholarship. Our "vernacular" framing follows her lead.
- **textfiles.com** (Jason Scott) and the Archive Team wiki, context for BBS-into-web culture and the GeoCities rescue itself.

### Retro UI projects (siblings, not rivals)

| Project | What it nails | How retrostrap differs |
| --- | --- | --- |
| 98.css (jdan, 2020) | pixel-faithful Windows 98 control chrome in pure CSS | one OS skin vs our whole-web scope; no layout system, themes, or JS widgets, by design |
| XP.css (botoxparty) | extends 98.css toward Luna | XP's look is mostly past our era edge; our `bevel` stays in the 95/2000 chrome zone |
| system.css (sakofchit, 2022) | classic Mac System chrome | same trade: one beloved OS vs an era's web culture |
| NES.css (the nostalgic-css crew, 2018) | 8-bit console UI kit | different domain (games, not web vernacular) |
| Winamp Skin Museum / Webamp (Jordan Eldredge) | preservation and playability of skin culture | a museum piece we cite as `y2k`/`midnight` reference, not a framework |

What retrostrap adds that none of these attempt in one package: era-accurate styling across six documented dialects, a responsive layout engine underneath (modern grid wearing 1998's clothes), the Toybox of separately loadable widgets, accessibility as law rather than afterthought, zero dependencies, and machine-readable docs. If you want a pitch-perfect Windows 98 dialog and nothing else, use 98.css and tell them we said hi.

### Movements

Neocities (Kyle Drake, 2013) rebuilt the free-homestead commons and hosts the modern webring revival (rings like the XXIIVV webring hold hands there today); the IndieWeb movement (indieweb.org, organizing since 2011) rebuilt the philosophy, own your site, link to your friends. Web-brutalism (the brutalistwebsites.com kind) shares our anti-sameness itch but chases rawness where we chase period accuracy. And two browsing museums deserve a bookmark: wiby.me, a search engine that indexes only classic-style pages, and theoldnet.com, which serves Wayback snapshots to vintage browsers so a real Netscape 4 can surf again. Retrostrap is the framework layer of this scene: build a *new* site that belongs on those shelves, and host it happily on Neocities.

**Design DNA →**
- Asset rule: archives are for study; every shipped sprite is original (docs 02 and the asset pipeline enforce this).
- webring + `rs-webring-bar` target the Neocities-era ring revival as first-class users.
- The docs site links every project above; we cite our elders in public.

## 10. Sources and further reading

Everything below is real and was reachable as of mid-2026 (or is a book/paper cited by title). Where a primary source is offline, the Wayback Machine has it.

### Standards and primary documents

- RFC 1855, *Netiquette Guidelines*, <https://www.rfc-editor.org/rfc/rfc1855>
- HTML 3.2 Reference Specification, <https://www.w3.org/TR/REC-html32>
- HTML 4.01 Specification, <https://www.w3.org/TR/html401/>
- CSS Level 1, <https://www.w3.org/TR/REC-CSS1/>
- WHATWG HTML, obsolete features (marquee's afterlife), <https://html.spec.whatwg.org/multipage/obsolete.html>
- MDN on `<marquee>`: <https://developer.mozilla.org/en-US/docs/Web/HTML/Element/marquee>
- MDN glossary on the blink element, <https://developer.mozilla.org/en-US/docs/Glossary/blink_element>

### Encyclopedic

- Wikipedia: *GeoCities*, *Web colors*, *Core fonts for the Web*, *Blink element*, *Marquee element*, *Netscape Navigator*, *Browser wars*, *Webring*, *Eternal September*, *Netiquette*, *GIF*, *Spacer GIF*, *Web counter*, *Web banner*, *LinkExchange*, *Guestbook*, *phpBB*, *vBulletin*, *Neko (software)*, *Hampster Dance*, *Konami Code*, *Emoticon*, *Comic Sans*, *Trebuchet MS*, *Neocities*, *Wayback Machine*, all at <https://en.wikipedia.org/>
- German Wikipedia and the German trade press on Beepworld; a good retrospective: "Zeitreise: Beepworld - Schrott aus dem Baukasten," Netzpiloten, <https://www.netzpiloten.de/zeitreise-beepworld-baukasten/>

### Histories and essays

- Olia Lialina, *A Vernacular Web*, <http://art.teleportacia.org/observation/vernacular/>
- One Terabyte of Kilobyte Age (Lialina & Espenschied), <https://oneterabyteofkilobyteage.tumblr.com/>
- David Siegel, *Creating Killer Web Sites* (Hayden Books, 1996); and his 1997 essay "The Web Is Ruined and I Ruined It" (archived)
- Lynda Weinman, *Designing Web Graphics* (New Riders, 1996)
- David Lehn & Hadley Stern, "Death of the Websafe Color Palette?", Webmonkey, 2000 (archived)
- Jakob Nielsen, "Flash: 99% Bad", Alertbox, October 2000, at <https://www.nngroup.com/> (search the title)
- Lou Montulli, "The Origin of the `<blink>` Tag" (widely mirrored; summarized well in the two links below)
- Dan Q, "<blink> and <marquee>", <https://danq.me/2020/11/11/blink-and-marquee/>
- The History of the Web, "The HTML Tags Everybody Hated", <https://thehistoryoftheweb.com/blink-marquis-tag/>
- Tedium, "Webring History: Social Media Before Social Media", <https://tedium.co/2020/11/20/webring-history/>
- Salon, "The strange saga of Yahoo and WebRing" (2001), <https://www.salon.com/2001/12/05/webring/>
- Eliot Akira, "Neko: History of a Software Pet", <https://eliotakira.com/neko/>
- Ultra Science Labs, "Why we are still using 88x31 buttons", <https://ultrasciencelabs.com/lab-notes/why-we-are-still-using-88x31-buttons>

### Living museums and tools

- Wayback Machine, <https://web.archive.org/>
- GifCities, <https://gifcities.org/>
- Cameron's World, <https://www.cameronsworld.net/>
- textfiles.com, <http://textfiles.com/>
- Archive Team wiki, <https://wiki.archiveteam.org/>
- wiby.me, <https://wiby.me/>
- theoldnet.com, <http://theoldnet.com/>
- Winamp Skin Museum, <https://skins.webamp.org/>
- Ruffle (Flash emulator), <https://ruffle.rs/>
- Flashpoint Archive, <https://flashpointarchive.org/>
- Consumer Aesthetics Research Institute (y2k et al.), <https://cari.institute/>
- "Viewable With Any Browser" campaign, <https://www.anybrowser.org/campaign/>
- Dynamic Drive, <http://www.dynamicdrive.com/>

### Sibling projects

- 98.css, <https://jdan.github.io/98.css/>
- XP.css, <https://botoxparty.github.io/XP.css/>
- system.css, <https://sakofchit.github.io/system.css/>
- NES.css, <https://nostalgic-css.github.io/NES.css/>
- Neocities, <https://neocities.org/>
- IndieWeb, <https://indieweb.org/>

*Curated by the maintainers. Corrections welcome on the Boards, bring receipts, ideally with a Wayback link. This page is permanently under construction, as is proper.*
