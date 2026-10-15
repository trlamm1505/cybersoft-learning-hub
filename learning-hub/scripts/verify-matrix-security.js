#!/usr/bin/env node
/**
 * Nghiệm thu E2E cho ma trận nhóm x lab và bảo mật chấm bài (Node >= 20, dùng fetch có sẵn):
 *
 *   # Backend đang chạy (npm run dev:api) và DATABASE_URL trỏ ĐÚNG CSDL mà backend đó đang dùng.
 *   node scripts/verify-matrix-security.js
 *
 * Biến môi trường (đều có mặc định đọc từ BE/.env):
 *   VERIFY_API_URL  địa chỉ API, mặc định http://localhost:3000/api
 *   DATABASE_URL    chuỗi kết nối MongoDB (để tạo/dọn dữ liệu tạm và ký token thử)
 *   JWT_SECRET      phải trùng với JWT_SECRET của backend đang test
 *
 * An toàn dữ liệu: mọi bản ghi tạo ra đều mang tiền tố __TEST_TEMP__ (user, bài tập) và bị xóa
 * trong khối finally, kể cả khi test lỗi giữa chừng. Script không đụng bản ghi nào khác. Người dùng
 * tạm được chèn thẳng vào CSDL (không qua /auth/register nên không làm nhảy bộ đếm studentCode).
 * Kết quả ghi ra console và TEST_MATRIX_SECURITY_REPORT.txt.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const h = require('./lib/setup-helpers');
const { upsertItems } = require('./seed-matrix');

const ROOT = path.join(__dirname, '..');
const BE = path.join(ROOT, 'BE');
const REPORT = path.join(ROOT, 'TEST_MATRIX_SECURITY_REPORT.txt');
const PREFIX = '__TEST_TEMP__';
const LOW = PREFIX.toLowerCase();
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

async function waitJudge(id, token, timeoutMs = 90_000) {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    const r = await api('GET', `/exercises/submissions/${id}`, { token });
    if (r.json && !['QUEUED', 'RUNNING'].includes(r.json.status)) return r;
    await new Promise((s) => setTimeout(s, 1000));
  }
  throw new Error(`Hết thời gian chờ chấm bài ${id}`);
}

async function cleanup(db) {
  const users = await db.collection('users').find({ email: { $regex: `^${LOW}`, $options: 'i' } }, { projection: { _id: 1 } }).toArray();
  const exes = await db.collection('exercises').find({ slug: { $regex: `^${LOW}` } }, { projection: { _id: 1 } }).toArray();
  const uids = users.map((u) => String(u._id));
  const eids = exes.map((e) => String(e._id));
  const subs = await db.collection('submissions').deleteMany({ $or: [{ userId: { $in: uids } }, { exerciseId: { $in: eids } }] });
  const ex = await db.collection('exercises').deleteMany({ slug: { $regex: `^${LOW}` } });
  const us = await db.collection('users').deleteMany({ email: { $regex: `^${LOW}`, $options: 'i' } });
  return { submissions: subs.deletedCount, exercises: ex.deletedCount, users: us.deletedCount };
}

async function main() {
  if (!DB_URI) { console.error('Thiếu DATABASE_URL (biến môi trường hoặc BE/.env).'); process.exit(2); }
  const mongoose = require(path.join(BE, 'node_modules', 'mongoose'));
  const jwt = require(path.join(BE, 'node_modules', 'jsonwebtoken'));
  const bcrypt = require(path.join(BE, 'node_modules', 'bcrypt'));

  out('TEST_MATRIX_SECURITY_REPORT');
  out(`Thời điểm : ${new Date().toISOString()}`);
  out(`API       : ${API}`);
  out(`CSDL      : ${mask(DB_URI)}`);
  out(`Run id    : ${RUN}`);
  out('');

  await mongoose.connect(DB_URI, { serverSelectionTimeoutMS: 8000 });
  const db = mongoose.connection.db;
  let cleaned = null;

  try {
    const health = await api('GET', '/health').catch(() => ({ status: 0 }));
    if (health.status !== 200) throw new Error(`Backend không phản hồi tại ${API}/health (status ${health.status}). Hãy chạy backend trước.`);

    cleaned = await cleanup(db); // dọn tàn dư của lần chạy trước bị ngắt giữa chừng (chỉ tiền tố test)

    // ---- Dữ liệu tạm: người dùng ----
    const pw = await bcrypt.hash(crypto.randomBytes(8).toString('hex'), 4);
    const mk = async (key, role, ageGroup) => {
      const email = `${LOW}${key}_${RUN}@example.test`;
      const doc = { email, password: pw, fullName: `${PREFIX} ${key}`, role, status: 'ACTIVE', phone: '', bio: '', createdAt: new Date(), updatedAt: new Date() };
      if (ageGroup) doc.ageGroup = ageGroup;
      const r = await db.collection('users').insertOne(doc);
      return { id: String(r.insertedId), email, token: jwt.sign({ sub: String(r.insertedId), email, role }, JWT_SECRET, { expiresIn: '15m' }) };
    };
    const s35 = await mk('student_k35', 'STUDENT', '3-5');
    const s1012 = await mk('student_k1012', 'STUDENT', '10-12');
    const teacherA = await mk('teacher_a', 'TEACHER');
    const teacherB = await mk('teacher_b', 'TEACHER');
    const admin = await mk('admin', 'ADMIN');

    // ---- Dữ liệu tạm: bài tập (tạo qua API bằng teacherA) ----
    const SECRET_IN = '31337';
    const SECRET_OUT = String(31337 * 31337);
    const algoSlug = `${LOW}algo-${RUN}`;
    const created = await api('POST', '/exercises', {
      token: teacherA.token,
      body: {
        slug: algoSlug, title: `${PREFIX} Algo bình phương`, description: 'Đọc n, in n*n.',
        targetGroup: 'K10_12', labType: 'ALGO_JUDGE', type: 'CODE_TEXT', timeLimitMs: 3000,
        testCases: [{ input: '2\n', expectedOutput: '4', isHidden: false }],
        hiddenTestCases: [
          { input: `${SECRET_IN}\n`, expectedOutput: SECRET_OUT, isHidden: true },
          { input: '7\n', expectedOutput: '49', isHidden: true },
        ],
        officialSolution: 'n = int(input())\nprint(n * n)\n',
        authorId: 'khong-duoc-tin',
      },
    });
    check('Setup: teacher tạo bài ALGO_JUDGE qua POST /exercises (201)', created.status === 201, `status ${created.status} ${created.text.slice(0, 160)}`);
    check('Setup: authorId lấy từ token, không tin giá trị client gửi', created.json?.authorId === teacherA.id, `authorId=${created.json?.authorId}`);
    const exId = created.json?._id;
    const markers = [SECRET_IN, SECRET_OUT, 'hiddenTestCases', 'officialSolution', 'solutionCode'];
    const leaks = (text) => markers.filter((m) => text.includes(m));

    // ---- 1. RBAC & IDOR ----
    out('\n--- 1. RBAC & IDOR ---');
    let r = await api('GET', `/exercises/${algoSlug}`, { token: s35.token });
    check('Học sinh K3_5 xem bài K10_12 -> 403', r.status === 403, `status ${r.status}`);
    r = await api('POST', `/exercises/${algoSlug}/submit`, { token: s35.token, body: { code: 'print(1)' } });
    check('Học sinh K3_5 nộp bài K10_12 -> 403', r.status === 403, `status ${r.status}`);
    r = await api('GET', `/exercises/${algoSlug}`);
    check('Khách (không token) xem bài có nhóm -> 401', r.status === 401, `status ${r.status}`);
    r = await api('GET', `/exercises/${algoSlug}`, { token: s1012.token });
    check('Học sinh K10_12 xem bài K10_12 -> 200', r.status === 200, `status ${r.status}`);
    r = await api('POST', '/exercises', { token: s1012.token, body: { title: 'x', description: 'y', targetGroup: 'K10_12', labType: 'ALGO_JUDGE' } });
    check('Học sinh gọi POST /exercises -> 403', r.status === 403, `status ${r.status}`);
    r = await api('PATCH', `/exercises/${exId}`, { token: s1012.token, body: { title: 'hack' } });
    check('Học sinh gọi PATCH /exercises/:id -> 403', r.status === 403, `status ${r.status}`);
    r = await api('DELETE', `/exercises/${exId}`, { token: s1012.token });
    check('Học sinh gọi DELETE /exercises/:id -> 403', r.status === 403, `status ${r.status}`);
    r = await api('PATCH', `/exercises/${exId}`, { token: teacherB.token, body: { title: 'cuop bai' } });
    check('Teacher B sửa bài của Teacher A -> 403', r.status === 403, `status ${r.status}`);
    r = await api('DELETE', `/exercises/${exId}`, { token: teacherB.token });
    check('Teacher B xóa bài của Teacher A -> 403', r.status === 403, `status ${r.status}`);
    r = await api('PATCH', `/exercises/${exId}`, { token: teacherA.token, body: { description: 'Đọc n, in n bình phương.' } });
    check('Teacher A sửa bài của chính mình -> 200', r.status === 200, `status ${r.status}`);
    r = await api('PATCH', `/exercises/${exId}`, { token: admin.token, body: { points: 15 } });
    check('Admin sửa bài của Teacher A -> 200', r.status === 200, `status ${r.status}`);
    r = await api('PUT', '/auth/age-group', { token: s1012.token, body: { ageGroup: '3-5' } });
    check('Học sinh tự đổi nhóm tuổi sang nhóm khác -> 403', r.status === 403, `status ${r.status}`);
    const row = await db.collection('users').findOne({ email: s1012.email }, { projection: { ageGroup: 1 } });
    check('Nhóm tuổi của học sinh vẫn là 10-12 sau lần đổi bị chặn', row?.ageGroup === '10-12', `ageGroup=${row?.ageGroup}`);

    // ---- 2. Rò rỉ dữ liệu qua API công khai ----
    out('\n--- 2. Data leakage (API học sinh) ---');
    r = await api('GET', `/exercises/${algoSlug}`, { token: s1012.token });
    check('Chi tiết bài (học sinh) không chứa hiddenTestCases/officialSolution/solutionCode/dữ liệu test ẩn', leaks(r.text).length === 0, `lộ: ${leaks(r.text).join(', ')}`);
    check('Chi tiết bài (học sinh) chỉ liệt kê test hiển thị (1 test)', Array.isArray(r.json?.testCases) && r.json.testCases.length === 1, `testCases=${r.json?.testCases?.length}`);
    r = await api('GET', '/exercises', { token: s1012.token });
    check('Danh sách bài (học sinh) không lộ trường bí mật', leaks(r.text).length === 0, `lộ: ${leaks(r.text).join(', ')}`);
    r = await api('GET', `/exercises/${algoSlug}/full`, { token: s1012.token });
    check('Học sinh gọi /exercises/:slug/full -> 403', r.status === 403, `status ${r.status}`);
    r = await api('GET', `/exercises/${algoSlug}/full`, { token: teacherA.token });
    check('Teacher xem /full thấy hiddenTestCases và officialSolution', r.status === 200 && r.json?.hiddenTestCases?.length === 2 && !!r.json?.officialSolution, `status ${r.status}`);

    // ---- 3. Rò rỉ qua lỗi khi chấm bài ----
    out('\n--- 3. Leakage qua Exception/Error ---');
    const submit = async (code) => {
      const s = await api('POST', `/exercises/${algoSlug}/submit`, { token: s1012.token, body: { code } });
      if (s.status !== 201 && s.status !== 200) throw new Error(`Nộp bài thất bại: ${s.status} ${s.text.slice(0, 120)}`);
      return waitJudge(s.json.submissionId, s1012.token);
    };
    const reErr = await submit('n = int(input())\nraise ValueError("input=" + str(n) + " expected=" + str(n * n))\n');
    check('Code gây Runtime Error -> trạng thái RE', reErr.json?.status === 'RE', `status=${reErr.json?.status}`);
    check('Response RE không lộ input/expected của test ẩn', leaks(reErr.text).length === 0, `lộ: ${leaks(reErr.text).join(', ')}`);
    check('errorMessage của RE ở test ẩn chỉ là thông báo tổng quát', reErr.json?.errorMessage === 'Runtime Error', `errorMessage=${reErr.json?.errorMessage}`);
    const waErr = await submit('print(4)\n');
    check('Code chỉ đúng test hiển thị nhưng sai test ẩn -> WA (backend dùng test ẩn để chấm)', waErr.json?.status === 'WA', `status=${waErr.json?.status}`);
    check('Response WA không lộ expected của test ẩn', leaks(waErr.text).length === 0, `lộ: ${leaks(waErr.text).join(', ')}`);

    // ---- 4. Chấm đúng ----
    out('\n--- 4. Online Judge ---');
    const ac = await submit('n = int(input())\nprint(n * n)\n');
    check('Lời giải đúng -> AC', ac.json?.status === 'AC', `status=${ac.json?.status} err=${ac.json?.errorMessage}`);
    check('Chấm đủ 3 test (1 hiển thị + 2 ẩn): passedCount=totalCount=3', ac.json?.passedCount === 3 && ac.json?.totalCount === 3, `passed=${ac.json?.passedCount}/${ac.json?.totalCount}`);
    check('Kết quả AC không lộ input/expected của test ẩn', leaks(ac.text).length === 0, `lộ: ${leaks(ac.text).join(', ')}`);

    // ---- 5. Ràng buộc ma trận ----
    out('\n--- 5. Matrix constraint ---');
    const bad = [
      ['K3_5', 'PYTHON_CODE'], ['K6_9', 'ALGO_JUDGE'], ['K10_12', 'DATA_SQL'], ['CAREER_ADULT', 'PUZZLE_BLOCK'],
    ];
    for (const [g, l] of bad) {
      r = await api('POST', '/exercises', { token: teacherA.token, body: { slug: `${LOW}bad-${g}-${l}-${RUN}`.toLowerCase(), title: `${PREFIX} bad`, description: 'x', targetGroup: g, labType: l } });
      check(`Tạo bài sai ma trận ${g} + ${l} -> 400`, r.status === 400, `status ${r.status}`);
    }
    const pySlug = `${LOW}py-${RUN}`;
    r = await api('POST', '/exercises', { token: teacherA.token, body: { slug: pySlug, title: `${PREFIX} Python`, description: 'x', targetGroup: 'K6_9', labType: 'PYTHON_CODE' } });
    check('Tạo bài đúng ma trận K6_9 + PYTHON_CODE -> 201', r.status === 201, `status ${r.status}`);
    const pyId = r.json?._id;
    r = await api('PATCH', `/exercises/${pyId}`, { token: teacherA.token, body: { labType: 'ALGO_JUDGE' } });
    check('PATCH chỉ đổi labType thành ALGO_JUDGE (lệch K6_9) -> 400', r.status === 400, `status ${r.status}`);
    r = await api('PATCH', `/exercises/${pyId}`, { token: teacherA.token, body: { targetGroup: 'K10_12' } });
    check('PATCH chỉ đổi targetGroup thành K10_12 (lệch PYTHON_CODE) -> 400', r.status === 400, `status ${r.status}`);
    const stored = await db.collection('exercises').findOne({ slug: pySlug }, { projection: { targetGroup: 1, labType: 1 } });
    check('Bài vẫn giữ cặp K6_9 + PYTHON_CODE sau các lần PATCH bị chặn', stored?.targetGroup === 'K6_9' && stored?.labType === 'PYTHON_CODE', JSON.stringify(stored));
    r = await api('PATCH', `/exercises/${pyId}`, { token: teacherA.token, body: { targetGroup: 'K10_12', labType: 'ALGO_JUDGE' } });
    check('PATCH đổi đồng thời cả hai cho khớp ma trận -> 200', r.status === 200, `status ${r.status}`);

    // ---- 6. Idempotency của seed ----
    out('\n--- 6. Idempotency (logic seed upsert theo slug) ---');
    const col = db.collection('exercises');
    const seedItems = [
      { slug: `${LOW}seed-a-${RUN}`, title: `${PREFIX} seed A`, description: 'a', type: 'CODE_TEXT', targetGroup: 'K6_9', labType: 'PYTHON_CODE' },
      { slug: `${LOW}seed-b-${RUN}`, title: `${PREFIX} seed B`, description: 'b', type: 'CODE_TEXT', targetGroup: 'K10_12', labType: 'ALGO_JUDGE' },
    ];
    const countSeed = () => col.countDocuments({ slug: { $in: seedItems.map((i) => i.slug) } });
    let e1 = null;
    let e2 = null;
    try { await upsertItems(col, seedItems); } catch (e) { e1 = e; }
    const c1 = await countSeed();
    try { await upsertItems(col, seedItems); } catch (e) { e2 = e; }
    const c2 = await countSeed();
    check('Chạy seed 2 lần liên tiếp không lỗi duplicate', !e1 && !e2, `${e1?.message || ''} ${e2?.message || ''}`);
    check('Số bài seed giữ nguyên sau lần chạy thứ hai (2 -> 2)', c1 === 2 && c2 === 2, `lần 1: ${c1}, lần 2: ${c2}`);
    const idx = await col.indexes();
    check('Trường slug có unique index', idx.some((i) => i.unique && i.key && i.key.slug === 1), JSON.stringify(idx.map((i) => i.key)));
  } catch (e) {
    check('Chạy test không phát sinh lỗi ngoài dự kiến', false, e.message);
  } finally {
    // Luôn dọn dữ liệu tạm, kể cả khi lỗi.
    try {
      const c = await cleanup(db);
      const left =
        (await db.collection('users').countDocuments({ email: { $regex: `^${LOW}`, $options: 'i' } })) +
        (await db.collection('exercises').countDocuments({ slug: { $regex: `^${LOW}` } }));
      out('\n--- Cleanup ---');
      check(`Dọn dữ liệu tạm (xóa ${c.users} user, ${c.exercises} bài, ${c.submissions} bài nộp), không còn bản ghi ${PREFIX}`, left === 0, `còn ${left}`);
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
