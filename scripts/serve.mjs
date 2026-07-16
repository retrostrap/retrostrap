// serve.mjs - a static server the size of a floppy label. Serves the repo
// root so demos and test pages can link ../../dist/ exactly like the docs say.
import { createServer } from 'node:http';
import { readFile, realpath } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
  '.ico': 'image/x-icon',
  '.ogg': 'audio/ogg',
  '.mp3': 'audio/mpeg',
};

const ROOT = fileURLToPath(new URL('..', import.meta.url));

export function serve(port = 8098) {
  const server = createServer(async (req, res) => {
    try {
      let path = normalize(decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
      if (path.endsWith('/')) path += 'index.html';
      // the browser fetches /favicon.ico on its own; answer it (204) so a missing
      // icon doesn't log a console 404 that the audit and smoke gates read as a
      // page failure. Pages wanting a real icon still link one explicitly.
      if (path === '/favicon.ico') { res.writeHead(204); res.end(); return; }
      // never serve dotfiles (.git/, .env…) or private *.local.md,
      // even to localhost, this is a dev server, not a file share
      const segs = path.split(/[\\/]+/).filter(Boolean);
      if (segs.some((s) => s.startsWith('.')) || /\.local\.md$/i.test(path)) throw new Error('forbidden');
      const root = ROOT.endsWith(sep) ? ROOT.slice(0, -1) : ROOT;
      const file = join(ROOT, path);
      if (file !== root && !file.startsWith(root + sep)) throw new Error('nice try');
      // resolve symlinks and re-check: a link inside the tree must not point out of it
      const real = await realpath(file);
      if (real !== root && !real.startsWith(root + sep)) throw new Error('nice try (symlink)');
      const body = await readFile(real);
      res.writeHead(200, {
        'content-type': TYPES[extname(file)] ?? 'application/octet-stream',
        // no validators here, so heuristic caching would happily serve last
        // week's bundle after a rebuild; a dev server should never cache
        'cache-control': 'no-store',
      });
      res.end(body);
    } catch {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('HTTP 404 - File Not Found. It happens to the best of us.');
    }
  });
  // loopback only: a dev/CI server should never be reachable from the LAN
  server.listen(port, '127.0.0.1', () => {
    console.log(`serving the repo at http://localhost:${port}/  (ctrl-c stops it)`);
    console.log(`  demos hub:  http://localhost:${port}/demos/index.html`);
    console.log(`  docs (kitchen sink):  http://localhost:${port}/tests/e2e/pages/kitchen-sink.html`);
  });
  return server;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  serve(Number(process.env.PORT) || 8098);
}
