# Retrostrap Boards: the community forum

This is the product spec for **Retrostrap Boards**, the official retrostrap community forum
and the framework's flagship dogfood. The Boards are built and launch with the project
itself, seeded invite-first; the implementation lives in `services/boards`. This document is
the source of truth for behavior; where a feature is not yet built, it says so.

The Boards obey all five Laws, Palette, Font, Shape, Motion, Decency, without exception. If
the forum ever needs to break a Law, the Law is wrong and we fix the Law first (see
[design language](02-design-language.md)).

## 1 · Why a forum (and why not Discord)

We believe in the slow web, and a forum is the slow web's parliament:

- **Own your community.** Our members, our database, our rules, our export. Nobody can
  rug-pull the archive or change the terms under us.
- **Public and searchable.** Every answered question helps the next person who types it into
  a search engine at 2 a.m. Chat helps exactly one person, once.
- **Indexable knowledge.** Threads are documents with URLs. They can be linked from the docs,
  quoted in issues, and found in five years.
- **No walled garden.** Reading requires no account, no app, no phone number. Lurkers are
  honored citizens (they even get a rank).
- **No engagement mechanics.** No streaks, no unread badges screaming at you, no dopamine
  slot machine. You visit when you feel like it; the forum will still be there.
- **A forum IS the retro artifact.** A phpBB-style board is period furniture for a framework
  that reproduces 1995-2004. The medium is the message; running our community on retrostrap
  components is the best demo we could possibly build.

Why not the obvious alternatives, honestly: we weighed Discord, GitHub Discussions, stock
phpBB, and Discourse, and the dogfood settles it. None of them run on retrostrap, so none of
them are the demo; most look irreducibly modern or would never be ours to keep. GitHub
Discussions is the near miss, free and already where developers are, but it would split the
community in two, and we want one home, so the issue chooser points question-askers at the
Boards.

The honest downside of building our own: a small custom codebase has fewer eyes on it than
phpBB or Discourse. We compensate with a deliberately tiny feature surface and boring
technology.

## 2 · Branding and tone

**Name:** Retrostrap Boards. In prose: "the Boards". Never "the forums", plural, there is
one forum with three boards.

**Address:** `boards.retrostrap.dev`. The docs site stays cookie-free.

**Visual structure:** phpBB-2-era layout on the retrostrap bevel theme base. Radius 0
everywhere (Shape Law), era font stacks (Font Law), web-safe colors only (Palette Law), any
motion is `linear` or `steps()` (Motion Law), and per the Decency Law: no autoplay audio, no
analytics, and every page works fully with JavaScript disabled. Plain HTML forms with
POST-redirect-GET do the real work; the composer niceties JS would add (click-to-insert
smilies, quote insertion) are not yet in, today the composer is a plain textarea.

Component map per page region:

| Page region | retrostrap component |
| --- | --- |
| Page chrome, titled boxes, composer, login box | `rs-window` (bevel base; title bar carries the board/page name) |
| Board list, thread list, post rows, memberlist, mod queue | `rs-table` |
| Board descriptions, stats footer, MOTD, profile card | `rs-panel` |
| Author column portrait (80×80) | `rs-avatar` |
| Quoted text in posts; signatures | `rs-quote`, `rs-quote__sig` |
| Page navigation (20 per page, always) | `rs-pagination` |
| "Boards » Retrostrap Talk » thread title" trail | `rs-breadcrumbs` |
| Rank titles, pinned/locked/NEW markers | `rs-badge` |
| Smiley picker in the composer; smiley rendering in posts | smilies widget |

The header showing the pixel-art Gif the cat logo and the tagline, and Gif fronting the 404
page ("This page has knocked something off the shelf and fled"), are launch polish: the
shipped chrome is a plain titlebar, and the shipped 404 says "That page does not exist."

**The voice of the place:** warm, patient, curious, the good parts of 2001 forum culture,
minus the flame wars. Microcopy rules: we never mock the member; when something fails we
blame the modem, not the human. Examples, as the shipped UI says them:

- Rate limited: "You are posting very fast. Take a short breather." (The canon "Easy there,
  speedy, new members can post 5 times an hour. Your reply will keep." arrives with the
  new-member limit.)
- Login failed: "That didn't match. Caps Lock is the usual suspect."
- Empty board: "No threads yet. Be the first, post #1 always gets remembered."
- Moved thread: "This thread has moved to a better neighborhood."

## 3 · Information architecture

Exactly three boards at launch. No categories-of-categories, no sub-boards, no hidden staff
board (Sysop coordination happens in the mod queue and by email).

Board descriptions, verbatim as they will appear:

1. **Retrostrap Talk**: "Help, showcase, and framework development, everything retrostrap.
   Ask anything: the only silly question is the one you sat on for a week."
2. **The Off-Topic Lounge**: "Everything that isn't retrostrap: old hardware, web nostalgia,
   music, life. Keep it kind, keep it legal, keep it (vaguely) interesting."
3. **Der Stammtisch**: „Das deutschsprachige Board für alles: retrostrap, Webnostalgie, Gott
   und die Welt. Wir sind per Du, setz dich dazu, die Runde rückt gern zusammen."

Pinned threads at launch (created by the seed script, authored by Webmaster):

| Board | Pinned thread | Opening post |
| --- | --- | --- |
| Retrostrap Talk | START HERE: The Netiquette | The full English charter (section 4) |
| Retrostrap Talk | Introduce yourself! | "One thread, all of us. Who are you, what do you build, and what was your first browser?" |
| Retrostrap Talk | Show us your site! | "Built something with retrostrap? Post the link. Screenshots welcome, `<marquee>` doubly so." |
| Der Stammtisch | Welcome / Vorstellungsrunde | Die Netiquette (section 5), dann: „Und jetzt du: Stell dich vor!" |

**What we deliberately do NOT have at launch** (and mostly ever):

- No direct messages. Public questions get public answers; people can put a homepage/email in
  their profile if they want to be reachable.
- No likes, reactions, or upvotes, you thank people by replying.
- No reputation scores, karma, streaks, or leaderboards. The rank ladder (section 6) counts
  posts, nothing else.
- No notifications except watched-thread email digests (opt-in, not yet).
- No read-receipts, "who's online" tracking, or view counters on profiles.
- No infinite scroll. **Never infinite scroll.** Twenty per page and an honest
  `rs-pagination`: page 7 of a thread is a place you can link to.

## 4 · The Netiquette charter: English version

Posted verbatim as the opening post of "START HERE: The Netiquette", pinned in Retrostrap
Talk and linked from every board description and the registration page. Inspired by RFC 1855.
This text is load-bearing: people will screenshot it, so it is written to be screenshotted.

> **The Netiquette of Retrostrap Boards**
>
> Welcome, traveller. Wipe your feet, the hit counter has already counted you.
>
> This is a slow forum. There is no feed, no algorithm, no like button, and
> nothing here is trying to keep you "engaged". There are only people, posts,
> and time. Twelve rules keep it that way, in truth one rule with eleven
> footnotes, and the one rule is the oldest on the net:
>
> 1. **Remember the human.** RFC 1855 said it in 1995 and it has not expired.
>    Behind every post is a person with a keyboard, a mug of something, and
>    a day you know nothing about. Write to the person, not at the screen.
> 2. **Assume good faith.** Terseness is usually haste, not hostility. Ask
>    before you take offense; it turns away nine of ten flame wars at the door.
> 3. **Search before asking.** The search box is humble but hard-working. If
>    you find an old thread that almost answers you, reply to it, which
>    brings us to:
> 4. **Necroposting is welcome here.** If you add something new, an old
>    thread waking up after three years is a feature, not a faux pas. We are
>    a slow forum and proud of it.
> 5. **Greet the newcomers.** Nobody is "just a Newbie", every Old-Timer's
>    post count once said zero. A hello in "Introduce yourself!" costs
>    nothing and makes a member out of a lurker.
> 6. **Disagree with arguments, not with people.** Attack the idea as hard
>    as you like; leave its author standing.
> 7. **Quote sparingly.** Trim the quote to the lines you are actually
>    answering. Nobody enjoys reading the same post twice, slightly indented.
> 8. **Stay on the board's topic.** Framework talk in Retrostrap Talk,
>    everything else in the Lounge, alles auf Deutsch am Stammtisch. New
>    subject? Start a new thread, threads are free.
> 9. **Keep your signature to three lines.** Your post should always be
>    longer than your name.
> 10. **Thank people by replying.** There is no like button, and that is not
>     a missing feature, it is the whole point. A written "thanks, that
>     fixed it" helps the next person who searches; a thumbs-up helps no one.
> 11. **Moderation is transparent.** Anything removed says so, in public,
>     with a reason. No silent edits, no shadow bans, no memory holes.
> 12. **The Sysops' word is final, and appealable.** If you think a call
>     was wrong, write to the Webmaster and say so, calmly. That is not
>     rebellion; that is the system working as designed.
>
> That's the whole law. Pull up a chair, introduce yourself, and remember:
> behind every avatar there is a human, probably reheating their coffee.
>
> Yours, the Sysops & the Webmaster

## 5 · The Netiquette charter: German version („Die Netiquette")

Not a translation, the same rules with a German soul, du-form throughout, posted as the
opening post of "Welcome / Vorstellungsrunde" in Der Stammtisch.

> **Die Netiquette**
>
> Willkommen am Stammtisch!
>
> Nimm dir einen Stuhl und stell was zu trinken ab, Kaffee, Tee oder
> Almdudler, wir sind da nicht streng. Das hier ist ein langsames Forum:
> kein Feed, kein Algorithmus, keine Likes. Nur Menschen, Beiträge und Zeit.
> Damit das gemütlich bleibt, haben wir zwölf Hausregeln. Eigentlich ist es
> nur eine, der Rest sind Fußnoten:
>
> 1. **Denk an den Menschen.** Hinter jedem Beitrag sitzt wer mit Tastatur,
>    Tagesform und Gefühlen. Schreib nichts, was du der Person am
>    Wirtshaustisch nicht über den Tisch sagen würdest.
> 2. **Geh vom Guten aus.** Ein knapper Beitrag ist meistens Eile, keine
>    Unfreundlichkeit. Frag nach, bevor du dich ärgerst, das erspart neun
>    von zehn Streitereien.
> 3. **Erst suchen, dann fragen.** Die Forensuche ist unscheinbar, aber
>    fleißig. Und wenn du ein altes Thema findest, das fast passt: antworte
>    einfach dort weiter.
> 4. **Alte Themen ausgraben ist keine Sünde.** Wenn du etwas Neues
>    beizutragen hast, freut sich das Thema über die zweite Jugend. Wir sind
>    langsam, und wir sind stolz drauf.
> 5. **Begrüß die Neuen.** Ein „Servus" in der Vorstellungsrunde kostet
>    nichts und macht aus einem Gast ein Mitglied. Niemand ist hier „nur
>    ein Newbie".
> 6. **Streite über Argumente, nie über Personen.** Harte Sache, weiches Herz.
> 7. **Zitiere sparsam.** Nur die Zeilen, auf die du wirklich antwortest,
>    niemand liest gern denselben Beitrag zweimal, nur eingerückt.
> 8. **Bleib beim Thema des Themas.** Der Stammtisch ist für alles offen,
>    aber jedes Gespräch kriegt seinen eigenen Faden. Ein neues Thema
>    aufzumachen kostet nichts.
> 9. **Signatur: höchstens drei Zeilen.** Dein Beitrag soll länger sein als
>    dein Name.
> 10. **Bedank dich mit einem Beitrag.** Einen Like-Button gibt es hier
>     absichtlich nicht. Ein ehrliches „Danke, hat funktioniert!" ist mehr
>     wert als hundert Daumen, und hilft der nächsten Person, die danach
>     sucht.
> 11. **Moderation passiert offen.** Wenn ein Beitrag entfernt wird, steht
>     dort, warum. Immer. Keine stillen Löschungen, keine Schattenbanne.
> 12. **Das Wort der Sysops gilt, Einspruch ist erlaubt.** Wenn du eine
>     Entscheidung für falsch hältst, schreib in Ruhe dem Webmaster. Das
>     ist kein Aufstand, das ist so vorgesehen.
>
> **Hausregeln, die nur für den Stammtisch gelten:**
>
> - Die Boardsprache ist Deutsch, in allen Spielarten. Ob „Jänner" oder
>   „Januar", „parkieren" oder „parken": regionale Vielfalt ist hier ein
>   Feature, kein Tippfehler.
> - Gäste, die nur Englisch können, sind trotzdem herzlich willkommen.
>   Wenn's geht, antworten wir zweisprachig.
> - Wir sind per Du. Das war am Stammtisch schon immer so, und dabei bleibt's.
>
> Und jetzt: Stell dich vor! :)
>
> Bis bald, deine Sysops & der Webmaster

## 6 · Membership lifecycle

**Registration.** `GET /register` asks for a display name (3-24 chars, unique
case-insensitively), an email, a password (min 10 chars), one **retro quiz** question, and
the age-statement checkbox ("I am 16 or older", see section 9). Two invisible spam traps
screen the form as well; we do not advertise how they work, but a genuine human never
notices them. `POST /register` validates, stores the password securely hashed, creates the
unverified account, and emails a verification link (24 h expiry; confirming is idempotent).

**The retro quiz** is one gentle era-trivia question drawn from a rotating pool, each with a
hint that guarantees any human can answer ("Our mascot Gif is what kind of animal?" with the
hint "It meows and sits on keyboards."). A wrong answer re-renders with a different question.
It is a friendly gate, not an exam.

**Verification and first posts.** `GET /verify/:token` marks the account verified and sends
you to `/login` (the link never starts a session; we ask for the password once more, on
purpose). An unvouched member's posts land **held**, invisible to everyone but their author
and the mods, until a Sysop approves one. Approval **vouches** the account, its later posts
then go straight through, and releases the opening post to the board.

**Password reset.** `GET /forgot` takes a display name or email; `POST /forgot` always
renders the same "if that account exists, we sent a link" page (no account enumeration) and,
when it matches, emails a single-use, 1-hour reset token. `GET /reset/:token` shows a
new-password form; setting the password consumes the token and **invalidates all existing
sessions** (a reset is also how you evict a thief). Login attempts are rate-limited so a
slow, careful hasher is not the only thing between us and online guessing, and a lockout
never reveals whether a name exists.

**New-user limits (anti-spam, era-true patience, not yet).**

- No links (`[url]`, bare URLs) in the first **3** posts, the parser renders them as plain
  text with a friendly note in preview.
- No `[img]` until **10** posts.
- Max **5 posts/hour** during the first week; regular members get 30/hour.

Already live: every member is capped at **30 posts/hour** (and 60/hour per IP), every
unvouched member's posts are held until a Sysop approves one, and login throttling runs from
day one; the invite-only membership is the launch-day spam control on top.

**Rank ladder.** Ranks are computed from approved `post_count` and rendered phpBB-style in
the author column: display name, rank title, a row of stars. Today the stars are text
entities (★); pixel `star.gif` strips, the `rs-avatar`, and the Posts / From / member-since
lines arrive with profiles (not yet).

| Post count | Title | Stars |
| --- | --- | --- |
| 0 | Lurker | none |
| 1+ | Newbie | ★ |
| 10+ | Member | ★★ |
| 50+ | Regular | ★★★ |
| 200+ | Old-Timer | ★★★★ |
| (role) | Sysop | ★★★★★ in green |
| (role) | Webmaster | ★★★★★ in red |

Star colors are Palette-Law named colors (yellow for members, green, red). Ranks confer no
permissions; only roles do.

**Profile fields (not yet).** Member profiles, the memberlist, avatars, and signatures
ship soon after launch; until then the author column shows name, rank, and stars. The spec:
display name (changeable once per 90 days), avatar (**80×80 px max, 20 KB max**, GIF/PNG/JPG;
oversized uploads are rejected with a kind message; default: a pixel Gif silhouette),
location (free text, max 60 chars), homepage URL, signature (BBCode, max 240 chars and 2 line
breaks, hard-enforced ≤ 3 rendered lines), member-since (automatic).

**Listed in Retrospace.** When a member's homepage URL matches an approved
[Retrospace](12-retrospace.md) listing, the profile, and the posting footer, show a small
*listed in Retrospace* badge: the curated directory vouching for the member's site. The match
is by normalized URL, listed sites only; an unlisted or still-pending homepage shows nothing.
It is a badge, not a link farm, one quiet mark, no counts, no ranking here (that lives on the
toplist).

**Account deletion (GDPR erasure, not yet).** Self-service deletion ships soon; until
then the Webmaster erases on request, by email, within the statutory month. The flow when it
ships: `POST /account/delete` (password confirmation, big honest warning, immediate and
irreversible). Effects: email, password, avatar, signature, location, homepage purged; all
sessions dropped. Posts remain for thread integrity (Art. 17(3) balancing, the conversation
belongs to everyone in it), but authorship renders as **"Guest"** on English boards and
**"Gast"** on Der Stammtisch. Erased data ages out of backups within about a month. Members
who want specific post *contents* removed report the post; Sysops handle it under the normal
transparency rules.

## 7 · BBCode spec

Era-true BBCode subset. **No Markdown. No raw HTML, ever**: input is entity-escaped first,
then whitelisted tags are transformed.

Allowed tags, exactly these:

| Tag | Renders | Rules |
| --- | --- | --- |
| `[b] [i] [u] [s]` | strong / em / span underline / span strike | plain inline |
| `[url=…]text[/url]`, `[url]…[/url]` | link | `http(s)` schemes only; `rel="nofollow ugc"`; same-tab (no pop-ups, Decency) |
| `[img]https://…[/img]` | image | https only; clamped via inline style (`max-width:100%`, `max-height:480px`); `loading="lazy"`; empty alt (decorative, the URL stays in the BBCode). Hotlinked images leak reader IPs to third parties, a privacy image-proxy is an **open item**; the clamp ships regardless |
| `[quote=author]…[/quote]` | `rs-quote` with attribution line | nestable (counts toward depth) |
| `[code]…[/code]` | `pre > code`, Font-Law monospace stack | contents verbatim: no BBCode, no smilies, whitespace preserved |
| `[spoiler]…[/spoiler]` | `details > summary` ("spoiler") | works without JS, progressive enhancement for free |
| `[color=…]…[/color]` | colored span | **Palette Law only**: the 16 named colors, `#RRGGBB` with each channel in {00,33,66,99,CC,FF} (plus the eight named-color hexes that sit off the cube, silver through teal), or `#RGB` shorthand. Invalid colors render the tag as plain literal text, a delightfully on-brand restriction |

Parser rules:

- Nesting depth max **8**; deeper tags render as literal text.
- Unmatched or malformed tags render as literal text (tolerant, phpBB-style, never an error
  page).
- Output is built from a fixed element/attribute whitelist, the parser can emit nothing else;
  every URL is scheme-checked (`http`/`https` only) and attribute-escaped. The whitelist
  itself is the sanitization.

Smilies (the framework's smilies widget conventions): nine faces, `:)` `;)` `:D` `:P` `:(`
`:o` `8)` `:3` `^_^`, seventeen codes counting the nosed variants like `:-)`, rendered from
one pixel PNG sprite with **alt text = the original code**, so copy-paste and screen readers
round-trip. Smilies are skipped inside `[code]`.

## 8 · Moderation handbook

**Sysop tools** (all actions require a reason string; all are logged):

- **Lock** a thread (still readable; composer replaced by "locked by sysop: reason").
- **Pin / unpin** within a board.
- **Move** a thread to another board (the thread shows a one-time "moved to a better
  neighborhood" notice).
- **Soft-delete** a post: the post row remains as a public tombstone,
  `removed by sysop: {reason}`, body hidden, revisions kept.
- **Ban ladder**, in order, one rung at a time unless spam: **note** (formal warning on the
  record) → **24 h** → **7 d** → **permanent**. Permanent bans are issued only by the
  Webmaster.

**Logging: private log, public policy.** Every action writes a private log entry (who, what,
why, when). There is no public mod-log board, a pillory is not warm. The public side of
transparency: every tombstone carries its reason, a banned member's login shows the reason,
and monthly aggregate counts (posts removed, bans by rung) appear in the "State of the
boards" post.

**Report queue.** Every post carries a "report this post" fold-out form (a reason field,
plain POST), shipped; reports deduplicate per post. The queue page at `/mod/queue` is not
yet built: it lists open reports oldest-first alongside first-posts awaiting approval, one
screen, three verbs: approve, remove (reason), dismiss.

**Escalation.** Sysops handle everything up to 7-day bans and routine removals. Permanent
bans, appeals, and legal/GDPR-flavored reports go to the Webmaster. Appeals arrive by email
(address in the Impressum) and get an answer within 14 days.

**The transparency promise:** every removal gets a reason string, in the tombstone, in the
ban notice, in the private log. If we cannot articulate the reason, we do not remove the
thing.

## 9 · Privacy and legal (EU/Austria)

The maintainer operates from Austria; GDPR and Austrian law apply. Design stance:
**GDPR-minimal**: the best data protection is data we never collect.

Data inventory:

| Data | Why (purpose / basis) | Retention |
| --- | --- | --- |
| Email address | Verification, account recovery, opt-in digests (contract) | Until erasure, then purged |
| Password (securely hashed) | Authentication (contract) | Until erasure |
| Display name, profile fields | Shown on posts (contract) | Until erasure, then purged/anonymized |
| Posts | The forum itself (contract; Art. 17(3) for retention) | Indefinite; authorship anonymized to Guest/Gast on erasure |
| Session (a signed token in your cookie) | Keeping you logged in (contract) | 30-day expiry; a password reset invalidates every session; logout clears the cookie on that browser |
| Password-reset token (single-use) | Account recovery (contract) | 1 h, then auto-expired |
| Post reports (reporter ids, reason) | Moderation (legitimate interest) | Until resolved, then deleted; the private mod-log keeps who/what/when |
| Bans, mod-log | Abuse defense, accountability (legitimate interest) | Indefinite, with the account / Sysop-visible only |
| Server diagnostics (no IP: our code logs none) | Debugging (legitimate interest) | 7 days, then gone |

- **Cookies:** two, both strictly necessary → **no consent banner needed**: the session
  cookie and a CSRF-token cookie. Both are HttpOnly, Secure, SameSite=Lax, and host-only.
  Logged-out visitors carry only the CSRF cookie. Both are disclosed in the
  Datenschutzerklärung.
- **No analytics, ever**: Decency Law. No tracking pixels, no fingerprinting, no third-party
  embeds in the chrome. Success is measured by reading our own database, never analytics.
- **Email** is used only for verification and opt-in watched-thread digests (every digest
  carries an unsubscribe link). Never marketing.
- **GDPR rights:** access/portability = `GET /account/export`, a JSON dump of profile and own
  posts (handled manually by the Webmaster until the endpoint ships). Erasure = the
  anonymization flow in section 6. Rectification = profile edit. Objection/complaints →
  Webmaster, then the Austrian Datenschutzbehörde.
- **Minimum age:** registration requires the checkbox "I am 16 or older." (GDPR Art. 8
  consent-age default.)
- **Impressum & Datenschutzerklärung: written and wired** (site pages +
  `services/boards/src/legal.js`, linked from every footer). Operator: vorausgedacht.at e.U.
  (ECG §5 block incl. FN/GISA/Gewerbebehörde; MedienG §25 disclosure). The
  Datenschutzerklärung mirrors the inventory above: purposes and legal bases, processors (AWS
  in an EU region with its DPA; Fastmail for system mail, US servers under its DPA with the
  2021 SCCs; GitHub for Retrospace submissions), retention, rights, and the supervisory
  authority.

## 10 · ASCII wireframes

Desktop, 2001-approved. All three collapse gracefully, notes under each. The wireframes are
illustrative, not pixel-contracts: the shipped stats footer, for one, counts threads and
posts, not members.

**Board index (`/`):**

```text
┌─ Retrostrap Boards ─────────────────────────────────────────────────┐
│ [Gif ^..^]  Build like it's 2026, look like it's 1999.              │
│ Home · Register · Login · Search                        (rs-window) │
├─────────────────────────────────────────────────────────────────────┤
│ Boards »                                          (rs-breadcrumbs)  │
├──────────────────────────────────┬─────────┬───────┬────────────────┤
│ Board                 (rs-table) │ Threads │ Posts │ Last post      │
├──────────────────────────────────┼─────────┼───────┼────────────────┤
│ ▸ Retrostrap Talk                │      42 │   512 │ by mika, 14:02 │
│   Help, showcase, development    │         │       │                │
│ ▸ The Off-Topic Lounge           │      17 │   203 │ by ada, 11:30  │
│   Everything that isn't the fw   │         │       │                │
│ ▸ Der Stammtisch                 │      23 │   341 │ von resi, 9:15 │
│   Deutschsprachiges Board        │         │       │                │
├──────────────────────────────────┴─────────┴───────┴────────────────┤
│ (rs-panel) 87 members · 1,056 posts · newest member: kim            │
└─────────────────────────────────────────────────────────────────────┘
```

Mobile: the `rs-table` stacks to a single-column list; thread/post counts and last-post line
move inline under each board name.

**Thread view (`/threads/:id`):**

```text
┌─ Boards » Retrostrap Talk » Bevel or flat ──────────(rs-breadcrumbs)┐
│ [ Post reply ]                    Page 1 of 3 ‹ 1 2 3 › (rs-pagin.) │
├───────────────┬─────────────────────────────────────────────────────┤
│ mika          │ Posted: 2026-11-03 14:02            [quote] [edit]  │
│ Old-Timer     ├─────────────────────────────────────────────────────┤
│ ★★★★          │ Flat borders are just bevels that gave up. :)       │
│ ┌──────────┐  │                                                     │
│ │ 80×80 px │  │ ┌ rs-quote ────────────────────────────┐            │
│ │rs-avatar │  │ │ ada wrote: radius 0 is a lifestyle   │            │
│ └──────────┘  │ └──────────────────────────────────────┘            │
│ Posts: 214    │ ────────────────────────────────────────            │
│ From: Graz    │ mika.example, pixels since 1997     (rs-quote__sig)│
├───────────────┴─────────────────────────────────────────────────────┤
│ ada · Regular · ★★★  …next post row…                                │
└──────────────────────────────────────────────────────────────────────┘
```

Mobile: the author column folds into a one-line header strip above each post body (name ·
rank badge · time); the full profile card sits behind the name link.

**Post composer (`/threads/:id/reply`):**

```text
┌─ Post a reply, Bevel or flat ───────────────────────(rs-window)────┐
│ [B] [I] [U] [S] [URL] [IMG] [QUOTE] [CODE] [SPOILER] [COLOR ▾]      │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ [quote=mika]Flat borders are just bevels that gave up.[/quote]  │ │
│ │ Strong disagree, and I brought screenshots ;)                   │ │
│ │                                                                 │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│ Smilies: :)  ;)  :D  :P  :(  :o  8)                                 │
│ (rs-panel) New members: links unlock after 3 posts, images after 10 │
│ [ Preview ]  [ Submit ]              plain POST, no JS required    │
└──────────────────────────────────────────────────────────────────────┘
```

Mobile: the toolbar wraps to two rows, the textarea goes full-width, and the smiley strip
scrolls horizontally inside its own `overflow-x` container, the page itself never scrolls
sideways.

---

*Siblings: [design language](02-design-language.md) · [Retrospace](12-retrospace.md). The
Boards launch with the project; the culture starts on day one. Bring coffee.*
