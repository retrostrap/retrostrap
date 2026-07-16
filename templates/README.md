# Assistant templates

Drop-in instructions files so an AI coding assistant builds and extends **retrostrap**
pages *correctly*, inside the five laws, instead of drifting modern. The same closed
vocabulary that keeps humans on-era keeps machines on-era; these files hand the assistant
that vocabulary and the guardrails up front.

## What's here

| File | For | How to use |
| --- | --- | --- |
| `AGENTS.md` | The cross-tool standard, Cursor, Windsurf, Zed, Aider, and others read it | Copy to your **repo root** |
| `CLAUDE.md` | Claude Code | Copy to your **repo root** (it `@`-imports `AGENTS.md`, so keep both) |
| `copilot-instructions.md` | GitHub Copilot | Copy to **`.github/copilot-instructions.md`** |

The rules live in `AGENTS.md`; `CLAUDE.md` is a two-line wrapper that imports it. Copilot
has no import mechanism, so `copilot-instructions.md` carries a compact standalone copy
and points back at `AGENTS.md` for the full guidance.

## Using them

1. Copy `AGENTS.md` (and `CLAUDE.md` if you use Claude Code) into the root of the project
   where you build your retrostrap site.
2. Add any project-specific notes at the bottom, your assistant reads the whole file.
3. Keep them roughly in step with your installed retrostrap version. The rules are stable,
   but the authoritative specifics, the exact palette, font stacks, component list, live
   in the machine surfaces the template points at, so they stay fresh on their own:
   - `cheatsheet.md` (also at `/for-robots/`), the catalog in one file
   - `guardrails.json`: the laws as data
   - `manifest.json`: the structured catalog
   - the `retrostrap-mcp` server, search + audit tools

## Why bother

A model asked for "a retro website" with no guardrails produces a modern page in a nostalgic
costume. Given the closed palette, the `rs-`/`rsx-` namespaces, the easing whitelist, and
`Retrostrap.audit()`, it *can't* drift, and every page it generates strengthens the
aesthetic instead of diluting it. The constraint is the product.
