// The static pre-render mirrors app.js card() for crawlers/no-JS; app.js replaces
// it when JS runs. Pure HTML, so we assert the shape and the escaping directly.
import { describe, it, expect } from 'vitest';
import { prerenderDirectory } from '../src/prerender.js';

const data = {
  categories: [{ id: 'personal', en: 'Personal homepages', de: 'Persönliche Homepages' }],
  languages: [{ code: 'en', en: 'English', de: 'Englisch' }, { code: 'de', en: 'German', de: 'Deutsch' }],
  sites: [
    { status: 'listed', id: 's1', url: 'https://a.example/', title: 'A & B <site>', blurb: 'nice <b>page</b>',
      categories: ['personal'], languages: ['en'], lastReviewedAt: '2026-01-01' },
    { status: 'pending', id: 's2', url: 'https://b.example/', title: 'hidden', blurb: '', categories: [], languages: [] },
  ],
};

describe('prerenderDirectory', () => {
  it('renders only listed sites, mirroring the card structure', () => {
    const { listHtml } = prerenderDirectory(data, 'en');
    expect(listHtml).toContain('<li class="rx-card">');
    expect(listHtml).toContain('<h3 class="rx-card__title"><a href="https://a.example/" rel="nofollow noopener"');
    expect(listHtml).toContain('<span class="rx-tag">Personal homepages</span>'); // en label
    expect(listHtml).not.toContain('hidden'); // the pending site is excluded
  });

  it('escapes HTML in titles and blurbs (no injection through the data)', () => {
    const { listHtml } = prerenderDirectory(data, 'en');
    expect(listHtml).toContain('A &amp; B &lt;site&gt;');
    expect(listHtml).toContain('nice &lt;b&gt;page&lt;/b&gt;');
    expect(listHtml).not.toContain('<b>page</b>');
  });

  it('localizes labels and the heading', () => {
    expect(prerenderDirectory(data, 'de').listHtml).toContain('Persönliche Homepages');
    expect(prerenderDirectory(data, 'en').heading).toBe('1 site');
    expect(prerenderDirectory(data, 'de').heading).toBe('1 Seite');
  });

  it('drops the href for non-http urls', () => {
    const bad = { ...data, sites: [{ status: 'listed', id: 'x', url: 'javascript:alert(1)', title: 't', blurb: '', categories: [], languages: [] }] };
    expect(prerenderDirectory(bad, 'en').listHtml).toContain('href="#"');
    expect(prerenderDirectory(bad, 'en').listHtml).not.toContain('javascript:');
  });
});
