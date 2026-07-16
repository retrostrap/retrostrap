# Services

The server-side companions to the framework: **Retrostrap Boards** (the forum),
**homepage-services** (the counter/guestbook backend the widgets talk to),
**Retrospace** (the curated directory's write path), and **mcp** (an MCP server that lets AI
assistants use the framework). These are separate packages, the framework never imports them,
and they never leak into the zero-dependency promise of `dist/`.

Full product specs: [docs/11](../docs/11-community-forum.md) (the forum),
[docs/12](../docs/12-retrospace.md) (the directory), and [docs/05](../docs/05-widgets.md) (the
widget contracts). The hosting stack for all of them is the SAM template in
[`infra/`](../infra/README.md).

## The stack: static reads, tiny write functions, one DynamoDB table

There is **no database to operate and no always-on server**. Reads are static files
on CloudFront; writes are small Lambda Function URLs; state lives in one on-demand DynamoDB
table (single-table, `pk`/`sk`); sessions are signed tokens. The bill runs near zero. Each
service is **pure logic over a storage interface**, so the tests need no cloud and the Lambda
handler is a thin binding.

## What's built

- **homepage-services** (shipped). The counter (counts hits, stores **no identifiers**) and
  guestbook (text-only; **unmoderated by default**, `GUESTBOOK_MODERATED=1` holds entries); the
  webring stays entirely client-side, so it gets no route here.
  `dynamo-store.js` (adapter), `ops-dynamo.js` (SDK binding), `handler.js`
  (the Function-URL Lambda); a zero-dependency `server.js` self-host path is kept for running
  without AWS. Tested.
- **Retrospace** (shipped). Reads are static (`sites.json` + client-side search/toplist); a
  submission opens a GitHub issue (moderation is a pull request, no admin auth, no database);
  the live toplist counts in DynamoDB and a scheduled Lambda writes `hits.json`. `publish.js`,
  `submit-issue.js`, `hit-store.js`, `handler.js`, `sync-handler.js`. Tested.
- **Boards** (the forum). Built and tested: `bbcode.js` (the post renderer and security
  boundary, no raw HTML, `http(s)`-only URLs, Palette-Law `[color=]`), `quiz.js` (the anti-bot
  quiz), `ranks.js`, `auth.js` (password hashing + session tokens; `argon2id` wired at the Lambda
  entry, `scrypt` fallback for migration), `moderation.js`. The request layer is a Hono app that
  renders retrostrap markup server-side over a `boardsStore` on the shared DynamoDB table
  (single-table `pk`/`sk`; the layout lives in `boards-store.js`).
- **mcp**. An MCP server (`@modelcontextprotocol/sdk`) that gives AI assistants the framework's
  manifest plus a lawful-HTML audit tool. Runs locally, or published to npm as `retrostrap-mcp`.

## Deploy path (for the maintainer, at launch)

The whole stack is one SAM template:

    cd infra
    sam build && sam deploy --guided

That creates the DynamoDB table, the homepage, Retrospace, and Boards Lambdas (Function
URLs), the scheduled toplist sync, the private S3 bucket, and the CloudFront distribution
routing static to S3 and `/api/*` to the functions. (The Boards' own distribution on their
subdomain is deploy-time config; the template comment has the recipe.) [`infra/README.md`](../infra/README.md) has the steps, the
widget wiring, and the custom-domain notes. No Postgres, no Fly, nothing always on.

## Test

From the repo root: `npm test` runs the framework and services suites together. To run just the
services: `npx vitest run services`.
