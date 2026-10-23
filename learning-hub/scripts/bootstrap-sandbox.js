#!/usr/bin/env node
/**
 * Nạp dữ liệu ban đầu cho Postgres Sandbox khi sandbox còn "trắng" (chưa có `_ingest_manifest`):
 *   npm run bootstrap:sandbox      (setup và dev tự gọi, người mới không cần gõ)
 *
 * 1. Đã có manifest: bỏ qua, không bao giờ nạp đè.
 * 2. `DATA_SERVICE_BASE_URL` có giá trị: thử nạp qua API của Số 1 (đủ kiểm tra checksum, số dòng).
 *    Server không chạy, không mạng, sai khóa hay dữ liệu lỗi: ghi cảnh báo và chuyển sang bước 3.
 * 3. Dữ liệu mẫu tích hợp sẵn (BE/mock-data-service/sandbox/init.sql): nạp nếu chưa có bảng, rồi ghi manifest
 *    với version `embedded`.
 *
 * Không bao giờ thoát mã khác 0 và không ném lỗi ra ngoài: setup/dev không được hỏng vì bước này.
 */
const fs = require('fs');
const path = require('path');
const h = require('./lib/ingest-helpers');
const ing = require('./ingest-sandbox');

const ROOT = path.resolve(__dirname, '..');
const INIT_SQL = path.join(ROOT, 'BE', 'mock-data-service', 'sandbox', 'init.sql');
const TABLES = ['customers', 'employees', 'products', 'orders', 'order_details'];
const PROBE_TIMEOUT_MS = 4000;

async function isBootstrapped(client) {
  const exists = await client.query(`SELECT to_regclass('public._ingest_manifest') AS t`);
  if (!exists.rows[0].t) return false;
  const { rows } = await client.query('SELECT count(*)::int AS n FROM public._ingest_manifest');
  return rows[0].n > 0;
}

/** Nạp dữ liệu mẫu tích hợp sẵn (nếu bảng chưa có) và ghi manifest. */
async function loadEmbedded(client, log) {
  const sql = fs.readFileSync(INIT_SQL, 'utf8');
  const have = await client.query(`SELECT to_regclass('public.orders') AS t`);
  try {
    await client.query('BEGIN');
    if (!have.rows[0].t) {
      await client.query(sql);
      log('Đã nạp dữ liệu mẫu tích hợp sẵn (init.sql).');
    }
    await client.query(ing.MANIFEST_DDL);
    const checksum = h.sha256(Buffer.from(sql));
    let total = 0;
    for (const t of TABLES) {
      const { rows } = await client.query(`SELECT count(*)::int AS n FROM public.${h.ident(t)}`);
      total += rows[0].n;
      await client.query(ing.MANIFEST_UPSERT, [ing.DEFAULT_DATASET, 'clean', t, 'embedded', checksum, rows[0].n, rows[0].n]);
    }
    // Role lab_reader do 02-lab-reader.sh tạo; thiếu role (DB dựng tay) thì bỏ qua phần cấp quyền.
    const role = await client.query(`SELECT 1 FROM pg_roles WHERE rolname = 'lab_reader'`);
    if (role.rowCount) await client.query('GRANT SELECT ON ALL TABLES IN SCHEMA public TO lab_reader');
    await client.query('COMMIT');
    return total;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  }
}

/** Trả về 'skipped' | 'api' | 'embedded' | 'failed'. Không ném lỗi. */
async function bootstrap({ log = console.log, warn = console.warn } = {}) {
  let client;
  try {
    ing.loadEnv();
    client = await ing.connectOwner();
    if (await isBootstrapped(client)) {
      log('Sandbox đã có dữ liệu (manifest), giữ nguyên.');
      return 'skipped';
    }
    await client.end();
    client = undefined;

    if ((process.env.DATA_SERVICE_BASE_URL || '').trim()) {
      log(`Sandbox trống: thử nạp dữ liệu từ ${process.env.DATA_SERVICE_BASE_URL.trim()}...`);
      try {
        await probe();
        const r = await ing.ingest({ log: (m) => log(m) });
        log(`Đã nạp ${r.rows} dòng từ server Data & AI Resource.`);
        return 'api';
      } catch (err) {
        warn(`Không nạp được từ server Data & AI Resource (${err.message.split('\n')[0]}). Chuyển sang dữ liệu mẫu tích hợp sẵn.`);
      }
    } else {
      log('Sandbox trống, DATA_SERVICE_BASE_URL để trống: dùng dữ liệu mẫu tích hợp sẵn.');
    }

    client = await ing.connectOwner();
    const rows = await loadEmbedded(client, log);
    log(`Sandbox sẵn sàng với dữ liệu mẫu tích hợp sẵn (${rows} dòng).`);
    return 'embedded';
  } catch (err) {
    warn(`Chưa nạp được dữ liệu cho sandbox: ${err.message}. DA Lab chưa chạy SQL được; chạy lại \`npm run bootstrap:sandbox\` khi sandbox sẵn sàng.`);
    return 'failed';
  } finally {
    await client?.end().catch(() => {});
  }
}

/** Kiểm tra nhanh server có trả lời không, để hỏng sớm (vài giây) thay vì chờ từng bảng. */
async function probe() {
  const base = process.env.DATA_SERVICE_BASE_URL.trim().replace(/\/+$/, '');
  const res = await fetch(`${base}/api/v1/registry/datasets/${ing.DEFAULT_DATASET}`, {
    headers: { 'X-API-Key': process.env.DATA_SERVICE_API_KEY || '' },
    signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
  }).catch((e) => {
    throw new Error(e.cause?.code || e.name === 'TimeoutError' ? `không kết nối được (${e.cause?.code || 'quá thời gian'})` : e.message);
  });
  if (!res.ok) throw new Error(`server trả ${res.status}`);
}

module.exports = { bootstrap };

if (require.main === module) {
  bootstrap({
    log: (m) => console.log(`[bootstrap] ${m}`),
    warn: (m) => console.warn(`\x1b[33m[bootstrap] CẢNH BÁO: ${m}\x1b[0m`),
  }).finally(() => process.exit(0));
}
