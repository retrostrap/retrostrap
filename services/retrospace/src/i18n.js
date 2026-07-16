// i18n.js, Retrospace speaks German and English at minimum (docs/12). Keys are
// stable and flat; t() falls back to the key so a missing string is visible, not
// a blank. The language you read the UI in is separate from the language you
// filter sites by.
export const SUPPORTED = ['en', 'de'];
export const DEFAULT_LANG = 'en';

const MESSAGES = {
  en: {
    'site.title': 'Retrospace',
    'site.tagline': 'a hand-sorted corner of the calmer web',
    'nav.browse': 'Browse',
    'nav.categories': 'Categories',
    'nav.languages': 'Languages',
    'nav.submit': 'Submit a site',
    'nav.charter': 'How curation works',
    'search.label': 'Search the directory',
    'search.placeholder': 'search the directory',
    'search.button': 'Go',
    'search.results': '{n} sites',
    'search.results.one': '1 site',
    'search.none': 'No sites here yet. Try another word, or a category.',
    'filter.all': 'All',
    'filter.category': 'Category',
    'filter.language': 'Language',
    'card.visit': 'Visit',
    'card.reviewed': 'reviewed',
    'submit.url': 'Site address',
    'submit.title': 'Site name',
    'submit.blurb': 'One line about it',
    'submit.category': 'Best category',
    'submit.language': 'Language(s)',
    'submit.send': 'Send for review',
    'submit.note': 'A person reads every submission. Nothing lists automatically.',
    'sotd': 'Site of the day',
    'toplist': 'Top sites',
    'toplist.blurb': 'Ranked by traffic sent our way, clicks, not people (we count no visitors).',
    'toplist.hits': '{in} in · {out} out',
    'charter.calm': 'Calm: no feed, no metrics, no notifications.',
    'charter.polite': 'Polite: a code of conduct, no ads, no tracking.',
    'charter.curated': 'Curated: a human approves each site, and reviews it yearly.',
    'nav.skip': 'skip to the directory',
    'foot': 'A demonstration directory. Every site here is one of our own fictional demos.',
    'submit.ok': 'Thanks, received. A person will review it.',
    'submit.err': 'Hmm, that didn\'t go through. Try again in a moment.',
    'submit.demo': 'Static preview, nothing was sent. Point data-rsx-api at the service to accept submissions.',
    'load.fail': 'The directory is resting. Try reloading in a moment.',
    'lang.name': 'English',
  },
  de: {
    'site.title': 'Retrospace',
    'site.tagline': 'eine handsortierte Ecke des ruhigeren Netzes',
    'nav.browse': 'Stöbern',
    'nav.categories': 'Kategorien',
    'nav.languages': 'Sprachen',
    'nav.submit': 'Seite einreichen',
    'nav.charter': 'Wie kuratiert wird',
    'search.label': 'Im Verzeichnis suchen',
    'search.placeholder': 'im Verzeichnis suchen',
    'search.button': 'Los',
    'search.results': '{n} Seiten',
    'search.results.one': '1 Seite',
    'search.none': 'Hier noch keine Seiten. Versuch ein anderes Wort oder eine Kategorie.',
    'filter.all': 'Alle',
    'filter.category': 'Kategorie',
    'filter.language': 'Sprache',
    'card.visit': 'Besuchen',
    'card.reviewed': 'geprüft',
    'submit.url': 'Adresse der Seite',
    'submit.title': 'Name der Seite',
    'submit.blurb': 'Eine Zeile dazu',
    'submit.category': 'Passende Kategorie',
    'submit.language': 'Sprache(n)',
    'submit.send': 'Zur Prüfung senden',
    'submit.note': 'Jede Einreichung liest ein Mensch. Nichts wird automatisch gelistet.',
    'sotd': 'Seite des Tages',
    'toplist': 'Top-Seiten',
    'toplist.blurb': 'Sortiert nach zugesandtem Verkehr, Klicks, keine Menschen (wir zählen keine Besucher).',
    'toplist.hits': '{in} rein · {out} raus',
    'charter.calm': 'Ruhig: kein Feed, keine Metriken, keine Benachrichtigungen.',
    'charter.polite': 'Höflich: ein Verhaltenskodex, keine Werbung, kein Tracking.',
    'charter.curated': 'Kuratiert: ein Mensch prüft jede Seite und überprüft sie jährlich.',
    'nav.skip': 'zum Verzeichnis springen',
    'foot': 'Ein Demo-Verzeichnis. Jede Seite hier ist eine unserer erfundenen Demos.',
    'submit.ok': 'Danke, angekommen. Ein Mensch schaut es sich an.',
    'submit.err': 'Hmm, das ging nicht durch. Bitte gleich nochmal versuchen.',
    'submit.demo': 'Statische Vorschau, es wurde nichts gesendet.',
    'load.fail': 'Das Verzeichnis ruht gerade. Bitte in einem Moment neu laden.',
    'lang.name': 'Deutsch',
  },
};

const pick = (lang) => MESSAGES[SUPPORTED.includes(lang) ? lang : DEFAULT_LANG];

export function t(lang, key, vars) {
  const cat = pick(lang);
  let s = Object.hasOwn(cat, key) ? cat[key] : key; // own keys only, no constructor/__proto__ leak
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  return s;
}
export const messages = (lang) => ({ ...pick(lang) });
