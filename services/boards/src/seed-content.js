// seed-content.js, the launch content, transcribed verbatim from docs/11 (the forum spec):
// exactly three boards and the four Webmaster-authored pinned threads, whose opening posts are the
// Netiquette charters (English and German). BBCode, since that is what a post is; the renderer turns
// newlines into <br> and [b] into <strong>. Keep this in step with docs/11 sections 3-5.

// docs/11 section 4: the English Netiquette, opening post of "START HERE: The Netiquette".
const NETIQUETTE_EN = `[b]The Netiquette of Retrostrap Boards[/b]

Welcome, traveller. Wipe your feet, the hit counter has already counted you.

This is a slow forum. There is no feed, no algorithm, no like button, and nothing here is trying to keep you "engaged". There are only people, posts, and time. Twelve rules keep it that way, in truth one rule with eleven footnotes, and the one rule is the oldest on the net:

1. [b]Remember the human.[/b] RFC 1855 said it in 1995 and it has not expired. Behind every post is a person with a keyboard, a mug of something, and a day you know nothing about. Write to the person, not at the screen.
2. [b]Assume good faith.[/b] Terseness is usually haste, not hostility. Ask before you take offense; it turns away nine of ten flame wars at the door.
3. [b]Search before asking.[/b] The search box is humble but hard-working. If you find an old thread that almost answers you, reply to it, which brings us to:
4. [b]Necroposting is welcome here.[/b] If you add something new, an old thread waking up after three years is a feature, not a faux pas. We are a slow forum and proud of it.
5. [b]Greet the newcomers.[/b] Nobody is "just a Newbie", every Old-Timer's post count once said zero. A hello in "Introduce yourself!" costs nothing and makes a member out of a lurker.
6. [b]Disagree with arguments, not with people.[/b] Attack the idea as hard as you like; leave its author standing.
7. [b]Quote sparingly.[/b] Trim the quote to the lines you are actually answering. Nobody enjoys reading the same post twice, slightly indented.
8. [b]Stay on the board's topic.[/b] Framework talk in Retrostrap Talk, everything else in the Lounge, alles auf Deutsch am Stammtisch. New subject? Start a new thread, threads are free.
9. [b]Keep your signature to three lines.[/b] Your post should always be longer than your name.
10. [b]Thank people by replying.[/b] There is no like button, and that is not a missing feature, it is the whole point. A written "thanks, that fixed it" helps the next person who searches; a thumbs-up helps no one.
11. [b]Moderation is transparent.[/b] Anything removed says so, in public, with a reason. No silent edits, no shadow bans, no memory holes.
12. [b]The Sysops' word is final, and appealable.[/b] If you think a call was wrong, write to the Webmaster and say so, calmly. That is not rebellion; that is the system working as designed.

That's the whole law. Pull up a chair, introduce yourself, and remember: behind every avatar there is a human, probably reheating their coffee.

Yours, the Sysops & the Webmaster`;

// docs/11 section 5: the German Netiquette, opening post of "Welcome / Vorstellungsrunde".
const NETIQUETTE_DE = `[b]Die Netiquette[/b]

Willkommen am Stammtisch!

Nimm dir einen Stuhl und stell was zu trinken ab, Kaffee, Tee oder Almdudler, wir sind da nicht streng. Das hier ist ein langsames Forum: kein Feed, kein Algorithmus, keine Likes. Nur Menschen, Beiträge und Zeit. Damit das gemütlich bleibt, haben wir zwölf Hausregeln. Eigentlich ist es nur eine, der Rest sind Fußnoten:

1. [b]Denk an den Menschen.[/b] Hinter jedem Beitrag sitzt wer mit Tastatur, Tagesform und Gefühlen. Schreib nichts, was du der Person am Wirtshaustisch nicht über den Tisch sagen würdest.
2. [b]Geh vom Guten aus.[/b] Ein knapper Beitrag ist meistens Eile, keine Unfreundlichkeit. Frag nach, bevor du dich ärgerst, das erspart neun von zehn Streitereien.
3. [b]Erst suchen, dann fragen.[/b] Die Forensuche ist unscheinbar, aber fleißig. Und wenn du ein altes Thema findest, das fast passt: antworte einfach dort weiter.
4. [b]Alte Themen ausgraben ist keine Sünde.[/b] Wenn du etwas Neues beizutragen hast, freut sich das Thema über die zweite Jugend. Wir sind langsam, und wir sind stolz drauf.
5. [b]Begrüß die Neuen.[/b] Ein „Servus" in der Vorstellungsrunde kostet nichts und macht aus einem Gast ein Mitglied. Niemand ist hier „nur ein Newbie".
6. [b]Streite über Argumente, nie über Personen.[/b] Harte Sache, weiches Herz.
7. [b]Zitiere sparsam.[/b] Nur die Zeilen, auf die du wirklich antwortest, niemand liest gern denselben Beitrag zweimal, nur eingerückt.
8. [b]Bleib beim Thema des Themas.[/b] Der Stammtisch ist für alles offen, aber jedes Gespräch kriegt seinen eigenen Faden. Ein neues Thema aufzumachen kostet nichts.
9. [b]Signatur: höchstens drei Zeilen.[/b] Dein Beitrag soll länger sein als dein Name.
10. [b]Bedank dich mit einem Beitrag.[/b] Einen Like-Button gibt es hier absichtlich nicht. Ein ehrliches „Danke, hat funktioniert!" ist mehr wert als hundert Daumen, und hilft der nächsten Person, die danach sucht.
11. [b]Moderation passiert offen.[/b] Wenn ein Beitrag entfernt wird, steht dort, warum. Immer. Keine stillen Löschungen, keine Schattenbanne.
12. [b]Das Wort der Sysops gilt, Einspruch ist erlaubt.[/b] Wenn du eine Entscheidung für falsch hältst, schreib in Ruhe dem Webmaster. Das ist kein Aufstand, das ist so vorgesehen.

[b]Hausregeln, die nur für den Stammtisch gelten:[/b]

- Die Boardsprache ist Deutsch, in allen Spielarten. Ob „Jänner" oder „Januar", „parkieren" oder „parken": regionale Vielfalt ist hier ein Feature, kein Tippfehler.
- Gäste, die nur Englisch können, sind trotzdem herzlich willkommen. Wenn's geht, antworten wir zweisprachig.
- Wir sind per Du. Das war am Stammtisch schon immer so, und dabei bleibt's.

Und jetzt: Stell dich vor! :)

Bis bald, deine Sysops & der Webmaster`;

export const boards = [
  { slug: 'talk', name: 'Retrostrap Talk', position: 0, description: 'Help, showcase, and framework development, everything retrostrap. Ask anything: the only silly question is the one you sat on for a week.' },
  { slug: 'lounge', name: 'The Off-Topic Lounge', position: 1, description: "Everything that isn't retrostrap: old hardware, web nostalgia, music, life. Keep it kind, keep it legal, keep it (vaguely) interesting." },
  { slug: 'stammtisch', name: 'Der Stammtisch', position: 2, lang: 'de', description: 'Das deutschsprachige Board für alles: retrostrap, Webnostalgie, Gott und die Welt. Wir sind per Du, setz dich dazu, die Runde rückt gern zusammen.' },
];

export const threads = [
  { board: 'talk', pinned: true, title: 'START HERE: The Netiquette', body: NETIQUETTE_EN },
  { board: 'talk', pinned: true, title: 'Introduce yourself!', body: 'One thread, all of us. Who are you, what do you build, and what was your first browser?' },
  { board: 'talk', pinned: true, title: 'Show us your site!', body: 'Built something with retrostrap? Post the link. Screenshots welcome, <marquee> doubly so.' },
  { board: 'stammtisch', pinned: true, title: 'Welcome / Vorstellungsrunde', body: NETIQUETTE_DE },
];

export const seedContent = { boards, threads };
