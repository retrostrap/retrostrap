// The three read tools from docs/09: search_catalog, get_snippet, get_theme.
// Pure functions over a loaded manifest, no I/O, no deps, so the suite can
// exercise them directly.
import { allEntries } from './manifest.js';

const KINDS = new Set(['component', 'widget', 'theme']);

// Same tokenizer the directory search uses: fold accents, keep letters and
// digits, drop the rest. Keeps "webring" findable from "Webring!".
function tokens(s) {
  return (String(s).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
    .match(/[\p{L}\p{N}]+/gu)) || [];
}

// A tiny relevance model: an id or label hit is worth more than a summary hit,
// which is worth more than an aside in the era note or tags. Enough to float
// the obvious answer to the top without pretending to be a search engine.
const FIELD_WEIGHT = { id: 6, label: 4, tags: 3, classes: 3, summary: 2, era: 1 };

function scoreEntry(entry, queryTokens) {
  let score = 0;
  for (const [field, weight] of Object.entries(FIELD_WEIGHT)) {
    const value = Array.isArray(entry[field]) ? entry[field].join(' ') : entry[field];
    if (!value) continue;
    const hay = new Set(tokens(value));
    for (const q of queryTokens) {
      if (hay.has(q)) score += weight;
      else if (String(value).toLowerCase().includes(q)) score += 1; // substring, e.g. "nav" in "navbar"
    }
  }
  return score;
}

function summarize(entry) {
  return {
    id: entry.id,
    kind: entry.kind,
    label: entry.label,
    summary: entry.summary,
    tags: entry.tags || [],
  };
}

/**
 * Search components, widgets and themes by keyword.
 * @param {object} manifest
 * @param {string} query
 * @param {{ kind?: string, limit?: number }} [opts]
 * @returns {{ query: string, count: number, results: object[] }}
 */
export function searchCatalog(manifest, query, opts = {}) {
  const { kind, limit = 20 } = opts;
  if (kind && !KINDS.has(kind)) {
    throw new Error(`unknown kind "${kind}"; expected one of ${[...KINDS].join(', ')}`);
  }
  let pool = allEntries(manifest);
  if (kind) pool = pool.filter((e) => e.kind === kind);

  const queryTokens = tokens(query);
  let results;
  if (queryTokens.length === 0) {
    // No query is a browse: everything, alphabetical, still capped.
    results = [...pool].sort((a, b) => a.id.localeCompare(b.id));
  } else {
    results = pool
      .map((e) => ({ e, score: scoreEntry(e, queryTokens) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score || a.e.id.localeCompare(b.e.id))
      .map((r) => r.e);
  }
  return {
    query,
    count: results.length,
    results: results.slice(0, limit).map(summarize),
  };
}

/**
 * The canonical copy-paste snippet for any catalog entry, plus the bits a
 * generator needs to place it correctly (a11y note, whether it needs JS).
 */
export function getSnippet(manifest, id) {
  const entry = allEntries(manifest).find((e) => e.id === id);
  if (!entry) throw new Error(`no catalog entry with id "${id}"`);
  return {
    id: entry.id,
    kind: entry.kind,
    label: entry.label,
    requiresJs: entry.requiresJs,
    a11y: entry.a11y,
    snippet: entry.snippet,
  };
}

/** A theme's details and how to switch it on. */
export function getTheme(manifest, id) {
  const theme = manifest.themes.find((t) => t.id === id);
  if (!theme) {
    const known = manifest.themes.map((t) => t.id).join(', ');
    throw new Error(`no theme with id "${id}"; available: ${known}`);
  }
  return {
    id: theme.id,
    label: theme.label,
    summary: theme.summary,
    era: theme.era,
    a11y: theme.a11y,
    // How you turn it on: the attribute plus the stylesheet link.
    apply: { attribute: `data-rs-theme="${theme.id}"`, stylesheet: `dist/themes/${theme.id}.css` },
    snippet: theme.snippet,
  };
}
