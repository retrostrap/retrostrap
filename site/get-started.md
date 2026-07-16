---
layout: base.njk
title: Get started
mainClass: site-prose
description: "Install retrostrap from the CDN or npm, lay out your first page, pick a theme, and verify it with Retrostrap.audit()."
---

# Get started

Getting a retrostrap page on the air takes two tags and one opinion (the theme).
Everything on this page is copy-paste ready, that is a design goal, not an accident.

## The two-tag install (CDN)

Put these in your `<head>` and you are a webmaster:

```html
<link rel="stylesheet" href="{{ manifest.cdn.css }}">
<script defer src="{{ manifest.cdn.js }}"></script>
```

The CSS is the framework; the script is optional enhancement (dialogs, the theme
API, the auditor), every component works without it. Two optional extras:

```html
<!-- a theme (classic is built in; see "Pick a theme" below) -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/retrostrap@0.1.0/dist/themes/midnight.css">

<!-- tiled backgrounds: stars, checkers, hearts, dither bands … -->
<link rel="stylesheet" href="{{ manifest.cdn.patterns }}">
```

The examples pin an exact version on purpose: machines and webmasters both
deserve URLs that don't move under them. A range like `@0` rides along with new
releases, handy on a sandbox page, shaky under a homepage you love.

## Or install from npm

```text
npm install retrostrap
```

```js
import "retrostrap/retrostrap.min.css";
import { Retrostrap } from "retrostrap";
```

Same files, same behavior, zero dependencies either way.

## Using a SPA framework (React, Vue, Svelte, Astro)

The whole integration contract is two calls: `Retrostrap.init(container)` after your
framework mounts new DOM, `Retrostrap.destroy(container)` before it unmounts. Enhancers
never move your nodes and dialogs use the native top layer (no portals), so the virtual
DOM never gets surprised. For React, that contract fits in one hook, copy it as is:

```jsx
import { useEffect, useRef } from "react";
import "retrostrap/retrostrap.min.css";
import { Retrostrap } from "retrostrap";

function useRetrostrap() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    Retrostrap.init(el);
    return () => Retrostrap.destroy(el);
  }, []);
  return ref;
}

function Shoutbox() {
  const ref = useRetrostrap();
  return (
    <div ref={ref} className="rs-panel">
      <h2 className="rs-panel__title">Shoutbox</h2>
      <div data-rs-widgets="guestbook"></div>
    </div>
  );
}
```

`init` is idempotent and `destroy` is real teardown, so React 18's StrictMode
double-mount is harmless. In Next.js, widgets are client work: put the hook in a
`"use client"` component. The other frameworks are the same two calls in their
own coats:

```js
// Vue
onMounted(() => Retrostrap.init(root.value));
onBeforeUnmount(() => Retrostrap.destroy(root.value));

// Svelte
onMount(() => {
  Retrostrap.init(node);
  return () => Retrostrap.destroy(node);
});
```

Astro needs even less: retrostrap markup is plain HTML, so most pages ship with zero
islands; put widgets inside a `client:load` island or just keep the deferred script tag.

One caveat about widgets and re-renders. Overlay widgets (the cat, the sparkles, the
starfield) live on `document.body`, outside your component tree, and `destroy()` cleans
them up; self-rendering widgets (guestbook, jukebox, clock) own the host div you give
them, so declare it with no children and they never collide with the virtual DOM. The
only shared ground is text that both sides want to own: smilies rewrites your text nodes,
so if that text changes from state, fire `Retrostrap.emit(el, "rs:content")` in the same
effect and smilies re-walks the subtree (the guestbook uses the same handshake). And a
marquee clones its track for the seamless loop, so keep marquee text static, or destroy
and re-init that node when it truly must change.

That is the entire story, there is no wrapper package to install. If you would rather
have one anyway, say so [on the Boards](https://boards.retrostrap.dev); we would only
build thin wrappers if there is real demand for them.

## The page skeleton

The era's anatomy: the `<body>` wears the wallpaper, and your content sits on an
opaque sheet, the "centered table on a starfield" look. `rs-page` is the sheet,
`rs-container` is the width governor (760px, the honest width of an 800×600 CRT),
and a layout recipe gives the page its shape. Here is a complete homepage:

```html
<!doctype html>
<html lang="en" data-rs-theme="midnight">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>My corner of the web</title>
  <link rel="stylesheet" href="{{ manifest.cdn.css }}">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/retrostrap@0.1.0/dist/themes/midnight.css">
  <script defer src="{{ manifest.cdn.js }}"></script>
</head>
<body>
  <a class="rs-skip" href="#main">Skip intro →</a>
  <div class="rs-page rs-container">
    <div class="rs-layout rs-layout--sidebar-left">

      <header class="rs-layout__header">
        <h1>~ Welcome to my homepage ~</h1>
        <nav class="rs-navbar" aria-label="Site">
          <a href="#" aria-current="page">Home</a>
          <a href="#">About me</a>
          <a href="#">Links</a>
          <a href="#">Guestbook</a>
        </nav>
      </header>

      <main class="rs-layout__main" id="main">
        <h2>What's new</h2>
        <p>Added three new wallpapers to the downloads section!
           <sup><span class="rs-badge rs-badge--new">NEW!</span></sup></p>
      </main>

      <nav class="rs-layout__nav rs-sidenav" aria-label="Sections">
        <h3 class="rs-sidenav__section">Main</h3>
        <ul>
          <li><a href="#">news archive</a></li>
          <li><a href="#">my scope</a></li>
          <li><a href="#">cool links</a></li>
        </ul>
      </nav>

      <footer class="rs-layout__footer rs-footer">
        <p class="rs-footer__updated">Last updated: today, obviously.</p>
      </footer>

    </div>
  </div>
</body>
</html>
```

Notes worth their pixels:

- The nav comes **after** the main content in the source, screen readers and
  keyboards meet your content first, and the grid moves the column to the left
  visually from 800px up. Below that, everything stacks. No hamburgers; era pages
  just stack.
- Recipes on offer: `rs-layout--sidebar-left`, `--sidebar-right`, `--holy-grail`,
  `--three-col`, and `rs-frames` for full frameset cosplay (with a working back
  button, which is more than framesets ever managed).
- Want the deluxe 1000px lot? `rs-container--wide`. The whole viewport?
  `rs-container--fluid`.

## Pick a theme

One attribute on `<html>` picks the outfit; one stylesheet supplies it. Do not mix
theme files, one theme per page, like nature intended.

| Theme | The look | Extra stylesheet |
| --- | --- | --- |
| `classic` | 1996 browser default: silver page, Times, blue links | none, built into the core |
| `midnight` | GeoCities after dark: starfield, neon text | `themes/midnight.css` |
| `bevel` | the system desktop: teal, silver chrome, Tahoma | `themes/bevel.css` |
| `phosphor` | green terminal on black, Courier everywhere | `themes/phosphor.css` |

```html
<html data-rs-theme="midnight">
```

Switching at runtime, for a theme picker like the one in our header, goes through
the JavaScript API, which also remembers the choice in `localStorage`:

```js
Retrostrap.theme.set("midnight");
```

If you switch themes at runtime, make sure the theme's stylesheet is on the page
(load it up front, or swap a `<link>`'s `href` the way this site does, view
source, it's all there). Full tour with live swatches on the
[themes page](/themes/).

## Comfy mode

The era's text was authentically tiny. `rs-comfy` on `<html>` steps body text one
size up the scale and relaxes the line-height, mercy, on demand, without breaking
the look:

```html
<html data-rs-theme="midnight" class="rs-comfy">
```

There's a toggle in this site's header if you want to feel the difference.

## Verify with Retrostrap.audit()

The five laws are machine-checkable. Open your console on any page you've built
and run:

```js
Retrostrap.audit();
```

It walks your styled elements and reports off-palette colors, rounded corners,
blurred shadows, illegal easing, un-sanctioned fonts, and links that lost their
underlines, as a console table plus a JSON report, with hints written to be
actionable ("off palette; nearest legal is #FF9966"). Clean output looks like
this:

```text
[retrostrap] audit clean, 212 elements, all lawful. The year holds at 1999.
```

The same laws ship as data in [guardrails.json](/guardrails.json) if you'd rather
enforce them in your own tooling.

## Where to next

- [Components](/components/), all {{ manifest.components.length }} of them, with live specimens and copy-paste source.
- [Themes](/themes/), all ten of them, side by side.
- [The Museum](/museum/), why the old web looked like this. Bring a beverage.
- [For robots](/for-robots/), llms.txt, the manifest, the `retrostrap-mcp` server, and a system prompt for your favorite assistant.
