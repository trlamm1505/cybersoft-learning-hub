#!/usr/bin/env node
/**
 * Audit Day 29 — Security & Privacy (mô phỏng form Day29_Security_Privacy_Test_Form: SEC-01..SEC-25, PRV-01..PRV-08).
 * Chạy qua HTTP THẬT vào backend đang bật + kiểm tra CSDL và mã nguồn. Token ký cục bộ bằng JWT_SECRET trong BE/.env
 * (không cần mật khẩu, không in token). Dữ liệu tạm (lớp, bài tập, tài khoản) được tạo rồi xóa khi xong.
 *
 *   node scripts/audit-day29-security-privacy.js [--base=http://localhost:3000/api]
 *
 * Các mục tester mô tả trực tiếp (SEC-03/04/10/13/14/15/16/18/19/21/22/24/25, PRV-01..08) bám đúng kịch bản trong báo cáo;
 * các mục còn lại là kiểm tra hồi quy cùng nhóm (xác thực, phân quyền, IDOR, injection) để giữ đủ 25 mục.
 *
 * Phạm vi: chỉ learning-hub. Data-AI-Resource/ là phần việc của thành viên khác nên không kiểm tra ở đây
 * (API key cứng + CORS "*" trong BaoCao_Task21/src/config.py được chuyển cho chủ thư mục đó xử lý).
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const h = require('./lib/setup-helpers');

const ROOT = path.join(__dirname, '..');
const BE = path.join(ROOT, 'BE');
const envText = fs.readFileSync(path.join(BE, '.env'), 'utf8');
const env = (k) => process.env[k] || h.readEnvValue(envText, k);
const uri = env('DATABASE_URL');
const secret = env('JWT_SECRET');
const baseArg = process.argv.find((a) => a.startsWith('--base='));
const BASE = baseArg ? baseArg.slice(7) : `http://localhost:${env('PORT') || 3000}/api`;
const LEAKED_SECRET = 'dev-secret-key';

const results = [];
const check = (id, name, ok, detail = '') => {
  results.push({ id, name, ok: !!ok, detail });
  console.log(`${ok ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m'}  ${id}  ${name}${detail ? `  — ${detail}` : ''}`);
};
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

(async () => {
  if (!secret) throw new Error('Thiếu JWT_SECRET trong BE/.env');
  const mongoose = require(path.join(BE, 'node_modules', 'mongoose'));
  const jwt = require(path.join(BE, 'node_modules', 'jsonwebtoken'));
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  const db = mongoose.connection.db;
  const users = db.collection('users');
  const classes = db.collection('classrooms');
  const exercises = db.collection('exercises');
  const OID = mongoose.Types.ObjectId;

  const sign = (u, key = secret, opts = {}) => jwt.sign({ sub: String(u._id), email: u.email, role: u.role }, key, { expiresIn: '10m', jwtid: crypto.randomUUID(), ...opts });
  const must = async (q, label) => {
    const u = await users.findOne({ status: { $ne: 'LOCKED' }, ...q });
    if (!u) throw new Error(`Thiếu tài khoản ${label}`);
    return u;
  };
  const call = async (token, method, url, body, headers = {}) => {
    const hd = { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers };
    if (body !== undefined) hd['Content-Type'] = 'application/json';
    const res = await fetch(BASE + url, { method, headers: hd, body: body === undefined ? undefined : JSON.stringify(body) });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* không phải JSON */ }
    return { status: res.status, json, headers: res.headers };
  };

  const stamp = crypto.randomBytes(4).toString('hex');
  const created = { users: [], classes: [], exercises: [] };
  try {
    const admin = await must({ role: 'ADMIN' }, 'ADMIN');
    const teacher = await must({ email: 'teacher@gmail.com', role: 'TEACHER' }, 'teacher@gmail.com');
    const kid = await must({ role: 'STUDENT', ageGroup: '3-5' }, 'học sinh 3-5');
    const kid2 = await must({ role: 'STUDENT', ageGroup: '3-5', _id: { $ne: kid._id } }, 'học sinh 3-5 thứ hai');
    const s69 = await must({ role: 'STUDENT', ageGroup: '6-9' }, 'học sinh 6-9');
    const s1012 = await must({ role: 'STUDENT', ageGroup: '10-12' }, 'học sinh 10-12');
    const mk = async (doc) => {
      const id = (await users.insertOne({ status: 'ACTIVE', password: 'x', createdAt: new Date(), updatedAt: new Date(), ...doc })).insertedId;
      created.users.push(id);
      return users.findOne({ _id: id });
    };
    const teacherB = await mk({ email: `audit29-tb-${stamp}@demo.cybersoft.local`, fullName: 'Audit GV B', role: 'TEACHER' });
    const T = { admin: sign(admin), teacher: sign(teacher), teacherB: sign(teacherB), kid: sign(kid), s69: sign(s69), s1012: sign(s1012) };

    const ex69 = await exercises.findOne({ resource_id: { $exists: false }, bankOnly: { $ne: true }, $or: [{ targetGroup: 'K6_9' }, { gradeBand: '6-9' }] });
    const ex1012 = await exercises.findOne({ resource_id: { $exists: false }, bankOnly: { $ne: true }, $or: [{ targetGroup: 'K10_12' }, { gradeBand: { $in: ['9-12', '10-12'] } }] });
    const fixedEx = await exercises.findOne({ resource_id: { $exists: false }, bankOnly: { $ne: true }, authorId: { $exists: false } });

    // ---------------- Xác thực ----------------
    check('SEC-01', 'API cần đăng nhập: GET /auth/me không token → 401', (await call(null, 'GET', '/auth/me')).status === 401);
    const wrongKey = await call(sign(admin, 'sai-secret-khong-phai-cua-he-thong-1234567890'), 'GET', '/auth/me');
    const leakedKey = await call(sign(admin, LEAKED_SECRET), 'GET', '/auth/me');
    check('SEC-02', 'Token ký sai khóa / ký bằng khóa mặc định đã lộ "dev-secret-key" → 401', wrongKey.status === 401 && leakedKey.status === 401, `sai khóa ${wrongKey.status}, khóa lộ ${leakedKey.status}`);
    const anonLessons = await call(null, 'GET', '/authoring/lessons');
    check('SEC-03', 'GET /authoring/lessons không token → 401 (không lộ nội dung/authorId/bản nháp)', anonLessons.status === 401, `HTTP ${anonLessons.status}`);
    const anonEx = await call(null, 'GET', '/exercises');
    check('SEC-04', 'GET /exercises không token → 401', anonEx.status === 401, `HTTP ${anonEx.status}`);
    const expired = await call(sign(admin, secret, { expiresIn: -10 }), 'GET', '/auth/me');
    check('SEC-05', 'Token hết hạn → 401', expired.status === 401);

    // ---------------- Phân quyền ----------------
    check('SEC-06', 'Học viên gọi API Admin (/admin/users) → 403', (await call(T.kid, 'GET', '/admin/users')).status === 403);
    check('SEC-07', 'Giảng viên gọi API Admin (/admin/portal/classes) → 403', (await call(T.teacher, 'GET', '/admin/portal/classes')).status === 403);
    check('SEC-08', 'Học viên gọi API giảng viên (/teacher/classes) → 403', (await call(T.s69, 'GET', '/teacher/classes')).status === 403);
    const idor = await call(T.kid, 'GET', `/coach/history/${kid2._id}/x`);
    check('SEC-09', 'IDOR: bé A xem lịch sử AI Coach của bé B → 403', idor.status === 403, `HTTP ${idor.status}`);

    // ---------------- Lộ chéo khối tuổi ----------------
    const kidEx = await call(T.kid, 'GET', '/exercises');
    const leakEx = (kidEx.json ?? []).filter((e) => e.targetGroup !== 'K3_5' && e.gradeBand !== '3-5');
    const kidLessons = await call(T.kid, 'GET', '/authoring/lessons');
    // Bài giảng: chỉ Block Puzzle; bài lấy từ kho exercises (sourceCollection) phải là bài khối 3-5 có trong CSDL.
    const kid35Slugs = new Set((await exercises.find({ $or: [{ targetGroup: 'K3_5' }, { gradeBand: '3-5' }] }, { projection: { slug: 1 } }).toArray()).map((e) => e.slug));
    const leakLessons = (kidLessons.json ?? []).filter((l) => (l.sourceCollection === 'exercise' ? !kid35Slugs.has(l.slug) : l.type !== 'block'));
    check('SEC-10', 'Học sinh 3-5: /exercises và /authoring/lessons chỉ có bài khối 3-5 (không lọt 6-9, 9-12/10-12, demo-dash)', kidEx.status === 200 && kidLessons.status === 200 && leakEx.length === 0 && leakLessons.length === 0, `exercises lọt ${leakEx.length}, lessons lọt ${leakLessons.length}`);

    // ---------------- IDOR Authoring / Ngân hàng đề ----------------
    const otherEx = (await exercises.insertOne({ title: `Audit bài của GV khác ${stamp}`, slug: `audit29-ex-${stamp}`, description: 'x', type: 'CODE_TEXT', bankOnly: true, bankBand: '6-9', targetGroup: 'K6_9', gradeBand: '6-9', authorId: String(new OID()), testCases: [], createdAt: new Date() })).insertedId;
    created.exercises.push(otherEx);
    const delOther = await call(T.teacherB, 'DELETE', `/authoring/lessons/${otherEx}`);
    const putOther = await call(T.teacherB, 'PUT', `/authoring/lessons/${otherEx}`, { title: 'hack' });
    check('SEC-11', 'IDOR: giảng viên B sửa/xóa bài của giảng viên khác qua /authoring/lessons/:id → 403', delOther.status === 403 && putOther.status === 403 && !!(await exercises.findOne({ _id: otherEx })), `DELETE ${delOther.status}, PUT ${putOther.status}`);
    const delFixed = fixedEx ? await call(T.admin, 'DELETE', `/authoring/lessons/${fixedEx._id}`) : { status: 0 };
    check('SEC-12', 'Bài Code Playground cố định không xóa được qua /authoring (403 E403_PLAYGROUND_FIXED)', delFixed.status === 403 && delFixed.json?.code === 'E403_PLAYGROUND_FIXED', fixedEx ? `HTTP ${delFixed.status}` : 'không có bài cố định');

    // ---------------- HTTP hardening ----------------
    const hdr = (await call(T.admin, 'GET', '/auth/me')).headers;
    const okHeaders = hdr.get('x-content-type-options') === 'nosniff' && hdr.get('x-frame-options') === 'DENY' && /frame-ancestors 'none'/.test(hdr.get('content-security-policy') || '') && !hdr.get('x-powered-by');
    // FE: header khai báo ở vercel.json (triển khai) và vite.config.ts (dev/preview). Không còn nginx/Docker (Day 30).
    const feHeaders = read('FE/vercel.json') + read('FE/vite.config.ts');
    check('SEC-13', 'Security headers: nosniff, X-Frame-Options, CSP trên API; FE (vercel.json/vite) có CSP', okHeaders && /Content-Security-Policy/.test(feHeaders) && /nosniff/.test(feHeaders), `XCTO=${hdr.get('x-content-type-options')}, XFO=${hdr.get('x-frame-options')}`);
    const cors = async (origin) => (await fetch(`${BASE}/auth/me`, { method: 'OPTIONS', headers: { Origin: origin, 'Access-Control-Request-Method': 'GET' } })).headers.get('access-control-allow-origin');
    const evil = await cors('https://evil.example');
    const self3000 = await cors('http://127.0.0.1:3000');
    const fe = await cors('http://localhost:5173');
    check('SEC-14', 'CORS không phản chiếu origin lạ (evil, 127.0.0.1:3000); FE hợp lệ vẫn được', !evil && !self3000 && fe === 'http://localhost:5173', `evil=${evil}, 127.0.0.1:3000=${self3000}, FE=${fe}`);

    // ---------------- Secret & mật khẩu ----------------
    const initialData = read('BE/src/data/initial-data.ts');
    const jwtSecretTs = read('BE/src/common/auth/jwt-secret.ts');
    const secretOk = secret !== LEAKED_SECRET && secret.length >= 32 && !/return 'dev-secret-key'/.test(jwtSecretTs);
    check('SEC-15', 'Không còn secret cứng trong learning-hub: JWT_SECRET mạnh & khác khóa lộ; initial-data không chứa mật khẩu', secretOk && !/passwordRaw/.test(initialData), `JWT_SECRET ${secret.length} ký tự`);
    const forgot = await call(null, 'POST', '/auth/forgot-password', { email: admin.email });
    check('SEC-16', 'Quên mật khẩu email Admin: không trả devResetLink (DEV_MAIL_MOCK tắt) → không chiếm được tài khoản', forgot.status < 500 && !('devResetLink' in (forgot.json ?? {})), `HTTP ${forgot.status}`);
    const nosql = await call(null, 'POST', '/auth/login', { email: { $ne: null }, password: { $ne: null } });
    check('SEC-17', 'NoSQL injection ở đăng nhập ({ $ne: null }) bị từ chối 400/401 (không đăng nhập, không lỗi 500)', [400, 401].includes(nosql.status) && !nosql.json?.accessToken, `HTTP ${nosql.status}`);

    // ---------------- Lưu token ----------------
    const feSrc = ['FE/src/App.tsx', 'FE/src/common/configAxios.ts', 'FE/src/common/authSession.ts', 'FE/src/axios/authApi.ts'].map(read).join('\n');
    const storesJwt = /setItem\(\s*['"](token|accessToken)['"]/.test(feSrc) || /Authorization\s*=\s*`Bearer/.test(feSrc);
    check('SEC-18', 'FE không lưu JWT trong localStorage, không tự gắn Bearer (dùng cookie httpOnly)', !storesJwt);

    // ---------------- PII trẻ em ----------------
    const kidsWithPii = await users.countDocuments({ role: 'STUDENT', ageGroup: '3-5', $or: [{ phone: { $nin: [null, ''] , $exists: true } }, { bio: { $nin: [null, ''], $exists: true } }] });
    const kidMe = await call(T.kid, 'GET', '/auth/me');
    check('SEC-19', 'Tài khoản 3-5 không lưu/không trả phone, bio', kidsWithPii === 0 && kidMe.status === 200 && !kidMe.json?.phone && !kidMe.json?.bio, `${kidsWithPii} bé còn PII`);
    const esc = await call(T.s69, 'PUT', '/auth/profile', { fullName: s69.fullName, role: 'ADMIN', ageGroup: '10-12' });
    const after = await users.findOne({ _id: s69._id });
    check('SEC-20', 'Học viên sửa hồ sơ kèm role/ageGroup không leo quyền, không đổi khối', after.role === 'STUDENT' && after.ageGroup === '6-9', `HTTP ${esc.status}`);

    // ---------------- AI privacy ----------------
    const coachClient = require(path.join(BE, 'dist', 'modules-api', 'coach', 'coach-gemini.client.js'));
    const payload = coachClient.buildGeminiUserContent({ userId: String(kid._id), exercise: {}, attemptSummary: {}, unlockedHints: [], recentHistory: [{ role: 'user', content: 'mail be@x.vn' }], policy: {} }, 'sđt 0912345678');
    const ttl = (await db.collection('coach_messages').indexes()).some((i) => i.key?.createdAt === 1 && Object.keys(i.key).length === 1 && i.expireAfterSeconds > 0);
    check('SEC-21', 'Prompt gửi Gemini không có userId/email/số điện thoại; coach_messages có TTL', !payload.includes(String(kid._id)) && !payload.includes('be@x.vn') && !payload.includes('0912345678') && ttl, `TTL ${ttl ? 'có' : 'thiếu'}`);

    // ---------------- Parental consent ----------------
    const consentBase = { scenarioId: 'audit', completionTimeSeconds: 10, errorCount: 0, confusionMarkersCount: 0, satisfactionRating: 5 };
    const noConsent = await Promise.all(['3-5', '6-9', 'KIDS_8_12'].map((g) => call(T.teacher, 'POST', '/usability/session', { ...consentBase, ageGroup: g })));
    const fakeGroup = await call(T.teacher, 'POST', '/usability/session', { ...consentBase, ageGroup: 'tre-em' });
    check('SEC-22', 'Usability: trẻ em (3-5, 6-9, 8-12) thiếu Parental Consent → 400; nhóm tuổi lạ → 400', noConsent.every((r) => r.status === 400) && fakeGroup.status === 400, noConsent.map((r) => r.status).join('/'));

    // ---------------- Admin: id ma & khóa giảng viên ----------------
    const ghost = String(new OID());
    const tmpClass = (await classes.insertOne({ name: `Audit lớp id ma ${stamp}`, code: `AUDIT29-${stamp}`, ageGroup: '3-5', teacherId: ghost, teacherIds: [ghost], studentIds: [], exerciseSlugs: [], archived: false, createdAt: new Date() })).insertedId;
    created.classes.push(tmpClass);
    const assign = await call(T.admin, 'PUT', `/admin/classes/${tmpClass}/teachers`, { teacherIds: [ghost, String(teacherB._id)] });
    const lock = await call(T.admin, 'PUT', `/admin/users/${teacherB._id}/status`, { status: 'LOCKED' });
    const stillActive = (await users.findOne({ _id: teacherB._id })).status !== 'LOCKED';
    check('SEC-23', 'Lớp còn id giảng viên ma: Admin vẫn phân công được (id ma tự gỡ); khóa giảng viên đang đứng lớp → 409', assign.status === 200 && JSON.stringify(assign.json?.teacherIds) === JSON.stringify([String(teacherB._id)]) && lock.status === 409 && stillActive, `assign ${assign.status}, lock ${lock.status}`);

    const anonSlug = ex69 ? await call(null, 'GET', `/exercises/${ex69.slug}`) : { status: 0 };
    check('SEC-24', 'GET /exercises/:slug không token → 401', anonSlug.status === 401, `HTTP ${anonSlug.status}`);
    const kidSlug = ex69 ? await call(T.kid, 'GET', `/exercises/${ex69.slug}`) : { status: 0 };
    const kidDemo = await call(T.kid, 'GET', '/exercises/demo-dash-ex-loops');
    const s1012To69 = ex69 ? await call(T.s1012, 'GET', `/exercises/${ex69.slug}`) : { status: 0 };
    const s69To1012 = ex1012 ? await call(T.s69, 'GET', `/exercises/${ex1012.slug}`) : { status: 0 };
    check('SEC-25', 'Mở bài khác khối bằng slug → 403 (3-5→6-9, 3-5→demo-dash, 10-12→6-9, 6-9→10-12)', [kidSlug, s1012To69, s69To1012].every((r) => r.status === 403) && [403, 404].includes(kidDemo.status), `${kidSlug.status}/${kidDemo.status}/${s1012To69.status}/${s69To1012.status}`);

    // ---------------- Privacy ----------------
    const kidDocs = await users.find({ role: 'STUDENT', ageGroup: '3-5' }, { projection: { phone: 1, bio: 1, email: 1 } }).toArray();
    check('PRV-01', 'Dữ liệu trẻ 3-5 trong CSDL không có trường phone/bio (tối thiểu hóa dữ liệu)', kidDocs.every((k) => k.phone === undefined && k.bio === undefined), `${kidDocs.length} tài khoản`);
    const adminView = await call(T.admin, 'GET', `/admin/users/${kid._id}/profile`);
    check('PRV-02', 'Hồ sơ trẻ (tự xem & Admin xem) không lộ phone/bio', !kidMe.json?.phone && !kidMe.json?.bio && adminView.status === 200 && !('phone' in (adminView.json?.user ?? {})), `admin HTTP ${adminView.status}`);
    const coachOut = ex1012 ? await call(T.kid, 'POST', '/coach/chat', { exerciseSlug: ex1012.slug, message: 'giải giúp em' }) : { status: 0 };
    check('PRV-03', 'Không mượn AI Coach đọc đề khác khối: bé 3-5 hỏi bài 10-12 → 403', coachOut.status === 403, `HTTP ${coachOut.status}`);
    const stLessons = await call(T.s69, 'GET', '/authoring/lessons');
    const stContests = await call(T.s69, 'GET', '/contests');
    const anyAuthor = [...(stLessons.json ?? []), ...(stContests.json ?? [])].some((x) => x && x.authorId);
    const drafts = (stLessons.json ?? []).filter((l) => l.status !== 'published');
    check('PRV-04', 'Học viên không nhận authorId (lessons, contests) và không nhận bài chưa xuất bản/thiếu status', stLessons.status === 200 && stContests.status === 200 && !anyAuthor && drafts.length === 0, `lessons ${stLessons.json?.length ?? 0}, nháp ${drafts.length}`);
    const loginCookie = read('BE/src/common/security/cookies.ts');
    check('PRV-05', 'Phiên bằng cookie httpOnly + SameSite=Strict; FE chỉ giữ dấu phiên (exp), không giữ JWT', /HttpOnly/.test(loginCookie) && /SameSite=Strict/.test(loginCookie) && !storesJwt && /sessionMarkerFrom/.test(feSrc));
    const probeEmail = `audit29.${stamp}@example.com`;
    await call(T.admin, 'GET', `/admin/users?q=${encodeURIComponent(probeEmail)}`);
    await new Promise((r) => setTimeout(r, 300));
    const logFile = process.env.AUDIT_BE_LOG;
    const logLeak = logFile && fs.existsSync(logFile) ? fs.readFileSync(logFile, 'utf8').includes(probeEmail) : null;
    const authSrc = read('BE/src/modules-api/auth/auth.service.ts');
    check('PRV-06', 'Log không chứa query nhạy cảm (email tìm kiếm), link/token đặt lại mật khẩu, email người nhận', logLeak !== true && !/\$\{resetLink\}/.test(authSrc.split('[DEV MAIL MOCK]')[1]?.split('\n')[0] ?? '') && !/tới \$\{toEmail\}/.test(read('BE/src/modules-api/auth/mail.service.ts')), logLeak === null ? 'không có AUDIT_BE_LOG: chỉ kiểm tra mã nguồn' : 'đã đọc log backend');
    check('PRV-07', 'Lưu lịch sử AI có thời hạn (TTL 90 ngày) và prompt không chứa định danh học sinh', ttl && !payload.includes('"userId"'));
    const qa = await call(T.teacher, 'GET', '/qa/dashboard');
    const idorItem = (qa.json?.results ?? qa.json?.tests ?? qa.json?.items ?? []).find?.((t) => t.testId === 'security-idor-authoring') ?? JSON.stringify(qa.json ?? {}).match(/"testId":"security-idor-authoring"[^}]*/)?.[0];
    const idorText = typeof idorItem === 'string' ? idorItem : JSON.stringify(idorItem ?? {});
    check('PRV-08', 'QA Harness: security-idor-authoring chạy kiểm tra thật và PASSED (6/6 kịch bản)', qa.status === 200 && /PASSED/.test(idorText) && /6\/6/.test(idorText), `HTTP ${qa.status}`);
  } finally {
    if (created.exercises.length) await exercises.deleteMany({ _id: { $in: created.exercises } });
    if (created.classes.length) await classes.deleteMany({ _id: { $in: created.classes } });
    if (created.users.length) await users.deleteMany({ _id: { $in: created.users } });
    await db.collection('audit_logs').countDocuments(); // audit_logs là Append-Only: giữ nguyên bản ghi do bài kiểm tra sinh ra.
    await mongoose.disconnect();
  }
  const passed = results.filter((r) => r.ok).length;
  console.log(`\n${passed}/${results.length} PASS`);
  process.exitCode = passed === results.length ? 0 : 1;
})().catch((e) => {
  console.error(`Audit lỗi: ${e.stack || e.message}`);
  process.exitCode = 1;
});
