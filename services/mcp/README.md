# retrostrap-mcp

The catalog, conversationally. An [MCP](https://modelcontextprotocol.io) server that
hands a coding assistant the same catalog the docs are built from, so a model building
"a retro page" reaches for real `rs-` classes instead of inventing modern CSS. It's the
`~200-line wrapper` promised in [docs/09](../../docs/09-ai-integration.md), the manifest
does the work; this just answers questions about it.

## Tools

| Tool | Does |
| --- | --- |
| `search_catalog(query, kind?)` | find components, widgets, and themes by keyword |
| `get_snippet(id)` | the canonical copy-paste HTML for one entry, plus its a11y note |
| `get_theme(id)` | a theme's mood and exactly how to switch it on |
| `audit_html(html)` | check an HTML string against the five laws, with fix hints |

`audit_html` is a **static** pre-flight: it reads the inline `style=""` and `<style>`
blocks a generator writes and reports palette / shape / motion / font slips with the same
hint strings the real auditor uses. It can't see the cascade, so the in-browser
`Retrostrap.audit()` still has the final word on inherited colors and link underlines.
The feedback loop is the point (docs/09): generate → `audit_html` → feed the hints back →
regenerate.

## Run it

It publishes to npm as `retrostrap-mcp`; once it's up there, this is the whole setup:

```
npx retrostrap-mcp       # speaks MCP over stdio; the catalog ships inside
```

From a checkout, the server reads the repo's `dist/manifest.json`, so build first:

```
npm run build            # in the repo root, writes dist/manifest.json
cd services/mcp
npm install              # pulls the MCP SDK (transport only)
node src/server.js       # speaks MCP over stdio
```

The manifest resolves in this order: the `RETROSTRAP_MANIFEST` env var, the copy bundled
in the npm package, then the repo's `dist/manifest.json`.

Register it with any MCP client by pointing it at the server over stdio. Most clients take
a `command`/`args` stanza in their config:

```json
{
  "mcpServers": {
    "retrostrap": {
      "command": "npx",
      "args": ["retrostrap-mcp"]
    }
  }
}
```

## Layout

The tools are pure functions over a loaded manifest, no I/O, no dependencies, so the
suite exercises them directly. Only `server.js` needs the SDK, and only to move JSON in
and out over stdio.

```
src/manifest.js     find and load the manifest (env var, package copy, repo dist)
src/tools.js        search_catalog, get_snippet, get_theme
src/audit-html.js   the static five-laws check
src/server.js       stdio wiring (the only file that imports the SDK)
test/               vitest, run from the repo root with `npm test`
```
