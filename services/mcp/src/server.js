#!/usr/bin/env node
// The MCP wiring: four tools over stdio. All the real work lives in the pure
// modules next door (tools.js, audit-html.js), this file only translates
// between the protocol and them, so it stays a wrapper, not a project (docs/09).
// It's the one file here that needs the SDK; run `npm install` in this folder
// before launching. The tested core needs nothing.
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { createRequire } from 'node:module';

// serverInfo speaks for this package, not for the bundled framework manifest's own version
const PKG_VERSION = createRequire(import.meta.url)('../package.json').version;
import { loadManifest } from './manifest.js';
import { searchCatalog, getSnippet, getTheme } from './tools.js';
import { auditHtml } from './audit-html.js';

const manifest = loadManifest();

const TOOLS = [
  {
    name: 'search_catalog',
    description:
      'Search retrostrap\'s catalog of components, widgets, and themes by keyword. ' +
      'Returns matching ids with labels and summaries. Use get_snippet next to fetch the markup.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'keywords, e.g. "window titlebar" or "cursor trail"' },
        kind: { type: 'string', enum: ['component', 'widget', 'theme'], description: 'optional filter' },
      },
      required: ['query'],
    },
    run: ({ query, kind }) => searchCatalog(manifest, query, { kind }),
  },
  {
    name: 'get_snippet',
    description:
      'Get the canonical copy-paste HTML snippet for a component, widget, or theme by id, ' +
      'along with its accessibility note and whether it needs JavaScript.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string', description: 'a catalog id, e.g. "window" or "snowfall"' } },
      required: ['id'],
    },
    run: ({ id }) => getSnippet(manifest, id),
  },
  {
    name: 'get_theme',
    description:
      'Get a theme\'s mood, era note, and exactly how to switch it on (the data-rs-theme ' +
      'attribute and the stylesheet to load).',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string', description: 'a theme id, e.g. "midnight" or "cosmic"' } },
      required: ['id'],
    },
    run: ({ id }) => getTheme(manifest, id),
  },
  {
    name: 'audit_html',
    description:
      'Statically check an HTML string against retrostrap\'s five design laws (palette, shape, ' +
      'motion, fonts). Returns violations with actionable hints. A pre-flight for generated ' +
      'pages; the in-browser Retrostrap.audit() still has the final word on the cascade.',
    inputSchema: {
      type: 'object',
      properties: { html: { type: 'string', description: 'the HTML to check' } },
      required: ['html'],
    },
    run: ({ html }) => auditHtml(html, manifest.laws),
  },
];

const byName = new Map(TOOLS.map((t) => [t.name, t]));

const server = new Server(
  { name: 'retrostrap-mcp', version: PKG_VERSION },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, () => ({
  tools: TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })),
}));

server.setRequestHandler(CallToolRequestSchema, (request) => {
  const tool = byName.get(request.params.name);
  if (!tool) throw new Error(`unknown tool: ${request.params.name}`);
  try {
    const result = tool.run(request.params.arguments || {});
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  } catch (err) {
    // A bad id or kind is the model's mistake to fix, not a server crash.
    return { isError: true, content: [{ type: 'text', text: String(err.message || err) }] };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
