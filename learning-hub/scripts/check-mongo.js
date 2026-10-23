#!/usr/bin/env node
/**
 * Kiểm tra nhanh chuỗi kết nối MongoDB (Atlas hoặc local) mà backend sẽ dùng:
 *   npm run check:mongo
 * Đọc DATABASE_URL (rồi MONGODB_URI, MONGO_URI) từ biến môi trường hoặc BE/.env,
 * giống thứ tự ưu tiên của database.module.ts. Chỉ đọc, không ghi gì vào DB.
 * Không in mật khẩu.
 */
const fs = require('fs');
const path = require('path');
const h = require('./lib/setup-helpers');

const BE = path.join(__dirname, '..', 'BE');
const envFile = path.join(BE, '.env');
const envText = fs.existsSync(envFile) ? fs.readFileSync(envFile, 'utf8') : '';

const KEYS = ['DATABASE_URL', 'MONGODB_URI', 'MONGO_URI'];
let usedKey = null;
let uri = '';
for (const k of KEYS) {
  const v = process.env[k] || h.readEnvValue(envText, k);
  if (v) { usedKey = k; uri = v; break; }
}

const mask = (u) => u.replace(/(:\/\/[^:/@]+:)[^@]*@/, '$1***@');
const fail = (msg, fix) => {
  console.error(`\x1b[31m✘\x1b[0m ${msg}`);
  if (fix) console.error(`    → ${fix}`);
  process.exit(1);
};

if (!uri) fail('Không thấy DATABASE_URL / MONGODB_URI / MONGO_URI.', 'Tạo BE/.env từ BE/.env.example rồi điền chuỗi kết nối.');
if (!/^mongodb(\+srv)?:\/\//i.test(uri)) fail(`${usedKey} không bắt đầu bằng mongodb:// hoặc mongodb+srv://.`, 'Kiểm tra dấu nháy thừa hoặc dán nhầm.');

// Ký tự đặc biệt trong mật khẩu (@ : / ? # %) phải được mã hóa %XX.
const cred = /^mongodb(?:\+srv)?:\/\/([^/?]*)@/i.exec(uri);
if (cred) {
  const userinfo = cred[1];
  const at = userinfo.lastIndexOf('@');
  if (at !== -1) fail('Mật khẩu chứa "@" chưa mã hóa.', 'Đổi "@" thành %40 (dùng encodeURIComponent cho mật khẩu).');
  const pass = userinfo.slice(userinfo.indexOf(':') + 1);
  if (/[\/?#\[\]]/.test(pass)) fail('Mật khẩu chứa ký tự đặc biệt chưa mã hóa.', 'Mã hóa bằng encodeURIComponent rồi dán lại.');
}
if (!/^mongodb(?:\+srv)?:\/\/[^/]+\/[^/?]+/i.test(uri)) {
  console.warn('\x1b[33m!\x1b[0m URI chưa có tên database (…mongodb.net/<tên-db>?…): Mongo sẽ dùng DB "test".');
}

let mongoose;
try {
  mongoose = require(path.join(BE, 'node_modules', 'mongoose'));
} catch {
  fail('Chưa cài dependency backend.', 'Chạy: npm --prefix BE install');
}

(async () => {
  console.log(`Đang kết nối (${usedKey}): ${mask(uri)}`);
  const t0 = Date.now();
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    const db = mongoose.connection.db;
    await db.admin().ping();
    const cols = await db.listCollections().toArray();
    console.log(`\x1b[32m✔\x1b[0m Kết nối OK (${Date.now() - t0}ms), database "${db.databaseName}", ${cols.length} collection.`);
    for (const name of ['users', 'exercises', 'questions']) {
      if (cols.some((c) => c.name === name)) console.log(`    ${name}: ${await db.collection(name).countDocuments()} bản ghi`);
    }
    await mongoose.disconnect();
  } catch (e) {
    const m = String(e.message || e);
    let fix = 'Xem chi tiết lỗi ở trên.';
    if (/ENOTFOUND|querySrv|EREFUSED/i.test(m)) fix = 'Không phân giải được DNS cluster: kiểm tra tên host, mạng, hoặc dùng URI dạng mongodb:// (không +srv).';
    else if (/auth|Authentication failed|bad auth/i.test(m)) fix = 'Sai user/mật khẩu (hoặc user không có quyền trên DB). Kiểm tra Database Access trên Atlas và mã hóa ký tự đặc biệt.';
    else if (/ServerSelection|timed out|ETIMEDOUT|whitelist|not allowed/i.test(m)) fix = 'Nhiều khả năng IP chưa được phép: Atlas → Network Access → thêm IP hiện tại (hoặc 0.0.0.0/0 cho dev/Vercel).';
    fail(`Kết nối thất bại: ${m.split('\n')[0]}`, fix);
  }
})();
