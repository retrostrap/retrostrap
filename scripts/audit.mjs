// audit.mjs - runs Retrostrap.audit() over the kitchen sink, every demo, and every
// catalog snippet in a headless browser and fails if any page trips a law. This is
// the runnable form of the promise: the framework's own pages, and the copy-paste
// snippets it hands out, pass its own auditor. Also the shape of the
// `npx retrostrap-audit <url>` tool we'll ship later.
import { chromium } from '@playwright/test';
import { readdir, access, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from './serve.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PORT = 8077;
const SNIP_OUT = join(ROOT, 'dist', '_snippets'); // served, and dist/ is gitignored

async function pages() {
  const list = ['/tests/e2e/pages/kitchen-sink.html'];
  const demos = join(ROOT, 'demos');
  for (const entry of await readdir(demos, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    try { await access(join(demos, entry.name, 'index.html')); list.push(`/demos/${entry.name}/index.html`); } catch { /* skip */ }
  }
  return list;
}

// Each catalog snippet is a fragment; wrap it in a minimal, same-origin page (so a
// legal same-origin sprite url() doesn't read as an external request) with the core
// loaded, and audit the painted markup. Written under dist/ so assets resolve
// same-origin and nothing lands in the tracked tree.
async function snippetPages() {
  const dir = join(ROOT, 'catalog', 'snippets');
  let names;
  try { names = (await readdir(dir)).filter((f) => f.endsWith('.html')); } catch { return []; }
  await mkdir(SNIP_OUT, { recursive: true });
  const list = [];
  for (const name of names) {
    const frag = await readFile(join(dir, name), 'utf8');
    const html = '<!doctype html><html lang="en"><head><meta charset="utf-8">'
      + '<link rel="icon" href="data:,"><link rel="stylesheet" href="/dist/retrostrap.css"></head>'
      + `<body>${frag}<script src="/dist/retrostrap.js"></script></body></html>`;
    await writeFile(join(SNIP_OUT, name), html);
    list.push(`/dist/_snippets/${name}`);
  }
  return list;
}

const urls = [...await pages(), ...await snippetPages()];
const server = serve(PORT);
const browser = await chromium.launch();
let failed = 0;

try {
  for (const url of urls) {
    // snippets are fragments with placeholder <img> refs (avatars, award badges, 88x31
    // buttons) that 404 by design, so they are held to the LAW (report.ok, which catches
    // an off-palette or off-scale snippet) but not to the console. Full pages get both.
    const isSnippet = url.startsWith('/dist/_snippets/');
    const page = await browser.newPage();
    const consoleErrors = [];
    page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
    await page.goto(`http://localhost:${PORT}${url}`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.Retrostrap).catch(() => {});
    const report = (await page.evaluate(() => (window.Retrostrap ? Retrostrap.audit() : null)))
      ?? { ok: false, violations: [{ rule: 'no-js', selector: url, value: '', hint: 'retrostrap.js did not load' }] };
    if (report.ok && (isSnippet || !consoleErrors.length)) {
      console.log(`ok    ${url}  (${report.stats?.checked ?? '?'} elements)`);
    } else {
      failed++;
      console.error(`FAIL  ${url}`);
      for (const v of report.violations) console.error(`        ${v.rule}: ${v.selector}, ${v.hint}`);
      if (!isSnippet) for (const e of consoleErrors) console.error(`        console: ${e}`);
    }
    await page.close();
  }
} finally {
  // always run, even on a mid-audit throw, so the wrapped snippets never linger
  await browser.close();
  server.close();
  await rm(SNIP_OUT, { recursive: true, force: true });
}
if (failed) { console.error(`\naudit: ${failed} page(s) failed`); process.exit(1); }
console.log(`\naudit: ${urls.length} pages, all lawful.`);
