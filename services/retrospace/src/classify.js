// classify.js, the fixed taxonomy (docs/12). Categories and languages carry
// their own German and English labels so the directory reads native in both. New
// categories are a deliberate, rare decision, the taxonomy is a promise.
export const CATEGORIES = [
  { id: 'personal', en: 'Personal homepages', de: 'Persönliche Homepages' },
  { id: 'art', en: 'Art & pixels', de: 'Kunst & Pixel' },
  { id: 'music', en: 'Music & radio', de: 'Musik & Radio' },
  { id: 'writing', en: 'Writing & zines', de: 'Texte & Zines' },
  { id: 'games', en: 'Games & fandom', de: 'Spiele & Fandom' },
  { id: 'projects', en: 'Projects & tools', de: 'Projekte & Werkzeuge' },
  { id: 'community', en: 'Communities', de: 'Gemeinschaften' },
  { id: 'curios', en: 'The odd & the earnest', de: 'Kurioses & Ernstes' },
];

export const LANGUAGES = [
  { code: 'en', en: 'English', de: 'Englisch' },
  { code: 'de', en: 'German', de: 'Deutsch' },
  { code: 'fr', en: 'French', de: 'Französisch' },
  { code: 'es', en: 'Spanish', de: 'Spanisch' },
  { code: 'ja', en: 'Japanese', de: 'Japanisch' },
  { code: 'other', en: 'Other', de: 'Andere' },
];

const CAT_IDS = new Set(CATEGORIES.map((c) => c.id));
const LANG_CODES = new Set(LANGUAGES.map((l) => l.code));

export const isCategory = (id) => CAT_IDS.has(id);
export const isLanguage = (code) => LANG_CODES.has(code);

// keep only known ids, de-duped, order preserved
export const normalizeCategories = (input) => [...new Set([].concat(input || []).filter(isCategory))];
export const normalizeLanguages = (input) => [...new Set([].concat(input || []).filter(isLanguage))];

/** Display label for a category id or language code, in the given UI language. */
export function label(kind, id, lang = 'en') {
  const list = kind === 'language' ? LANGUAGES : CATEGORIES;
  const key = kind === 'language' ? 'code' : 'id';
  const hit = list.find((x) => x[key] === id);
  return hit ? (hit[lang] || hit.en) : id;
}
