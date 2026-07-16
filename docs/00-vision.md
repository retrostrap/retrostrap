# retrostrap: vision

> **Build like it's 2026, look like it's 1999.**

retrostrap is a CSS + JavaScript framework that lets anyone build websites that look like
the web of 1996-2003, GeoCities homepages, phpBB forums, teal-desktop system UIs,
green-phosphor terminals, while behaving like the best of the modern web: responsive on
every screen, accessible, fast, and installable with two `<link>`/`<script>` tags.

It is two products in one box:

1. **The styling framework**: a Bootstrap-like set of components, layout recipes,
   utilities and themes that make anything you build look convincingly of-the-era.
2. **The Toybox**: a collection of optional widgets that bring back the *decorations*:
   cursor trails, falling snow, a pixel cat that chases your mouse, sparkling backgrounds,
   hit counters, webring bars, guestbooks, and a jukebox that never, ever autoplays.

Around it we grow a community: **[Retrostrap Boards](https://boards.retrostrap.dev)**, a forum that runs on retrostrap
itself and brings back the Netiquette-era tone of the early internet, including a
German-language board, **Der Stammtisch**.

## The core trick

Retro sites looked the way they did because of *constraints*: 256-color displays, a
handful of preinstalled fonts, 800×600 monitors, table layouts. Modern sites look modern
because those constraints are gone.

retrostrap's whole idea is to **reintroduce the constraints as design law** while keeping
the machinery underneath fully modern:

| Layer          | 1999 on the surface                        | 2026 underneath                                  |
| -------------- | ------------------------------------------ | ------------------------------------------------ |
| Color          | 216 web-safe colors + 16 named colors      | design tokens, contrast-checked pairs            |
| Type           | Times, Verdana, Comic Sans, Courier        | rem-based scale, zoom-safe, comfy mode           |
| Layout         | "table" panels, framesets, 760px pages     | CSS grid recipes that collapse on phones         |
| Motion         | blink, marquee, snow, cursor trails        | `prefers-reduced-motion`, FPS budgets, pausing   |
| Semantics      | looks like `<font>` soup                   | real landmarks, `<dialog>`, ARIA, keyboard maps  |
| Delivery       | "best viewed with any browser"             | zero dependencies, tens of KB, from a CDN        |

The constraints are what guarantee the outcome. If you stay inside the framework's
vocabulary, **you cannot accidentally build something that looks modern.** That is the
promise, and it is enforced by five laws (defined in [the design language](02-design-language.md)):

1. **Palette Law**: only the 216 web-safe colors plus the 16 classic named colors.
2. **Font Law**: nine sanctioned era font stacks, seven sanctioned sizes.
3. **Shape Law**: `border-radius: 0`. Rounding only via pixel-art border images, like 2002.
4. **Motion Law**: `linear` and `steps()` easing only; every effect honors reduced motion.
5. **Decency Law**: no autoplaying audio, no tracking, no surprise network calls, and
   everything styled works without JavaScript.

## Who it's for

- **Nostalgics and hobbyists**: the Neocities/indie-web crowd who want a personal
  homepage with a guestbook and a cat, without hand-crafting 1998 HTML.
- **Developers with taste and a sense of humor**: portfolio sites, event pages, internal
  tools, April Fools' redesigns, demos that people actually screenshot and share.
- **Product teams**: real applications (dashboards, admin panels, todo apps) that want a
  distinctive skin without giving up accessibility or responsiveness.
- **Machine builders**: retrostrap is designed from day one to be *AI-legible*: a
  machine-readable component manifest, `llms.txt`, a snippet library, and a prompt pack
  mean a coding assistant can produce a correct, era-faithful page on the first try.
  Constraints that keep humans on-era keep machines on-era too. See
  [AI integration](09-ai-integration.md).

## Principles

1. **Era-true by default.** The lazy path produces the authentic look. Deviating takes work.
2. **Modern under the hood.** Semantics, accessibility, performance and responsiveness are
   never traded away for a gag.
3. **The limits are the product.** A smaller palette, fewer fonts, and hard rules beat
   infinite flexibility. We say no a lot, cheerfully.
4. **Decoration must never obstruct.** Toybox widgets are budgeted, pausable, keyboard-safe
   and screen-reader-invisible. The cat never blocks a button.
5. **Progressive enhancement.** CSS components are complete without JS. Widgets are extras.
6. **Zero dependencies, zero build.** Two tags from a CDN and you're a webmaster.
7. **We revive the joy, not the pain.** No autoplay MIDI, no popup spam by default, no
   tracking counters. (The [research doc](01-history-research.md) keeps us honest about both.)
8. **Privacy is retro.** The early web didn't fingerprint you. Neither do we. Ever.
9. **Fun is a feature.** Party mode, easter eggs, a mascot. If it doesn't make someone
   smile, why are we shipping it?
10. **Community over clout.** Slow forum, no like buttons, greet the newbies. Netiquette lives.

## Non-goals

- **Not a parody generator.** The output is lovingly authentic, not ironic vomit. Sane
  defaults keep pages usable.
- **No Flash emulation, no Java applets, no real `<marquee>`/`<blink>` tags.** We rebuild
  the effects with modern CSS/JS.
- **No support for legacy browsers.** We *target* evergreen browsers; we *imitate* old ones.
- **Not a React/Vue component library.** Plain HTML + CSS + vanilla JS, though it drops into
  any framework in a few lines by calling `Retrostrap.init`/`destroy` in a component's
  lifecycle (see [the JavaScript API](06-javascript-api.md#spa--framework-integration-contract)).
  Dedicated adapter packages would only follow real demand.
- **No theme anarchy.** Themes implement a fixed token contract. A theme cannot make
  retrostrap look modern; that's the point.

## The mascot

![Gif the cat, our mascot](gif-the-cat.png)

- **Gif the cat**: our mascot: an original pixel cat, default skin of the `neko` widget.
  Half the community will pronounce it wrong, and we will never say which half.

## What success looks like

- A stranger builds a personal homepage with a guestbook and a cat in under an hour, on
  their phone, and it looks *right*.
- A coding assistant given only our cheatsheet produces a valid, on-era page zero-shot.
- 100+ sites in the community showcase; the Boards have regulars who greet newcomers.
- Nobody can tell at a glance which showcase sites were built in 1999 and which yesterday,
  except that ours work on phones.

## Where to start

To use retrostrap, the [README](../README.md) has the two-tag quickstart and its index to
the rest of the docs. Dropping it into React, Vue, Svelte or any framework is a few lines,
call `Retrostrap.init`/`destroy` in a component's lifecycle, spelled out in
[the JavaScript API](06-javascript-api.md#spa--framework-integration-contract).
