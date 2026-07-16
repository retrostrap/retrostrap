// assets.mjs - pixel art as reviewable text. Each source file in
// assets-src/ is a JSON pixel grid: a palette map plus rows of single-char
// keys. We validate every color against the Palette Law, render a PNG (a
// horizontal sprite sheet when there is more than one frame), and emit a
// manifest the widgets and docs read (docs/03).
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import { LEGAL_HEX } from '../src/js/core/palette.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SRC = join(ROOT, 'src', 'assets-src');
const OUT = join(ROOT, 'dist', 'assets');
const LEGAL = new Set(LEGAL_HEX);

const problems = [];
const manifest = {};

async function findJson(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await findJson(p)));
    else if (entry.name.endsWith('.json')) out.push(p);
  }
  return out;
}

function toRgba(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
}

function render(art, file) {
  const [w, h] = art.size;
  const frames = art.frames;
  const bad = (m) => problems.push(`${basename(file)}: ${m}`);

  // bound the allocation before pngjs sees it, a crafted size/frame count in a
  // committed grid JSON could otherwise OOM the build (a fork PR is untrusted)
  if (![w, h].every((n) => Number.isInteger(n) && n >= 1 && n <= 512) || !Array.isArray(frames) || frames.length < 1 || frames.length > 64) {
    bad(`refusing size ${w}x${h} x${Array.isArray(frames) ? frames.length : '?'} frames (max 512x512, 64 frames)`);
    return;
  }

  // palette: null means transparent; every real color must be legal
  const palette = {};
  for (const [key, hex] of Object.entries(art.palette)) {
    if (hex === null) { palette[key] = [0, 0, 0, 0]; continue; }
    if (!LEGAL.has(hex.toUpperCase())) bad(`color ${hex} (key "${key}") is off the palette`);
    palette[key] = toRgba(hex);
  }

  const png = new PNG({ width: w * frames.length, height: h });
  frames.forEach((rows, f) => {
    if (rows.length !== h) bad(`frame ${f} has ${rows.length} rows, expected ${h}`);
    rows.forEach((row, y) => {
      if ([...row].length !== w) bad(`frame ${f} row ${y} is ${[...row].length} wide, expected ${w}`);
      [...row].forEach((ch, x) => {
        const rgba = palette[ch];
        if (!rgba) { bad(`frame ${f} uses undefined key "${ch}"`); return; }
        const idx = ((y * png.width) + (f * w + x)) << 2;
        [png.data[idx], png.data[idx + 1], png.data[idx + 2], png.data[idx + 3]] = rgba;
      });
    });
  });
  return png;
}

const files = (await findJson(SRC)).sort(); // sorted so the manifest key order is reproducible across filesystems
if (!files.length) { console.error(`assets: no source grids found in ${SRC}`); process.exit(1); }
await mkdir(OUT, { recursive: true });

for (const file of files) {
  const art = JSON.parse(await readFile(file, 'utf8'));

  // ids and skin keys become output filenames, keep them kebab-case so a
  // crafted "../evil" in a committed JSON can't write outside dist/assets/
  if (!/^[a-z0-9-]+$/.test(art.id || '')) { problems.push(`${file}: asset id must be kebab-case`); continue; }

  // a sprite with `skins` renders one sheet per skin, sharing the frame data,
  // so the neko's three coats live in one reviewable file (docs/03)
  if (art.skins) {
    for (const [skin, palette] of Object.entries(art.skins)) {
      if (!/^[a-z0-9-]+$/.test(skin)) { problems.push(`${file}: skin "${skin}" must be kebab-case`); break; }
      const png = render({ ...art, palette }, file);
      if (problems.length) break;
      await writeFile(join(OUT, `${art.id}-${skin}.png`), PNG.sync.write(png));
      manifest[`${art.id}-${skin}`] = {
        file: `assets/${art.id}-${skin}.png`,
        size: art.size,
        frames: art.frames.length,
        fps: art.fps ?? 0,
        ...(art.frameNames ? { frameNames: art.frameNames } : {}),
        ...(art.states ? { states: art.states } : {}),
      };
    }
    continue;
  }

  const png = render(art, file);
  if (problems.length) continue; // don't write art that broke a law
  await writeFile(join(OUT, `${art.id}.png`), PNG.sync.write(png));
  manifest[art.id] = {
    file: `assets/${art.id}.png`,
    size: art.size,
    frames: art.frames.length,
    fps: art.fps ?? 0,
    ...(art.frameNames ? { frameNames: art.frameNames } : {}),
    ...(art.states ? { states: art.states } : {}),
  };
}

if (problems.length) {
  console.error(`assets: ${problems.length} problem(s):`);
  for (const p of problems) console.error('  - ' + p);
  process.exit(1);
}

await writeFile(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`assets: ${files.length} rendered, all lawful.`);
