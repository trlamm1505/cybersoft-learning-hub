#!/usr/bin/env node
/**
 * Dựng môi trường dev trên MÁY MỚI chỉ bằng một lệnh, chạy lại bao nhiêu lần cũng an toàn (không cần Docker):
 *
 *   npm run setup
 *
 * 1. Kiểm tra Node (>= 20.12) và Python 3 (bộ chạy bài code chạy local, không dùng Docker).
 * 2. Tạo BE/.env từ BE/.env.example nếu chưa có (sinh JWT_SECRET ngẫu nhiên); KHÔNG ghi đè file đã có.
 * 3. Cài thư viện (root, BE, FE) nếu thiếu.
 * 4. Kiểm tra kết nối MongoDB (máy local hoặc Atlas theo DATABASE_URL).
 *
 * Nạp dữ liệu mẫu là bước riêng: `npm run seed` (an toàn chạy lại nhiều lần, không nhân bản dữ liệu).
 * Tùy chọn: --skip-install.
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const h = require('./lib/setup-helpers');

const ROOT = path.resolve(__dirname, '..');
const BE = path.join(ROOT, 'BE');
const FE = path.join(ROOT, 'FE');
const args = new Set(process.argv.slice(2));
const isWin = process.platform === 'win32';

const C = { ok: '\x1b[32m✔\x1b[0m', skip: '\x1b[36m-\x1b[0m', warn: '\x1b[33m!\x1b[0m', bad: '\x1b[31m✘\x1b[0m', h: '\x1b[1m' };
const step = (t) => console.log(`\n${C.h}${t}\x1b[0m`);
const say = (icon, msg) => console.log(`  ${icon} ${msg}`);
const warnings = [];
const warn = (msg) => {
  warnings.push(msg);
  say(C.warn, msg);
};

function run(cmd, cmdArgs, opts = {}) {
  const { inherit, ...rest } = opts;
  const res = spawnSync(cmd, cmdArgs, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: inherit ? 'inherit' : 'pipe',
    ...rest,
  });
  return { ok: res.status === 0, out: (res.stdout || '').trim(), err: (res.stderr || '').trim() };
}

/**
 * Chạy npm không qua shell (tránh cảnh báo DEP0190 và lỗi escape): khi đã chạy bằng
 * `npm run ...` thì dùng đúng npm-cli.js đang chạy; ngược lại gọi `npm` (Windows: npm.cmd qua shell).
 */
function runNpm(npmArgs, opts = {}) {
  const cli = process.env.npm_execpath;
  if (cli && /\.c?js$/.test(cli)) return run(process.execPath, [cli, ...npmArgs], opts);
  // Windows không có `npm` thực thi trực tiếp (chỉ npm.cmd): chạy qua cmd.exe thay vì shell:true.
  return isWin ? run('cmd.exe', ['/d', '/s', '/c', 'npm.cmd', ...npmArgs], opts) : run('npm', npmArgs, opts);
}

/** Python 3 cho bộ chạy bài code (chạy local trên máy, không Docker). */
function findPython() {
  const candidates = isWin
    ? [process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Python', 'bin', 'python.exe') : null, 'py', 'python']
    : ['python3', 'python'];
  for (const c of candidates.filter(Boolean)) {
    const r = run(c, c === 'py' ? ['-3', '--version'] : ['--version']);
    if (r.ok && /Python 3\./.test(r.out || r.err)) return `${c} (${(r.out || r.err).trim()})`;
  }
  return null;
}

function checkTools() {
  step('1/4 Kiểm tra công cụ');
  if (!h.versionAtLeast(process.version, h.MIN_NODE)) {
    say(C.bad, `Node ${process.version} quá cũ, cần >= ${h.MIN_NODE} (khuyên dùng Node 22: xem .nvmrc).`);
    process.exit(1);
  }
  say(C.ok, `Node ${process.version}`);
  const py = findPython();
  if (py) say(C.ok, `Python: ${py}`);
  else warn('Chưa có Python 3: chạy/nộp bài code sẽ lỗi. Cài Python 3.10+ (python.org) rồi chạy lại `npm run setup`.');
}

function ensureEnvFile() {
  step('2/4 Tệp cấu hình (BE/.env)');
  const file = path.join(BE, '.env');
  if (fs.existsSync(file)) say(C.skip, 'BE/.env đã có, giữ nguyên');
  else {
    const fill = { JWT_SECRET: h.generateSecret(), CONFIG_ENCRYPTION_KEY: require('crypto').randomBytes(32).toString('hex') };
    fs.writeFileSync(file, h.renderEnv(fs.readFileSync(path.join(BE, '.env.example'), 'utf8'), fill));
    say(C.ok, 'Đã tạo BE/.env từ BE/.env.example (JWT_SECRET, CONFIG_ENCRYPTION_KEY sinh ngẫu nhiên)');
  }
  // FE không cần .env (mặc định http://localhost:3000/api). Chỉ báo các khóa tùy chọn còn trống.
  const beEnv = fs.readFileSync(file, 'utf8');
  if (!h.readEnvValue(beEnv, 'JWT_SECRET')) warn('BE/.env chưa có JWT_SECRET (backend dev sẽ dùng khóa ngẫu nhiên, mất phiên khi khởi động lại).');
  for (const [key, feature] of [
    ['GEMINI_API_KEY', 'AI Coach, AI Tạo Đề, chấm Insight/AI Lab'],
    ['GMAIL_APP_PASSWORD', 'gửi email đặt lại mật khẩu'],
  ]) {
    if (!h.readEnvValue(beEnv, key)) say(C.skip, `${key} trống → tạm tắt: ${feature} (điền vào BE/.env nếu cần)`);
  }
}

function installDeps() {
  step('3/4 Thư viện (npm)');
  if (args.has('--skip-install')) return say(C.skip, 'Bỏ qua (--skip-install)');
  for (const dir of [ROOT, BE, FE]) {
    const rel = path.relative(ROOT, dir) || '.';
    if (fs.existsSync(path.join(dir, 'node_modules'))) {
      say(C.skip, `${rel}: đã cài`);
      continue;
    }
    say(C.skip, `${rel}: đang cài...`);
    const hasLock = fs.existsSync(path.join(dir, 'package-lock.json'));
    const res = runNpm([hasLock ? 'ci' : 'install', '--no-audit', '--no-fund'], { cwd: dir, inherit: true });
    if (!res.ok) {
      say(C.bad, `Cài thư viện thất bại ở ${rel}.`);
      process.exit(1);
    }
    say(C.ok, `${rel}: cài xong`);
  }
}

async function checkMongo() {
  step('4/4 MongoDB');
  const beEnv = fs.readFileSync(path.join(BE, '.env'), 'utf8');
  const uri = h.readEnvValue(beEnv, 'DATABASE_URL') || 'mongodb://localhost:27017/cybersoft';
  try {
    const mongoose = require(path.join(BE, 'node_modules', 'mongoose'));
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    await mongoose.disconnect();
    say(C.ok, `Kết nối được MongoDB (${h.parseMongoTarget(uri).external ? 'dịch vụ ngoài/Atlas' : 'máy local'})`);
  } catch (err) {
    warn(`Không kết nối được MongoDB (${String(err.message).split('\n')[0]}): cài MongoDB Community hoặc đặt DATABASE_URL (Atlas) trong BE/.env.`);
  }
}

(async () => {
  console.log(`${C.h}CyberSoft Learning Hub: dựng môi trường dev\x1b[0m`);
  checkTools();
  ensureEnvFile();
  installDeps();
  await checkMongo();

  console.log(`\n${C.h}Xong.\x1b[0m`);
  if (warnings.length) console.log(`${C.warn} ${warnings.length} cảnh báo ở trên cần xem lại.`);
  console.log(`
Nạp dữ liệu mẫu: npm run seed         (chạy lại bao nhiêu lần cũng được; làm mới hoàn toàn: npm run seed:clean)
Chạy dự án:      npm run dev          (backend :3000 + web :5173)
Kiểm tra:        npm run doctor
Tài khoản mẫu: admin@gmail.com, teacher@gmail.com, lop6-9@gmail.com… (mật khẩu = DEFAULT_SEED_PASSWORD trong BE/.env)`);
})().catch((err) => {
  console.error(`${C.bad} setup lỗi: ${err.stack || err.message}`);
  process.exitCode = 1;
});
