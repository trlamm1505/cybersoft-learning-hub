#!/usr/bin/env node
/**
 * Audit Day 31: Code Playground (Khối 6-9 và 10-12): lộ trình chuẩn cố định, mở khóa tuần tự, bankOnly, đồng bộ Tiến độ học tập.
 * Chạy qua HTTP THẬT vào backend đang bật + CSDL + mã nguồn. Token ký cục bộ bằng JWT_SECRET trong BE/.env (không cần mật khẩu, không in token).
 * Học viên tạm (6-9, 10-12) và dữ liệu tạm được tạo rồi xóa khi xong; tài khoản chuẩn (lop6-9, lop10-12) chỉ được ĐỌC.
 *
 *   node scripts/audit-day31.js [--base=http://localhost:3000/api]
 *
 * Cần: backend đang chạy và đã `npm run seed`.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const h = require('./lib/setup-helpers');
const { TRACKS } = require('./lib/playground-sequence');

const ROOT = path.join(__dirname, '..');
const BE = path.join(ROOT, 'BE');
const envText = fs.readFileSync(path.join(BE, '.env'), 'utf8');
const env = (k) => process.env[k] || h.readEnvValue(envText, k);
const uri = env('DATABASE_URL');
const secret = env('JWT_SECRET');
const baseArg = process.argv.find((a) => a.startsWith('--base='));
const BASE = baseArg ? baseArg.slice(7) : `http://localhost:${env('PORT') || 3000}/api`;

const results = [];
const check = (id, name, ok, detail = '') => {
  results.push({ id, name, ok: !!ok, detail });
  console.log(`${ok ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m'}  ${id}  ${name}${detail ? `  — ${detail}` : ''}`);
};
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
/** Mã nguồn đã bỏ chú thích (kiểm tra mã thật, không bị chú thích giải thích đánh lừa). */
const code = (rel) => read(rel).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SQLISH = /sql|demo-dash|^da-|^ai-|^career-|tester/i;
const BAND_KEY = { '6-9': '6-9', '10-12': '10-12' };

(async () => {
  if (!secret) throw new Error('Thiếu JWT_SECRET trong BE/.env');
  const mongoose = require(path.join(BE, 'node_modules', 'mongoose'));
  const jwt = require(path.join(BE, 'node_modules', 'jsonwebtoken'));
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  const db = mongoose.connection.db;
  const users = db.collection('users');
  const exercises = db.collection('exercises');
  const submissions = db.collection('submissions');
  const questions = db.collection('questions');
  const OID = mongoose.Types.ObjectId;

  const sign = (u) => jwt.sign({ sub: String(u._id), email: u.email, role: u.role }, secret, { expiresIn: '10m', jwtid: crypto.randomUUID() });
  const must = async (email) => {
    const u = await users.findOne({ email });
    if (!u) throw new Error(`Thiếu tài khoản ${email}: chạy \`npm run seed\` trước.`);
    return u;
  };
  const call = async (token, method, url, body) => {
    const hd = token ? { Authorization: `Bearer ${token}` } : {};
    if (body !== undefined) hd['Content-Type'] = 'application/json';
    const res = await fetch(BASE + url, { method, headers: hd, body: body === undefined ? undefined : JSON.stringify(body) });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* không phải JSON */ }
    return { status: res.status, json, text };
  };
  const waitJudged = async (id) => {
    for (let i = 0; i < 60; i++) {
      const s = await submissions.findOne({ _id: new OID(id) });
      if (s && !['QUEUED', 'RUNNING', 'JUDGING', 'PENDING'].includes(String(s.status))) return s;
      await sleep(500);
    }
    return submissions.findOne({ _id: new OID(id) });
  };
  /** Lộ trình chuẩn theo CSDL (nguồn đối chiếu độc lập với API). */
  const dbTrack = async (band) => {
    const t = TRACKS[band];
    return exercises
      .find({ type: 'CODE_TEXT', topic: t.topic, orderInTopic: { $gte: 1 }, gradeBand: { $in: t.grades }, bankOnly: { $ne: true }, resource_id: { $exists: false }, tags: { $nin: ['sql', 'da-lab', 'ai-lab', 'tester-lab'] } })
      .sort({ orderInTopic: 1, slug: 1 })
      .toArray();
  };
  const statusLine = (pg) => pg.exercises.map((e) => e.status[0]).join('');

  const stamp = crypto.randomBytes(4).toString('hex');
  const created = { users: [], exercises: [], lessons: [], submissions: [] };
  try {
    const lop69 = await must('lop6-9@gmail.com');
    const lop1012 = await must('lop10-12@gmail.com');
    const teacher69 = await must('teacher6-9@gmail.com');
    const admin = await must('admin@gmail.com');
    const T = { s69: sign(lop69), s1012: sign(lop1012), t69: sign(teacher69), admin: sign(admin) };
    const track69 = await dbTrack('6-9');
    const track1012 = await dbTrack('10-12');
    const mkStudent = async (ageGroup, tag) => {
      const id = (await users.insertOne({ email: `audit31-${tag}-${stamp}@demo.cybersoft.local`, fullName: `Audit31 ${tag}`, role: 'STUDENT', ageGroup, status: 'ACTIVE', password: 'x', createdAt: new Date(), updatedAt: new Date() })).insertedId;
      created.users.push(id);
      return users.findOne({ _id: id });
    };
    const tmp69 = await mkStudent('6-9', 'a');
    const tmp1012 = await mkStudent('10-12', 'b');
    const TT = { a: sign(tmp69), b: sign(tmp1012) };

    // ============================ A. Danh sách Playground: chỉ lộ trình chuẩn, không SQL ============================
    for (const [id, who, track, label] of [['A-01', 's69', track69, '6-9'], ['A-02', 's1012', track1012, '10-12']]) {
      const list = await call(T[who], 'GET', '/exercises');
      const pg = await call(T[who], 'GET', '/exercises/playground');
      const slugs = (list.json ?? []).map((e) => e.slug);
      const bad = slugs.filter((s) => SQLISH.test(s));
      const sameSet = slugs.length === track.length && track.every((t) => slugs.includes(t.slug));
      const orders = (pg.json?.exercises ?? []).map((e) => e.order);
      check(id, `Khối ${label}: GET /exercises và /exercises/playground CHỈ là lộ trình chuẩn ${track.length} bài #1..#N (không SQL, demo, bài cũ, Ngân hàng đề)`,
        list.status === 200 && pg.status === 200 && sameSet && bad.length === 0 && orders.join() === track.map((_, i) => i + 1).join() && pg.json?.total === track.length && (pg.json.exercises ?? []).every((e) => e.topic === TRACKS[label].topic),
        `${slugs.length} bài, topic ${[...new Set((list.json ?? []).map((e) => e.topic))].join('|')}, lẫn SQL/demo: ${bad.length}`);
    }
    {
      const rows = [];
      for (const [who, track] of [['s69', track69], ['s1012', track1012]]) {
        const les = await call(T[who], 'GET', '/authoring/lessons');
        const slugs = new Set(track.map((t) => t.slug));
        const arr = les.json ?? [];
        rows.push(les.status === 200 && arr.every((l) => (l.type !== 'coding' || slugs.has(l.slug)) && !SQLISH.test(l.slug) && l.authorId === undefined));
      }
      check('A-03', 'GET /authoring/lessons cho học viên 6-9 / 10-12: bài coding chỉ thuộc lộ trình của khối, không SQL/Lab, không lộ authorId', rows.every(Boolean), rows.join('/'));
    }
    const page = code('FE/src/pages/CodePlaygroundPage.tsx');
    const grid = code('FE/src/components/PlaygroundList.tsx');
    check('A-04', '/playground không còn dropdown chủ đề ("Tất cả chủ đề"), không ghép bài từ authoring/lessons, không lưu tiến độ ở localStorage',
      !/Tất cả chủ đề|availableTopics|selectedTopic|<select/.test(page) && !/teacherLessons|teacherCodingLessons|LessonAuthoring/.test(page) && !/localStorage|completedSlugs|app_code_playground/.test(page));
    check('A-05', 'Thẻ bài: bài #1 không bao giờ có icon khóa (không dùng Lock/Unlock cho bài mở); bài khóa disabled + aria-disabled',
      !/\bUnlock\b/.test(grid + page) && /aria-disabled/.test(grid) && /canOpen\(item\)/.test(grid));
    const sqlSeeds = ['BE/src/data/initial-exercises.ts', 'BE/src/data/initial-exercises-day14.ts', 'BE/src/data/initial-exercises-day15.ts'].filter((f) => /topic:\s*['"]sql['"]|tags:\s*\[[^\]]*['"]sql['"]/.test(read(f)));
    check('A-06', 'File seed bài tập 6-9 / 10-12 (initial-exercises*.ts) không chứa bài SQL', sqlSeeds.length === 0, sqlSeeds.join(', ') || 'sạch');

    // ============================ B. Giảng viên / Admin KHÔNG thêm bài vào Playground (bankOnly) ============================
    const before69 = (await call(T.s69, 'GET', '/exercises/playground')).json;
    const statsBefore = (await call(T.s69, 'GET', '/learner/stats')).json;
    const slugT = `audit31-teacher-${stamp}`;
    const slugA = `audit31-admin-${stamp}`;
    const byTeacher = await call(T.t69, 'POST', '/exercises', { title: `Audit31 GV ${stamp}`, slug: slugT, description: 'x', type: 'CODE_TEXT', targetGroup: 'K6_9', labType: 'PYTHON_CODE', testCases: [{ input: '1', expectedOutput: '1', isHidden: false }] });
    // Admin cố tình ghi đè cờ: bankOnly=false, topic/orderInTopic của lộ trình, authorId giả.
    const byAdmin = await call(T.admin, 'POST', '/exercises', { title: `Audit31 AD ${stamp}`, slug: slugA, description: 'x', type: 'CODE_TEXT', targetGroup: 'K6_9', labType: 'PYTHON_CODE', bankOnly: false, topic: 'python-fundamentals', orderInTopic: 1, authorId: 'khong-phai-cua-toi' });
    const docT = await exercises.findOne({ slug: slugT });
    const docA = await exercises.findOne({ slug: slugA });
    for (const d of [docT, docA]) if (d) created.exercises.push(d._id);
    const lessonSlug = `audit31-lesson-${stamp}`;
    const byLesson = await call(T.t69, 'POST', '/authoring/lessons/create', { title: `Audit31 lesson ${stamp}`, slug: lessonSlug, type: 'coding', status: 'published', description: 'In 1', learningOutcome: 'print', solutionCode: 'print(1)\n', testCases: [{ input: '', expectedOutput: '1', isHidden: false }] });
    const lessonDoc = await db.collection('lessons').findOne({ slug: lessonSlug });
    if (lessonDoc) created.lessons.push(lessonDoc._id);
    const synced = await exercises.findOne({ sourceLessonSlug: lessonSlug });
    if (synced) created.exercises.push(synced._id);
    const after69 = (await call(T.s69, 'GET', '/exercises/playground')).json;
    const statsAfter = (await call(T.s69, 'GET', '/learner/stats')).json;
    const listAfter = (await call(T.s69, 'GET', '/exercises')).json ?? [];
    const mine = [slugT, slugA, lessonSlug, synced?.slug].filter(Boolean);
    check('B-01', 'Giảng viên tạo bài (POST /exercises) và xuất bản bài coding qua authoring → luôn bankOnly:true, đúng khối',
      byTeacher.status < 300 && docT?.bankOnly === true && docT?.bankBand === '6-9' && byLesson.status < 300 && synced?.bankOnly === true, `exercise ${byTeacher.status}/${docT?.bankOnly}, lesson ${byLesson.status}/${synced?.bankOnly}`);
    check('B-02', 'Admin cố ghi đè bankOnly:false / topic / orderInTopic / authorId → vẫn bankOnly:true, không thuộc lộ trình, authorId là của Admin',
      byAdmin.status < 300 && docA?.bankOnly === true && !(docA?.orderInTopic >= 1) && docA?.authorId === String(admin._id), `HTTP ${byAdmin.status}, bankOnly=${docA?.bankOnly}, orderInTopic=${docA?.orderInTopic}`);
    check('B-03', 'Bài mới của Giảng viên/Admin KHÔNG xuất hiện ở /playground, /exercises của học viên và KHÔNG đổi mẫu số tiến độ',
      after69.total === before69.total && !(after69.exercises ?? []).some((e) => mine.includes(e.slug)) && !listAfter.some((e) => mine.includes(e.slug)) && statsAfter.totalExercises === statsBefore.totalExercises,
      `playground ${before69.total}→${after69.total}, stats ${statsBefore.totalExercises}→${statsAfter.totalExercises}`);
    const tpg = await call(T.t69, 'GET', '/exercises/playground?band=6-9');
    const badBand = await call(T.t69, 'GET', '/exercises/playground?band=3-5');
    check('B-04', 'Giảng viên xem lộ trình khối (band=6-9) không có bài mình vừa tạo và không bị khóa; band lạ → 400 E400_INVALID_BAND',
      tpg.status === 200 && tpg.json.total === track69.length && !(tpg.json.exercises ?? []).some((e) => mine.includes(e.slug)) && tpg.json.exercises.every((e) => e.status === 'available') && badBand.status === 400 && badBand.json?.code === 'E400_INVALID_BAND', `total ${tpg.json?.total}`);
    check('B-05', 'Chốt chặn ở schema: bài có authorId luôn bị ép bankOnly:true (dù mã tạo bài quên cờ)', /pre\('validate'/.test(read('BE/src/modules-system/database/schemas/exercise.schema.ts')) && /authorId && this\.bankOnly !== true/.test(read('BE/src/modules-system/database/schemas/exercise.schema.ts')));

    {
      const lists = await Promise.all([
        call(T.t69, 'GET', '/teacher/class-assignments/catalog/exercises?pageSize=100'),
        call(T.t69, 'GET', '/teacher/question-bank?pageSize=100'),
        call(T.t69, 'GET', '/teacher/classes/catalog/exercises'),
        call(T.t69, 'GET', '/exercises'),
      ]);
      const leaked = lists.map((r) => JSON.stringify(r.json ?? '').includes('demo-dash-')).filter(Boolean).length;
      const demoInDb = (await exercises.countDocuments({ slug: /^demo-dash-/ })) > 0;
      check('B-06', 'Bài mẫu demo-dash-* (Bài ngoài lớp...) ẩn khỏi mọi danh sách chọn bài của giảng viên (giao bài, Ngân hàng đề, danh mục lớp, /exercises) nhưng vẫn còn trong CSDL cho script audit', lists.every((r) => r.status === 200) && leaked === 0 && demoInDb, `${leaked}/4 danh sách còn lộ; demo trong DB: ${demoInDb}`);
    }

    // ============================ C. Mở khóa tuần tự: luồng thật nộp bài → mở khóa → tiến độ ============================
    const pgA = async () => (await call(TT.a, 'GET', '/exercises/playground')).json;
    const statsA = async () => (await call(TT.a, 'GET', '/learner/stats')).json;
    const submitReal = async (token, ex, code) => {
      const r = await call(token, 'POST', `/exercises/${ex.slug}/submit`, { code });
      if (r.json?.submissionId) created.submissions.push(new OID(r.json.submissionId));
      if (r.status >= 300) return { r, status: null };
      const s = await waitJudged(r.json.submissionId);
      return { r, status: s?.status };
    };
    const solution = (ex) => ex.solutionCode;

    let pg = await pgA();
    check('C-01', 'Học viên mới (6-9): 0/20, bài #1 "available" (không khóa), #2..#20 "locked"; Tiến độ học tập cũng 0/20',
      pg.completed === 0 && pg.total === track69.length && pg.exercises[0].status === 'available' && pg.exercises.slice(1).every((e) => e.status === 'locked') && (await statsA()).solvedExercises === 0 && (await statsA()).totalExercises === track69.length, statusLine(pg));

    const jump = await submitReal(TT.a, track69[4], solution(track69[4]));
    const subsOfTmp = await submissions.countDocuments({ userId: String(tmp69._id) });
    check('C-02', 'Nộp nhảy cóc bài #5 khi chưa xong #1..#4 → 403 E403_EXERCISE_LOCKED, KHÔNG tạo bài nộp', jump.r.status === 403 && jump.r.json?.code === 'E403_EXERCISE_LOCKED' && subsOfTmp === 0, `HTTP ${jump.r.status}, bài nộp ${subsOfTmp}`);

    const first = await submitReal(TT.a, track69[0], solution(track69[0]));
    pg = await pgA();
    let st = await statsA();
    check('C-03', 'Nộp đúng #1 → AC; tiến độ 1/20 ngay: #1 completed (không khóa), #2 mở, #3 trở đi khóa; Tiến độ học tập 1/20 khớp',
      first.status === 'AC' && pg.completed === 1 && statusLine(pg).startsWith('ca') && pg.exercises.slice(2).every((e) => e.status === 'locked') && pg.nextSlug === track69[1].slug && st.solvedExercises === 1 && st.totalExercises === pg.total, `${statusLine(pg)} | stats ${st.solvedExercises}/${st.totalExercises}`);

    const jump3 = await submitReal(TT.a, track69[2], solution(track69[2]));
    const wrong2 = await submitReal(TT.a, track69[1], 'print("sai")\n');
    pg = await pgA();
    check('C-04', 'Chưa xong #2: nộp #3 → 403; nộp #2 sai (WA) → tiến độ không đổi, #2 vẫn là bài đang mở', jump3.r.status === 403 && wrong2.status && wrong2.status !== 'AC' && pg.completed === 1 && pg.exercises[1].status === 'available', `#3 ${jump3.r.status}, #2 sai → ${wrong2.status}, ${statusLine(pg)}`);

    const second = await submitReal(TT.a, track69[1], solution(track69[1]));
    pg = await pgA();
    st = await statsA();
    check('C-05', 'Nộp đúng #2 → 2/20, #3 vừa mở khóa (đang mở), #4 trở đi khóa; Tiến độ học tập 2/20 khớp',
      second.status === 'AC' && pg.completed === 2 && statusLine(pg).startsWith('cca') && pg.exercises.slice(3).every((e) => e.status === 'locked') && st.solvedExercises === 2, `${statusLine(pg)} | stats ${st.solvedExercises}/${st.totalExercises}`);

    const recs = (await call(TT.a, 'GET', '/learner/recommendations')).json?.recommendations ?? [];
    check('C-06', 'Gợi ý bài chỉ trỏ tới bài đang mở khóa (#3), không gợi ý bài khóa / ngoài lộ trình', recs.every((r) => r.exercise.slug === track69[2].slug), recs.map((r) => r.exercise.slug).join(',') || '(không gợi ý)');

    const redo = await submitReal(TT.a, track69[0], solution(track69[0]));
    check('C-07', 'Bài đã hoàn thành (#1) luôn làm lại được và không đổi tiến độ', redo.status === 'AC' && (await pgA()).completed === 2, `status ${redo.status}`);

    // AC của bài giao lớp (assignmentId) và AC nhảy cóc cũ (outOfSequence) KHÔNG tính vào tiến độ Playground.
    const fakeAc = (ex, extra) => ({ exerciseId: String(ex._id), userId: String(tmp69._id), code: '# audit', status: 'AC', passedCount: 1, totalCount: 1, results: [], createdAt: new Date(), updatedAt: new Date(), ...extra });
    const insertedFakes = (await submissions.insertMany([fakeAc(track69[6], { assignmentId: 'asg-audit31' }), fakeAc(track69[7], { outOfSequence: true })])).insertedIds;
    for (const id of Object.values(insertedFakes)) created.submissions.push(id);
    pg = await pgA();
    st = await statsA();
    check('C-08', 'AC của bài giao lớp (assignmentId) hoặc AC nhảy cóc cũ (outOfSequence) không làm đổi tiến độ Playground (vẫn 2/20) và Tiến độ học tập khớp',
      pg.completed === 2 && pg.exercises[6].status === 'locked' && pg.exercises[7].status === 'locked' && st.solvedExercises === 2, `${statusLine(pg)} | stats ${st.solvedExercises}/${st.totalExercises}`);

    // Khối 10-12 tương tự.
    const t1 = await submitReal(TT.b, track1012[2], solution(track1012[2]));
    const t2 = await submitReal(TT.b, track1012[0], solution(track1012[0]));
    const pgB = (await call(TT.b, 'GET', '/exercises/playground')).json;
    const stB = (await call(TT.b, 'GET', '/learner/stats')).json;
    check('C-09', 'Khối 10-12: nhảy cóc #3 → 403; xong #1 → 1/15, #2 mở; Tiến độ học tập 1/15 khớp',
      t1.r.status === 403 && t2.status === 'AC' && pgB.total === track1012.length && pgB.completed === 1 && statusLine(pgB).startsWith('ca') && stB.solvedExercises === 1 && stB.totalExercises === pgB.total, `${statusLine(pgB)} | stats ${stB.solvedExercises}/${stB.totalExercises}`);

    // ============================ D. Seed chuẩn: lop6-9 / lop10-12 và dữ liệu không nhảy cóc ============================
    for (const [id, who, track, k, label] of [['D-01', 's69', track69, 2, '6-9'], ['D-02', 's1012', track1012, 1, '10-12']]) {
      const p = (await call(T[who], 'GET', '/exercises/playground')).json;
      const s = (await call(T[who], 'GET', '/learner/stats')).json;
      const expectLine = 'c'.repeat(k) + 'a' + 'l'.repeat(track.length - k - 1);
      check(id, `lop${label}@gmail.com sau seed: hoàn thành #1..#${k} liên tục, bài #${k + 1} mở khóa, còn lại khóa (${k}/${track.length}); Tiến độ học tập khớp`, statusLine(p) === expectLine && p.completed === k && p.total === track.length && s.solvedExercises === k && s.totalExercises === track.length, `${statusLine(p)} | stats ${s.solvedExercises}/${s.totalExercises}`);
    }
    {
      const bad = [];
      let checked = 0;
      for (const [band, track] of [['6-9', track69], ['10-12', track1012]]) {
        const ids = track.map((t) => String(t._id));
        for (const s of await users.find({ role: 'STUDENT', ageGroup: band, _id: { $nin: created.users } }, { projection: { email: 1 } }).toArray()) {
          const rows = await submissions.find({ userId: String(s._id), status: 'AC', assignmentId: { $exists: false }, outOfSequence: { $ne: true }, exerciseId: { $in: ids } }, { projection: { exerciseId: 1 } }).toArray();
          if (!rows.length) continue;
          checked += 1;
          const done = new Set(rows.map((r) => String(r.exerciseId)));
          const pattern = ids.map((i) => (done.has(i) ? 'c' : '.')).join('');
          const gap = pattern.indexOf('.');
          if (gap >= 0 && pattern.slice(gap).includes('c')) bad.push(`${s.email}:${pattern}`);
        }
      }
      check('D-03', 'Không học viên nào (kể cả tài khoản test cũ như a@gmail.com) có tiến độ Playground nhảy cóc sau khi chuẩn hóa', bad.length === 0 && checked >= 2, `${checked} học viên có tiến độ, nhảy cóc: ${bad.join('; ') || 'không'}`);
    }
    {
      const probs = [];
      for (const [band, track] of [['6-9', track69], ['10-12', track1012]]) {
        const orders = track.map((t) => t.orderInTopic);
        if (orders.join() !== track.map((_, i) => i + 1).join()) probs.push(`${band}: thứ tự ${orders.join(',')}`);
        for (const t of track) {
          if (!(t.testCases || []).some((c) => !c.isHidden)) probs.push(`${t.slug}: thiếu test hiện`);
          if (!(t.solutionCode || '').trim()) probs.push(`${t.slug}: thiếu lời giải`);
        }
      }
      check('D-04', 'Lộ trình 6-9 (20 bài) và 10-12 (15 bài): thứ tự #1..#N liên tục không trùng, mọi bài có test case hiện + lời giải', probs.length === 0 && track69.length === 20 && track1012.length === 15, probs.slice(0, 3).join('; ') || `${track69.length} + ${track1012.length} bài`);
    }
    const profile = read('FE/src/pages/ProfilePage.tsx');
    const progressPage = read('FE/src/pages/LearnerProgressPage.tsx');
    check('D-05', 'Header /playground, Tiến độ học tập và Hồ sơ cùng một nguồn: server (/exercises/playground và /learner/stats, cùng bộ lọc lộ trình + PRACTICE_AC_FILTER)',
      /listPlayground/.test(page) && /PlaygroundProgress/.test(page) && /getStats/.test(profile) && /Bài đã giải/.test(profile) && /solvedExercises\}\/\$\{stats\.totalExercises/.test(progressPage) && /PRACTICE_AC_FILTER/.test(read('BE/src/modules-api/exercise/playground-catalog.ts')) && /getPlaygroundSolvedIds/.test(read('BE/src/modules-api/recommendation/recommendation.service.ts')));

    // ============================ E. Rà soát luồng lop6-9 / lop10-12: lớp học, bài giao, trắc nghiệm, cuộc thi ============================
    for (const [id, who, label] of [['E-01', 's69', '6-9'], ['E-02', 's1012', '10-12']]) {
      const enr = await call(T[who], 'GET', '/student/enrollments');
      const cls = (enr.json ?? [])[0];
      const ov = cls ? await call(T[who], 'GET', `/student/classes/${cls.classId}/overview`) : { status: 0 };
      const days = ov.json?.days ?? [];
      const coding = days.flatMap((d) => d.assignments ?? []).filter((a) => a.type === 'CODING');
      const opened = [];
      for (const a of coding) opened.push((await call(T[who], 'GET', `/exercises/${a.exerciseSlug}`)).status);
      check(id, `Khối ${label}: Lớp học của tôi → overview có ${days.length} ngày; mọi bài code được giao mở được chi tiết từ liên kết (kể cả bài ngoài lộ trình Playground)`,
        enr.status === 200 && ov.status === 200 && days.length >= 5 && coding.length >= 4 && opened.every((s) => s === 200), `${coding.length} bài code, HTTP ${opened.join('/')}`);
    }
    {
      const bankIds = new Set((await db.collection('questions').find({ bankOnly: true }, { projection: { _id: 1 } }).toArray()).map((q) => String(q._id)));
      const rows = [];
      for (const who of ['s69', 's1012']) {
        const q = await call(T[who], 'POST', '/quiz/start', { testId: '673f22222222222222222222', category: 'Python' });
        if (q.json?.attemptId) await db.collection('quizattempts').deleteOne({ _id: new OID(q.json.attemptId) });
        rows.push(q.status < 300 && (q.json?.questions ?? []).length > 0 && (q.json.questions ?? []).every((x) => !bankIds.has(String(x.questionId))));
      }
      check('E-03', 'Thi trắc nghiệm của lop6-9 / lop10-12: bắt đầu được, không có câu Ngân hàng đề (bankOnly)', rows.every(Boolean), rows.join('/'));
    }
    {
      const contests = await call(T.s69, 'GET', '/contests');
      const other = (contests.json ?? []).find((c) => c.gradeBand === '10-12');
      const cross = other ? await call(T.s69, 'POST', `/contests/${other._id}/register`, {}) : { status: 0 };
      {
      // 3 bộ đề công khai: đủ 20 câu cho CẢ Khối 6-9 và 10-12, khớp "20 câu hỏi" ghi ngoài thẻ ở FE; không lẫn câu bankOnly.
      const cardCounts = [...read('FE/src/pages/QuizTakingPage.tsx').matchAll(/questionCount:\s*(\d+)/g)].map((m) => Number(m[1]));
      const pub = await Promise.all(['Python', 'HTML5', 'CSS3'].map((c) => questions.countDocuments({ category: c, bankOnly: { $ne: true } })));
      const bankIds = new Set((await questions.find({ bankOnly: true }, { projection: { _id: 1 } }).toArray()).map((q) => String(q._id)));
      const got = [];
      for (const who of ['s69', 's1012']) {
        for (const cat of ['Python', 'HTML5', 'CSS3']) {
          const r = await call(T[who], 'POST', '/quiz/start', { testId: '673f22222222222222222222', category: cat });
          if (r.json?.attemptId) await db.collection('quizattempts').deleteOne({ _id: new OID(r.json.attemptId) });
          const qs = r.json?.questions ?? [];
          got.push(`${who === 's69' ? '6-9' : '10-12'}/${cat}=${qs.length}${qs.some((x) => bankIds.has(String(x.questionId))) ? '(lẫn bankOnly)' : ''}`);
        }
      }
      check('E-06', 'Bộ đề /quiz Python, HTML5, CSS3: lop6-9 và lop10-12 đều nhận đúng 20 câu, khớp số ghi ngoài thẻ (FE) và số câu công khai trong DB; không lẫn câu bankOnly',
        cardCounts.length === 3 && cardCounts.every((n) => n === 20) && pub.every((n) => n === 20) && got.every((g) => /=20$/.test(g)), `thẻ ${cardCounts.join('/')}; DB ${pub.join('/')}; ${got.join(' ')}`);
    }
    check('E-04', 'Cuộc thi: danh sách hiển thị theo nhãn khối nhưng lop6-9 đăng ký cuộc thi Khối 10-12 bị từ chối (403)', contests.status === 200 && (contests.json ?? []).length > 0 && cross.status === 403, `${(contests.json ?? []).length} cuộc thi, đăng ký chéo khối HTTP ${cross.status}`);
    }
    check('E-05', 'Học sinh Lớp 3-5: /exercises/playground rỗng và nộp bài bị chặn (403 E403_KID_NO_CODE_QUIZ)', await (async () => {
      const kid = await must('lop3-5@gmail.com');
      const tk = sign(kid);
      const pgk = await call(tk, 'GET', '/exercises/playground');
      const sub = await call(tk, 'POST', `/exercises/${track69[0].slug}/submit`, { code: 'print(1)' });
      return pgk.status === 200 && pgk.json?.total === 0 && sub.status === 403 && sub.json?.code === 'E403_KID_NO_CODE_QUIZ';
    })());

    // ============================ F. Tài khoản test cũ + hồi quy ============================
    const legacy = await users.findOne({ email: 'a@gmail.com' });
    if (legacy) {
      const pgL = (await call(sign(legacy), 'GET', '/exercises/playground')).json;
      const stL = (await call(sign(legacy), 'GET', '/learner/stats')).json;
      check('F-01', 'a@gmail.com (từng nhảy cóc #3, #10 do lỗi cũ): sau chuẩn hóa tiến độ liên tục, X/N Playground = Tiến độ học tập, không còn "#3 hoàn thành mà #1 chưa làm"',
        !/[al]c/.test(statusLine(pgL)) && pgL.completed === stL.solvedExercises && pgL.total === stL.totalExercises, `${statusLine(pgL)} | stats ${stL.solvedExercises}/${stL.totalExercises}`);
    } else check('F-01', 'a@gmail.com không tồn tại trên máy này (bỏ qua)', true, 'bỏ qua');
    check('F-02', 'Bài SQL không thể lọt vào Playground: bộ lọc BE dựa trên lộ trình chuẩn, không dựa vào topic do client chọn', /PLAYGROUND_TRACK_TOPIC/.test(read('BE/src/modules-api/exercise/playground-catalog.ts')) && !/req\.query|@Query\('topic'/.test(read('BE/src/modules-api/exercise/exercise.controller.ts')));
    void BAND_KEY;
  } finally {
    const userIds = created.users.map(String);
    await submissions.deleteMany({ $or: [{ _id: { $in: created.submissions } }, { userId: { $in: userIds } }] });
    if (created.exercises.length) await exercises.deleteMany({ _id: { $in: created.exercises } });
    if (created.lessons.length) await db.collection('lessons').deleteMany({ _id: { $in: created.lessons } });
    if (created.users.length) await users.deleteMany({ _id: { $in: created.users } });
    await db.collection('coach_messages').deleteMany({ userId: { $in: userIds } }).catch(() => undefined);
    await mongoose.disconnect();
  }
  const passed = results.filter((r) => r.ok).length;
  console.log(`\n${passed}/${results.length} PASS`);
  process.exitCode = passed === results.length ? 0 : 1;
})().catch((e) => {
  console.error(`Audit lỗi: ${e.stack || e.message}`);
  process.exitCode = 1;
});
