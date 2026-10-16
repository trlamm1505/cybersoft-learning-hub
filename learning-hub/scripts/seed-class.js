#!/usr/bin/env node
/**
 * Seed lớp học mẫu cho cả 4 khối (3–5, 6–9, 10–12 và 3 khóa Người đi làm: Tester QA, Data SQL, AI Prompt) với giảng viên riêng, mã lớp, bài giao theo ngày (trắc nghiệm + code) có hạn chót
 * và kết quả của các học sinh mẫu để trang "Lớp học của tôi" và bảng xếp hạng lớp có dữ liệu:
 *   node scripts/seed-class.js --dry-run                         # chỉ in kế hoạch
 *   node scripts/seed-class.js                                   # ghi vào CSDL trong BE/.env (idempotent)
 *   node scripts/seed-class.js --add-email=ban@gmail.com         # ghi danh thêm tài khoản học sinh thật vào lớp đúng khối (lặp được)
 *   node scripts/seed-class.js --reactivate                       # đưa các lớp MẪU đang ở Lưu trữ về Đang hoạt động (mặc định không đè lựa chọn của Admin)
 *   node scripts/seed-class.js --fix-dangling                    # gỡ id học viên/giảng viên trỏ tới tài khoản KHÔNG còn tồn tại khỏi mọi lớp (toàn vẹn khóa ngoại)
 *   node scripts/seed-class.js --remove                          # gỡ đúng dữ liệu mẫu này
 *
 * Mốc thời gian tính theo NGÀY CHẠY SCRIPT (giờ Việt Nam): ngày 1-2 đã quá hạn, ngày 3-4 đang mở, ngày 5 chưa mở.
 * Tài khoản mẫu có cờ isSeedClassDemo và mật khẩu ngẫu nhiên (không đăng nhập được). Không xóa dữ liệu thật.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const h = require('./lib/setup-helpers');

const BE = path.join(__dirname, '..', 'BE');
const envText = fs.existsSync(path.join(BE, '.env')) ? fs.readFileSync(path.join(BE, '.env'), 'utf8') : '';
const uri = process.env.DATABASE_URL || h.readEnvValue(envText, 'DATABASE_URL') || '';
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const remove = args.includes('--remove');
const reactivate = args.includes('--reactivate');
const fixDangling = args.includes('--fix-dangling');
// Tài khoản học sinh test được ghi danh sẵn vào lớp đúng khối (thêm bằng --add-email=... cho tài khoản khác).
const DEFAULT_TEST_ACCOUNTS = ['muoi@gmail.com'];
const addEmails = [
  ...new Set([
    ...DEFAULT_TEST_ACCOUNTS,
    ...args.filter((a) => a.startsWith('--add-email=')).map((a) => a.slice('--add-email='.length).trim().toLowerCase()).filter(Boolean),
  ]),
];

// Giảng viên mẫu phụ trách từng lớp/khóa (tài khoản có cờ isSeedClassDemo, mật khẩu ngẫu nhiên).
const TEACHERS = {
  kid: { email: 'seed-teacher-kid@demo.cybersoft.local', fullName: 'Cô Phạm Thu Hương' },
  py: { email: 'seed-teacher-1@demo.cybersoft.local', fullName: 'Cô Nguyễn Thị Lan' },
  algo: { email: 'seed-teacher-algo@demo.cybersoft.local', fullName: 'Thầy Trần Minh Khoa' },
  qa: { email: 'seed-teacher-qa@demo.cybersoft.local', fullName: 'Thầy Lê Quốc Bảo' },
  data: { email: 'seed-teacher-data@demo.cybersoft.local', fullName: 'Cô Võ Ngọc Mai' },
  ai: { email: 'seed-teacher-ai@demo.cybersoft.local', fullName: 'Thầy Đặng Anh Tuấn' },
};
const DEMO_TEST_ID = '673f22222222222222222222';
const DAY = 24 * 60 * 60 * 1000;

const STUDENTS = {
  '3-5': ['Bé Nguyễn Gia Hân', 'Bé Trần Minh Khang', 'Bé Lê Bảo An', 'Bé Phạm Tuệ Lâm', 'Bé Hoàng Anh Khôi', 'Bé Đỗ Diệp Chi'],
  '6-9': ['Nguyễn Hoàng Nam', 'Trần Thu Hà', 'Lê Minh Quân', 'Phạm Ngọc Anh', 'Hoàng Gia Bảo', 'Đỗ Khánh Linh'],
  '10-12': ['Bùi Quang Minh', 'Đặng Phương Thảo', 'Ngô Thành Đạt', 'Lý Hải Yến', 'Trịnh Tuấn Kiệt', 'Mai Bảo Châu'],
};

const CLASSES = [
  {
    band: '3-5',
    teacher: 'kid',
    name: 'Lập trình Sáng tạo Nhí (K3-5)',
    code: 'CL-35KID01',
    description: 'Lớp làm quen lập trình qua trò chơi kéo-thả khối lệnh cho bé 3–5 tuổi (học theo trò chơi, không có bài code/trắc nghiệm giao theo hạn).',
    noAssignments: true,
  },
  {
    band: '6-9',
    teacher: 'py',
    name: 'Python Căn bản & Tư duy Thuật toán (K6-9)',
    code: 'CL-69PY01',
    description: 'Lớp Python căn bản dành cho học sinh Khối 6–9: bài tập hằng ngày gồm trắc nghiệm và code.',
    quizBank: { category: 'Python', gradeBands: '6-9' },
    codes: ['tinh-tong-hai-so-nguyen', 'kiem-tra-so-chan-le', 'tim-so-lon-nhat', 'dao-nguoc-chuoi', 'kiem-tra-so-nguyen-to', 'fibonacci'],
  },
  {
    band: '10-12',
    teacher: 'algo',
    name: 'Luyện thi Thuật toán Chuyên sâu (K10-12)',
    code: 'CL-1012A1',
    description: 'Lớp luyện thuật toán cho học sinh Khối 10–12: trắc nghiệm thuật toán và bài Algo Judge.',
    quizBank: { tag: 'seed-contest-algo', fallback: { gradeBands: '10-12' } },
    codes: ['day15-dem-cap-tong-bang-target', 'day15-gia-tri-xuat-hien-nhieu-nhat', 'day15-dem-nghich-the', 'day15-ghep-so-lon-nhat', 'day15-k-gia-tri-lon-nhat', 'day15-tim-kiem-mang-da-xoay'],
  },
];

// 3 khóa chuyên ngành của Người đi làm (CAREER_ADULT) quản lý như lớp: có giảng viên phụ trách, học viên ghi danh là mọi tài khoản CAREER_ADULT.
const CAREER_CLASSES = [
  { courseKey: 'tester-qa', teacher: 'qa', code: 'CL-CAREER-TESTER', name: 'Kiểm thử phần mềm thực chiến (Tester QA)', description: 'Khóa Tester QA cho người đi làm/trái ngành: thực hành 12 phòng lab kiểm thử có giảng viên chấm theo rubric.' },
  { courseKey: 'data-sql', teacher: 'data', code: 'CL-CAREER-DATA', name: 'Phân tích dữ liệu & Truy vấn SQL (Data Lab)', description: 'Khóa Data SQL: truy vấn SQL trên SQLite in-memory và viết insight có giảng viên nhận xét.' },
  { courseKey: 'ai-prompt', teacher: 'ai', code: 'CL-CAREER-AI', name: 'Kỹ nghệ Prompt & Ứng dụng AI (AI Lab)', description: 'Khóa AI Prompt: thực hành viết prompt, chấm theo rubric kèm Gemini.' },
];

/** Bài giao: dayOffset so với hôm nay (VN), giờ bắt đầu 08:00 VN, hạn chót sau `dueHours` giờ. */
const PLAN = [
  { day: -3, items: [{ type: 'QUIZ', title: 'Trắc nghiệm ôn tập ngày 1', dueHours: 24 }, { type: 'CODING', code: 0, dueHours: 24 }] },
  { day: -2, items: [{ type: 'CODING', code: 1, dueHours: 30 }, { type: 'CODING', code: 2, dueHours: 30 }] },
  { day: -1, items: [{ type: 'QUIZ', title: 'Trắc nghiệm ôn tập ngày 3', dueHours: 72 }, { type: 'CODING', code: 3, dueHours: 72 }] },
  { day: 0, items: [{ type: 'CODING', code: 4, dueHours: 96 }] },
  { day: 1, items: [{ type: 'CODING', code: 5, dueHours: 120 }] },
];

/** 08:00 giờ Việt Nam của (hôm nay + day), trả về Date UTC. */
function vnMorning(dayOffset, now) {
  const vnNow = new Date(now.getTime() + 7 * 3600 * 1000);
  const y = vnNow.getUTCFullYear(), m = vnNow.getUTCMonth(), d = vnNow.getUTCDate();
  return new Date(Date.UTC(y, m, d + dayOffset, 8 - 7, 0, 0));
}

(async () => {
  if (!uri) { console.error('Thiếu DATABASE_URL.'); process.exit(1); }
  const mongoose = require(path.join(BE, 'node_modules', 'mongoose'));
  const bcrypt = require(path.join(BE, 'node_modules', 'bcrypt'));
  console.log(`CSDL: ${uri.replace(/(:\/\/[^:/@]+:)[^@]*@/, '$1***@')}${dryRun ? '  [dry-run]' : ''}${remove ? '  [remove]' : ''}`);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  try {
    const db = mongoose.connection.db;
    const users = db.collection('users');
    const classes = db.collection('classrooms');
    const assignments = db.collection('class_assignments');
    const subs = db.collection('submissions');
    const attempts = db.collection('quizattempts');
    const questions = db.collection('questions');
    const exercises = db.collection('exercises');
    const OID = mongoose.Types.ObjectId;

    // ---------------- Gỡ ----------------
    if (remove) {
      const seeded = await users.find({ isSeedClassDemo: true }, { projection: { _id: 1 } }).toArray();
      const seedIds = seeded.map((u) => String(u._id));
      const cls = await classes.find({ code: { $in: [...CLASSES, ...CAREER_CLASSES].map((c) => c.code) } }).toArray();
      const clsIds = cls.map((c) => String(c._id));
      const asg = await assignments.find({ classId: { $in: clsIds } }, { projection: { _id: 1 } }).toArray();
      const asgIds = asg.map((a) => String(a._id));
      if (dryRun) { console.log(`Sẽ gỡ ${seedIds.length} tài khoản mẫu, ${asgIds.length} bài giao, ${cls.length} lớp.`); return; }
      const s = await subs.deleteMany({ assignmentId: { $in: asgIds }, userId: { $in: seedIds } });
      const q = await attempts.deleteMany({ assignmentId: { $in: asgIds }, userId: { $in: seedIds.filter((i) => OID.isValid(i)).map((i) => new OID(i)) } });
      await classes.updateMany({ _id: { $in: cls.map((c) => c._id) } }, { $pull: { studentIds: { $in: seedIds } } });
      for (const c of await classes.find({ _id: { $in: cls.map((c) => c._id) } }).toArray()) {
        if ((c.studentIds || []).length === 0) {
          await assignments.deleteMany({ classId: String(c._id) });
          await classes.deleteOne({ _id: c._id });
          console.log(`  đã xóa lớp mẫu ${c.code}`);
        } else {
          console.log(`  giữ lớp ${c.code} vì còn học sinh thật (chỉ gỡ học sinh mẫu); bài giao giữ nguyên.`);
        }
      }
      const u = await users.deleteMany({ isSeedClassDemo: true });
      console.log(`Đã gỡ ${u.deletedCount} tài khoản mẫu, ${s.deletedCount} bài nộp, ${q.deletedCount} lượt thi.`);
      return;
    }

    const now = new Date();
    const pwHash = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);
    const upsertUser = async (email, fields) => {
      if (dryRun) return email;
      const res = await users.findOneAndUpdate(
        { email },
        { $set: { ...fields, status: 'ACTIVE', isSeedClassDemo: true, updatedAt: now }, $setOnInsert: { email, password: pwHash, phone: '', bio: '', createdAt: now } },
        { upsert: true, returnDocument: 'after' },
      );
      return String(res._id);
    };

    const teacherIds = {};
    for (const [k, t] of Object.entries(TEACHERS)) {
      teacherIds[k] = await upsertUser(t.email, { fullName: t.fullName, role: 'TEACHER' });
      console.log(`Giảng viên mẫu: ${t.fullName} (${t.email})`);
    }
    // Chỉ đặt giảng viên khi lớp chưa có hoặc đang do giảng viên MẪU phụ trách: không đè phân công thật của Admin.
    const seedTeacherSet = new Set(Object.values(teacherIds));
    const teacherFields = async (existing, teacherId) => {
      const keep = existing && existing.teacherId && !seedTeacherSet.has(String(existing.teacherId)) && !(await users.findOne({ _id: new OID(String(existing.teacherId)), isSeedClassDemo: true }));
      return keep ? {} : { teacherId, teacherIds: [teacherId] };
    };

    for (const c of CLASSES) {
      const teacherId = teacherIds[c.teacher];
      // ---- học sinh mẫu ----
      const ids = [];
      for (let i = 0; i < STUDENTS[c.band].length; i++) {
        ids.push(await upsertUser(`seed-class-${c.band}-${i + 1}@demo.cybersoft.local`, { fullName: STUDENTS[c.band][i], role: 'STUDENT', ageGroup: c.band }));
      }
      // ---- học sinh thật ghi danh thêm ----
      const realIds = [];
      for (const email of addEmails) {
        const u = await users.findOne({ email });
        if (!u) { if (!DEFAULT_TEST_ACCOUNTS.includes(email)) console.log(`  (!) không có tài khoản ${email}`); continue; }
        if (u.role !== 'STUDENT') { if (!DEFAULT_TEST_ACCOUNTS.includes(email)) console.log(`  (!) ${email} không phải học sinh`); continue; }
        if (u.ageGroup && u.ageGroup !== c.band) continue; // đúng khối mới vào lớp khối đó
        realIds.push(String(u._id));
      }

      // ---- lớp ----
      let clsDoc = dryRun ? null : await classes.findOne({ code: c.code });
      if (!dryRun) {
        const tf = await teacherFields(clsDoc, teacherId);
        await classes.updateOne(
          { code: c.code },
          // archived chỉ đặt khi tạo mới: không kích hoạt lại lớp mà Admin đã chuyển vào Lưu trữ.
          { $set: { name: c.name, description: c.description, ...tf, updatedAt: now }, $setOnInsert: { code: c.code, createdAt: now, exerciseSlugs: [], archived: false }, $addToSet: { studentIds: { $each: [...ids, ...realIds] } } },
          { upsert: true },
        );
        clsDoc = await classes.findOne({ code: c.code });
      }
      const classId = clsDoc ? String(clsDoc._id) : c.code;
      console.log(`- ${c.name} [${c.code}]: ${ids.length} học sinh mẫu${realIds.length ? ` + ${realIds.length} học sinh thật` : ''}`);

      if (c.noAssignments) continue; // lớp khối 3–5 học qua trò chơi, không có bài giao theo hạn

      // ---- câu hỏi trắc nghiệm ----
      let bank = [];
      if (c.quizBank.tag) bank = await questions.find({ tags: c.quizBank.tag }).sort({ _id: 1 }).toArray();
      if (bank.length < 5) {
        const f = c.quizBank.fallback || c.quizBank;
        bank = await questions.find({ ...(f.category ? { category: f.category } : {}), gradeBands: f.gradeBands }).sort({ _id: 1 }).toArray();
      }
      if (bank.length < 5) throw new Error(`Không đủ câu hỏi cho ${c.name}`);
      const quizSets = [bank.slice(0, 8), bank.slice(2, 10)];

      // ---- bài giao ----
      const asgDocs = [];
      let order = 0, quizIdx = 0;
      for (const dayPlan of PLAN) {
        const start = vnMorning(dayPlan.day, now);
        for (const it of dayPlan.items) {
          order++;
          const base = { classId, order, startAt: start, dueAt: new Date(start.getTime() + it.dueHours * 3600 * 1000), maxPoints: 10, createdBy: teacherId };
          if (it.type === 'QUIZ') {
            const set = quizSets[quizIdx++ % quizSets.length];
            asgDocs.push({ ...base, type: 'QUIZ', title: it.title, questionIds: set.map((q) => String(q._id)), _max: set.reduce((s, q) => s + (q.points || 10), 0) });
          } else {
            const slug = c.codes[it.code];
            const ex = await exercises.findOne({ slug }, { projection: { _id: 1, title: 1, testCases: 1 } });
            if (!ex) throw new Error(`Không có bài code ${slug}`);
            asgDocs.push({ ...base, type: 'CODING', title: ex.title, exerciseSlug: slug, _exId: String(ex._id), _tests: (ex.testCases || []).length });
          }
        }
      }
      console.log('  bài giao: ' + asgDocs.map((a) => `${a.type === 'QUIZ' ? 'TN' : 'Code'}@${a.startAt.toISOString().slice(5, 10)}`).join(', '));
      if (dryRun) continue;

      // upsert bài giao theo (classId, order); giữ _id cũ khi chạy lại
      const saved = [];
      for (const a of asgDocs) {
        const { _max, _exId, _tests, ...doc } = a;
        await assignments.updateOne({ classId, order: a.order }, { $set: { ...doc, updatedAt: now }, $setOnInsert: { createdAt: now } }, { upsert: true });
        const row = await assignments.findOne({ classId, order: a.order });
        saved.push({ ...a, id: String(row._id) });
      }
      await assignments.deleteMany({ classId, order: { $gt: asgDocs.length } });

      // ---- kết quả mẫu (xóa rồi tạo lại để chạy lại ra đúng kết quả) ----
      const asgIds = saved.map((a) => a.id);
      await subs.deleteMany({ assignmentId: { $in: asgIds }, userId: { $in: ids } });
      await attempts.deleteMany({ assignmentId: { $in: asgIds }, userId: { $in: ids.map((i) => new OID(i)) } });
      const QUIZ_PCT = [100, 90, 80, 70, 60, 40];
      let nSub = 0, nQuiz = 0;
      for (let i = 0; i < ids.length; i++) {
        for (let j = 0; j < saved.length; j++) {
          const a = saved[j];
          if (a.startAt > now) continue; // bài chưa mở
          const expired = a.dueAt < now;
          // Một số học sinh bỏ lỡ bài (đặc biệt học sinh xếp cuối), để thấy trạng thái "Đã hết hạn - Đã khóa".
          if ((i * 3 + j) % 7 === 0 && expired) continue;
          if (!expired && (i + j) % 3 === 0) continue; // bài đang mở: chưa phải ai cũng làm
          const at0 = new Date(a.startAt.getTime() + (30 + i * 17 + j * 5) * 60000);
          if (a.type === 'QUIZ') {
            const pct = QUIZ_PCT[i];
            await attempts.insertOne({
              userId: new OID(ids[i]), testId: new OID(DEMO_TEST_ID), assignmentId: a.id, seed: 'seed-class', shuffledQuestions: [],
              startedAt: at0, timeLimitSeconds: 1800, submittedAt: new Date(at0.getTime() + (12 + i) * 60000), status: 'GRADED',
              score: Math.round((a._max * pct) / 100), maxScore: a._max, reviewPolicy: 'AFTER_SUBMISSION', createdAt: at0, updatedAt: at0,
            });
            nQuiz++;
          } else {
            const wrong = (i + j) % 4; // số lần sai trước khi AC: 0..3
            const kinds = ['WA', 'TLE', 'RE'];
            for (let w = 0; w < wrong; w++) {
              await subs.insertOne({ exerciseId: a._exId, userId: ids[i], assignmentId: a.id, code: '# seed', status: kinds[(i + w) % 3], passedCount: 0, totalCount: a._tests, results: [], createdAt: new Date(at0.getTime() + w * 4 * 60000), updatedAt: at0 });
              nSub++;
            }
            await subs.insertOne({ exerciseId: a._exId, userId: ids[i], assignmentId: a.id, code: '# seed', status: 'AC', passedCount: a._tests, totalCount: a._tests, results: [], createdAt: new Date(at0.getTime() + (wrong * 4 + 3) * 60000), updatedAt: at0 });
            nSub++;
          }
        }
      }
      console.log(`  kết quả mẫu: ${nSub} bài nộp code, ${nQuiz} lượt trắc nghiệm`);
    }
    // ---- 3 khóa Người đi làm ----
    const adults = await users.find({ role: 'STUDENT', ageGroup: 'CAREER_ADULT' }, { projection: { email: 1 } }).toArray();
    for (const c of CAREER_CLASSES) {
      console.log(`- ${c.name} [${c.code}]: giảng viên ${TEACHERS[c.teacher].fullName}; ghi danh ${adults.length} học viên Người đi làm (${adults.map((a) => a.email).join(', ') || 'chưa có tài khoản nào'})`);
      if (dryRun) continue;
      const existing = await classes.findOne({ code: c.code });
      const tf = await teacherFields(existing, teacherIds[c.teacher]);
      await classes.updateOne(
        { code: c.code },
        { $set: { name: c.name, description: c.description, courseKey: c.courseKey, ...tf, updatedAt: now }, $setOnInsert: { code: c.code, createdAt: now, studentIds: [], exerciseSlugs: [], archived: false } },
        { upsert: true },
      );
    }
    if (reactivate && !dryRun) {
      const r = await classes.updateMany({ code: { $in: [...CLASSES, ...CAREER_CLASSES].map((c) => c.code) }, archived: true }, { $set: { archived: false, updatedAt: now } });
      console.log(`Đã kích hoạt lại ${r.modifiedCount} lớp mẫu từng ở Lưu trữ.`);
    }
    if (fixDangling) {
      const existing = new Set((await users.find({}, { projection: { _id: 1 } }).toArray()).map((u) => String(u._id)));
      let fixed = 0;
      for (const c of await classes.find({}).toArray()) {
        const keep = (c.studentIds || []).filter((id) => existing.has(String(id)));
        const tIds = (c.teacherIds || []).filter((id) => existing.has(String(id)));
        const set = {};
        if (keep.length !== (c.studentIds || []).length) set.studentIds = keep;
        if (c.teacherIds && tIds.length !== c.teacherIds.length && tIds.length > 0) { set.teacherIds = tIds; if (!existing.has(String(c.teacherId))) set.teacherId = tIds[0]; }
        if (Object.keys(set).length) {
          console.log(`  ${dryRun ? '(dry-run) ' : ''}${c.name}: gỡ ${(c.studentIds || []).length - keep.length} học viên và ${(c.teacherIds || []).length - tIds.length} giảng viên không còn tồn tại`);
          if (!dryRun) await classes.updateOne({ _id: c._id }, { $set: set });
          fixed++;
        }
      }
      console.log(`Toàn vẹn khóa ngoại: đã sửa ${fixed} lớp.`);
    }
    if (!adults.length) console.log('  (!) Chưa có tài khoản Người đi làm: chạy node scripts/seed-career-adult.js để tạo nguoidilam1/2@gmail.com.');
    console.log(dryRun ? 'Xong dry-run.' : 'Xong. Ghi danh học sinh thật: node scripts/seed-class.js --add-email=<email>');
  } finally {
    await mongoose.disconnect();
  }
})().catch((e) => { console.error(e.message || e); process.exit(1); });
