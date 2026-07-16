// prerender.js, static listings HTML for the directory so crawlers and no-JS
// clients see the sites; app.js re-renders over it for everyone with JS (docs/12).
// Pure and clock-free, it mirrors app.js card(). Used at deploy time against the
// served copy, the committed demo stays client-rendered.
import { messages } from './i18n.js';

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ESC[c]);
const safeHref = (u) => (/^https?:\/\//i.test(u || '') ? u : '#'); // only http(s) reaches an href

/**
 * The listed sites as static <li> cards plus the results heading, in `lang`.
 * @param {{categories?:object[], languages?:object[], sites?:object[]}} data
 * @param {'en'|'de'} [lang]
 * @returns {{ heading: string, listHtml: string }}
 */
export function prerenderDirectory(data, lang = 'en') {
  const m = messages(lang);
  const cats = data.categories || [];
  const langs = data.languages || [];
  const catLabel = (id) => { const c = cats.find((x) => x.id === id); return c ? c[lang] : id; };
  const langLabel = (code) => { const l = langs.find((x) => x.code === code); return l ? l[lang] : code; };

  const listed = (data.sites || []).filter((s) => s.status === 'listed');
  const listHtml = listed.map((s) => {
    const l0 = (s.languages && s.languages[0]) || '';
    const langAttr = l0 ? ` lang="${esc(l0)}"` : '';
    const tags = (s.categories || []).map((c) => `<span class="rx-tag">${esc(catLabel(c))}</span>`).join('');
    const langLine = (s.languages || []).map((c) => esc(langLabel(c))).join(' · ');
    const reviewed = s.lastReviewedAt ? `<span>${esc(m['card.reviewed'])} ${esc(s.lastReviewedAt)}</span>` : '';
    return '<li class="rx-card">'
      + `<h3 class="rx-card__title"><a href="${esc(safeHref(s.url))}" rel="nofollow noopener"${langAttr}>${esc(s.title)}</a></h3>`
      + `<p class="rx-card__blurb"${langAttr}>${esc(s.blurb)}</p>`
      + `<p class="rx-card__meta">${tags}</p>`
      + `<p class="rx-card__foot"><span>${langLine}</span>${reviewed}</p>`
      + '</li>';
  }).join('\n');

  const n = listed.length;
  const heading = n === 1 ? m['search.results.one'] : m['search.results'].split('{n}').join(String(n));
  return { heading: esc(heading), listHtml };
}
