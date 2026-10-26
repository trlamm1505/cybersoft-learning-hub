import path from 'node:path';
import { randomUUID } from 'node:crypto';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../.env'), quiet: true });
process.env.DAY08_RUN_ID ??= randomUUID().replaceAll('-', '');
const runId = process.env.DAY08_RUN_ID;
if (!/^[a-f0-9]{32}$/.test(runId)) throw new Error('Invalid DAY08_RUN_ID');
const mongoServer = process.env.MONGO_SERVER || 'mongodb://127.0.0.1:27017';
// This suite creates and drops its own database. Refuse shared/remote databases.
if (!/^mongodb:\/\/(127\.0\.0\.1|localhost):\d+$/.test(mongoServer)) throw new Error('MONGO_SERVER must be a local server URI without database or credentials');
function port(value: string | undefined, fallback: number) {
  const n = Number(value || fallback);
  if (!Number.isInteger(n) || n < 1024 || n > 65535) throw new Error('Invalid test port');
  return n;
}
const uiPort = port(process.env.UI_PORT, 5188);
const apiPort = port(process.env.API_PORT, 3108);
const database = `cybersoft_day08_e2e_${runId}`;
export const env = { runId, database, mongoServer, databaseURL: `${mongoServer}/${database}`,
  uiPort, apiPort, baseURL: `http://127.0.0.1:${uiPort}`, apiURL: `http://127.0.0.1:${apiPort}/api` };
