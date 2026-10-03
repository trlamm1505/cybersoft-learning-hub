#!/usr/bin/env node
/**
 * Đảm bảo Postgres Sandbox (DA Lab) đang chạy trước khi `npm run dev`.
 *
 * - Docker không chạy: in cảnh báo, thoát 0 (các phần không cần Postgres vẫn chạy;
 *   DA Lab sẽ báo lỗi sandbox khi chạy SQL).
 * - Container đã healthy: bỏ qua.
 * - Chưa chạy: `docker compose up -d postgres-sandbox`, chờ healthcheck (pg_isready).
 *
 * Không bao giờ thoát mã khác 0, để không chặn mock server, backend và frontend.
 */
const { spawnSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SERVICE = 'postgres-sandbox';
const CONTAINER = 'da-sandbox-sales-v1';
const WAIT_TIMEOUT_MS = 90_000;
const POLL_MS = 2_000;

const log = (msg) => console.log(`[sandbox] ${msg}`);
const warn = (msg) => console.warn(`\x1b[33m[sandbox] CẢNH BÁO: ${msg}\x1b[0m`);

function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, { cwd: ROOT, encoding: 'utf8', ...opts });
  return { ok: res.status === 0, out: (res.stdout || '').trim(), err: (res.stderr || res.error?.message || '').trim() };
}

/** 'healthy' | 'starting' | 'unhealthy' | 'stopped' | 'missing' */
function containerState() {
  const r = run('docker', ['inspect', '-f', '{{.State.Running}} {{if .State.Health}}{{.State.Health.Status}}{{end}}', CONTAINER]);
  if (!r.ok) return 'missing';
  const [running, health] = r.out.split(' ');
  if (running !== 'true') return 'stopped';
  return health || 'healthy';
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function main() {
  if (!run('docker', ['info', '--format', '{{.ServerVersion}}']).ok) {
    warn('Docker chưa bật. Bỏ qua Postgres Sandbox; DA Lab sẽ không chạy được SQL cho tới khi bật Docker rồi chạy lại `npm run dev`.');
    return;
  }

  const state = containerState();
  if (state === 'healthy') {
    log(`${CONTAINER} đã sẵn sàng, bỏ qua.`);
    return;
  }

  log(`${CONTAINER} đang ở trạng thái "${state}", khởi động bằng docker compose...`);
  const up = run('docker', ['compose', 'up', '-d', SERVICE], { stdio: ['ignore', 'pipe', 'pipe'] });
  if (!up.ok) {
    warn(`docker compose up thất bại:\n${up.err}`);
    return;
  }

  const deadline = Date.now() + WAIT_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const s = containerState();
    if (s === 'healthy') {
      log(`${CONTAINER} đã sẵn sàng nhận kết nối.`);
      return;
    }
    if (s === 'unhealthy') break;
    sleep(POLL_MS);
  }
  warn(`${CONTAINER} chưa healthy sau ${WAIT_TIMEOUT_MS / 1000}s. Xem log: docker logs ${CONTAINER}`);
}

try {
  main();
} catch (err) {
  warn(`Lỗi không mong đợi khi kiểm tra sandbox: ${err.message}`);
}
