// The runnable homepage-services server, exercised over real HTTP.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createApp } from '../src/server.js';

let server;
let base;
const rings = new Map([['nightsky', {
  home: 'https://ring.example/',
  sites: [{ title: 'A', url: 'https://a.example/' }, { title: 'B', url: 'https://b.example/' }],
}]]);

beforeAll(async () => {
  server = createApp(undefined, rings, { guestbook: true }); // exercise the opt-in guestbook here
  await new Promise((r) => server.listen(0, r));
  base = `http://localhost:${server.address().port}`;
});
afterAll(() => server.close());

describe('homepage-services HTTP', () => {
  it('counts a page and reads it back', async () => {
    const bump = await (await fetch(`${base}/counter?page=/home.html`, { method: 'POST' })).json();
    expect(bump.count).toBe(1);
    const read = await (await fetch(`${base}/counter?page=/home.html`)).json();
    expect(read.count).toBe(1);
  });

  it('sends CORS headers so any homepage can call it', async () => {
    const res = await fetch(`${base}/counter?page=/x`);
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('accepts a guestbook entry and shows it at once (classic unmoderated book)', async () => {
    const res = await fetch(`${base}/guestbook/sandra`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Randy', message: 'KEWL page!!' }),
    });
    expect(res.status).toBe(201);
    expect((await res.json()).pending).toBe(false);
    const list = await (await fetch(`${base}/guestbook/sandra`)).json();
    expect(list.entries).toHaveLength(1); // shown immediately; widget renders text-only
    expect(list.entries[0].message).toBe('KEWL page!!');
  });

  it('serves the hosted guestbook only when enabled (off by default)', async () => {
    const off = createApp(undefined, rings); // no { guestbook: true }
    await new Promise((r) => off.listen(0, r));
    const b = `http://localhost:${off.address().port}`;
    const post = await fetch(`${b}/guestbook/sandra`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Randy', message: 'hi' }),
    });
    expect(post.status).toBe(404);
    expect((await fetch(`${b}/guestbook/sandra`)).status).toBe(404);
    off.close();
  });

  it('redirects webring navigation', async () => {
    const res = await fetch(`${base}/webring/nightsky/next?from=https://a.example/`, { redirect: 'manual' });
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('https://b.example/');
  });
});
