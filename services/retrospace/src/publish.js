// publish.js, build the public directory snapshot from the curated, approved
// source (infra/README.md, the git-PR flow). Approved sites live in the repo as data and
// change by pull request; this turns them into the sites.json the frontend
// fetches from CloudFront and searches/ranks client-side. Pure and clock-free,
// the caller stamps `generated` and passes live hit counts. Run in CI on
// approval, and on a schedule to bake in fresh toplist hits.
import { CATEGORIES, LANGUAGES } from './classify.js';

/**
 * @param {object[]} source  the approved site records (the repo's curated list)
 * @param {{ hits?: Record<string,{inHits?:number,outHits?:number}>, generated?: string|null }} [opts]
 * @returns {{ generated, categories, languages, sites }}
 */
export function publishDirectory(source, { hits = {}, generated = null } = {}) {
  const sites = source
    .filter((s) => s.status === 'listed')
    .map((s) => ({
      // only what the page renders, moderation internals (check, approvedBy,
      // submittedBy, the review dates) never reach the public file
      status: 'listed',
      id: s.id,
      url: s.url,
      title: s.title || '',
      blurb: s.blurb || '',
      categories: s.categories || [],
      languages: s.languages || [],
      tags: s.tags || [],
      lastReviewedAt: s.lastReviewedAt || null,
      inHits: hits[s.id]?.inHits ?? s.inHits ?? 0,
      outHits: hits[s.id]?.outHits ?? s.outHits ?? 0,
    }))
    .sort((a, b) => String(a.title).localeCompare(String(b.title)));

  return { generated, categories: CATEGORIES, languages: LANGUAGES, sites };
}
