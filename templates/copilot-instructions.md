<!--
  Copy to .github/copilot-instructions.md, GitHub Copilot reads it automatically.
  This is the compact form of AGENTS.md (repo root); keep AGENTS.md for the full
  rules, the extending section, and the worked example. Copilot has no import, so the
  essentials are inline here.
-->

# retrostrap: Copilot instructions

This project uses **retrostrap**, a zero-dependency retro CSS+JS framework. Stay inside its
five laws, `Retrostrap.audit()` enforces them, and a violation means fix the markup, not the
auditor. Full guidance in `AGENTS.md`. The essentials:

1. **Color**: only the 216 web-safe values + 16 named colors, opaque; style via `--rs-*` tokens.
2. **Type**: only the nine `--rs-font-*` stacks; sizes from the `rs-font-1`…`7` scale.
3. **Shape**: `border-radius: 0` always; shadows `0` blur; rounding only via `border-image`.
4. **Motion**: easing `linear` or `steps()` only; honor `prefers-reduced-motion`.
5. **Decency**: no autoplay, no tracking, no external requests; CSS works without JS.

Framework classes are `rs-`; put **your** components under `rsx-` and new tokens under
`--rsx-`. Compose pages from `cheatsheet.md` snippets; at most two decorative widgets per
page; real landmarks and ordered headings; label every input; keep focus outlines.

For the full rules, composing, extending, the worked example, read `AGENTS.md` and the
machine surfaces: `cheatsheet.md`, `guardrails.json`, `manifest.json`, and the
`retrostrap-mcp` server.
