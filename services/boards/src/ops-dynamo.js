// ops-dynamo.js, binds boards-store.js's `ops` interface to the real shared table
// (infra/README.md). Deploy-time only: the one file in the service that imports the AWS SDK,
// so the tested core (boards-store.js) stays SDK-free the way mem-ops.js keeps the
// tests SDK-free. Pagination cursors here are DynamoDB LastEvaluatedKeys (opaque to
// the store); the request layer base64s them for URLs.
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, DeleteCommand,
  QueryCommand, TransactWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import { ConflictError } from './boards-store.js';

// Build a SET/ADD UpdateExpression from a { set, add, ttl } patch, with every
// attribute aliased so reserved words (name, role, status, ttl…) are always safe.
function buildUpdate({ set = {}, add = {}, ttl } = {}) {
  const names = {}, values = {}, sets = [], adds = [];
  let i = 0;
  // skip undefined: the marshaller's removeUndefinedValues would strip the value but
  // leave "#sN = :sN" dangling in the expression (a ValidationException). mem-ops drops
  // undefined keys too, so this keeps the two backends behaving identically.
  for (const [f, v] of Object.entries(set)) { if (v === undefined) continue; names[`#s${i}`] = f; values[`:s${i}`] = v; sets.push(`#s${i} = :s${i}`); i++; }
  if (ttl != null) { names['#ttl'] = 'ttl'; values[':ttl'] = ttl; sets.push('#ttl = :ttl'); }
  let j = 0;
  for (const [f, n] of Object.entries(add)) { if (n === undefined) continue; names[`#a${j}`] = f; values[`:a${j}`] = n; adds.push(`#a${j} :a${j}`); j++; }
  const parts = [];
  if (sets.length) parts.push(`SET ${sets.join(', ')}`);
  if (adds.length) parts.push(`ADD ${adds.join(', ')}`);
  return { UpdateExpression: parts.join(' '), ExpressionAttributeNames: names, ExpressionAttributeValues: values };
}

const isConditionFail = (e) =>
  e?.name === 'ConditionalCheckFailedException' || e?.name === 'TransactionCanceledException';

export function dynamoOps(table = process.env.TABLE, client) {
  const doc = DynamoDBDocumentClient.from(client || new DynamoDBClient({}), {
    marshallOptions: { removeUndefinedValues: true },
  });

  return {
    async get(pk, sk) {
      const r = await doc.send(new GetCommand({ TableName: table, Key: { pk, sk } }));
      return r.Item || null;
    },
    async put(item) {
      await doc.send(new PutCommand({ TableName: table, Item: item }));
    },
    async putNew(item) {
      try {
        await doc.send(new PutCommand({
          TableName: table, Item: item, ConditionExpression: 'attribute_not_exists(pk)',
        }));
      } catch (e) { if (isConditionFail(e)) throw new ConflictError(`exists: ${item.pk}`); throw e; }
    },
    async update(pk, sk, patch) {
      const u = buildUpdate(patch);
      if (!u.UpdateExpression) return this.get(pk, sk); // an all-undefined patch: DynamoDB rejects a blank expression, so no-op
      const r = await doc.send(new UpdateCommand({
        TableName: table, Key: { pk, sk }, ...u, ReturnValues: 'ALL_NEW',
      }));
      return r.Attributes;
    },
    async add(pk, sk, field, n, { ttl } = {}) {
      const r = await doc.send(new UpdateCommand({
        TableName: table, Key: { pk, sk }, ...buildUpdate({ add: { [field]: n }, ttl }), ReturnValues: 'UPDATED_NEW',
      }));
      return r.Attributes[field];
    },
    async remove(pk, sk) {
      await doc.send(new DeleteCommand({ TableName: table, Key: { pk, sk } }));
    },
    // Atomic single-use: delete only if present and return the old item, so exactly one
    // concurrent caller wins (the loser's condition fails -> null). For one-time tokens.
    async take(pk, sk) {
      try {
        const r = await doc.send(new DeleteCommand({
          TableName: table, Key: { pk, sk },
          ConditionExpression: 'attribute_exists(pk)', ReturnValues: 'ALL_OLD',
        }));
        return r.Attributes || null;
      } catch (e) { if (isConditionFail(e)) return null; throw e; }
    },
    async query(pk, { limit = 1000, forward = false, after, skBegins, skBetween } = {}) {
      const names = { '#pk': 'pk' }, values = { ':p': pk };
      let cond = '#pk = :p';
      if (skBegins) { names['#sk'] = 'sk'; values[':b'] = skBegins; cond += ' AND begins_with(#sk, :b)'; }
      else if (skBetween) { names['#sk'] = 'sk'; values[':lo'] = skBetween[0]; values[':hi'] = skBetween[1]; cond += ' AND #sk BETWEEN :lo AND :hi'; }
      const r = await doc.send(new QueryCommand({
        TableName: table, KeyConditionExpression: cond,
        ExpressionAttributeNames: names, ExpressionAttributeValues: values,
        ScanIndexForward: forward, Limit: limit, ExclusiveStartKey: after,
      }));
      return { items: r.Items || [], cursor: r.LastEvaluatedKey || null };
    },
    async queryIndex(gsi1pk, { limit = 1000, forward = false, after } = {}) {
      // Over-fetch one row. DynamoDB hands back a LastEvaluatedKey whenever it stops at Limit, even
      // when the last item WAS the final match, so trusting its presence advertises a "next" link to
      // an empty page. Let the extra row (not the key) decide there's more, and derive the cursor
      // from the last row we actually return, the way mem-ops and listPosts already do.
      const r = await doc.send(new QueryCommand({
        TableName: table, IndexName: 'gsi1',
        KeyConditionExpression: '#g = :p',
        ExpressionAttributeNames: { '#g': 'gsi1pk' }, ExpressionAttributeValues: { ':p': gsi1pk },
        ScanIndexForward: forward, Limit: limit + 1, ExclusiveStartKey: after,
      }));
      const rows = r.Items || [];
      const more = rows.length > limit;
      const items = more ? rows.slice(0, limit) : rows;
      let cursor = null;
      if (more) {
        const last = items[items.length - 1];
        cursor = { pk: last.pk, sk: last.sk, gsi1pk: last.gsi1pk, gsi1sk: last.gsi1sk };
      } else if (r.LastEvaluatedKey) {
        cursor = r.LastEvaluatedKey; // stopped early on the 1MB read cap, not the limit: resume after the last row
      }
      return { items, cursor };
    },
    async transact(actions) {
      const TransactItems = actions.map((a) => {
        if (a.type === 'put') return { Put: { TableName: table, Item: a.item } };
        if (a.type === 'putNew') return { Put: { TableName: table, Item: a.item, ConditionExpression: 'attribute_not_exists(pk)' } };
        if (a.type === 'update') return { Update: { TableName: table, Key: { pk: a.pk, sk: a.sk }, ...buildUpdate(a) } };
        throw new Error(`unknown transact action: ${a.type}`);
      });
      try {
        await doc.send(new TransactWriteCommand({ TransactItems }));
      } catch (e) { if (isConditionFail(e)) throw new ConflictError('a uniqueness or version check failed'); throw e; }
    },
  };
}
