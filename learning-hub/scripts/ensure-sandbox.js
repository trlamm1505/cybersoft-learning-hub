#!/usr/bin/env node
/**
 * Đảm bảo hạ tầng dev đang chạy (Postgres Sandbox cho DA Lab; MongoDB nếu máy chưa có) trước khi `npm run dev` (và trước
 * `dev:api` / `start:dev`, nên bật backend theo cách nào cũng tự có sandbox).
 *
 * - Docker Desktop chưa mở (Windows/macOS): tự mở rồi chờ daemon sẵn sàng. Tắt bằng
 *   SANDBOX_AUTOSTART_DOCKER=0. Linux: không tự bật được dịch vụ hệ thống, chỉ cảnh báo.
 * - Docker không chạy được: in cảnh báo, thoát 0 (các phần không cần Postgres vẫn chạy;
 *   DA Lab sẽ báo lỗi sandbox khi chạy SQL).
 * - Container đã healthy: bỏ qua.
 * - Chưa chạy: `docker compose up -d postgres-sandbox`, chờ healthcheck (pg_isready).
 *
 * Không bao giờ thoát mã khác 0, để không chặn mock server, backend và frontend.
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const helpers = require('./lib/setup-helpers');

const ROOT = path.resolve(__dirname, '..');
const SERVICE = 'postgres-sandbox';
const CONTAINER = 'da-sandbox-sales-v1';
const WAIT_TIMEOUT_MS = 90_000;
const DOCKER_START_TIMEOUT_MS = 120_000;
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

const dockerReady = () => run('docker', ['info', '--format', '{{.ServerVersion}}']).ok;

/** Mở Docker Desktop (không chặn); trả về false nếu không biết cách mở trên hệ điều hành này. */
function launchDockerDesktop() {
  const { spawn } = require('child_process');
  if (process.platform === 'win32') {
    const exe = path.join(process.env.ProgramFiles || 'C:\Program Files', 'Docker', 'Docker', 'Docker Desktop.exe');
    if (!require('fs').existsSync(exe)) return false;
    spawn(exe, [], { detached: true, stdio: 'ignore' }).unref();
    return true;
  }
  if (process.platform === 'darwin') {
    spawn('open', ['-a', 'Docker'], { detached: true, stdio: 'ignore' }).unref();
    return true;
  }
  return false;
}

/** Bảo đảm Docker daemon chạy: nếu chưa thì tự mở Docker Desktop và chờ. */
function ensureDocker() {
  if (dockerReady()) return true;
  if (process.env.SANDBOX_AUTOSTART_DOCKER === '0' || !launchDockerDesktop()) return false;
  log('Docker chưa bật, đang tự mở Docker Desktop và chờ sẵn sàng (có thể mất ~1 phút)...');
  const deadline = Date.now() + DOCKER_START_TIMEOUT_MS;
  while (Date.now() < deadline) {
    sleep(POLL_MS);
    if (dockerReady()) return true;
  }
  return false;
}

/** Máy chưa có MongoDB local (DATABASE_URL trỏ localhost mà cổng trống): bật container mongo-dev. */
function ensureMongo() {
  let envText = '';
  try {
    envText = fs.readFileSync(path.join(ROOT, 'BE', '.env'), 'utf8');
  } catch {
    /* chưa có BE/.env: dùng mặc định */
  }
  const target = helpers.parseMongoTarget(process.env.DATABASE_URL || helpers.readEnvValue(envText, 'DATABASE_URL'));
  if (target.external || helpers.tcpOpenSync(target.host, target.port)) return;
  log(`MongoDB chưa chạy ở ${target.host}:${target.port}, bật container mongo-dev...`);
  const up = run('docker', ['compose', '--profile', 'dev', 'up', '-d', 'mongo-dev'], { stdio: ['ignore', 'pipe', 'pipe'] });
  if (!up.ok) return warn(`Không bật được mongo-dev:\n${up.err}`);
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    const r = run('docker', ['inspect', '-f', '{{.State.Health.Status}}', 'learning-hub-mongo-dev']);
    if (r.ok && r.out === 'healthy') return log('MongoDB (mongo-dev) đã sẵn sàng.');
    sleep(POLL_MS);
  }
  warn('mongo-dev chưa healthy sau 60s. Xem log: docker logs learning-hub-mongo-dev');
}

/** Nạp dữ liệu ban đầu khi sandbox còn trống (API của Số 1, không được thì dữ liệu mẫu tích hợp sẵn). Không bao giờ làm hỏng lệnh gọi. */
function bootstrapData() {
  const r = spawnSync(process.execPath, [path.join(__dirname, 'bootstrap-sandbox.js')], { stdio: 'inherit' });
  if (r.status !== 0) warn('Bước nạp dữ liệu sandbox không chạy được; chạy lại `npm run bootstrap:sandbox` sau.');
}

function main() {
  if (!ensureDocker()) {
    warn('Docker chưa bật và không tự mở được. Bỏ qua Postgres Sandbox; DA Lab sẽ không chạy được SQL cho tới khi bật Docker rồi chạy lại `npm run sandbox`.');
    return;
  }

  ensureMongo();

  const state = containerState();
  if (state === 'healthy') {
    log(`${CONTAINER} đã sẵn sàng.`);
    return bootstrapData();
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
      return bootstrapData();
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
