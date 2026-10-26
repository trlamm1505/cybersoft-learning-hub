import { MongoClient } from 'mongodb';
import { writeFileSync } from 'node:fs';
import { env } from '../utils/env.config';
export default async function teardown() {
  const client = await MongoClient.connect(env.mongoServer);
  try {
    const db = client.db(env.database);
    if (!/^cybersoft_day08_e2e_[a-f0-9]{32}$/.test(db.databaseName)) throw new Error('Unsafe cleanup target');
    const marker = await db.collection('day08_metadata').findOne({ runId: env.runId, owner: 'Day08_UI_Smoke' });
    if (!marker) throw new Error('Refusing cleanup: ownership marker missing');
    await db.dropDatabase();
    const remaining = (await client.db('admin').admin().listDatabases()).databases.some(d => d.name === env.database);
    writeFileSync('reports/cleanup.json', JSON.stringify({ database: env.database, dropped: !remaining }, null, 2));
    if (remaining) throw new Error('Temporary database remains after cleanup');
  } finally { await client.close(); }
}
