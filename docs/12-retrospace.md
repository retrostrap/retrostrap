# Retrospace: the curated directory

Retrospace is a hand-sorted directory and search for the retrostrap world: a small,
calm, polite corner of the modern web where sites that look like 1999 can be found on
purpose. It is the grown-up form of the "retroring" idea:
not just a webring, but the Yahoo-directory-meets-webring the early web actually had,
rebuilt with a human at the gate.

It is a sibling to the Boards ([11](11-community-forum.md)) and shares their spirit and,
where sensible, their plumbing (auth, roles, Netiquette).

## The charter (the whole point)

Retrospace is deliberately **not** a growth product. Its rules are the opposite of the
attention economy, and that is the feature:

- **Calm / entschleunigt.** No infinite scroll, no algorithmic feed, no engagement
  metrics on display, no notifications. You browse categories, you read "the site of the
  day," you bookmark it and come back when you feel like it. Nothing pulls at you. (A
  plain RSS feed would fit and is noted for later.)
- **Höflich.** A shared Netiquette code of conduct. No ads, no third-party tracking, no
  dark patterns, in Retrospace itself and required of every listed site.
- **Curated.** A human approves every listing and re-reviews it once a year. Quality over
  quantity, forever. A smaller directory that stays good beats a big one that rots.

The tone in copy is the house voice (warm, precise, first-person plural), in both
languages Retrospace speaks.

## Sites are the unit

Everything orbits the **site**: a URL someone submits, a human approves, and Retrospace
lists, classifies, searches, and re-reviews. A site has:

- `url`, `title`, `blurb` (short, curator-checked), `submitted_by`
- `categories[]` (one or more, from the fixed taxonomy) and `languages[]` (BCP-47-ish
  short codes; a site may be bilingual)
- `status` (see the lifecycle), `check` (the latest retrospace-check result), and the
  review clock (`approved_at`, `last_reviewed_at`, `next_review_at`)

Our own demo sites are Retrospace's founding, clearly-fictional entries, the seed that
lets the whole thing be built and felt before a single real submission exists.

## Admission: "uses retrostrap or looks the part"

The bar is inclusive but real: a site must either **use retrostrap** or be **era-authentic
in the same spirit**. A submission is scored first by the automated **retrospace-check**
(`services/retrospace/src/verify.js`), which reads the page and reports, with evidence:

1. **retrostrap?**: links `retrostrap(.min).css`/`.js`, or uses `--rs-*` tokens / `rs-`
   classes. (A strong yes; not required if the era checks pass.)
2. **palette**: colors look confined to the legal era set (a lighter, heuristic cousin
   of `Retrostrap.audit()`; the full audit runs when the site *is* retrostrap).
3. **decency**: no autoplay audio/video, no known trackers/ad networks, no obvious dark
   patterns.
4. **works without JS**: real content in the markup, not a blank JS mount.
5. **era-plausible**: no border-radius soup, no giant hero video; the shape of an old page.

The check yields a `score`, per-check evidence, and a `verdict` (`pass` / `review` /
`fail`). **It never auto-admits**: it hands a moderator the evidence. A human decides.

## The lifecycle (moderation)

`submitted → in_review → listed → due_for_review → (back to listed | delisted)`, with
`rejected` and `withdrawn` as terminal side-exits. Approval lands straight on `listed`
(there is no separate approved state), and a relist returns to `listed` with a fresh
clock. Rules (`src/moderation.js`):

- Only a reviewer (Retrospace's own `moderator`/`admin` roles, a local pair, not the
  Boards' member/sysop/webmaster ladder from [11](11-community-forum.md)) can approve,
  reject, or delist. Approval stamps `approved_at` and sets `next_review_at = +1 year`.
- **Yearly review** is manual, on purpose: `dueForReview()` lists every listed site past
  `next_review_at`, a reviewer flags it, re-runs the check, and either relists (clock
  resets) or delists, link-rot, went dark, or drifted off-charter. There is no scheduled
  sweep. Delisting is still **polite**: the delisting pull request says why, in public,
  and a fixed site is welcome back; we collect no contact address, so the PR note is the
  heads-up (a real notification channel is noted for later).
- To flag a listed site (broken, off-charter, impolite), mail the maintainers (address
  in the imprint) or open an issue; a reviewer decides, nothing auto-acts. An on-site
  report form is noted for later.

Yearly human review is real, ongoing labor, that is accepted as the cost of staying good.

## Discovery: bilingual from day one

The UI ships in **German and English** at minimum (`src/i18n.js`, message catalogs keyed
by `en`/`de`; the language is a UI choice, independent of the language you filter sites
*by*). You discover sites two ways, and search a third:

- **By category**: a fixed, era-flavored taxonomy: personal homepages, art & pixels,
  music & radio, writing & zines, games & fandom, projects & tools, communities, the
  odd & the earnest. Category names are translated.
- **By language**: every site is tagged; you can browse "sites in Deutsch," "in English,"
  etc. This is where the split-by-language requirement lives.
- **Search**: over the curated set **only**, never the open web (`src/search.js`): a
  small tokenized index over title/blurb/tags, filterable by category and language. No
  crawler, no surveillance, no surprise.

## The toplist (opt-in traffic ranking, `src/toplist.js`)

A nod to the old topsites: listed sites can be **ranked by traffic**. A member puts the
toplist link on their page; the click-throughs **in** rank them, and the toplist sends
traffic back **out**. It is entirely aggregate click-counting, no visitor, IP, or
identifier is ever stored, exactly like the hit-counter, so the Decency Law holds. Only
**listed** sites can be counted or ranked (a submission can't rank itself), the counts are
never settable at submission, and the page says out loud that it counts clicks, not people.
`rankSites()` orders by inbound clicks (ties by outbound, then title); the store exposes
`hitIn`/`hitOut`/`toplist`. A member's rank is exactly the kind of thing that belongs on a
userbar in a Boards signature.
