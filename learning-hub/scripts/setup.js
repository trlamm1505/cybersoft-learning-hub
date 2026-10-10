#!/usr/bin/env node
/**
 * Dựng môi trường dev trên MÁY MỚI chỉ bằng một lệnh, chạy lại bao nhiêu lần cũng an toàn:
 *
 *   npm run setup
 *
 * 1. Kiểm tra Node (>= 20.12) và Docker.
 * 2. Tạo .env từ file mẫu nếu chưa có (sinh JWT_SECRET ngẫu nhiên); KHÔNG ghi đè file đã có.
 * 3. Cài thư viện (root, BE, FE) nếu thiếu.
 * 4. Bật hạ tầng: MongoDB (nếu máy chưa có) và Postgres sandbox qua Docker; kéo image Python cho sandbox.
 * 5. Nạp dữ liệu mẫu CHỈ KHI CSDL còn trống (các lệnh seed xóa dữ liệu cũ nên không được chạy đè dữ liệu thật).
 *
 * Tùy chọn: --skip-install, --skip-docker, --seed-only, --force (cùng --seed-only: nạp lại dữ liệu mẫu, XÓA dữ liệu cũ).
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

const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

function checkTools() {
  step('1/5 Kiểm tra công cụ');
  if (!h.versionAtLeast(process.version, h.MIN_NODE)) {
    say(C.bad, `Node ${process.version} quá cũ, cần >= ${h.MIN_NODE} (khuyên dùng Node 22: xem .nvmrc).`);
    process.exit(1);
  }
  say(C.ok, `Node ${process.version}`);
  const docker = run('docker', ['info', '--format', '{{.ServerVersion}}']);
  if (docker.ok) say(C.ok, `Docker ${docker.out}`);
  else warn('Docker chưa chạy: sẽ không bật được MongoDB/Postgres sandbox tự động. Mở Docker Desktop rồi chạy lại `npm run setup`.');
  return docker.ok;
}

function ensureEnvFiles() {
  step('2/5 Tệp cấu hình (.env)');
  const targets = [
    { file: path.join(ROOT, '.env'), example: path.join(ROOT, '.env.example'), fill: {} },
    { file: path.join(BE, '.env'), example: path.join(BE, '.env.example'), fill: { JWT_SECRET: h.generateSecret() } },
  ];
  for (const t of targets) {
    const rel = path.relative(ROOT, t.file);
    if (fs.existsSync(t.file)) {
      say(C.skip, `${rel} đã có, giữ nguyên`);
      continue;
    }
    fs.writeFileSync(t.file, h.renderEnv(fs.readFileSync(t.example, 'utf8'), t.fill));
    say(C.ok, `Đã tạo ${rel} từ ${path.basename(t.example)}`);
  }
  // FE không cần .env (mặc định http://localhost:3000/api). Chỉ báo các khóa tùy chọn còn trống.
  const beEnv = fs.readFileSync(path.join(BE, '.env'), 'utf8');
  if (!h.readEnvValue(beEnv, 'JWT_SECRET')) warn('BE/.env chưa có JWT_SECRET (backend dev sẽ dùng khóa mặc định).');
  for (const [key, feature] of [
    ['GEMINI_API_KEY', 'AI Coach, sinh đề, chấm Insight/AI Lab'],
    ['GMAIL_APP_PASSWORD', 'gửi email đặt lại mật khẩu'],
  ]) {
    if (!h.readEnvValue(beEnv, key)) say(C.skip, `${key} trống → tạm tắt: ${feature} (điền vào BE/.env nếu cần)`);
  }
}

function installDeps() {
  step('3/5 Thư viện (npm)');
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

function waitHealthy(container, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const r = run('docker', ['inspect', '-f', '{{.State.Health.Status}}', container]);
    if (r.ok && r.out === 'healthy') return true;
    sleep(2000);
  }
  return false;
}

function startInfra(dockerUp) {
  step('4/5 Hạ tầng (MongoDB, Postgres sandbox)');
  if (args.has('--skip-docker')) return say(C.skip, 'Bỏ qua (--skip-docker)');
  const beEnv = fs.readFileSync(path.join(BE, '.env'), 'utf8');
  const mongo = h.parseMongoTarget(h.readEnvValue(beEnv, 'DATABASE_URL'));

  if (mongo.external) say(C.skip, 'MongoDB: dùng dịch vụ ngoài (Atlas/máy khác), không tự bật');
  else if (h.tcpOpenSync(mongo.host, mongo.port)) say(C.ok, `MongoDB: đã có sẵn ở ${mongo.host}:${mongo.port}`);
  else if (!dockerUp) warn(`MongoDB chưa chạy ở ${mongo.host}:${mongo.port} và Docker chưa bật: hãy cài/bật MongoDB hoặc Docker rồi chạy lại.`);
  else {
    say(C.skip, 'MongoDB: máy chưa có, bật container mongo-dev...');
    const up = run('docker', ['compose', '--profile', 'dev', 'up', '-d', 'mongo-dev']);
    if (up.ok && waitHealthy('learning-hub-mongo-dev', 90_000)) say(C.ok, 'MongoDB (container mongo-dev) sẵn sàng');
    else warn(`Không bật được MongoDB: ${up.err || 'quá thời gian chờ'}`);
  }

  if (!dockerUp) return warn('Bỏ qua Postgres sandbox và image Python (cần Docker): DA Lab và chạy bài Python sẽ chưa dùng được.');
  const sb = run(process.execPath, [path.join(__dirname, 'ensure-sandbox.js')], { inherit: true });
  if (sb.ok) say(C.ok, 'Postgres sandbox sẵn sàng (đã nạp dữ liệu nếu còn trống)');

  if ((h.readEnvValue(beEnv, 'PYTHON_SANDBOX') || 'docker') === 'docker') {
    const image = h.readEnvValue(beEnv, 'PYTHON_SANDBOX_IMAGE') || 'python:3.12-slim';
    if (run('docker', ['image', 'inspect', image]).ok) say(C.ok, `Image ${image} đã có`);
    else {
      say(C.skip, `Kéo image ${image} (chạy bài Python của học viên)...`);
      if (run('docker', ['pull', image], { inherit: true }).ok) say(C.ok, `Image ${image} sẵn sàng`);
      else warn(`Không kéo được ${image}: chạy bài Python sẽ lỗi cho tới khi kéo được (hoặc đặt PYTHON_SANDBOX=local).`);
    }
  }
}

async function seedIfEmpty() {
  step('5/5 Dữ liệu mẫu');
  const beEnv = fs.readFileSync(path.join(BE, '.env'), 'utf8');
  const uri = h.readEnvValue(beEnv, 'DATABASE_URL') || 'mongodb://localhost:27017/cybersoft';
  let mongoose;
  try {
    mongoose = require(path.join(BE, 'node_modules', 'mongoose'));
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  } catch (err) {
    return warn(`Không kết nối được MongoDB (${String(err.message).split('\n')[0]}): bỏ qua nạp dữ liệu. Chạy lại \`npm run setup\` khi MongoDB sẵn sàng.`);
  }
  try {
    const db = mongoose.connection.db;
    const counts = {};
    for (const name of ['users', 'exercises', 'questions']) counts[name] = await db.collection(name).countDocuments();
    if (!h.needsSeed(counts) && !args.has('--force')) {
      const summary = Object.entries(counts).map(([k, v]) => `${k}: ${v}`).join(', ');
      return say(C.skip, `CSDL đã có dữ liệu (${summary}), giữ nguyên. Nạp lại: \`npm run seed:all\` (XÓA dữ liệu cũ).`);
    }
  } finally {
    await mongoose.disconnect();
  }
  // Thứ tự quan trọng: seed.ts tạo người dùng/khóa học, rồi bài tập, câu hỏi, cuộc thi mẫu.
  for (const script of ['seed', 'seed:exercises', 'seed:quiz', 'seed:contests']) {
    say(C.skip, `npm run ${script}...`);
    const res = runNpm(['--prefix', 'BE', 'run', script]);
    if (!res.ok) return warn(`\`npm run ${script}\` thất bại:\n${res.err.split('\n').slice(-5).join('\n')}`);
    say(C.ok, `${script} xong`);
  }
}

(async () => {
  console.log(`${C.h}CyberSoft Learning Hub: dựng môi trường dev\x1b[0m`);
  if (args.has('--seed-only')) {
    ensureEnvFiles();
    await seedIfEmpty();
    return;
  }
  const dockerUp = checkTools();
  ensureEnvFiles();
  installDeps();
  startInfra(dockerUp);
  await seedIfEmpty();

  console.log(`\n${C.h}Xong.\x1b[0m`);
  if (warnings.length) console.log(`${C.warn} ${warnings.length} cảnh báo ở trên cần xem lại.`);
  console.log(`
Chạy dự án:   npm run dev          (backend + web, tự bật lại Docker/sandbox nếu cần)
Kiểm tra:     npm run doctor
Mở web:       http://localhost:5173
Tài khoản mẫu (mật khẩu 123456): admin@gmail.com (quản trị viên), teacher@gmail.com (giảng viên), student@gmail.com (học viên)`);
})().catch((err) => {
  console.error(`${C.bad} setup lỗi: ${err.stack || err.message}`);
  process.exitCode = 1;
});
