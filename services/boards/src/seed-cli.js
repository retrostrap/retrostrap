// seed-cli.js, run once against the real table to lay down the launch content:
//   TABLE=... AWS_REGION=... WEBMASTER_NAME='...' WEBMASTER_EMAIL='...' WEBMASTER_PASSWORD='...' \
//     node src/seed-cli.js
// The Webmaster credentials come from the environment, never the repo. Run it on an empty table.
import { randomUUID } from 'node:crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { boardsStore } from './boards-store.js';
import { dynamoOps } from './ops-dynamo.js';
import { argon2Hasher } from './auth-argon2.js';
import { seed } from './seed.js';
import { seedContent } from './seed-content.js';

const env = process.env;
const webmaster = { displayName: env.WEBMASTER_NAME || 'Webmaster', email: env.WEBMASTER_EMAIL, password: env.WEBMASTER_PASSWORD };
if (!env.TABLE || !webmaster.email || !webmaster.password) {
  console.error('need TABLE, WEBMASTER_EMAIL, WEBMASTER_PASSWORD in the environment');
  process.exit(1);
}

const doc = DynamoDBDocumentClient.from(new DynamoDBClient({ region: env.AWS_REGION }));
const store = boardsStore(dynamoOps(env.TABLE, doc));

// seeding is not idempotent (fresh ids every run); a second run would plant a
// duplicate set of boards next to the first. Refuse unless the table is empty.
const existing = await store.listBoards();
if (existing.length) {
  console.error(`refusing: the table already holds ${existing.length} board(s). Seed runs once, on an empty table.`);
  process.exit(1);
}

const result = await seed(store, { ...seedContent, webmaster }, { now: new Date().toISOString(), newId: randomUUID, hasher: argon2Hasher });
console.log('seeded:', JSON.stringify(result, null, 2));
