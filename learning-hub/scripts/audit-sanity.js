#!/usr/bin/env node
/**
 * Sanity & integrity audit (CHỈ ĐỌC, không ghi gì) cho dữ liệu seed trên CSDL trong BE/.env.
 *   node scripts/audit-sanity.js            # in báo cáo PASS / WARN / FAIL, thoát mã 1 nếu có FAIL
 *   node scripts/audit-sanity.js --json     # thêm kết quả dạng JSON
 */
const fs = require('fs');
const path = require('path');
const h = require('./lib/setup-helpers');

const BE = path.join(__dirname, '..', 'BE');
const FE = path.join(__dirname, '..', 'FE');
const envText = fs.existsSync(path.join(BE, '.env')) ? fs.readFileSync(path.join(BE, '.env'), 'utf8') : '';
const uri = process.env.DATABASE_URL || h.readEnvValue(envText, 'DATABASE_URL') || '';

const results = [];
const rec = (area, status, msg) => results.push({ area, status, msg });
const pass = (a, m) => rec(a, 'PASS', m);
const warn = (a, m) => rec(a, 'WARN', m);
const fail = (a, m) => rec(a, 'FAIL', m);
const check = (a, ok, okMsg, badMsg, level = 'FAIL') => (ok ? pass(a, okMsg) : rec(a, level, badMsg));

const VN = 7 * 3600 * 1000;
const vnDay = (d) => new Date(new Date(d).getTime() + VN).toISOString().slice(0, 10);
const norm = (s) => String(s || '').trim().toLowerCase();
const dupes = (arr) => arr.filter((x, i) => arr.indexOf(x) !== i);
const feConst = (file, name) => {
  try {
    const m = fs.readFileSync(path.join(FE, 'src', 'games', file), 'utf8').match(new RegExp(`${name}\\s*=\\s*(\\d+)`));
    return m ? Number(m[1]) : null;
  } catch { return null; }
};

(async () => {
  if (!uri) { console.error('Thiếu DATABASE_URL.'); process.exit(1); }
  const mongoose = require(path.join(BE, 'node_modules', 'mongoose'));
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  const db = mongoose.connection.db;
  const col = (n) => db.collection(n);
  const OID = mongoose.Types.ObjectId;
  try {
    const exercises = await col('exercises').find({}).toArray();
    const users = await col('users').find({}).project({ email: 1, role: 1, ageGroup: 1, fullName: 1, isSeedDemo: 1, isSeedContestDemo: 1, isSeedClassDemo: 1 }).toArray();
    const userById = new Map(users.map((u) => [String(u._id), u]));
    const classes = await col('classrooms').find({}).toArray();
    const contests = await col('contests').find({}).toArray();

    // ============ KHỐI 3-5 ============
    const A = 'Lớp 3-5';
    const GAMES = [
      ['blockly-maze', 'Mê cung Blockly', 10, 'MAZE_LEVEL_COUNT'],
      ['blockly-turtle', 'Rùa vẽ hình', 10, 'TURTLE_LEVEL_COUNT'],
      ['blockly-bird', 'Chim tìm tổ', 10, 'BIRD_LEVEL_COUNT'],
      ['blockly-puzzle', 'Ghép hình con vật', 1, null],
    ];
    const feFiles = { MAZE_LEVEL_COUNT: 'blocklyMaze/mazeLevels.ts', TURTLE_LEVEL_COUNT: 'blocklyTurtle/turtleLevels.ts', BIRD_LEVEL_COUNT: 'blocklyBird/birdLevels.ts' };
    for (const [, name, n, c] of GAMES) {
      if (!c) continue;
      const v = c === 'MAZE_LEVEL_COUNT' ? 10 : feConst(feFiles[c], c);
      if (v !== null) check(A, v === n, `${name}: FE có ${v} màn, khớp BE`, `${name}: FE có ${v} màn nhưng BE kỳ vọng ${n}`);
    }
    const blockLessons = await col('lessons').find({ type: 'block' }).toArray();
    const published = blockLessons.filter((l) => !l.status || l.status === 'published');
    check(A, published.length >= 15, `Robot về nhà (bài giảng viên): ${published.length} màn đã đăng`, `Robot về nhà chỉ có ${published.length} màn đã đăng (kỳ vọng ≥ 15)`);
    const progress = await col('block_puzzle_progress').find({}).toArray();
    const robotSlugs = new Set(published.map((l) => l.slug));
    const gameSlugs = { 'robot-ve-nha': [...robotSlugs] };
    for (const [id, , n] of GAMES) gameSlugs[id] = id === 'blockly-puzzle' ? ['blockly-puzzle'] : Array.from({ length: n }, (_, i) => `${id}-level-${i + 1}`);
    const kids = users.filter((u) => u.role === 'STUDENT' && u.ageGroup === '3-5');
    const kidIds = new Set(kids.map((k) => String(k._id)));
    for (const [id, slugs] of Object.entries(gameSlugs)) {
      const per = new Map();
      for (const p of progress) if (p.gameId === id && slugs.includes(p.lessonSlug)) { const s = per.get(p.userId) ?? new Set(); s.add(p.lessonSlug); per.set(p.userId, s); }
      const cleared = [...per.entries()].filter(([uid, s]) => s.size >= slugs.length && kidIds.has(uid)).length;
      const label = (GAMES.find((g) => g[0] === id) || [id, 'Robot về nhà'])[1];
      check(A, cleared >= 10, `Bảng vinh danh "${label}": ${cleared} bé phá đảo 100% (đủ Top 1-3 và danh sách 1-10)`,
        `Bảng vinh danh "${label}": chỉ ${cleared} bé phá đảo 100% (cần ≥ 10 để đủ danh sách 1-10)`, cleared >= 3 ? 'WARN' : 'FAIL');
    }
    check(A, kids.length >= 10, `${kids.length} tài khoản học sinh 3-5`, `Chỉ có ${kids.length} tài khoản 3-5`, 'WARN');
    const kidEx = exercises.filter((e) => e.gradeBand === '3-5' || e.targetGroup === 'K3_5');
    check(A, kidEx.length >= 1, `${kidEx.length} bài 3-5 trong ngân hàng bài tập`, 'Không có bài 3-5 trong ngân hàng bài tập', 'WARN');

    // ============ KHỐI 6-9 ============
    const B = 'Lớp 6-9';
    const band69 = exercises.filter((e) => e.gradeBand === '6-9' || e.targetGroup === 'K6_9');
    check(B, band69.length >= 20, `${band69.length} bài Python trong Playground`, `Chỉ ${band69.length} bài Python khối 6-9`);
    const slugDup = dupes(band69.map((e) => e.slug));
    check(B, slugDup.length === 0, 'Không trùng slug', `Trùng slug: ${slugDup.join(', ')}`);
    const titleDup = dupes(band69.map((e) => norm(e.title)));
    check(B, titleDup.length === 0, 'Không trùng tiêu đề (Playground đánh số #1…#N liên tục)', `Trùng tiêu đề: ${titleDup.join(', ')} (Playground tự khử trùng nên #1…#N vẫn liên tục, nhưng nên dọn dữ liệu)`, 'WARN');
    const noTests = band69.filter((e) => !(e.testCases || []).length).map((e) => e.slug);
    check(B, noTests.length === 0, 'Mọi bài 6-9 đều có test case', `Bài 6-9 thiếu test case: ${noTests.join(', ')}`);

    const classAudit = async (code, band, label, wantExerciseBand) => {
      const cls = classes.find((c) => c.code === code);
      if (!cls) { fail(label, `Không có lớp ${code}`); return; }
      const asg = await col('class_assignments').find({ classId: String(cls._id) }).toArray();
      const days = new Set(asg.map((a) => vnDay(a.startAt)));
      const types = new Set(asg.map((a) => a.type));
      check(label, days.size >= 5 || asg.length >= 8, `${code}: ${asg.length} bài giao trải ${days.size} ngày`, `${code}: chỉ ${asg.length} bài / ${days.size} ngày (kỳ vọng lộ trình 5 ngày)`);
      check(label, types.has('QUIZ') && types.has('CODING'), `${code}: có cả Trắc nghiệm và Code`, `${code}: thiếu loại bài (${[...types].join(',')})`);
      const badDue = asg.filter((a) => !(a.dueAt > a.startAt));
      check(label, badDue.length === 0, `${code}: hạn chót hợp lệ`, `${code}: ${badDue.length} bài có hạn chót ≤ giờ mở`);
      const exSlugs = asg.filter((a) => a.type === 'CODING').map((a) => a.exerciseSlug);
      const missingEx = exSlugs.filter((s) => !exercises.some((e) => e.slug === s));
      check(label, missingEx.length === 0, `${code}: mọi bài code trỏ tới bài tập có thật`, `${code}: bài code không tồn tại: ${missingEx.join(', ')}`);
      const qIds = asg.filter((a) => a.type === 'QUIZ').flatMap((a) => a.questionIds || []);
      const foundQ = qIds.length ? await col('questions').countDocuments({ _id: { $in: qIds.filter((i) => OID.isValid(i)).map((i) => new OID(i)) } }) : 0;
      check(label, qIds.length > 0 && foundQ === new Set(qIds).size, `${code}: câu hỏi trắc nghiệm đủ (${foundQ})`, `${code}: thiếu câu hỏi trắc nghiệm (${foundQ}/${new Set(qIds).size})`);
      const members = (cls.studentIds || []).map((id) => userById.get(id)).filter(Boolean);
      const wrongBand = members.filter((u) => u.ageGroup !== band);
      check(label, members.length >= 6 && wrongBand.length === 0, `${code}: ${members.length} học sinh ghi danh, đúng khối ${band}`, `${code}: ${members.length} học sinh, ${wrongBand.length} sai khối`);
      const real = members.filter((u) => !u.isSeedClassDemo);
      check(label, real.length >= 1, `${code}: có tài khoản thật ghi danh (${real.map((u) => u.email).join(', ')})`, `${code}: chưa ghi danh tài khoản test nào (chạy node scripts/seed-class.js --add-email=...)`, 'WARN');
      const subs = await col('submissions').countDocuments({ assignmentId: { $in: asg.map((a) => String(a._id)) } });
      check(label, subs > 0, `${code}: có ${subs} bài nộp mẫu cho bảng xếp hạng lớp`, `${code}: chưa có bài nộp mẫu`, 'WARN');
      const teacher = userById.get(cls.teacherId);
      check(label, !!teacher && teacher.role === 'TEACHER', `${code}: có giảng viên (${teacher && teacher.fullName})`, `${code}: giảng viên không hợp lệ`);
      return cls;
    };
    await classAudit('CL-69PY01', '6-9', B);

    const contestAudit = async (band, label) => {
      const list = contests.filter((c) => c.gradeBand === band);
      check(label, list.length >= 2, `${list.length} cuộc thi riêng khối ${band}`, `Chỉ có ${list.length} cuộc thi khối ${band} (kỳ vọng 2)`);
      for (const c of list) {
        const subs = await col('contest_submissions').find({ contestId: String(c._id) }).toArray();
        const students = new Set(subs.map((s) => s.studentId));
        const regs = (c.registrations || []).length;
        check(label, students.size >= 7 && regs >= 7, `"${c.title}": ${students.size} thí sinh có bài nộp, ${regs} đăng ký`, `"${c.title}": ${students.size} thí sinh có bài nộp / ${regs} đăng ký (kỳ vọng ≥ 7)`);
        check(label, c.integrityEnabled === true, `"${c.title}": giám sát bật`, `"${c.title}": integrityEnabled=${c.integrityEnabled}`);
        const wrong = [...students].filter((id) => { const u = userById.get(id); return u && u.ageGroup !== band; });
        check(label, wrong.length === 0, `"${c.title}": mọi thí sinh đúng khối`, `"${c.title}": ${wrong.length} thí sinh sai khối`);
        const dirty = subs.filter((s) => /[0-9a-f]{24}/i.test(s.studentName || '')).length;
        check(label, dirty === 0, `"${c.title}": tên thí sinh sạch`, `"${c.title}": ${dirty} bài nộp có tên dính ObjectId (BXH đã tự làm sạch khi hiển thị)`, 'WARN');
        const empty = (c.problems || []).filter((p) => p.type === 'coding' && !p.slug).length;
        check(label, (c.problems || []).length > 0 && empty === 0, `"${c.title}": ${(c.problems || []).length} đề`, `"${c.title}": đề thiếu/không hợp lệ`);
      }
    };
    await contestAudit('6-9', B);

    // ============ KHỐI 10-12 ============
    const C = 'Lớp 10-12';
    const band1012 = exercises.filter((e) => ['9-12', '10-12'].includes(e.gradeBand) || e.targetGroup === 'K10_12');
    check(C, band1012.length >= 15, `${band1012.length} bài Thuật toán`, `Chỉ ${band1012.length} bài khối 10-12`);
    const missLimits = band1012.filter((e) => !(e.timeLimitMs > 0) || !(e.memoryLimitMb > 0)).map((e) => e.slug);
    check(C, missLimits.length === 0, 'Mọi bài đều có timeLimitMs và memoryLimitMb', `Thiếu timeLimitMs/memoryLimitMb: ${missLimits.join(', ')}`);
    const noT = band1012.filter((e) => !(e.testCases || []).length).map((e) => e.slug);
    check(C, noT.length === 0, 'Mọi bài đều có test case', `Thiếu test case: ${noT.join(', ')}`);
    const d2 = dupes(band1012.map((e) => e.slug)).concat(dupes(band1012.map((e) => norm(e.title))));
    check(C, d2.length === 0, 'Không trùng slug/tiêu đề', `Trùng: ${d2.join(', ')}`);
    await classAudit('CL-1012A1', '10-12', C);
    await contestAudit('10-12', C);

    // ============ NGƯỜI LỚN ============
    const D = 'Người lớn';
    const cnt = (t) => exercises.filter((e) => e.type === t && e.resource_id).length;
    check(D, cnt('SQL_LAB') >= 5, `Data Lab SQL: ${cnt('SQL_LAB')} phòng`, `Data Lab SQL chỉ có ${cnt('SQL_LAB')} phòng`);
    check(D, cnt('DA_INSIGHT') >= 3, `Data Lab Insight: ${cnt('DA_INSIGHT')} phòng`, `Data Lab Insight chỉ có ${cnt('DA_INSIGHT')} phòng`);
    check(D, cnt('AI_LAB') >= 5, `AI Lab (Prompting): ${cnt('AI_LAB')} phòng`, `AI Lab chỉ có ${cnt('AI_LAB')} phòng`);
    const tl = await col('tester_labs').countDocuments({});
    check(D, tl >= 5, `Tester Lab: ${tl} phòng`, `Tester Lab chỉ có ${tl} phòng`);

    // ============ TÀI KHOẢN & TOÀN CỤC ============
    const G = 'Toàn cục';
    const staffless = ['STUDENT', 'TEACHER', 'ADMIN'].filter((r) => !users.some((u) => u.role === r));
    check(G, staffless.length === 0, 'Có đủ 3 vai trò STUDENT / TEACHER / ADMIN', `Thiếu vai trò: ${staffless.join(', ')}`);
    const badRole = users.filter((u) => !['STUDENT', 'TEACHER', 'ADMIN'].includes(u.role)).length;
    check(G, badRole === 0, 'Không có role ngoài enum', `${badRole} tài khoản có role lạ`);
    const dirtyNames = users.filter((u) => /[0-9a-f]{24}/i.test(u.fullName || '')).length;
    check(G, dirtyNames === 0, 'Không tên người dùng nào dính ObjectId', `${dirtyNames} tên người dùng dính ObjectId`);
    const hints = await col('hints').find({ level: 3 }).toArray();
    const codey = hints.filter((x) => /```|\bprint\s*\(|\binput\s*\(|\bdef\s+\w+\s*\(/.test(x.content));
    check(G, hints.length >= 10 && codey.length === 0, `Hint Tầng 3: ${hints.length} gợi ý, không chứa code hoàn chỉnh`, `Hint Tầng 3: ${codey.length}/${hints.length} gợi ý còn chứa code`);
    const unknownSubs = await col('submissions').aggregate([{ $group: { _id: '$exerciseId' } }]).toArray();
    const exIds = new Set(exercises.map((e) => String(e._id)));
    const orphan = unknownSubs.filter((s) => !exIds.has(String(s._id))).length;
    check(G, orphan === 0, 'Mọi bài nộp trỏ tới bài tập có thật', `${orphan} exerciseId trong submissions không còn tồn tại`, 'WARN');
  } finally {
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
  if (process.argv.includes('--json')) console.log(JSON.stringify(results));
  process.exit(c('FAIL') ? 1 : 0);
})().catch((e) => { console.error(e.message || e); process.exit(2); });
