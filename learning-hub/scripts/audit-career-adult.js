#!/usr/bin/env node
/**
 * Audit phân hệ Người đi làm / Trái ngành (CAREER_ADULT) qua API THẬT của backend đang chạy + kiểm tra mã nguồn giao diện.
 *   node scripts/audit-career-adult.js
 * Dữ liệu ghi thử (tài khoản tạm, bài nộp, bài lab do giảng viên tạo) được GỠ SẠCH ở cuối, kể cả khi lỗi giữa chừng.
 * Thoát mã 1 nếu có FAIL.
 */
const fs = require('fs');
const path = require('path');
const h = require('./lib/setup-helpers');

const ROOT = path.join(__dirname, '..');
const BE = path.join(ROOT, 'BE');
const FE = path.join(ROOT, 'FE', 'src');
const envText = fs.readFileSync(path.join(BE, '.env'), 'utf8');
const uri = h.readEnvValue(envText, 'DATABASE_URL');
const secret = h.readEnvValue(envText, 'JWT_SECRET');
const BASE = (process.argv.find((a) => a.startsWith('--base=')) || '').slice(7) || `http://localhost:${h.readEnvValue(envText, 'PORT') || 3000}/api`;

const results = [];
const add = (area, status, msg) => results.push({ area, status, msg });
const ok = (area, cond, good, bad, level = 'FAIL') => add(area, cond ? 'PASS' : level, cond ? good : bad);
const src = (rel) => fs.readFileSync(path.join(FE, rel), 'utf8');

(async () => {
  const mongoose = require(path.join(BE, 'node_modules', 'mongoose'));
  const jwt = require(path.join(BE, 'node_modules', 'jsonwebtoken'));
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  const db = mongoose.connection.db;
  const OID = mongoose.Types.ObjectId;
  const tok = (u) => jwt.sign({ sub: String(u._id), email: u.email, role: u.role }, secret, { expiresIn: '15m' });
  const call = async (token, method, p, body) => {
    try {
      const res = await fetch(BASE + p, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
      let json = null;
      try { json = await res.json(); } catch { /* không phải JSON */ }
      return { s: res.status, b: json };
    } catch (e) { return { s: 0, b: null, err: e.message }; }
  };

  const created = { users: [], exerciseSlugs: [], labCodes: [] };
  try {
    const ping = await call(null, 'GET', '/contests');
    if (ping.s === 0) { console.error(`Không kết nối được backend tại ${BASE}. Chạy: cd BE && npm run start:dev`); process.exit(2); }

    const teacher = await db.collection('users').findOne({ email: 'seed-teacher-1@demo.cybersoft.local', role: 'TEACHER' });
    const s69 = await db.collection('users').findOne({ role: 'STUDENT', ageGroup: '6-9', isSeedClassDemo: true });
    if (!teacher) throw new Error('Thiếu giảng viên mẫu seed-teacher-1 (chạy scripts/seed-class.js).');
    const tTok = tok(teacher);

    // ================= 1. Đăng ký & điều hướng =================
    const A = '1. Đăng ký & điều hướng';
    const email = `audit-career-${Date.now()}@example.test`;
    const reg = await call(null, 'POST', '/auth/register', { email, password: 'Audit@12345', fullName: 'Audit Người Đi Làm', ageGroup: 'CAREER_ADULT' });
    const regDoc = await db.collection('users').findOne({ email });
    if (regDoc) created.users.push(String(regDoc._id));
    ok(A, reg.s === 201 && reg.b?.user?.ageGroup === 'CAREER_ADULT' && regDoc?.ageGroup === 'CAREER_ADULT' && regDoc?.role === 'STUDENT', 'Đăng ký chọn "Người đi làm / Trái ngành" lưu đúng ageGroup=CAREER_ADULT (role STUDENT)', `Đăng ký: HTTP ${reg.s}, ageGroup=${regDoc?.ageGroup}`);
    const badReg = await call(null, 'POST', '/auth/register', { email: `x-${Date.now()}@example.test`, password: 'Audit@12345', fullName: 'X', ageGroup: 'ADMIN' });
    ok(A, badReg.s === 400, 'Nhóm đối tượng lạ khi đăng ký bị từ chối 400', `Nhóm lạ: HTTP ${badReg.s}`);
    const adult = regDoc;
    const aTok = tok(adult);

    const authRoutes = src('common/authRoutes.ts');
    ok(A, /CAREER_ADULT'\)\s*return '\/career-labs'/.test(authRoutes), 'Sau đăng nhập/đăng ký CAREER_ADULT được chuyển thẳng vào /career-labs (homeFor)', 'homeFor chưa trả /career-labs cho CAREER_ADULT');
    const header = src('components/Header.tsx');
    const nav = /CAREER_ADULT_NAV[^=]*=\s*\[([\s\S]*?)\n\];/.exec(header);
    const navPaths = nav ? [...nav[1].matchAll(/path: '([^']+)'/g)].map((m) => m[1]) : [];
    ok(A, JSON.stringify(navPaths) === JSON.stringify(['/career-labs', '/my-class', '/catalog']), 'Navbar CAREER_ADULT_NAV đúng 3 mục: Phòng thực hành chuyên ngành | Lớp học của tôi | Danh mục khóa học', `Navbar có ${navPaths.join(', ')}`);
    const groups = src('common/userGroups.ts');
    ok(A, /'\/contests'/.test(groups) && /\/playground/.test(groups) && /\/quiz/.test(groups) && /assignment/.test(groups), 'Playground/Quiz phổ thông/Cuộc thi bị chặn với CAREER_ADULT (trừ bài giao của lớp)', 'Chưa chặn đủ route với CAREER_ADULT');

    // ================= 2. Hub & điều hướng trong lab =================
    const B = '2. Hub & điều hướng lab';
    const hub = src('pages/CareerLabsPage.tsx');
    ok(B, ['/da-labs', '/ai-labs', '/tester-labs'].every((p) => hub.includes(`path: '${p}'`)), '/career-labs có 3 card dẫn tới /da-labs, /ai-labs, /tester-labs', 'Hub thiếu card');
    for (const [f, g] of [['TesterLabListPage', 'TESTER'], ['DaLabListPage', 'DATA'], ['AiLabListPage', 'AI']]) {
      ok(B, src(`pages/${f}.tsx`).includes(`<LabHubBack group="${g}"`), `${f}: có nút ⬅ Quay lại Phòng thực hành chuyên ngành + breadcrumb (về /career-labs)`, `${f}: thiếu nút quay về Hub`);
    }
    for (const [f, g] of [['DaLabWorkspacePage', 'DATA'], ['AiLabWorkspacePage', 'AI'], ['TesterLabDetailPage', 'TESTER']]) {
      ok(B, src(`pages/${f}.tsx`).includes(`<LabBreadcrumb group="${g}"`), `${f}: có breadcrumb và nút ⬅ Quay lại danh sách bài Lab`, `${f}: thiếu breadcrumb`);
    }
    const app = src('App.tsx');
    ok(B, app.includes('path="/career-labs"') && app.includes('<CareerMyClassPage />'), 'App có route /career-labs và /my-class riêng cho CAREER_ADULT', 'Thiếu route');

    // ================= 3. Thực thi & lịch sử =================
    const C = '3. Thực thi & lịch sử bài làm';
    const sqlLabs = ((await call(aTok, 'GET', '/da-labs')).b || []).filter((l) => l.type === 'SQL_LAB');
    ok(C, sqlLabs.length >= 10, `Data Lab: ${sqlLabs.length} bài SQL sẵn sàng (dữ liệu nội bộ, không cần máy chủ 8000)`, `Chỉ có ${sqlLabs.length} bài SQL`);
    const lab = sqlLabs[0];
    const run = await call(aTok, 'POST', `/da-labs/${lab.slug}/run`, { sql: 'SELECT COUNT(*) AS n FROM orders' });
    ok(C, run.b?.status === 'OK' && run.b.result.rows[0][0] > 0, `SELECT hợp lệ ra kết quả (${JSON.stringify(run.b?.result?.rows)})`, `SELECT lỗi: HTTP ${run.s} ${JSON.stringify(run.b).slice(0, 100)}`);
    for (const sql of ['DELETE FROM orders', 'DROP TABLE orders', 'SELECT 1; DELETE FROM orders', 'PRAGMA table_info(orders)', 'SELECT * FROM sqlite_master', "ATTACH DATABASE 'x' AS x"]) {
      const r = await call(aTok, 'POST', `/da-labs/${lab.slug}/run`, { sql });
      ok(C, r.s === 400 && /chỉ hỗ trợ câu lệnh truy vấn/.test(r.b?.message || ''), `Chặn 400: ${sql}`, `Không chặn đúng: ${sql} → HTTP ${r.s}`);
    }
    const multi = await call(aTok, 'POST', `/da-labs/${lab.slug}/run`, { sql: 'SELECT 1; SELECT 2' });
    ok(C, multi.b?.status === 'REJECTED', 'Nhiều câu SELECT liền nhau bị từ chối (REJECTED)', `multi: ${JSON.stringify(multi.b).slice(0, 80)}`);
    const full = await db.collection('exercises').findOne({ slug: lab.slug }, { projection: { solutionCode: 1 } });
    await call(aTok, 'POST', `/da-labs/${lab.slug}/submit`, { sql: 'SELECT order_id FROM orders LIMIT 3' });
    const okSubmit = await call(aTok, 'POST', `/da-labs/${lab.slug}/submit`, { sql: full.solutionCode });
    const hist = await call(aTok, 'GET', `/da-labs/${lab.slug}/history`);
    ok(C, okSubmit.b?.status === 'ACCEPTED' && Array.isArray(hist.b) && hist.b.length === 2 && hist.b[0].status === 'ACCEPTED', 'Data Lab: nộp đáp án đúng được AC; lịch sử lưu 2 lần nộp (mới nhất trước) để xem/nạp lại', `Lịch sử SQL: ${JSON.stringify(hist.b).slice(0, 120)}`);

    const aiSub = await call(aTok, 'POST', '/ai-labs/ai-lab-01/submit', { prompt: 'Bạn là trợ giảng CyberSoft. Nhiệm vụ: trả lời FAQ ngắn gọn, tối đa 2 câu, định dạng JSON.', model: 'gemini-2.5-flash-lite', config: { temperature: 0.2, maxTokens: 256 } });
    ok(C, aiSub.s === 201 && aiSub.b?.runManifest?.totals && aiSub.b?.history?.length === 1, `AI Lab: nộp prompt được chấm (${aiSub.b?.status} ${aiSub.b?.score}/${aiSub.b?.maxScore}), ghi nhận token (${JSON.stringify(aiSub.b?.runManifest?.totals)}) và lưu lịch sử`, `AI Lab: HTTP ${aiSub.s} ${JSON.stringify(aiSub.b).slice(0, 120)}`);
    ok(C, aiSub.b?.liveRun?.source === 'skipped', 'AI Lab: mặc định không gọi Gemini (nộp nhanh, tiết kiệm quota)', `liveRun=${aiSub.b?.liveRun?.source}`);

    const form = { testCases: [{ code: 'TC01', description: 'Để trống email', input: '', expected: 'Báo lỗi' }, { code: 'TC02', description: 'Email sai định dạng', input: 'a@', expected: 'Báo lỗi' }], bugReports: [{ title: 'Lỗi', steps: '1. a\n2. b', expected: 'x', actual: 'y', severity: 'LOW' }] };
    const tSub = await call(aTok, 'POST', '/tester-labs/LAB-01/form-submissions', form);
    const tDoc = await db.collection('tester_lab_submissions').findOne({ userId: String(adult._id) });
    ok(C, tSub.s === 201 && tDoc?.status === 'SUBMITTED' && tDoc?.kind === 'FORM' && tSub.b?.statusLabel === 'Đã nộp bài - Chờ giảng viên chấm', 'Tester Lab: nộp biểu mẫu lưu vào CSDL ở trạng thái SUBMITTED (🟡 Chờ chấm) kèm nhận xét sơ bộ', `Tester: HTTP ${tSub.s}, status=${tDoc?.status}`);

    // ================= 4. /my-class & /profile =================
    const D = '4. /my-class & /profile';
    const exCount = await db.collection('exercises').countDocuments({ topic: 'da-lab-pack', resource_id: { $exists: true } });
    const aiCount = await db.collection('exercises').countDocuments({ topic: 'ai-lab-pack', type: 'AI_LAB' });
    const tCount = await db.collection('tester_labs').countDocuments({});
    let courses = (await call(aTok, 'GET', '/student/career-courses')).b || [];
    ok(D, courses.map((c) => c.key).join() === 'tester-qa,data-sql,ai-prompt', '3 khóa học hiện đủ và đúng thứ tự (Tester QA, Data SQL, AI Prompt)', `Khóa: ${courses.map((c) => c.key)}`);
    ok(D, courses[0]?.totalItems === tCount && courses[1]?.totalItems === exCount && courses[2]?.totalItems === aiCount, `Số bài mỗi khóa lấy THEO CSDL (${tCount}/${exCount}/${aiCount}), không hardcode`, `Số bài lệch CSDL: ${courses.map((c) => c.totalItems)} vs ${tCount}/${exCount}/${aiCount}`);
    const itemOf = (key, ref) => courses.find((c) => c.key === key)?.items.find((i) => i.ref === ref);
    ok(D, itemOf('tester-qa', 'LAB-01')?.state === 'PENDING' && itemOf('data-sql', lab.slug)?.state === 'DONE' && itemOf('ai-prompt', 'ai-lab-01')?.state, 'Trạng thái từng bài phản ánh bài nộp: Tester 🟡 Chờ chấm, SQL ✅ Hoàn thành, AI đã làm', 'Trạng thái bài lệch bài nộp');
    ok(D, itemOf('tester-qa', 'LAB-01')?.path === '/tester-labs/LAB-01' && itemOf('data-sql', lab.slug)?.path === `/da-labs/${lab.slug}` && itemOf('ai-prompt', 'ai-lab-01')?.path === '/ai-labs/ai-lab-01', 'Nút "Làm bài/Làm lại" trỏ thẳng đúng bài lab tương ứng', 'Đường dẫn bài sai');
    const myClassSrc = src('pages/CareerMyClassPage.tsx');
    ok(D, /lg:grid-cols-10/.test(myClassSrc) && /lg:col-span-3/.test(myClassSrc) && /lg:col-span-7/.test(myClassSrc) && /setActiveKey\(c\.key\)/.test(myClassSrc), 'Bố cục 2 cột 30/70; bấm khóa bên trái đổi danh sách bài bên phải (Master-Detail)', 'Bố cục Master-Detail chưa đúng');
    const enr = (await call(aTok, 'GET', '/student/enrollments')).b || [];
    ok(D, enr.length === 3 && enr.every((e) => e.totalAssignments >= 0), '/profile: "Lớp học / Khóa học đã tham gia" trả đủ 3 khóa chuyên ngành kèm tiến độ', `Enrollments: ${JSON.stringify(enr).slice(0, 100)}`);
    if (s69) {
      const e69 = await call(tok(s69), 'GET', '/student/enrollments');
      ok(D, e69.s === 200 && Array.isArray(e69.b) && !e69.b.some((e) => ['tester-qa', 'data-sql', 'ai-prompt'].includes(e.classId)), 'Học sinh phổ thông vẫn nhận danh sách LỚP HỌC như cũ (không lẫn khóa chuyên ngành)', 'Enrollments học sinh phổ thông bị lẫn');
    }

    // ================= 5. Giảng viên: chấm bài & nhận xét =================
    const E = '5. Giảng viên chấm bài & nhận xét';
    const subId = String(tDoc?._id);
    const labT = await call(tTok, 'GET', '/tester-labs/LAB-01');
    const crit = labT.b?.rubricCriteria || [];
    const studentTryReview = await call(aTok, 'PUT', `/tester-labs/submissions/${subId}/review`, { grades: [] });
    ok(E, studentTryReview.s === 403, 'Học viên KHÔNG tự chấm được bài (403)', `Học viên chấm: HTTP ${studentTryReview.s}`);
    const grades = crit.map((c) => ({ key: c.key, score: c.maxScore, note: 'ok' }));
    const rv = await call(tTok, 'PUT', `/tester-labs/submissions/${subId}/review`, { grades, reviewerNotes: 'Audit: test case tốt, thêm trường hợp định dạng rỗng.' });
    ok(E, rv.s === 200, 'Giảng viên chấm điểm + nhập nhận xét qua PUT /tester-labs/submissions/:id/review', `Chấm bài: HTTP ${rv.s} ${JSON.stringify(rv.b).slice(0, 100)}`);
    courses = (await call(aTok, 'GET', '/student/career-courses')).b || [];
    const graded = itemOf('tester-qa', 'LAB-01');
    ok(E, graded?.state === 'DONE' && graded.feedback === 'Audit: test case tốt, thêm trường hợp định dạng rỗng.' && graded.feedbackBy === 'TEACHER', '/my-class cập nhật ĐÚNG nhận xét của giảng viên (cột "Nhận xét của Giảng viên") và chuyển bài sang ✅ Hoàn thành', `Sau chấm: ${JSON.stringify(graded)}`);
    ok(E, courses[0]?.teacherName === teacher.fullName, `Header khóa hiển thị tên giảng viên phụ trách: ${courses[0]?.teacherName}`, `Tên giảng viên: ${courses[0]?.teacherName}`);

    // Lấy trạng thái chứng chỉ TRƯỚC khi tạo bài mới (thêm lab mới làm khóa chưa còn 100% hoàn thành).
    const demoUser = await db.collection('users').findOne({ email: 'nguoidilam2@gmail.com', isSeedCareerDemo: true });
    const demoEnr = demoUser ? (await call(tok(demoUser), 'GET', '/student/enrollments')).b || [] : [];

    // ================= 6. Giảng viên: tạo bài mới =================
    const F = '6. Giảng viên tạo bài mới (không hardcode)';
    const stamp = Date.now();
    const sqlSlug = `audit-sql-${stamp}`;
    const newSql = await call(tTok, 'POST', '/teacher/da-labs', { slug: sqlSlug, title: `Audit SQL ${stamp}`, description: 'Đếm đơn hàng', difficulty: 'EASY', points: 7, solutionCode: 'SELECT COUNT(*) AS n FROM orders' });
    if (newSql.s === 201) created.exerciseSlugs.push(sqlSlug);
    ok(F, newSql.s === 201, 'Giảng viên tạo bài SQL mới (POST /teacher/da-labs)', `Tạo SQL: HTTP ${newSql.s} ${JSON.stringify(newSql.b).slice(0, 120)}`);
    const badSql = await call(tTok, 'POST', '/teacher/da-labs', { title: 'Xấu', description: 'x', solutionCode: 'DELETE FROM orders' });
    ok(F, badSql.s === 400, 'Đáp án mẫu có DELETE bị từ chối 400 khi tạo bài', `Tạo bài DELETE: HTTP ${badSql.s}`);
    const aiSlug = `audit-ai-${stamp}`;
    const newAi = await call(tTok, 'POST', '/teacher/ai-labs', { slug: aiSlug, title: `Audit AI ${stamp}`, description: 'Prompt JSON', difficulty: 'EASY', points: 9, resource_id: 'eval-cs-faq-basic-v1', techniques: [{ label: 'Yêu cầu JSON', hint: 'Nêu rõ JSON', pattern: '(json)' }] });
    if (newAi.s === 201) created.exerciseSlugs.push(aiSlug);
    ok(F, newAi.s === 201, 'Giảng viên tạo bài AI Lab mới (POST /teacher/ai-labs)', `Tạo AI: HTTP ${newAi.s} ${JSON.stringify(newAi.b).slice(0, 120)}`);
    const testerCode = `AUD-${String(stamp).slice(-6)}`;
    const newT = await call(tTok, 'POST', '/teacher/tester-labs', { labCode: testerCode, title: `Audit Tester ${stamp}`, description: 'Thiết kế test case', category: 'TEST_CASE_DESIGN', rubricCriteria: [{ label: 'Độ bao phủ', maxScore: 10, kind: 'quality' }] });
    if (newT.s === 201) created.labCodes.push(testerCode);
    ok(F, newT.s === 201, 'Giảng viên tạo bài Tester Lab mới (POST /teacher/tester-labs)', `Tạo Tester: HTTP ${newT.s} ${JSON.stringify(newT.b).slice(0, 120)}`);
    const studentCreate = await call(aTok, 'POST', '/teacher/da-labs', { title: 'x', description: 'x', solutionCode: 'SELECT 1' });
    ok(F, studentCreate.s === 403, 'Học viên KHÔNG tạo được bài (403)', `Học viên tạo bài: HTTP ${studentCreate.s}`);

    const dynLabs = (await call(aTok, 'GET', '/da-labs')).b || [];
    const aiList = (await call(aTok, 'GET', '/ai-labs')).b || [];
    const tList = (await call(aTok, 'GET', '/tester-labs')).b || [];
    ok(F, dynLabs.some((l) => l.slug === sqlSlug) && aiList.some((l) => l.slug === aiSlug) && tList.some((l) => l.labCode === testerCode), 'Bài mới xuất hiện ngay ở danh sách Hub Lab (Data / AI / Tester) mà không sửa code giao diện', 'Bài mới chưa lên danh sách Hub');
    courses = (await call(aTok, 'GET', '/student/career-courses')).b || [];
    ok(F, courses[0].totalItems === tCount + 1 && courses[1].totalItems === exCount + 1 && courses[2].totalItems === aiCount + 1, `/my-class tự nhận bài mới: tổng bài mỗi khóa tăng ${tCount}→${courses[0].totalItems}, ${exCount}→${courses[1].totalItems}, ${aiCount}→${courses[2].totalItems}`, `Tổng bài không tăng: ${courses.map((c) => c.totalItems)}`);

    // ================= 7. Chứng chỉ =================
    const G = '7. Chứng chỉ demo';
    if (!demoUser) add(G, 'WARN', 'Chưa có tài khoản demo chứng chỉ: chạy node scripts/seed-career-certificate-demo.js');
    else {
      const cert = demoEnr.find((e) => e.classId === 'tester-qa');
      ok(G, !!cert?.certificate && cert.status === 'COMPLETED', `nguoidilam2: khóa Tester QA "Đã hoàn thành" kèm chứng chỉ ${cert?.certificate?.finalScore}/100 · ${cert?.certificate?.grade} · ${cert?.certificate?.code}`, 'Tài khoản demo chưa có chứng chỉ: chạy lại node scripts/seed-career-certificate-demo.js (giảng viên vừa thêm lab mới nên khóa chưa còn 100% hoàn thành)', 'WARN');
      const c = cert?.certificate;
      ok(G, !!c && c.studentName && c.className && c.teacherName && c.grade && c.code && c.completedAt, 'Chứng chỉ đủ họ tên, khóa học, giảng viên, điểm, xếp loại, ngày, mã', 'Chứng chỉ thiếu trường');
    }
  } catch (e) {
    add('Lỗi chạy audit', 'FAIL', e.message || String(e));
  } finally {
    // ---- Dọn sạch dữ liệu ghi thử ----
    try {
      const db2 = mongoose.connection.db;
      for (const id of created.users) {
        await db2.collection('da_lab_submissions').deleteMany({ userId: id });
        await db2.collection('ai_lab_submissions').deleteMany({ userId: id });
        await db2.collection('tester_lab_submissions').deleteMany({ userId: id });
        await db2.collection('users').deleteOne({ _id: new OID(id) });
      }
      if (created.exerciseSlugs.length) await db2.collection('exercises').deleteMany({ slug: { $in: created.exerciseSlugs } });
      if (created.labCodes.length) await db2.collection('tester_labs').deleteMany({ labCode: { $in: created.labCodes } });
      add('Dọn dẹp', 'PASS', `Đã gỡ ${created.users.length} tài khoản tạm, ${created.exerciseSlugs.length} bài và ${created.labCodes.length} lab tạo thử`);
    } catch (e) {
      add('Dọn dẹp', 'FAIL', `Dọn dữ liệu thử thất bại: ${e.message}`);
    }
    await mongoose.disconnect();
  }

  const icon = { PASS: '✅', WARN: '⚠️ ', FAIL: '❌' };
  let area = '';
  for (const r of results) {
    if (r.area !== area) { area = r.area; console.log(`\n== ${area} ==`); }
    console.log(`${icon[r.status]} ${r.msg}`);
  }
  const c = (s) => results.filter((r) => r.status === s).length;
  console.log(`\nTổng: ${c('PASS')} PASS · ${c('WARN')} WARN · ${c('FAIL')} FAIL`);
  process.exit(c('FAIL') ? 1 : 0);
})().catch((e) => { console.error(e.message || e); process.exit(2); });
