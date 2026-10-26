#!/usr/bin/env node
/**
 * Audit chức năng qua HTTP THẬT vào backend đang chạy (mặc định http://localhost:3000/api). CHỈ ĐỌC (GET).
 * Token được ký cục bộ bằng JWT_SECRET trong BE/.env cho các tài khoản có sẵn (không cần mật khẩu, không in ra token).
 *   node scripts/audit-live-api.js [--base=http://localhost:3000/api]
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
  const U = db.collection('users');

  const tokenFor = (u) => jwt.sign({ sub: String(u._id), email: u.email, role: u.role }, secret, { expiresIn: '10m' });
  const find = async (q) => U.findOne({ status: { $ne: 'LOCKED' }, ...q });
  const kid = await find({ role: 'STUDENT', ageGroup: '3-5', isSeedDemo: true });
  const s69 = await find({ email: 'seed-contest-6-9-1@demo.cybersoft.local' }) || await find({ role: 'STUDENT', ageGroup: '6-9', isSeedClassDemo: true });
  const s1012 = await find({ email: 'muoi@gmail.com' });
  const teacher = await find({ email: 'seed-teacher-1@demo.cybersoft.local' });
  const people = { kid, s69, s1012, teacher };
  for (const [k, v] of Object.entries(people)) if (!v) rec('Chuẩn bị', 'FAIL', `Không có tài khoản ${k}`);
  const tok = Object.fromEntries(Object.entries(people).filter(([, v]) => v).map(([k, v]) => [k, tokenFor(v)]));

  const call = async (who, p, opts = {}) => {
    const headers = { 'Content-Type': 'application/json', ...(who ? { Authorization: `Bearer ${tok[who]}` } : {}) };
    try {
      const r = await fetch(BASE + p, { method: opts.method || 'GET', headers, body: opts.body ? JSON.stringify(opts.body) : undefined });
      let json = null;
      try { json = await r.json(); } catch { /* không phải JSON */ }
      return { status: r.status, json };
    } catch (e) {
      return { status: 0, json: null, err: e.message };
    }
  };

  const health = await call(null, '/contests');
  if (health.status === 0) {
    console.error(`Không kết nối được backend tại ${BASE}. Hãy chạy: cd BE && npm run start:dev`);
    process.exit(2);
  }

  const contests = await db.collection('contests').find({}).toArray();
  const classes = await db.collection('classrooms').find({ code: { $in: ['CL-69PY01', 'CL-1012A1'] } }).toArray();
  const cls69 = classes.find((c) => c.code === 'CL-69PY01');
  const cls1012 = classes.find((c) => c.code === 'CL-1012A1');

  // ---------- Kid Mode ----------
  const K = 'Kid Mode 3-5';
  for (const game of ['blockly-maze', 'blockly-turtle', 'blockly-bird', 'blockly-puzzle', 'robot-ve-nha']) {
    const r = await call('kid', `/block-puzzle/leaderboard/${game}`);
    const rows = (r.json && (r.json.rows || r.json.entries || r.json.top || (Array.isArray(r.json) ? r.json : []))) || [];
    ok(K, r.status === 200 && rows.length >= 10, `Bảng vinh danh ${game}: ${rows.length} bé (Top 1-3 + danh sách 1-10)`, `Bảng vinh danh ${game}: HTTP ${r.status}, ${rows.length} dòng`);
    if (game === 'blockly-maze' && rows[0]) {
      const kidId = rows[0].userId || rows[0].id;
      if (kidId) {
        const c = await call('kid', `/block-puzzle/kids/${kidId}`);
        ok(K, c.status === 200, 'Bấm 👁️ lấy được thẻ thông tin bạn học (API /kids/:id)', `Thẻ thông tin bạn học: HTTP ${c.status}`);
      }
    }
  }
  const prog = await call('kid', '/block-puzzle/progress');
  ok(K, prog.status === 200, 'Tiến độ Block Puzzle đọc được từ DB theo tài khoản', `Tiến độ: HTTP ${prog.status}`);
  const rec2 = await call('kid', '/block-puzzle/records');
  ok(K, rec2.status === 200, 'Kỷ lục cá nhân (Giấy Khen) đọc được', `Kỷ lục: HTTP ${rec2.status}`);
  const kidOnTeacher = await call('kid', '/teacher/integrity/alerts');
  ok(K, kidOnTeacher.status === 403, 'Bé 3-5 bị chặn 403 khỏi trang giảng viên', `Bé 3-5 vào trang giảng viên: HTTP ${kidOnTeacher.status}`);

  // ---------- Lớp học ----------
  for (const [who, cls, label] of [['s69', cls69, 'Lớp 6-9'], ['s1012', cls1012, 'Lớp 10-12']]) {
    if (!cls) continue;
    const enr = await call(who, '/student/enrollments');
    const mine = (enr.json || []).find((e) => e.classId === String(cls._id));
    // s69 là tài khoản thi mẫu: chỉ kiểm tra lớp của chính họ nếu có
    if (who === 's1012') {
      ok(label, enr.status === 200 && !!mine, `Hồ sơ: lớp ${cls.code} hiện trong "Lớp học đã tham gia" (${mine && mine.status})`, `Hồ sơ không thấy lớp ${cls.code} (HTTP ${enr.status})`);
    }
    if (who === 's1012') {
      const ov = await call(who, `/student/classes/${cls._id}/overview`);
      const days = (ov.json && ov.json.days) || [];
      ok(label, ov.status === 200 && days.length >= 5, `/my-class: ${days.length} ngày, ${days.reduce((s, d) => s + d.totalCount, 0)} bài, giảng viên ${ov.json && ov.json.class && ov.json.class.teacher && ov.json.class.teacher.name}`, `/my-class overview: HTTP ${ov.status}, ${days.length} ngày`);
      const a = days.flatMap((d) => d.assignments);
      ok(label, a.length > 0 && a.every((x) => x.dueAt && x.state), 'Mọi bài đều có hạn chót và trạng thái', 'Có bài thiếu hạn chót/trạng thái');
      ok(label, a.some((x) => x.type === 'QUIZ') && a.some((x) => x.type === 'CODING'), 'Có cả bài Trắc nghiệm và Code', 'Thiếu loại bài');
      const lb = await call(who, `/student/classes/${cls._id}/leaderboard`);
      const rows = (lb.json && (lb.json.rows || lb.json)) || [];
      ok(label, lb.status === 200 && Array.isArray(rows) && rows.length >= 6, `Bảng xếp hạng lớp: ${rows.length} thành viên`, `BXH lớp: HTTP ${lb.status}`);
      const one = a.find((x) => x.type === 'CODING');
      if (one) {
        const d = await call(who, `/student/assignments/${one.id}`);
        ok(label, d.status === 200, 'Banner bài code của lớp tải được', `Banner bài lớp: HTTP ${d.status}`);
      }
      // IDOR: sang lớp khối khác
      const other = cls69;
      const idor = await call(who, `/student/classes/${other._id}/overview`);
      ok(label, idor.status === 404, 'Xem lớp khối khác bị chặn (404, không lộ lớp tồn tại)', `Xem lớp khối khác: HTTP ${idor.status}`);
    }
  }

  // ---------- Playground ----------
  const P = 'Playground';
  for (const [who, band, label, min] of [['s69', '6-9', 'Học sinh 6-9', 20], ['s1012', '10-12', 'Học sinh 10-12', 10]]) {
    const r = await call(who, '/exercises');
    const list = Array.isArray(r.json) ? r.json : [];
    const bands = new Set(list.map((e) => e.gradeBand || e.targetGroup));
    const bad = band === '6-9' ? [...bands].filter((b) => !['6-9', 'K6_9', undefined].includes(b)) : [...bands].filter((b) => !['9-12', '10-12', 'K10_12', undefined].includes(b));
    ok(P, r.status === 200 && list.length >= min && bad.length === 0, `${label}: ${list.length} bài, chỉ thuộc khối của mình`, `${label}: HTTP ${r.status}, ${list.length} bài, khối lạ: ${bad.join(',')}`);
    const slugs = list.map((e) => e.slug);
    ok(P, new Set(slugs).size === slugs.length, `${label}: không trùng slug`, `${label}: trùng slug`);
    if (list[0]) {
      const full = await call(who, `/exercises/${list[0].slug}`);
      const txt = JSON.stringify(full.json || {});
      ok(P, full.status === 200 && !/solutionCode|officialSolution|hiddenTestCases/.test(txt), `${label}: chi tiết bài không lộ đáp án/test ẩn`, `${label}: chi tiết bài có thể lộ đáp án (HTTP ${full.status})`);
    }
  }
  const sol = await call('s69', '/exercises/tinh-tong-hai-so-nguyen/full');
  ok(P, sol.status === 403 || sol.status === 401, 'Học sinh không gọi được /full (đáp án)', `/full cho học sinh: HTTP ${sol.status}`);

  // ---------- Cuộc thi ----------
  const C = 'Cuộc thi';
  const c1012 = contests.find((c) => c.gradeBand === '10-12');
  const c69 = contests.find((c) => c.gradeBand === '6-9');
  if (c1012) {
    const slug = (c1012.problems.find((p) => p.type === 'coding') || c1012.problems[0]).slug;
    const r = await call('s69', `/contests/${c1012._id}/problems/${slug}`);
    ok(C, r.status === 403, 'Học sinh 6-9 vào đề cuộc thi 10-12 bị chặn 403', `HS 6-9 xem đề cuộc thi 10-12: HTTP ${r.status}`);
    const reg = await call('s69', `/contests/${c1012._id}/my-attempt`);
    ok(C, reg.status === 403, 'Học sinh 6-9 xem lượt thi 10-12 bị chặn 403', `HS 6-9 my-attempt 10-12: HTTP ${reg.status}`);
  }
  const list = await call('s69', '/contests');
  const visible = (Array.isArray(list.json) ? list.json : []).map((c) => c.gradeBand).filter(Boolean);
  ok(C, !visible.includes('10-12'), 'Danh sách cuộc thi của HS 6-9 không lẫn cuộc thi 10-12', 'Danh sách cuộc thi HS 6-9 có cuộc thi 10-12', 'WARN');
  for (const c of contests.filter((x) => x.gradeBand)) {
    const lb = await call(null, `/contests/${c._id}/leaderboard`);
    const rows = (lb.json && lb.json.rows) || [];
    const dirty = rows.filter((r) => /[0-9a-f]{24}/i.test(r.studentName)).length;
    const sorted = rows.every((r, i) => i === 0 || rows[i - 1].totalScore > r.totalScore || (rows[i - 1].totalScore === r.totalScore && rows[i - 1].timeMinutes + rows[i - 1].penaltyMinutes <= r.timeMinutes + r.penaltyMinutes));
    ok(C, lb.status === 200 && rows.length >= 7 && dirty === 0 && sorted, `BXH "${c.title}": ${rows.length} thí sinh, đúng thứ tự điểm→thời gian, tên sạch`, `BXH "${c.title}": HTTP ${lb.status}, ${rows.length} dòng, tên bẩn ${dirty}, đúng thứ tự: ${sorted}`);
  }
  const hist = await call('s69', '/student/contest-history');
  ok(C, hist.status === 200 && Array.isArray(hist.json), `Lịch sử cuộc thi (/profile): ${Array.isArray(hist.json) ? hist.json.length : '?'} dòng`, `Lịch sử cuộc thi: HTTP ${hist.status}`);
  if (hist.json && hist.json[0]) {
    const r0 = hist.json[0];
    ok(C, r0.rank !== null && r0.totalParticipants > 0 && r0.title, `Dòng đầu: "${r0.title}" — hạng ${r0.rank}/${r0.totalParticipants}, ${r0.score}/${r0.maxScore} điểm`, 'Dòng lịch sử thiếu hạng/tổng thí sinh');
  }
  const stuLeave = await call('s69', '/proctor/leave', { method: 'POST', body: { scope: 'HACK', refId: 'x' } });
  ok(C, stuLeave.status === 400, 'Endpoint /proctor/leave từ chối scope lạ (400) mà không ghi dữ liệu', `/proctor/leave scope lạ: HTTP ${stuLeave.status}`);
  const tAlerts = await call('teacher', '/teacher/integrity/alerts');
  ok(C, tAlerts.status === 200 && Array.isArray(tAlerts.json), `Giảng viên thấy ${Array.isArray(tAlerts.json) ? tAlerts.json.length : '?'} cảnh báo rời màn hình`, `Cảnh báo giảng viên: HTTP ${tAlerts.status}`);
  const sAlerts = await call('s69', '/teacher/integrity/alerts');
  ok(C, sAlerts.status === 403, 'Học sinh không xem được cảnh báo giảng viên (403)', `Học sinh vào /teacher/integrity/alerts: HTTP ${sAlerts.status}`);

  // ---------- Hồ sơ & tiến độ ----------
  const R = 'Hồ sơ / Tiến độ';
  const act = await call('s69', '/learner/activity?days=60');
  ok(R, act.status === 200 && act.json && act.json.total > 0 && act.json.days.length > 0, `Heatmap: ${act.json && act.json.total} lượt nộp trong ${act.json && act.json.days.length} ngày có hoạt động`, `Heatmap: HTTP ${act.status}, không có lượt nộp`, 'WARN');
  const heavy = await db.collection('submissions').aggregate([{ $group: { _id: '$userId', n: { $sum: 1 } } }, { $sort: { n: -1 } }, { $limit: 1 }]).toArray();
  if (heavy[0] && /^[0-9a-f]{24}$/i.test(heavy[0]._id)) {
    const hu = await U.findOne({ _id: new mongoose.Types.ObjectId(heavy[0]._id) });
    if (hu && hu.role === 'STUDENT') {
      tok.heavy = tokenFor(hu);
      const st = await call('heavy', '/learner/stats');
      const topics = (st.json && st.json.topics) || [];
      ok(R, st.status === 200 && topics.some((t) => t.percent > 0) && st.json.submissions.total === heavy[0].n, `Tiến độ (${hu.fullName}): ${st.json && st.json.submissions.total} lượt nộp (khớp DB ${heavy[0].n}), ${topics.filter((t) => t.percent > 0).length}/${topics.length} chủ đề có % > 0`, `Tiến độ: HTTP ${st.status}, số lượt/chủ đề không khớp`);
      const act2 = await call('heavy', '/learner/activity?days=365');
      ok(R, act2.status === 200 && act2.json.total > 0, `Heatmap của ${hu.fullName}: ${act2.json && act2.json.total} lượt nộp thật`, 'Heatmap trống dù có lượt nộp');
      const ai = await call('heavy', '/learner/ai-advice');
      ok(R, ai.status === 200 && ai.json && (ai.json.weakness || (ai.json.next || []).length), `AI gợi ý bài (${ai.json && ai.json.source}): chủ đề yếu "${ai.json && ai.json.weakness && ai.json.weakness.topic}", ${(ai.json && ai.json.next || []).length} bài tiếp`, `AI gợi ý: HTTP ${ai.status}`);
    }
  }
  const enr = await call('s1012', '/student/enrollments');
  ok(R, enr.status === 200 && Array.isArray(enr.json), `Lớp đã tham gia: ${Array.isArray(enr.json) ? enr.json.map((e) => `${e.className} [${e.status}]`).join('; ') : '?'}`, `Enrollments: HTTP ${enr.status}`);
  const completed = (Array.isArray(enr.json) ? enr.json : []).filter((e) => e.certificate);
  rec(R, completed.length ? 'PASS' : 'WARN', completed.length
    ? `${completed.length} lớp đã hoàn thành có chứng chỉ (${completed[0].certificate.grade}, mã ${completed[0].certificate.code})`
    : 'Chưa có lớp nào ở trạng thái "Đã hoàn thành" để mở 👁️ chứng chỉ (lớp mẫu còn bài đang mở/chưa mở) — luồng đã có unit test');

  // ---------- Hint / Coach ----------
  const H = 'AI Coach / Hint';
  const hints = await call('s69', '/hints/exercise/tinh-tong-hai-so-nguyen');
  const txt = JSON.stringify(hints.json || {});
  ok(H, hints.status === 200 && !/print\s*\(|input\s*\(/.test(txt), 'Danh sách hint trả về không chứa code của đáp án (nội dung chỉ hiện khi mở khóa)', `Hint: HTTP ${hints.status} hoặc có code lộ`);

  await mongoose.disconnect();
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
