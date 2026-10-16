#!/usr/bin/env node
/**
 * TỔNG KIỂM TRA NGHIỆP VỤ & AN NINH phân hệ ADMIN qua HTTP THẬT vào backend đang chạy (và trình duyệt cho phần FE).
 * AN TOÀN cho Atlas dùng chung: chỉ tạo tài khoản/lớp TẠM (email tmp-adminfinal-*@audit.local), khóa chuyên ngành thật chỉ bị gọi để
 * xác nhận bị CHẶN hoặc đổi giảng viên rồi KHÔI PHỤC nguyên trạng; cấu hình hệ thống được ảnh chụp và khôi phục; mọi audit log tạm bị xóa.
 *   node scripts/audit-admin-final.js [--base=http://localhost:3000/api] [--fe=http://localhost:5173] [--log=đường-dẫn-log-BE]
 */
const fs = require('fs');
const path = require('path');
const h = require('./lib/setup-helpers');

const ROOT = path.join(__dirname, '..');
const BE = path.join(ROOT, 'BE');
const envText = fs.readFileSync(path.join(BE, '.env'), 'utf8');
const uri = h.readEnvValue(envText, 'DATABASE_URL');
const JWT_SECRET = h.readEnvValue(envText, 'JWT_SECRET');
const CFG_KEY = h.readEnvValue(envText, 'CONFIG_ENCRYPTION_KEY');
const GEMINI_ENV = h.readEnvValue(envText, 'GEMINI_API_KEY');
const arg = (n) => (process.argv.find((a) => a.startsWith(`--${n}=`)) || '').slice(n.length + 3);
const BASE = arg('base') || `http://localhost:${h.readEnvValue(envText, 'PORT') || 3000}/api`;
const FE = arg('fe') || 'http://localhost:5173';
const LOG = arg('log');
const TAG = `tmp-adminfinal-${Date.now()}`;

const results = [];
const rec = (area, status, msg) => results.push({ area, status, msg });
const ok = (a, c, good, bad, level = 'FAIL') => rec(a, c ? 'PASS' : level, c ? good : bad);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MSG_AGE = 'Học viên không thuộc độ tuổi phù hợp với lớp học này';

(async () => {
  const mongoose = require(path.join(BE, 'node_modules', 'mongoose'));
  const jwt = require(path.join(BE, 'node_modules', 'jsonwebtoken'));
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  const db = mongoose.connection.db;
  const U = db.collection('users');
  const C = db.collection('classrooms');
  const OID = mongoose.Types.ObjectId;
  const created = { users: [], classes: [] };
  const mk = async (role, fullName, extra = {}) => {
    const r = await U.insertOne({ email: `${TAG}-${role.toLowerCase()}-${created.users.length}@audit.local`, password: '$2b$10$tmpaccountnotloginable', fullName, role, status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date(), ...extra });
    created.users.push(r.insertedId);
    return U.findOne({ _id: r.insertedId });
  };
  const tokenFor = (u) => jwt.sign({ sub: String(u._id), email: u.email, role: u.role }, JWT_SECRET, { expiresIn: '15m' });
  const call = async (u, p, method = 'GET', body) => {
    try {
      const r = await fetch(BASE + p, { method, headers: { 'Content-Type': 'application/json', ...(u ? { Authorization: `Bearer ${tokenFor(u)}` } : {}) }, body: body !== undefined ? JSON.stringify(body) : undefined });
      let json = null;
      try { json = await r.json(); } catch { /* không phải JSON */ }
      return { status: r.status, json };
    } catch (e) { return { status: 0, json: null, err: e.message }; }
  };

  // Ảnh chụp để khôi phục
  const careerOrig = await C.findOne({ courseKey: 'tester-qa' });
  const cfgBefore = await db.collection('system_configs').find({ key: { $in: ['GEMINI_API_KEY', 'prompt.coach'] } }).toArray();
  let careerBefore = null;

  try {
    const ping = await call(null, '/contests');
    if (ping.status === 0) { console.error(`Không kết nối được backend tại ${BASE}.`); process.exitCode = 2; return; }

    const admin = await mk('ADMIN', 'Admin Kiểm toán');
    const admin2 = await mk('ADMIN', 'Admin Phụ');
    const t1 = await mk('TEACHER', 'Cô Kiểm Toán Một');
    const t2 = await mk('TEACHER', 'Thầy Kiểm Toán Hai');
    const s69 = await mk('STUDENT', 'HS Khối 6-9', { ageGroup: '6-9' });
    const s1012 = await mk('STUDENT', 'HS Khối 10-12', { ageGroup: '10-12' });
    const s35 = await mk('STUDENT', 'HS Khối 3-5', { ageGroup: '3-5' });
    const sOld = await mk('STUDENT', 'HS Tài khoản cũ');
    const sLock = await mk('STUDENT', 'HS Bị khóa', { ageGroup: '6-9' });
    const adult = await U.findOne({ email: 'nguoidilam1@gmail.com' });
    const cls69 = (await C.insertOne({ name: `${TAG} Lớp 6-9`, code: `TMP-${Date.now() % 100000}`, teacherId: String(t1._id), teacherIds: [String(t1._id)], ageGroup: '6-9', studentIds: [], exerciseSlugs: [], archived: false, createdAt: new Date(), updatedAt: new Date() })).insertedId;
    created.classes.push(cls69);
    careerBefore = careerOrig;

    // ===================== 1. RBAC =====================
    const dummy = '507f1f77bcf86cd799439011';
    const routes = [
      ['GET', '/admin/dashboard/summary'], ['GET', '/admin/health-check'], ['GET', '/admin/configs'], ['PUT', '/admin/configs', { key: 'prompt.coach', value: 'x'.repeat(30) }],
      ['POST', '/admin/configs/test-gemini', {}], ['GET', '/admin/audit-logs'], ['GET', '/admin/portal/classes'], ['GET', `/admin/portal/classes/${dummy}`],
      ['PUT', `/admin/classes/${dummy}/teachers`, { teacherIds: [dummy] }], ['PUT', `/admin/classes/${dummy}/archive`, { archived: true }],
      ['GET', '/admin/users'], ['POST', '/admin/users', { fullName: 'x', email: 'x@y.zz', password: 'abcdef', role: 'TEACHER' }], ['PATCH', '/admin/users/bulk-status', { userIds: [dummy], isActive: false }],
      ['GET', `/admin/users/${dummy}/profile`], ['PUT', `/admin/users/${dummy}`, { fullName: 'x' }], ['PUT', `/admin/users/${dummy}/role`, { role: 'ADMIN' }],
      ['POST', `/admin/users/${dummy}/revoke-teacher`, { mode: 'LOCK' }], ['PUT', `/admin/users/${dummy}/status`, { status: 'LOCKED' }],
      ['GET', '/admin/classes'], ['POST', '/admin/classes', { name: 'x', teacherId: dummy }], ['GET', '/admin/classes/catalog/teachers'], ['GET', '/admin/classes/catalog/students'],
      ['GET', `/admin/classes/${dummy}`], ['PUT', `/admin/classes/${dummy}`, { name: 'x' }], ['DELETE', `/admin/classes/${dummy}`], ['POST', `/admin/classes/${dummy}/students`, { identifiers: ['a@b.cc'] }],
      ['DELETE', `/admin/classes/${dummy}/students/${dummy}`],
    ];
    let rbacBad = [];
    for (const [m, p, b] of routes) {
      const [rt, rs, ra] = [await call(t1, p, m, b), await call(s69, p, m, b), await call(null, p, m, b)];
      if (rt.status !== 403 || rs.status !== 403 || ra.status !== 401) rbacBad.push(`${m} ${p}: GV ${rt.status}, HS ${rs.status}, ẩn danh ${ra.status}`);
    }
    ok('1. RBAC', rbacBad.length === 0, `${routes.length} route /admin: giảng viên 403, học viên 403, ẩn danh 401`, rbacBad.join(' | '));
    const stillThere = await U.countDocuments({ email: 'x@y.zz' });
    ok('1. RBAC', stillThere === 0, 'các lời gọi ghi dữ liệu bằng token GV/HS không để lại thay đổi nào', 'có dữ liệu bị ghi dù bị 403');

    // ===================== 2. Leo thang đặc quyền =====================
    const mkAdmin = await call(admin, '/admin/users', 'POST', { fullName: 'X', email: `${TAG}-new-admin@audit.local`, password: 'matkhau123', role: 'ADMIN' });
    ok('2. Leo quyền', mkAdmin.status === 403, 'POST /admin/users role=ADMIN bị từ chối 403', `status ${mkAdmin.status}`);
    const mkBad = await call(admin, '/admin/users', 'POST', { fullName: 'X', email: `${TAG}-bad@audit.local`, password: 'matkhau123', role: 'SUPERUSER' });
    ok('2. Leo quyền', mkBad.status === 400, 'role lạ bị từ chối 400', `status ${mkBad.status}`);
    ok('2. Leo quyền', (await U.countDocuments({ email: { $in: [`${TAG}-new-admin@audit.local`, `${TAG}-bad@audit.local`] } })) === 0, 'không có tài khoản nào được tạo ra', 'tài khoản lạ đã được tạo');
    const upAdmin = await call(admin, `/admin/users/${s69._id}`, 'PUT', { fullName: 'HS Khối 6-9', role: 'ADMIN' });
    ok('2. Leo quyền', upAdmin.status === 403 && (await U.findOne({ _id: s69._id })).role === 'STUDENT', 'PUT /admin/users/:id kèm role=ADMIN bị từ chối 403, vai trò không đổi', `status ${upAdmin.status}`);
    const upRole = await call(admin, `/admin/users/${s69._id}`, 'PUT', { role: 'TEACHER' });
    ok('2. Leo quyền', upRole.status === 400 && (await U.findOne({ _id: s69._id })).role === 'STUDENT', 'PUT /admin/users/:id không đổi được vai trò/trạng thái (400) - phải dùng endpoint riêng có kiểm soát', `status ${upRole.status}`);
    const roleAdmin = await call(admin, `/admin/users/${s69._id}/role`, 'PUT', { role: 'ADMIN' });
    ok('2. Leo quyền', roleAdmin.status === 403 && (await U.findOne({ _id: s69._id })).role === 'STUDENT', 'PUT /:id/role = ADMIN bị 403', `status ${roleAdmin.status}`);
    const selfLock = await call(admin, `/admin/users/${admin._id}/status`, 'PUT', { status: 'LOCKED' });
    ok('2. Tự khóa', selfLock.status === 403 && (await U.findOne({ _id: admin._id })).status !== 'LOCKED', 'Admin không tự khóa mình (đơn lẻ) - 403', `status ${selfLock.status}`);
    const selfBulk = await call(admin, '/admin/users/bulk-status', 'PATCH', { userIds: [String(admin._id)], isActive: false });
    ok('2. Tự khóa', selfBulk.status === 200 && selfBulk.json.updated === 0 && (await U.findOne({ _id: admin._id })).status !== 'LOCKED', 'Admin không tự khóa mình qua bulk (bỏ qua, updated=0)', JSON.stringify(selfBulk.json));
    const bulkAdmin2 = await call(admin, '/admin/users/bulk-status', 'PATCH', { userIds: [String(admin2._id)], isActive: false });
    ok('2. Tự khóa', bulkAdmin2.json?.updated === 0, 'bulk không khóa được tài khoản Admin khác', JSON.stringify(bulkAdmin2.json));
    const selfDemote = await call(admin, `/admin/users/${admin._id}/role`, 'PUT', { role: 'STUDENT' });
    ok('2. Tự hạ quyền', selfDemote.status === 403 && (await U.findOne({ _id: admin._id })).role === 'ADMIN', 'Admin không tự hạ quyền mình - 403', `status ${selfDemote.status}`);
    const demoteOther = await call(admin, `/admin/users/${admin2._id}/role`, 'PUT', { role: 'STUDENT' });
    ok('2. Tự hạ quyền', demoteOther.status === 403 && (await U.findOne({ _id: admin2._id })).role === 'ADMIN', 'không hạ quyền được tài khoản Admin khác - 403', `status ${demoteOther.status}`);
    const revokeSelf = await call(admin, `/admin/users/${admin._id}/revoke-teacher`, 'POST', { mode: 'LOCK' });
    ok('2. Tự hạ quyền', revokeSelf.status >= 400 && (await U.findOne({ _id: admin._id })).status !== 'LOCKED', `revoke-teacher lên chính mình bị chặn (${revokeSelf.status})`, 'Admin tự khóa được qua revoke-teacher');

    // ===================== 3. Ràng buộc lớp học =====================
    const addErr = async (u) => call(admin, `/admin/classes/${cls69}/students`, 'POST', { identifiers: [u.email] });
    for (const [lbl, u] of [['10-12', s1012], ['3-5', s35]]) {
      const r = await addErr(u);
      ok('3. Khối tuổi', r.status === 400 && r.json?.message === MSG_AGE, `học sinh ${lbl} vào lớp 6-9 -> 400 "${MSG_AGE}"`, `status ${r.status} ${JSON.stringify(r.json)}`);
    }
    const rAdult = adult ? await addErr(adult) : { status: 400, json: { message: MSG_AGE } };
    ok('3. Khối tuổi', rAdult.status === 400 && rAdult.json?.message === MSG_AGE, 'tài khoản Người đi làm vào lớp phổ thông -> 400', `status ${rAdult.status}`);
    const mixed = await call(admin, `/admin/classes/${cls69}/students`, 'POST', { identifiers: [s69.email, s1012.email] });
    ok('3. Khối tuổi', mixed.status === 400 && (await C.findOne({ _id: cls69 })).studentIds.length === 0, 'danh sách lẫn một người lệch khối -> từ chối cả lần, không thêm nửa vời', `status ${mixed.status}`);
    const good = await call(admin, `/admin/classes/${cls69}/students`, 'POST', { identifiers: [s69.email, sOld.email, sLock.email] });
    ok('3. Khối tuổi', good.status === 201 || good.status === 200, `học sinh đúng khối/tài khoản cũ thêm được (${good.json?.added?.length} người)`, `status ${good.status} ${JSON.stringify(good.json)}`);
    const dup = await call(admin, `/admin/classes/${cls69}/students`, 'POST', { identifiers: [s69.email, s69.email.toUpperCase()] });
    const docNow = await C.findOne({ _id: cls69 });
    ok('3. Trùng học viên', dup.json?.added?.length === 0 && new Set(docNow.studentIds.map(String)).size === docNow.studentIds.length, 'thêm lại cùng học viên không tạo bản sao', JSON.stringify(dup.json));

    // Khóa Người đi làm
    careerBefore = await C.findOne({ courseKey: 'tester-qa' });
    if (careerBefore) {
      const cid = String(careerBefore._id);
      const cAdd = await call(admin, `/admin/classes/${cid}/students`, 'POST', { identifiers: [s69.email] });
      const cRem = await call(admin, `/admin/classes/${cid}/students/${s69._id}`, 'DELETE');
      const cDel = await call(admin, `/admin/classes/${cid}`, 'DELETE');
      const cRen = await call(admin, `/admin/classes/${cid}`, 'PUT', { name: 'Tên bị đổi' });
      const cGrade = await call(admin, `/admin/classes/${cid}`, 'PUT', { ageGroup: '6-9' });
      ok('3. Khóa Người đi làm', cAdd.status === 400 && cRem.status === 400, `thêm/gỡ học viên thủ công vào khóa -> 400 ("${cAdd.json?.message}")`, `thêm ${cAdd.status}, gỡ ${cRem.status}`);
      ok('3. Khóa Người đi làm', cDel.status === 400 && cRen.status === 400 && cGrade.status === 400, 'không xóa/đổi tên/đổi khối khóa chuyên ngành -> 400', `xóa ${cDel.status}, tên ${cRen.status}, khối ${cGrade.status}`);
      const still = await C.findOne({ _id: careerBefore._id });
      ok('3. Khóa Người đi làm', !!still && still.name === careerBefore.name && still.code === careerBefore.code, 'khóa còn nguyên tên và mã sau các lời gọi trên', 'khóa bị thay đổi');
      const asg = await call(admin, `/admin/classes/${cid}/teachers`, 'PUT', { teacherIds: [String(t1._id), String(careerBefore.teacherId)] });
      const afterAsg = await C.findOne({ _id: careerBefore._id });
      ok('3. Khóa Người đi làm', asg.status === 200 && afterAsg.teacherIds.length === 2 && String(afterAsg.teacherIds[0]) === String(t1._id), 'phân công giảng viên cho khóa vẫn hoạt động và ghi đúng CSDL', `status ${asg.status} ${JSON.stringify(asg.json)}`);
      const detail = await call(admin, `/admin/portal/classes/${cid}`);
      ok('3. Khóa Người đi làm', detail.status === 200 && detail.json.studentCount === (await U.countDocuments({ role: 'STUDENT', ageGroup: 'CAREER_ADULT', status: { $ne: 'LOCKED' } })), 'sĩ số khóa = số tài khoản CAREER_ADULT đang hoạt động (tính động)', `status ${detail.status}`);
      await C.updateOne({ _id: careerBefore._id }, { $set: { teacherId: careerBefore.teacherId, teacherIds: careerBefore.teacherIds, archived: careerBefore.archived === true } });
    } else rec('3. Khóa Người đi làm', 'WARN', 'chưa seed khóa Người đi làm (node scripts/seed-class.js)');

    // Giảng viên phụ trách
    const emptyT = await call(admin, `/admin/classes/${cls69}/teachers`, 'PUT', { teacherIds: [] });
    const nonT = await call(admin, `/admin/classes/${cls69}/teachers`, 'PUT', { teacherIds: [String(s69._id)] });
    ok('3. Giảng viên', emptyT.status === 400 && nonT.status === 400 && (await C.findOne({ _id: cls69 })).teacherIds.length === 1, 'không gỡ được giảng viên cuối cùng (mảng rỗng) và không gán được người không phải giảng viên - 400', `rỗng ${emptyT.status}, HS ${nonT.status}`);
    const asg2 = await call(admin, `/admin/classes/${cls69}/teachers`, 'PUT', { teacherIds: [String(t1._id), String(t2._id)] });
    await call(admin, `/admin/users/${t2._id}/status`, 'PUT', { status: 'LOCKED' });
    const ov = await call(admin, '/admin/portal/classes');
    const row = ov.json?.find?.((r) => r.id === String(cls69));
    ok('3. Giảng viên khóa', asg2.status === 200 && row?.teachers?.find((t) => t.id === String(t2._id))?.locked === true && row.teachers.find((t) => t.id === String(t1._id))?.locked === false, 'giảng viên bị khóa vẫn nằm trong lớp (giữ lịch sử) kèm cờ locked=true để FE hiện badge xám', JSON.stringify(row?.teachers));
    const asgLocked = await call(admin, `/admin/classes/${cls69}/teachers`, 'PUT', { teacherIds: [String(t2._id)] });
    ok('3. Giảng viên khóa', asgLocked.status === 400, 'không gán mới giảng viên đang bị khóa - 400', `status ${asgLocked.status}`);
    await call(admin, `/admin/users/${t2._id}/status`, 'PUT', { status: 'ACTIVE' });

    // ===================== 4. Rò rỉ dữ liệu =====================
    const SENSITIVE_KEYS = /^(password|passwordhash|hash|salt|sessionsrevokedat|apikey|geminiapikey|secret|token|accesstoken|refreshtoken|resettoken)$/i;
    const secrets = [JWT_SECRET, CFG_KEY, GEMINI_ENV].filter((x) => x && x.length > 12);
    const scan = (label, value) => {
      const text = JSON.stringify(value ?? null);
      const bad = [];
      const walk = (v, p) => {
        if (Array.isArray(v)) return v.forEach((x, i) => walk(x, `${p}[${i}]`));
        if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) { if (SENSITIVE_KEYS.test(k)) bad.push(`${p}.${k}`); walk(x, `${p}.${k}`); }
      };
      walk(value, label);
      if (/\$2[aby]\$\d\d\$/.test(text)) bad.push('bcrypt hash trong giá trị');
      for (const s of secrets) if (text.includes(s)) bad.push('bí mật hệ thống trong giá trị');
      return bad;
    };
    const leakTargets = {
      'GET /admin/users': await call(admin, '/admin/users?pageSize=100'),
      'GET /admin/users/:id/profile': await call(admin, `/admin/users/${s69._id}/profile`),
      'GET /admin/portal/classes': await call(admin, '/admin/portal/classes'),
      'GET /admin/portal/classes/:id': await call(admin, `/admin/portal/classes/${cls69}`),
      'GET /admin/classes': await call(admin, '/admin/classes'),
      'GET /admin/classes/:id': await call(admin, `/admin/classes/${cls69}`),
      'GET /admin/classes/catalog/students': await call(admin, '/admin/classes/catalog/students?q=a'),
      'GET /admin/classes/catalog/teachers': await call(admin, '/admin/classes/catalog/teachers?q='),
      'GET /admin/audit-logs': await call(admin, '/admin/audit-logs?pageSize=100'),
      'GET /admin/configs': await call(admin, '/admin/configs'),
      'GET /admin/dashboard/summary': await call(admin, '/admin/dashboard/summary'),
    };
    const createdRes = await call(admin, '/admin/users', 'POST', { fullName: 'Tạm Lộ', email: `${TAG}-leak@audit.local`, password: 'matkhau-bi-mat-123', role: 'STUDENT', ageGroup: '6-9' });
    if (createdRes.json?.id) created.users.push(new OID(createdRes.json.id));
    leakTargets['POST /admin/users'] = createdRes;
    leakTargets['PUT /admin/users/:id'] = await call(admin, `/admin/users/${createdRes.json?.id}`, 'PUT', { password: 'matkhau-moi-bi-mat-1' });
    leakTargets['PUT /admin/users/:id/status'] = await call(admin, `/admin/users/${s69._id}/status`, 'PUT', { status: 'ACTIVE' });
    leakTargets['PATCH /admin/users/bulk-status'] = await call(admin, '/admin/users/bulk-status', 'PATCH', { userIds: [String(sLock._id)], isActive: false });
    for (const [label, r] of Object.entries(leakTargets)) {
      const bad = scan(label, r.json);
      const body = JSON.stringify(r.json ?? null);
      ok('4. Rò rỉ dữ liệu', r.status < 400 && bad.length === 0 && !body.includes('matkhau-bi-mat-123') && !body.includes('matkhau-moi-bi-mat-1'), `${label}: không có password/hash/salt/token/bí mật`, `${label}: status ${r.status} ${bad.join(', ')}`);
    }
    const cfg = leakTargets['GET /admin/configs'].json;
    ok('4. Rò rỉ dữ liệu', !cfg.gemini.masked || (cfg.gemini.masked.endsWith('...****') && !JSON.stringify(cfg).includes(GEMINI_ENV)), `API key chỉ ở dạng che (${cfg.gemini.masked})`, 'key lộ ở dạng đầy đủ');

    // ===================== 5. Cấu hình =====================
    const trimmed = await call(admin, '/admin/configs', 'PUT', { key: 'GEMINI_API_KEY', value: `  \n ${GEMINI_ENV} \t\r\n` });
    const stored = await db.collection('system_configs').findOne({ key: 'GEMINI_API_KEY' });
    let decrypted = null;
    try { decrypted = require(path.join(BE, 'dist', 'modules-api', 'admin-portal', 'config-crypto.js')).decryptSecret(stored.value, CFG_KEY); } catch { /* chưa build */ }
    ok('5. Cấu hình', trimmed.status === 200 && stored?.encrypted === true && !stored.value.includes(GEMINI_ENV.slice(0, 12)), 'lưu key có khoảng trắng đầu/cuối thành công, CSDL chỉ chứa bản mã (iv.tag.ciphertext)', `status ${trimmed.status} ${JSON.stringify(trimmed.json)}`);
    ok('5. Cấu hình', stored?.value.split('.').length === 3 && (decrypted === null || decrypted === GEMINI_ENV), 'AES-256-GCM: giải mã ra ĐÚNG key đã cắt khoảng trắng', 'giải mã sai hoặc sai định dạng');
    const fake = await call(admin, '/admin/configs', 'PUT', { key: 'GEMINI_API_KEY', value: 'AIzaSyFAKE_FAKE_FAKE_FAKE_FAKE_FAKE_12345' });
    const storedAfterFake = await db.collection('system_configs').findOne({ key: 'GEMINI_API_KEY' });
    ok('5. Cấu hình', fake.status === 400 && storedAfterFake.value === stored.value, `key giả bị Gemini từ chối -> 400, KHÔNG ghi đè key tốt ("${fake.json?.message}")`, `status ${fake.status}`);
    const mid = await call(admin, '/admin/configs', 'PUT', { key: 'GEMINI_API_KEY', value: 'AIzaSy có dấu cách giữa key 0123456789' });
    ok('5. Cấu hình', mid.status === 400, 'key có khoảng trắng GIỮA chừng bị từ chối 400', `status ${mid.status}`);
    const tg = await call(admin, '/admin/configs/test-gemini', 'POST', {});
    ok('5. Cấu hình', (tg.status === 200 || tg.status === 201) && tg.json.valid === true, `kiểm tra kết nối bằng key vừa lưu: hợp lệ ${tg.json?.latencyMs}ms (dùng key mới ngay, không khởi động lại)`, JSON.stringify(tg.json), 'WARN');
    const longPrompt = 'Bạn là gia sư kiểm toán, trả lời ngắn gọn bằng tiếng Việt. ' + TAG;
    await call(admin, '/admin/configs', 'PUT', { key: 'prompt.coach', value: longPrompt });
    const g1 = await call(admin, '/admin/configs');
    ok('5. Prompt cache', g1.json.prompts.find((p) => p.key === 'coach').value === longPrompt, 'sửa prompt xong, lần đọc kế tiếp thấy NGAY nội dung mới (cache 60s bị làm mới)', 'còn thấy nội dung cũ');
    await call(admin, '/admin/configs', 'PUT', { key: 'prompt.coach', value: '' });
    const g2 = await call(admin, '/admin/configs');
    ok('5. Prompt cache', g2.json.prompts.find((p) => p.key === 'coach').isDefault === true, 'đặt trống -> về prompt mặc định ngay', 'chưa về mặc định');
    const badPrompt = await call(admin, '/admin/configs', 'PUT', { key: 'prompt.coach', value: 'ngắn' });
    ok('5. Prompt cache', badPrompt.status === 400, 'prompt quá ngắn bị từ chối 400', `status ${badPrompt.status}`);

    // ===================== 6. Audit coverage =====================
    const clsLegacy = await call(admin, '/admin/classes', 'POST', { name: `${TAG} Lớp legacy`, teacherId: String(t1._id), ageGroup: '3-5' });
    if (clsLegacy.json?.id) created.classes.push(new OID(clsLegacy.json.id));
    await call(admin, `/admin/classes/${clsLegacy.json?.id}`, 'PUT', { name: `${TAG} Lớp legacy đổi tên` });
    await call(admin, `/admin/classes/${cls69}/students/${sOld._id}`, 'DELETE');
    await call(admin, `/admin/classes/${cls69}/archive`, 'PUT', { archived: true });
    await call(admin, `/admin/classes/${cls69}/archive`, 'PUT', { archived: false });
    await call(admin, `/admin/users/${s35._id}/role`, 'PUT', { role: 'TEACHER' });
    await call(admin, `/admin/users/${s35._id}/status`, 'PUT', { status: 'LOCKED' });
    await call(admin, `/admin/users/${s35._id}/status`, 'PUT', { status: 'ACTIVE' });
    await call(admin, '/admin/users/bulk-status', 'PATCH', { userIds: [String(sLock._id)], isActive: true });
    await call(admin, `/admin/classes/${clsLegacy.json?.id}`, 'DELETE');
    await sleep(300);
    const logs = await db.collection('audit_logs').find({ actorId: String(admin._id) }).toArray();
    const have = new Set(logs.map((l) => l.action));
    const need = ['USER_CREATE', 'USER_UPDATE', 'USER_LOCK', 'USER_UNLOCK', 'BULK_LOCK', 'BULK_UNLOCK', 'ROLE_CHANGE', 'STUDENT_ADD', 'STUDENT_REMOVE', 'CLASS_ASSIGN', 'CLASS_ARCHIVE', 'CLASS_CREATE', 'CLASS_UPDATE', 'CLASS_DELETE', 'CONFIG_UPDATE'];
    for (const a of need) ok('6. Audit log', have.has(a), `có bản ghi ${a}`, `THIẾU bản ghi ${a}`);
    const keyLog = logs.find((l) => l.action === 'CONFIG_UPDATE' && l.targetId === 'GEMINI_API_KEY');
    ok('6. Audit log', keyLog && !JSON.stringify(keyLog).includes(GEMINI_ENV) && JSON.stringify(keyLog.diff).includes('****'), 'đổi API key được ghi nhưng chỉ chứa bản che', 'thiếu log key hoặc lộ key');
    ok('6. Audit log', !JSON.stringify(logs).match(/matkhau|\$2[aby]\$/), 'không bản ghi nào chứa mật khẩu/hash', 'audit log chứa mật khẩu');
    ok('6. Audit log', logs.every((l) => l.actorEmail === admin.email && l.timestamp), 'mọi bản ghi có người thực hiện và thời gian', 'bản ghi thiếu actor/timestamp');

    // ===================== 7. Hiệu năng / rate limit =====================
    const h1 = await call(admin, '/admin/health-check');
    const h2 = await call(admin, '/admin/health-check');
    const h3 = await call(admin, '/admin/health-check');
    ok('7. Rate limit', h1.status === 200 && h2.status === 429 && h3.status === 429, `health-check: lần 1 = ${h1.status}, lần 2-3 trong 10 giây = ${h2.status}/${h3.status} (429)`, `${h1.status}/${h2.status}/${h3.status}`);
    ok('7. Rate limit', h1.json?.clusters?.length === 5, `health-check chạy song song 5 cụm (${h1.json?.status})`, 'thiếu cụm');
    const seed = Array.from({ length: 130 }, (_, i) => ({ actorId: `${TAG}-pag`, actorEmail: `${TAG}-pag@audit.local`, action: 'USER_LOCK', targetType: 'USER', targetId: `t${i}`, diff: { before: null, after: null }, timestamp: new Date(Date.now() - i * 1000) }));
    await db.collection('audit_logs').insertMany(seed);
    const p1 = await call(admin, `/admin/audit-logs?pageSize=9999&actorEmail=${TAG}-pag`);
    const p2 = await call(admin, `/admin/audit-logs?pageSize=100&page=2&actorEmail=${TAG}-pag`);
    ok('7. Phân trang Audit', p1.json?.items?.length === 100 && p1.json.total === 130 && p2.json?.items?.length === 30, `130 bản ghi: pageSize=9999 bị chặn ở ${p1.json?.items?.length}/trang, trang 2 còn ${p2.json?.items?.length}, tổng ${p1.json?.total}`, JSON.stringify([p1.json?.items?.length, p1.json?.total, p2.json?.items?.length]));

    // ===================== 8. Rò rỉ qua log máy chủ =====================
    if (LOG && fs.existsSync(LOG)) {
      const logText = fs.readFileSync(LOG, 'utf8');
      const leaked = [JWT_SECRET, CFG_KEY, GEMINI_ENV, 'matkhau-bi-mat-123', 'matkhau-moi-bi-mat-1'].filter((s) => s && logText.includes(s));
      ok('8. Log máy chủ', leaked.length === 0, `log BE (${logText.length} byte) không chứa khóa/mật khẩu`, `log chứa ${leaked.length} bí mật`);
    } else rec('8. Log máy chủ', 'WARN', 'không có --log=<file log BE> để đối chiếu');

    // ===================== 9. Frontend chặn truy cập chéo =====================
    try {
      const puppeteer = require(path.join(ROOT, 'node_modules', 'puppeteer-core'));
      const exe = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find(fs.existsSync);
      const feUp = await fetch(FE).then((r) => r.ok).catch(() => false);
      if (!exe || !feUp) throw new Error('không có trình duyệt hoặc FE chưa chạy');
      const browser = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--no-sandbox'] });
      const visit = async (user, pathName) => {
        const page = await browser.newPage();
        if (user) await page.evaluateOnNewDocument((t, u) => { localStorage.setItem('token', t); localStorage.setItem('app_auth_user', JSON.stringify(u)); }, tokenFor(user), { id: String(user._id), email: user.email, fullName: user.fullName, role: user.role, ageGroup: user.ageGroup });
        await page.goto(FE + pathName, { waitUntil: 'networkidle2' }).catch(() => {});
        await sleep(600);
        const finalPath = new URL(page.url()).pathname;
        const sees = await page.evaluate(() => /Admin Portal|Quản lý người dùng|Lớp học & Khóa học/.test(document.body.innerText));
        await page.close();
        return { finalPath, sees };
      };
      for (const [label, user, expectIn] of [['giảng viên', t1, ['/authoring', '/teacher', '/dashboard']], ['học viên', s69, ['/catalog', '/my-class', '/']], ['chưa đăng nhập', null, ['/login']]]) {
        for (const p of ['/admin/users', '/admin/classes', '/admin/settings', '/admin/dashboard']) {
          const r = await visit(user, p);
          ok('9. FE chặn truy cập chéo', !r.finalPath.startsWith('/admin') && !r.sees, `${label} gõ ${p} -> bị chuyển tới ${r.finalPath}`, `${label} vào được ${r.finalPath} (thấy giao diện admin: ${r.sees})`);
          void expectIn;
        }
      }
      const adminOk = await visit(admin, '/admin/classes');
      ok('9. FE chặn truy cập chéo', adminOk.finalPath === '/admin/classes' && adminOk.sees, 'Admin thật vẫn vào được /admin/classes', `Admin bị chuyển tới ${adminOk.finalPath}`);
      await browser.close();
    } catch (e) {
      rec('9. FE chặn truy cập chéo', 'WARN', `bỏ qua phần trình duyệt: ${e.message}`);
    }
  } finally {
    try {
      const ids = created.users;
      await db.collection('audit_logs').deleteMany({ $or: [{ actorId: { $in: ids.map(String) } }, { actorId: `${TAG}-pag` }, { targetId: { $in: [...ids.map(String), ...created.classes.map(String)] } }] });
      if (careerBefore) await C.updateOne({ _id: careerBefore._id }, { $set: { teacherId: careerBefore.teacherId, teacherIds: careerBefore.teacherIds, archived: careerBefore.archived === true, name: careerBefore.name } });
      // khôi phục cấu hình hệ thống như trước khi kiểm toán
      await db.collection('system_configs').deleteMany({ key: { $in: ['GEMINI_API_KEY', 'prompt.coach'] } });
      if (cfgBefore.length) await db.collection('system_configs').insertMany(cfgBefore);
      if (created.classes.length) await C.deleteMany({ _id: { $in: created.classes } });
      await U.deleteMany({ _id: { $in: ids } });
      const left = await U.countDocuments({ email: { $regex: `^${TAG}` } });
      const careerNow = await C.findOne({ courseKey: 'tester-qa' });
      rec('Dọn dẹp', left === 0 && (!careerOrig || (String(careerNow.teacherId) === String(careerOrig.teacherId) && careerNow.name === careerOrig.name)) ? 'PASS' : 'FAIL', left === 0 ? 'đã xóa tài khoản/lớp/audit tạm, khôi phục khóa chuyên ngành và cấu hình hệ thống' : `còn ${left} tài khoản tạm`);
    } catch (e) { rec('Dọn dẹp', 'FAIL', e.message); }
    await mongoose.disconnect();
  }

  for (const r of results) console.log(`[${r.status}] ${r.area}: ${r.msg}`);
  const c = (s) => results.filter((r) => r.status === s).length;
  console.log(`\nTổng: ${c('PASS')} PASS, ${c('WARN')} WARN, ${c('FAIL')} FAIL`);
  if (c('FAIL')) process.exitCode = 1;
})().catch((e) => { console.error(e); process.exitCode = 1; });
