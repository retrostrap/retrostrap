// legal.js, the Impressum + Datenschutzerklärung (ECG § 5, MedienG § 25, DSGVO), the two
// pages every Austrian site has carried since the web arrived here. The operative German
// text mirrors site/impressum.md and site/datenschutz.md, keep the three in sync.
import { html } from './views.js';

/** The legal notice Austrian law requires; identical to the docs site's /impressum/. */
export function impressumView() {
  return html`
  <h1 class="rs-font-5">Impressum</h1>
  
  <p>Angaben nach § 5 E-Commerce-Gesetz (ECG) und Offenlegung nach § 25 Mediengesetz
  (MedienG). Dieses Impressum gilt für die Retrostrap Boards, für retrostrap.dev samt
  Demos und für Retrospace.</p>

  <h2 class="rs-font-4">Betreiber und Medieninhaber</h2>
  <p><strong>vorausgedacht.at e.U.</strong><br>
  Inhaber: Mag. Stefan Gündhör<br>
  Steinfeld 7<br>
  4213 Unterweitersdorf<br>
  Österreich</p>
  <p>E-Mail: <a href="mailto:info@vorausgedacht.at">info@vorausgedacht.at</a><br>
  Telefon: +43 660 12 0 12 88</p>
  <p>Firmenbuchnummer: FN 678036m<br>
  Firmenbuchgericht: Landesgericht Linz<br>
  GISA-Zahl: 39257062<br>
  Mitglied der Wirtschaftskammer Oberösterreich<br>
  Gewerbebehörde: Bezirkshauptmannschaft Freistadt<br>
  Anwendbare Rechtsvorschriften: Gewerbeordnung 1994 (GewO), abrufbar unter
  <a href="https://www.ris.bka.gv.at" rel="noopener">ris.bka.gv.at</a></p>
  <p>vorausgedacht.at e.U. ist zugleich Medieninhaber und Herausgeber dieser Website und
  der oben genannten Dienste.</p>

  <h2 class="rs-font-4">Zweck der Website (Unternehmensgegenstand)</h2>
  <p>Unternehmensgegenstand von vorausgedacht.at e.U. sind Informations- und
  Vermittlungsservices, insbesondere rund um Edelmetalle. retrostrap ist ein
  nichtkommerzielles Open-Source-Projekt, das der Inhaber unter dem Namen des
  Unternehmens veröffentlicht: ein CSS- und JavaScript-Framework, das Websites aussehen
  lässt wie 1996 bis 2003, dazu Dokumentation, Demos, ein kleines Forum (die Retrostrap
  Boards) und ein kuratiertes Verzeichnis (Retrospace). Wir verkaufen hier nichts und
  schalten keine Werbung.</p>
  <p>Grundlegende Richtung: Dokumentation, Hilfe und Austausch rund um das
  retrostrap-Framework und die Kultur des frühen Web.</p>

  <h2 class="rs-font-4">Beiträge von Mitgliedern</h2>
  <p>Beiträge auf den Boards und Einträge im Gästebuch stammen von ihren Verfassern und
  geben deren Sicht wieder. Wir moderieren offen und nach den auf den Boards
  veröffentlichten Regeln; rechtswidrige Inhalte entfernen wir, sobald wir von ihnen
  erfahren. Hinweise bitte an die oben genannte E-Mail-Adresse.</p>

  <h2 class="rs-font-4">Haftung für Links</h2>
  <p>Diese Seiten verlinken auf fremde Websites, gern und oft, so war das Web gedacht. Für
  deren Inhalte sind die jeweiligen Betreiber verantwortlich. Zum Zeitpunkt der Verlinkung
  war für uns nichts Rechtswidriges erkennbar; wird uns etwas gemeldet, entfernen wir den
  betreffenden Link.</p>

  <h2 class="rs-font-4">Urheberrecht</h2>
  <p>Der Quellcode von retrostrap steht unter der MIT-Lizenz und darf entsprechend frei
  verwendet werden. Texte und Grafiken gehören dem Betreiber, soweit nicht anders
  angegeben.</p>

  <h2 class="rs-font-4">Datenschutz</h2>
  <p>Welche Daten hier anfallen und was mit ihnen passiert, steht in der
  <a href="/datenschutz">Datenschutzerklärung</a>.</p>

  <h2 class="rs-font-4">English summary</h2>
  <p>This is the legal notice Austrian law requires of every website operator (§ 5 ECG,
  § 25 MedienG). The Boards, the docs site, and Retrospace are operated by
  vorausgedacht.at e.U. (owner: Mag. Stefan Gündhör), Steinfeld 7, 4213 Unterweitersdorf,
  Austria; commercial register FN 678036m, Landesgericht Linz; contact:
  info@vorausgedacht.at. Forum posts and guestbook entries belong to their authors;
  report unlawful content to the address above and we will act. Linked sites are their
  operators' responsibility. retrostrap's source code is MIT-licensed. The German text
  above is the operative version.</p>`;
}

/** The privacy policy; identical to the docs site's /datenschutz/. */
export function datenschutzView() {
  return html`
  <h1 class="rs-font-5">Datenschutzerklärung</h1>
  
  <p>Stand: 16. Juli 2026</p>

  <h2 class="rs-font-4">Der kurze Teil</h2>
  <p>Wir betreiben diese Seiten wie 1999, auch beim Datenschutz: keine Analyse-Tools,
  keine Werbenetzwerke, keine Tracking-Pixel, kein Fingerprinting, keine Weitergabe deiner
  Daten für fremde Zwecke. Wir erheben nur, was die jeweilige Funktion wirklich braucht,
  und löschen, was wir nicht mehr brauchen. Der Rest dieser Seite führt das im Detail
  aus.</p>

  <h2 class="rs-font-4">Verantwortlicher</h2>
  <p><strong>vorausgedacht.at e.U.</strong><br>
  Inhaber: Mag. Stefan Gündhör<br>
  Steinfeld 7<br>
  4213 Unterweitersdorf<br>
  Österreich</p>
  <p>E-Mail: <a href="mailto:info@vorausgedacht.at">info@vorausgedacht.at</a></p>
  <p>Für jedes Datenschutzanliegen genügt eine formlose E-Mail an diese Adresse.</p>

  <h2 class="rs-font-4">Die Website (retrostrap.dev)</h2>
  <p>Die Dokumentationsseiten und Demos sind statische Dateien. Sie setzen keine Cookies,
  verlangen kein Konto und laden nichts von fremden Servern. Wählst du dort ein Theme oder
  den Komfort-Modus, merkt sich dein Browser diese Einstellung im localStorage: auf deinem
  Gerät, nur dort. Sie wird an niemanden übertragen, auch nicht an uns.</p>
  <p>Zum Hosting bei AWS siehe unten unter "Empfänger und Auftragsverarbeiter". Beim
  Betrieb fallen dort technische Diagnoseprotokolle der Serverless-Funktionen an (Start,
  Laufzeit, Fehlermeldungen). Unsere Software schreibt keine IP-Adressen und keine
  Nutzungsprofile in diese Protokolle, sie werden nach sieben Tagen automatisch
  gelöscht, und Zugriffsprotokolle des CDN haben wir nicht aktiviert.</p>

  <h2 class="rs-font-4">Die Boards (boards.retrostrap.dev)</h2>
  <p>Das Forum ist der einzige Teil des Projekts mit Konten. Lesen geht ohne Konto; zum
  Schreiben brauchst du eines.</p>

  <h3 class="rs-font-3">Kontodaten</h3>
  <p>Bei der Registrierung erheben wir: Anzeigename, E-Mail-Adresse und ein Passwort. Das
  Passwort speichern wir ausschließlich als kryptografischen Hash (argon2id), nie im
  Klartext. Dazu kommen der Registrierungszeitpunkt und der Bestätigungsstatus deiner
  E-Mail-Adresse.</p>
  <p>Rechtsgrundlage: Art 6 Abs 1 lit b DSGVO (die Vereinbarung über dein Mitgliedskonto).
  Speicherdauer: bis zur Löschung deines Kontos. Die Registrierung setzt voraus, dass du
  16 Jahre oder älter bist.</p>

  <h3 class="rs-font-3">Beiträge</h3>
  <p>Deine Beiträge und der Anzeigename dabei sind öffentlich und für Suchmaschinen
  auffindbar; das ist der Zweck eines Forums. Rechtsgrundlage: Art 6 Abs 1 lit b DSGVO.
  Beiträge bleiben auch nach einer Kontolöschung erhalten, damit Gespräche lesbar bleiben
  (Art 17 Abs 3 DSGVO); als Verfasser steht dann "Guest" beziehungsweise "Gast" (siehe
  "Konto löschen").</p>
  <p>Meldest du einen Beitrag, speichern wir die Meldung samt Grund und deinem Konto, bis
  sie erledigt ist. Moderationsentscheidungen (etwa das Entfernen eines Beitrags) werden
  intern mit Grund, handelnder Person und Zeitpunkt protokolliert. Rechtsgrundlage: Art 6
  Abs 1 lit f DSGVO (unser berechtigtes Interesse an einem nachvollziehbar moderierten
  Forum).</p>

  <h3 class="rs-font-3">Cookies</h3>
  <p>Die Boards setzen genau zwei Cookies, beide technisch notwendig. Deshalb gibt es
  keinen Cookie-Banner (§ 165 Abs 3 TKG 2021; Art 6 Abs 1 lit b und f DSGVO):</p>
  <table class="rs-table rs-table--data">
    <thead><tr><th scope="col">Cookie</th><th scope="col">Zweck</th><th scope="col">Wer bekommt es</th><th scope="col">Laufzeit</th></tr></thead>
    <tbody>
      <tr><th scope="row"><code>__Host-sid</code></th><td>hält dich angemeldet (signiertes Sitzungs-Token)</td><td>nur angemeldete Mitglieder</td><td>30 Tage</td></tr>
      <tr><th scope="row"><code>__Host-csrf</code></th><td>schützt Formulare gegen Fälschung (CSRF)</td><td>alle Besucher der Boards</td><td>30 Tage</td></tr>
    </tbody>
  </table>
  <p>Beide sind HttpOnly, Secure und SameSite=Lax und gelten nur für die
  Boards-Subdomain; die übrige Website bleibt cookiefrei. Die Sitzung selbst steckt im
  Cookie: serverseitig führen wir keine Sitzungsliste, nur einen Zeitstempel je Konto, mit
  dem sich alle Sitzungen auf einmal widerrufen lassen, etwa nach einem Passwort-Reset.</p>

  <h3 class="rs-font-3">E-Mail</h3>
  <p>Deine E-Mail-Adresse verwenden wir nur für: die Bestätigung bei der Registrierung,
  das Zurücksetzen des Passworts und den Hinweis, falls jemand versucht, mit deiner
  Adresse ein weiteres Konto anzulegen. Bestätigungs- und Reset-Links sind kurzlebig und
  nur einmal verwendbar. Sollten die Boards später abonnierbare Themen-Zusammenfassungen
  bekommen, gibt es sie nur auf deine ausdrückliche Bestellung hin (Art 6 Abs 1 lit a
  DSGVO, jederzeit widerrufbar, Abmeldelink in jeder Mail). Werbung per E-Mail gibt es
  nie.</p>

  <h3 class="rs-font-3">Schutz vor Missbrauch</h3>
  <p>Beim Registrieren, Anmelden, Posten und beim Passwort-Reset zählen wir Versuche je
  Konto und je IP-Adresse, damit niemand Passwörter durchprobieren oder das Forum mit Spam
  fluten kann. Diese Zähler verfallen nach 15 Minuten bis zu einer Stunde und werden
  automatisch gelöscht; ein dauerhaftes Protokoll deiner IP-Adresse führen wir nicht.
  Rechtsgrundlage: Art 6 Abs 1 lit f DSGVO (berechtigtes Interesse an der Sicherheit des
  Dienstes).</p>

  <h3 class="rs-font-3">Konto löschen</h3>
  <p>Schreib eine formlose E-Mail an info@vorausgedacht.at; wir löschen
  binnen eines Monats. Gelöscht werden E-Mail-Adresse, Passwort-Hash und Profildaten; alle
  Sitzungen enden. Deine Beiträge bleiben erhalten und zeigen als Verfasser "Guest", auf
  dem deutschsprachigen Board "Gast". Sollen zusätzlich bestimmte Inhalte entfernt werden,
  weil sie personenbezogene Daten enthalten, melde den Beitrag oder schreib uns dazu.</p>

  <h3 class="rs-font-3">Datenexport</h3>
  <p>Auf Anfrage per E-Mail bekommst du eine maschinenlesbare Kopie deiner Profildaten und
  Beiträge (Art 20 DSGVO), ebenfalls binnen eines Monats.</p>

  <h2 class="rs-font-4">Gästebuch und Besucherzähler</h2>
  <p>Der Besucherzähler zählt Seitenaufrufe, keine Menschen: keine IP-Adresse, kein
  Browser-Merkmal, kein Identifikator, nur eine Zahl je Seite.</p>
  <p>Ins Gästebuch schreibst du selbst, was erscheinen soll: einen Namen (oder keinen,
  dann steht dort "Guest"), optional einen Ort und eine Homepage-Adresse, und deine
  Nachricht; dazu speichern wir den Zeitpunkt des Eintrags. Einträge sind sofort
  öffentlich. Eine IP-Adresse wird nicht gespeichert. Rechtsgrundlage: Art 6 Abs 1 lit b
  DSGVO (du bittest um die Veröffentlichung deines Eintrags). Einträge bleiben stehen, bis
  du ihre Löschung verlangst; eine E-Mail genügt.</p>

  <h2 class="rs-font-4">Retrospace (das Verzeichnis)</h2>
  <p>Das Verzeichnis kommt ohne Personenbezug aus: Stöbern und Suchen laufen in deinem
  Browser über eine statische Liste, und die Toplist zählt Klicks, nicht Personen (keine
  IP, kein Identifikator).</p>
  <p>Reichst du eine Website ein, übermittelst du: URL, Titel, Kurzbeschreibung,
  Kategorien, Sprachen und Schlagworte. Namen oder E-Mail-Adressen fragen wir nicht ab.
  Die Einreichung wird als öffentlich einsehbares Issue in unserem GitHub-Repository
  angelegt; dort prüft sie ein Mensch. Was du einreichst, wird damit öffentlich, reich
  also nur ein, was öffentlich sein darf. Rechtsgrundlage: Art 6 Abs 1 lit b DSGVO.</p>

  <h2 class="rs-font-4">Empfänger und Auftragsverarbeiter</h2>
  <p>Wir geben Daten nur an die Dienstleister weiter, ohne die der Betrieb nicht geht,
  jeweils auf Grundlage eines Auftragsverarbeitungsvertrags (Art 28 DSGVO):</p>
  <ul class="rs-list">
    <li><strong>Amazon Web Services EMEA SARL</strong>, 38 Avenue John F. Kennedy, L-1855
    Luxemburg: Hosting, Speicherung und Auslieferung (S3, CloudFront, Lambda, DynamoDB).
    Gespeichert und verarbeitet wird in einer EU-Region; die Auslieferung über das CDN
    nutzt Edge-Standorte in Europa und Nordamerika. Grundlage für Übermittlungen in die
    USA sind der AWS-Auftragsverarbeitungsvertrag mit EU-Standardvertragsklauseln sowie
    die Zertifizierung von Amazon unter dem EU-US Data Privacy Framework.</li>
    <li><strong>Fastmail Pty Ltd</strong>, PO Box 234, Collins Street West VIC 8007,
    Australien: versendet die Systemmails der Boards (Bestätigung, Passwort-Reset,
    Konto-Hinweise) über unser Postfach und sieht dabei deine E-Mail-Adresse und den
    Inhalt dieser Mails. Die Server des Dienstes stehen in den USA; Grundlage der
    Übermittlung sind der Auftragsverarbeitungsvertrag von Fastmail und die
    EU-Standardvertragsklauseln (2021).</li>
    <li><strong>GitHub, Inc.</strong>, 88 Colin P. Kelly Jr. Street, San Francisco, CA
    94107, USA: nimmt Retrospace-Einreichungen als Issues entgegen (siehe oben). GitHub
    ist unter dem EU-US Data Privacy Framework zertifiziert.</li>
  </ul>
  <p>Darüber hinaus geben wir Daten nur weiter, wenn uns ein Gesetz dazu verpflichtet.</p>

  <h2 class="rs-font-4">Deine Rechte</h2>
  <p>Du hast nach der DSGVO das Recht auf Auskunft (Art 15), Berichtigung (Art 16),
  Löschung (Art 17), Einschränkung der Verarbeitung (Art 18), Datenübertragbarkeit
  (Art 20) und Widerspruch (Art 21). Eine erteilte Einwilligung kannst du jederzeit
  widerrufen (Art 7 Abs 3). Eine formlose E-Mail an info@vorausgedacht.at
  genügt; wir antworten binnen eines Monats.</p>
  <p>Wenn du meinst, dass wir deine Daten rechtswidrig verarbeiten, kannst du dich bei der
  Aufsichtsbehörde beschweren: Österreichische Datenschutzbehörde, Barichgasse 40-42,
  1030 Wien, <a href="https://www.dsb.gv.at/" rel="noopener">dsb.gv.at</a>.</p>

  <h2 class="rs-font-4">Was es hier nicht gibt</h2>
  <p>Keine Analyse- oder Statistik-Tools, keine Werbung, keine Tracking-Pixel, keine
  Social-Media-Einbettungen, keine Schriften von fremden Servern, kein Profiling, keine
  automatisierte Entscheidungsfindung. Unsere "Statistik" ist der Blick in die eigene
  Datenbank: Beiträge pro Woche, mehr wissen wir nicht, und mehr wollen wir nicht
  wissen.</p>

  <h2 class="rs-font-4">Änderungen</h2>
  <p>Ändert sich etwas an dieser Erklärung, etwa weil ein neuer Dienst dazukommt,
  aktualisieren wir diese Seite und das Datum oben. Auf einschneidende Änderungen weisen
  wir auf den Boards hin.</p>

  <h2 class="rs-font-4">English summary</h2>
  <p>The German text above is the operative privacy policy; this is a courtesy summary.
  The docs site is static: no cookies, no trackers, and your theme choice never leaves
  your browser. The Boards store what a forum needs: display name, email address, an
  argon2id password hash, and your posts (public by design). Exactly two strictly
  necessary cookies, <code>__Host-sid</code> and <code>__Host-csrf</code> (HttpOnly,
  Secure, SameSite=Lax, 30 days, this subdomain only), hence no consent banner. Email is
  used for verification, password resets, and account notices only, never marketing; a
  future thread digest would be strictly opt-in. Rate limiting counts attempts per
  account and per IP for 15 to 60 minutes, then the counters expire. Erasure: email us;
  account data is purged within a month, posts remain with authorship shown as
  "Guest"/"Gast" (Art 17(3) GDPR); a machine-readable export is available on request. The
  guestbook stores only what you type plus a timestamp, no IP; the hit counter stores a
  number, never an identifier; Retrospace submissions become a public GitHub issue and
  its toplist counts clicks, not people. Processors: AWS (EU storage region, DPA with
  standard contractual clauses, EU-US Data Privacy Framework), Fastmail (system mail;
  US servers, DPA with the 2021 EU standard contractual clauses), and GitHub.
  Supervisory authority: the Austrian Datenschutzbehörde, Barichgasse 40-42, 1030 Wien,
  dsb.gv.at. Contact: info@vorausgedacht.at.</p>`;
}
