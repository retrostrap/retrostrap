// manifest.mjs - turns the catalog into the machine surfaces (docs/09):
// dist/manifest.json (the whole catalog, structured), dist/llms.txt (the AI
// entry point), and dist/cheatsheet.md (the one file to drop in a context
// window). All generated, never hand-maintained, so they can't go stale.
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const pkg = JSON.parse(await readFile(join(ROOT, 'package.json'), 'utf8'));
const guardrails = JSON.parse(await readFile(join(ROOT, 'dist', 'guardrails.json'), 'utf8'));
const CDN = `https://cdn.jsdelivr.net/npm/retrostrap@${pkg.version}`;

async function loadKind(kind, { required = false } = {}) {
  const dir = join(ROOT, 'catalog', kind);
  let files = [];
  try { files = (await readdir(dir)).filter((f) => f.endsWith('.json')); }
  catch { if (required) { console.error(`manifest: ${kind}/ is missing or unreadable`); process.exit(1); } return []; }
  const items = [];
  for (const f of files) {
    const item = JSON.parse(await readFile(join(dir, f), 'utf8'));
    // guard the id before it becomes a path, build runs before the catalog step
    if (/^[a-z][a-z0-9-]*$/.test(item.id || '')) {
      try {
        item.snippet = (await readFile(join(ROOT, 'catalog', 'snippets', `${item.id}.html`), 'utf8')).trim();
      } catch { item.snippet = null; }
    } else { item.snippet = null; }
    items.push(item);
  }
  return items.sort((a, b) => a.id.localeCompare(b.id));
}

const components = await loadKind('components', { required: true });
const widgets = await loadKind('widgets');
const themes = await loadKind('themes');

// The canonical system prompt (docs/09). One source, catalog/prompt.txt; the
// version is stamped in here so every copy, manifest, dist/prompt.txt, the
// For-robots page, reads the same string and can't drift.
const prompt = (await readFile(join(ROOT, 'catalog', 'prompt.txt'), 'utf8'))
  .replace(/\{\{version\}\}/g, pkg.version).trimEnd();

// ---- manifest.json ----------------------------------------------------------
const manifest = {
  schemaVersion: 1,
  version: pkg.version,
  cdn: {
    css: `${CDN}/dist/retrostrap.min.css`,
    js: `${CDN}/dist/retrostrap.min.js`,
    patterns: `${CDN}/dist/retrostrap-patterns.css`,
    theme: `${CDN}/dist/themes/{name}.css`,
  },
  laws: guardrails,
  prompt,
  components,
  widgets,
  themes,
};
await mkdir(join(ROOT, 'dist'), { recursive: true });
await writeFile(join(ROOT, 'dist', 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
await writeFile(join(ROOT, 'dist', 'prompt.txt'), prompt + '\n');

// ---- llms.txt ---------------------------------------------------------------
const llms = `# retrostrap
> A CSS+JS framework for building responsive, accessible websites that look like
> the web of 1996-2003. Closed palette (216 web-safe plus the 16 classic named colors),
> nine era font stacks, bevel components, and optional decoration widgets.

## Install
${CDN}/dist/retrostrap.min.css  (stylesheet)
${CDN}/dist/retrostrap.min.js   (enhancers; defer)
Pick one theme: ${CDN}/dist/themes/{name}.css  and set <html data-rs-theme="name">.

## Reference
- Cheatsheet: /cheatsheet.md, every class and widget, one page
- manifest.json, the full catalog, structured (its \`prompt\` field is the system prompt)
- guardrails.json, the five laws as data; validate against this
- prompt.txt, a canonical system prompt to paste into an assistant

## The five laws
1. Palette: only the ${guardrails.palette.colors.length} legal colors, opaque.
2. Fonts: nine era stacks; sizes ${guardrails.fonts.sizesPx.join('/')}.
3. Shape: border-radius 0; shadow blur 0.
4. Motion: linear/steps easing only; honor prefers-reduced-motion.
5. Decency: no autoplay, no tracking, no external calls, works without JS.

## Components (${components.length})
${components.map((c) => `- ${c.classes[0].name}: ${c.summary}`).join('\n')}
`;
await writeFile(join(ROOT, 'dist', 'llms.txt'), llms);

// ---- cheatsheet.md ----------------------------------------------------------
const cheat = `# retrostrap cheatsheet

Build like it's 2026, look like it's 1999. Drop this whole file into context; it is
everything you need to produce a correct, era-faithful page.

## Install (pin the version in real projects)
\`\`\`html
<link rel="stylesheet" href="${CDN}/dist/retrostrap.min.css">
<link rel="stylesheet" href="${CDN}/dist/themes/midnight.css">
<script defer src="${CDN}/dist/retrostrap.min.js"></script>
<html data-rs-theme="midnight">
\`\`\`

## The five laws (violating one breaks the era)
1. Colors: only the ${guardrails.palette.colors.length} legal colors (216 web-safe plus the 16 classic named colors, 8 of them off the cube: silver/gray/navy/teal/maroon/purple/green/olive). Opaque.
2. Fonts: only the nine \`--rs-font-*\` stacks; sizes ${guardrails.fonts.sizesPx.join('/')}px (\`rs-font-1..7\`).
3. border-radius 0, shadow blur 0. Rounding via border-image only.
4. Easing linear/steps only; everything respects prefers-reduced-motion.
5. No autoplay audio, no tracking, no external calls. CSS works without JS.

## Structure
\`<body>\` wears the theme tile; wrap content in \`<div class="rs-page rs-container">\`.
Pick one layout recipe: \`rs-layout--sidebar-left\`, \`--sidebar-right\`, \`--holy-grail\`, \`--three-col\`, or \`rs-frames\`.

## Components
${components.map((c) => `- \`${c.classes.map((x) => x.name).join('` `')}\`, ${c.summary}`).join('\n')}

${widgets.length ? `## Widgets (data-rs-widgets on any element)\n${widgets.map((w) => `- \`${w.id}\`, ${w.summary}`).join('\n')}\n` : ''}
## Themes
${themes.length ? themes.map((t) => `- ${t.id}: ${t.summary}`).join('\n') : '- classic (default), midnight, bevel, phosphor, kawaii, y2k'}

## Verify
Run \`Retrostrap.audit()\` in the console; fix every violation it lists.
`;
await writeFile(join(ROOT, 'dist', 'cheatsheet.md'), cheat);

console.log(`manifest: ${components.length} components, ${widgets.length} widgets, ${themes.length} themes → manifest.json, llms.txt, cheatsheet.md, prompt.txt`);
