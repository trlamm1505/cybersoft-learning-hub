#!/usr/bin/env node
/**
 * Kiểm tra TÍNH NHẤT QUÁN DỮ LIỆU XUYÊN VAI TRÒ: những gì Admin Portal hiển thị phải khớp 100% với những gì giảng viên và học viên
 * thật sự thấy khi đăng nhập. CHỈ ĐỌC (GET + đọc CSDL); token ký cục bộ bằng JWT_SECRET, không in ra, không sửa dữ liệu.
 *   1) Toàn vẹn khóa ngoại trong CSDL (teacherId/teacherIds/studentIds/classId/courseKey).
 *   2) Admin ↔ Giảng viên: GET /teacher/classes của từng giảng viên có đúng các lớp Admin gán, cùng sĩ số và số bài.
 *   3) Admin ↔ Học viên: /student/classes, /student/classes/:id/overview, /student/career-courses, /student/enrollments.
 *   node scripts/audit-cross-role.js [--base=http://localhost:3000/api]
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

const results = [];
const rec = (area, status, msg) => results.push({ area, status, msg });
const ok = (a, c, good, bad, level = 'FAIL') => rec(a, c ? 'PASS' : level, c ? good : bad);

(async () => {
  const mongoose = require(path.join(BE, 'node_modules', 'mongoose'));
  const jwt = require(path.join(BE, 'node_modules', 'jsonwebtoken'));
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  const db = mongoose.connection.db;
  const OID = mongoose.Types.ObjectId;
  const users = await db.collection('users').find({}, { projection: { email: 1, fullName: 1, role: 1, ageGroup: 1, status: 1 } }).toArray();
  const byId = new Map(users.map((u) => [String(u._id), u]));
  const classes = await db.collection('classrooms').find({}).toArray();
  const asgs = await db.collection('class_assignments').find({}, { projection: { classId: 1 } }).toArray();
  const asgCount = new Map();
  for (const a of asgs) asgCount.set(a.classId, (asgCount.get(a.classId) ?? 0) + 1);
  const nameOf = (id) => byId.get(String(id))?.fullName || byId.get(String(id))?.email || `(không tồn tại: ${id})`;
  const tokenFor = (u) => jwt.sign({ sub: String(u._id), email: u.email, role: u.role }, secret, { expiresIn: '10m' });

  // ---------------- 1) Toàn vẹn khóa ngoại ----------------
  const teachersOf = (c) => (c.teacherIds && c.teacherIds.length ? c.teacherIds : c.teacherId ? [c.teacherId] : []);
  for (const c of classes) {
    const label = `${c.name}${c.code ? ` [${c.code}]` : ''}`;
    const ts = teachersOf(c);
    const badT = ts.filter((id) => byId.get(String(id))?.role !== 'TEACHER');
    ok('FK giảng viên', ts.length > 0 && badT.length === 0, `${label}: ${ts.map(nameOf).join(', ')}`, `${label}: giảng viên không hợp lệ/không tồn tại: ${badT.join(', ') || '(trống)'}`);
    if (c.teacherIds && c.teacherIds.length) ok('FK giảng viên', String(c.teacherIds[0]) === String(c.teacherId), `${label}: teacherId trùng giảng viên chính trong teacherIds`, `${label}: teacherId (${nameOf(c.teacherId)}) khác teacherIds[0] (${nameOf(c.teacherIds[0])})`);
    const sIds = c.studentIds || [];
    const badS = sIds.filter((id) => byId.get(String(id))?.role !== 'STUDENT');
    ok('FK học viên', badS.length === 0 && new Set(sIds.map(String)).size === sIds.length, `${label}: ${sIds.length} học viên hợp lệ, không trùng`, `${label}: học viên sai/không tồn tại/trùng: ${badS.slice(0, 3).join(', ')}`);
    if (c.courseKey) {
      ok('FK khóa học', ['tester-qa', 'data-sql', 'ai-prompt'].includes(c.courseKey) && sIds.length === 0, `${label}: courseKey ${c.courseKey}, ghi danh tự động theo CAREER_ADULT`, `${label}: courseKey/studentIds không hợp lệ`);
    } else {
      const bands = new Map();
      for (const id of sIds) { const g = byId.get(String(id))?.ageGroup || 'NONE'; bands.set(g, (bands.get(g) || 0) + 1); }
      const dominant = [...bands.entries()].sort((a, b) => b[1] - a[1])[0];
      const mixed = bands.size > 1;
      rec('Khối học viên', mixed ? 'WARN' : 'PASS', `${label}: ${[...bands.entries()].map(([g, n]) => `${g}×${n}`).join(', ') || 'chưa có học viên'}${mixed ? ' (lớp lẫn nhiều khối: dữ liệu cũ)' : ''}`);
      void dominant;
    }
  }
  const classIds = new Set(classes.map((c) => String(c._id)));
  const orphan = asgs.filter((a) => !classIds.has(String(a.classId)));
  ok('FK bài giao', orphan.length === 0, 'mọi bài giao đều trỏ về lớp có thật', `${orphan.length} bài giao mồ côi (classId không tồn tại)`);
  const adults = users.filter((u) => u.role === 'STUDENT' && u.ageGroup === 'CAREER_ADULT' && u.status !== 'LOCKED');
  ok('Người đi làm', adults.some((u) => u.email === 'nguoidilam1@gmail.com') && adults.some((u) => u.email === 'nguoidilam2@gmail.com'), `${adults.length} tài khoản CAREER_ADULT (gồm nguoidilam1/2@gmail.com)`, 'thiếu nguoidilam1/2@gmail.com');

  // ---------------- HTTP ----------------
  const call = async (u, p) => {
    try {
      const r = await fetch(BASE + p, { headers: { Authorization: `Bearer ${tokenFor(u)}` } });
      let json = null;
      try { json = await r.json(); } catch { /* không phải JSON */ }
      return { status: r.status, json };
    } catch (e) {
      return { status: 0, json: null, err: e.message };
    }
  };
  const admin = users.find((u) => u.role === 'ADMIN' && u.status !== 'LOCKED');
  if (!admin) { rec('Chuẩn bị', 'FAIL', 'không có tài khoản ADMIN để so sánh'); }
  const portal = admin ? await call(admin, '/admin/portal/classes') : { status: 0 };
  if (portal.status === 0) {
    console.error(`Không kết nối được backend tại ${BASE}. Hãy chạy: cd BE && npm run start:dev`);
    process.exitCode = 2;
    await mongoose.disconnect();
    return;
  }
  ok('Admin Portal', portal.status === 200 && Array.isArray(portal.json), `${portal.json?.length} lớp/khóa trong Admin Portal`, `status ${portal.status}`);
  const rows = portal.json || [];

  // ---- 2) Giảng viên ----
  const teacherIdsAll = [...new Set(classes.flatMap(teachersOf).map(String))];
  for (const tid of teacherIdsAll) {
    const t = byId.get(tid);
    if (!t || t.role !== 'TEACHER' || t.status === 'LOCKED') continue;
    const mine = rows.filter((r) => r.teachers.some((x) => x.id === tid));
    const res = await call(t, '/teacher/classes?includeArchived=true');
    const got = Array.isArray(res.json) ? res.json : [];
    const missing = mine.filter((r) => !got.some((g) => g.id === r.id));
    const extra = got.filter((g) => !mine.some((r) => r.id === g.id));
    ok('Giảng viên ↔ Admin', res.status === 200 && missing.length === 0 && extra.length === 0, `${t.fullName}: thấy đúng ${mine.length} lớp Admin gán (${mine.map((r) => r.code || r.name).join(', ')})`, `${t.fullName}: thiếu [${missing.map((r) => r.name)}], thừa [${extra.map((g) => g.name)}], status ${res.status}`);
    for (const r of mine) {
      const g = got.find((x) => x.id === r.id);
      if (!g) continue;
      ok('Giảng viên ↔ Admin', g.studentCount === r.studentCount, `${t.fullName} / ${r.code || r.name}: sĩ số ${g.studentCount} khớp Admin`, `${t.fullName} / ${r.name}: sĩ số giảng viên ${g.studentCount} ≠ Admin ${r.studentCount}`);
      if (r.kind === 'CAREER') ok('Giảng viên ↔ Admin', g.exerciseCount === r.exerciseCount, `${t.fullName} / ${r.code}: ${g.exerciseCount} bài lab khớp Admin`, `${t.fullName} / ${r.name}: bài giảng viên ${g.exerciseCount} ≠ Admin ${r.exerciseCount}`);
    }
  }

  // ---- 3) Học viên phổ thông ----
  for (const r of rows.filter((x) => x.kind === 'SCHOOL')) {
    const doc = classes.find((c) => String(c._id) === r.id);
    const first = (doc.studentIds || []).map((id) => byId.get(String(id))).find((u) => u && u.status !== 'LOCKED');
    if (!first) { rec('Học viên ↔ Admin', 'WARN', `${r.name}: chưa có học viên để kiểm tra`); continue; }
    const sample = [first, ...(doc.studentIds || []).map((id) => byId.get(String(id))).filter((u) => u && /^(muoi@gmail\.com)$/.test(u.email))];
    for (const stu of [...new Set(sample)]) {
      const mine = await call(stu, '/student/classes');
      const cls = (mine.json || []).find?.((c) => c.id === r.id);
      if (r.status === 'ARCHIVED') {
        ok('Học viên ↔ Admin', mine.status === 200 && !cls, `${stu.email}: lớp lưu trữ "${r.name}" không còn trong danh sách lớp (đúng nghiệp vụ)`, `${stu.email}: vẫn thấy lớp đã lưu trữ`);
        continue;
      }
      ok('Học viên ↔ Admin', !!cls, `${stu.email}: thấy lớp "${r.name}"`, `${stu.email}: KHÔNG thấy lớp "${r.name}" (status ${mine.status})`);
      if (!cls) continue;
      ok('Học viên ↔ Admin', cls.teacher?.name === r.teachers[0]?.name, `${stu.email}: giảng viên "${cls.teacher?.name}" khớp Admin`, `${stu.email}: giảng viên "${cls.teacher?.name}" ≠ Admin "${r.teachers[0]?.name}"`);
      const ov = await call(stu, `/student/classes/${r.id}/overview`);
      const total = ov.json?.days ? ov.json.days.reduce((s, d) => s + (d.items?.length ?? d.assignments?.length ?? 0), 0) : ov.json?.assignments?.length ?? ov.json?.summary?.total;
      ok('Học viên ↔ Admin', ov.status === 200 && (total === undefined || total === r.exerciseCount), `${stu.email}: ${total ?? '?'} bài giao khớp Admin (${r.exerciseCount})`, `${stu.email}: bài giao ${total} ≠ Admin ${r.exerciseCount}`, 'WARN');
      const enr = await call(stu, '/student/enrollments');
      ok('Học viên ↔ Admin', enr.status === 200 && (enr.json || []).some((e) => e.classId === r.id && e.teacherName === r.teachers[0]?.name), `${stu.email}: hồ sơ (/profile) hiện đúng lớp và giảng viên`, `${stu.email}: hồ sơ không khớp lớp/giảng viên (status ${enr.status})`);
    }
  }

  // ---- 3b) Học viên Người đi làm ----
  const careerRows = rows.filter((x) => x.kind === 'CAREER');
  for (const email of ['nguoidilam1@gmail.com', 'nguoidilam2@gmail.com']) {
    const stu = users.find((u) => u.email === email);
    if (!stu) { rec('Người đi làm ↔ Admin', 'FAIL', `không có tài khoản ${email}`); continue; }
    const cc = await call(stu, '/student/career-courses');
    const courses = cc.json || [];
    ok('Người đi làm ↔ Admin', cc.status === 200 && courses.length === careerRows.length, `${email}: thấy ${courses.length} khóa như Admin`, `${email}: ${courses.length} khóa ≠ Admin ${careerRows.length} (status ${cc.status})`);
    for (const r of careerRows) {
      const c = courses.find((x) => x.key === r.courseKey);
      ok('Người đi làm ↔ Admin', !!c && c.title === r.name, `${email}: khóa "${r.name}" đúng tên`, `${email}: thiếu/sai tên khóa ${r.courseKey}`);
      if (!c) continue;
      ok('Người đi làm ↔ Admin', c.teacherName === r.teachers.map((t) => t.name).join(', '), `${email} / ${r.courseKey}: giảng viên "${c.teacherName}" khớp Admin`, `${email} / ${r.courseKey}: giảng viên "${c.teacherName}" ≠ Admin "${r.teachers.map((t) => t.name).join(', ')}"`);
      ok('Người đi làm ↔ Admin', c.totalItems === r.exerciseCount, `${email} / ${r.courseKey}: ${c.totalItems} bài lab khớp Admin`, `${email} / ${r.courseKey}: ${c.totalItems} bài ≠ Admin ${r.exerciseCount}`);
    }
    const enr = await call(stu, '/student/enrollments');
    ok('Người đi làm ↔ Admin', enr.status === 200 && careerRows.every((r) => (enr.json || []).some((e) => e.classId === r.courseKey && e.teacherName === r.teachers.map((t) => t.name).join(', '))), `${email}: hồ sơ hiện đủ 3 khóa với đúng giảng viên`, `${email}: hồ sơ không khớp 3 khóa/giảng viên`);
    ok('Người đi làm ↔ Admin', careerRows.every((r) => r.studentCount === adults.length), `${email}: sĩ số mỗi khóa (${adults.length}) khớp số tài khoản CAREER_ADULT`, 'sĩ số khóa Người đi làm lệch số học viên thật');
  }
  void OID;

  for (const r of results) console.log(`[${r.status}] ${r.area}: ${r.msg}`);
  const c = (s) => results.filter((r) => r.status === s).length;
  console.log(`\nTổng: ${c('PASS')} PASS, ${c('WARN')} WARN, ${c('FAIL')} FAIL`);
  if (c('FAIL')) process.exitCode = 1;
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
