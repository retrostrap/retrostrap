// search.js, search over the curated set only, never the open web (docs/12). A
// tiny tokeniser and a relevance that favours the title, then the blurb and tags.
// No crawler, no ranking secrets, no surveillance.

// fold accents and lowercase, so search is accent-insensitive across de/fr/es and
// every script tokenises, nothing in the taxonomy's languages becomes unsearchable
const tokens = (s) => String(s || '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];

export function searchSites(sites, query, { category, language } = {}) {
  let pool = sites.filter((s) => s.status === 'listed');
  if (category) pool = pool.filter((s) => (s.categories || []).includes(category));
  if (language) pool = pool.filter((s) => (s.languages || []).includes(language));

  const q = tokens(String(query || '').slice(0, 200)); // cap before tokenising, no multi-MB query CPU
  const byTitle = (a, b) => (a.title || '').localeCompare(b.title || '');
  if (!q.length) return pool.slice().sort(byTitle);

  const scored = [];
  for (const s of pool) {
    const title = new Set(tokens(s.title));
    const body = new Set([...tokens(s.blurb), ...(s.tags || []).flatMap(tokens)]);
    let score = 0;
    for (const term of q) score += title.has(term) ? 3 : body.has(term) ? 1 : 0;
    if (score) scored.push({ s, score });
  }
  return scored.sort((a, b) => b.score - a.score || byTitle(a.s, b.s)).map((x) => x.s);
}
