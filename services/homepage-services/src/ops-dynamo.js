// ops-dynamo.js, binds the adapter's tiny `ops` interface to a real DynamoDB
// table. Deploy-time only: this is the one file in the service that imports the
// AWS SDK, so the tested core (dynamo-store.js, services.js) stays SDK-free.
// The single on-demand table holds every mutable thing keyed by pk/sk (infra/README.md).
import { randomUUID } from 'node:crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient, UpdateCommand, GetCommand, PutCommand, QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { COUNTER_TTL_S, ENTRY_TTL_S, withTtl } from './dynamo-store.js';

export function dynamoOps(table = process.env.TABLE, client) {
  const doc = DynamoDBDocumentClient.from(client || new DynamoDBClient({}));
  return {
    async add(key, field, n, { ttl } = {}) {
      // stamp a TTL alongside the increment so a spray of unique counter keys
      // can't grow storage without bound (the table has TTL enabled; use it);
      // rl# throttle tokens pass their own window expiry instead
      const r = await doc.send(new UpdateCommand({
        TableName: table,
        Key: key,
        UpdateExpression: 'ADD #f :n SET #ttl = :ttl',
        ExpressionAttributeNames: { '#f': field, '#ttl': 'ttl' },
        ExpressionAttributeValues: { ':n': n, ':ttl': ttl ?? Math.floor(Date.now() / 1000) + COUNTER_TTL_S },
        ReturnValues: 'UPDATED_NEW',
      }));
      return r.Attributes[field];
    },
    async get(key) {
      const r = await doc.send(new GetCommand({ TableName: table, Key: key }));
      return r.Item || null;
    },
    async append(pk, item) {
      const sk = `${item.date || new Date().toISOString()}#${randomUUID()}`; // sortable + unique
      // entries carry the backstop TTL too, so a spammed book cleans itself up
      await doc.send(new PutCommand({ TableName: table, Item: withTtl({ pk, sk, ...item }, ENTRY_TTL_S) }));
    },
    async query(pk, { limit = 1000 } = {}) {
      const r = await doc.send(new QueryCommand({
        TableName: table,
        KeyConditionExpression: 'pk = :p',
        ExpressionAttributeValues: { ':p': pk },
        ScanIndexForward: false, // newest first
        Limit: limit,
      }));
      return (r.Items || []).map(({ pk: _p, sk: _s, ...e }) => e);
    },
  };
}
