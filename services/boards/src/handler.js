// handler.js, the Lambda entry. It is the only file that reaches for the real world: it builds
// the DynamoDB store and the SMTP transport from the environment, hands them to createApp, and
// exports the hono/aws-lambda handler. Kept separate from app.js so the app wiring tests with the
// in-memory store and never imports the AWS SDK. The secrets (SIGNING_KEY, the SMTP app password,
// EDGE_SECRET) arrive via the Lambda's env from Secrets Manager. SAM points BoardsFn at `handler.handler`.
import { timingSafeEqual } from 'node:crypto';
import { handle } from 'hono/aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { boardsStore } from './boards-store.js';
import { dynamoOps } from './ops-dynamo.js';
import { smtpTransport } from './email-smtp.js';
import { argon2Hasher } from './auth-argon2.js';
import { createApp } from './app.js';

const env = process.env;
// Fail loud at cold start on a missing/weak signing key: an empty HMAC key is accepted by
// node:crypto and would let anyone forge any session. Must come from Secrets Manager.
if (!env.SIGNING_KEY || env.SIGNING_KEY.length < 32) {
  throw new Error('SIGNING_KEY must be set to at least 32 characters (supply it from Secrets Manager)');
}
// Same for the edge secret: without it the 403 lock below never fires and every
// direct Function-URL caller walks straight past CloudFront (and its WAF).
if (!env.EDGE_SECRET) {
  throw new Error('EDGE_SECRET must be set (the CloudFront distribution stamps it as x-origin-verify)');
}
const doc = DynamoDBDocumentClient.from(new DynamoDBClient({ region: env.AWS_REGION }));
const store = boardsStore(dynamoOps(env.TABLE, doc));
const mail = smtpTransport({
  host: env.SMTP_HOST, port: Number(env.SMTP_PORT) || 465,
  user: env.SMTP_USER, pass: env.SMTP_PASS, from: env.MAIL_FROM,
});

const app = createApp({ store, mail, key: env.SIGNING_KEY, origin: env.ORIGIN || '', hasher: argon2Hasher });

// The edge lock: only requests that came through our CloudFront distribution
// (which stamps x-origin-verify as a custom origin header) are answered. Direct
// Function-URL callers get a flat 403, which also keeps the viewer-address
// headers trustworthy for the rate limiter.
const rawHandler = handle(app);
export const handler = (event, ctx) => {
  if (!edgeSecretOk(event?.headers?.['x-origin-verify'], env.EDGE_SECRET)) return { statusCode: 403, headers: { 'content-type': 'text/plain' }, body: 'forbidden' };
  return rawHandler(event, ctx);
};

// Constant-time compare, fail-closed on a missing/short header, matching http.js's discipline.
function edgeSecretOk(got, want) {
  if (typeof got !== 'string' || typeof want !== 'string') return false;
  const a = Buffer.from(got);
  const b = Buffer.from(want);
  return a.length === b.length && timingSafeEqual(a, b);
}
