// ops-dynamo.js, the DynamoDB binding for the Retrospace toplist counters. Every
// site's counts live under pk=`site#<id>`, sk='hits'; the write throttle's tokens
// under pk=`rl#<scope>` (throttle.js). The marker is seeded from the
// listed set (the scheduled sync), so a stray id can't spawn an orphan counter,
// the ConditionExpression on the increment enforces it. Deploy-time only; the SDK
// ships in the Lambda runtime, so nothing here needs bundling.
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const key = (id) => ({ pk: `site#${id}`, sk: 'hits' });

export function hitOps(table = process.env.TABLE, client) {
  const doc = DynamoDBDocumentClient.from(client || new DynamoDBClient({}));
  return {
    // One atomic increment, but only for a seeded (listed) site: an id with no
    // marker fails the condition and is not counted (false), never created.
    async add(id, field) {
      try {
        await doc.send(new UpdateCommand({
          TableName: table,
          Key: key(id),
          UpdateExpression: 'ADD #f :one',
          ConditionExpression: 'attribute_exists(pk)',
          ExpressionAttributeNames: { '#f': field },
          ExpressionAttributeValues: { ':one': 1 },
        }));
        return true;
      } catch (err) {
        if (err.name === 'ConditionalCheckFailedException') return false;
        throw err;
      }
    },

    // One self-expiring throttle token (the boards' rl# recipe): ADD the counter,
    // stamp the window's expiry as the item TTL, return the new count.
    async rateHit(scope, expiresAt) {
      const out = await doc.send(new UpdateCommand({
        TableName: table,
        Key: { pk: `rl#${scope}`, sk: '-' },
        UpdateExpression: 'ADD #n :one SET #ttl = :ttl',
        ExpressionAttributeNames: { '#n': 'n', '#ttl': 'ttl' },
        ExpressionAttributeValues: { ':one': 1, ':ttl': expiresAt },
        ReturnValues: 'UPDATED_NEW',
      }));
      return out.Attributes.n;
    },

    // Upsert the marker without ever clobbering counts, and return the current
    // values. The seed floor comes from the curated source (init), so the toplist
    // starts at the maintainer's numbers; live clicks add on top. Idempotent, the
    // if_not_exists means the schedule can run it every tick without resetting.
    async seedAndRead(id, init = {}) {
      const out = await doc.send(new UpdateCommand({
        TableName: table,
        Key: key(id),
        UpdateExpression: 'SET listed = :t, inHits = if_not_exists(inHits, :in), outHits = if_not_exists(outHits, :out)',
        ExpressionAttributeValues: { ':t': true, ':in': init.inHits || 0, ':out': init.outHits || 0 },
        ReturnValues: 'ALL_NEW',
      }));
      const a = out.Attributes || {};
      return { inHits: a.inHits || 0, outHits: a.outHits || 0 };
    },
  };
}
