// publish-retrospace.mjs - turn the curated, approved source into the public
// sites.json the frontend fetches from CloudFront (the git-PR flow). Run in
// CI on approval (and on a schedule to bake in fresh toplist hits), then sync the
// output to S3. The source of truth is a curated JSON in the repo; approving a
// submission is a pull request that adds a site to it.
//   node scripts/publish-retrospace.mjs [source.json] [out.json]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { publishDirectory } from '../services/retrospace/src/publish.js';

const src = process.argv[2] || 'demos/retrospace/data.json';
const out = process.argv[3] || 'dist/retrospace/sites.json';

const data = JSON.parse(readFileSync(src, 'utf8'));
const sites = Array.isArray(data) ? data : (data.sites || []);
const published = publishDirectory(sites, { generated: new Date().toISOString() });

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(published, null, 2) + '\n');
console.log(`retrospace: published ${published.sites.length} listed sites → ${out}`);
