#!/usr/bin/env node
/**
 * E2E QA bằng TRÌNH DUYỆT THẬT (Chrome qua puppeteer-core): đăng nhập bằng form, click như người dùng, đọc DOM thật, bắt lỗi console / pageerror /
 * HTTP 4xx-5xx / request thất bại. 5 luồng: 1 Khối 3-5 · 2 Học sinh 6-9 và 10-12 · 3 Giảng viên · 4 Admin · 5 Phá (negative / edge).
 *
 *   node scripts/e2e-browser-qa.js [--flow=1,2,3,4,5] [--headed] [--fe=http://localhost:5173] [--api=http://localhost:3000/api]
 *
 * Cần: backend (3000) + frontend dev (5173) đang chạy, đã `npm run seed:clean` (trạng thái chuẩn: lop6-9 xong #1-#2, lop10-12 xong #1).
 * Ghi vào CSDL bằng dữ liệu TẠM gắn nhãn E2E-<mã> (xóa khi xong) và tiến độ của tài khoản chuẩn lop6-9 / lop10-12 (làm bài thật ở Playground);
 * chạy `npm run seed:clean` sau khi test để trả dữ liệu về trạng thái chuẩn. Ảnh chụp khi lỗi: reports/e2e-shots/ (đã .gitignore).
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const h = require('./lib/setup-helpers');
const { E2E, sleep } = require('./lib/e2e-browser');

const ROOT = path.join(__dirname, '..');
const BE = path.join(ROOT, 'BE');
const envText = fs.readFileSync(path.join(BE, '.env'), 'utf8');
const arg = (name, def) => (process.argv.find((a) => a.startsWith(`--${name}=`)) || '').slice(name.length + 3) || def;
const API = arg('api', `http://localhost:${h.readEnvValue(envText, 'PORT') || 3000}/api`);
const FE = arg('fe', 'http://localhost:5173');
const FLOWS = arg('flow', '1,2,3,4,5').split(',').map((x) => x.trim());
const headed = process.argv.includes('--headed');
const STAMP = crypto.randomBytes(3).toString('hex');
const TAG = `E2E-${STAMP}`;

const results = [];
const issuesByFlow = [];
let currentFlow = '';
const chk = (id, name, ok, detail = '') => {
  results.push({ id, name, ok: !!ok, detail, flow: currentFlow });
  console.log(`${ok ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m'}  ${id}  ${name}${detail ? `  — ${detail}` : ''}`);
  return !!ok;
};
/** Mọi lỗi console/HTTP/pageerror thu được ở một phiên: ghi nhận và coi là lỗi (trừ phần đã allow). */
const noIssues = (id, name, s) => {
  const iss = s.drain();
  for (const i of iss) issuesByFlow.push({ flow: currentFlow, id, ...i });
  return chk(id, `${name}: không lỗi console đỏ / pageerror / HTTP 4xx-5xx`, iss.length === 0, iss.slice(0, 3).map((i) => `${i.kind} ${i.msg}`).join(' | '));
};

(async () => {
  const mongoose = require(path.join(BE, 'node_modules', 'mongoose'));
  await mongoose.connect(h.readEnvValue(envText, 'DATABASE_URL'), { serverSelectionTimeoutMS: 15000 });
  const db = mongoose.connection.db;
  const OID = mongoose.Types.ObjectId;
  const solutionOf = async (slug) => ((await db.collection('exercises').findOne({ slug }))?.solutionCode ?? '').trim() + '\n';
  const trackOf = async (topic, grades) =>
    db.collection('exercises').find({ type: 'CODE_TEXT', topic, orderInTopic: { $gte: 1 }, gradeBand: { $in: grades }, bankOnly: { $ne: true } }).sort({ orderInTopic: 1 }).toArray();

  const e2e = new E2E({ fe: FE, api: API, shotDir: path.join(ROOT, 'reports', 'e2e-shots') });
  const ping = await fetch(FE).catch(() => null);
  if (!ping || !ping.ok) throw new Error(`Frontend chưa chạy tại ${FE}`);
  await e2e.start({ headed });
  console.log(`Trình duyệt: ${e2e.exe}\nFE ${FE}  API ${API}  mã đợt chạy ${TAG}\n`);

  const flow = async (id, title, fn) => {
    if (!FLOWS.includes(id)) return;
    currentFlow = `Luồng ${id}`;
    console.log(`\n\x1b[1m══ LUỒNG ${id}: ${title}\x1b[0m`);
    try {
      await fn();
    } catch (e) {
      chk(`${id}.ERR`, `Luồng ${id} bị gián đoạn bởi ngoại lệ`, false, `${e.message}`.split('\n')[0]);
      console.error(e.stack);
    }
  };
  /** Thẻ bài trên /playground. */
  const cards = async (s) => {
    await s.waitFor(() => [...document.querySelectorAll('button')].some((b) => /^#\d+/.test(b.innerText.trim())), null, 20000);
    return cardsNow(s);
  };
  const cardsNow = (s) =>
    s.page.evaluate(() =>
      [...document.querySelectorAll('button')]
        .filter((b) => /^#\d+/.test(b.innerText.trim()))
        .map((b) => ({ n: Number(b.innerText.trim().match(/^#(\d+)/)[1]), text: b.innerText.replace(/\s+/g, ' ').trim(), disabled: b.disabled })),
    );
  /** Chờ nút "Bài tiếp theo" hoặc kết quả AC/lỗi sau Submit. */
  const waitSubmitDone = async (s, ms = 120000) => s.waitFor(() => /Bài tiếp theo|AC|Accepted|Wrong|WA|Lỗi|Timeout|Hết thời gian|Đạt|Thất bại|Đúng/.test(document.body.innerText) && ![...document.querySelectorAll('button')].some((b) => /Đang (chấm|nộp)/.test(b.innerText)), null, ms);
  const blankFlash = async (s, url) => {
    // Chỉ đo trên tài liệu MỚI (tài liệu cũ bị đánh dấu window.__old): "nháy trắng" = đã có nội dung rồi lại trắng.
    // Khung trắng của HTML trống trước khi JS chạy là tải trang bình thường, không tính.
    let seenContent = false;
    let flashes = 0;
    await s.page.evaluate(() => { window.__old = true; });
    const nav = s.page.goto(`${FE}/${url.replace(/^\//, '')}`, { waitUntil: 'domcontentloaded' }).catch(() => undefined);
    const t0 = Date.now();
    while (Date.now() - t0 < 2500) {
      const st = await s.page.evaluate(() => ({ old: !!window.__old, len: document.body ? document.body.innerText.trim().length : 0 })).catch(() => ({ old: true, len: -1 }));
      if (!st.old) {
        if (st.len > 30) seenContent = true;
        else if (seenContent && st.len >= 0) flashes++;
      }
      await sleep(40);
    }
    await nav;
    await s.page.waitForNetworkIdle({ idleTime: 500, timeout: 15000 }).catch(() => undefined);
    return flashes;
  };

  try {
    // ====================================================================================================
    await flow('1', 'HỌC SINH KHỐI 3-5 (lop3-5, duongchiviet2004)', async () => {
      // Đặt lại tiến độ Block Puzzle của lop3-5 (lần chạy trước có thể đã qua màn 1); duongchiviet2004 giữ nguyên 14 sao.
      const kidId = String((await db.collection('users').findOne({ email: 'lop3-5@gmail.com' }))._id);
      await db.collection('block_puzzle_progress').deleteMany({ userId: kidId });
      for (const email of ['lop3-5@gmail.com', 'duongchiviet2004@gmail.com']) {
        const tag = email.split('@')[0];
        const { session: s, landedOn } = await e2e.login(email);
        chk(`1.${tag}.login`, `${email}: đăng nhập bằng form → vào thẳng /block-puzzle`, landedOn === '/block-puzzle', landedOn);

        // Mọi liên kết / nút trên Header, Menu, Trang cá nhân, Tiến độ, Bảng vinh danh.
        const bad = [];
        for (const p of ['block-puzzle', 'profile', 'progress', 'kid-leaderboard']) {
          await s.goto(p);
          const found = await s.page.evaluate(() => ({
            hrefs: [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')),
            labels: [...document.querySelectorAll('a, button, [role=button], [role=menuitem]')].map((x) => (x.innerText || x.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim()),
          }));
          for (const href of found.hrefs) if (/playground|\/quiz|contests|my-class|\/teacher|\/admin|\/catalog|\/detail/.test(href)) bad.push(`${p}: href ${href}`);
          for (const l of found.labels) if (/Playground|Thi Trắc Nghiệm|Cuộc thi|Lớp học của tôi|Danh mục khóa học|Chi tiết bài học|Soạn đề/i.test(l)) bad.push(`${p}: nút "${l}"`);
        }
        chk(`1.${tag}.menu`, `${email}: Header/Menu/Hồ sơ/Tiến độ/Bảng vinh danh KHÔNG có liên kết hay nút tới /playground, /quiz, /contests, /my-class`, bad.length === 0, bad.slice(0, 4).join('; '));

        // Gõ URL trực tiếp: phải về /block-puzzle mượt (không trang trắng/lỗi).
        const wrong = [];
        for (const p of ['playground', 'quiz', 'contests', 'my-class', 'catalog', 'teacher', 'teacher/dashboard', 'admin', 'admin/users']) {
          const flashes = await blankFlash(s, p);
          await sleep(400);
          const lay = await s.layoutProblems();
          if (s.path !== '/block-puzzle') wrong.push(`${p} → ${s.path}`);
          if (flashes > 0) wrong.push(`${p}: nháy trắng ${flashes} lần`);
          if (lay.length) wrong.push(`${p}: ${lay.join(', ')}`);
        }
        chk(`1.${tag}.deeplink`, `${email}: gõ /playground /quiz /contests /my-class /teacher /admin → luôn về /block-puzzle, không nháy trắng / vỡ layout`, wrong.length === 0, wrong.slice(0, 4).join('; '));
        noIssues(`1.${tag}.clean`, `${email} điều hướng`, s);
        await s.close();
      }

      // Chơi 1 màn Mê Cung: kéo thêm khối "tiến lên", bấm Chạy; kiểm sao + Bảng vinh danh bằng UI.
      const { session: s } = await e2e.login('lop3-5@gmail.com');
      const before = await db.collection('block_puzzle_progress').countDocuments({ userId: String((await db.collection('users').findOne({ email: 'lop3-5@gmail.com' }))._id) });
      await s.goto('block-puzzle');
      await s.clickText('Mê Cung Blockly');
      await sleep(1500);
      // Khối "tiến lên" trong hộp công cụ (flyout) và khối đã đặt sẵn trong vùng làm việc (bên phải hộp công cụ).
      const pos = await s.page.evaluate(() => {
        const r = (el) => { const b = el.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; };
        const flyout = document.querySelector('.blocklyFlyout');
        const tool = document.querySelector('.blocklyFlyout .maze_moveForward, .maze_moveForward.blocklyDraggable');
        const fr = flyout ? r(flyout) : null;
        const placed = [...document.querySelectorAll('.blocklyPath')].map(r).find((p) => fr && p.x > fr.x + fr.w);
        return { tool: tool ? r(tool) : null, placed: placed || null };
      });
      const { tool, placed } = pos;
      let played = false;
      if (tool && placed) {
        await s.page.mouse.move(tool.x + 12, tool.y + tool.h / 2);
        await s.page.mouse.down();
        await s.page.mouse.move(placed.x + 12, placed.y + placed.h + tool.h / 2 + 2, { steps: 15 });
        await s.page.mouse.up();
        await sleep(500);
        await s.clickText('Chạy', { exact: false });
        played = true;
        await sleep(3500);
      }
      const afterText = await s.text();
      const after = await db.collection('block_puzzle_progress').countDocuments({ userId: String((await db.collection('users').findOne({ email: 'lop3-5@gmail.com' }))._id) });
      chk('1.game', 'Chơi màn 1 Mê Cung bằng kéo-thả khối thật + bấm Chạy → màn được ghi nhận (sao tăng)', played && after > before, `kéo-thả ${played ? 'ok' : 'KHÔNG thực hiện được'}; màn đã qua ${before} → ${after}`);
      await s.goto('progress');
      const prog = await s.text();
      chk('1.stars', 'Trang Bảng Thành Tích hiển thị sao/màn mới (≥ 1 sao, ≥ 1/46 màn) trên UI', /[1-9]\d* Sao đạt được/.test(prog) && /[1-9]\d*\/46 Màn/.test(prog), (prog.match(/⭐ \d+ Sao đạt được|\d+\/46 Màn đã phá đảo/g) || []).join(' | '));
      await s.goto('kid-leaderboard');
      const lb = await s.text();
      const rows = [...lb.matchAll(/⏱ [^·]+· phá đảo \d{2}\/\d{2}\/\d{4}/g)];
      const today = new Date();
      const future = [...lb.matchAll(/phá đảo (\d{2})\/(\d{2})\/(\d{4})/g)].filter((m) => new Date(+m[3], +m[2] - 1, +m[1]) > new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1));
      chk('1.leaderboard', 'Bảng Vinh Danh hiển thị trên UI: có xếp hạng, có bé Nguyễn Gia Hân / Lê Bảo An (đã phá đảo Mê Cung)', /Top 10/.test(lb) && /Hạng 1/.test(lb) && /Gia Hân|Bảo An/.test(lb) && rows.length >= 3, `${rows.length} dòng xếp hạng`);
      chk('1.leaderboard-dates', 'Bảng Vinh Danh: ngày "phá đảo" không nằm trong TƯƠNG LAI', future.length === 0, future.length ? `${future.length} dòng ngày tương lai: ${future.slice(0, 3).map((m) => m[0]).join('; ')}` : '');
      noIssues('1.game.clean', 'Chơi game + Bảng thành tích + Bảng vinh danh', s);
      await s.close();
    });

    // ====================================================================================================
    await flow('2', 'HỌC SINH KHỐI 6-9 (lop6-9) và 10-12 (lop10-12)', async () => {
      const track69 = await trackOf('python-fundamentals', ['6-9']);
      const track1012 = await trackOf('algorithm-contest-prep', ['9-12', '10-12']);

      // Đặt lại về trạng thái chuẩn của seed (giữ bài nộp mẫu isSeedAll): xóa bài nộp, lượt thi, đăng ký cuộc thi do lần chạy trước tạo ra.
      {
        const ids = (await db.collection('users').find({ email: { $in: ['lop6-9@gmail.com', 'lop10-12@gmail.com'] } }).toArray()).map((u) => String(u._id));
        const oids = ids.map((i) => new OID(i));
        const del = await db.collection('submissions').deleteMany({ userId: { $in: ids }, isSeedAll: { $ne: true } });
        await db.collection('quizattempts').deleteMany({ userId: { $in: oids } });
        await db.collection('contest_attempts').deleteMany({ studentId: { $in: ids } });
        await db.collection('contest_submissions').deleteMany({ studentId: { $in: ids } });
        await db.collection('contests').updateMany({}, { $pull: { registrations: { studentId: { $in: ids } } } });
        console.log(`  (đặt lại tiến độ lop6-9 / lop10-12: xóa ${del.deletedCount} bài nộp do lần chạy trước)`);
      }

      // ---------- /playground ----------
      const { session: s, landedOn } = await e2e.login('lop6-9@gmail.com');
      chk('2.69.login', 'lop6-9: đăng nhập bằng form → vào /playground', landedOn === '/playground', landedOn);
      const body = await s.text();
      chk('2.69.nodropdown', '/playground: KHÔNG còn dropdown chủ đề (không <select>, không "Tất cả chủ đề", "python-fundamentals", "sql")', (await s.page.$$('select')).length === 0 && !/Tất cả chủ đề|python-fundamentals|\bsql\b/i.test(body));
      let cs = await cards(s);
      const lineOf = (arr) => arr.map((c) => (/Đã hoàn thành/.test(c.text) ? 'c' : /Đang mở/.test(c.text) ? 'a' : /Chưa mở khóa/.test(c.text) ? 'l' : '?')).join('');
      chk('2.69.list', 'Đúng 20 bài #1..#20; #1 #2 "Đã hoàn thành", #3 "Đang mở", #4 trở đi "Chưa mở khóa"', cs.length === 20 && lineOf(cs) === `cca${'l'.repeat(17)}` && cs.every((c, i) => c.n === i + 1), `${cs.length} bài: ${lineOf(cs)}`);
      chk('2.69.progress', 'Header /playground hiện "Tiến độ: 2/20 bài đã hoàn thành"', body.includes('Tiến độ: 2/20 bài đã hoàn thành'));
      chk('2.69.locked-disabled', 'Bài #4..#20 là nút bị vô hiệu thật (disabled + aria-disabled), bài #1 không có icon khóa', cs.slice(3).every((c) => c.disabled) && !cs[0].disabled && !/Chưa mở khóa/.test(cs[0].text));

      // Click bài #4 đang khóa: không vào được editor.
      await s.page.evaluate(() => [...document.querySelectorAll('button')].find((b) => /^#4\b/.test(b.innerText.trim()))?.click());
      await s.clickText('#4').catch(() => undefined);
      await sleep(600);
      chk('2.69.click-locked', 'Bấm vào bài #4 đang khóa: không mở editor (vẫn ở danh sách, không có nút Run/Submit)', (await s.has('Tiến độ: 2/20')) && (await s.count('Submit', { exact: true })) === 0);
      await s.goto(`playground?slug=${track69[3].slug}`);
      chk('2.69.deeplink-locked', 'Mở thẳng liên kết bài #4 đang khóa (?slug=): bị chặn, vẫn ở danh sách, có thông báo', (await s.has('Tiến độ: 2/20')) && (await s.count('Submit', { exact: true })) === 0);
      s.drain();

      // Mở #3, gõ code đúng, Run, Submit.
      await s.goto('playground');
      await s.clickText('#3');
      await s.waitText('Run');
      const sol3 = await solutionOf(track69[2].slug);
      await s.setEditor(sol3);
      const firstTest = (track69[2].testCases || []).find((t) => !t.isHidden);
      await s.clickText('Run', { exact: true });
      const ranOk = await s.waitText(String(firstTest.expectedOutput).trim().split('\n')[0], 30000);
      chk('2.69.run', `Bài #3: bấm Run với code đúng → hiện đúng output mẫu "${String(firstTest.expectedOutput).trim()}"`, ranOk);
      await s.clickText('Submit', { exact: true });
      await waitSubmitDone(s);
      const hasNext = await s.waitText('Bài tiếp theo', 60000);
      chk('2.69.submit', 'Bài #3: bấm Submit → AC, xuất hiện nút "Bài tiếp theo" (bài #4 vừa mở khóa)', hasNext, hasNext ? '' : (await s.text()).slice(0, 300));
      await s.clickText('Quay lại danh sách bài', { exact: false });
      await sleep(600);
      cs = await cards(s);
      chk('2.69.live', 'KHÔNG F5: danh sách tự cập nhật #3 "Đã hoàn thành", #4 "Đang mở", #5 trở đi khóa; thanh tiến độ 2/20 → 3/20', lineOf(cs) === `ccca${'l'.repeat(16)}` && (await s.has('Tiến độ: 3/20 bài đã hoàn thành')), `${lineOf(cs)} | ${(await s.text()).match(/Tiến độ: \d+\/\d+/)?.[0]}`);
      noIssues('2.69.playground.clean', 'Playground lop6-9', s);

      // Tiến độ học tập + Hồ sơ.
      await s.goto('progress');
      const pt = await s.text();
      chk('2.69.progress-page', 'Trang Tiến độ học tập: "Bài đã giải" = 3/20', /3\/20\s*Bài đã giải|Bài đã giải\s*3\/20/.test(pt) || pt.includes('3/20 Bài đã giải'), (pt.match(/\d+\/\d+ Bài đã giải/) || [''])[0]);
      await s.goto('profile');
      chk('2.69.profile-page', 'Trang Hồ sơ: "Bài đã giải: 3/20"', (await s.has('Bài đã giải: 3/20')));
      noIssues('2.69.progress.clean', 'Tiến độ + Hồ sơ lop6-9', s);

      // ---------- Lớp học của tôi (edge case: bài giao của lớp KHÔNG bị khóa tuần tự của Playground chặn nhầm) ----------
      /** Mở các ngày còn đang đóng (accordion) rồi thu liên kết làm bài. */
      const openDays = async (sess) => {
        await sess.goto('my-class');
        const closed = await sess.page.$$('button[aria-expanded="false"]');
        for (const b of closed) {
          const t = await b.evaluate((el) => el.innerText);
          if (/^Ngày \d/.test(t.trim())) await b.click().catch(() => undefined);
        }
        await sleep(700);
        const links = await sess.page.evaluate(() => [...document.querySelectorAll('a[href]')].map((a) => ({ href: a.getAttribute('href'), t: a.innerText.replace(/\s+/g, ' ').trim() })).filter((l) => /^\/(playground|quiz)\?/.test(l.href)));
        return { code: links.filter((l) => l.href.startsWith('/playground')), quiz: links.filter((l) => l.href.startsWith('/quiz')) };
      };
      /** Nộp bài code thật cho một liên kết bài giao: không được dính E403_EXERCISE_LOCKED, phải ra AC. */
      const doClassCode = async (sess, link, label) => {
        const slug = new URL('http://x' + link.href).searchParams.get('slug');
        await sess.page.goto(`${FE}${link.href}`, { waitUntil: 'networkidle2' });
        await sess.waitText('Submit', 20000);
        await sess.setEditor(await solutionOf(slug));
        await sess.clickText('Submit', { exact: true });
        const ok = await sess.waitFor(() => /Đạt \(Accepted\)/.test(document.body.innerText), null, 150000);
        const lockedErr = sess.issues.filter((i) => /E403_EXERCISE_LOCKED|403 POST \/exercises/.test(i.msg)).length;
        chk(`2.${label}.class-submit-${slug}`, `${label}: nộp bài giao của lớp "${slug}" → "Đạt (Accepted)", KHÔNG bị E403_EXERCISE_LOCKED của Playground chặn nhầm`, ok && lockedErr === 0, ok ? '' : (await sess.text()).slice(0, 240));
        return ok;
      };
      /** Làm một bài trắc nghiệm theo kế hoạch ('correct' | 'wrong' | 'blank' cho từng câu); kiểm nhãn A,B,C,D theo vị trí. */
      const takeQuiz = async (sess, plan, label) => {
        await sess.page.waitForSelector('button[aria-label^="Đáp án A:"]', { timeout: 40000 });
        const order = [];
        const labelBad = [];
        let idx = 0;
        for (;;) {
          const q = await sess.page.evaluate(() => ({
            content: (document.querySelector('h2')?.innerText || '').trim(),
            labels: [...document.querySelectorAll('button[aria-label^="Đáp án "]')].map((b) => b.getAttribute('aria-label')),
          }));
          const letters = q.labels.map((l) => l.match(/^Đáp án (\w):/)?.[1]).join('');
          if (letters !== 'ABCD'.slice(0, q.labels.length) && letters !== 'ABCDEF'.slice(0, q.labels.length)) labelBad.push(`câu ${idx + 1}: ${letters}`);
          const doc = await db.collection('questions').findOne({ content: q.content });
          const want = plan[idx] ?? 'blank';
          if (want !== 'blank' && doc) {
            const correctText = doc.options.find((o) => o.isCorrect)?.text;
            const pick = q.labels.find((l) => (want === 'correct' ? l.endsWith(`: ${correctText}`) : !l.endsWith(`: ${correctText}`)));
            if (pick) await sess.page.click(`button[aria-label="${pick.replace(/"/g, '\\"')}"]`);
          }
          order.push(want);
          const hasNext = await sess.page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /Câu Tiếp/.test(x.innerText)); return !!b && !b.disabled; });
          if (!hasNext) break;
          await sess.clickText('Câu Tiếp', { selector: 'button' });
          idx++;
          await sleep(120);
        }
        chk(`2.${label}.quiz-labels`, `${label}: nhãn đáp án luôn A, B, C, D theo thứ tự từ trên xuống (mọi câu)`, labelBad.length === 0, `${order.length} câu; lệch: ${labelBad.slice(0, 3).join('; ') || 'không'}`);
        await sess.clickText('Nộp Bài Thi Trắc Nghiệm');
        await sess.waitText('Xác nhận nộp bài thi?', 10000);
        await sess.clickText('Nộp bài ngay');
        const done = await sess.waitFor(() => /Số Câu Đúng/.test(document.body.innerText), null, 60000);
        return { done, total: order.length };
      };

      const cl69 = await openDays(s);
      chk('2.69.class-list', '69: Lớp học của tôi có bài Code và bài Quiz đang mở (liên kết làm bài)', cl69.code.length >= 1 && cl69.quiz.length >= 1, `${cl69.code.length} code, ${cl69.quiz.length} quiz`);
      // Làm thật bài giao còn mở; Playground phải giữ nguyên 3/20 (bài giao lớp không tính vào lộ trình).
      const prog69 = (await db.collection('submissions').countDocuments({ userId: String((await db.collection('users').findOne({ email: 'lop6-9@gmail.com' }))._id), status: 'AC', assignmentId: { $exists: false } }));
      for (const l of cl69.code) await doClassCode(s, l, '69');
      await s.goto('playground');
      chk('2.69.class-no-playground-effect', '69: làm bài giao của lớp không làm đổi tiến độ Playground (vẫn 3/20, #4 "Đang mở")', (await s.has('Tiến độ: 3/20 bài đã hoàn thành')) && lineOf(await cards(s)) === `ccca${'l'.repeat(16)}`, `${prog69} AC luyện tập`);
      // Quiz giao cho lớp.
      if (cl69.quiz.length) {
        await s.page.goto(`${FE}${cl69.quiz[0].href}`, { waitUntil: 'networkidle2' });
        const r = await takeQuiz(s, ['correct', 'wrong'], '69.class');
        chk('2.69.class-quiz', '69: làm bài trắc nghiệm được giao (đúng 1, sai 1, bỏ trống còn lại) → nộp, có điểm', r.done, `${r.total} câu`);
      }
      noIssues('2.69.class.clean', 'Lớp học của tôi lop6-9 (làm bài giao + quiz lớp)', s);

      // ---------- Thi trắc nghiệm công khai (/quiz): Tab + Enter, nhãn A-D, kết quả 3 trạng thái ----------
      await s.goto('quiz');
      const deck = await s.page.evaluate(() => [...document.querySelectorAll('[role=button][aria-pressed]')].map((d) => d.getAttribute('aria-label')));
      chk('2.69.quiz-decks', '/quiz: các thẻ bộ đề là role="button", focus được bằng phím (aria-pressed)', deck.length >= 2, deck.join(' | '));
      const active = () => s.page.evaluate(() => ({ lab: document.activeElement?.getAttribute('aria-label') || '', pressed: document.activeElement?.getAttribute('aria-pressed') }));
      let tabs = 0;
      for (; tabs < 40; tabs++) {
        await s.page.keyboard.press('Tab');
        const a = await active();
        if (a.pressed !== null && a.lab.startsWith('Chọn bộ đề')) break;
      }
      const first = await active();
      await s.page.keyboard.press('Tab'); // tới thẻ thứ hai
      const second = await active();
      await s.page.keyboard.press('Enter');
      await sleep(300);
      const afterEnter = await s.page.evaluate(() => [...document.querySelectorAll('[role=button][aria-pressed]')].map((d) => `${d.getAttribute('aria-label')}=${d.getAttribute('aria-pressed')}`));
      chk('2.69.quiz-keyboard-enter', 'Bàn phím: Tab tới thẻ bộ đề thứ hai + Enter → thẻ đó được chọn (aria-pressed=true), thẻ cũ bỏ chọn', afterEnter.some((x) => x === `${second.lab}=true`) && afterEnter.some((x) => x === `${first.lab}=false`), `${tabs + 1} lần Tab; ${afterEnter.join(' ; ')}`);
      await s.page.keyboard.down('Shift');
      await s.page.keyboard.press('Tab');
      await s.page.keyboard.up('Shift');
      await s.page.keyboard.press('Space');
      await sleep(300);
      const afterSpace = await s.page.evaluate(() => [...document.querySelectorAll('[role=button][aria-pressed]')].map((d) => `${d.getAttribute('aria-label')}=${d.getAttribute('aria-pressed')}`));
      chk('2.69.quiz-keyboard-space', 'Bàn phím: Shift+Tab về thẻ đầu + phím Space → chọn lại thẻ đó', afterSpace.some((x) => x === `${first.lab}=true`), afterSpace.join(' ; '));
      await s.clickText('Bắt Đầu Làm Bài Trắc Nghiệm');
      const qr = await takeQuiz(s, ['correct', 'wrong'], '69');
      const rtext = await s.text();
      chk('2.69.quiz-result', 'Trang kết quả tách riêng 3 trạng thái: Đúng / Sai / Bỏ trống (có bộ đếm "Sai 1 · Bỏ trống N-2", nhãn "Bỏ trống (0 điểm)")',
        qr.done && /Sai 1 · Bỏ trống \d+/.test(rtext) && /Bỏ trống \(0 điểm\)/.test(rtext) && /Đúng/.test(rtext), (rtext.match(/Sai \d+ · Bỏ trống \d+/) || [''])[0]);
      await s.shot('quiz-result-69');
      noIssues('2.69.quiz.clean', 'Thi trắc nghiệm lop6-9', s);

      // ---------- Cuộc thi ----------
      await s.goto('contests');
      const ctext = await s.text();
      chk('2.69.contests-list', '/contests: có danh sách cuộc thi, có bộ lọc khối', /Tất Cả \(\d+\)/.test(ctext) && /Khối 6–9/.test(ctext) && /Khối 10–12/.test(ctext), (ctext.match(/Tất Cả \(\d+\)/) || [''])[0]);
      await s.clickText('Khối 6–9', { exact: true });
      await sleep(500);
      const onlyOwn = await s.page.evaluate(() => document.body.innerText);
      chk('2.69.contests-filter', 'Lọc "Khối 6–9": không còn cuộc thi nhãn "Khối 10–12"', !/Khối 10–12\s+(ĐANG|SẮP|ĐÃ)/i.test(onlyOwn.replace(/\s+/g, ' ').replace('Khối 10–12 Làm mới', '')), '');
      const reg = await s.count('Đăng ký tham gia');
      if (reg > 0) {
        await s.clickText('Đăng ký tham gia');
        await sleep(1500);
        chk('2.69.contest-register', 'Đăng ký cuộc thi Khối 6–9 trên UI → có thông báo thành công và nút đổi trạng thái', (await s.count('Đăng ký tham gia')) < reg || /đã đăng ký|Đã đăng ký|thành công/i.test(await s.text()), `nút "Đăng ký" ${reg} → ${await s.count('Đăng ký tham gia')}`);
      }
      noIssues('2.69.contests.clean', 'Cuộc thi lop6-9', s);
      await s.close();

      // ==================== lop10-12 ====================
      const { session: t, landedOn: land2 } = await e2e.login('lop10-12@gmail.com');
      chk('2.1012.login', 'lop10-12: đăng nhập bằng form → vào /playground', land2 === '/playground', land2);
      let c2 = await cards(t);
      chk('2.1012.list', 'Đúng 15 bài (#1 "Đã hoàn thành", #2 "Đang mở", #3.. "Chưa mở khóa"); không dropdown; tiến độ 1/15',
        c2.length === 15 && lineOf(c2) === `ca${'l'.repeat(13)}` && (await t.page.$$('select')).length === 0 && (await t.has('Tiến độ: 1/15 bài đã hoàn thành')) && !/Tất cả chủ đề|algorithm-contest-prep/.test(await t.text()), `${c2.length} bài: ${lineOf(c2)}`);
      const lockedClick = await t.page.evaluate(() => [...document.querySelectorAll('button')].filter((b) => /^#\d+/.test(b.innerText.trim())).slice(2).every((b) => b.disabled));
      chk('2.1012.locked', 'Bài #3..#15 là nút bị vô hiệu thật', lockedClick);
      const cl1012 = await openDays(t);
      chk('2.1012.class-list', '1012: Lớp học của tôi có bài Code và bài Quiz đang mở', cl1012.code.length >= 1 && cl1012.quiz.length >= 1, `${cl1012.code.length} code (${cl1012.code.map((l) => new URL('http://x' + l.href).searchParams.get('slug')).join(', ')}), ${cl1012.quiz.length} quiz`);
      const onLockedTrack = cl1012.code.filter((l) => track1012.slice(2).some((x) => x.slug === new URL('http://x' + l.href).searchParams.get('slug')));
      chk('2.1012.class-has-locked-track-item', '1012: trong lớp có bài giao thuộc lộ trình ĐANG KHÓA ở Playground (đúng edge case cần kiểm)', onLockedTrack.length >= 1, `${onLockedTrack.length} bài`);
      for (const l of cl1012.code) await doClassCode(t, l, '1012');
      await t.goto('playground');
      c2 = await cards(t);
      chk('2.1012.class-no-playground-effect', '1012: sau khi làm bài giao thuộc lộ trình, Playground vẫn 1/15 và các bài đó vẫn "Chưa mở khóa"', lineOf(c2) === `ca${'l'.repeat(13)}` && (await t.has('Tiến độ: 1/15 bài đã hoàn thành')), lineOf(c2));
      // Làm bài #2 ở Playground rồi xem tiến độ: 1/15 → 2/15.
      await t.clickText('#2');
      await t.waitText('Run');
      await t.setEditor(await solutionOf(track1012[1].slug));
      await t.clickText('Submit', { exact: true });
      const next2 = await t.waitText('Bài tiếp theo', 150000);
      await t.clickText('Quay lại danh sách bài');
      await sleep(600);
      chk('2.1012.live', 'lop10-12: nộp đúng bài #2 → AC; không F5: #2 "Đã hoàn thành", #3 "Đang mở", tiến độ 2/15', next2 && lineOf(await cards(t)) === `cca${'l'.repeat(12)}` && (await t.has('Tiến độ: 2/15 bài đã hoàn thành')), lineOf(await cards(t)));
      await t.goto('progress');
      chk('2.1012.progress-page', 'Trang Tiến độ học tập lop10-12: "Bài đã giải" = 2/15', /2\/15\s*Bài đã giải/.test(await t.text()), ((await t.text()).match(/\d+\/\d+ Bài đã giải/) || [''])[0]);
      await t.goto('profile');
      chk('2.1012.profile-page', 'Trang Hồ sơ lop10-12: "Bài đã giải: 2/15"', await t.has('Bài đã giải: 2/15'));
      noIssues('2.1012.clean', 'lop10-12 Playground + Lớp học + Tiến độ + Hồ sơ', t);
      await t.close();

    });
    // ====================================================================================================
    await flow('3', 'GIẢNG VIÊN (teacher6-9, teacher10-12, teacher@gmail.com)', async () => {
      const codeTitle = `${TAG} Nhân đôi số`;
      const quizContent = `${TAG}: 2 + 2 bằng mấy?`;
      const toast = async (sess, rx, ms = 12000) => sess.waitFor((src) => new RegExp(src).test(document.body.innerText), rx.source, ms);

      const { session: t, landedOn } = await e2e.login('teacher6-9@gmail.com');
      chk('3.login', 'teacher6-9: đăng nhập bằng form → vào /teacher/dashboard', landedOn === '/teacher/dashboard', landedOn);

      // ---- Soạn đề: không còn CAREER_ADULT / K3_5 / ô "Loại phòng thực hành" ----
      await t.goto('teacher/authoring');
      const authText = await t.text();
      const bandOptions = await t.page.$$eval('#ex-band option', (o) => o.map((x) => x.textContent.trim()));
      chk('3.authoring-bands', 'Soạn đề: chỉ 2 khối (Khối 6–9, Khối 10–12); không CAREER_ADULT / K3_5 / "Loại phòng thực hành" / "Người đi làm"', bandOptions.join('|') === 'Khối 6–9|Khối 10–12' && !/CAREER_ADULT|K3_5|Loại phòng thực hành|Người đi làm|Lớp 3/.test(authText), bandOptions.join('|'));
      // chuyển qua lại công tắc 3 lần
      for (let i = 0; i < 3; i++) {
        await t.clickText('Câu hỏi Trắc nghiệm', { selector: 'button' });
        await t.page.waitForSelector('#qz-content', { timeout: 5000 });
        await t.clickText('Bài tập Code', { selector: 'button' });
        await t.page.waitForSelector('#ex-title', { timeout: 5000 });
      }
      chk('3.toggle', 'Công tắc "Bài tập Code | Câu hỏi Trắc nghiệm": chuyển qua lại 3 vòng, hai form hiện đúng', true);

      // ---- Tạo 1 bài Code ----
      await t.page.type('#ex-title', codeTitle, { delay: 3 });
      await t.page.type('#ex-desc', 'Nhập một số nguyên n, in ra 2 * n.', { delay: 2 });
      const addBtns = await t.findClickable('Thêm', { selector: 'button', exact: false });
      await addBtns[0].click(); // test hiển thị
      await sleep(300);
      await t.page.type('textarea[aria-label^="Test hiển thị"][aria-label$="1 input"]', '5');
      await t.page.type('textarea[aria-label^="Test hiển thị"][aria-label$="1 expected"]', '10');
      const addBtns2 = await t.findClickable('Thêm', { selector: 'button' });
      await addBtns2[1].click(); // test ẩn
      await sleep(300);
      await t.page.type('textarea[aria-label^="Test ẩn"][aria-label$="1 input"]', '21');
      await t.page.type('textarea[aria-label^="Test ẩn"][aria-label$="1 expected"]', '42');
      await t.page.type('#ex-solution', 'print(int(input()) * 2)');
      await t.clickText('Lưu vào Ngân hàng đề', { selector: 'button' });
      const savedCode = await toast(t, /Đã lưu/);
      const codeDoc = await db.collection('exercises').findOne({ title: codeTitle });
      chk('3.create-code', 'Tạo bài Code qua UI → toast thành công; lưu bankOnly, đúng khối 6–9, tác giả = teacher6-9', savedCode && codeDoc?.bankOnly === true && codeDoc?.bankBand === '6-9' && String(codeDoc?.authorId) === String((await db.collection('users').findOne({ email: 'teacher6-9@gmail.com' }))._id), codeDoc ? `bankOnly=${codeDoc.bankOnly} band=${codeDoc.bankBand}` : 'không thấy trong DB');

      // ---- Tạo 1 câu hỏi Trắc nghiệm ----
      await t.clickText('Câu hỏi Trắc nghiệm', { selector: 'button' });
      await t.page.waitForSelector('#qz-content');
      await t.page.type('#qz-content', quizContent, { delay: 2 });
      const optInputs = await t.page.$$('input[aria-label^="Nội dung đáp án"]');
      const optTexts = ['3', '4', '5', '22'];
      for (let i = 0; i < optInputs.length; i++) await optInputs[i].type(optTexts[i] ?? String(i));
      await t.page.click('input[aria-label="Đáp án B là đáp án đúng"]');
      await t.page.type('#qz-explain', '2 + 2 = 4.');
      await t.clickText('Lưu', { selector: 'button[type=submit]' });
      const savedQuiz = await toast(t, /Đã lưu câu trắc nghiệm/);
      const quizDoc = await db.collection('questions').findOne({ content: quizContent });
      chk('3.create-quiz', 'Tạo câu Trắc nghiệm qua UI → toast thành công; lưu bankOnly, khối 6-9, đúng 1 đáp án đúng', savedQuiz && quizDoc?.bankOnly === true && quizDoc?.gradeBands?.[0] === '6-9' && quizDoc.options.filter((o) => o.isCorrect).length === 1, quizDoc ? `${quizDoc.options.length} đáp án` : 'không thấy trong DB');
      noIssues('3.authoring.clean', 'Soạn đề', t);

      // ---- Ngân hàng đề ----
      await t.goto('teacher/authoring/bank');
      const bankCode = await t.has(codeTitle);
      await t.clickText('Câu Trắc nghiệm', { selector: '[role=tab]' });
      await sleep(900);
      const bankQuiz = await t.has(quizContent);
      chk('3.bank-tabs', 'Ngân hàng đề: tab "Bài Code" có bài vừa tạo và tab "Câu Trắc nghiệm" có câu vừa tạo', bankCode && bankQuiz, `code=${bankCode} quiz=${bankQuiz}`);

      // ---- Giao vào Ngày 4 của lớp CL-69PY01 ----
      const clickAddInDay = (n) =>
        t.page.evaluate((day) => {
          const hdr = [...document.querySelectorAll('button[aria-expanded]')].find((b) => b.innerText.trim().startsWith(`Ngày ${day} `));
          if (!hdr) return 'không thấy ngày';
          let node = hdr.parentElement;
          for (let i = 0; i < 4 && node; i++, node = node.parentElement) {
            const add = [...node.querySelectorAll('button')].find((b) => /Thêm bài vào ngày/.test(b.innerText));
            if (add) { add.click(); return 'ok'; }
          }
          return 'không thấy nút Thêm bài';
        }, n);
      const openDay4 = async () => {
        await t.goto('teacher/classes');
        await t.clickText('Bài tập & Giao bài', { selector: 'button' });
        await sleep(800);
        const hdr4 = await t.page.$$('button[aria-expanded="false"]');
        for (const b of hdr4) if ((await b.evaluate((el) => el.innerText)).trim().startsWith('Ngày 4 ')) await b.click();
        await sleep(500);
      };
      await openDay4();
      let r = await clickAddInDay(4);
      await sleep(900);
      const dialogTitle = await t.page.evaluate(() => document.querySelector('[role=dialog]')?.getAttribute('aria-label') || '');
      chk('3.assign-dialog', 'Mở hộp "Thêm bài vào Ngày 4" trên UI', r === 'ok' && /Ngày 4/.test(dialogTitle), `${r} | ${dialogTitle}`);
      await t.page.type('[role=dialog] input[placeholder^="Tìm bài"]', TAG, { delay: 3 });
      await sleep(1200);
      await t.page.evaluate((title) => { const row = [...document.querySelectorAll('[role=dialog] label')].find((l) => l.innerText.includes(title)); row?.click(); }, codeTitle);
      await sleep(400);
      await t.clickText('Lưu vào ngày', { selector: '[role=dialog] button' });
      const assignedCode = await toast(t, /(Đã thêm|đã giao|Đã giao|Đã lưu|thành công)/i);
      await sleep(800);
      // quiz
      await openDay4();
      r = await clickAddInDay(4);
      await sleep(900);
      await t.clickText('Bài trắc nghiệm', { selector: '[role=dialog] [role=tab], [role=dialog] button' });
      await sleep(1200);
      await t.page.type('[role=dialog] input[placeholder^="Tìm"]', TAG, { delay: 3 }).catch(() => undefined);
      await sleep(1200);
      await t.page.evaluate((c) => { const row = [...document.querySelectorAll('[role=dialog] label')].find((l) => l.innerText.includes(c)); row?.click(); }, quizContent);
      await sleep(400);
      await t.setControl('Tiêu đề bài', `${TAG} Trắc nghiệm`, '[role=dialog]').catch(() => undefined);
      await t.clickText('Lưu vào ngày', { selector: '[role=dialog] button' });
      const assignedQuiz = await toast(t, /(Đã thêm|đã giao|Đã giao|Đã lưu|thành công)/i);
      const asgDocs = await db.collection('class_assignments').find({ $or: [{ title: new RegExp(TAG) }, { exerciseSlug: codeDoc?.slug }] }).toArray();
      chk('3.assign', 'Giao bài Code và câu Trắc nghiệm vừa tạo vào Ngày 4 của lớp CL-69PY01 (UI) → có 2 bản ghi bài giao', asgDocs.length >= 2, `${asgDocs.length} bài giao; code ${assignedCode}, quiz ${assignedQuiz}`);
      noIssues('3.classes.clean', 'Lớp học của giảng viên (giao bài)', t);

      // ---- Học sinh của lớp thấy và làm được ngay ----
      const { session: st } = await e2e.login('lop6-9@gmail.com');
      const dayLinks = await (async () => {
        await st.goto('my-class');
        for (const b of await st.page.$$('button[aria-expanded="false"]')) await b.click().catch(() => undefined);
        await sleep(700);
        return st.page.evaluate(() => [...document.querySelectorAll('a[href]')].map((a) => ({ href: a.getAttribute('href'), ctx: (() => { let n = a; for (let i = 0; i < 5 && n; i++, n = n.parentElement) if (n.innerText && n.innerText.length > 20 && n.innerText.length < 400) return n.innerText.replace(/\s+/g, ' '); return ''; })() })).filter((l) => /^\/(playground|quiz)\?/.test(l.href)));
      })();
      const codeLink = dayLinks.find((l) => codeDoc && l.href.includes(`slug=${codeDoc.slug}`));
      const quizLink = dayLinks.find((l) => l.href.startsWith('/quiz') && l.ctx.includes(TAG));
      chk('3.student-sees', 'Học sinh lop6-9 thấy NGAY cả bài Code và bài Trắc nghiệm vừa giao ở Lớp học của tôi', !!codeLink && !!quizLink, `code=${!!codeLink} quiz=${!!quizLink}`);
      if (codeLink) {
        await st.page.goto(`${FE}${codeLink.href}`, { waitUntil: 'networkidle2' });
        await st.waitText('Submit', 20000);
        await st.setEditor('print(int(input()) * 2)\n');
        await st.clickText('Submit', { exact: true });
        const ok = await st.waitFor(() => /Đạt \(Accepted\)/.test(document.body.innerText), null, 90000);
        const stText = await st.text();
        chk('3.student-code', 'Học sinh làm bài Code vừa giao (bài Ngân hàng đề bankOnly): nộp → "Đạt (Accepted)"', ok, ok ? '' : await (async () => {
          const d = await db.collection('exercises').findOne({ title: codeTitle });
          const sub = await db.collection('submissions').find({ exerciseId: String(d?._id) }).sort({ createdAt: -1 }).limit(1).toArray();
          return `DB: tests=${JSON.stringify(d?.testCases)} hidden=${JSON.stringify(d?.hiddenTestCases)}; bài nộp: ${sub[0]?.status} ${JSON.stringify(sub[0]?.results)} code=${JSON.stringify(sub[0]?.code)}`;
        })());
      }
      if (quizLink) {
        await st.page.goto(`${FE}${quizLink.href}`, { waitUntil: 'networkidle2' });
        await st.page.waitForSelector('button[aria-label^="Đáp án A:"]', { timeout: 30000 });
        const qtext = await st.page.evaluate(() => document.querySelector('h2')?.innerText || '');
        // đáp án bị xáo thứ tự: chọn theo CHỮ "4" (nhãn A-D theo vị trí)
        await st.page.evaluate(() => [...document.querySelectorAll('button[aria-label^="Đáp án "]')].find((b) => /: 4$/.test(b.getAttribute('aria-label')))?.click());
        await st.clickText('Nộp Bài Thi Trắc Nghiệm');
        await st.waitText('Xác nhận nộp bài thi?', 10000);
        await st.clickText('Nộp bài ngay');
        const done = await st.waitFor(() => /Số Câu Đúng/.test(document.body.innerText), null, 40000);
        const res = await st.text();
        chk('3.student-quiz', 'Học sinh làm câu Trắc nghiệm vừa giao: chọn đáp án đúng B → nộp → kết quả 1/1 đúng', done && qtext.includes(TAG) && /1\s*\/\s*1|Đúng 1|1 Câu/.test(res), (res.match(/Số Câu Đúng[^]{0,60}/) || [''])[0]);
      }
      noIssues('3.student.clean', 'Học sinh làm bài vừa được giao', st);
      await st.close();

      // ---- Xóa bài đang gán trong lớp: 409 + toast tiếng Việt, bài còn nguyên ----
      await t.goto('teacher/authoring/bank');
      await sleep(600);
      await t.clickText(`Xóa ${codeTitle}`, { selector: 'button' }).catch(async () => { await t.clickText('Xóa', { selector: 'button' }); });
      await t.waitText('Xóa bài', 8000);
      t.allow(/^409 /, /console .*(409|Conflict)/);
      const warned = /Hệ thống sẽ từ chối xóa/.test(await t.text());
      await t.page.evaluate(() => { const d = document.querySelector('[role=dialog]'); const b = [...(d || document).querySelectorAll('button')].find((x) => /Xác nhận xóa/.test(x.innerText.trim())); b?.click(); });
      const shown409 = await toast(t, /(đang được dùng|đang dùng|không thể xóa|Không thể xóa|đã được giao)/i, 10000);
      const still = await db.collection('exercises').findOne({ title: codeTitle });
      const bodyAfter = await t.text();
      chk('3.delete-409-code', 'Xóa bài Code đang giao cho lớp: hộp xác nhận cảnh báo trước ("Đang dùng: N lớp. Hệ thống sẽ từ chối xóa"), xác nhận → toast tiếng Việt 409; bài vẫn còn trong DB', warned && shown409 && !!still, (bodyAfter.match(/[^.]*(đang được dùng|Không thể xóa|không thể xóa)[^.]*/i) || [''])[0].trim().slice(0, 160) || `toast=${shown409} trang: ${bodyAfter.slice(bodyAfter.indexOf('Xóa bài'), bodyAfter.indexOf('Xóa bài') + 260)} | sự cố mạng: ${JSON.stringify(t.issues.slice(0, 3))}`);
      await t.page.keyboard.press('Escape');
      await t.goto('teacher/authoring/bank');
      await t.clickText('Câu Trắc nghiệm', { selector: '[role=tab]' });
      await sleep(900);
      await t.clickText(`Xóa câu: ${quizContent}`, { selector: 'button' });
      const shownQ = await toast(t, /(đang được dùng|đang dùng|không thể xóa|Không thể xóa|bài giao|đề Cuộc thi)/i, 10000);
      const stillQ = await db.collection('questions').findOne({ content: quizContent });
      chk('3.delete-409-quiz', 'Xóa câu Trắc nghiệm đang giao cho lớp: hộp xác nhận → báo lỗi 409 tiếng Việt; câu vẫn còn', shownQ && !!stillQ, '');
      noIssues('3.bank.clean', 'Ngân hàng đề (xóa bị 409 có chủ đích)', t);

      // ---- Sửa 1 bài ----
      await t.goto('teacher/authoring/bank');
      await sleep(600);
      await t.clickText(`Sửa ${codeTitle}`, { selector: 'button' });
      await t.waitText('Sửa bài tập', 8000);
      const titleInput = await t.page.evaluateHandle((v) => [...document.querySelectorAll('[role=dialog] input')].find((i) => i.value === v) || null, codeTitle);
      const el = titleInput.asElement();
      if (el) { await el.click({ clickCount: 3 }); await el.type(`${codeTitle} (đã sửa)`); }
      await t.page.evaluate(() => { const d = document.querySelector('[role=dialog]'); [...d.querySelectorAll('button')].reverse().find((b) => /^Lưu/.test(b.innerText.trim()))?.click(); });
      await sleep(1500);
      const edited = await db.collection('exercises').findOne({ title: `${codeTitle} (đã sửa)` });
      chk('3.edit', 'Sửa bài Code trong Ngân hàng đề (đổi tiêu đề) → lưu được, vẫn bankOnly', !!edited && edited.bankOnly === true, edited ? '' : 'không lưu được');

      // ---- Chấm bài: 3 link thừa đã biến mất ----
      await t.goto('teacher/grading');
      const gt = await t.text();
      const header = await t.page.evaluate(() => [...document.querySelectorAll('a,button')].map((x) => x.innerText.trim()).join(' | '));
      chk('3.grading-links', 'Trang Chấm bài và thanh điều hướng: không còn "Chấm DA Insight", "Bài nộp DA/AI Lab", "Xem xét trung thực chi tiết"', !/Chấm DA Insight|Bài nộp DA\/AI Lab|Xem xét trung thực chi tiết/.test(gt + header));
      noIssues('3.grading.clean', 'Trang Chấm bài (không dạy lớp Tester QA: không còn 403 hàng chờ)', t);
      await t.close();

      // ---- teacher10-12 và teacher@gmail.com ----
      for (const [email, band] of [['teacher10-12@gmail.com', 'Khối 10–12'], ['teacher@gmail.com', null]]) {
        const { session: x } = await e2e.login(email);
        await x.goto('teacher/authoring');
        const opts = await x.page.$$eval('#ex-band option', (o) => o.map((i) => i.textContent.trim()));
        await x.goto('teacher/authoring/bank');
        const bt = await x.text();
        chk(`3.${email.split('@')[0]}`, `${email}: Soạn đề chỉ 2 khối; Ngân hàng đề hiện đúng (có bộ lọc khối), không CAREER_ADULT`, opts.join('|') === 'Khối 6–9|Khối 10–12' && /Bài Code/.test(bt) && !/CAREER_ADULT|K3_5/.test(bt), `${opts.join('|')}${band ? ` · thấy bài ${band}: ${bt.includes(band)}` : ''}`);
        noIssues(`3.${email.split('@')[0]}.clean`, `${email}`, x);
        await x.close();
      }
    });

    // ====================================================================================================
    await flow('4', 'ADMIN (admin@gmail.com)', async () => {
      const email = `e2e-${STAMP}@example.test`;
      const fullName = `${TAG} Học viên thử`;
      const { session: a, landedOn } = await e2e.login('admin@gmail.com');
      chk('4.login', 'admin: đăng nhập bằng form → vào /admin/dashboard', landedOn === '/admin/dashboard', landedOn);
      await a.goto('admin/users');
      await a.clickText('Thêm người dùng mới', { selector: 'button' });
      await sleep(600);
      await a.setControl('Họ tên', fullName, '[role=dialog]');
      await a.setControl('Email', email, '[role=dialog]');
      await a.setControl('Mật khẩu ban đầu', 'E2e@12345', '[role=dialog]');
      await a.setControl('Vai trò', 'Học viên', '[role=dialog]');
      await a.setControl('Khối học', 'Khối 6-9', '[role=dialog]').catch(async () => { throw new Error(`không chọn được khối: ${(await a.options('Khối học', '[role=dialog]')).join('|')}`); });
      await a.clickText('Tạo người dùng', { selector: 'button' });
      const created = await a.waitText('Đã tạo người dùng mới', 12000);
      const doc = await db.collection('users').findOne({ email });
      chk('4.create-user', 'Tạo Học viên mới qua UI → toast; lưu role STUDENT + khối 6-9', created && doc?.role === 'STUDENT' && doc?.ageGroup === '6-9', doc ? `${doc.role}/${doc.ageGroup}` : 'không thấy');
      await a.page.type('input[aria-label="Tìm theo tên hoặc email"]', email, { delay: 3 });
      await sleep(1500);
      const rowCells = async () => a.page.evaluate((em) => { const tr = [...document.querySelectorAll('tr')].find((r) => r.innerText.includes(em)); return tr ? [...tr.querySelectorAll('td')].map((c) => c.innerText.replace(/\s+/g, ' ').trim()) : null; }, email);
      const clickRow = async (txt) => a.page.evaluate((em, label) => { const tr = [...document.querySelectorAll('tr')].find((r) => r.innerText.includes(em)); const b = tr && [...tr.querySelectorAll('button')].find((x) => x.innerText.trim() === label); b?.click(); return !!b; }, email, txt);
      let cells = await rowCells();
      chk('4.row-student', 'Bảng người dùng hiện dòng mới: vai trò Học viên, khối "Khối 6-9"', !!cells && cells.some((c) => /Học viên/.test(c)) && cells.some((c) => /6-9/.test(c)), (cells || []).join(' | '));
      await clickRow('Sửa');
      await sleep(700);
      await a.setControl('Vai trò', 'Giảng viên', '[role=dialog]');
      await a.clickText('Lưu thay đổi', { selector: 'button' });
      await a.waitText('Đã cập nhật', 12000);
      await sleep(1200);
      cells = await rowCells();
      chk('4.role-change', 'Sửa: đổi vai trò sang Giảng viên → cột Khối học tự về "—"', !!cells && cells.some((c) => /Giảng viên/.test(c)) && cells.some((c) => c === '—'), (cells || []).join(' | '));
      noIssues('4.users.clean', 'Quản lý người dùng (tạo + sửa vai trò)', a);

      // phân công vào lớp K6-9
      await a.goto('admin/classes');
      const clickClassBtn = (name, label) => a.page.evaluate((n, l) => { const rows = [...document.querySelectorAll('tr, [role=row], li, div')].filter((r) => r.innerText.includes(n) && [...r.querySelectorAll('button')].some((b) => b.innerText.trim() === l) && r.innerText.length < 700); const r = rows[rows.length - 1]; const b = r && [...r.querySelectorAll('button')].find((x) => x.innerText.trim() === l); b?.click(); return !!b; }, name, label);
      await clickClassBtn('Python Căn bản & Tư duy Thuật toán (K6-9)', 'Phân công');
      await sleep(900);
      await a.page.type('input[aria-label="Tìm giảng viên"]', TAG.replace('E2E-', ''), { delay: 3 }).catch(() => undefined);
      await sleep(900);
      const ticked = await a.page.evaluate((fn) => { const lab = [...document.querySelectorAll('label')].find((l) => l.innerText.includes(fn) && l.querySelector('input[type=checkbox]')); const cb = lab?.querySelector('input[type=checkbox]'); if (cb && !cb.checked) cb.click(); return !!cb; }, fullName);
      await sleep(1800);
      const assigned = await db.collection('classrooms').findOne({ code: 'CL-69PY01' });
      const tid = String(doc?._id);
      chk('4.assign-teacher', 'Admin tick phân công giảng viên vừa đổi vai trò vào lớp K6-9 → lưu ngay (có toast thành công, DB ghi nhận)', ticked && (assigned.teacherIds || []).map(String).includes(tid), `tick=${ticked}, teacherIds có GV mới=${(assigned.teacherIds || []).map(String).includes(tid)}`);
      await a.goto('admin/classes');
      await clickClassBtn('Python Căn bản & Tư duy Thuật toán (K6-9)', 'Phân công');
      await sleep(1000);
      const persists = await a.page.evaluate((fn) => [...document.querySelectorAll('button')].some((b) => (b.getAttribute('aria-label') || '') === `Gỡ ${fn} khỏi lớp`), fullName);
      chk('4.assign-persist', 'Tải lại /admin/classes: mở "Phân công" lớp K6-9, giảng viên mới vẫn có trong danh sách phụ trách (lưu bền vững)', persists);
      noIssues('4.classes.clean', 'Phân công giảng viên cho lớp', a);

      // khóa giảng viên đang đứng lớp → 409
      await a.goto('admin/users');
      await a.page.type('input[aria-label="Tìm theo tên hoặc email"]', email, { delay: 3 });
      await sleep(1500);
      a.allow(/^409 /, /console .*(409|Conflict)/);
      await clickRow('Khóa');
      await a.waitText('Khóa tài khoản?', 8000);
      chk('4.lock-confirm', 'Bấm "Khóa": hiện hộp xác nhận "Khóa tài khoản?" nêu hậu quả (bị đăng xuất, không đăng nhập được)', /sẽ bị đăng xuất ngay/.test(await a.text()));
      await a.page.evaluate(() => [...document.querySelectorAll('[role=dialog] button')].find((b) => b.innerText.trim() === 'Khóa tài khoản')?.click());
      await sleep(2000);
      const afterLock = await a.text();
      const lockMsg = (afterLock.match(/[^.]*(phụ trách|đang đứng lớp|còn phụ trách)[^.]*/i) || [''])[0].trim();
      const stillActive = (await db.collection('users').findOne({ email }))?.status !== 'LOCKED';
      chk('4.lock-409', 'Khóa giảng viên đang đứng lớp → UI hiện thông báo chặn rõ ràng (tiếng Việt, nêu lớp phụ trách); tài khoản chưa bị khóa', stillActive && lockMsg.length > 0, lockMsg.slice(0, 200) || afterLock.slice(0, 200));
      await a.shot('admin-lock-409');
      noIssues('4.lock.clean', 'Khóa giảng viên (409 có chủ đích)', a);
      await a.close();
    });

    // ====================================================================================================
    await flow('5', 'CỐ TÌNH PHÁ (negative & edge cases)', async () => {
      // 5.1 đăng nhập sai
      {
        const ctx = await e2e.browser.createBrowserContext();
        const page = await ctx.newPage();
        const errs = [];
        page.on('pageerror', (e) => errs.push(e.message));
        await e2e.waitApi();
        await page.goto(`${FE}/login`, { waitUntil: 'networkidle2' });
        await page.type('#login-email', 'lop6-9@gmail.com');
        await page.type('#login-password', 'sai-mat-khau');
        await page.click('button[type=submit]');
        await sleep(2000);
        const txt = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
        chk('5.wrong-password', 'Đăng nhập sai mật khẩu: ở lại /login, báo lỗi tiếng Việt, không pageerror', new URL(page.url()).pathname === '/login' && /không chính xác|không đúng|sai/i.test(txt) && errs.length === 0, (txt.match(/[^.]*(không chính xác|không đúng)[^.]*/i) || [''])[0].trim().slice(0, 120));
        // 5.2 chưa đăng nhập vào trang cần quyền
        const bad = [];
        for (const p of ['teacher/dashboard', 'admin/users', 'playground', 'my-class', 'quiz', 'progress', 'teacher/authoring']) {
          await page.goto(`${FE}/${p}`, { waitUntil: 'networkidle2' });
          await sleep(500);
          const path = new URL(page.url()).pathname;
          if (path !== '/login') bad.push(`${p} → ${path}`);
        }
        chk('5.guest-guard', 'Khách (chưa đăng nhập) vào /teacher /admin /playground /my-class /quiz /progress → luôn về /login', bad.length === 0, bad.join('; '));
        await ctx.close();
      }
      // 5.3 / 5.4 phân quyền chéo vai trò
      {
        const { session: s } = await e2e.login('lop6-9@gmail.com');
        const bad = [];
        for (const p of ['teacher/authoring', 'teacher/classes', 'admin/users', 'admin/dashboard']) {
          await s.goto(p);
          await sleep(500);
          if (s.path !== '/playground') bad.push(`${p} → ${s.path}`);
        }
        chk('5.student-cross-role', 'Học sinh gõ /teacher/* và /admin/* → về trang của học sinh (/playground), không lộ giao diện quản trị', bad.length === 0, bad.join('; '));
        await s.goto('khong-ton-tai-123');
        const lay = await s.layoutProblems();
        chk('5.404', 'Đường dẫn không tồn tại: không trắng trang / không lỗi (chuyển về trang chính hoặc báo không tìm thấy)', lay.length === 0 && (s.text ? (await s.text()).length > 30 : true), `${s.path} ${lay.join(', ')}`);
        noIssues('5.student.clean', 'Học sinh gõ URL quản trị', s);
        await s.close();
        const { session: tt } = await e2e.login('teacher6-9@gmail.com');
        await tt.goto('admin/users');
        await sleep(500);
        chk('5.teacher-cross-role', 'Giảng viên gõ /admin/users → về /teacher/dashboard', tt.path === '/teacher/dashboard', tt.path);
        noIssues('5.teacher.clean', 'Giảng viên gõ URL admin', tt);
        await tt.close();
      }
      // 5.5 bấm Submit liên tiếp (double-click): chỉ 1 bài nộp, nút bị vô hiệu khi đang chấm
      {
        const { session: s } = await e2e.login('lop6-9@gmail.com');
        const uid = String((await db.collection('users').findOne({ email: 'lop6-9@gmail.com' }))._id);
        const track = await trackOf('python-fundamentals', ['6-9']);
        const done = new Set((await db.collection('submissions').find({ userId: uid, status: 'AC', assignmentId: { $exists: false } }).toArray()).map((x) => x.exerciseId));
        const next = track.find((x) => !done.has(String(x._id)));
        const nth = track.indexOf(next) + 1;
        await s.goto('playground');
        await s.clickText(`#${nth}`);
        await s.waitText('Run');
        await s.setEditor(await solutionOf(next.slug));
        const before = await db.collection('submissions').countDocuments({ userId: uid, exerciseId: String(next._id) });
        const btn = (await s.findClickable('Submit', { selector: 'button', exact: true }))[0];
        await btn.click();
        await btn.click().catch(() => undefined);
        await btn.click().catch(() => undefined);
        await sleep(4000);
        const after = await db.collection('submissions').countDocuments({ userId: uid, exerciseId: String(next._id) });
        chk('5.double-submit', `Bấm Submit 3 lần liên tiếp ở bài #${nth}: chỉ tạo 1 bài nộp (nút bị vô hiệu khi đang chấm)`, after - before === 1, `bài nộp mới: ${after - before}`);
        await s.waitText('Bài tiếp theo', 120000);
        // F5 giữa chừng: danh sách vẫn đúng
        await s.page.reload({ waitUntil: 'networkidle2' });
        await sleep(800);
        const cs = await cards(s);
        chk('5.reload', 'F5 sau khi nộp: danh sách Playground tải lại đúng trạng thái từ máy chủ (không phụ thuộc localStorage)', cs.length === 20 && /Đã hoàn thành/.test(cs[nth - 1].text), `#${nth}: ${cs[nth - 1]?.text.slice(0, 40)}`);
        // nút Back của trình duyệt (Playground dùng trạng thái nội bộ, không có route riêng cho màn làm bài)
        await s.clickText(`#${nth + 1}`);
        await s.waitText('Run');
        await s.page.goBack().catch(() => undefined);
        await sleep(900);
        const afterBack = s.path;
        console.log(`  ℹ Quan sát: sau khi bấm bài rồi bấm nút Back của trình duyệt → ${afterBack} (màn làm bài không có URL riêng)`);
        noIssues('5.double.clean', 'Submit liên tiếp + F5 + Back', s);
        await s.close();
      }
      // 5.6 XSS trong nội dung câu hỏi của giảng viên
      {
        const { session: t } = await e2e.login('teacher6-9@gmail.com');
        const payload = `${TAG}<img src=x onerror="window.__xss=1">`;
        await t.goto('teacher/authoring');
        await t.clickText('Câu hỏi Trắc nghiệm', { selector: 'button' });
        await t.page.waitForSelector('#qz-content');
        await t.page.type('#qz-content', payload);
        const opts = await t.page.$$('input[aria-label^="Nội dung đáp án"]');
        for (let i = 0; i < opts.length; i++) await opts[i].type(`xss-${i}`);
        await t.page.click('input[aria-label="Đáp án A là đáp án đúng"]');
        await t.page.type('#qz-explain', '<script>window.__xss=2</script>');
        await t.clickText('Lưu', { selector: 'button[type=submit]' });
        await sleep(1500);
        await t.goto('teacher/authoring/bank');
        await t.clickText('Câu Trắc nghiệm', { selector: '[role=tab]' });
        await sleep(1500);
        const xss = await t.page.evaluate(() => ({ flag: window.__xss ?? null, imgs: document.querySelectorAll('img[src="x"]').length, shown: document.body.innerText.includes('<img src=x') }));
        chk('5.xss', 'XSS: nội dung câu hỏi chứa <img onerror> và <script> hiển thị như chữ, KHÔNG thực thi (không có window.__xss, không có thẻ img lạ)', xss.flag === null && xss.imgs === 0 && xss.shown, JSON.stringify(xss));
        await t.close();
      }
    });
  } finally {
    // Dọn dữ liệu tạm của đợt chạy (bài, câu hỏi, bài giao, tài khoản thử gắn nhãn ${TAG} / e2e-${STAMP}).
    try {
      const tmpUsers = await db.collection('users').find({ email: new RegExp(`^e2e-${STAMP}@`) }).toArray();
      const tmpIds = tmpUsers.map((u) => String(u._id));
      const exs = await db.collection('exercises').find({ title: new RegExp(`^${TAG}`) }).project({ slug: 1 }).toArray();
      const qs = await db.collection('questions').find({ content: new RegExp(TAG) }).project({ _id: 1 }).toArray();
      await db.collection('class_assignments').deleteMany({ $or: [{ title: new RegExp(TAG) }, { exerciseSlug: { $in: exs.map((x) => x.slug) } }, { questionIds: { $in: qs.map((q) => String(q._id)) } }] });
      await db.collection('submissions').deleteMany({ exerciseId: { $in: exs.map((x) => String(x._id)) } });
      await db.collection('exercises').deleteMany({ title: new RegExp(`^${TAG}`) });
      await db.collection('questions').deleteMany({ content: new RegExp(TAG) });
      if (tmpIds.length) {
        await db.collection('classrooms').updateMany({}, { $pull: { teacherIds: { $in: tmpIds }, studentIds: { $in: tmpIds } } });
        await db.collection('classrooms').updateMany({ teacherId: { $in: tmpIds } }, { $unset: { teacherId: 1 } });
        await db.collection('users').deleteMany({ _id: { $in: tmpUsers.map((u) => u._id) } });
      }
    } catch (e) {
      console.error('Dọn dữ liệu tạm lỗi:', e.message);
    }
    await e2e.stop();
    await mongoose.disconnect();
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} PASS${failed.length ? `, ${failed.length} FAIL` : ''}`);
  if (issuesByFlow.length) {
    console.log('\nLỗi trình duyệt thu được:');
    for (const i of issuesByFlow) console.log(`  [${i.flow}/${i.id}] ${i.kind}: ${i.msg} @ ${i.url}`);
  }
  process.exitCode = failed.length ? 1 : 0;
})().catch((e) => {
  console.error(`E2E lỗi: ${e.stack || e.message}`);
  process.exitCode = 1;
});
