---
layout: base.njk
title: Datenschutz
mainClass: site-prose
description: "Datenschutzerklärung für retrostrap.dev, die Retrostrap Boards und Retrospace. Privacy policy, with an English summary at the end."
---

# Datenschutzerklärung

Stand: 16. Juli 2026

## Der kurze Teil

Wir betreiben diese Seiten wie 1999, auch beim Datenschutz: keine Analyse-Tools, keine Werbenetzwerke, keine Tracking-Pixel, kein Fingerprinting, keine Weitergabe deiner Daten für fremde Zwecke. Wir erheben nur, was die jeweilige Funktion wirklich braucht, und löschen, was wir nicht mehr brauchen. Der Rest dieser Seite führt das im Detail aus.

## Verantwortlicher

<p><strong>vorausgedacht.at e.U.</strong><br>
Inhaber: Mag. Stefan Gündhör<br>
Steinfeld 7<br>
4213 Unterweitersdorf<br>
Österreich</p>

E-Mail: <a href="mailto:info@vorausgedacht.at">info@vorausgedacht.at</a>

Für jedes Datenschutzanliegen genügt eine formlose E-Mail an diese Adresse.

## Die Website (retrostrap.dev)

Die Dokumentationsseiten und Demos sind statische Dateien. Sie setzen keine Cookies, verlangen kein Konto und laden nichts von fremden Servern.

Wählst du auf der Seite ein Theme oder den Komfort-Modus, merkt sich dein Browser diese Einstellung im localStorage: auf deinem Gerät, nur dort. Sie wird an niemanden übertragen, auch nicht an uns.

Zum Hosting bei AWS siehe unten unter "Empfänger und Auftragsverarbeiter". Beim Betrieb fallen dort technische Diagnoseprotokolle der Serverless-Funktionen an (Start, Laufzeit, Fehlermeldungen). Unsere Software schreibt keine IP-Adressen und keine Nutzungsprofile in diese Protokolle, sie werden nach sieben Tagen automatisch gelöscht, und Zugriffsprotokolle des CDN haben wir nicht aktiviert.

## Die Boards (boards.retrostrap.dev)

Das Forum ist der einzige Teil des Projekts mit Konten. Lesen geht ohne Konto; zum Schreiben brauchst du eines.

### Kontodaten

Bei der Registrierung erheben wir: Anzeigename, E-Mail-Adresse und ein Passwort. Das Passwort speichern wir ausschließlich als kryptografischen Hash (argon2id), nie im Klartext. Dazu kommen der Registrierungszeitpunkt und der Bestätigungsstatus deiner E-Mail-Adresse.

Rechtsgrundlage: Art 6 Abs 1 lit b DSGVO (die Vereinbarung über dein Mitgliedskonto). Speicherdauer: bis zur Löschung deines Kontos. Die Registrierung setzt voraus, dass du 16 Jahre oder älter bist.

### Beiträge

Deine Beiträge und der Anzeigename dabei sind öffentlich und für Suchmaschinen auffindbar; das ist der Zweck eines Forums. Rechtsgrundlage: Art 6 Abs 1 lit b DSGVO. Beiträge bleiben auch nach einer Kontolöschung erhalten, damit Gespräche lesbar bleiben (Art 17 Abs 3 DSGVO); als Verfasser steht dann "Guest" beziehungsweise "Gast" (siehe "Konto löschen").

Meldest du einen Beitrag, speichern wir die Meldung samt Grund und deinem Konto, bis sie erledigt ist. Moderationsentscheidungen (etwa das Entfernen eines Beitrags) werden intern mit Grund, handelnder Person und Zeitpunkt protokolliert. Rechtsgrundlage: Art 6 Abs 1 lit f DSGVO (unser berechtigtes Interesse an einem nachvollziehbar moderierten Forum).

### Cookies

Die Boards setzen genau zwei Cookies, beide technisch notwendig. Deshalb gibt es keinen Cookie-Banner (§ 165 Abs 3 TKG 2021; Art 6 Abs 1 lit b und f DSGVO):

| Cookie | Zweck | Wer bekommt es | Laufzeit |
| --- | --- | --- | --- |
| `__Host-sid` | hält dich angemeldet (signiertes Sitzungs-Token) | nur angemeldete Mitglieder | 30 Tage |
| `__Host-csrf` | schützt Formulare gegen Fälschung (CSRF) | alle Besucher der Boards | 30 Tage |

Beide sind HttpOnly, Secure und SameSite=Lax und gelten nur für die Boards-Subdomain; die übrige Website bleibt cookiefrei. Die Sitzung selbst steckt im Cookie: serverseitig führen wir keine Sitzungsliste, nur einen Zeitstempel je Konto, mit dem sich alle Sitzungen auf einmal widerrufen lassen, etwa nach einem Passwort-Reset.

### E-Mail

Deine E-Mail-Adresse verwenden wir nur für: die Bestätigung bei der Registrierung, das Zurücksetzen des Passworts und den Hinweis, falls jemand versucht, mit deiner Adresse ein weiteres Konto anzulegen. Bestätigungs- und Reset-Links sind kurzlebig und nur einmal verwendbar. Sollten die Boards später abonnierbare Themen-Zusammenfassungen bekommen, gibt es sie nur auf deine ausdrückliche Bestellung hin (Art 6 Abs 1 lit a DSGVO, jederzeit widerrufbar, Abmeldelink in jeder Mail). Werbung per E-Mail gibt es nie.

### Schutz vor Missbrauch

Beim Registrieren, Anmelden, Posten und beim Passwort-Reset zählen wir Versuche je Konto und je IP-Adresse, damit niemand Passwörter durchprobieren oder das Forum mit Spam fluten kann. Diese Zähler verfallen nach 15 Minuten bis zu einer Stunde und werden automatisch gelöscht; ein dauerhaftes Protokoll deiner IP-Adresse führen wir nicht. Rechtsgrundlage: Art 6 Abs 1 lit f DSGVO (berechtigtes Interesse an der Sicherheit des Dienstes).

### Konto löschen

Schreib eine formlose E-Mail an info@vorausgedacht.at; wir löschen binnen eines Monats. Gelöscht werden E-Mail-Adresse, Passwort-Hash und Profildaten; alle Sitzungen enden. Deine Beiträge bleiben erhalten und zeigen als Verfasser "Guest", auf dem deutschsprachigen Board "Gast". Sollen zusätzlich bestimmte Inhalte entfernt werden, weil sie personenbezogene Daten enthalten, melde den Beitrag oder schreib uns dazu.

### Datenexport

Auf Anfrage per E-Mail bekommst du eine maschinenlesbare Kopie deiner Profildaten und Beiträge (Art 20 DSGVO), ebenfalls binnen eines Monats.

## Gästebuch und Besucherzähler

Der Besucherzähler zählt Seitenaufrufe, keine Menschen: keine IP-Adresse, kein Browser-Merkmal, kein Identifikator, nur eine Zahl je Seite.

Ins Gästebuch schreibst du selbst, was erscheinen soll: einen Namen (oder keinen, dann steht dort "Guest"), optional einen Ort und eine Homepage-Adresse, und deine Nachricht; dazu speichern wir den Zeitpunkt des Eintrags. Einträge sind sofort öffentlich. Eine IP-Adresse wird nicht gespeichert. Rechtsgrundlage: Art 6 Abs 1 lit b DSGVO (du bittest um die Veröffentlichung deines Eintrags). Einträge bleiben stehen, bis du ihre Löschung verlangst; eine E-Mail genügt.

## Retrospace (das Verzeichnis)

Das Verzeichnis kommt ohne Personenbezug aus: Stöbern und Suchen laufen in deinem Browser über eine statische Liste, und die Toplist zählt Klicks, nicht Personen (keine IP, kein Identifikator).

Reichst du eine Website ein, übermittelst du: URL, Titel, Kurzbeschreibung, Kategorien, Sprachen und Schlagworte. Namen oder E-Mail-Adressen fragen wir nicht ab. Die Einreichung wird als öffentlich einsehbares Issue in unserem GitHub-Repository angelegt; dort prüft sie ein Mensch. Was du einreichst, wird damit öffentlich, reich also nur ein, was öffentlich sein darf. Rechtsgrundlage: Art 6 Abs 1 lit b DSGVO.

## Empfänger und Auftragsverarbeiter

Wir geben Daten nur an die Dienstleister weiter, ohne die der Betrieb nicht geht, jeweils auf Grundlage eines Auftragsverarbeitungsvertrags (Art 28 DSGVO):

- **Amazon Web Services EMEA SARL**, 38 Avenue John F. Kennedy, L-1855 Luxemburg: Hosting, Speicherung und Auslieferung (S3, CloudFront, Lambda, DynamoDB). Gespeichert und verarbeitet wird in einer EU-Region; die Auslieferung über das CDN nutzt Edge-Standorte in Europa und Nordamerika. Grundlage für Übermittlungen in die USA sind der AWS-Auftragsverarbeitungsvertrag mit EU-Standardvertragsklauseln sowie die Zertifizierung von Amazon unter dem EU-US Data Privacy Framework.
- **Fastmail Pty Ltd**, PO Box 234, Collins Street West VIC 8007, Australien: versendet die Systemmails der Boards (Bestätigung, Passwort-Reset, Konto-Hinweise) über unser Postfach und sieht dabei deine E-Mail-Adresse und den Inhalt dieser Mails. Die Server des Dienstes stehen in den USA; Grundlage der Übermittlung sind der Auftragsverarbeitungsvertrag von Fastmail und die EU-Standardvertragsklauseln (2021).
- **GitHub, Inc.**, 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, USA: nimmt Retrospace-Einreichungen als Issues entgegen (siehe oben). GitHub ist unter dem EU-US Data Privacy Framework zertifiziert.

Darüber hinaus geben wir Daten nur weiter, wenn uns ein Gesetz dazu verpflichtet.

## Deine Rechte

Du hast nach der DSGVO das Recht auf Auskunft (Art 15), Berichtigung (Art 16), Löschung (Art 17), Einschränkung der Verarbeitung (Art 18), Datenübertragbarkeit (Art 20) und Widerspruch (Art 21). Eine erteilte Einwilligung kannst du jederzeit widerrufen (Art 7 Abs 3). Eine formlose E-Mail an info@vorausgedacht.at genügt; wir antworten binnen eines Monats.

Wenn du meinst, dass wir deine Daten rechtswidrig verarbeiten, kannst du dich bei der Aufsichtsbehörde beschweren: Österreichische Datenschutzbehörde, Barichgasse 40-42, 1030 Wien, [dsb.gv.at](https://www.dsb.gv.at/).

## Was es hier nicht gibt

Keine Analyse- oder Statistik-Tools, keine Werbung, keine Tracking-Pixel, keine Social-Media-Einbettungen, keine Schriften von fremden Servern, kein Profiling, keine automatisierte Entscheidungsfindung. Unsere "Statistik" ist der Blick in die eigene Datenbank: Beiträge pro Woche, mehr wissen wir nicht, und mehr wollen wir nicht wissen.

## Änderungen

Ändert sich etwas an dieser Erklärung, etwa weil ein neuer Dienst dazukommt, aktualisieren wir diese Seite und das Datum oben. Auf einschneidende Änderungen weisen wir auf den Boards hin.

---

## English summary

The German text above is the operative privacy policy; this is a courtesy summary.

- The docs site is static: no cookies, no accounts, no trackers. Your theme choice lives in your browser's localStorage and never leaves your device. We enable no CDN access logs; the serverless diagnostics contain no IP addresses and are deleted after seven days.
- The Boards store what a forum needs: display name, email address, an argon2id password hash, and your posts (public by design). Exactly two strictly necessary cookies, `__Host-sid` and `__Host-csrf` (HttpOnly, Secure, SameSite=Lax, 30 days, boards subdomain only), hence no consent banner. Email is used for verification, password resets, and account notices only, never marketing; a future thread digest would be strictly opt-in. Rate limiting counts attempts per account and per IP for 15 to 60 minutes, then the counters expire automatically.
- Erasure: email us; account data is purged within a month, posts remain with authorship shown as "Guest"/"Gast" (Art 17(3) GDPR). Export: a machine-readable copy of your profile and posts on request.
- The guestbook stores only what you type plus a timestamp, no IP; the hit counter stores a number, never an identifier. Retrospace submissions (URL, title, blurb, categories, languages, tags) become a public GitHub issue; the toplist counts clicks, not people.
- Processors: AWS (EU storage region; DPA with standard contractual clauses; EU-US Data Privacy Framework), Fastmail (system mail; US servers, DPA with the 2021 EU standard contractual clauses), and GitHub. Supervisory authority: the Austrian Datenschutzbehörde, Barichgasse 40-42, 1030 Wien, dsb.gv.at. Contact: info@vorausgedacht.at.
