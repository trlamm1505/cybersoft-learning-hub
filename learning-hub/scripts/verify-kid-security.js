#!/usr/bin/env node
/**
 * Kiểm tra bảo mật cho tài khoản học sinh Lớp 3–5 (Kid Mode) bằng cách tấn công thử qua API thật:
 * đổi ID/URL sang tài khoản khác, không token, token giả/hết hạn, leo thang quyền, gọi API của giảng viên/admin...
 *
 *   node scripts/verify-kid-security.js          # backend đang chạy (npm run dev:api)
 *
 * Biến môi trường (mặc định đọc từ BE/.env): VERIFY_API_URL, DATABASE_URL, JWT_SECRET (phải trùng backend).
 * Dữ liệu tạm mang tiền tố __TEST_TEMP__ và luôn bị xóa trong finally; không đụng bản ghi nào khác.
 * Ghi kết quả ra console và TEST_KID_SECURITY_REPORT.txt.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const h = require('./lib/setup-helpers');

const ROOT = path.join(__dirname, '..');
const BE = path.join(ROOT, 'BE');
const REPORT = path.join(ROOT, 'TEST_KID_SECURITY_REPORT.txt');
const LOW = '__test_temp__';
const RUN = crypto.randomBytes(3).toString('hex');

const envText = fs.existsSync(path.join(BE, '.env')) ? fs.readFileSync(path.join(BE, '.env'), 'utf8') : '';
const cfg = (k, d) => process.env[k] || h.readEnvValue(envText, k) || d;
const API = (process.env.VERIFY_API_URL || 'http://localhost:3000/api').replace(/\/$/, '');
const DB_URI = cfg('DATABASE_URL', '');
const JWT_SECRET = cfg('JWT_SECRET', 'dev-secret-key');
const mask = (u) => u.replace(/(:\/\/[^:/@]+:)[^@]*@/, '$1***@');

const lines = [];
const out = (s = '') => { console.log(s); lines.push(s); };
let pass = 0;
let fail = 0;
const check = (name, ok, detail = '') => {
  ok ? pass++ : fail++;
  out(`[${ok ? 'PASS' : 'FAIL'}] ${name}${!ok && detail ? `  -> ${detail}` : ''}`);
};

async function api(method, route, { token, body } = {}) {
  const res = await fetch(`${API}${route}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = undefined; }
  return { status: res.status, text, json };
}

async function main() {
  if (!DB_URI) { console.error('Thiếu DATABASE_URL.'); process.exit(2); }
  const mongoose = require(path.join(BE, 'node_modules', 'mongoose'));
  const jwt = require(path.join(BE, 'node_modules', 'jsonwebtoken'));
  const bcrypt = require(path.join(BE, 'node_modules', 'bcrypt'));

  out('TEST_KID_SECURITY_REPORT (Kid Mode Lớp 3–5)');
  out(`Thời điểm : ${new Date().toISOString()}`);
  out(`API       : ${API}`);
  out(`CSDL      : ${mask(DB_URI)}`);
  out(`Run id    : ${RUN}`);
  out('');

  await mongoose.connect(DB_URI, { serverSelectionTimeoutMS: 8000 });
  const db = mongoose.connection.db;
  const users = db.collection('users');
  const progress = db.collection('block_puzzle_progress');
  const submissions = db.collection('submissions');
  let tempIds = [];

  const cleanup = async () => {
    const found = await users.find({ email: { $regex: `^${LOW}`, $options: 'i' } }, { projection: { _id: 1 } }).toArray();
    tempIds = found.map((u) => String(u._id));
    const p = await progress.deleteMany({ userId: { $in: tempIds } });
    const s = await submissions.deleteMany({ userId: { $in: tempIds } });
    const u = await users.deleteMany({ email: { $regex: `^${LOW}`, $options: 'i' } });
    return { users: u.deletedCount, progress: p.deletedCount, submissions: s.deletedCount };
  };

  try {
    const health = await api('GET', '/health').catch(() => ({ status: 0 }));
    if (health.status !== 200) throw new Error(`Backend không phản hồi tại ${API}/health.`);
    await cleanup(); // tàn dư lần chạy trước

    const pw = await bcrypt.hash(crypto.randomBytes(8).toString('hex'), 4);
    const mk = async (key, role, extra = {}) => {
      const email = `${LOW}${key}_${RUN}@example.test`;
      const doc = { email, password: pw, fullName: `__TEST_TEMP__ ${key}`, role, status: 'ACTIVE', phone: '', bio: '', createdAt: new Date(), updatedAt: new Date(), ...extra };
      const r = await users.insertOne(doc);
      const id = String(r.insertedId);
      const sign = (payload = {}, secret = JWT_SECRET, opts = { expiresIn: '15m' }) => jwt.sign({ sub: id, email, role, ...payload }, secret, opts);
      return { id, email, token: sign(), sign };
    };
    const kidA = await mk('kid_a', 'STUDENT', { ageGroup: '3-5' });
    const kidB = await mk('kid_b', 'STUDENT', { ageGroup: '3-5' });
    const kidC = await mk('kid_c_lock', 'STUDENT', { ageGroup: '3-5', status: 'LOCKED' });
    const teacher = await mk('teacher', 'TEACHER');

    // A đã phá đảo game 1 màn (Ghép Hình) và có một bài nộp riêng.
    const A_SLUG = 'blockly-puzzle';
    await progress.insertOne({ userId: kidA.id, lessonSlug: A_SLUG, gameId: 'blockly-puzzle', completedAt: new Date(), createdAt: new Date(), updatedAt: new Date() });
    const sub = await submissions.insertOne({ exerciseId: 'x', userId: kidA.id, code: 'print(1)', status: 'AC', passedCount: 1, totalCount: 1, results: [], createdAt: new Date(), updatedAt: new Date() });
    const aSubId = String(sub.insertedId);

    // ---- 1. Không token ----
    out('--- 1. Không đăng nhập ---');
    for (const [m, r] of [
      ['GET', '/auth/me'], ['GET', '/block-puzzle/progress'], ['GET', '/block-puzzle/records'],
      ['GET', '/block-puzzle/leaderboard/blockly-maze'], ['GET', `/block-puzzle/kids/${kidA.id}`],
      ['POST', '/block-puzzle/progress/complete'], ['PUT', '/auth/profile'], ['PUT', '/auth/avatar'],
      ['GET', `/exercises/submissions/${aSubId}`], ['GET', `/coach/history/${kidA.id}/x`], ['GET', `/hints/history/${kidA.id}`],
      ['GET', '/learner/progress'], ['GET', '/qa/dashboard'], ['GET', '/resilience/dashboard'], ['GET', '/usability/report'],
      ['GET', '/usability/top-fixes'], ['POST', '/usability/session'],
    ]) {
      const r1 = await api(m, r, { body: m === 'GET' ? undefined : {} });
      check(`Không token: ${m} ${r} -> 401`, r1.status === 401, `status ${r1.status}`);
    }

    // ---- 2. Token giả / hết hạn / tài khoản bị khóa / vai trò giả ----
    out('\n--- 2. Token không hợp lệ ---');
    let r = await api('GET', '/auth/me', { token: kidB.sign({}, 'sai-secret') });
    check('Token ký bằng secret sai -> 401', r.status === 401, `status ${r.status}`);
    r = await api('GET', '/auth/me', { token: kidB.sign({}, JWT_SECRET, { expiresIn: '-10s' }) });
    check('Token đã hết hạn -> 401', r.status === 401, `status ${r.status}`);
    r = await api('GET', '/auth/me', { token: kidB.sign({ sub: new mongoose.Types.ObjectId().toString() }) });
    check('Token của tài khoản không tồn tại -> 401', r.status === 401, `status ${r.status}`);
    r = await api('GET', '/auth/me', { token: kidC.token });
    check('Tài khoản bị khóa (LOCKED) dùng token còn hạn -> 401', r.status === 401, `status ${r.status}`);
    r = await api('POST', '/exercises', { token: kidB.sign({ role: 'ADMIN' }), body: { title: 'x', description: 'y', targetGroup: 'K6_9', labType: 'PYTHON_CODE' } });
    check('Token giả vai ADMIN của học sinh vẫn bị 403 (vai trò lấy từ CSDL, không tin token)', r.status === 403, `status ${r.status}`);

    // ---- 3. Chỉ thấy dữ liệu của chính mình ----
    out('\n--- 3. Cách ly dữ liệu giữa các bé ---');
    r = await api('GET', '/auth/me', { token: kidB.token });
    check('/auth/me trả đúng tài khoản của B, không phải A', r.json?.id === kidB.id && r.json?.email === kidB.email, JSON.stringify(r.json));
    check('/auth/me không lộ mật khẩu', !/password|\$2[aby]\$/.test(r.text));
    r = await api('GET', '/block-puzzle/progress', { token: kidB.token });
    check('B xem tiến độ: không chứa màn của A', Array.isArray(r.json?.completedSlugs) && !r.json.completedSlugs.includes(A_SLUG), JSON.stringify(r.json));
    r = await api('POST', '/block-puzzle/progress/complete', { token: kidB.token, body: { lessonSlug: A_SLUG, gameId: 'blockly-puzzle', userId: kidA.id } });
    check('B gửi hoàn thành kèm userId của A: server bỏ qua userId trong body (200)', r.status === 201 || r.status === 200, `status ${r.status}`);
    const aDocs = await progress.countDocuments({ userId: kidA.id });
    const bDocs = await progress.countDocuments({ userId: kidB.id });
    check('Bản ghi tạo cho B (không ghi nhầm vào A): A vẫn 1, B có 1', aDocs === 1 && bDocs === 1, `A=${aDocs} B=${bDocs}`);
    await progress.deleteMany({ userId: kidB.id });

    out('\n--- 4. Đổi ID trên URL sang tài khoản khác ---');
    r = await api('GET', `/exercises/submissions/${aSubId}`, { token: kidB.token });
    check('B xem bài nộp của A qua URL -> 403', r.status === 403, `status ${r.status}`);
    r = await api('GET', `/exercises/submissions/${aSubId}`, { token: kidA.token });
    check('A xem bài nộp của chính mình -> 200', r.status === 200, `status ${r.status}`);
    r = await api('GET', `/coach/history/${kidA.id}/bat-ky`, { token: kidB.token });
    check('B xem lịch sử AI Coach của A -> 403', r.status === 403, `status ${r.status}`);
    r = await api('GET', `/hints/history/${kidA.id}`, { token: kidB.token });
    check('B xem lịch sử gợi ý của A -> 403', r.status === 403, `status ${r.status}`);
    r = await api('GET', `/admin/users/${kidA.id}/profile`, { token: kidB.token });
    check('B xem hồ sơ chi tiết của A qua API admin -> 403', r.status === 403, `status ${r.status}`);

    out('\n--- 5. Thẻ "xem bạn" và Bảng Vinh Danh ---');
    r = await api('GET', `/block-puzzle/kids/${kidA.id}`, { token: kidB.token });
    check('Xem thẻ bạn A (đang có tên trên bảng) -> 200', r.status === 200 && r.json?.userId === kidA.id, `status ${r.status}`);
    check('Thẻ bạn không lộ email / mật khẩu / số điện thoại / role', !/email|password|phone|role|studentCode|__test_temp__kid_a_/i.test(Object.keys(r.json || {}).join(',') + (r.json?.avatar ? '' : '')), Object.keys(r.json || {}).join(','));
    r = await api('GET', `/block-puzzle/kids/${kidB.id}`, { token: kidA.token });
    check('Xem thẻ bạn B (chưa có tên trên bảng) -> 404, không dò được tài khoản', r.status === 404, `status ${r.status}`);
    r = await api('GET', `/block-puzzle/kids/${teacher.id}`, { token: kidB.token });
    check('Thẻ của tài khoản giảng viên -> 404', r.status === 404, `status ${r.status}`);
    for (const bad of ['abc', '000000000000000000000000', '../auth/me', '%00']) {
      r = await api('GET', `/block-puzzle/kids/${encodeURIComponent(bad)}`, { token: kidB.token });
      check(`Thẻ bạn với id lạ "${bad}" -> 404 (không lỗi 500)`, r.status === 404, `status ${r.status}`);
    }
    r = await api('GET', '/block-puzzle/leaderboard/blockly-puzzle', { token: kidB.token });
    check('Bảng Vinh Danh game 1 màn có A, đủ trường', r.status === 200 && r.json?.top?.some((x) => x.userId === kidA.id && x.totalLevels === 1), r.text.slice(0, 160));
    check('Bảng Vinh Danh không lộ email/mật khẩu/số điện thoại', !/email|password|phone|\$2[aby]\$|@example\.test/i.test(r.text), r.text.slice(0, 200));
    r = await api('GET', '/block-puzzle/leaderboard/game-khong-ton-tai', { token: kidB.token });
    check('Game không tồn tại -> bảng rỗng (200, không lỗi 500)', r.status === 200 && r.json?.top?.length === 0, `status ${r.status}`);
    r = await api('GET', '/block-puzzle/records', { token: kidA.token });
    check('Kỷ lục của A: hạng 1 game 1 màn hoặc có hạng hợp lệ', r.status === 200 && r.json?.records?.some((x) => x.gameId === 'blockly-puzzle' && Number.isInteger(x.rank)), r.text.slice(0, 160));
    r = await api('GET', '/block-puzzle/records', { token: kidB.token });
    check('Kỷ lục của B (chưa chơi) không có dữ liệu của A', r.status === 200 && Array.isArray(r.json?.records) && r.json.records.every((x) => x.gameId !== 'blockly-puzzle'), r.text.slice(0, 160));
    await progress.deleteMany({ userId: kidA.id }); // gỡ A khỏi bảng ngay sau khi kiểm tra

    out('\n--- 6. Leo thang quyền / sửa hồ sơ ---');
    r = await api('PUT', '/auth/profile', { token: kidB.token, body: { fullName: 'Bé Tên Mới', role: 'ADMIN', ageGroup: '10-12', studentCode: 'C9999', status: 'ACTIVE' } });
    const bAfter = await users.findOne({ _id: new mongoose.Types.ObjectId(kidB.id) });
    check('Sửa hồ sơ kèm role/ageGroup/studentCode: chỉ tên đổi, vai trò và nhóm tuổi giữ nguyên', bAfter.role === 'STUDENT' && bAfter.ageGroup === '3-5' && !bAfter.studentCode && bAfter.fullName === 'Bé Tên Mới', JSON.stringify({ role: bAfter.role, ageGroup: bAfter.ageGroup, code: bAfter.studentCode, name: bAfter.fullName, status: r.status }));
    r = await api('PUT', '/auth/profile', { token: kidB.token, body: { email: 'nguoi.khac@example.test' } });
    check('Đổi email -> bị từ chối (400)', r.status === 400, `status ${r.status}`);
    r = await api('PUT', '/auth/age-group', { token: kidB.token, body: { ageGroup: '10-12' } });
    check('Tự đổi nhóm tuổi sang nhóm khác -> 403', r.status === 403, `status ${r.status}`);
    r = await api('PUT', '/auth/avatar', { token: kidB.token, body: { avatar: 'data:image/svg+xml;base64,PHN2Zz48c2NyaXB0PmFsZXJ0KDEpPC9zY3JpcHQ+PC9zdmc+' } });
    check('Avatar SVG (có thể chứa script) bị từ chối', r.status === 400, `status ${r.status}`);
    r = await api('PUT', '/auth/avatar', { token: kidB.token, body: { avatar: 'javascript:alert(1)' } });
    check('Avatar dạng javascript: bị từ chối', r.status === 400, `status ${r.status}`);
    r = await api('PUT', '/auth/profile', { token: kidB.token, body: { fullName: '<img src=x onerror=alert(1)>' } });
    const nameStored = (await users.findOne({ _id: new mongoose.Types.ObjectId(kidB.id) })).fullName;
    check('Tên chứa thẻ HTML: được lưu nguyên dạng chữ (React hiển thị như văn bản, không chạy script)', r.status === 200 && nameStored.includes('<img'), `status ${r.status}`);

    out('\n--- 7. Học sinh gọi API của giảng viên/quản trị ---');
    const attempts = [
      ['POST', '/exercises', { title: 'x', description: 'y', targetGroup: 'K3_5', labType: 'PUZZLE_BLOCK' }],
      ['PATCH', '/exercises/000000000000000000000000', { title: 'x' }],
      ['DELETE', '/exercises/000000000000000000000000'],
      ['POST', '/exercises/legacy/assign-grade', { dryRun: true }],
      ['GET', '/admin/users'],
      ['GET', '/admin/classes'],
      ['GET', '/teacher/classes'],
      ['GET', '/teacher/integrity/queue'],
      ['POST', '/hints/seed', {}],
      ['GET', '/qa/dashboard'],
      ['GET', '/resilience/dashboard'],
      ['GET', '/usability/report'],
      ['POST', '/qa/run-smoke-tests', {}],
      ['POST', '/resilience/run-load-test', { concurrentRequests: 1 }],
    ];
    for (const [m, route, body] of attempts) {
      r = await api(m, route, { token: kidB.token, body });
      check(`Học sinh gọi ${m} ${route} -> 403 (hoặc 404 nếu route không tồn tại)`, r.status === 403 || r.status === 404, `status ${r.status}`);
    }
    r = await api('GET', '/qa/dashboard', { token: teacher.token });
    check('Giảng viên vẫn xem được dashboard chất lượng -> 200', r.status === 200, `status ${r.status}`);
    r = await api('GET', '/exercises/legacy-khong-co/full', { token: kidB.token });
    check('Học sinh gọi /exercises/:slug/full (đáp án + test ẩn) -> 403', r.status === 403, `status ${r.status}`);
  } catch (e) {
    check('Chạy kiểm tra không phát sinh lỗi ngoài dự kiến', false, e.message);
  } finally {
    try {
      const c = await cleanup();
      const left = await users.countDocuments({ email: { $regex: `^${LOW}`, $options: 'i' } });
      out('\n--- Cleanup ---');
      check(`Dọn dữ liệu tạm (xóa ${c.users} tài khoản, ${c.progress} tiến độ, ${c.submissions} bài nộp), không còn bản ghi __TEST_TEMP__`, left === 0, `còn ${left}`);
    } catch (e) {
      check('Dọn dữ liệu tạm', false, e.message);
    }
    await mongoose.disconnect();
    out('');
    out(`KẾT QUẢ: ${pass} PASS, ${fail} FAIL  =>  ${fail === 0 ? 'ĐẠT' : 'KHÔNG ĐẠT'}`);
    fs.writeFileSync(REPORT, lines.join('\n') + '\n', 'utf8');
    console.log(`Đã ghi báo cáo: ${REPORT}`);
    process.exitCode = fail === 0 ? 0 : 1;
  }
}

main().catch((e) => { console.error(e.message || e); process.exit(2); });
