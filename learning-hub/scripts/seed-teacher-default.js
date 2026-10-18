#!/usr/bin/env node
/**
 * Nạp dữ liệu SỐNG cho Teacher Studio của tài khoản giảng viên demo teacher@gmail.com. Idempotent: chạy lại nhiều lần không nhân bản
 * dữ liệu (mọi bản ghi do script tạo mang cờ seedTeacherDemo và được dọn rồi nạp lại).
 *
 *  - Gán teacher@gmail.com phụ trách 4 lớp: K3-5, K6-9, K10-12 và khóa Tester QA ($addToSet, không đổi giảng viên chính).
 *  - K3-5: lớp nhí không có bài code; sao/ải ghi vào block_puzzle_progress (chính nguồn của hồ sơ bé /profile): Gia Hân 12 sao (Ải 5), Minh Khang 9 sao (Ải 4, STUCK_ALERT),
 *    Bảo An 15 sao (Ải 6, top 1 vinh danh).
 *  - K6-9: học sinh Passed 100/100, Wrong Answer 60/100, Chưa nộp + học sinh daicagovap có cảnh báo out-tab đỏ (3 lần, 45 giây, Python Vòng 1).
 *  - K10-12: một ca out-tab cảnh báo thứ hai.
 *  - Tester QA (CL-CAREER-TESTER): thêm 6 học viên Career Adult (tổng 8), 11 bài đã chấm rubric 40/30/30 (92/88/85/82/78 + 2 người đang làm dở 3 Lab);
 *    2 bài nộp ở trạng thái Chờ chấm từ nguoidilam1@gmail.com và nguoidilam2@gmail.com (có test case + bug report),
 *    mọi lab chuyển sang rubric chuẩn 40/30/30 và 1 bài mẫu đã chấm theo rubric.
 *  - K10-12: 4 Assignment + 1 Contest + 1 Exam với bài nộp ở các trạng thái SUBMITTED, LATE, PUBLISHED, APPEALING, FINALIZED,
 *    1 bài cuộc thi bị tự nộp do rời màn hình, 1 học viên bỏ nộp > 30% (điểm tổng kết bị khóa, F).
 *  - K3-5: sao/ải ghi vào block_puzzle_progress (nguồn của hồ sơ bé /profile); bé Minh Khang ngừng chơi 5 ngày nên bị STUCK_ALERT ở Ải 4.
 *
 *   node scripts/seed-teacher-default.js [--dry-run] [--remove]
 */
const fs = require('fs');
const path = require('path');
const h = require('./lib/setup-helpers');
const { repairAllClasses } = require('./lib/class-integrity');

const BE = path.join(__dirname, '..', 'BE');
const envText = fs.readFileSync(path.join(BE, '.env'), 'utf8');
const uri = process.env.DATABASE_URL || h.readEnvValue(envText, 'DATABASE_URL');
const dryRun = process.argv.includes('--dry-run');
const remove = process.argv.includes('--remove');
const TEACHER_EMAIL = 'teacher@gmail.com';
const FLAG = 'seedTeacherDemo';

const log = (m) => console.log(m);

(async () => {
  const mongoose = require(path.join(BE, 'node_modules', 'mongoose'));
  const bcrypt = require(path.join(BE, 'node_modules', 'bcrypt'));
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  const db = mongoose.connection.db;
  const users = db.collection('users');
  const classes = db.collection('classrooms');
  const exercises = db.collection('exercises');
  const submissions = db.collection('submissions');
  const alerts = db.collection('proctor_alerts');
  const testerSubs = db.collection('tester_lab_submissions');
  const testerLabs = db.collection('tester_labs');
  const now = new Date();
  const minutesAgo = (m) => new Date(now.getTime() - m * 60000);

  const teacher = await users.findOne({ email: TEACHER_EMAIL });
  if (!teacher) throw new Error(`Không có tài khoản ${TEACHER_EMAIL}. Chạy npm run seed trước.`);
  const tid = String(teacher._id);

  // ---- Dọn dữ liệu cũ của chính script này ----------------------------------------------------------------------
  const demoUsers = await users.find({ [FLAG]: true }).toArray();
  if (!dryRun) {
    await submissions.deleteMany({ [FLAG]: true });
    await alerts.deleteMany({ [FLAG]: true });
    await testerSubs.deleteMany({ [FLAG]: true });
  }
  if (remove) {
    if (!dryRun) {
      for (const c of ["assessments", "assessment_submissions", "block_puzzle_progress", "da_lab_submissions", "ai_lab_submissions"]) await db.collection(c).deleteMany({ [FLAG]: true });
      await users.deleteMany({ [FLAG]: true });
      // Gỡ tài khoản demo khỏi studentIds VÀ teacherIds/teacherId (không để lại id "ma").
      await repairAllClasses(db);
    }
    log('Đã dọn dữ liệu demo của giảng viên.');
    await mongoose.disconnect();
    return;
  }

  // ---- 1. Gán lớp ------------------------------------------------------------------------------------------------
  const targets = {
    kid: { label: 'K3-5', filter: { ageGroup: '3-5', courseKey: { $exists: false }, archived: { $ne: true } }, create: { name: 'Lập trình Sáng tạo Nhí (K3-5)', code: 'CL-35KID01', ageGroup: '3-5' } },
    py: { label: 'K6-9', filter: { ageGroup: '6-9', courseKey: { $exists: false }, archived: { $ne: true } }, create: { name: 'Python Căn bản & Tư duy Thuật toán (K6-9)', code: 'CL-69PY01', ageGroup: '6-9' } },
    algo: { label: 'K10-12', filter: { ageGroup: '10-12', courseKey: { $exists: false }, archived: { $ne: true } }, create: { name: 'Luyện thi Thuật toán Chuyên sâu (K10-12)', code: 'CL-1012A1', ageGroup: '10-12' } },
    qa: { label: 'Tester QA', filter: { courseKey: 'tester-qa', archived: { $ne: true } }, create: { name: 'Kiểm thử phần mềm thực chiến (Tester QA)', code: 'CL-CAREER-TESTER', courseKey: 'tester-qa' } },
  };
  const cls = {};
  for (const [k, t] of Object.entries(targets)) {
    let c = await classes.findOne(t.filter, { sort: { createdAt: 1 } });
    if (!c) {
      if (dryRun) { log(`[dry-run] sẽ tạo lớp ${t.label}`); continue; }
      const doc = { ...t.create, description: '', archived: false, teacherId: tid, teacherIds: [tid], studentIds: [], exerciseSlugs: [], createdAt: now, updatedAt: now };
      c = { ...doc, _id: (await classes.insertOne(doc)).insertedId };
      log(`Đã tạo lớp ${t.label}`);
    }
    if (!(c.teacherId === tid || (c.teacherIds || []).includes(tid))) {
      // Chỉ chép lại những giảng viên còn tồn tại: trước đây teacherId "ma" bị chép vào đầu teacherIds (thẻ tím "không còn tồn tại").
      const current = [...new Set([c.teacherId, ...(c.teacherIds || [])].filter(Boolean).map(String))];
      const alive = new Set((await users.find({ _id: { $in: current.filter((x) => mongoose.Types.ObjectId.isValid(x)).map((x) => new mongoose.Types.ObjectId(x)) }, role: 'TEACHER' }, { projection: { _id: 1 } }).toArray()).map((u) => String(u._id)));
      const next = [...current.filter((x) => alive.has(x)), tid];
      if (!dryRun) await classes.updateOne({ _id: c._id }, { $set: { teacherIds: next, teacherId: next[0], updatedAt: now } });
      log(`＋ ${t.label}: thêm ${TEACHER_EMAIL} làm giảng viên phụ trách`);
    } else log(`✔ ${t.label}: ${TEACHER_EMAIL} đã phụ trách`);
    // Lấy lại bản đã cập nhật: các cảnh báo mẫu bên dưới chép teacherIds từ bản này (nếu thiếu giảng viên demo thì họ không thấy cảnh báo của lớp).
    cls[k] = (await classes.findOne({ _id: c._id })) ?? c;
  }
  if (dryRun) { await mongoose.disconnect(); return; }

  const byEmail = async (email) => users.findOne({ email });
  const addStudents = async (classDoc, ids) => {
    await classes.updateOne({ _id: classDoc._id }, { $addToSet: { studentIds: { $each: ids.map(String) } } });
  };
  const setExercises = async (classDoc, slugs) => {
    await classes.updateOne({ _id: classDoc._id }, { $set: { exerciseSlugs: slugs, updatedAt: now } });
  };
  const upsertSub = (userId, ex, status, passed, total, minutes) => ({
    exerciseId: String(ex._id), userId: String(userId), code: '# bài nộp mẫu của dữ liệu demo', status, passedCount: passed, totalCount: total,
    attempts: 1, results: [], createdAt: minutesAgo(minutes), updatedAt: minutesAgo(minutes), [FLAG]: true,
  });
  const clearSubs = (userIds, exs) => submissions.deleteMany({ userId: { $in: userIds.map(String) }, exerciseId: { $in: exs.map((e) => String(e._id)) } });

  // ---- 2. K3-5: lớp nhí KHÔNG có bài tập code; sao/ải/vinh danh lấy từ block_puzzle_progress (mục 8) ------------------------
  {
    // Dọn bài code đã từng giao nhầm cho lớp nhí cùng các lượt nộp của các bé trên những bài đó.
    const oldSlugs = cls.kid.exerciseSlugs || [];
    const oldEx = oldSlugs.length ? await exercises.find({ slug: { $in: oldSlugs } }).project({ _id: 1 }).toArray() : [];
    const kidIds = (cls.kid.studentIds || []).map(String);
    const removedSubs = oldEx.length && kidIds.length ? (await clearSubs(kidIds, oldEx)).deletedCount : 0;
    await setExercises(cls.kid, []);
    const kids = [
      ['seed-class-3-5-1@demo.cybersoft.local', 'Bé Nguyễn Gia Hân'],
      ['seed-class-3-5-2@demo.cybersoft.local', 'Bé Trần Minh Khang'],
      ['seed-class-3-5-3@demo.cybersoft.local', 'Bé Lê Bảo An'],
    ];
    for (const [email, fullName] of kids) {
      const u = await byEmail(email);
      if (!u) { log(`(!) Thiếu ${email}: chạy node scripts/seed-class.js trước`); continue; }
      await users.updateOne({ _id: u._id }, { $set: { fullName } });
      await addStudents(cls.kid, [u._id]);
    }
    log(`  K3-5: gỡ ${oldSlugs.length} bài code khỏi lớp nhí, xóa ${removedSubs} lượt nộp liên quan`);
  }

  // ---- 3. K6-9: trạng thái nộp bài + học sinh daicagovap ------------------------------------------------------------
  // Bài code của lớp = bài code trong các Ngày học (class_assignments, nguồn học viên cũng đọc); exerciseSlugs luôn khớp.
  const codingOf = async (classDoc) => {
    const list = await db.collection('class_assignments').find({ classId: String(classDoc._id), type: 'CODING' }).sort({ startAt: 1, order: 1 }).project({ exerciseSlug: 1, title: 1 }).toArray();
    const slugs = [...new Set(list.map((a) => a.exerciseSlug).filter(Boolean))];
    const exs = slugs.length ? await exercises.find({ slug: { $in: slugs } }).project({ slug: 1 }).toArray() : [];
    return { exs: slugs.map((sl) => exs.find((e) => e.slug === sl)).filter(Boolean), assignments: list };
  };

  let dai;
  let pyAssignments = [];
  {
    const coded = await codingOf(cls.py);
    const py = coded.exs;
    pyAssignments = coded.assignments;
    await setExercises(cls.py, py.map((e) => e.slug));
    const sOk = await byEmail('seed-class-6-9-1@demo.cybersoft.local');
    const sWa = await byEmail('seed-class-6-9-2@demo.cybersoft.local');
    const sNone = await byEmail('seed-class-6-9-3@demo.cybersoft.local');
    dai = await users.findOne({ email: 'daicagovap@demo.cybersoft.local' });
    if (!dai) {
      const doc = { email: 'daicagovap@demo.cybersoft.local', fullName: 'daicagovap', role: 'STUDENT', ageGroup: '6-9', status: 'ACTIVE', password: await bcrypt.hash(require('crypto').randomBytes(16).toString('hex'), 10), phone: '', bio: '', [FLAG]: true, createdAt: now, updatedAt: now };
      dai = { ...doc, _id: (await users.insertOne(doc)).insertedId };
    }
    const members = [sOk, sWa, sNone, dai].filter(Boolean);
    await addStudents(cls.py, members.map((m) => m._id));
    await clearSubs(members.map((m) => m._id), py);
    const docs = [];
    py.forEach((ex, i) => {
      if (sOk) docs.push(upsertSub(sOk._id, ex, 'AC', 10, 10, 300 - i * 10));
      if (sWa) docs.push(upsertSub(sWa._id, ex, 'WA', 6, 10, 280 - i * 10));
      docs.push(upsertSub(dai._id, ex, 'AC', 10, 10, 90 - i * 10));
    });
    await submissions.insertMany(docs);
    log(`  K6-9: ${sOk?.fullName ?? '-'} Passed 100/100, ${sWa?.fullName ?? '-'} Wrong Answer 60/100, ${sNone?.fullName ?? '-'} chưa nộp, daicagovap có cảnh báo out-tab`);
  }

  // ---- 4. K10-12 + cảnh báo out-tab ---------------------------------------------------------------------------------
  {
    const codedAlgo = await codingOf(cls.algo);
    const algo = codedAlgo.exs;
    await setExercises(cls.algo, algo.map((e) => e.slug));
    const s1 = await byEmail('seed-class-10-12-1@demo.cybersoft.local');
    const s2 = await byEmail('seed-class-10-12-2@demo.cybersoft.local');
    const s3 = await byEmail('seed-class-10-12-3@demo.cybersoft.local');
    const members = [s1, s2, s3].filter(Boolean);
    await clearSubs(members.map((m) => m._id), algo);
    const docs = [];
    algo.forEach((ex, i) => {
      if (s1) docs.push(upsertSub(s1._id, ex, 'AC', 8, 8, 200 - i * 10));
      if (s2) docs.push(upsertSub(s2._id, ex, 'WA', 5, 8, 190 - i * 10));
    });
    if (docs.length) await submissions.insertMany(docs);

    const base = (c) => ({ classId: String(c._id), className: c.name, teacherId: c.teacherId, teacherIds: c.teacherIds?.length ? c.teacherIds : [c.teacherId], status: 'OPEN', severity: 'WARNING', [FLAG]: true, createdAt: now });
    // Cảnh báo của lớp = rời màn hình khi làm BÀI TẬP ĐƯỢC GIAO TRONG CHÍNH LỚP (kind CLASS_ASSIGNMENT, refId = id bài giao). Cảnh báo
    // cuộc thi là sự kiện chung của hệ thống (kind CONTEST, không gắn lớp) nên chỉ xuất hiện ở Giám sát liêm chính chung.
    const pyTarget = pyAssignments.find((a) => /chuỗi/i.test(a.title)) ?? pyAssignments[pyAssignments.length - 1];
    const algoTarget = codedAlgo.assignments[codedAlgo.assignments.length - 1];
    const alertDocs = [];
    if (pyTarget) alertDocs.push({ ...base(cls.py), kind: 'CLASS_ASSIGNMENT', userId: String(dai._id), studentName: 'daicagovap', refId: String(pyTarget._id), refTitle: pyTarget.title, leaveCount: 3, awaySeconds: 45, lastLeaveAt: minutesAgo(35), updatedAt: minutesAgo(35), message: 'Học viên daicagovap đã rời màn hình làm bài > 2 lần' });
    if (s3 && algoTarget) alertDocs.push({ ...base(cls.algo), kind: 'CLASS_ASSIGNMENT', userId: String(s3._id), studentName: s3.fullName, refId: String(algoTarget._id), refTitle: algoTarget.title, leaveCount: 2, awaySeconds: 20, lastLeaveAt: minutesAgo(120), updatedAt: minutesAgo(120), message: `Học viên ${s3.fullName} vừa rời màn hình làm bài (lần 2).` });
    alertDocs.push({ kind: 'CONTEST', status: 'OPEN', severity: 'WARNING', [FLAG]: true, createdAt: now, userId: String(dai._id), studentName: 'daicagovap', refId: 'seed-python-vong-1', refTitle: 'Python Vòng 1 (Cuộc thi)', leaveCount: 3, awaySeconds: 45, lastLeaveAt: minutesAgo(50), updatedAt: minutesAgo(50), message: 'Học viên daicagovap đã rời màn hình thi 3 lần (tổng 45 giây).' });
    for (const a of alertDocs) await alerts.updateOne({ kind: a.kind, userId: a.userId, refId: a.refId }, { $set: a }, { upsert: true });
    log(`  Out-tab: ${alertDocs.length} cảnh báo mẫu (${alertDocs.filter((a) => a.kind === 'CLASS_ASSIGNMENT').length} của bài lớp, ${alertDocs.filter((a) => a.kind === 'CONTEST').length} của cuộc thi)`);
  }

  // ---- 5. Tester QA: 2 bài Chờ chấm --------------------------------------------------------------------------------
  {
    const labs = await testerLabs.find({}).sort({ labCode: 1 }).limit(2).toArray();
    const people = [await byEmail('nguoidilam1@gmail.com'), await byEmail('nguoidilam2@gmail.com')];
    const forms = [
      {
        testCases: [
          { code: 'TC01', description: 'Đăng ký thành công với dữ liệu hợp lệ', input: 'email=a@x.com; mật khẩu=Abc@1234', expected: 'Tạo tài khoản, chuyển tới trang đăng nhập' },
          { code: 'TC02', description: 'Đăng ký với email đã tồn tại', input: 'email trùng tài khoản có sẵn', expected: 'Báo "Email đã được sử dụng"' },
          { code: 'TC03', description: 'Để trống mật khẩu', input: 'mật khẩu rỗng', expected: 'Báo lỗi bắt buộc nhập mật khẩu' },
          { code: 'TC04', description: 'Mật khẩu đúng 8 ký tự (giá trị biên)', input: 'Abcd@123', expected: 'Chấp nhận mật khẩu' },
          { code: 'TC05', description: 'Email chứa ký tự đặc biệt/XSS', input: '<script>alert(1)</script>@x.com', expected: 'Từ chối, không thực thi script' },
        ],
        bugReports: [
          { title: 'Đăng ký thành công nhưng không hiện thông báo', steps: '1. Mở trang đăng ký\n2. Nhập dữ liệu hợp lệ\n3. Bấm Đăng ký', expected: 'Hiện thông báo thành công', actual: 'Trang tải lại, không có thông báo nào', severity: 'MEDIUM' },
          { title: 'Cho phép email không đúng định dạng', steps: '1. Nhập email "abc@"\n2. Bấm Đăng ký', expected: 'Báo email không hợp lệ', actual: 'Form được gửi đi', severity: 'HIGH' },
        ],
      },
      {
        testCases: [
          { code: 'TC01', description: 'Tìm phim theo tên có kết quả', input: 'từ khóa "Avengers"', expected: 'Hiện danh sách phim khớp' },
          { code: 'TC02', description: 'Tìm phim không tồn tại', input: 'từ khóa "zzzzzz"', expected: 'Hiện "Không tìm thấy phim"' },
          { code: 'TC03', description: 'Đặt vé với ghế còn trống', input: 'Chọn ghế A5, thanh toán', expected: 'Đặt vé thành công' },
          { code: 'TC04', description: 'Đặt vé trùng ghế đã bán', input: 'Chọn ghế A5 lần thứ hai', expected: 'Báo ghế đã được đặt' },
          { code: 'TC05', description: 'Đặt 0 vé (giá trị biên)', input: 'số lượng = 0', expected: 'Báo số lượng tối thiểu là 1' },
        ],
        bugReports: [
          { title: 'Đặt trùng ghế vẫn thành công', steps: '1. Đặt ghế A5\n2. Mở tab khác, đặt lại ghế A5', expected: 'Báo ghế đã bán', actual: 'Đặt thành công lần hai, hai vé cùng một ghế', severity: 'CRITICAL' },
          { title: 'Ô tìm kiếm phân biệt hoa thường', steps: '1. Gõ "avengers"\n2. Gõ "Avengers"', expected: 'Cùng kết quả', actual: 'Chữ thường không ra kết quả', severity: 'LOW' },
        ],
      },
    ];
    let n = 0;
    for (let i = 0; i < 2; i++) {
      if (!people[i] || !labs[i]) { log(`(!) Thiếu học viên hoặc lab thứ ${i + 1}`); continue; }
      await testerSubs.insertOne({
        labId: labs[i]._id, userId: String(people[i]._id), artifactUrl: 'form', fileType: 'form', fileSize: JSON.stringify(forms[i]).length,
        autoCheckResults: [{ check: 'test-case-count', passed: true, message: 'Đủ 5 test case đầy đủ thông tin.' }, { check: 'bug-report', passed: true, message: 'Có 2 bug report đủ các bước tái hiện.' }],
        kind: 'FORM', formData: forms[i], rubricGrades: [], reviewerNotes: '', status: 'SUBMITTED', isFinalized: false, invalidated: false,
        [FLAG]: true, createdAt: minutesAgo(60 + i * 45), updatedAt: minutesAgo(60 + i * 45),
      });
      n++;
    }
    log(`  Tester QA: ${n} bài nộp Chờ chấm`);
  }

  // ---- 6. Rubric chuẩn Tester QA (40/30/30) + 1 bài đã chấm theo rubric --------------------------------------------
  {
    const TESTER_RUBRIC = [
      { key: 'test-coverage', label: 'Test Coverage: bao phủ ca biên và kịch bản lỗi', maxScore: 40, kind: 'quality' },
      { key: 'bug-report-clarity', label: 'Bug Report Clarity: Steps to Reproduce, Actual vs Expected', maxScore: 30, kind: 'quality' },
      { key: 'severity-classification', label: 'Severity Classification: Blocker / Critical / Major / Minor', maxScore: 30, kind: 'severity' },
    ];
    const migrated = await testerLabs.updateMany({}, { $set: { rubricCriteria: TESTER_RUBRIC } });
    const lab3 = await testerLabs.findOne({}, { sort: { labCode: 1 }, skip: 2 });
    const reviewer = await byEmail('nguoidilam2@gmail.com');
    if (lab3 && reviewer) {
      await testerSubs.insertOne({
        labId: lab3._id, userId: String(reviewer._id), artifactUrl: 'form', fileType: 'form', fileSize: 512,
        autoCheckResults: [{ check: 'test-case-count', passed: true, message: 'Đủ 6 test case.' }], kind: 'FORM',
        formData: {
          testCases: [
            { code: 'TC01', description: 'Thanh toán thẻ hợp lệ', input: 'Visa 4111..., CVV 123', expected: 'Thanh toán thành công' },
            { code: 'TC02', description: 'Thẻ hết hạn', input: 'Hạn 01/20', expected: 'Báo thẻ hết hạn' },
            { code: 'TC03', description: 'Số tiền 0 (biên)', input: 'amount = 0', expected: 'Từ chối' },
          ],
          bugReports: [{ title: 'Thanh toán 2 lần khi bấm đúp', steps: '1. Chọn vé\n2. Bấm Thanh toán hai lần liên tiếp', expected: 'Chỉ trừ tiền 1 lần', actual: 'Bị trừ tiền 2 lần', severity: 'BLOCKER' }],
        },
        rubricGrades: [
          { key: 'test-coverage', score: 32 },
          { key: 'bug-report-clarity', score: 26 },
          { key: 'severity-classification', score: 28 },
        ],
        reviewerNotes: 'Bao phủ tốt ca biên số tiền và thẻ hết hạn; bug thanh toán đúp phân loại Blocker là chính xác. Nên bổ sung ca mất mạng giữa chừng.',
        reviewerId: tid, status: 'REVIEWED', isFinalized: false, invalidated: false,
        [FLAG]: true, createdAt: minutesAgo(60 * 26), updatedAt: minutesAgo(60 * 20),
      });
    }
    log(`  Rubric Tester chuẩn 40/30/30: cập nhật ${migrated.modifiedCount} lab; 1 bài mẫu đã chấm 86/100`);
  }

  // ---- 7. Bài đánh giá K10-12: Assignment / Contest / Exam với đủ các trạng thái ---------------------------------
  {
    const assessments = db.collection('assessments');
    const asubs = db.collection('assessment_submissions');
    await asubs.deleteMany({ [FLAG]: true });
    await assessments.deleteMany({ [FLAG]: true });
    const classId = String(cls.algo._id);
    const day = 24 * 60;
    const mk = async (doc) => (await assessments.insertOne({ classId, maxScore: 100, createdBy: tid, [FLAG]: true, createdAt: minutesAgo(30 * day), updatedAt: now, ...doc })).insertedId;
    const assignmentPolicy = { maxAttempts: 3, gracePeriodMs: 5 * 60000, lateWindowMs: 24 * 3600000, hideDetails: false };
    const A = [];
    for (let i = 1; i <= 4; i++) A.push(await mk({ assessmentType: 'ASSIGNMENT', title: `Bài tập tuần ${i}: ${['Mảng', 'Đệ quy', 'Sắp xếp', 'Quy hoạch động'][i - 1]}`, dueDate: minutesAgo((5 - i) * 7 * day), ...assignmentPolicy }));
    const C = await mk({ assessmentType: 'CONTEST', title: 'Đấu trường Thuật toán Vòng 1', startTime: minutesAgo(10 * day), durationMinutes: 90, maxAttempts: 1, gracePeriodMs: 0, lateWindowMs: 0, hideDetails: false });
    const E = await mk({ assessmentType: 'EXAM', title: 'Thi kết thúc học phần', dueDate: minutesAgo(2 * day), maxAttempts: 1, gracePeriodMs: 0, lateWindowMs: 0, hideDetails: true });

    const students = [];
    for (let i = 1; i <= 4; i++) {
      const u = await byEmail(`seed-class-10-12-${i}@demo.cybersoft.local`);
      if (u) students.push(u);
    }
    const hist = (states, by) => states.map((to, i) => ({ from: i ? states[i - 1] : null, to, by: to === 'SUBMITTED' || to === 'LATE' || to === 'APPEALING' || to === 'DRAFT' ? by : tid, actor: ['DRAFT', 'SUBMITTED', 'LATE', 'APPEALING'].includes(to) ? 'OWNER' : 'CLASS_TEACHER', at: minutesAgo(day * (states.length - i)) }));
    const PATH = {
      SUBMITTED: ['DRAFT', 'SUBMITTED'],
      LATE_PUBLISHED: ['DRAFT', 'LATE', 'GRADING', 'GRADED', 'PUBLISHED'],
      PUBLISHED: ['DRAFT', 'SUBMITTED', 'GRADING', 'GRADED', 'PUBLISHED'],
      APPEALING: ['DRAFT', 'SUBMITTED', 'GRADING', 'GRADED', 'PUBLISHED', 'APPEALING'],
      FINALIZED: ['DRAFT', 'SUBMITTED', 'GRADING', 'GRADED', 'PUBLISHED', 'FINALIZED'],
    };
    const sub = (assessmentId, student, attemptNo, path, raw, extra = {}) => {
      const states = PATH[path];
      const late = path === 'LATE_PUBLISHED';
      const graded = states.includes('GRADED');
      return {
        assessmentId, classId, studentId: String(student._id), attemptNo, state: states[states.length - 1], content: { code: '# bài làm mẫu' },
        submittedAt: minutesAgo(day * (states.length - 1)), isLate: late,
        rawScore: graded ? raw : null, score: graded ? (late ? Math.min(raw, 90) : raw) : null,
        feedback: graded ? 'Đúng hướng, cần tối ưu độ phức tạp.' : '', gradedBy: graded ? tid : undefined,
        leaveCount: 0, forceSubmitted: false, flags: [], history: hist(states, String(student._id)), [FLAG]: true, createdAt: now, updatedAt: now, ...extra,
      };
    };
    const docs = [];
    const [s1, s2, s3, s4] = students;
    if (s1) {
      // Học viên chăm: đủ bài, lượt 2 tuần 1 cao hơn lượt 1 (ghi nhận lượt cao nhất), có 1 bài FINALIZED và 1 bài nộp trễ bị chặn trần 90.
      docs.push(sub(A[0], s1, 1, 'PUBLISHED', 70), sub(A[0], s1, 2, 'FINALIZED', 92), sub(A[1], s1, 1, 'LATE_PUBLISHED', 100), sub(A[2], s1, 1, 'PUBLISHED', 55), sub(A[3], s1, 1, 'PUBLISHED', 88));
      docs.push(sub(C, s1, 1, 'PUBLISHED', 84), sub(E, s1, 1, 'PUBLISHED', 78, { details: { tests: [{ input: '5', expected: '120', passed: true }] } }));
    }
    if (s2) {
      // Đang phúc khảo bài thi; bài tuần 4 vừa nộp, chờ chấm.
      docs.push(sub(A[0], s2, 1, 'PUBLISHED', 65), sub(A[1], s2, 1, 'PUBLISHED', 72), sub(A[2], s2, 1, 'PUBLISHED', 60), sub(A[3], s2, 1, 'SUBMITTED', 0));
      docs.push(sub(C, s2, 1, 'PUBLISHED', 58), sub(E, s2, 1, 'APPEALING', 49, { appeal: { reason: 'Em nghĩ câu 4 bị chấm thiếu ý trường hợp mảng rỗng', at: minutesAgo(day) } }));
    }
    if (s3) {
      // Bỏ nộp 2/4 bài tập tuần (50% > 30%): điểm tổng kết bị khóa, xếp loại F.
      docs.push(sub(A[0], s3, 1, 'PUBLISHED', 90), sub(A[1], s3, 1, 'PUBLISHED', 85), sub(C, s3, 1, 'PUBLISHED', 95), sub(E, s3, 1, 'FINALIZED', 91));
    }
    if (s4) {
      // Cuộc thi bị hệ thống tự nộp do rời màn hình 3 lần.
      docs.push(sub(A[0], s4, 1, 'SUBMITTED', 0), sub(A[1], s4, 1, 'SUBMITTED', 0), sub(A[2], s4, 1, 'PUBLISHED', 75));
      docs.push({ ...sub(C, s4, 1, 'SUBMITTED', 0), leaveCount: 3, forceSubmitted: true, flags: ['OUT_TAB_FORCE_SUBMIT'], history: [{ from: null, to: 'DRAFT', by: String(s4._id), actor: 'OWNER', at: minutesAgo(10 * day) }, { from: 'DRAFT', to: 'SUBMITTED', by: 'system', actor: 'SYSTEM', at: minutesAgo(10 * day - 30), reason: 'Rời màn hình 3 lần (mỗi lần >= 5 giây): hệ thống tự nộp bài.' }] });
    }
    if (docs.length) await asubs.insertMany(docs);
    const count = (st) => docs.filter((d) => d.state === st).length;
    log(`  Đánh giá K10-12: 4 Assignment + 1 Contest + 1 Exam; bài nộp SUBMITTED=${count('SUBMITTED')}, PUBLISHED=${count('PUBLISHED')}, APPEALING=${count('APPEALING')}, FINALIZED=${count('FINALIZED')}`);
  }

  // ---- 8. Tiến độ khối 3-5: ghi vào block_puzzle_progress, CHÍNH collection hồ sơ của bé (/profile) đọc ------------
  {
    // Collection kid_progress từng được tạo song song ở bản trước: bỏ hẳn để chỉ còn một nguồn sự thật.
    if ((await db.listCollections({ name: 'kid_progress' }).toArray()).length) {
      await db.collection('kid_progress').drop();
      log('  Đã xóa collection kid_progress (chạy song song, không còn dùng).');
    }
    const bp = db.collection('block_puzzle_progress');
    await bp.deleteMany({ [FLAG]: true });
    const day = 24 * 3600 * 1000;
    const levelSlugs = [
      ...Array.from({ length: 10 }, (_, i) => ['blockly-maze', `blockly-maze-level-${i + 1}`]),
      ...Array.from({ length: 10 }, (_, i) => ['blockly-turtle', `blockly-turtle-level-${i + 1}`]),
      ...Array.from({ length: 10 }, (_, i) => ['blockly-bird', `blockly-bird-level-${i + 1}`]),
    ];
    // [email, số màn đã xong = số sao, lần hoàn thành gần nhất cách đây bao nhiêu ngày]
    const kidsSpec = [
      ['seed-class-3-5-1@demo.cybersoft.local', 12, 0.2],
      ['seed-class-3-5-2@demo.cybersoft.local', 9, 5], // kẹt ở Ải 4 hơn 3 ngày -> STUCK_ALERT
      ['seed-class-3-5-3@demo.cybersoft.local', 15, 0.1],
    ];
    for (const [email, count, lastAgoDays] of kidsSpec) {
      const u = await byEmail(email);
      if (!u) continue;
      await bp.deleteMany({ userId: String(u._id) });
      const last = now.getTime() - lastAgoDays * day;
      const docs = levelSlugs.slice(0, count).map(([gameId, lessonSlug], i) => ({
        userId: String(u._id), lessonSlug, gameId, completedAt: new Date(last - (count - 1 - i) * 4 * 60000), [FLAG]: true, createdAt: now, updatedAt: now,
      }));
      await bp.insertMany(docs);
      log(`  block_puzzle_progress ${u.fullName}: ${count} sao, Ải ${Math.floor(count / 3) + 1}${lastAgoDays > 3 ? ' (STUCK_ALERT: ngừng chơi ' + lastAgoDays + ' ngày)' : ''}`);
    }
  }

  // ---- 9. Lớp Tester QA: 8 học viên, bài đã chấm theo rubric 40/30/30, người đang làm dở (3 Lab) ---------------------
  {
    // Học viên khóa Career Adult = mọi tài khoản CAREER_ADULT; bài nộp nằm trong tester_lab_submissions (collection học viên đang dùng).
    const labList = await testerLabs.find({}).sort({ labCode: 1 }).toArray();
    const people = [
      ['tester-demo-long@demo.cybersoft.local', 'Lê Hoàng Long'],
      ['tester-demo-maianh@demo.cybersoft.local', 'Trần Mai Anh'],
      ['tester-demo-huy@demo.cybersoft.local', 'Đỗ Quốc Huy'],
      ['tester-demo-yen@demo.cybersoft.local', 'Phạm Hải Yến'],
      ['tester-demo-minh@demo.cybersoft.local', 'Nguyễn Văn Minh'],
      ['tester-demo-giabao@demo.cybersoft.local', 'Bùi Gia Bảo'],
    ];
    const student = {};
    for (const [email, fullName] of people) {
      let u = await users.findOne({ email });
      if (!u) {
        const doc = { email, fullName, role: 'STUDENT', ageGroup: 'CAREER_ADULT', status: 'ACTIVE', password: await bcrypt.hash(require('crypto').randomBytes(16).toString('hex'), 10), phone: '', bio: '', [FLAG]: true, createdAt: now, updatedAt: now };
        u = { ...doc, _id: (await users.insertOne(doc)).insertedId };
      }
      student[email] = u;
    }
    const form = (lab, seed) => ({
      testCases: [
        { code: 'TC01', description: `${lab.title}: luồng chính hợp lệ`, input: 'Dữ liệu hợp lệ theo spec', expected: 'Hệ thống xử lý thành công' },
        { code: 'TC02', description: 'Để trống trường bắt buộc', input: 'Trường bắt buộc rỗng', expected: 'Báo lỗi bắt buộc nhập' },
        { code: 'TC03', description: 'Giá trị biên (min/max)', input: 'Giá trị sát ngưỡng cho phép', expected: 'Chấp nhận đúng ngưỡng, từ chối vượt ngưỡng' },
        { code: 'TC04', description: 'Định dạng sai', input: 'Chuỗi sai định dạng', expected: 'Từ chối và báo lỗi định dạng' },
        { code: 'TC05', description: 'Ký tự đặc biệt / XSS', input: '<script>alert(1)</script>', expected: 'Không thực thi mã, dữ liệu được escape' },
      ],
      bugReports: [
        { title: `[${lab.labCode}] Thiếu thông báo lỗi khi nhập sai (${seed})`, steps: '1. Mở màn hình chức năng\n2. Nhập dữ liệu sai định dạng\n3. Bấm Gửi', expected: 'Hiện thông báo lỗi rõ ràng', actual: 'Không có phản hồi, form giữ nguyên', severity: 'MAJOR' },
        { title: `[${lab.labCode}] Lỗi nghiêm trọng khi dữ liệu ở ngưỡng biên`, steps: '1. Nhập giá trị đúng ngưỡng tối đa\n2. Bấm Xác nhận', expected: 'Xử lý thành công', actual: 'Ứng dụng báo lỗi 500', severity: 'CRITICAL' },
      ],
    });
    const split = (total) => { const a = Math.round(total * 0.4); const b = Math.round(total * 0.3); return [a, b, total - a - b]; };
    const graded = (email, labIndex, total, note, daysAgo) => {
      const lab = labList[labIndex];
      const [a, b, c] = split(total);
      return {
        labId: lab._id, userId: String(student[email]._id), artifactUrl: 'form', fileType: 'form', fileSize: 640, kind: 'FORM',
        autoCheckResults: [{ check: 'test-case-count', passed: true, message: 'Đủ 5 test case đầy đủ thông tin.' }, { check: 'bug-report', passed: true, message: 'Có 2 bug report đủ các bước tái hiện.' }],
        formData: form(lab, student[email].fullName),
        rubricGrades: [{ key: 'test-coverage', score: a }, { key: 'bug-report-clarity', score: b }, { key: 'severity-classification', score: c }],
        reviewerNotes: note, reviewerId: tid, status: 'REVIEWED', isFinalized: false, invalidated: false,
        [FLAG]: true, createdAt: minutesAgo(daysAgo * 24 * 60 + 90), updatedAt: minutesAgo(daysAgo * 24 * 60),
      };
    };
    const E = (k) => `tester-demo-${k}@demo.cybersoft.local`;
    const docs = [
      // 4 bài đã chấm tiêu biểu: 92, 88, 85, 78 (rubric 40/30/30).
      graded(E('long'), 0, 92, 'Bao phủ rất tốt ca biên và kịch bản lỗi; bug report có đủ Steps to Reproduce, Actual vs Expected. Phân loại Blocker/Critical chính xác.', 6),
      graded(E('long'), 1, 88, 'Test case đa dạng, bug report rõ ràng. Cần mô tả môi trường kiểm thử cụ thể hơn ở các bug mức Major.', 4),
      graded(E('maianh'), 0, 85, 'Test coverage khá đầy đủ; bug report dễ tái hiện. Nên bổ sung ca lỗi mạng và phiên hết hạn.', 5),
      graded(E('yen'), 0, 82, 'Test case bao phủ khá, bug report đủ Steps to Reproduce; cần ghi rõ dữ liệu kiểm thử và môi trường chạy.', 2),
      graded(E('huy'), 1, 78, 'Phân loại severity còn nhầm giữa Major và Minor ở bug thứ hai; nên đối chiếu tiêu chí nghiệm thu trước khi gán mức.', 3),
      // Đang làm dở: mới xong 3/12 Lab.
      graded(E('minh'), 0, 70, 'Đã có ca biên cơ bản nhưng thiếu kịch bản lỗi; bug report cần ghi rõ kết quả mong đợi.', 8),
      graded(E('minh'), 1, 64, 'Test case còn dàn trải, chưa bám sát spec; hãy ưu tiên các luồng có rủi ro cao.', 7),
      graded(E('minh'), 2, 58, 'Bug report thiếu bước tái hiện chi tiết nên khó xác nhận; cần bổ sung ảnh/log đính kèm.', 6),
      graded(E('giabao'), 0, 80, 'Bao phủ ổn, severity phân loại hợp lý; bug report cần thống nhất định dạng tiêu đề.', 9),
      graded(E('giabao'), 1, 76, 'Có đủ ca biên; nên thêm kịch bản dữ liệu trùng và thao tác đồng thời.', 8),
      graded(E('giabao'), 2, 72, 'Mô tả Actual vs Expected tốt, chưa nêu rõ mức ảnh hưởng người dùng khi gán severity.', 7),
    ];
    // Hai bài đang chờ chấm cho học viên mới (ngoài 2 bài của nguoidilam1/2 ở mục 5): giữ đúng 2 bài Chờ chấm tiêu biểu của lớp.
    await testerSubs.insertMany(docs);
    log(`  Tester QA: +${Object.keys(student).length} học viên khóa (tổng 8 với nguoidilam1/2), +${docs.length} bài đã chấm; Minh và Gia Bảo đang làm dở (3/${labList.length} Lab)`);
  }

  // ---- 10. Data SQL Lab / AI Prompt Lab: bài tự chấm trên sandbox của học viên khóa (giảng viên chỉ theo dõi) -------------
  {
    const da = db.collection('da_lab_submissions');
    const ai = db.collection('ai_lab_submissions');
    await da.deleteMany({ [FLAG]: true });
    await ai.deleteMany({ [FLAG]: true });
    const daLabsList = await exercises.find({ topic: 'da-lab-pack', resource_id: { $exists: true } }).project({ slug: 1, type: 1 }).sort({ slug: 1 }).limit(8).toArray();
    const aiLabsList = await exercises.find({ topic: 'ai-lab-pack', type: 'AI_LAB' }).project({ slug: 1 }).sort({ slug: 1 }).limit(8).toArray();
    const who = (k) => byEmail(`tester-demo-${k}@demo.cybersoft.local`);
    const [long, maianh, huy, yen] = [await who('long'), await who('maianh'), await who('huy'), await who('yen')];
    const SQL = [
      'SELECT customer_id, SUM(amount) AS total\nFROM orders\nWHERE status = \'PAID\'\nGROUP BY customer_id\nORDER BY total DESC\nLIMIT 10;',
      'SELECT p.category, COUNT(*) AS n\nFROM products p\nJOIN order_items i ON i.product_id = p.id\nGROUP BY p.category\nHAVING COUNT(*) > 5;',
      'SELECT * FROM orders WHERE amount > 100;',
    ];
    const sqlLabs = daLabsList.filter((l) => l.type !== 'DA_INSIGHT' && l.type !== 'INSIGHT');
    const daPlan = [[long, [10, 10, 10]], [maianh, [10, 6]], [huy, [4]]];
    let daN = 0;
    for (const [u, scores] of daPlan) {
      if (!u) continue;
      for (let i = 0; i < Math.min(scores.length, sqlLabs.length); i++) {
        const lab = sqlLabs[i];
        const sc = scores[i];
        await da.insertOne({
          userId: String(u._id), exerciseId: String(lab._id), exerciseSlug: lab.slug, type: 'SQL', content: SQL[Math.min(i, SQL.length - 1)], attemptCount: sc === 10 ? 2 : 3,
          bestScore: sc, status: 'GRADED', score: sc, maxScore: 10, aiExplanation: sc === 10 ? 'Kết quả khớp đáp án mẫu.' : 'Thiếu điều kiện lọc nên kết quả thừa dòng.',
          criteria: [], history: [{ content: SQL[2], status: 'GRADED', score: Math.max(0, sc - 5), maxScore: 10, feedback: 'Chưa đúng kết quả mong đợi.', submittedAt: minutesAgo(3 * 24 * 60) }, { content: SQL[Math.min(i, SQL.length - 1)], status: 'GRADED', score: sc, maxScore: 10, feedback: 'Đã chấm.', submittedAt: minutesAgo(2 * 24 * 60) }],
          [FLAG]: true, createdAt: minutesAgo(3 * 24 * 60), updatedAt: minutesAgo(2 * 24 * 60 + i * 60),
        });
        daN++;
      }
    }
    const PROMPTS = [
      'Bạn là trợ lý hỗ trợ khách hàng. Hãy tóm tắt email dưới đây trong đúng 3 câu, giữ nguyên tên sản phẩm, và trả về JSON {"summary": string}.',
      'Phân loại ý định của câu hỏi thành một trong: HOÀN TIỀN, KỸ THUẬT, KHÁC. Chỉ trả về nhãn, không giải thích.',
    ];
    const aiPlan = [[long, [92, 88]], [yen, [74]], [maianh, [45]]];
    let aiN = 0;
    for (const [u, scores] of aiPlan) {
      if (!u) continue;
      for (let i = 0; i < Math.min(scores.length, aiLabsList.length); i++) {
        const lab = aiLabsList[i];
        const sc = scores[i];
        const status = sc >= 60 ? 'PASSED' : 'FAILED';
        await ai.insertOne({
          userId: String(u._id), exerciseId: String(lab._id), exerciseSlug: lab.slug, prompt: PROMPTS[i % PROMPTS.length], model: 'gemini-flash-lite', config: { temperature: 0.2, maxTokens: 400 }, runManifest: { grader: 'v1', seed: 7 },
          qualityScore: sc, cost: 0.002, latency: 850, score: sc, maxScore: 100, status, totalAttempts: sc >= 60 ? 3 : 5, bestQualityScore: sc,
          best: { score: sc, qualityScore: sc, cost: 0.002, latency: 850, status, prompt: PROMPTS[i % PROMPTS.length], model: 'gemini-flash-lite' },
          history: [{ promptHash: 'h1', prompt: 'Tóm tắt email.', model: 'gemini-flash-lite', config: {}, score: Math.max(10, sc - 30), qualityScore: Math.max(10, sc - 30), cost: 0.002, latency: 900, status: 'FAILED', runManifest: {}, createdAt: minutesAgo(2 * 24 * 60) }],
          [FLAG]: true, createdAt: minutesAgo(2 * 24 * 60), updatedAt: minutesAgo(24 * 60 + i * 30),
        });
        aiN++;
      }
    }
    log(`  Career sandbox: ${daN} bài SQL (Data SQL Lab) và ${aiN} bài prompt (AI Prompt Lab) của học viên khóa`);
  }

  log('\nXong. Đăng nhập teacher@gmail.com (mật khẩu = DEFAULT_SEED_PASSWORD trong BE/.env) để xem dữ liệu.');
  await mongoose.disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });
