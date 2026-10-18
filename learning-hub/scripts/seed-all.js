#!/usr/bin/env node
/**
 * MASTER SEED: một lệnh duy nhất dựng môi trường chuẩn cho Tester, chạy lại bao nhiêu lần cũng KHÔNG nhân bản dữ liệu (idempotent).
 *
 *   npm run seed            # tạo/cập nhật mọi dữ liệu mẫu
 *   npm run seed:clean      # dọn sạch dữ liệu seed mẫu rồi nạp lại từ đầu (không đụng dữ liệu thật)
 *
 * Thứ tự (mỗi bước là một script con hoặc một hàm trong file này):
 *   1. Nền: CSDL còn trống thì nạp seed gốc của BE (người dùng, bài tập, câu hỏi, cuộc thi mẫu). CSDL đã có dữ liệu thì GIỮ NGUYÊN.
 *   2. Tài khoản chuẩn của Tester (scripts/lib/seed-standard-data.js, mật khẩu = DEFAULT_SEED_PASSWORD trong BE/.env):
 *      admin@gmail.com, teacher@gmail.com, teacher3-5 / teacher6-9 / teacher10-12@gmail.com, lop3-5 / lop6-9 / lop10-12@gmail.com,
 *      duongchiviet2004@gmail.com (K3-5), student@gmail.com.
 *   3. Ma trận bài mẫu, lớp học chuẩn + học viên K3-5 / K6-9 / K10-12 + bài theo Ngày 1..5 (seed-class).
 *   4. Bảng vinh danh K3-5 (seed-kid-leaderboard) và bé Dương Chí Việt 14 sao.
 *   5. Cuộc thi mẫu có xếp hạng (seed-contests) + 1 cuộc thi mẫu có học viên out-tab để thử "Không công nhận kết quả".
 *   6. Người đi làm (nguoidilam1/2: cần backend; script tự bật backend tạm nếu chưa chạy), rồi dữ liệu sống của teacher@gmail.com
 *      (seed-teacher-default): gán 4 lớp, K3-5 12/9/15 sao, daicagovap out-tab, hàng chờ Tester QA 2 bài + các bài đã chấm rubric 40/30/30.
 *   7. Giảng viên khối phụ trách lớp (CL-35KID01 / CL-69PY01 / CL-1012A1), ghi danh học viên chuẩn, Ngân hàng đề (bài code +
 *      câu trắc nghiệm bankOnly theo khối 6-9 / 10-12) và test case cho bài demo-dash-ex-* của Playground.
 *   8. Lớp Lưu trữ mẫu.
 *   9. Phân loại bài tập của Ngân hàng đề theo khối (classify-existing-exercises): K6_9 / K10_12, không còn bài chưa phân loại.
 *
 * Tùy chọn: --clean, --skip-api (không dùng backend: bỏ bước người đi làm), --verbose (in toàn bộ log của script con).
 */
const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const h = require('./lib/setup-helpers');
const { classifyAll, removeTags } = require('./classify-existing-exercises');
const { repairAllClasses } = require('./lib/class-integrity');
const { STANDARD_ACCOUNTS, BANK_CODE, BANK_QUIZ, DEMO_DASH_CONTENT, PY_STARTER } = require('./lib/seed-standard-data');
const { normalizePlaygroundProgress } = require('./lib/playground-sequence');

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
// Mật khẩu tài khoản mẫu đọc từ DEFAULT_SEED_PASSWORD (BE/.env), không hard-code trong mã nguồn (Day 29 SEC-15).
const PASSWORD = (process.env.DEFAULT_SEED_PASSWORD || h.readEnvValue(envText, 'DEFAULT_SEED_PASSWORD') || '').trim();
if (PASSWORD.length < 6) {
  console.error('Chưa đặt DEFAULT_SEED_PASSWORD (≥ 6 ký tự) trong BE/.env: đây là mật khẩu của các tài khoản mẫu.');
  process.exit(1);
}
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
    console.error(`${C.bad} Không kết nối được MongoDB (${String(e.message).split('\n')[0]}). Bật MongoDB (hoặc kiểm tra DATABASE_URL trong BE/.env) rồi chạy lại.`);
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
      step('0/9', 'Dọn dữ liệu seed mẫu');
      const seedAllUsers = (await users.find({ [FLAG]: true }, { projection: { _id: 1 } }).toArray()).map((u) => idStr(u._id));
      const seedAllContests = (await db.collection('contests').find({ [FLAG]: true }, { projection: { _id: 1 } }).toArray()).map((c) => idStr(c._id));
      if (seedAllContests.length) {
        await db.collection('contest_attempts').deleteMany({ contestId: { $in: seedAllContests } });
        await db.collection('contest_submissions').deleteMany({ contestId: { $in: seedAllContests } });
        await db.collection('contests').deleteMany({ [FLAG]: true });
      }
      await classes.deleteMany({ [FLAG]: true });
      // Ngân hàng đề mẫu (bài code + câu trắc nghiệm) do seed tạo: gỡ cả bài giao lớp đang dùng chúng.
      const bankSlugs = (await db.collection('exercises').find({ [FLAG]: true }, { projection: { slug: 1 } }).toArray()).map((e) => e.slug);
      const bankQuizIds = (await db.collection('questions').find({ [FLAG]: true }, { projection: { _id: 1 } }).toArray()).map((q) => idStr(q._id));
      if (bankSlugs.length || bankQuizIds.length) {
        await db.collection('class_assignments').deleteMany({ $or: [{ exerciseSlug: { $in: bankSlugs } }, { questionIds: { $in: bankQuizIds } }] });
      }
      // Bài nộp mẫu (tiến độ Playground của lop6-9 / lop10-12) và mọi bài nộp mồ côi của tài khoản seed vừa bị xóa.
      const seedSubs = await db.collection('submissions').deleteMany({ $or: [{ [FLAG]: true }, { userId: { $in: seedAllUsers } }] });
      say(C.ok, `gỡ ${seedSubs.deletedCount} bài nộp mẫu / bài nộp của tài khoản seed`);
      const bankEx = await db.collection('exercises').deleteMany({ [FLAG]: true });
      const bankQ = await db.collection('questions').deleteMany({ [FLAG]: true });
      say(C.ok, `gỡ Ngân hàng đề mẫu: ${bankEx.deletedCount} bài code, ${bankQ.deletedCount} câu trắc nghiệm`);
      if (seedAllUsers.length) {
        await db.collection('block_puzzle_progress').deleteMany({ userId: { $in: seedAllUsers } });
        await users.deleteMany({ [FLAG]: true });
      }
      for (const [label, file] of [['teacher-default', 'seed-teacher-default.js'], ['career-certificate-demo', 'seed-career-certificate-demo.js'], ['career-adult', 'seed-career-adult.js'], ['contests', 'seed-contests.js'], ['kid-leaderboard', 'seed-kid-leaderboard.js'], ['class', 'seed-class.js']]) {
        const r = runScript(file, ['--remove']);
        say(r.ok ? C.ok : C.skip, `gỡ dữ liệu ${label}${r.ok ? '' : ' (bỏ qua: cần backend hoặc không có gì để gỡ)'}`);
      }
      // Gỡ mọi tham chiếu tới tài khoản vừa xóa: cả studentIds lẫn teacherIds/teacherId (trước đây chỉ gỡ studentIds nên sinh id "ma").
      say(C.ok, `toàn vẹn lớp sau khi dọn: sửa ${await repairAllClasses(db)} lớp`);
      say(C.ok, `gỡ nhãn khối đã gắn: ${await removeTags(db)} bài`);
    }

    // ---- 1. Nền ----------------------------------------------------------------------------------------------------------------
    step('1/9', 'Dữ liệu nền (BE seed gốc)');
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
    // 3 bộ đề công khai của /quiz (Python, HTML5, CSS3; 20 câu mỗi bộ): câu gốc dùng được cho cả Khối 6-9 và 10-12, để mỗi bộ đủ 20 câu ở mọi khối.
    // Dữ liệu cũ bị gắn theo độ khó (vd Python chỉ còn 6 câu cho Khối 10-12). Câu bankOnly của giảng viên giữ nguyên khối riêng.
    {
      const fixed = await db.collection('questions').updateMany(
        { bankOnly: { $ne: true }, category: { $in: ['Python', 'HTML5', 'CSS3'] }, $or: [{ gradeBands: { $exists: false } }, { gradeBands: { $size: 1 } }] },
        { $set: { gradeBands: ['6-9', '10-12'] } },
      );
      const per = await Promise.all(['Python', 'HTML5', 'CSS3'].map(async (c) => `${c} ${await db.collection('questions').countDocuments({ category: c, bankOnly: { $ne: true } })}`));
      say(C.ok, `Bộ đề công khai /quiz: ${per.join(' · ')} câu, dùng chung cho Khối 6-9 và 10-12 (chuẩn hóa ${fixed.modifiedCount} câu)`);
    }

    // ---- 2. Tài khoản chuẩn ----------------------------------------------------------------------------------------------------
    step('2/9', 'Tài khoản chuẩn (mật khẩu = DEFAULT_SEED_PASSWORD)');
    const hash = await bcrypt.hash(PASSWORD, 10);
    for (const { email, fullName, role, ageGroup } of STANDARD_ACCOUNTS) {
      const existing = await users.findOne({ email });
      if (!existing) {
        await users.insertOne({ email, fullName, role, ...(ageGroup ? { ageGroup } : {}), password: hash, status: 'ACTIVE', [FLAG]: true, createdAt: now, updatedAt: now });
        say(C.ok, `${email} (${role}${ageGroup ? ` ${ageGroup}` : ''}): đã tạo`);
      } else {
        // Vai trò/khối/trạng thái luôn đúng chuẩn Tester. Mật khẩu chỉ ép khi --clean hoặc tài khoản do seed tạo (không đổi mật khẩu người dùng thật).
        const $set = { role, status: 'ACTIVE', updatedAt: now, ...(ageGroup ? { ageGroup } : {}), ...(CLEAN || existing[FLAG] ? { password: hash } : {}) };
        await users.updateOne({ _id: existing._id }, { $set, ...(ageGroup ? {} : { $unset: { ageGroup: 1 } }) });
        say(C.skip, `${email} (${role}${ageGroup ? ` ${ageGroup}` : ''}): đã có${$set.password ? ', đặt lại mật khẩu chuẩn' : ''}`);
      }
    }

    // ---- 3. Ma trận, lớp, học viên, bài theo Ngày -------------------------------------------------------------------------------
    step('3/9', 'Lớp học chuẩn, học viên K6-9 / K10-12 và bài theo Ngày 1..5');
    script('Ma trận bài mẫu theo nhóm (seed-matrix)', 'seed-matrix.js');
    script('Lớp K3-5 / K6-9 / K10-12 / Tester QA / Data Lab / AI Lab + học viên + bài theo Ngày (seed-class)', 'seed-class.js', [], { fatal: true });

    // ---- 4. Bảng vinh danh K3-5 ------------------------------------------------------------------------------------------------
    step('4/9', 'Bảng vinh danh K3-5 và bé Dương Chí Việt (14 sao)');
    script('Bé mẫu phá đảo Block Puzzle (seed-kid-leaderboard)', 'seed-kid-leaderboard.js');
    await seedViet({ db, users, classes, now, FLAG });

    // ---- 5. Cuộc thi -----------------------------------------------------------------------------------------------------------
    step('5/9', 'Cuộc thi mẫu');
    script('4 cuộc thi mẫu có bảng xếp hạng (seed-contests)', 'seed-contests.js');
    await seedOutTabContest({ db, users, now, FLAG });

    // ---- 6. Người đi làm + dữ liệu sống của giảng viên --------------------------------------------------------------------------
    step('6/9', 'Người đi làm, hàng chờ chấm Tester QA và dữ liệu sống của teacher@gmail.com');
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

    // ---- 7. Giảng viên khối, học viên chuẩn, Ngân hàng đề -----------------------------------------------------------------------
    step('7/9', 'Giảng viên khối phụ trách lớp, ghi danh học viên chuẩn, Ngân hàng đề theo khối');
    await seedStandardClasses({ users, classes, now });
    await seedQuestionBank({ db, users, now, FLAG });
    await seedDemoDashContent({ db, now });
    await seedPlaygroundProgress({ db, users, now, FLAG });
    // Tiến độ Playground cũ nhảy cóc (do lỗi khóa tuần tự bị tắt khi trộn chủ đề): gắn cờ, không xóa bài nộp nào (xem migrate-day31.js).
    const seq = await normalizePlaygroundProgress(db);
    say(C.ok, `Chuẩn hóa tiến độ Playground cũ: ${seq.students} học viên có bài nộp nhảy cóc (${seq.flagged} bài nộp gắn cờ outOfSequence, vẫn còn trong lịch sử)${seq.details.length ? ' - ' + seq.details.map((d) => d.email).join(', ') : ''}`);

    // ---- 8. Lớp lưu trữ --------------------------------------------------------------------------------------------------------
    step('8/9', 'Lớp Lưu trữ mẫu');
    await seedArchivedClass({ users, classes, now, FLAG });

    // ---- 9. Phân loại Ngân hàng đề ---------------------------------------------------------------------------------------------
    step('9/9', 'Phân loại bài tập của Ngân hàng đề theo khối');
    const s = await classifyAll(db);
    say(C.ok, `${s.total} bài code: Khối 6–9 = ${s.byBand['6-9']}, Khối 10–12 = ${s.byBand['10-12']}; gắn mới ${s.tagged}, đã có ${s.alreadyTagged}; chưa phân loại: ${s.unclassified}`);
    if (s.unclassified > 0) warn(`Còn ${s.unclassified} bài chưa phân loại.`);

    // Chốt cuối: không lớp nào còn id giảng viên/học viên "ma"; giảng viên/Admin không mang khối học.
    const fixed = await repairAllClasses(db);
    const noAge = await users.updateMany({ role: { $ne: 'STUDENT' }, ageGroup: { $exists: true } }, { $unset: { ageGroup: 1 } });
    // Tối thiểu hóa dữ liệu trẻ em (Day 29 SEC-19 / PRV-01): học viên Lớp 3-5 không lưu phone/bio, kể cả tài khoản do script seed con tạo.
    const kidPii = await users.updateMany({ role: 'STUDENT', ageGroup: '3-5', $or: [{ phone: { $exists: true } }, { bio: { $exists: true } }] }, { $unset: { phone: 1, bio: 1 } });
    say(C.ok, `Toàn vẹn dữ liệu: sửa ${fixed} lớp có id "ma", bỏ khối học của ${noAge.modifiedCount} tài khoản không phải học viên, bỏ phone/bio của ${kidPii.modifiedCount} bé Lớp 3-5`);

    console.log(`\n${C.h}Xong.\x1b[0m${warnings.length ? ` ${C.warn} ${warnings.length} cảnh báo ở trên.` : ''}`);
    console.log(`Đăng nhập (mật khẩu = DEFAULT_SEED_PASSWORD trong BE/.env):`);
    for (const a of STANDARD_ACCOUNTS) console.log(`  ${a.email.padEnd(28)} ${a.role}${a.ageGroup ? ` ${a.ageGroup}` : ''}${a.classCode ? ` · ${a.classCode}` : ''}`);
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

const VIET_EMAIL = 'duongchiviet2004@gmail.com';
const KID_CLASS_CODE = 'CL-35KID01';

async function seedViet({ db, users, classes, now }) {
  // Tài khoản được tạo/chuẩn hóa ở bước 2 (STANDARD_ACCOUNTS).
  const viet = await users.findOne({ email: VIET_EMAIL });
  if (!viet) return warn(`Thiếu tài khoản ${VIET_EMAIL}: bỏ qua 14 sao.`);
  const uid = idStr(viet._id);
  const progress = db.collection('block_puzzle_progress');
  for (const [gameId, lessonSlug] of VIET_LEVELS) {
    await progress.updateOne({ userId: uid, lessonSlug }, { $setOnInsert: { userId: uid, lessonSlug, gameId, completedAt: now, createdAt: now, updatedAt: now } }, { upsert: true });
  }
  // Làm mới mốc hoàn thành: $setOnInsert không đổi dòng đã có, nên sau 3 ngày bé bị coi là "kẹt" (STUCK_ALERT) và chen lên đầu bảng giảng viên,
  // trong khi ca kẹt có chủ đích là bé Minh Khang. Bé Việt là ca "đang chơi đều" (14 sao vinh danh): giữ lần chơi gần nhất trong vòng 1 ngày.
  const staleBefore = new Date(now.getTime() - 24 * 3600_000);
  await progress.updateMany({ userId: uid, completedAt: { $lt: staleBefore } }, { $set: { completedAt: new Date(now.getTime() - 3600_000), updatedAt: now } });
  const kidClass = await classes.findOne({ code: KID_CLASS_CODE });
  if (kidClass) await classes.updateOne({ _id: kidClass._id }, { $addToSet: { studentIds: uid } });
  say(C.ok, `Dương Chí Việt (${VIET_EMAIL}): ${await progress.countDocuments({ userId: uid })} màn đã qua (14 sao)${kidClass ? `, lớp ${kidClass.code}` : ''}`);
}

// ======================================================================================================================================
// Giảng viên khối là giảng viên CHÍNH của lớp đúng khối (thay giảng viên mẫu của seed-class; teacher@gmail.com vẫn đồng phụ trách),
// học viên chuẩn được ghi danh vào lớp đúng khối.
// ======================================================================================================================================
async function seedStandardClasses({ users, classes, now }) {
  for (const a of STANDARD_ACCOUNTS.filter((x) => x.classCode)) {
    const [u, cls] = await Promise.all([users.findOne({ email: a.email }), classes.findOne({ code: a.classCode })]);
    if (!u || !cls) {
      warn(`Thiếu ${!u ? `tài khoản ${a.email}` : `lớp ${a.classCode}`}: bỏ qua phân lớp.`);
      continue;
    }
    const uid = idStr(u._id);
    if (a.role === 'TEACHER') {
      const current = [...new Set([...(cls.teacherIds || []), cls.teacherId].filter(Boolean).map(String))];
      const demo = new Set((await users.find({ isSeedClassDemo: true, role: 'TEACHER' }, { projection: { _id: 1 } }).toArray()).map((x) => idStr(x._id)));
      const next = [uid, ...current.filter((id) => id !== uid && !demo.has(id))];
      await classes.updateOne({ _id: cls._id }, { $set: { teacherId: uid, teacherIds: next, updatedAt: now } });
      say(C.ok, `${a.email} phụ trách chính ${cls.code} (${next.length} giảng viên)`);
    } else {
      await classes.updateOne({ _id: cls._id }, { $addToSet: { studentIds: uid }, $set: { updatedAt: now } });
      say(C.ok, `${a.email} học lớp ${cls.code}`);
    }
  }
}

// Nhãn phân loại theo khối, giống bankLabels() của BE (exercise-matrix.ts).
const BANK_LABELS = {
  '6-9': { targetGroup: 'K6_9', labType: 'PYTHON_CODE', gradeBand: '6-9' },
  '10-12': { targetGroup: 'K10_12', labType: 'ALGO_JUDGE', gradeBand: '9-12' },
};
const BAND_TEACHER = { '6-9': 'teacher6-9@gmail.com', '10-12': 'teacher10-12@gmail.com' };
const POINTS = { EASY: 10, MEDIUM: 20, HARD: 30 };

// ======================================================================================================================================
// Ngân hàng đề theo khối: bài code + câu trắc nghiệm bankOnly (không lộ ra Playground / /quiz tự luyện), tác giả là giảng viên khối.
// Nội dung chỉ ghi khi tạo mới (chạy lại không đè chỉnh sửa của giảng viên); phân loại/cờ luôn được chuẩn hóa.
// ======================================================================================================================================
async function seedQuestionBank({ db, users, now, FLAG }) {
  const authors = {};
  for (const [band, email] of Object.entries(BAND_TEACHER)) {
    const t = await users.findOne({ email });
    if (t) authors[band] = idStr(t._id);
  }
  const exercises = db.collection('exercises');
  for (const e of BANK_CODE) {
    await exercises.updateOne(
      { slug: e.slug },
      {
        $set: { bankOnly: true, bankBand: e.band, ...BANK_LABELS[e.band], ...(authors[e.band] ? { authorId: authors[e.band] } : {}), [FLAG]: true, updatedAt: now },
        $setOnInsert: {
          slug: e.slug, title: e.title, description: e.description, type: 'CODE_TEXT', difficulty: e.difficulty, points: POINTS[e.difficulty],
          starterCode: PY_STARTER, solutionCode: e.solution, timeLimitMs: 2000, memoryLimitMb: 128, testCases: e.testCases, hiddenTestCases: [], tags: e.tags, createdAt: now,
        },
      },
      { upsert: true },
    );
  }
  const questions = db.collection('questions');
  for (const q of BANK_QUIZ) {
    await questions.updateOne(
      { seedKey: q.seedKey },
      {
        $set: { bankOnly: true, gradeBands: [q.band], ...(authors[q.band] ? { authorId: authors[q.band] } : {}), [FLAG]: true, updatedAt: now },
        $setOnInsert: {
          seedKey: q.seedKey, content: q.content, ...(q.codeSnippet ? { codeSnippet: q.codeSnippet } : {}), options: q.options, explanation: q.explanation,
          difficulty: q.difficulty, category: q.category, points: 10, tags: [], createdAt: now,
        },
      },
      { upsert: true },
    );
  }
  for (const band of ['6-9', '10-12']) {
    const [codes, quiz] = await Promise.all([exercises.countDocuments({ bankOnly: true, bankBand: band }), questions.countDocuments({ bankOnly: true, gradeBands: band })]);
    say(C.ok, `Ngân hàng đề Khối ${band}: ${codes} bài code, ${quiz} câu trắc nghiệm (tác giả ${BAND_TEACHER[band]})`);
  }
}

// ======================================================================================================================================
// Tiến độ Playground mẫu: học viên chuẩn đã hoàn thành (AC) đúng k bài ĐẦU của lộ trình, liên tục #1..#k, để bài #(k+1) vừa mở khóa.
// TUYỆT ĐỐI không seed nhảy cóc (vd xong #3 khi #1, #2 chưa làm): mở khóa tuần tự yêu cầu #1..#(k-1) đã xong mới tới #k.
// Lộ trình = cùng bộ lọc với BE (BE/src/modules-api/exercise/playground-catalog.ts): chủ đề của khối + orderInTopic, không bankOnly / SQL / Lab.
// ======================================================================================================================================
const TRACK = { '6-9': { topic: 'python-fundamentals', grades: ['6-9'] }, '10-12': { topic: 'algorithm-contest-prep', grades: ['9-12', '10-12'] } };

async function seedPlaygroundProgress({ db, users, now, FLAG }) {
  const submissions = db.collection('submissions');
  for (const a of STANDARD_ACCOUNTS.filter((x) => x.playgroundDone)) {
    const u = await users.findOne({ email: a.email });
    const t = TRACK[a.ageGroup];
    if (!u || !t) continue;
    const track = await db
      .collection('exercises')
      .find({
        type: 'CODE_TEXT', topic: t.topic, orderInTopic: { $gte: 1 }, gradeBand: { $in: t.grades },
        bankOnly: { $ne: true }, resource_id: { $exists: false }, tags: { $nin: ['sql', 'da-lab', 'ai-lab', 'tester-lab'] },
      })
      .sort({ orderInTopic: 1, slug: 1 })
      .toArray();
    if (track.length < a.playgroundDone) {
      warn(`Lộ trình ${a.ageGroup} chỉ có ${track.length} bài: không seed tiến độ Playground cho ${a.email}.`);
      continue;
    }
    const uid = idStr(u._id);
    // Ghi lại từ đầu phần tiến độ do seed tạo (luôn đúng #1..#k); bài nộp thật của học viên không bị đụng tới.
    await submissions.deleteMany({ userId: uid, [FLAG]: true });
    const done = track.slice(0, a.playgroundDone);
    for (const [i, ex] of done.entries()) {
      const total = (ex.testCases || []).length + (ex.hiddenTestCases || []).length;
      const at = new Date(now.getTime() - (done.length - i) * 3600_000);
      await submissions.insertOne({
        exerciseId: idStr(ex._id), userId: uid, code: ex.solutionCode || '# lời giải mẫu', status: 'AC', passedCount: total, totalCount: total, results: [],
        [FLAG]: true, createdAt: at, updatedAt: at,
      });
    }
    say(C.ok, `${a.email}: đã hoàn thành ${done.length}/${track.length} bài đầu lộ trình Playground (${done.map((_, i) => `#${i + 1}`).join(', ')}); bài #${done.length + 1} đang mở`);
  }
}

// Bài demo-dash-ex-* (bài mẫu của Teacher Dashboard, đang có bài nộp) KHÔNG thuộc lộ trình Playground (không topic + thứ tự) nhưng vẫn mở được qua bài giao: bổ sung đề + test case cho đủ.
async function seedDemoDashContent({ db, now }) {
  let n = 0;
  for (const [slug, c] of Object.entries(DEMO_DASH_CONTENT)) {
    const r = await db.collection('exercises').updateOne(
      { slug, $or: [{ testCases: { $exists: false } }, { testCases: { $size: 0 } }] },
      { $set: { description: c.description, starterCode: PY_STARTER, solutionCode: c.solution, testCases: c.testCases, timeLimitMs: 2000, memoryLimitMb: 128, updatedAt: now } },
    );
    n += r.modifiedCount;
  }
  const empty = await db.collection('exercises').countDocuments({ type: 'CODE_TEXT', resource_id: { $exists: false }, bankOnly: { $ne: true }, $or: [{ testCases: { $exists: false } }, { testCases: { $size: 0 } }] });
  say(C.ok, `Bài demo-dash-ex-*: bổ sung test case cho ${n} bài; bài Playground còn thiếu test case: ${empty}`);
  if (empty > 0) warn(`Còn ${empty} bài code của Playground không có test case.`);
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
