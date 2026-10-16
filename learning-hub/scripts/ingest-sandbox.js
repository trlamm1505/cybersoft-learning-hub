#!/usr/bin/env node
/**
 * Nạp dữ liệu dataset từ Dataset Registry của Data & AI Resource (TTS 01) vào Postgres Sandbox:
 *   npm run ingest:sandbox [-- --dataset ds-retail-ecommerce-sales-v1] [--variant clean|dirty] [--dry-run]
 *
 * - Cấu trúc bảng dựng từ `data_dictionary` của Registry, dữ liệu tải qua
 *   GET /datasets/{id}/tables/{bảng}?format=csv (không sao chép tệp thủ công).
 * - Mỗi bảng: sha256 của tệp tải về phải khớp header X-Checksum-SHA256 và khớp
 *   `checksum_sha256` ở phản hồi JSON; số dòng nạp phải khớp X-Total-Rows và `row_count`
 *   của data_dictionary. Sai một điều kiện là hủy cả giao dịch, sandbox giữ nguyên.
 * - `clean` nạp vào schema public (đủ ràng buộc PK/FK) cho lab SQL. `dirty` nạp vào schema
 *   `dirty` (không ràng buộc) để kiểm thử làm sạch dữ liệu, lab_reader chỉ đọc.
 * - Kết quả ghi vào bảng `_ingest_manifest` (phiên bản, checksum, số dòng) để đối soát.
 * Kết nối bằng chủ sở hữu DB (SANDBOX_DB_OWNER), không dùng lab_reader.
 *
 * Dùng như thư viện (bootstrap-sandbox.js): `ingest()` ném lỗi thay vì thoát tiến trình.
 */
const path = require('path');
const h = require('./lib/ingest-helpers');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_DATASET = 'ds-retail-ecommerce-sales-v1';

function loadEnv() {
  for (const f of [path.join(ROOT, '.env'), path.join(ROOT, 'BE', '.env')]) {
    try {
      process.loadEnvFile(f);
    } catch {
      // Không có file thì dùng biến môi trường sẵn có.
    }
  }
}

/** Kết nối Postgres Sandbox bằng chủ sở hữu DB. Gọi `.end()` khi xong. */
async function connectOwner() {
  const { Client } = require(path.join(ROOT, 'BE', 'node_modules', 'pg'));
  const client = new Client({
    host: process.env.SANDBOX_DB_HOST || 'localhost',
    port: Number(process.env.SANDBOX_DB_PORT || 55432),
    database: 'sales_v1',
    user: process.env.SANDBOX_DB_OWNER || 'sandbox_owner',
    password: process.env.SANDBOX_DB_OWNER_PASSWORD || 'sandbox_owner_pw',
    connectionTimeoutMillis: 5000,
  });
  await client.connect();
  return client;
}

const MANIFEST_DDL = `CREATE TABLE IF NOT EXISTS public._ingest_manifest (
  dataset_id TEXT, variant TEXT, table_name TEXT, version TEXT, checksum_sha256 TEXT,
  rows_loaded INT, rows_expected INT, ingested_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (dataset_id, variant, table_name))`;

const MANIFEST_UPSERT = `INSERT INTO public._ingest_manifest
  (dataset_id, variant, table_name, version, checksum_sha256, rows_loaded, rows_expected)
  VALUES ($1,$2,$3,$4,$5,$6,$7)
  ON CONFLICT (dataset_id, variant, table_name) DO UPDATE
  SET version=$4, checksum_sha256=$5, rows_loaded=$6, rows_expected=$7, ingested_at=now()`;

/**
 * Tải và kiểm tra toàn bộ dữ liệu từ Registry, rồi (trừ khi dryRun) nạp trong một giao dịch.
 * Ném Error nếu có bất kỳ sai lệch nào; trả về tóm tắt khi thành công.
 */
async function ingest({ dataset = DEFAULT_DATASET, variant = 'clean', dryRun = false, log = () => {}, timeoutMs = 30_000 } = {}) {
  if (!['clean', 'dirty'].includes(variant)) throw new Error(`variant chỉ nhận clean hoặc dirty, nhận "${variant}"`);
  const base = (process.env.DATA_SERVICE_BASE_URL || '').trim().replace(/\/+$/, '');
  if (!base) throw new Error('DATA_SERVICE_BASE_URL đang trống (chế độ tích hợp sẵn). Đặt địa chỉ server Data & AI Resource trong BE/.env.');
  const headers = { 'X-API-Key': process.env.DATA_SERVICE_API_KEY || '' };
  const api = `${base}/api/v1/registry/datasets/${encodeURIComponent(dataset)}`;
  const get = (url) => fetch(url, { headers, signal: AbortSignal.timeout(timeoutMs) });

  const getJson = async (url) => {
    const res = await get(url);
    if (!res.ok) throw new Error(`GET ${url} -> ${res.status} ${(await res.text()).slice(0, 200)}`);
    return (await res.json()).data;
  };

  const detail = await getJson(api);
  const dict = detail.data_dictionary;
  if (!Array.isArray(dict) || !dict.length) throw new Error('data_dictionary rỗng hoặc sai cấu trúc (cần mảng bảng).');
  const tables = h.orderTables(dict);
  log(`Dataset ${detail.id} ${detail.current_version}, ${tables.length} bảng, variant=${variant}`);

  // Tải và kiểm tra toàn bộ trước khi đụng vào DB.
  const loaded = [];
  for (const t of tables) {
    const tableUrl = `${api}/tables/${encodeURIComponent(t.table_name)}`;
    const meta = await getJson(`${tableUrl}?variant=${variant}&page_size=1`);
    const res = await get(`${tableUrl}?variant=${variant}&format=csv`);
    if (!res.ok) throw new Error(`Tải CSV bảng ${t.table_name} -> ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const sum = h.sha256(buf);
    const headerVariant = res.headers.get('x-data-variant');
    if (headerVariant !== variant) throw new Error(`Bảng ${t.table_name}: xin ${variant} nhưng server cấp "${headerVariant}"`);
    if (sum !== res.headers.get('x-checksum-sha256')) throw new Error(`Bảng ${t.table_name}: checksum tải về ${sum} khác header ${res.headers.get('x-checksum-sha256')}`);
    if (sum !== meta.checksum_sha256) throw new Error(`Bảng ${t.table_name}: checksum CSV khác checksum phản hồi JSON (${meta.checksum_sha256})`);
    const [head, ...body] = h.parseCsv(buf.toString('utf8'));
    const want = t.columns.map((c) => c.name);
    if (JSON.stringify(head) !== JSON.stringify(want)) throw new Error(`Bảng ${t.table_name}: cột CSV [${head}] khác data_dictionary [${want}]`);
    const expected = Number(res.headers.get('x-total-rows'));
    if (body.length !== expected) throw new Error(`Bảng ${t.table_name}: CSV có ${body.length} dòng, header báo ${expected}`);
    if (variant === 'clean' && t.row_count != null && body.length !== t.row_count) {
      throw new Error(`Bảng ${t.table_name}: CSV ${body.length} dòng, data_dictionary ghi ${t.row_count}`);
    }
    log(`  ${t.table_name.padEnd(14)} ${String(body.length).padStart(5)} dòng  sha256=${sum.slice(0, 12)}…  ${meta.current_version}`);
    loaded.push({ table: t, rows: body, checksum: sum, version: meta.current_version, dictRows: t.row_count ?? null });
  }
  const total = loaded.reduce((s, l) => s + l.rows.length, 0);
  if (dryRun) {
    log('--dry-run: đã tải và kiểm tra checksum, không ghi vào sandbox.');
    return { tables: loaded.length, rows: total, schema: null };
  }

  const client = await connectOwner();
  const schema = variant === 'clean' ? 'public' : 'dirty';
  try {
    await client.query('BEGIN');
    if (schema === 'public') {
      for (const { table } of [...loaded].reverse()) {
        await client.query(`DROP TABLE IF EXISTS public.${h.ident(table.table_name)} CASCADE`);
      }
    } else {
      await client.query(`DROP SCHEMA IF EXISTS ${h.ident(schema)} CASCADE`);
      await client.query(`CREATE SCHEMA ${h.ident(schema)}`);
    }
    for (const { table } of loaded) {
      await client.query(h.createTableSql(table, { constraints: variant === 'clean', schema }));
    }
    for (const l of loaded) {
      const cols = l.table.columns.map((c) => h.ident(c.name)).join(', ');
      const target = `${h.ident(schema)}.${h.ident(l.table.table_name)}`;
      const BATCH = 500;
      for (let i = 0; i < l.rows.length; i += BATCH) {
        const params = [];
        const tuples = l.rows.slice(i, i + BATCH).map((r) => {
          const marks = h.coerceRow(l.table, r, { raw: variant !== 'clean' }).map((v) => {
            params.push(v);
            return `$${params.length}`;
          });
          return `(${marks.join(', ')})`;
        });
        await client.query(`INSERT INTO ${target} (${cols}) VALUES ${tuples.join(', ')}`, params);
      }
      const { rows } = await client.query(`SELECT count(*)::int AS n FROM ${target}`);
      if (rows[0].n !== l.rows.length) throw new Error(`${l.table.table_name}: nạp ${l.rows.length} nhưng đếm được ${rows[0].n}`);
    }
    await client.query(MANIFEST_DDL);
    for (const l of loaded) {
      await client.query(MANIFEST_UPSERT, [detail.id, variant, l.table.table_name, l.version, l.checksum, l.rows.length, l.dictRows]);
    }
    await client.query(`GRANT USAGE ON SCHEMA ${h.ident(schema)} TO lab_reader`);
    await client.query(`GRANT SELECT ON ALL TABLES IN SCHEMA ${h.ident(schema)} TO lab_reader`);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw new Error(`Nạp thất bại, đã hoàn tác (sandbox giữ nguyên): ${err.message}`);
  } finally {
    await client.end();
  }
  log(`Hoàn tất: ${loaded.length} bảng, ${total} dòng vào schema ${schema}, checksum khớp từng bảng.`);
  return { tables: loaded.length, rows: total, schema };
}

function cliArgs() {
  const a = process.argv.slice(2);
  const opt = (name, def) => {
    const i = a.indexOf(`--${name}`);
    return i >= 0 ? a[i + 1] : def;
  };
  return { dataset: opt('dataset', DEFAULT_DATASET), variant: opt('variant', 'clean'), dryRun: a.includes('--dry-run') };
}

module.exports = { ingest, connectOwner, loadEnv, MANIFEST_DDL, MANIFEST_UPSERT, DEFAULT_DATASET };

if (require.main === module) {
  loadEnv();
  ingest({ ...cliArgs(), log: (m) => console.log(`[ingest] ${m}`) }).catch((e) => {
    console.error(`\x1b[31m[ingest] LỖI: ${e.message}\x1b[0m`);
    process.exit(1);
  });
}
