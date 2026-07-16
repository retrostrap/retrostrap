// catalog.mjs - validates the source of truth. The schema file documents the
// shape for humans and tools; this script enforces it without a dependency,
// because a JSON checker is a Saturday morning, not a package.
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const KINDS = { components: 'component', widgets: 'widget', themes: 'theme' };
const STABILITY = new Set(['stable', 'experimental']);

const problems = [];
const ids = new Set();
let count = 0;

const isStr = (v) => typeof v === 'string' && v.trim().length > 0;

for (const [dir, kind] of Object.entries(KINDS)) {
  let files = [];
  try {
    files = (await readdir(join(ROOT, 'catalog', dir))).filter((f) => f.endsWith('.json'));
  } catch {
    if (dir === 'components') { console.error(`catalog: ${dir}/ is missing or unreadable`); process.exit(1); }
    continue; // widgets/ and themes/ can legitimately arrive in later phases
  }

  for (const file of files) {
    count++;
    const path = `catalog/${dir}/${file}`;
    const bad = (msg) => problems.push(`${path}: ${msg}`);

    let item;
    try {
      item = JSON.parse(await readFile(join(ROOT, path), 'utf8'));
    } catch (e) {
      bad(`not valid JSON (${e.message})`);
      continue;
    }

    if (item.id !== file.replace(/\.json$/, '')) bad(`id "${item.id}" does not match the file name`);
    if (!/^[a-z][a-z0-9-]*$/.test(item.id ?? '')) bad('id must be lowercase kebab-case');
    if (ids.has(item.id)) bad(`duplicate id "${item.id}"`);
    ids.add(item.id);

    if (item.kind !== kind) bad(`kind "${item.kind}" does not match its folder (${kind})`);
    for (const field of ['label', 'summary', 'era', 'a11y']) {
      if (!isStr(item[field])) bad(`"${field}" must be a non-empty string`);
    }
    if (!/^\d+\.\d+\.\d+$/.test(item.since ?? '')) bad('"since" must be x.y.z');
    if (!STABILITY.has(item.stability)) bad('"stability" must be stable or experimental');
    if (typeof item.requiresJs !== 'boolean') bad('"requiresJs" must be a boolean');

    if (!Array.isArray(item.classes)) bad('"classes" must be an array');
    else {
      if (kind === 'component' && item.classes.length === 0) bad('a component needs at least one class');
      for (const c of item.classes) {
        if (!isStr(c?.name) || !isStr(c?.role)) bad('every class needs a name and a role');
        else if (!/^rsx?-[a-z0-9_-]+$/.test(c.name)) bad(`class "${c.name}" must be rs-/rsx- prefixed`);
      }
    }
    for (const field of ['assets', 'tags']) {
      if (!Array.isArray(item[field]) || item[field].some((v) => !isStr(v))) {
        bad(`"${field}" must be an array of strings`);
      }
    }

    // The snippet is half the entry: it must exist and actually use the block.
    let snippet = null;
    try {
      snippet = await readFile(join(ROOT, 'catalog', 'snippets', `${item.id}.html`), 'utf8');
    } catch {
      bad('missing snippet (catalog/snippets/' + item.id + '.html)');
    }
    // a component's snippet must actually use the block; a widget's classes are
    // applied by JS at runtime, so its snippet shows data-rs-widgets instead
    if (kind === 'component' && snippet !== null && item.classes?.[0]?.name && !snippet.includes(item.classes[0].name)) {
      bad(`snippet never uses "${item.classes[0].name}"`);
    }
    if (kind === 'widget' && snippet !== null && !snippet.includes(`data-rs-widgets`) && !snippet.includes(item.id)) {
      bad('widget snippet should show data-rs-widgets usage');
    }
  }
}

if (problems.length) {
  console.error(`catalog: ${problems.length} problem(s) in ${count} entr${count === 1 ? 'y' : 'ies'}:`);
  for (const p of problems) console.error('  - ' + p);
  process.exit(1);
}
console.log(`catalog: ${count} entr${count === 1 ? 'y' : 'ies'}, all sound.`);
