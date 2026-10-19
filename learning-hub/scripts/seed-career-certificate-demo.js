#!/usr/bin/env node
/**
 * Seed tài khoản demo CHỨNG CHỈ cho Người đi làm / Trái ngành: khóa "Kiểm thử phần mềm thực chiến (Tester QA)" hoàn thành 100% bài
 * với điểm >= 90% (xếp loại Xuất sắc) để trang /profile hiện 👁️ và mở được Giấy chứng nhận thật.
 *   node scripts/seed-career-certificate-demo.js            # tạo tài khoản + nộp và chấm đủ mọi bài Tester Lab (cần backend đang chạy)
 *   node scripts/seed-career-certificate-demo.js --remove   # gỡ tài khoản demo và bài nộp của nó
 *
 * Tài khoản: nguoidilam2@gmail.com (STUDENT, ageGroup=CAREER_ADULT), mật khẩu SEED_CAREER_PASSWORD hoặc "NguoiDiLam@2026".
 * KHÔNG đụng tới nguoidilam1@gmail.com (tài khoản thật). Bài nộp được tạo qua API THẬT: học viên nộp biểu mẫu, rồi giảng viên mẫu
 * (seed-teacher-1) chấm qua endpoint chấm bài của giảng viên, nên đây cũng là phép thử luồng chấm điểm + nhận xét.
 * Chạy lại không tạo trùng: lab nào đã được chấm thì bỏ qua.
 */
const fs = require('fs');
const path = require('path');
const h = require('./lib/setup-helpers');

const BE = path.join(__dirname, '..', 'BE');
const envText = fs.existsSync(path.join(BE, '.env')) ? fs.readFileSync(path.join(BE, '.env'), 'utf8') : '';
const uri = process.env.DATABASE_URL || h.readEnvValue(envText, 'DATABASE_URL') || '';
const secret = process.env.JWT_SECRET || h.readEnvValue(envText, 'JWT_SECRET') || '';
const port = process.env.PORT || h.readEnvValue(envText, 'PORT') || '3000';
const BASE = process.env.SEED_API_BASE || `http://localhost:${port}/api`;
const remove = process.argv.includes('--remove');

const EMAIL = 'nguoidilam2@gmail.com';
const FULL_NAME = 'Nguyễn Văn Chứng Chỉ';
const PASSWORD = process.env.SEED_CAREER_PASSWORD || 'NguoiDiLam@2026';
const TEACHER_EMAIL = 'seed-teacher-1@demo.cybersoft.local';

const FORM = {
  testCases: [
    { code: 'TC01', description: 'Để trống trường bắt buộc', input: '(trống)', expected: 'Báo lỗi "Vui lòng nhập"' },
    { code: 'TC02', description: 'Dữ liệu sai định dạng', input: 'abc@', expected: 'Báo lỗi không hợp lệ' },
    { code: 'TC03', description: 'Giá trị biên tối đa', input: '32 ký tự', expected: 'Chấp nhận' },
    { code: 'TC04', description: 'Ký tự đặc biệt <script>', input: '<script>x</script>', expected: 'Được mã hóa, không chạy' },
    { code: 'TC05', description: 'Dữ liệu trùng lặp đã tồn tại', input: 'email đã đăng ký', expected: 'Báo đã tồn tại' },
  ],
  bugReports: [
    { title: 'Không có thông báo khi nhập sai', steps: '1. Mở form\n2. Nhập dữ liệu sai\n3. Bấm Gửi', expected: 'Hiện thông báo lỗi', actual: 'Không phản hồi', severity: 'MEDIUM' },
  ],
};

async function api(token, method, p, body) {
  const res = await fetch(BASE + p, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: body ? JSON.stringify(body) : undefined });
  let json = null;
  try { json = await res.json(); } catch { /* không phải JSON */ }
  return { status: res.status, json };
}

(async () => {
  if (!uri) { console.error('Thiếu DATABASE_URL.'); process.exit(1); }
  const mongoose = require(path.join(BE, 'node_modules', 'mongoose'));
  const bcrypt = require(path.join(BE, 'node_modules', 'bcrypt'));
  const jwt = require(path.join(BE, 'node_modules', 'jsonwebtoken'));
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  try {
    const db = mongoose.connection.db;
    const users = db.collection('users');

    if (remove) {
      const u = await users.findOne({ email: EMAIL, isSeedCareerDemo: true });
      if (!u) { console.log('Không có tài khoản demo để gỡ.'); return; }
      const id = String(u._id);
      const t = await db.collection('tester_lab_submissions').deleteMany({ userId: id });
      await users.deleteOne({ _id: u._id });
      console.log(`Đã gỡ tài khoản demo và ${t.deletedCount} bài nộp Tester Lab.`);
      return;
    }

    const now = new Date();
    let u = await users.findOne({ email: EMAIL });
    if (u && !u.isSeedCareerDemo) { console.error(`${EMAIL} là tài khoản thật (không do script tạo). Dừng.`); process.exit(1); }
    if (!u) {
      const res = await users.findOneAndUpdate(
        { email: EMAIL },
        { $setOnInsert: { email: EMAIL, fullName: FULL_NAME, role: 'STUDENT', ageGroup: 'CAREER_ADULT', status: 'ACTIVE', isSeedCareerDemo: true, password: await bcrypt.hash(PASSWORD, 10), phone: '', bio: '', createdAt: now, updatedAt: now } },
        { upsert: true, returnDocument: 'after' },
      );
      u = res;
      console.log(`Đã tạo tài khoản ${EMAIL} (mật khẩu mẫu: ${PASSWORD}).`);
    } else console.log(`Dùng lại tài khoản demo ${EMAIL}.`);

    const teacher = await users.findOne({ email: TEACHER_EMAIL, role: 'TEACHER' });
    if (!teacher) { console.error(`Chưa có giảng viên mẫu ${TEACHER_EMAIL}: chạy node scripts/seed-class.js trước.`); process.exit(1); }
    if (!secret) { console.error('Thiếu JWT_SECRET.'); process.exit(1); }
    const sTok = jwt.sign({ sub: String(u._id), email: EMAIL, role: 'STUDENT' }, secret, { expiresIn: '15m' });
    const tTok = jwt.sign({ sub: String(teacher._id), email: TEACHER_EMAIL, role: 'TEACHER' }, secret, { expiresIn: '15m' });

    const labs = await api(sTok, 'GET', '/tester-labs');
    if (labs.status !== 200) { console.error(`Backend chưa chạy tại ${BASE} (HTTP ${labs.status}). Bật backend rồi chạy lại.`); process.exit(1); }

    let n = 0;
    for (const lab of labs.json) {
      const mine = await api(sTok, 'GET', `/tester-labs/${lab.labCode}/submissions/mine`);
      if (Array.isArray(mine.json) && mine.json.some((s) => s.status === 'REVIEWED')) continue;
      const sub = await api(sTok, 'POST', `/tester-labs/${lab.labCode}/form-submissions`, FORM);
      if (sub.status !== 201) { console.error(`${lab.labCode}: nộp thất bại (HTTP ${sub.status})`); continue; }
      // Giảng viên chấm: điểm ~95% mỗi bài (trừ 1 điểm ở tiêu chí đầu của một số bài) kèm nhận xét.
      const crit = lab.rubricCriteria || [];
      const grades = crit.map((c, i) => ({ key: c.key, score: i === 0 && n % 3 === 1 && c.maxScore > 2 ? c.maxScore - 1 : c.maxScore, note: 'Tốt' }));
      const rv = await api(tTok, 'PUT', `/tester-labs/submissions/${sub.json.id}/review`, { grades, reviewerNotes: 'Test case bao phủ tốt các trường hợp biên; bug report rõ ràng, đủ bước tái hiện.' });
      if (rv.status !== 200) { console.error(`${lab.labCode}: chấm thất bại (HTTP ${rv.status}) ${JSON.stringify(rv.json).slice(0, 120)}`); continue; }
      n++;
    }
    console.log(`Đã nộp và chấm ${n} bài Tester Lab.`);

    const enr = await api(sTok, 'GET', '/student/enrollments');
    const tester = (enr.json || []).find((e) => e.classId === 'tester-qa');
    if (tester && tester.certificate) {
      console.log(`Khóa "${tester.className}": ${tester.status}, ${tester.certificate.finalScore}/100 — ${tester.certificate.grade}, mã ${tester.certificate.code}`);
      console.log(`Đăng nhập ${EMAIL} / ${PASSWORD}, mở /profile và bấm 👁️ để xem chứng chỉ.`);
    } else {
      console.log('Khóa chưa đủ điều kiện cấp chứng chỉ:', JSON.stringify(tester && { status: tester.status, done: tester.doneCount, total: tester.totalAssignments, percent: tester.percent }));
    }
  } finally {
    await mongoose.disconnect();
  }
})().catch((e) => { console.error(e.message || e); process.exit(1); });
