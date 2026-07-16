// build.mjs - one command, every artifact. No config file, no plugins:
// read this top to bottom and you know the whole build.
import esbuild from 'esbuild';
import { readFileSync, readdirSync, copyFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const watch = process.argv.includes('--watch');

// the generated-artifact scripts, run after esbuild in this order (docs/03)
function generate() {
  for (const script of ['assets.mjs', 'guardrails.mjs', 'manifest.mjs']) {
    execFileSync('node', [`scripts/${script}`], { stdio: 'inherit' });
  }
  // the type declarations aren't compiled from anything; ship them as-is
  copyFileSync('src/retrostrap.d.ts', 'dist/retrostrap.d.ts');
  // mirror the committed 88x31s into dist so pages can link them without a
  // playwright run; `npm run badges` re-renders both copies from source
  try {
    const badges = readdirSync('.github/badges').filter((f) => f.endsWith('.png'));
    mkdirSync('dist/assets/badges', { recursive: true });
    for (const f of badges) copyFileSync(`.github/badges/${f}`, `dist/assets/badges/${f}`);
  } catch { /* no badges checked in yet; npm run badges makes them */ }
}
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const banner = `/*! retrostrap v${pkg.version} | MIT | build like it's 2026, look like it's 1999 */`;

const css = (minify) => ({
  entryPoints: ['src/css/retrostrap.css'],
  bundle: true,
  minify,
  // sprite urls resolve against dist/assets at serve time, like the theme
  // sheets do, leave them as written instead of trying to inline the PNGs
  external: ['*.png'],
  banner: { css: banner },
  outfile: minify ? 'dist/retrostrap.min.css' : 'dist/retrostrap.css',
  logLevel: 'info',
});

// patterns.css and the theme files ship un-bundled: no @imports to inline, and
// we want the url("assets/…") references left exactly as written, resolving
// against dist/ at serve time. bundle:false leaves them untouched.
const patternsCss = {
  entryPoints: ['src/css/patterns.css'],
  bundle: false,
  minify: true,
  banner: { css: banner },
  outfile: 'dist/retrostrap-patterns.css',
  logLevel: 'info',
};

const themesCss = () => {
  let files = [];
  try {
    files = readdirSync('src/css/themes').filter((f) => f.endsWith('.css'));
  } catch {
    return null;
  }
  if (!files.length) return null;
  return {
    entryPoints: files.map((f) => `src/css/themes/${f}`),
    bundle: false,
    minify: true,
    banner: { css: banner },
    outdir: 'dist/themes',
    logLevel: 'info',
  };
};

// core JS ships two ways: an IIFE that sets window.Retrostrap for a plain
// <script>, and an ESM build for bundlers. Same source, same behavior.
const jsIife = (minify) => ({
  entryPoints: ['src/js/index.js'],
  bundle: true,
  minify,
  format: 'iife',
  target: 'es2022',
  banner: { js: banner },
  outfile: minify ? 'dist/retrostrap.min.js' : 'dist/retrostrap.js',
  logLevel: 'info',
});
const jsEsm = {
  entryPoints: ['src/js/index.js'],
  bundle: true,
  minify: true,
  format: 'esm',
  target: 'es2022',
  banner: { js: banner },
  outfile: 'dist/retrostrap.esm.js',
  logLevel: 'info',
};

// each widget ships as its own self-registering ESM file, and the whole
// Toybox ships as one IIFE (docs/03). Helper files (leading _) are not entries.
const widgetFiles = () => {
  try {
    return readdirSync('src/js/widgets')
      .filter((f) => f.endsWith('.js') && !f.startsWith('_'))
      .map((f) => `src/js/widgets/${f}`);
  } catch {
    return [];
  }
};
const jsWidgets = () => {
  const files = widgetFiles();
  if (!files.length) return null;
  return {
    entryPoints: files,
    bundle: true,
    minify: true,
    format: 'esm',
    target: 'es2022',
    outdir: 'dist/widgets',
    logLevel: 'info',
  };
};
const jsToybox = {
  entryPoints: ['src/js/toybox.js'],
  bundle: true,
  minify: true,
  format: 'iife',
  target: 'es2022',
  // the widgets self-register as a side effect; ignore the package.json
  // sideEffects field here so those bare imports aren't tree-shaken away
  ignoreAnnotations: true,
  banner: { js: banner },
  outfile: 'dist/retrostrap-toybox.min.js',
  logLevel: 'info',
};

if (watch) {
  const contexts = await Promise.all([css(false), jsIife(false)].map((c) => esbuild.context(c)));
  await Promise.all(contexts.map((c) => c.watch()));
  const { serve } = await import('./serve.mjs');
  serve(Number(process.env.PORT) || 8098);
} else {
  const builds = [
    esbuild.build(css(false)),
    esbuild.build(css(true)),
    esbuild.build(jsIife(false)),
    esbuild.build(jsIife(true)),
    esbuild.build(jsEsm),
    esbuild.build(jsToybox),
    esbuild.build(patternsCss),
  ];
  const widgets = jsWidgets();
  if (widgets) builds.push(esbuild.build(widgets));
  const themes = themesCss();
  if (themes) builds.push(esbuild.build(themes));
  await Promise.all(builds);
  generate();
}
