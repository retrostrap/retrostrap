# Security policy

Retrostrap is CSS and client-side JS with zero runtime dependencies, but
"it's just CSS" opens many a good vulnerability write-up. XSS in a widget,
HTML injection via a snippet, anything: we want to know privately first.

## Reporting

Use GitHub's private vulnerability reporting (Security → Report a
vulnerability), or mail security@retrostrap.dev. Please, no public issues
for suspected vulnerabilities. We acknowledge within 72 hours and aim to
ship a fix within 14 days.

## Supported versions

| Version            | Supported                                     |
|--------------------|-----------------------------------------------|
| latest 0.x minor   | yes                                           |
| anything older     | no, upgrading is painless, see MIGRATIONS.md |

After 1.0: the latest minor of the newest major gets all fixes; the previous
major gets critical fixes for six months.
