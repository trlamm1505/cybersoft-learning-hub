#!/usr/bin/env node
/**
 * MASTER SEED: một lệnh duy nhất dựng môi trường chuẩn cho Tester, chạy lại bao nhiêu lần cũng KHÔNG nhân bản dữ liệu (idempotent).
 *
 *   npm run seed            # tạo/cập nhật mọi dữ liệu mẫu
 *   npm run seed:clean      # dọn sạch dữ liệu seed mẫu rồi nạp lại từ đầu (không đụng dữ liệu thật)
 *
 * Thứ tự (mỗi bước là một script con hoặc một hàm trong file này):
 *   1. Nền: CSDL còn trống thì nạp seed gốc của BE (người dùng, bài tập, câu hỏi, cuộc thi mẫu). CSDL đã có dữ liệu thì GIỮ NGUYÊN.
 *   2. Tài khoản chuẩn: admin@gmail.com, teacher@gmail.com, student@gmail.com (mật khẩu 123456).
 *   3. Ma trận bài mẫu, lớp học chuẩn + học viên K3-5 / K6-9 / K10-12 + bài theo Ngày 1..5 (seed-class).
 *   4. Bảng vinh danh K3-5 (seed-kid-leaderboard) và bé Dương Chí Việt 14 sao.
 *   5. Cuộc thi mẫu có xếp hạng (seed-contests) + 1 cuộc thi mẫu có học viên out-tab để thử "Không công nhận kết quả".
 *   6. Người đi làm (nguoidilam1/2: cần backend; script tự bật backend tạm nếu chưa chạy), rồi dữ liệu sống của teacher@gmail.com
 *      (seed-teacher-default): gán 4 lớp, K3-5 12/9/15 sao, daicagovap out-tab, hàng chờ Tester QA 2 bài + các bài đã chấm rubric 40/30/30.
 *   7. Lớp Lưu trữ mẫu.
 *   8. Phân loại bài tập của Ngân hàng đề theo khối (classify-existing-exercises): K6_9 / K10_12, không còn bài chưa phân loại.
 *
 * Tùy chọn: --clean, --skip-api (không dùng backend: bỏ bước người đi làm), --verbose (in toàn bộ log của script con).
 */
const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const h = require('./lib/setup-helpers');
const { classifyAll, removeTags } = require('./classify-existing-exercises');

const ROOT = path.resolve(__dirname, '..');
const BE = path.join(ROOT, 'BE');
const args = new Set(process.argv.slice(2));
const CLEAN = args.has('--clean');
const SKIP_API = args.has('--skip-api');
const VERBOSE = args.has('--verbose');
const isWin = process.platform === 'win32';

const envPath = path.join(BE, '.env');
if (!fs.existsSync(envPath)) {
  console.error('Chưa có BE/.env. Chạy `npm run setup` trước.');
  process.exit(1);
}
const envText = fs.readFileSync(envPath, 'utf8');
const uri = process.env.DATABASE_URL || h.readEnvValue(envText, 'DATABASE_URL');
const PORT = process.env.PORT || h.readEnvValue(envText, 'PORT') || '3000';
const BASE = process.env.SEED_API_BASE || `http://localhost:${PORT}/api`;
const FLAG = 'isSeedAll';
const PASSWORD = '123456';
const TEACHER_EMAIL = 'teacher@gmail.com';

const C = { ok: '\x1b[32m✔\x1b[0m', skip: '\x1b[36m-\x1b[0m', warn: '\x1b[33m!\x1b[0m', bad: '\x1b[31m✘\x1b[0m', h: '\x1b[1m' };
const step = (n, t) => console.log(`\n${C.h}${n} ${t}\x1b[0m`);
const say = (icon, msg) => console.log(`  ${icon} ${msg}`);
const warnings = [];
const warn = (msg) => {
  warnings.push(msg);
  say(C.warn, msg);
};

/** Chạy một script con bằng Node; trả về { ok, out }. */
function runScript(file, scriptArgs = []) {
  const res = spawnSync(process.execPath, [path.join(__dirname, file), ...scriptArgs], { cwd: ROOT, encoding: 'utf8', env: { ...process.env, SEED_API_BASE: BASE } });
  const out = `${res.stdout || ''}${res.stderr || ''}`.trim();
  if (VERBOSE && out) console.log(out.split('\n').map((l) => `      ${l}`).join('\n'));
  return { ok: res.status === 0, out };
}

function runNpm(npmArgs) {
  const cli = process.env.npm_execpath;
  const [cmd, a] = cli && /\.c?js$/.test(cli) ? [process.execPath, [cli, ...npmArgs]] : isWin ? ['cmd.exe', ['/d', '/s', '/c', 'npm.cmd', ...npmArgs]] : ['npm', npmArgs];
  const res = spawnSync(cmd, a, { cwd: ROOT, encoding: 'utf8' });
  return { ok: res.status === 0, out: `${res.stdout || ''}${res.stderr || ''}`.trim() };
}

const script = (label, file, scriptArgs = [], { fatal = false } = {}) => {
  const r = runScript(file, scriptArgs);
  if (r.ok) say(C.ok, label);
  else {
    const tail = r.out.split('\n').slice(-3).join(' | ');
    if (fatal) {
      say(C.bad, `${label}: ${tail}`);
      process.exit(1);
    }
    warn(`${label} không hoàn tất: ${tail}`);
  }
  return r.ok;
};

// ---- Backend tạm cho các bước cần API --------------------------------------------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const apiUp = async () => {
  try {
    return (await fetch(`${BASE}/contests`, { signal: AbortSignal.timeout(3000) })).ok;
  } catch {
    return false;
  }
};

async function ensureBackend() {
  if (await apiUp()) return { started: false, proc: null };
  const dist = path.join(BE, 'dist', 'main.js');
  if (!fs.existsSync(dist)) {
    say(C.skip, 'Backend chưa build: đang build (npm --prefix BE run build)...');
    if (!runNpm(['--prefix', 'BE', 'run', 'build']).ok) return null;
  }
  say(C.skip, `Backend chưa chạy ở ${BASE}: bật tạm để seed (sẽ tự tắt khi xong)...`);
  const proc = spawn(process.execPath, [dist], { cwd: BE, stdio: 'ignore', env: { ...process.env, PORT } });
  for (let i = 0; i < 60; i++) {
    await sleep(2000);
    if (await apiUp()) return { started: true, proc };
  }
  proc.kill();
  return null;
}

(async () => {
  console.log(`${C.h}CyberSoft Learning Hub: MASTER SEED${CLEAN ? ' (--clean)' : ''}\x1b[0m`);
  const mongoose = require(path.join(BE, 'node_modules', 'mongoose'));
  const bcrypt = require(path.join(BE, 'node_modules', 'bcrypt'));
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  } catch (e) {
    console.error(`${C.bad} Không kết nối được MongoDB (${String(e.message).split('\n')[0]}). Bật MongoDB/Docker rồi chạy lại.`);
    process.exit(1);
  }
  const db = mongoose.connection.db;
  const users = db.collection('users');
  const classes = db.collection('classrooms');
  const now = new Date();
  const idStr = (x) => String(x);
  let backend = null;

  try {
    // ---- 0. Dọn dữ liệu seed (chỉ khi --clean) ---------------------------------------------------------------------------------
    if (CLEAN) {
      step('0/8', 'Dọn dữ liệu seed mẫu');
      const seedAllUsers = (await users.find({ [FLAG]: true }, { projection: { _id: 1 } }).toArray()).map((u) => idStr(u._id));
      const seedAllContests = (await db.collection('contests').find({ [FLAG]: true }, { projection: { _id: 1 } }).toArray()).map((c) => idStr(c._id));
      if (seedAllContests.length) {
        await db.collection('contest_attempts').deleteMany({ contestId: { $in: seedAllContests } });
        await db.collection('contest_submissions').deleteMany({ contestId: { $in: seedAllContests } });
        await db.collection('contests').deleteMany({ [FLAG]: true });
      }
      await classes.deleteMany({ [FLAG]: true });
      if (seedAllUsers.length) {
        await db.collection('block_puzzle_progress').deleteMany({ userId: { $in: seedAllUsers } });
        await classes.updateMany({}, { $pull: { studentIds: { $in: seedAllUsers } } });
        await users.deleteMany({ [FLAG]: true });
      }
      for (const [label, file] of [['teacher-default', 'seed-teacher-default.js'], ['career-certificate-demo', 'seed-career-certificate-demo.js'], ['career-adult', 'seed-career-adult.js'], ['contests', 'seed-contests.js'], ['kid-leaderboard', 'seed-kid-leaderboard.js'], ['class', 'seed-class.js']]) {
        const r = runScript(file, ['--remove']);
        say(r.ok ? C.ok : C.skip, `gỡ dữ liệu ${label}${r.ok ? '' : ' (bỏ qua: cần backend hoặc không có gì để gỡ)'}`);
      }
      say(C.ok, `gỡ nhãn khối đã gắn: ${await removeTags(db)} bài`);
    }

    // ---- 1. Nền ----------------------------------------------------------------------------------------------------------------
    step('1/8', 'Dữ liệu nền (BE seed gốc)');
    const counts = {};
    for (const name of ['users', 'exercises', 'questions']) counts[name] = await db.collection(name).countDocuments();
    if (h.needsSeed(counts)) {
      for (const s of ['seed', 'seed:exercises', 'seed:quiz', 'seed:contests']) {
        const r = runNpm(['--prefix', 'BE', 'run', s]);
        if (!r.ok) {
          say(C.bad, `npm run ${s} thất bại: ${r.out.split('\n').slice(-3).join(' | ')}`);
          process.exit(1);
        }
        say(C.ok, `npm run ${s}`);
      }
    } else {
      say(C.skip, `CSDL đã có dữ liệu (${Object.entries(counts).map(([k, v]) => `${k}: ${v}`).join(', ')}): giữ nguyên, chỉ bổ sung phần còn thiếu`);
    }

    // ---- 2. Tài khoản chuẩn ----------------------------------------------------------------------------------------------------
    step('2/8', 'Tài khoản chuẩn (mật khẩu 123456)');
    const core = [
      ['admin@gmail.com', 'Nguyễn Kim Thượng', 'ADMIN', undefined],
      [TEACHER_EMAIL, 'Thầy Hoàng Nam', 'TEACHER', undefined],
      ['student@gmail.com', 'Học viên Demo', 'STUDENT', '10-12'],
    ];
    for (const [email, fullName, role, ageGroup] of core) {
      const existing = await users.findOne({ email });
      const hash = await bcrypt.hash(PASSWORD, 10);
      if (!existing) {
        await users.insertOne({ email, fullName, role, ...(ageGroup ? { ageGroup } : {}), password: hash, status: 'ACTIVE', phone: '', bio: '', [FLAG]: true, createdAt: now, updatedAt: now });
        say(C.ok, `${email} (${role}): đã tạo`);
      } else {
        // Chỉ ép mật khẩu chuẩn khi --clean hoặc tài khoản do seed tạo; không đổi mật khẩu người dùng thật.
        if (CLEAN || existing[FLAG]) await users.updateOne({ _id: existing._id }, { $set: { password: hash, status: 'ACTIVE', role } });
        say(C.skip, `${email} (${role}): đã có`);
      }
    }

    // ---- 3. Ma trận, lớp, học viên, bài theo Ngày -------------------------------------------------------------------------------
    step('3/8', 'Lớp học chuẩn, học viên K6-9 / K10-12 và bài theo Ngày 1..5');
    script('Ma trận bài mẫu theo nhóm (seed-matrix)', 'seed-matrix.js');
    script('Lớp K3-5 / K6-9 / K10-12 / Tester QA / Data Lab / AI Lab + học viên + bài theo Ngày (seed-class)', 'seed-class.js', [], { fatal: true });

    // ---- 4. Bảng vinh danh K3-5 ------------------------------------------------------------------------------------------------
    step('4/8', 'Bảng vinh danh K3-5 và bé Dương Chí Việt (14 sao)');
    script('Bé mẫu phá đảo Block Puzzle (seed-kid-leaderboard)', 'seed-kid-leaderboard.js');
    await seedViet({ db, users, classes, now, FLAG });

    // ---- 5. Cuộc thi -----------------------------------------------------------------------------------------------------------
    step('5/8', 'Cuộc thi mẫu');
    script('4 cuộc thi mẫu có bảng xếp hạng (seed-contests)', 'seed-contests.js');
    await seedOutTabContest({ db, users, now, FLAG });

    // ---- 6. Người đi làm + dữ liệu sống của giảng viên --------------------------------------------------------------------------
    step('6/8', 'Người đi làm, hàng chờ chấm Tester QA và dữ liệu sống của teacher@gmail.com');
    if (SKIP_API) warn('--skip-api: bỏ qua nguoidilam1/2 (cần backend); hàng chờ Tester QA có thể thiếu 2 bài chờ chấm.');
    else {
      backend = await ensureBackend();
      if (!backend) warn('Không bật được backend: bỏ qua nguoidilam1/2. Chạy `npm run build --prefix BE` rồi `npm run seed` lại.');
      else {
        script('Tài khoản Người đi làm mẫu nguoidilam1 (seed-career-adult)', 'seed-career-adult.js');
        script('Tài khoản chứng chỉ mẫu nguoidilam2 (seed-career-certificate-demo)', 'seed-career-certificate-demo.js');
      }
    }
    script('Dữ liệu sống của giảng viên: 4 lớp, K3-5 12/9/15 sao, out-tab, Tester QA 2 bài chờ + rubric 40/30/30 (seed-teacher-default)', 'seed-teacher-default.js', [], { fatal: true });

    // teacher@gmail.com cũng phụ trách khóa Data Lab và AI Lab (cạnh Tester QA) để thấy đủ 6 lớp + 1 lớp Lưu trữ.
    {
      const teacher = await users.findOne({ email: TEACHER_EMAIL });
      if (teacher) {
        const r = await classes.updateMany({ code: { $in: ['CL-CAREER-DATA', 'CL-CAREER-AI'] } }, { $addToSet: { teacherIds: idStr(teacher._id) }, $set: { updatedAt: now } });
        say(C.ok, `teacher@gmail.com phụ trách thêm Data Lab / AI Lab (${r.matchedCount} lớp)`);
      }
    }

    // ---- 7. Lớp lưu trữ --------------------------------------------------------------------------------------------------------
    step('7/8', 'Lớp Lưu trữ mẫu');
    await seedArchivedClass({ users, classes, now, FLAG });

    // ---- 8. Phân loại Ngân hàng đề ---------------------------------------------------------------------------------------------
    step('8/8', 'Phân loại bài tập của Ngân hàng đề theo khối');
    const s = await classifyAll(db);
    say(C.ok, `${s.total} bài code: Khối 6–9 = ${s.byBand['6-9']}, Khối 10–12 = ${s.byBand['10-12']}; gắn mới ${s.tagged}, đã có ${s.alreadyTagged}; chưa phân loại: ${s.unclassified}`);
    if (s.unclassified > 0) warn(`Còn ${s.unclassified} bài chưa phân loại.`);

    console.log(`\n${C.h}Xong.\x1b[0m${warnings.length ? ` ${C.warn} ${warnings.length} cảnh báo ở trên.` : ''}`);
    console.log(`Đăng nhập (mật khẩu ${PASSWORD}): admin@gmail.com | teacher@gmail.com | student@gmail.com`);
    console.log('Chạy lại `npm run seed` bất cứ lúc nào: không nhân bản dữ liệu. `npm run seed:clean` để dọn và nạp lại.');
  } finally {
    if (backend?.proc) backend.proc.kill();
    await mongoose.disconnect();
  }
})().catch((e) => {
  console.error(`${C.bad} seed lỗi: ${e.stack || e.message}`);
  process.exitCode = 1;
});

// ======================================================================================================================================
// Bé Dương Chí Việt: 14 sao (14 màn Block Puzzle đã qua), học lớp K3-5. Tài khoản thật (nếu đã có) được giữ nguyên.
// ======================================================================================================================================
const VIET_LEVELS = [
  ['blockly-maze', 'blockly-maze-level-1'], ['blockly-maze', 'blockly-maze-level-2'], ['blockly-maze', 'blockly-maze-level-3'], ['robot-ve-nha', 'block-robot-ve-nha-1'],
  ['blockly-turtle', 'blockly-turtle-level-1'], ['blockly-maze', 'blockly-maze-level-4'], ['blockly-maze', 'blockly-maze-level-5'], ['blockly-maze', 'blockly-maze-level-6'],
  ['blockly-maze', 'blockly-maze-level-7'], ['blockly-maze', 'blockly-maze-level-8'], ['blockly-maze', 'blockly-maze-level-9'], ['blockly-maze', 'blockly-maze-level-10'],
  ['blockly-bird', 'blockly-bird-level-1'], ['blockly-bird', 'blockly-bird-level-2'],
];

async function seedViet({ db, users, classes, now, FLAG }) {
  let viet = await users.findOne({ fullName: /Dương Chí Việt/i, ageGroup: '3-5' });
  if (!viet) {
    const bcrypt = require(path.join(BE, 'node_modules', 'bcrypt'));
    const doc = { email: 'duongchiviet@demo.cybersoft.local', fullName: 'Dương Chí Việt', role: 'STUDENT', ageGroup: '3-5', password: await bcrypt.hash(PASSWORD, 10), status: 'ACTIVE', phone: '', bio: '', [FLAG]: true, createdAt: now, updatedAt: now };
    const r = await users.updateOne({ email: doc.email }, { $setOnInsert: doc }, { upsert: true });
    viet = await users.findOne({ email: doc.email });
    say(C.ok, `Bé Dương Chí Việt: ${r.upsertedCount ? 'đã tạo' : 'đã có'} (${doc.email})`);
  } else say(C.skip, `Bé Dương Chí Việt: dùng tài khoản đã có (${viet.email})`);
  const uid = idStr(viet._id);
  const progress = db.collection('block_puzzle_progress');
  for (const [gameId, lessonSlug] of VIET_LEVELS) {
    await progress.updateOne({ userId: uid, lessonSlug }, { $setOnInsert: { userId: uid, lessonSlug, gameId, completedAt: now, createdAt: now, updatedAt: now } }, { upsert: true });
  }
  const kidClass = await classes.findOne({ ageGroup: '3-5', courseKey: { $exists: false }, archived: { $ne: true } }, { sort: { createdAt: 1 } });
  if (kidClass) await classes.updateOne({ _id: kidClass._id }, { $addToSet: { studentIds: uid } });
  say(C.ok, `Dương Chí Việt: ${await progress.countDocuments({ userId: uid })} màn đã qua (14 sao)${kidClass ? `, lớp ${kidClass.code}` : ''}`);
}

function idStr(x) {
  return String(x);
}

// ======================================================================================================================================
// Cuộc thi mẫu có học viên out-tab (để thử "Không công nhận kết quả"): Khối 6-9, đang diễn ra, 3 thí sinh out-tab 4 / 1 / 0 lần.
// ======================================================================================================================================
async function seedOutTabContest({ db, users, now, FLAG }) {
  const teacher = await users.findOne({ email: TEACHER_EMAIL });
  const exercise = await db.collection('exercises').findOne({ slug: 'tinh-tong-hai-so-nguyen' }) || (await db.collection('exercises').findOne({ type: 'CODE_TEXT', resource_id: { $exists: false }, gradeBand: '6-9' }));
  const students = await users.find({ email: { $in: [1, 2, 3].map((i) => `seed-class-6-9-${i}@demo.cybersoft.local`) } }).sort({ email: 1 }).toArray();
  if (!teacher || !exercise || students.length < 3) return warn('Thiếu giảng viên/bài/học viên K6-9: bỏ qua cuộc thi mẫu có out-tab.');
  const slug = 'seed-contest-k69-out-tab';
  const contest = {
    title: 'Cuộc thi mẫu K6-9 (có học viên out-tab)',
    slug,
    description: 'Cuộc thi mẫu để thử bảng giám sát, hạng chính thức và "Không công nhận kết quả".',
    startTime: new Date(now.getTime() - 24 * 3600_000),
    endTime: new Date('2099-12-31T23:59:59.000Z'),
    durationMinutes: 60,
    problems: [{ source: 'exercise', exerciseSlug: exercise.slug, slug: exercise.slug, title: exercise.title, type: 'coding', points: 100, order: 1 }],
    registrations: students.map((s) => ({ studentId: idStr(s._id), studentName: s.fullName, registeredAt: now })),
    status: 'published',
    authorId: idStr(teacher._id),
    integrityEnabled: true,
    gradeBand: '6-9',
    [FLAG]: true,
  };
  await db.collection('contests').updateOne({ slug }, { $set: { ...contest, updatedAt: now }, $setOnInsert: { createdAt: now } }, { upsert: true });
  const cid = idStr((await db.collection('contests').findOne({ slug }))._id);
  const plan = [
    { s: students[0], leaves: 4, score: 100, minutes: 18 },
    { s: students[1], leaves: 1, score: 60, minutes: 25 },
    { s: students[2], leaves: 0, score: 80, minutes: 31 },
  ];
  for (const p of plan) {
    const sid = idStr(p.s._id);
    const startedAt = new Date(now.getTime() - 3 * 3600_000);
    const finishedAt = new Date(startedAt.getTime() + p.minutes * 60_000);
    await db.collection('contest_attempts').updateOne(
      { contestId: cid, studentId: sid },
      { $set: { studentName: p.s.fullName, startedAt, deadlineAt: new Date(startedAt.getTime() + 60 * 60_000), finishedAt, finishReason: 'MANUAL', leaveCount: p.leaves, updatedAt: now }, $setOnInsert: { createdAt: now } },
      { upsert: true },
    );
    await db.collection('contest_submissions').updateOne(
      { contestId: cid, studentId: sid, problemSlug: exercise.slug },
      { $set: { problemType: 'coding', studentName: p.s.fullName, code: 'print(sum(map(int, input().split())))', score: p.score, maxPoints: 100, verdict: p.score === 100 ? 'AC' : 'PARTIAL', passedCount: p.score === 100 ? 5 : 3, totalCount: 5, submittedAt: finishedAt, isLate: false, updatedAt: now }, $setOnInsert: { createdAt: now } },
      { upsert: true },
    );
  }
  say(C.ok, `Cuộc thi mẫu "${contest.title}": 3 thí sinh, out-tab 4 / 1 / 0 lần`);
}

async function seedArchivedClass({ users, classes, now, FLAG }) {
  const teacher = await users.findOne({ email: TEACHER_EMAIL });
  if (!teacher) return;
  const tid = idStr(teacher._id);
  const student = await users.findOne({ email: 'seed-class-6-9-1@demo.cybersoft.local' });
  await classes.updateOne(
    { code: 'CL-ARCHIVED-69' },
    {
      $set: { name: 'Python Căn bản khóa cũ (K6-9, Lưu trữ)', description: 'Lớp mẫu đã lưu trữ.', ageGroup: '6-9', archived: true, teacherId: tid, [FLAG]: true, updatedAt: now },
      $addToSet: { teacherIds: tid, ...(student ? { studentIds: idStr(student._id) } : {}) },
      $setOnInsert: { exerciseSlugs: [], createdAt: now },
    },
    { upsert: true },
  );
  say(C.ok, 'Lớp Lưu trữ mẫu CL-ARCHIVED-69');
}
