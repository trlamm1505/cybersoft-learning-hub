#!/usr/bin/env node
/**
 * Kiểm tra nhanh mọi thứ Learning Hub cần để chạy và in cách sửa nếu thiếu:
 *   npm run doctor
 * Không thay đổi gì, chỉ đọc trạng thái (Docker, backend, nguồn dữ liệu, sandbox, web).
 */
const { spawnSync } = require('child_process');

const API = process.env.API_URL || 'http://localhost:3000/api';
const WEB = process.env.WEB_URL || 'http://localhost:5173';

const OK = '\x1b[32m✔\x1b[0m';
const BAD = '\x1b[31m✘\x1b[0m';
const WARN = '\x1b[33m!\x1b[0m';
let failed = 0;

const line = (icon, name, detail, fix) => {
  console.log(`${icon} ${name.padEnd(22)} ${detail}`);
  if (fix) console.log(`    → ${fix}`);
  if (icon === BAD) failed++;
};

async function get(url, ms = 3000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    return { ok: res.ok, status: res.status, json: await res.json().catch(() => null) };
  } catch (err) {
    return { ok: false, error: err.cause?.code || err.message };
  } finally {
    clearTimeout(t);
  }
}

(async () => {
  const docker = spawnSync('docker', ['info', '--format', '{{.ServerVersion}}'], { encoding: 'utf8' });
  docker.status === 0
    ? line(OK, 'Docker', `đang chạy (v${docker.stdout.trim()})`)
    : line(WARN, 'Docker', 'chưa bật', 'Mở Docker Desktop, hoặc chạy `npm run sandbox` (tự mở Docker). Cần cho DA Lab chạy SQL và bài Python.');

  const health = await get(`${API}/health`);
  if (!health.ok) {
    line(BAD, 'Backend', `không trả lời (${health.error || health.status})`, 'Chạy `npm run dev` (hoặc `npm run dev:api`) ở thư mục learning-hub.');
  } else {
    line(health.json?.mongo === 'connected' ? OK : BAD, 'Backend + MongoDB', `status=${health.json?.status}, mongo=${health.json?.mongo}`,
      health.json?.mongo === 'connected' ? undefined : 'Bật MongoDB (mặc định mongodb://localhost:27017).');
    const deps = await get(`${API}/health/dependencies`);
    if (deps.ok) {
      const ds = deps.json.dataService;
      line(OK, 'Nguồn dữ liệu Lab', ds.mode === 'embedded' ? 'tích hợp sẵn trong backend (không cần server riêng)' : `server ngoài ${ds.baseUrl}`);
      const sb = deps.json.sandboxDb;
      line(sb.reachable ? OK : WARN, 'Postgres sandbox', `${sb.host}:${sb.port} ${sb.reachable ? 'sẵn sàng' : 'không kết nối được'}`, sb.hint || undefined);
      line(OK, 'Chạy Python', `chế độ ${deps.json.pythonSandbox}`);
    } else {
      line(WARN, 'Chẩn đoán phụ thuộc', 'backend cũ chưa có /health/dependencies', 'Khởi động lại backend để cập nhật.');
    }
  }

  const web = await get(WEB);
  line(web.status ? OK : WARN, 'Web (frontend)', web.status ? `${WEB} phản hồi` : `không trả lời ${WEB}`, web.status ? undefined : 'Chạy `npm run dev:web`.');

  console.log(failed ? `\n${failed} mục cần xử lý.` : '\nMọi thứ cần thiết đã sẵn sàng.');
  process.exitCode = failed ? 1 : 0;
})();
