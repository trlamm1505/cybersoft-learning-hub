#!/usr/bin/env node
/**
 * Cross-Role Consistency Check: đối soát dữ liệu xuyên vai trò qua HTTP THẬT vào backend đang bật. Mọi con số Giảng viên/Admin thấy
 * phải trùng tuyệt đối với nguồn Học viên đang đọc (một nguồn sự thật). Token ký cục bộ bằng JWT_SECRET trong BE/.env.
 *
 *   node scripts/audit-cross-role-consistency.js [--base=http://localhost:3000/api]
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const h = require('./lib/setup-helpers');

const BE = path.join(__dirname, '..', 'BE');
const envText = fs.readFileSync(path.join(BE, '.env'), 'utf8');
const uri = process.env.DATABASE_URL || h.readEnvValue(envText, 'DATABASE_URL');
const secret = h.readEnvValue(envText, 'JWT_SECRET');
const baseArg = process.argv.find((a) => a.startsWith('--base='));
const BASE = baseArg ? baseArg.slice(7) : `http://localhost:${h.readEnvValue(envText, 'PORT') || 3000}/api`;

const results = [];
const check = (name, cond, detail = '') => {
  results.push({ name, ok: !!cond, detail });
  console.log(`${cond ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m'}  ${name}${detail ? `  — ${detail}` : ''}`);
};
const sameSet = (a, b) => a.length === b.length && [...a].sort().join('|') === [...b].sort().join('|');

(async () => {
  const mongoose = require(path.join(BE, 'node_modules', 'mongoose'));
  const jwt = require(path.join(BE, 'node_modules', 'jsonwebtoken'));
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  const db = mongoose.connection.db;
  const users = db.collection('users');
  const sign = (u) => jwt.sign({ sub: String(u._id), email: u.email, role: u.role }, secret, { expiresIn: '15m', jwtid: crypto.randomUUID() });
  const call = async (token, url, timeoutMs = 60000) => {
    const t0 = Date.now();
    const r = await fetch(BASE + url, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(timeoutMs) });
    return { status: r.status, json: await r.json().catch(() => null), ms: Date.now() - t0 };
  };

  const admin = await users.findOne({ role: 'ADMIN', status: { $ne: 'LOCKED' } });
  const adminTok = sign(admin);
  const classes = await db.collection('classrooms').find({}).toArray();
  const teachers = await users.find({ role: 'TEACHER', status: { $ne: 'LOCKED' } }).toArray();

  // 1. Admin gán lớp cho ai -> Giảng viên đăng nhập thấy đúng các lớp đó (kể cả lớp đã lưu trữ) ---------------------------------
  // Nguồn của trang /admin/classes (Admin Portal): lớp kèm danh sách giảng viên phụ trách.
  const adminList = await call(adminTok, '/admin/portal/classes');
  check('Admin: tải được danh sách lớp', adminList.status === 200 && Array.isArray(adminList.json), `HTTP ${adminList.status}`);
  let allTeachersOk = true;
  const lines = [];
  for (const t of teachers) {
    const id = String(t._id);
    const assigned = classes.filter((c) => c.teacherId === id || (c.teacherIds || []).includes(id)).map((c) => String(c._id));
    const api = await call(sign(t), '/teacher/classes?includeArchived=true');
    const seen = (api.json?.data ?? []).map((c) => c.id);
    const adminIds = (adminList.json ?? []).filter((c) => (c.teachers || []).some((x) => x.id === id)).map((c) => c.id);
    const adminSees = adminIds.length;
    const ok = api.status === 200 && api.json?.success === true && sameSet(assigned, seen) && sameSet(assigned, adminIds);
    if (!ok) allTeachersOk = false;
    lines.push(`${t.email}: DB ${assigned.length} / API ${seen.length}${adminSees ? ` / Admin ${adminSees}` : ''}`);
  }
  check('Mỗi giảng viên thấy ĐÚNG các lớp được gán (DB = Admin Portal = API giảng viên, không thừa không thiếu)', allTeachersOk, lines.join(' | '));

  const main = teachers.find((t) => t.email === 'teacher@gmail.com');
  const mainApi = await call(sign(main), '/teacher/classes?includeArchived=true');
  const mainAssigned = classes.filter((c) => c.teacherId === String(main._id) || (c.teacherIds || []).includes(String(main._id)));
  const mainAdmin = (adminList.json ?? []).filter((c) => (c.teachers || []).some((x) => x.id === String(main._id))).length;
  check('teacher@gmail.com: số lớp ở Sidebar giảng viên = số lớp Admin gán', mainApi.json.data.length === mainAdmin && mainAdmin === mainAssigned.length && mainAssigned.length >= 5, `giảng viên ${mainApi.json.data.length} / Admin ${mainAdmin} / DB ${mainAssigned.length}`);
  const archived = mainApi.json.data.filter((c) => c.status === 'ARCHIVED');
  check('Lớp đã lưu trữ vẫn hiện cho giảng viên (status ARCHIVED để gắn badge xám)', archived.length === mainAssigned.filter((c) => c.archived).length && archived.length >= 1, archived.map((c) => c.name).join(', '));
  const other = teachers.find((t) => t.email !== 'teacher@gmail.com' && !classes.some((c) => (c.teacherId === String(t._id) || (c.teacherIds || []).includes(String(t._id))) && classes.every(() => true) && false));
  const mainIds = new Set(mainAssigned.map((c) => String(c._id)));
  const strangers = classes.filter((c) => !mainIds.has(String(c._id)));
  if (strangers.length) {
    const r = await call(sign(main), `/teacher/classes/${strangers[0]._id}`);
    check('Không lọt lớp của giảng viên khác (mở lớp chưa được gán -> 403)', r.status === 403, `HTTP ${r.status}`);
  }
  void other;

  // 2. Học sinh có bao nhiêu sao ở hồ sơ -> Giảng viên thấy đúng từng đó ------------------------------------------------------
  const kidClass = classes.find((c) => c.ageGroup === '3-5' && !c.archived);
  const kidApi = await call(sign(main), `/teacher/classes/${kidClass._id}/kid-progress`);
  check('Giảng viên tải được tiến độ ải lớp K3-5', kidApi.status === 200 && Array.isArray(kidApi.json), `HTTP ${kidApi.status}`);
  const lessons = await db.collection('lessons').find({ type: 'block' }).project({ slug: 1, status: 1, 'blockPuzzle.gameId': 1 }).toArray();
  const BUILTIN = { 'blockly-maze': 10, 'blockly-turtle': 10, 'blockly-bird': 10 };
  const valid = new Map(Object.entries(BUILTIN).map(([g, n]) => [g, new Set(Array.from({ length: n }, (_, i) => `${g}-level-${i + 1}`))]));
  valid.set('blockly-puzzle', new Set(['blockly-puzzle']));
  for (const l of lessons) {
    if (!(l.status === 'published' || !l.status) || !l.blockPuzzle) continue;
    const g = l.blockPuzzle.gameId || 'robot-ve-nha';
    if (BUILTIN[g] || g === 'blockly-puzzle') continue;
    valid.set(g, new Set([...(valid.get(g) ?? []), l.slug]));
  }
  let kidsOk = true;
  const kidLines = [];
  for (const row of kidApi.json ?? []) {
    const student = await users.findOne({ _id: new mongoose.Types.ObjectId(row.studentId) });
    // Học viên tự đọc tiến độ của chính mình qua API học viên (đúng nguồn trang /profile dùng).
    const mine = await call(sign(student), '/block-puzzle/progress');
    const slugs = Array.isArray(mine.json) ? mine.json : (mine.json?.completedSlugs ?? []);
    const doneSet = new Set(slugs);
    let stars = 0;
    for (const [, set] of valid) for (const s of set) if (doneSet.has(s)) stars++;
    if (stars !== row.starsEarned) kidsOk = false;
    kidLines.push(`${row.fullName}: hồ sơ ${stars} / giảng viên ${row.starsEarned}`);
  }
  check('Sao của mọi bé: hồ sơ học viên = bảng giảng viên (không lệch 1 đơn vị)', kidsOk && (kidApi.json ?? []).length > 0, kidLines.join(' | '));
  const viet = (kidApi.json ?? []).find((k) => /Dương Chí Việt/i.test(k.fullName));
  check('Bé Dương Chí Việt hiện đúng 14 sao (không còn 0 sao / Ải 1)', viet && viet.starsEarned === 14 && viet.currentLevel === 5, viet ? `${viet.starsEarned} sao, Ải ${viet.currentLevel}, ${viet.levelsDone}/${viet.levelsTotal} màn` : 'không có trong lớp');
  const top3 = [...(kidApi.json ?? [])].sort((a, b) => b.starsEarned - a.starsEarned).slice(0, 3);
  check('Bảng vinh danh Top 3: Bảo An 15 > Dương Chí Việt 14 > Gia Hân 12', /Bảo An/.test(top3[0]?.fullName) && /Dương Chí Việt/.test(top3[1]?.fullName) && /Gia Hân/.test(top3[2]?.fullName), top3.map((k) => `${k.fullName}:${k.starsEarned}`).join(', '));
  const khang = (kidApi.json ?? []).find((k) => /Minh Khang/.test(k.fullName));
  check('Bé Minh Khang có STUCK_ALERT và đứng đầu danh sách', khang?.stuckAlert?.active === true && kidApi.json[0]?.studentId === khang.studentId, khang ? `Ải ${khang.currentLevel}` : '');
  const cols = (await db.listCollections({ name: 'kid_progress' }).toArray()).length;
  check('Không còn collection kid_progress chạy song song (một nguồn sự thật)', cols === 0);

  // 3. Điểm tổng kết: học viên tự xem = giảng viên xem ---------------------------------------------------------------------
  const algo = classes.find((c) => c.ageGroup === '10-12' && !c.archived);
  const board = await call(sign(main), `/teacher/classes/${algo._id}/final-grades`);
  let gradeOk = board.status === 200 && board.json?.assessmentCount > 0;
  let compared = 0;
  const gradeLines = [];
  for (const row of (board.json?.students ?? []).slice(0, 4)) {
    const student = await users.findOne({ _id: new mongoose.Types.ObjectId(row.studentId) });
    const self = await call(sign(student), `/student/classes/${algo._id}/final-grade`);
    if (self.status !== 200 || self.json.finalScore !== row.finalScore || self.json.letter !== row.letter || self.json.locked !== row.locked) gradeOk = false;
    compared++;
    gradeLines.push(`${student.fullName}: ${row.finalScore}${row.letter}`);
  }
  check('Điểm tổng kết K10-12: học viên tự xem = giảng viên xem (điểm, xếp loại, khóa)', gradeOk && compared > 0, gradeLines.join(' | '));

  // 4. Hiệu năng: danh sách bài không còn kéo testCases nặng ----------------------------------------------------------------
  const lessonsApi = await call(sign(main), '/authoring/lessons', 30000).catch((e) => ({ status: 0, ms: 30000, json: null, err: e.message }));
  check('GET /authoring/lessons < 5 giây (trước đây 136 giây)', lessonsApi.status === 200 && lessonsApi.ms < 5000, `HTTP ${lessonsApi.status}, ${lessonsApi.ms}ms`);
  const orphan = (lessonsApi.json ?? []).filter((l) => l.sourceCollection === 'exercise');
  check('Bài ngân hàng đề trong danh sách không kèm testCases (chỉ testCaseCount)', orphan.length > 0 && orphan.every((l) => (l.testCases ?? []).length === 0 && typeof l.testCaseCount === 'number'), `${orphan.length} dòng`);
  if (orphan.length) {
    const detail = await call(sign(main), `/authoring/lessons/${orphan.find((l) => l.testCaseCount > 0)?._id ?? orphan[0]._id}`);
    check('Mở chi tiết một bài (GET /authoring/lessons/:id) mới tải đủ testCases', detail.status === 200 && Array.isArray(detail.json?.testCases) && detail.json.testCases.length > 0, `HTTP ${detail.status}, ${detail.json?.testCases?.length ?? 0} test, ${detail.ms}ms`);
  }
  const exApi = await call(sign(main), '/exercises', 30000).catch((e) => ({ status: 0, ms: 30000, json: null, err: e.message }));
  check('GET /exercises < 5 giây và không lộ testCases/solutionCode', exApi.status === 200 && exApi.ms < 5000 && (exApi.json ?? []).every((e) => !('testCases' in e) && !('solutionCode' in e)), `HTTP ${exApi.status}, ${exApi.ms}ms`);

  // 5. Ngày học: giảng viên thấy đúng cấu trúc Ngày n mà học viên thấy -------------------------------------------------------------
  const send = async (token, method, url, body) => {
    const r = await fetch(BASE + url, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(60000) });
    return { status: r.status, json: await r.json().catch(() => null) };
  };
  const py = classes.find((c) => c.code === 'CL-69PY01');
  const pyStudent = await users.findOne({ email: 'seed-class-6-9-1@demo.cybersoft.local' });
  const teacherDays = await call(sign(main), `/teacher/class-assignments/${py._id}/days`);
  const studentView = await call(sign(pyStudent), `/student/classes/${py._id}/overview`);
  const tShape = (teacherDays.json?.days ?? []).map((d) => `${d.dayNumber}:${d.date}:${d.assignments.length}`);
  const sShape = (studentView.json?.days ?? []).map((d) => `${d.dayNumber}:${d.date}:${d.assignments.length}`);
  check('Ngày học: giảng viên thấy Ngày 1..n y hệt học viên (số ngày, ngày, số bài)', tShape.length > 0 && tShape.join('|') === sShape.join('|'), tShape.join(' | '));
  const types = new Set((teacherDays.json?.days ?? []).flatMap((d) => d.assignments.map((a) => a.type)));
  check('Mỗi bài có loại 💻 Code / 📝 Trắc nghiệm và hạn nộp', types.has('CODING') && types.has('QUIZ') && (teacherDays.json?.days ?? []).every((d) => d.assignments.every((a) => a.dueAt && a.window)), [...types].join(','));

  // 6. Cảnh báo out-tab: lớp chỉ có cảnh báo bài tập của lớp, không có cuộc thi ----------------------------------------------------
  const scoped = await call(sign(main), `/teacher/integrity/alerts?classId=${py._id}`);
  const general = await call(sign(main), '/teacher/integrity/alerts');
  check('Cảnh báo theo lớp: chỉ bài tập được giao trong lớp (không có cuộc thi)', scoped.status === 200 && scoped.json.length > 0 && scoped.json.every((a) => a.kind === 'CLASS_ASSIGNMENT' && a.classId === String(py._id)), scoped.json?.map((a) => `${a.student.fullName}:${a.refTitle}`).join(', '));
  check('Giám sát liêm chính chung vẫn thấy cảnh báo cuộc thi', general.json.some((a) => a.kind === 'CONTEST') && general.json.some((a) => a.kind === 'CLASS_ASSIGNMENT'), `${general.json.length} cảnh báo`);

  // 7. Ngân hàng đề phân trang 10 bài/trang --------------------------------------------------------------------------------------------
  const p1 = await call(sign(main), '/teacher/class-assignments/catalog/exercises?page=1');
  const p2 = await call(sign(main), '/teacher/class-assignments/catalog/exercises?page=2');
  const easy = await call(sign(main), '/teacher/class-assignments/catalog/exercises?difficulty=EASY');
  const quiz = await call(sign(main), '/teacher/class-assignments/catalog/questions?page=1');
  check('Ngân hàng đề: 10 bài/trang, có tổng số và tổng trang, trang 2 khác trang 1', p1.json.items.length === 10 && p1.json.totalPages === Math.ceil(p1.json.total / 10) && p2.json.items[0].slug !== p1.json.items[0].slug, `${p1.json.total} bài / ${p1.json.totalPages} trang`);
  check('Lọc độ khó: chỉ trả bài đúng độ khó; ngân hàng câu trắc nghiệm cũng phân trang', easy.json.items.length > 0 && easy.json.items.every((e) => e.difficulty === 'EASY') && quiz.json.items.length <= 10 && quiz.json.total > 0, `${quiz.json.total} câu`);

  // 8. Lớp Career: không giao bài, không out-tab ------------------------------------------------------------------------------------------
  let careerOk = true;
  const careerLines = [];
  for (const code of ['CL-CAREER-TESTER', 'CL-CAREER-DATA', 'CL-CAREER-AI']) {
    const c = classes.find((x) => x.code === code);
    const give = await send(sign(main), 'POST', `/teacher/class-assignments/${c._id}`, { type: 'CODING', title: 'thử', exerciseSlug: 'tinh-tong-hai-so-nguyen', startAt: new Date().toISOString(), dueAt: new Date(Date.now() + 86400000).toISOString() });
    const set = await send(sign(main), 'PUT', `/teacher/classes/${c._id}/exercises`, { slugs: [] });
    if (give.status !== 400 || set.status !== 400) careerOk = false;
    careerLines.push(`${code}: giao bài ${give.status}, gán bài ${set.status}`);
  }
  check('Lớp Tester QA / Data SQL / AI Prompt: giao bài tập lẻ bị chặn (400)', careerOk, careerLines.join(' | '));

  // 9. Data SQL / AI Prompt: số liệu giảng viên = bài nộp trong collection của học viên --------------------------------------------------
  const dataClass = classes.find((c) => c.code === 'CL-CAREER-DATA');
  const aiClass = classes.find((c) => c.code === 'CL-CAREER-AI');
  const dRoster = await call(sign(main), `/teacher/classes/${dataClass._id}/career/roster`);
  const aRoster = await call(sign(main), `/teacher/classes/${aiClass._id}/career/roster`);
  const labsOf = async (filter) => (await db.collection('exercises').find(filter).project({ slug: 1 }).toArray()).map((e) => e.slug);
  const dataSlugs = await labsOf({ topic: 'da-lab-pack', resource_id: { $exists: true } });
  const aiSlugs = await labsOf({ topic: 'ai-lab-pack', type: 'AI_LAB' });
  let sandboxOk = dRoster.status === 200 && aRoster.status === 200 && dRoster.json.labsTotal === dataSlugs.length && aRoster.json.labsTotal === aiSlugs.length;
  const sandboxLines = [];
  for (const [roster, col, slugs] of [[dRoster, 'da_lab_submissions', dataSlugs], [aRoster, 'ai_lab_submissions', aiSlugs]]) {
    for (const row of roster.json?.students ?? []) {
      const n = await db.collection(col).countDocuments({ userId: row.studentId, exerciseSlug: { $in: slugs } });
      if (n !== row.labsAttempted) sandboxOk = false;
      if (n > 0) sandboxLines.push(`${row.fullName}: ${n}`);
    }
  }
  check('Data SQL / AI Prompt: số Lab đã làm của giảng viên = số bài nộp trong collection của học viên', sandboxOk, sandboxLines.slice(0, 5).join(' | '));
  const detail = dRoster.json.students.find((s) => s.labsAttempted > 0);
  const dd = detail ? await call(sign(main), `/teacher/classes/${dataClass._id}/career/students/${detail.studentId}`) : null;
  check('Chi tiết Data SQL: xem được câu SQL học viên đã nộp', !!dd && dd.status === 200 && dd.json.labs.some((l) => /SELECT/i.test(l.content)), dd ? `${dd.json.labs.length} Lab` : 'không có học viên có bài');
  const teacherOnlyClass = await call(sign(main), `/teacher/classes/${py._id}/career/roster`);
  check('API lớp Career từ chối lớp phổ thông (400)', teacherOnlyClass.status === 400);

  // 10. AI Tạo Đề chỉ cho giảng viên phụ trách lớp K6-9 / K10-12 ---------------------------------------------------------------------------
  const qaOnly = await users.findOne({ email: 'seed-teacher-qa@demo.cybersoft.local' });
  const gate = await send(sign(qaOnly), 'POST', '/teacher/ai-generator', { specs: [] });
  check('AI Tạo Đề: giảng viên chỉ phụ trách lớp Tester QA bị chặn (403)', gate.status === 403 || gate.status === 429, `HTTP ${gate.status} ${gate.json?.code ?? ''}`);
  const okGate = await send(sign(main), 'POST', '/teacher/ai-generator', { specs: [] });
  check('AI Tạo Đề: giảng viên có lớp K6-9/K10-12 qua cổng kiểm tra (không 403)', okGate.status !== 403, `HTTP ${okGate.status}`);

  // 11. Ngân hàng đề theo khối + bài AI không lọt vào Code Playground ---------------------------------------------------------------------
  const bandCases = [];
  let bandOk = true;
  for (const band of ['6-9', '10-12']) {
    const r = await call(sign(main), `/teacher/class-assignments/catalog/exercises?band=${band}&pageSize=50`);
    const wrong = (r.json?.items ?? []).filter((e) => e.band && e.band !== band);
    if (r.status !== 200 || wrong.length) bandOk = false;
    bandCases.push(`${band}: ${r.json?.total ?? '?'} bài, lẫn khối khác ${wrong.length}`);
  }
  check('Ngân hàng đề lọc theo khối: Khối 6–9 / 10–12 không lẫn bài khối kia', bandOk, bandCases.join(' | '));

  const tmpExercises = db.collection('exercises');
  const tmpSlug = `audit-bank-only-${Date.now()}`;
  const k1012 = `audit-k1012-${Date.now()}`;
  const base = { type: 'CODE_TEXT', title: 'Bài kiểm toán', description: 'x', difficulty: 'EASY', points: 10, testCases: [{ input: '1', expectedOutput: '1', isHidden: false }], starterCode: '', topic: 'audit' };
  await tmpExercises.insertMany([
    { ...base, slug: tmpSlug, title: 'Audit bank-only 6-9', bankOnly: true, targetGroup: 'K6_9', labType: 'PYTHON_CODE', gradeBand: '6-9' },
    { ...base, slug: k1012, title: 'Audit khối 10-12', bankOnly: true, targetGroup: 'K10_12', labType: 'ALGO_JUDGE', gradeBand: '9-12' },
  ]);
  try {
    const pyStudent2 = await users.findOne({ email: 'seed-class-6-9-1@demo.cybersoft.local' });
    const playground = await call(sign(pyStudent2), '/exercises');
    const playgroundSlugs = (Array.isArray(playground.json) ? playground.json : playground.json?.data ?? []).map((e) => e.slug);
    check('Code Playground của học viên KHÔNG chứa bài AI/ngân hàng (bankOnly)', playground.status === 200 && !playgroundSlugs.includes(tmpSlug) && !playgroundSlugs.includes(k1012), `${playgroundSlugs.length} bài hiển thị`);
    const inBank = await call(sign(main), `/teacher/class-assignments/catalog/exercises?q=${encodeURIComponent('Audit bank-only')}&band=6-9`);
    check('Giảng viên thấy bài bankOnly trong ngân hàng đề (đúng khối)', inBank.json?.items?.some((e) => e.slug === tmpSlug), `${inBank.json?.total ?? 0} bài`);
    const inOther = await call(sign(main), `/teacher/class-assignments/catalog/exercises?q=${encodeURIComponent('Audit bank-only')}&band=10-12`);
    check('Bài khối 6–9 không hiện ở tab Khối 10–12', !inOther.json?.items?.some((e) => e.slug === tmpSlug));
    const mismatch = await send(sign(main), 'POST', `/teacher/class-assignments/${py._id}`, { type: 'CODING', title: 'thử khác khối', exerciseSlug: k1012, startAt: new Date().toISOString(), dueAt: new Date(Date.now() + 86400000).toISOString() });
    check('Gán bài Khối 10–12 vào lớp K6-9 bị chặn (400 E400_BAND_MISMATCH)', mismatch.status === 400 && mismatch.json?.code === 'E400_BAND_MISMATCH', `HTTP ${mismatch.status} ${mismatch.json?.code ?? ''}`);
    const noBand = await send(sign(main), 'POST', '/teacher/ai-generator', { specs: [{ learningOutcome: 'tổng hai số', level: 'EASY', constraints: [], tags: [] }] });
    check('AI Tạo Đề: thiếu khối đối tượng -> 400 E400_INVALID_BAND', noBand.status === 400 && noBand.json?.code === 'E400_INVALID_BAND', `HTTP ${noBand.status} ${noBand.json?.code ?? ''}`);
  } finally {
    await tmpExercises.deleteMany({ slug: { $in: [tmpSlug, k1012] } });
  }

  // 12. Cuộc thi: "Không công nhận kết quả" loại khỏi bảng xếp hạng chính thức, học viên vẫn thấy điểm của mình -------------------------------
  const sA = await users.findOne({ email: 'seed-class-6-9-1@demo.cybersoft.local' });
  const sB = await users.findOne({ email: 'seed-class-6-9-2@demo.cybersoft.local' });
  const contests = db.collection('contests');
  const attemptsCol = db.collection('contest_attempts');
  const subsCol = db.collection('contest_submissions');
  const now = Date.now();
  const cDoc = await contests.insertOne({
    title: 'Audit DQ', slug: `audit-dq-${now}`, description: 'x', startTime: new Date(now - 3600_000), endTime: new Date(now + 3600_000), durationMinutes: 60,
    problems: [{ source: 'exercise', exerciseSlug: 'tinh-tong-hai-so-nguyen', title: 'Tổng', slug: 'tinh-tong-hai-so-nguyen', type: 'coding', points: 100, order: 1 }],
    registrations: [{ studentId: String(sA._id), studentName: 'A', registeredAt: new Date() }, { studentId: String(sB._id), studentName: 'B', registeredAt: new Date() }],
    status: 'published', authorId: String(main._id), integrityEnabled: true, gradeBand: '6-9', createdAt: new Date(), updatedAt: new Date(),
  });
  const cid = String(cDoc.insertedId);
  const mkAttempt = (u, leaves) => ({ contestId: cid, studentId: String(u._id), studentName: u.fullName, startedAt: new Date(now - 1800_000), deadlineAt: new Date(now + 1800_000), finishedAt: new Date(now - 600_000), finishReason: 'MANUAL', leaveCount: leaves, createdAt: new Date(), updatedAt: new Date() });
  const insA = await attemptsCol.insertOne(mkAttempt(sA, 3));
  const insB = await attemptsCol.insertOne(mkAttempt(sB, 1));
  const mkSub = (u, score) => ({ contestId: cid, problemSlug: 'tinh-tong-hai-so-nguyen', problemType: 'coding', studentId: String(u._id), studentName: u.fullName, score, maxPoints: 100, verdict: score === 100 ? 'AC' : 'PARTIAL', passedCount: 1, totalCount: 1, submittedAt: new Date(now - 900_000), isLate: false });
  await subsCol.insertMany([mkSub(sA, 100), mkSub(sB, 60)]);
  try {
    const before = await call(sign(main), `/contests/${cid}/manage/results`);
    const rowA = before.json?.rows?.find((r) => r.studentId === String(sA._id));
    const rowB = before.json?.rows?.find((r) => r.studentId === String(sB._id));
    check('Giám sát cuộc thi: có số lần out-tab, hạng, thời gian làm; chỉ thí sinh out-tab >= 3 mới được không công nhận', before.status === 200 && rowA?.leaveCount === 3 && rowA.canDisqualify === true && rowB?.canDisqualify === false && rowA.officialRank === 1 && rowA.completionMinutes > 0, `A: ${rowA?.leaveCount} lần/hạng ${rowA?.officialRank}; B: ${rowB?.leaveCount} lần`);
    const tooFew = await send(sign(main), 'PUT', `/contests/${cid}/manage/attempts/${insB.insertedId}/disqualify`, { reason: 'Không đủ số lần rời màn hình' });
    const noReason = await send(sign(main), 'PUT', `/contests/${cid}/manage/attempts/${insA.insertedId}/disqualify`, { reason: 'ngắn' });
    check('Không công nhận: out-tab < 3 hoặc thiếu lý do bị từ chối (400)', tooFew.status === 400 && noReason.status === 400, `HTTP ${tooFew.status}/${noReason.status}`);
    const other = teachers.find((t) => String(t._id) !== String(main._id));
    if (other) {
      const foreign = await send(sign(other), 'PUT', `/contests/${cid}/manage/attempts/${insA.insertedId}/disqualify`, { reason: 'Giảng viên khác không có quyền' });
      check('Giảng viên không sở hữu cuộc thi không thể không công nhận (403)', foreign.status === 403, `HTTP ${foreign.status}`);
    }
    const dq = await send(sign(main), 'PUT', `/contests/${cid}/manage/attempts/${insA.insertedId}/disqualify`, { reason: 'Rời màn hình 3 lần khi làm bài thi' });
    check('Không công nhận kết quả thành công (out-tab 3, có lý do)', dq.status === 200 && dq.json?.disqualified === true, `HTTP ${dq.status}`);

    const board = await call(sign(sA), `/contests/${cid}/leaderboard`);
    const ids = (board.json?.rows ?? []).map((r) => r.studentId);
    check('Bảng xếp hạng chính thức loại thí sinh bị không công nhận; người còn lại lên hạng 1', board.status === 200 && !ids.includes(String(sA._id)) && ids[0] === String(sB._id) && board.json.rows[0].rank === 1, `rows: ${ids.length}`);
    const mine = await call(sign(sA), '/student/contest-history');
    const histRow = (mine.json ?? []).find((c) => c.contestId === cid);
    check('Học viên bị loại vẫn xem được điểm của mình nhưng không có hạng (rank null, disqualified)', histRow?.score === 100 && histRow.rank === null && histRow.disqualified === true, histRow ? `điểm ${histRow.score}, hạng ${histRow.rank}` : 'không có dòng lịch sử');
    const myAttempt = await call(sign(sA), `/contests/${cid}/my-attempt`);
    check('my-attempt của học viên bị loại: còn điểm 100 và cờ disqualified', myAttempt.status === 200 && myAttempt.json?.totalScore === 100 && myAttempt.json?.attempt?.disqualified === true, `HTTP ${myAttempt.status}`);
    const auditRow = await db.collection('audit_logs').findOne({ action: 'CONTEST_DISQUALIFY', targetId: String(insA.insertedId) });
    check('Nhật ký hoạt động ghi lại việc không công nhận (người quyết định, lý do)', !!auditRow && auditRow.actorId === String(main._id) && /3 lần/.test(auditRow.reason ?? ''), auditRow ? `by ${auditRow.actorEmail}` : 'không có log');

    const re = await send(sign(main), 'PUT', `/contests/${cid}/manage/attempts/${insA.insertedId}/reinstate`, {});
    const board2 = await call(sign(sA), `/contests/${cid}/leaderboard`);
    check('Khôi phục kết quả: thí sinh trở lại bảng xếp hạng chính thức ở hạng 1', re.status === 200 && board2.json?.rows?.[0]?.studentId === String(sA._id), `HTTP ${re.status}`);
  } finally {
    await attemptsCol.deleteMany({ contestId: cid });
    await subsCol.deleteMany({ contestId: cid });
    await contests.deleteOne({ _id: cDoc.insertedId });
    await db.collection('audit_logs').deleteMany({ action: { $in: ['CONTEST_DISQUALIFY', 'CONTEST_REINSTATE'] }, targetId: { $in: [String(insA.insertedId), String(insB.insertedId)] } }).catch(() => undefined);
  }

  // 13. Quản lý Ngân hàng đề: phân quyền, phân loại khối, xóa an toàn, Code Playground không đổi ---------------------------------------------
  {
    const bankAll = await call(sign(main), '/teacher/question-bank?pageSize=50');
    const totalBank = bankAll.json?.total ?? -1;
    const p69 = await call(sign(main), '/teacher/question-bank?band=6-9');
    const p1012 = await call(sign(main), '/teacher/question-bank?band=10-12');
    let allItems = [];
    for (let p = 1; p <= (bankAll.json?.totalPages ?? 0); p++) allItems = allItems.concat((await call(sign(main), `/teacher/question-bank?pageSize=50&page=${p}`)).json?.items ?? []);
    check('Ngân hàng đề: giảng viên K6-9/K10-12 xem được, mặc định 10 bài/trang, mọi bài đều đã phân loại khối', bankAll.status === 200 && (await call(sign(main), '/teacher/question-bank')).json?.items?.length === 10 && allItems.length === totalBank && allItems.every((i) => i.band === '6-9' || i.band === '10-12'), `${totalBank} bài / ${bankAll.json?.totalPages} trang`);
    check('Lọc khối: Khối 6–9 + Khối 10–12 = Tất cả, không bài nào lẫn khối', p69.json?.total + p1012.json?.total === totalBank && (p69.json?.items ?? []).every((i) => i.band === '6-9') && (p1012.json?.items ?? []).every((i) => i.band === '10-12'), `${p69.json?.total} + ${p1012.json?.total} = ${totalBank}`);
    const kidTeacher = await users.findOne({ email: 'seed-teacher-kid@demo.cybersoft.local' });
    const gates = [];
    let gateOk = true;
    for (const [label, t] of [['K3-5', kidTeacher], ['Tester QA', qaOnly]]) {
      const r = await call(sign(t), '/teacher/question-bank');
      if (r.status !== 403 || r.json?.code !== 'E403_QUESTION_BANK_NOT_ELIGIBLE') gateOk = false;
      gates.push(`${label}: HTTP ${r.status} ${r.json?.code ?? ''}`);
    }
    check('Ngân hàng đề: giảng viên chỉ phụ trách K3-5 hoặc Career bị 403 E403_QUESTION_BANK_NOT_ELIGIBLE', gateOk, gates.join(' | '));

    const bankSlug = `audit-bank-del-${Date.now()}`;
    await db.collection('exercises').insertOne({ type: 'CODE_TEXT', slug: bankSlug, title: 'Audit xóa an toàn', description: 'x', difficulty: 'EASY', points: 10, bankOnly: true, bankBand: '6-9', targetGroup: 'K6_9', labType: 'PYTHON_CODE', gradeBand: '6-9', authorId: String(main._id), testCases: [{ input: '1', expectedOutput: '1', isHidden: false }, { input: '2', expectedOutput: '2', isHidden: true }], tags: [] });
    let assignedId = null;
    try {
      const assigned = await send(sign(main), 'POST', `/teacher/class-assignments/${py._id}`, { type: 'CODING', title: 'Audit dùng bài', exerciseSlug: bankSlug, startAt: new Date().toISOString(), dueAt: new Date(Date.now() + 86400000).toISOString() });
      assignedId = assigned.json?.id ?? assigned.json?._id;
      const blocked = await send(sign(main), 'DELETE', `/teacher/question-bank/${bankSlug}`);
      check('Xóa bài đang gán vào Ngày học: bị chặn với thông báo chuẩn (409)', assigned.status < 300 && blocked.status === 409 && blocked.json?.message === 'Không thể xóa bài tập đang được sử dụng trong Lớp học hoặc Cuộc thi', `HTTP ${blocked.status} ${blocked.json?.message ?? ''}`);
      const stillThere = await db.collection('exercises').countDocuments({ slug: bankSlug });
      check('Bài bị chặn xóa vẫn còn trong CSDL', stillThere === 1);
      if (assignedId) await send(sign(main), 'DELETE', `/teacher/class-assignments/${py._id}/${assignedId}`);
      const edit = await send(sign(main), 'PATCH', `/teacher/question-bank/${bankSlug}`, { title: 'Audit đã sửa', difficulty: 'HARD' });
      check('Sửa bài trong Ngân hàng đề: tiêu đề và độ khó được lưu', edit.status === 200 && edit.json?.title === 'Audit đã sửa' && edit.json?.difficulty === 'HARD', `HTTP ${edit.status}`);
      const gone = await send(sign(main), 'DELETE', `/teacher/question-bank/${bankSlug}`);
      check('Hết được dùng thì xóa được (200)', gone.status === 200 && (await db.collection('exercises').countDocuments({ slug: bankSlug })) === 0, `HTTP ${gone.status}`);
    } finally {
      await db.collection('exercises').deleteOne({ slug: bankSlug });
      await db.collection('class_assignments').deleteMany({ exerciseSlug: bankSlug });
      await db.collection('classrooms').updateOne({ _id: py._id }, { $pull: { exerciseSlugs: bankSlug } });
    }

    const fixed = await send(sign(main), 'DELETE', '/teacher/question-bank/tinh-tong-hai-so-nguyen');
    const fixedEdit = await send(sign(main), 'PATCH', '/teacher/question-bank/tinh-tong-hai-so-nguyen', { title: 'phá' });
    check('Bài của Code Playground cố định: không sửa/xóa được từ Ngân hàng đề (403 E403_PLAYGROUND_FIXED)', fixed.status === 403 && fixedEdit.status === 403 && fixed.json?.code === 'E403_PLAYGROUND_FIXED', `HTTP ${fixed.status}/${fixedEdit.status}`);

    const stu = await users.findOne({ email: 'seed-class-6-9-1@demo.cybersoft.local' });
    const pg = await call(sign(stu), '/exercises');
    const pgItems = Array.isArray(pg.json) ? pg.json : pg.json?.data ?? [];
    check('Payload Code Playground của học viên không lộ nhãn mới (bankBand) và không chứa bài bankOnly', pg.status === 200 && pgItems.length > 0 && pgItems.every((e) => !('bankBand' in e) && !('bankOnly' in e)), `${pgItems.length} bài`);
    const mutated = await db.collection('exercises').countDocuments({ bankOnly: { $ne: true }, type: 'CODE_TEXT', resource_id: { $exists: false }, $or: [{ bankBand: { $exists: false } }] });
    check('Phân loại khối bổ sung cho MỌI bài code (không còn bài chưa phân loại)', mutated === 0, `${mutated} bài chưa có khối`);
  }

  await mongoose.disconnect();
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} PASS`);
  if (failed.length) {
    console.log('FAIL:\n' + failed.map((f) => ` - ${f.name} (${f.detail})`).join('\n'));
    process.exit(1);
  }
})().catch((e) => {
  console.error('Lỗi chạy kiểm tra:', e.message);
  process.exit(2);
});
