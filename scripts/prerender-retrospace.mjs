// prerender-retrospace.mjs - bake the directory listings into a served index.html
// so crawlers and no-JS clients see them (app.js re-renders for everyone with JS).
// Deploy-time and idempotent: run against the served copy after data.json is in place.
//   node scripts/prerender-retrospace.mjs <index.html> [data.json] [lang]
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { prerenderDirectory } from '../services/retrospace/src/prerender.js';

const indexPath = process.argv[2] || 'demos/retrospace/index.html';
const dataPath = process.argv[3] || join(dirname(indexPath), 'data.json');
const lang = process.argv[4] || 'en';

const data = JSON.parse(readFileSync(dataPath, 'utf8'));
const { heading, listHtml } = prerenderDirectory(data, lang);

let src = readFileSync(indexPath, 'utf8');
const listRe = /(<ul\b[^>]*\bid="results"[^>]*>)[\s\S]*?(<\/ul>)/;
const headRe = /(<h2\b[^>]*\bid="results-h"[^>]*>)[\s\S]*?(<\/h2>)/;
if (!listRe.test(src) || !headRe.test(src)) {
  console.error(`prerender: results list/heading markup not found in ${indexPath}`);
  process.exit(1);
}
src = src.replace(listRe, `$1\n${listHtml}\n$2`);
src = src.replace(headRe, `$1${heading}$2`);
writeFileSync(indexPath, src);

const n = (data.sites || []).filter((s) => s.status === 'listed').length;
console.log(`retrospace: prerendered ${n} listings (${lang}) → ${indexPath}`);
