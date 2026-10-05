/**
 * Hàm thuần dùng cho scripts/setup.js và scripts/ensure-sandbox.js (không chạm
 * hệ thống tệp hay mạng, trừ tcpOpenSync) để kiểm thử bằng `node --test`.
 */
const crypto = require('crypto');
const { spawnSync } = require('child_process');

/** Phiên bản Node tối thiểu: process.loadEnvFile (nạp .env dùng chung) cần >= 20.12. */
const MIN_NODE = '20.12.0';

const parseVersion = (v) =>
  String(v)
    .replace(/^v/, '')
    .split('.')
    .slice(0, 3)
    .map((n) => parseInt(n, 10) || 0);

/** a >= b theo semver đơn giản (chỉ so ba số đầu). */
function versionAtLeast(a, b) {
  const x = parseVersion(a);
  const y = parseVersion(b);
  for (let i = 0; i < 3; i++) {
    if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0);
  }
  return true;
}

/** Chuỗi ngẫu nhiên an toàn cho JWT_SECRET. */
const generateSecret = (bytes = 48) => crypto.randomBytes(bytes).toString('base64url');

/**
 * Dựng nội dung .env từ file mẫu: điền biến còn trống bằng giá trị cho trước
 * (vd JWT_SECRET sinh ngẫu nhiên). Biến đã có giá trị trong mẫu được giữ nguyên.
 */
function renderEnv(exampleText, fill = {}) {
  return exampleText
    .split(/\r?\n/)
    .map((line) => {
      const m = /^([A-Z][A-Z0-9_]*)=(\s*|"")$/.exec(line);
      return m && Object.prototype.hasOwnProperty.call(fill, m[1]) ? `${m[1]}="${fill[m[1]]}"` : line;
    })
    .join('\n');
}

/** Đọc một biến từ nội dung .env (bỏ ngoặc kép); undefined nếu không có. */
function readEnvValue(envText, key) {
  const m = new RegExp(`^${key}=(.*)$`, 'm').exec(envText);
  if (!m) return undefined;
  return m[1].trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
}

/** host/port từ chuỗi kết nối mongodb[+srv]://; srv (Atlas) coi là dịch vụ ngoài. */
function parseMongoTarget(url) {
  if (!url) return { host: 'localhost', port: 27017, external: false };
  if (/^mongodb\+srv:/i.test(url)) return { host: null, port: null, external: true };
  const m = /^mongodb:\/\/(?:[^@/]*@)?([^/?:,]+)(?::(\d+))?/i.exec(url);
  if (!m) return { host: 'localhost', port: 27017, external: false };
  const host = m[1];
  const local = ['localhost', '127.0.0.1', '::1'].includes(host.toLowerCase());
  return { host, port: Number(m[2] || 27017), external: !local };
}

/** Chỉ nạp dữ liệu mẫu khi CSDL còn trống: các lệnh seed xóa dữ liệu cũ nên không được chạy đè lên dữ liệu thật. */
const needsSeed = (counts) => Object.values(counts).every((n) => n === 0);

/** Mở kết nối TCP đồng bộ (qua tiến trình con) để biết cổng có ai nghe không. */
function tcpOpenSync(host, port, timeoutMs = 1500) {
  const code = `const s=require('net').connect({host:${JSON.stringify(host)},port:${Number(port)}});s.setTimeout(${timeoutMs},()=>process.exit(1));s.once('connect',()=>process.exit(0));s.once('error',()=>process.exit(1));`;
  return spawnSync(process.execPath, ['-e', code], { stdio: 'ignore' }).status === 0;
}

module.exports = {
  MIN_NODE,
  versionAtLeast,
  generateSecret,
  renderEnv,
  readEnvValue,
  parseMongoTarget,
  needsSeed,
  tcpOpenSync,
};
