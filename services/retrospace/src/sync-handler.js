// sync-handler.js, the scheduled toplist export (infra/README.md). Reads the published
// directory from S3, seeds a counter marker for each listed site (so live clicks
// have something to increment, and stray ids can't), reads the counts back, and
// writes a small hits.json the directory frontend merges over sites.json. Runs on
// a schedule, no request, no user. Deploy-time only; SDK is runtime-provided.
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { hitOps } from './ops-dynamo.js';
import { hitStore } from './hit-store.js';

const s3 = new S3Client({});
const store = hitStore(hitOps());

export async function handler() {
  const Bucket = process.env.BUCKET;
  const sitesKey = process.env.SITES_KEY || 'demos/retrospace/data.json';
  const hitsKey = process.env.HITS_KEY || 'demos/retrospace/hits.json';

  let parsed;
  try {
    const obj = await s3.send(new GetObjectCommand({ Bucket, Key: sitesKey }));
    parsed = JSON.parse(await obj.Body.transformToString());
  } catch (err) {
    // missing or malformed directory, nothing to seed this tick; surface it for
    // the error metric (an alarm here means counting has silently stopped)
    console.error(`retrospace sync: cannot read ${sitesKey}: ${err.message || err}`);
    throw err;
  }
  const all = Array.isArray(parsed) ? parsed : (parsed.sites || []);
  // published entries are already listed-only; tolerate a status field either way
  const sites = all.filter((s) => s && s.id && (s.status ? s.status === 'listed' : true));

  const hits = await store.sync(sites);

  await s3.send(new PutObjectCommand({
    Bucket,
    Key: hitsKey,
    Body: JSON.stringify({ hits }),
    ContentType: 'application/json',
    CacheControl: 'public, max-age=120',   // small + short-lived; the frontend merges it
  }));
  return { ok: true, sites: sites.length };
}
