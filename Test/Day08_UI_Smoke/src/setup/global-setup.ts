import { MongoClient } from 'mongodb';
import { mkdirSync, writeFileSync } from 'node:fs';
import { env } from '../utils/env.config';
export default async function setup() {
  const client = await MongoClient.connect(env.mongoServer);
  try {
    const db = client.db(env.database);
    await db.collection('day08_metadata').insertOne({ runId: env.runId, owner: 'Day08_UI_Smoke' });
    // Hide auto-seeded authoring lessons only in our temporary DB, to exercise real system APIs.
    await db.collection('lessons').updateMany({}, { $set: { status: 'draft' } });
    mkdirSync('reports', { recursive: true });
    writeFileSync('reports/run.json', JSON.stringify({ ...env, startedAt: new Date().toISOString(), channel: process.env.BROWSER_CHANNEL || 'chromium' }, null, 2));
  } finally { await client.close(); }
}
