# infra: the cheap hosting stack

One CloudFormation/SAM stack: a static site on **S3 + CloudFront**, the homepage services
(counter + guestbook), Retrospace, and the Boards each on a **Lambda** behind a Function
URL, a scheduled toplist sync, and one on-demand **DynamoDB** table for state. No
always-on server, no database to babysit. Reads of the main site are static and cached;
writes hit a function, and only the Boards render pages per request.

This template is a **deploy skeleton**: read it, run `sam validate`, and adjust for your
account/region before you lean on it. It has not been deployed from this repo.

## Prerequisites

- An AWS account and the **AWS SAM CLI** (`brew install aws-sam-cli`), plus AWS creds.
- For a custom domain: an **ACM certificate in `us-east-1`** (CloudFront requires that
  region) and a Route 53 (or any) DNS zone.

## Deploy

```sh
cd infra
sam build            # packages ../services/homepage-services, retrospace and boards
sam deploy --guided  # first time: name the stack, pick a region, save the config
```

The homepage and Retrospace functions are SDK-only (the runtime provides it). The Boards
bundle their deps (hono, argon2), so `sam build` runs their npm install; build on Linux or
in a container so `@node-rs/argon2` gets its arm64 Linux prebuilt.

One deploy-order quirk: the template owns the four `/aws/lambda/*` log groups (7-day
retention). If a function ever ran before this stack update, CloudWatch auto-created its
group and the create fails; delete the auto-made groups once and redeploy.

Outputs you'll get: `SiteURL` (the CloudFront URL), `BucketName`, `ApiFunctionUrl`,
`TableName`, and `RetrospaceSyncFunction` (invoke it to publish `hits.json` on demand).

## After deploy

1. **Publish the static content** to the bucket. Assemble one tree first, then sync it
   in one go; `dist/` is already inside `site/_site/` via the Eleventy passthrough:
   ```sh
   npm run build && npm run site:build
   node scripts/publish-retrospace.mjs demos/retrospace/data.json dist/retrospace/sites.json
   cp -r demos site/_site/demos
   mkdir -p site/_site/services/retrospace
   cp -r services/retrospace/src site/_site/services/retrospace/src   # the retrospace page imports these
   cp dist/retrospace/sites.json site/_site/demos/retrospace/data.json  # the stripped public directory
   node scripts/prerender-retrospace.mjs site/_site/demos/retrospace/index.html site/_site/demos/retrospace/data.json  # crawlable listings
   aws s3 sync site/_site/ s3://<BucketName>/ --delete --exclude 'demos/retrospace/hits.json'
   ```
   The exclude matters: `hits.json` is owned by `RetrospaceSyncFn` (live counts); never
   overwrite it with the repo's empty seed, and never let `--delete` take it.
   Add a CloudFront invalidation (or use short TTLs) when you redeploy content.
2. **Point the widgets at the API.** On pages using the counter/guestbook, set the
   backend to the CloudFront `/api` path:
   ```html
   <span class="rs-counter" data-rs-widgets="hit-counter"
         data-rs-hit-counter-mode="api"
         data-rs-hit-counter-src="https://YOURDOMAIN/api/counter"></span>
   <div data-rs-widgets="guestbook"
        data-rs-guestbook-src="https://YOURDOMAIN/api/guestbook/BOOKNAME"></div>
   ```
   The hosted guestbook is opt-in and off by default: set `GUESTBOOK_ENABLED=1` on the Lambda
   to serve the `/api/guestbook` route at all (the counter and webring are always on; the
   Boards are the community home and spam-protect it far better). Once on, it shows entries
   immediately (a classic unmoderated book; the widget renders text-only, so the risk is spam,
   not injection); add `GUESTBOOK_MODERATED=1` to hold entries for approval instead.
3. **Point your domain** at the distribution (CNAME/alias) and add the ACM cert as an
   Alternate Domain Name on the distribution.

## Wiring recap

| Path | Goes to | Cached? |
| --- | --- | --- |
| `/`, `/dist/*`, `/demos/*`, `data.json`, `hits.json` | S3 (static) | yes (CachingOptimized; `hits.json` sets a short `max-age`) |
| `/api/*` (counter, guestbook writes) | homepage Lambda → DynamoDB | no (CachingDisabled) |
| `/api/retrospace/*` (submit, toplist counters) | Retrospace Lambda | no (CachingDisabled) |
| the boards subdomain (every path) | Boards Lambda; `/dist/*` from the same bucket | no (reads vary by cookie) |

The Boards row is the one piece the template leaves to deploy time: the function and its
URL are defined, but the separate `boards.retrostrap.dev` distribution (ACM cert, aliases,
cookie + CSRF-header forwarding, Route 53 record) is added once the domain and cert exist;
the template comment spells out the required config.

Each function gets a log group pinned to **7-day retention**: diagnostics only, the
handlers log no IPs, nothing lingers.

## Retrospace

The Retrospace Lambda (`/api/retrospace/*`) does two jobs.

**Submissions**: `POST /submit` opens a GitHub issue for review (the git-PR moderation
inbox), no admin auth, no database. Set `GitHubRepo` (`owner/repo`) and `GitHubToken` at
`sam deploy` to enable; leave `GitHubRepo` blank to disable. Approve a submission by adding
the site to the curated source in a PR, CI republishes `sites.json`, which the deploy syncs
to where the frontend reads it:

```sh
node scripts/publish-retrospace.mjs <curated-source.json> dist/retrospace/sites.json
aws s3 cp dist/retrospace/sites.json s3://<BucketName>/demos/retrospace/data.json
```

**Toplist counters**: `GET /go?id=<id>` counts an inbound referral and `302`s back to the
directory (set `DirectoryUrl`, default `/demos/retrospace/`); `POST /hit?id=<id>` counts a
click-through. Direction is fixed per endpoint (`/go` = in, `/hit` = out). Both only touch a
*seeded, listed* site (a conditional `ADD`, so a stray id can't spawn an orphan counter). A
separate scheduled Lambda (`RetrospaceSyncFn`, every 15 min) seeds the markers and writes
`hits.json` next to `data.json`; the frontend merges it. No visitor is tracked.

### The member badge (the `in` signal)

The toplist ranks by inbound referrals, which a listed site earns by placing a link back to
the directory through the counter. `SITEID` is the site's `id` in the published directory:

```html
<a href="https://YOURDOMAIN/api/retrospace/go?id=SITEID">Listed on Retrospace</a>
<!-- or wrap any 88×31 button image (or a userbar) in that same link -->
```

The click counts as `in` and redirects the visitor to the directory. The directory's own
listings count `out` automatically (the frontend reads `data-rsx-api` from `<body>`; clear
it to run the page fully static). **Not yet shipped:** an official badge image and a
self-serve "you're listed, here's your link" surface, so today a member pastes the link by
hand and `in` only accrues once they do (noted for later). Until then the toplist leans
on `out` plus the seeded values.

## What's not in here yet

- **The Boards' own distribution**: see the wiring recap above; it is deploy-time,
  account-specific config by design.
- **AWS WAF**: the Lambdas cap sizes, honeypot spam, and throttle writes per IP with
  short-lived `rl#` tokens in the table; add WAF on top only if abuse shows up (it has a
  monthly base cost, so start without it).
- **Custom-domain plumbing** (ACM alias, Route 53 records), left manual on purpose so you
  can choose the domain first.
