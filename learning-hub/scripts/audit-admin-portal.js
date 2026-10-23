#!/usr/bin/env node
/**
 * Kiểm tra Admin Portal v2 qua HTTP THẬT vào backend đang chạy (mặc định http://localhost:<PORT>/api).
 * AN TOÀN cho Atlas dùng chung: chỉ tạo tài khoản/lớp TẠM (email tmp-adminportal-*@audit.local), không ghi cấu hình
 * hệ thống thật, và luôn dọn sạch (kể cả audit log phát sinh) ở cuối. Token ký cục bộ bằng JWT_SECRET, không in ra.
 *   node scripts/audit-admin-portal.js [--base=http://localhost:3000/api]
 */
const fs = require('fs');
const path = require('path');
const h = require('./lib/setup-helpers');

const BE = path.join(__dirname, '..', 'BE');
const envText = fs.readFileSync(path.join(BE, '.env'), 'utf8');
const uri = h.readEnvValue(envText, 'DATABASE_URL');
const secret = h.readEnvValue(envText, 'JWT_SECRET');
const baseArg = process.argv.find((a) => a.startsWith('--base='));
const BASE = baseArg ? baseArg.slice(7) : `http://localhost:${h.readEnvValue(envText, 'PORT') || 3000}/api`;
const TAG = `tmp-adminportal-${Date.now()}`;

const results = [];
const rec = (area, status, msg) => results.push({ area, status, msg });
const ok = (a, c, good, bad) => rec(a, c ? 'PASS' : 'FAIL', c ? good : bad);

(async () => {
  const mongoose = require(path.join(BE, 'node_modules', 'mongoose'));
  const jwt = require(path.join(BE, 'node_modules', 'jsonwebtoken'));
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  const db = mongoose.connection.db;
  const U = db.collection('users');
  const created = { users: [], classes: [] };

  const mk = async (role, extra = {}) => {
    const r = await U.insertOne({
      email: `${TAG}-${role.toLowerCase()}-${created.users.length}@audit.local`,
      password: 'x',
      fullName: `Tạm ${role} ${created.users.length}`,
      role,
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...extra,
    });
    const doc = await U.findOne({ _id: r.insertedId });
    created.users.push(doc._id);
    return doc;
  };
  const tokenFor = (u) => jwt.sign({ sub: String(u._id), email: u.email, role: u.role }, secret, { expiresIn: '10m' });
  const call = async (u, p, opts = {}) => {
    const headers = { 'Content-Type': 'application/json', ...(u ? { Authorization: `Bearer ${tokenFor(u)}` } : {}) };
    try {
      const r = await fetch(BASE + p, { method: opts.method || 'GET', headers, body: opts.body ? JSON.stringify(opts.body) : undefined });
      let json = null;
      try { json = await r.json(); } catch { /* không phải JSON */ }
      return { status: r.status, json };
    } catch (e) {
      return { status: 0, json: null, err: e.message };
    }
  };

  try {
    const ping = await call(null, '/contests');
    if (ping.status === 0) {
      console.error(`Không kết nối được backend tại ${BASE}. Hãy chạy: cd BE && npm run start:dev`);
      process.exitCode = 2;
      return;
    }
    const admin = await mk('ADMIN');
    const t1 = await mk('TEACHER');
    const t2 = await mk('TEACHER');
    const stu = await mk('STUDENT', { ageGroup: '6-9' });
    const stu2 = await mk('STUDENT', { ageGroup: '3-5' });

    // --- Phân quyền ---
    for (const p of ['/admin/dashboard/summary', '/admin/health-check', '/admin/configs', '/admin/audit-logs', '/admin/portal/classes']) {
      const a = await call(t1, p);
      const b = await call(stu, p);
      const c = await call(null, p);
      ok('Phân quyền', a.status === 403 && b.status === 403 && c.status === 401, `${p}: giảng viên/học viên 403, ẩn danh 401`, `${p}: ${a.status}/${b.status}/${c.status}`);
    }

    // --- Dashboard ---
    const sum = await call(admin, '/admin/dashboard/summary');
    ok('Dashboard', sum.status === 200 && sum.json.totalUsers >= 5 && sum.json.submissionsLast7Days?.length === 7 && sum.json.studentsByAgeGroup, `tổng ${sum.json?.totalUsers} người dùng, ${sum.json?.openClasses} lớp mở, ${sum.json?.submissionsToday} bài hôm nay (${sum.json?.completionRateToday}%)`, `status ${sum.status}`);

    // --- Cấu hình: chỉ ĐỌC, không bao giờ lộ key ---
    const cfg = await call(admin, '/admin/configs');
    const raw = JSON.stringify(cfg.json);
    const envKey = h.readEnvValue(envText, 'GEMINI_API_KEY');
    ok('Cấu hình', cfg.status === 200 && cfg.json.prompts?.length === 3 && (!envKey || !raw.includes(envKey)), `3 prompt, key chỉ dạng che (${cfg.json?.gemini?.masked || 'chưa có'}, nguồn ${cfg.json?.gemini?.source})`, `status ${cfg.status} hoặc lộ key`);
    const badKey = await call(admin, '/admin/configs', { method: 'PUT', body: { key: 'GEMINI_API_KEY', value: 'ngan' } });
    ok('Cấu hình', badKey.status === 400, 'key sai định dạng bị từ chối 400 (không ghi gì)', `status ${badKey.status}`);
    const badKey2 = await call(admin, '/admin/configs', { method: 'PUT', body: { key: 'khong.hop.le', value: 'x'.repeat(30) } });
    ok('Cấu hình', badKey2.status === 400, 'khóa cấu hình lạ bị từ chối 400', `status ${badKey2.status}`);
    const test = await call(admin, '/admin/configs/test-gemini', { method: 'POST', body: {} });
    ok('Cấu hình', test.status === 201 || test.status === 200, `test-gemini trả valid=${test.json?.valid}, ${test.json?.latencyMs}ms`, `status ${test.status}`);

    // --- Health-check ---
    const hc = await call(admin, '/admin/health-check');
    ok('Health', hc.status === 200 && hc.json.clusters?.length === 5, `tổng thể ${hc.json?.status}: ${hc.json?.clusters?.map((c) => `${c.key}=${c.status}/${c.latencyMs}ms`).join(', ')}`, `status ${hc.status}`);
    const hc2 = await call(admin, '/admin/health-check');
    ok('Health', hc2.status === 429, 'gọi lần 2 trong 10 giây bị giới hạn 429', `status ${hc2.status}`);

    // --- Khóa tài khoản có hiệu lực ngay ---
    const lock = await call(admin, `/admin/users/${stu._id}/status`, { method: 'PUT', body: { status: 'LOCKED' } });
    const afterLock = await call(stu, '/auth/me');
    ok('Khóa tài khoản', lock.status === 200 && afterLock.status === 401 && afterLock.json?.code === 'ACCOUNT_LOCKED', 'sau khi khóa, request kế tiếp nhận 401 ACCOUNT_LOCKED', `lock ${lock.status}, sau đó ${afterLock.status} ${JSON.stringify(afterLock.json)}`);
    ok('Khóa tài khoản', afterLock.json?.message === 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.', 'thông báo tiếng Việt đúng yêu cầu', `message: ${afterLock.json?.message}`);
    const unlock = await call(admin, `/admin/users/${stu._id}/status`, { method: 'PUT', body: { status: 'ACTIVE' } });
    const afterUnlock = await call(stu, '/auth/me');
    ok('Khóa tài khoản', unlock.status === 200 && afterUnlock.status === 200, 'mở khóa xong dùng lại được ngay, không cần đăng nhập lại', `unlock ${unlock.status}, sau đó ${afterUnlock.status}`);

    // --- Khóa hàng loạt ---
    const bulk = await call(admin, '/admin/users/bulk-status', { method: 'PATCH', body: { userIds: [String(stu._id), String(stu2._id), String(admin._id), String(t1._id)], isActive: false } });
    ok('Khóa hàng loạt', bulk.status === 200 && bulk.json.updated === 3 && bulk.json.skipped.some((s) => s.id === String(admin._id)), `khóa ${bulk.json?.updated} người, bỏ qua ${bulk.json?.skipped?.length} (Admin/chính mình)`, `status ${bulk.status} ${JSON.stringify(bulk.json)}`);
    const t1Locked = await call(t1, '/teacher/classes');
    ok('Khóa hàng loạt', t1Locked.status === 401 && t1Locked.json?.code === 'ACCOUNT_LOCKED', 'giảng viên bị khóa hàng loạt cũng nhận ACCOUNT_LOCKED', `status ${t1Locked.status}`);
    const bulkSelf = await call(admin, '/admin/users/bulk-status', { method: 'PATCH', body: { userIds: [String(admin._id)], isActive: false } });
    ok('Khóa hàng loạt', bulkSelf.status === 200 && bulkSelf.json.updated === 0, 'Admin không tự khóa mình qua bulk', `updated ${bulkSelf.json?.updated}`);
    const bulkUn = await call(admin, '/admin/users/bulk-status', { method: 'PATCH', body: { userIds: [String(stu._id), String(stu2._id), String(t1._id)], isActive: true } });
    ok('Khóa hàng loạt', bulkUn.status === 200 && bulkUn.json.updated === 3, 'mở khóa hàng loạt 3 người', `status ${bulkUn.status}`);
    const bad = await call(admin, '/admin/users/bulk-status', { method: 'PATCH', body: { userIds: [], isActive: true } });
    ok('Khóa hàng loạt', bad.status === 400, 'mảng rỗng bị từ chối 400', `status ${bad.status}`);

    // --- Người dùng: tạo/sửa/lọc, không xóa cứng, không tạo ADMIN ---
    const newEmail = `${TAG}-created@audit.local`;
    const cr = await call(admin, '/admin/users', { method: 'POST', body: { fullName: 'Tạm Mới', email: newEmail, password: 'matkhau123', role: 'STUDENT', ageGroup: 'CAREER_ADULT' } });
    if (cr.json?.id) created.users.push(new mongoose.Types.ObjectId(cr.json.id));
    ok('Người dùng', cr.status === 201 && cr.json.ageGroup === 'CAREER_ADULT', 'tạo học viên kèm khối CAREER_ADULT', `status ${cr.status} ${JSON.stringify(cr.json)}`);
    const crAdmin = await call(admin, '/admin/users', { method: 'POST', body: { fullName: 'X', email: `${TAG}-x@audit.local`, password: 'matkhau123', role: 'ADMIN' } });
    ok('Người dùng', crAdmin.status === 403, 'không tạo được tài khoản ADMIN (403)', `status ${crAdmin.status}`);
    const upd = await call(admin, `/admin/users/${cr.json?.id}`, { method: 'PUT', body: { fullName: 'Tạm Đã Sửa', ageGroup: '10-12', password: 'matkhaumoi1' } });
    ok('Người dùng', upd.status === 200 && upd.json.fullName === 'Tạm Đã Sửa' && upd.json.passwordReset === true && !JSON.stringify(upd.json).includes('matkhaumoi1'), 'sửa họ tên/khối và đặt lại mật khẩu (không lộ mật khẩu)', `status ${upd.status}`);
    const flt = await call(admin, `/admin/users?ageGroup=10-12&q=${encodeURIComponent(TAG)}`);
    ok('Người dùng', flt.status === 200 && flt.json.items.some((u) => u.id === cr.json?.id), 'lọc theo khối + tìm kiếm tìm thấy người vừa tạo', `status ${flt.status}`);
    const del = await call(admin, `/admin/users/${cr.json?.id}`, { method: 'DELETE' });
    const still = await U.findOne({ _id: new mongoose.Types.ObjectId(cr.json.id) });
    ok('Người dùng', [404, 405].includes(del.status) && !!still, `DELETE /admin/users/:id không tồn tại (${del.status}) và dữ liệu còn nguyên`, `status ${del.status}, còn=${!!still}`);

    // --- Lớp: nhiều giảng viên, có hiệu lực ngay ---
    const cls = await db.collection('classrooms').insertOne({ name: `${TAG} lớp`, code: `TMP-${Date.now() % 100000}`, teacherId: String(t1._id), studentIds: [String(stu._id)], exerciseSlugs: [], archived: false, createdAt: new Date(), updatedAt: new Date() });
    created.classes.push(cls.insertedId);
    const before = await call(t2, '/teacher/classes');
    ok('Lớp học', before.status === 200 && !before.json.some((c) => c.id === String(cls.insertedId)), 'trước khi gán, giảng viên 2 chưa thấy lớp', `status ${before.status}`);
    const asg = await call(admin, `/admin/classes/${cls.insertedId}/teachers`, { method: 'PUT', body: { teacherIds: [String(t1._id), String(t2._id)] } });
    ok('Lớp học', asg.status === 200 && asg.json.teachers.length === 2, 'gán 2 giảng viên cho lớp', `status ${asg.status} ${JSON.stringify(asg.json)}`);
    const after1 = await call(t2, '/teacher/classes');
    const after2 = await call(t1, '/teacher/classes');
    ok('Lớp học', after1.json?.some((c) => c.id === String(cls.insertedId)) && after2.json?.some((c) => c.id === String(cls.insertedId)), 'cả hai giảng viên thấy lớp NGAY trong GET /teacher/classes', 'một trong hai không thấy lớp');
    const access = await call(t2, `/teacher/classes/${cls.insertedId}/analytics`);
    ok('Lớp học', access.status === 200, 'giảng viên được gán thêm mở được số liệu lớp', `status ${access.status}`);
    const badAsg = await call(admin, `/admin/classes/${cls.insertedId}/teachers`, { method: 'PUT', body: { teacherIds: [String(stu._id)] } });
    ok('Lớp học', badAsg.status === 400, 'không gán được tài khoản không phải giảng viên (400)', `status ${badAsg.status}`);
    const ov = await call(admin, '/admin/portal/classes');
    const row = ov.json?.find?.((c) => c.id === String(cls.insertedId));
    ok('Lớp học', ov.status === 200 && row?.teachers?.length === 2 && row.studentCount === 1, 'danh sách lớp trả giảng viên dạng tag và sĩ số', `status ${ov.status}`);

    // --- Audit log ---
    const al = await call(admin, `/admin/audit-logs?pageSize=100&actorEmail=${encodeURIComponent(admin.email)}`);
    const acts = new Set(al.json?.items?.map((i) => i.action));
    for (const a of ['USER_LOCK', 'USER_UNLOCK', 'BULK_LOCK', 'BULK_UNLOCK', 'USER_CREATE', 'USER_UPDATE', 'CLASS_ASSIGN']) {
      ok('Audit log', acts.has(a), `có bản ghi ${a}`, `thiếu bản ghi ${a}`);
    }
    const lockRow = al.json?.items?.find((i) => i.action === 'USER_LOCK');
    ok('Audit log', lockRow?.diff?.before?.status === 'ACTIVE' && lockRow?.diff?.after?.status === 'LOCKED', 'USER_LOCK có diff before ACTIVE → after LOCKED', JSON.stringify(lockRow?.diff));
    ok('Audit log', !JSON.stringify(al.json).includes('matkhaumoi1'), 'audit log không chứa mật khẩu', 'lộ mật khẩu trong audit log');
    const filt = await call(admin, `/admin/audit-logs?action=CLASS_ASSIGN&actorEmail=${encodeURIComponent(TAG)}`);
    ok('Audit log', filt.status === 200 && filt.json.items.every((i) => i.action === 'CLASS_ASSIGN'), 'lọc theo hành động hoạt động', `status ${filt.status}`);
  } finally {
    // Dọn sạch mọi thứ tạo ra, kể cả audit log của các admin tạm.
    try {
      const ids = created.users;
      await db.collection('audit_logs').deleteMany({ $or: [{ actorId: { $in: ids.map(String) } }, { targetId: { $in: ids.map(String) } }, { targetId: { $in: created.classes.map(String) } }] });
      if (created.classes.length) await db.collection('classrooms').deleteMany({ _id: { $in: created.classes } });
      await db.collection('proctor_alerts').deleteMany({ teacherId: { $in: ids.map(String) } });
      await U.deleteMany({ _id: { $in: ids } });
      const left = await U.countDocuments({ email: { $regex: `^${TAG}` } });
      rec('Dọn dẹp', left === 0 ? 'PASS' : 'FAIL', left === 0 ? 'đã xóa toàn bộ tài khoản, lớp, audit log tạm' : `còn ${left} tài khoản tạm`);
    } catch (e) {
      rec('Dọn dẹp', 'FAIL', e.message);
    }
    await mongoose.disconnect();
  }

  const icon = { PASS: 'PASS', FAIL: 'FAIL', WARN: 'WARN' };
  for (const r of results) console.log(`[${icon[r.status]}] ${r.area}: ${r.msg}`);
  const fails = results.filter((r) => r.status === 'FAIL').length;
  console.log(`\nTổng: ${results.filter((r) => r.status === 'PASS').length} PASS, ${fails} FAIL`);
  if (fails) process.exitCode = 1;
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
