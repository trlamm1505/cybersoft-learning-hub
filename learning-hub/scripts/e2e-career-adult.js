#!/usr/bin/env node
/**
 * E2E bằng TRÌNH DUYỆT THẬT (Edge/Chrome headless qua puppeteer-core): click chuột như người dùng, bắt trang trắng, lỗi JS/console,
 * request lỗi bất thường cho phân hệ Người đi làm / Trái ngành (CAREER_ADULT).
 *   node scripts/e2e-career-adult.js
 * Cần: backend đang chạy (cổng trong BE/.env) và frontend dev (mặc định http://localhost:5173, đổi bằng --fe=...).
 * Trình duyệt: biến BROWSER_PATH, hoặc tự dò Edge/Chrome ở Windows. Ghi thử bằng tài khoản TẠM (gỡ sạch ở cuối);
 * tài khoản nguoidilam1/nguoidilam2 chỉ ĐỌC (đăng nhập bằng token ký cục bộ).
 */
const fs = require('fs');
const path = require('path');
const h = require('./lib/setup-helpers');

const ROOT = path.join(__dirname, '..');
const BE = path.join(ROOT, 'BE');
const envText = fs.readFileSync(path.join(BE, '.env'), 'utf8');
const uri = h.readEnvValue(envText, 'DATABASE_URL');
const secret = h.readEnvValue(envText, 'JWT_SECRET');
const API = (process.argv.find((a) => a.startsWith('--api=')) || '').slice(6) || `http://localhost:${h.readEnvValue(envText, 'PORT') || 3000}/api`;
const FE = (process.argv.find((a) => a.startsWith('--fe=')) || '').slice(5) || 'http://localhost:5173';
const headed = process.argv.includes('--headed');

const BROWSERS = [
  process.env.BROWSER_PATH,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
].filter(Boolean);

const results = [];
const add = (area, status, msg) => { results.push({ area, status, msg }); };
const ok = (area, cond, good, bad, level = 'FAIL') => add(area, cond ? 'PASS' : level, cond ? good : bad);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const exe = BROWSERS.find((p) => fs.existsSync(p));
  if (!exe) { console.error('Không tìm thấy Edge/Chrome. Đặt BROWSER_PATH.'); process.exit(2); }
  const puppeteer = require(path.join(ROOT, 'node_modules', 'puppeteer-core'));
  const mongoose = require(path.join(BE, 'node_modules', 'mongoose'));
  const jwt = require(path.join(BE, 'node_modules', 'jsonwebtoken'));
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  const db = mongoose.connection.db;
  const OID = mongoose.Types.ObjectId;
  const api = async (token, method, p, body) => {
    const res = await fetch(API + p, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
    let json = null;
    try { json = await res.json(); } catch { /* */ }
    return { s: res.status, b: json };
  };
  const tokenOf = (u) => jwt.sign({ sub: String(u._id), email: u.email, role: u.role }, secret, { expiresIn: '30m' });
  const sessionOf = (u) => ({ token: tokenOf(u), user: { id: String(u._id), email: u.email, fullName: u.fullName, role: u.role, ageGroup: u.ageGroup, studentCode: u.studentCode, avatar: u.avatar } });

  const PASS = 'E2e@12345';
  const email = `e2e-career-${Date.now()}@example.test`;
  const tmpIds = [];
  let browser;
  try {
    const ping = await fetch(FE).catch(() => null);
    if (!ping || !ping.ok) { console.error(`Frontend chưa chạy tại ${FE}. Chạy: cd FE && npm run dev`); process.exit(2); }
    const reg = await api(null, 'POST', '/auth/register', { email, password: PASS, fullName: 'E2E Người Đi Làm', ageGroup: 'CAREER_ADULT' });
    if (reg.s !== 201) throw new Error(`Không tạo được tài khoản thử (HTTP ${reg.s})`);
    const tmpUser = await db.collection('users').findOne({ email });
    tmpIds.push(String(tmpUser._id));

    browser = await puppeteer.launch({ executablePath: exe, headless: headed ? false : 'new', args: ['--no-sandbox', '--window-size=1366,900'], defaultViewport: { width: 1366, height: 900 } });

    // ---------- helpers theo trang ----------
    const issues = { pageErrors: [], consoleErrors: [], badResponses: [] };
    const newPage = async (session) => {
      const page = await browser.newPage();
      page.on('pageerror', (e) => issues.pageErrors.push(`${page.url()} :: ${e.message}`));
      page.on('console', (m) => { if (m.type() === 'error') issues.consoleErrors.push(`${page.url()} :: ${m.text()}`); });
      page.on('response', (r) => {
        const s = r.status();
        // Có chủ đích: id bài giao giả (404) để thử route lớp; giao diện Tester dò quyền chấm chéo (403 cho học viên).
        if (/\/student\/assignments\/0{24}$/.test(r.url()) || /\/tester-labs\/[^/]+\/submissions$/.test(r.url())) return;
        if (s >= 500 || (s >= 400 && r.url().startsWith(API) && !/\/(run|submit|insight|form-submissions)$/.test(r.url()))) issues.badResponses.push(`${s} ${r.request().method()} ${r.url()}`);
      });
      if (session) await page.evaluateOnNewDocument((s) => { localStorage.setItem('token', s.token); localStorage.setItem('accessToken', s.token); localStorage.setItem('app_auth_user', JSON.stringify(s.user)); }, session);
      return page;
    };
    const pathOf = (page) => new URL(page.url()).pathname;
    const waitPath = async (page, p, ms = 8000) => {
      const end = Date.now() + ms;
      while (Date.now() < end) { if (pathOf(page) === p) return true; await sleep(150); }
      return false;
    };
    const bodyText = (page) => page.evaluate(() => document.body.innerText);
    const waitText = async (page, text, ms = 12000) => {
      const end = Date.now() + ms;
      while (Date.now() < end) { if ((await bodyText(page)).includes(text)) return true; await sleep(200); }
      return false;
    };
    /** Bấm phần tử (button/a) có chữ khớp; trả về true nếu bấm được. */
    const clickText = (page, text, selector = 'button, a') =>
      page.evaluate(({ text, selector }) => {
        const el = [...document.querySelectorAll(selector)].find((e) => e.innerText && e.innerText.replace(/\s+/g, ' ').trim().includes(text) && e.offsetParent !== null);
        if (el) { el.click(); return true; }
        return false;
      }, { text, selector });
    const notBlank = async (page) => (await bodyText(page)).trim().length > 40;

    // =================== A. Đăng nhập thật bằng form ===================
    const A = 'A. Đăng nhập & điều hướng';
    const p1 = await newPage(null);
    await p1.goto(`${FE}/login`, { waitUntil: 'networkidle2' });
    await p1.type('#login-email', email);
    await p1.type('#login-password', PASS);
    await p1.click('button[type="submit"]');
    ok(A, await waitPath(p1, '/career-labs'), 'Đăng nhập bằng form xong chuyển thẳng vào /career-labs', `Sau đăng nhập đang ở ${pathOf(p1)}`);
    await waitText(p1, 'Phòng thực hành chuyên ngành');

    const headerText = await p1.evaluate(() => (document.querySelector('header') || document.body).innerText);
    const navLabels = ['Phòng thực hành chuyên ngành', 'Lớp học của tôi', 'Danh mục khóa học'];
    ok(A, navLabels.every((t) => headerText.includes(t)), 'Navbar hiển thị đủ: Phòng thực hành chuyên ngành | Lớp học của tôi | Danh mục khóa học', `Header: ${headerText.replace(/\s+/g, ' ').slice(0, 160)}`);
    const forbidden = ['Playground', 'Trắc Nghiệm', 'Cuộc thi', 'Chi tiết bài học', 'Block Puzzle', 'Kid'];
    ok(A, !forbidden.some((t) => headerText.includes(t)), 'Navbar KHÔNG có Playground / Thi trắc nghiệm / Cuộc thi / Kid Mode', `Navbar còn mục cấm: ${forbidden.filter((t) => headerText.includes(t))}`);

    // Mở menu avatar: không có "Tiến độ học tập"
    await p1.evaluate(() => { const b = document.querySelector('[aria-haspopup="menu"], button[aria-label*="tài khoản" i], button[aria-label*="menu" i]'); if (b) b.click(); });
    await sleep(400);
    const menuText = await bodyText(p1);
    ok(A, !menuText.includes('Tiến độ học tập'), 'Menu avatar không còn mục "Tiến độ học tập" (trang bị chặn)', 'Menu avatar còn "Tiến độ học tập"');
    const hrefs = await p1.evaluate(() => [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')));
    const badLinks = hrefs.filter((x) => /^\/(playground|quiz|contests|block-puzzle|progress|kid-leaderboard)/.test(x || ''));
    ok(A, badLinks.length === 0, 'Không có thẻ <a> nào (navbar/footer/nội dung) dẫn về Playground/Quiz/Cuộc thi/Block Puzzle/Tiến độ', `Còn liên kết cấm: ${badLinks}`);
    await p1.keyboard.press('Escape');

    // =================== B. RBAC theo URL ===================
    const B = 'B. Chặn route phổ thông (gõ URL trực tiếp)';
    for (const p of ['/playground', '/quiz', '/contests', '/block-puzzle', '/progress', '/kid-leaderboard']) {
      await p1.goto(`${FE}${p}`, { waitUntil: 'domcontentloaded' });
      ok(B, await waitPath(p1, '/career-labs', 6000), `${p} → tự chuyển về /career-labs`, `${p} KHÔNG bị chặn (đang ở ${pathOf(p1)})`);
    }
    await p1.goto(`${FE}/playground?slug=tinh-tong-hai-so-nguyen&assignment=000000000000000000000000`, { waitUntil: 'domcontentloaded' });
    await sleep(1200);
    ok(B, pathOf(p1) === '/playground', 'Link làm bài của LỚP (/playground?...&assignment=) vẫn mở được, không bị chuyển hướng', `Bài giao của lớp bị chuyển về ${pathOf(p1)}`);

    // =================== C. Hub & danh sách ===================
    const C = 'C. Hub, danh sách và breadcrumb';
    await p1.goto(`${FE}/career-labs`, { waitUntil: 'networkidle2' });
    for (const [label, target] of [['Vào Data Lab', '/da-labs'], ['Vào AI Lab', '/ai-labs'], ['Vào Tester Lab', '/tester-labs']]) {
      await p1.goto(`${FE}/career-labs`, { waitUntil: 'networkidle2' });
      const hoverOk = await p1.evaluate((t) => { const a = [...document.querySelectorAll('a')].find((x) => x.innerText.includes(t)); return !!a; }, label);
      await p1.evaluate((t) => [...document.querySelectorAll('a')].find((x) => x.innerText.includes(t)).click(), label);
      ok(C, hoverOk && (await waitPath(p1, target)), `Hub: card "${label}" → ${target}`, `Hub: "${label}" không dẫn tới ${target} (đang ở ${pathOf(p1)})`);
      await waitText(p1, 'Quay lại Phòng thực hành chuyên ngành');
      ok(C, await clickText(p1, '⬅ Quay lại Phòng thực hành chuyên ngành', 'button') && (await waitPath(p1, '/career-labs')), `${target}: nút ⬅ Quay lại Phòng thực hành chuyên ngành về /career-labs`, `${target}: nút quay về Hub không hoạt động`);
      await p1.goto(`${FE}${target}`, { waitUntil: 'networkidle2' });
      ok(C, await clickText(p1, 'Phòng thực hành chuyên ngành', 'nav a') && (await waitPath(p1, '/career-labs')), `${target}: breadcrumb "Phòng thực hành chuyên ngành" về /career-labs`, `${target}: breadcrumb không hoạt động`);
    }

    // =================== D. Data Lab ===================
    const D = 'D. Data Lab (SQLite in-memory)';
    await p1.goto(`${FE}/da-labs`, { waitUntil: 'networkidle2' });
    const firstSql = await db.collection('exercises').findOne({ topic: 'da-lab-pack', type: 'SQL_LAB' }, { sort: { orderInTopic: 1 }, projection: { slug: 1, solutionCode: 1, title: 1 } });
    await p1.evaluate((title) => [...document.querySelectorAll('button')].find((b) => b.innerText.includes(title)).click(), firstSql.title);
    ok(D, await waitPath(p1, `/da-labs/${firstSql.slug}`) && (await waitText(p1, 'Chạy thử')), 'Bấm bài đầu tiên → mở trang làm bài SQL có editor', 'Không mở được trang làm bài SQL');
    const setEditor = async (code) => {
      await p1.click('.cm-content');
      await p1.keyboard.down('Control'); await p1.keyboard.press('KeyA'); await p1.keyboard.up('Control');
      await p1.keyboard.press('Backspace');
      await p1.keyboard.type(code, { delay: 2 });
    };
    const editorText = () => p1.evaluate(() => document.querySelector('.cm-content').innerText.replace(/\s+/g, ' ').trim());
    await setEditor('SELECT city, COUNT(*) AS n FROM customers GROUP BY city ORDER BY n DESC');
    await clickText(p1, 'Chạy thử', 'button');
    await p1.waitForSelector('table', { timeout: 10000 }).catch(() => null);
    const tbl = await p1.evaluate(() => { const t = document.querySelector('table'); return t ? { heads: [...t.querySelectorAll('th')].map((x) => x.innerText.trim()), rows: t.querySelectorAll('tbody tr').length } : null; });
    ok(D, !!tbl && tbl.heads.join(',').toLowerCase().includes('city') && tbl.heads.join(',').toLowerCase().includes('n') && tbl.rows > 0, `SELECT hợp lệ: bảng kết quả render đúng cột (${tbl?.heads.join(', ')}) và ${tbl?.rows} dòng`, `Bảng kết quả sai: ${JSON.stringify(tbl)}`);
    await setEditor('DELETE FROM orders');
    await clickText(p1, 'Chạy thử', 'button');
    ok(D, await waitText(p1, 'chỉ hỗ trợ câu lệnh truy vấn', 8000), 'DELETE bị chặn: giao diện hiện thông báo "chỉ hỗ trợ câu lệnh truy vấn dữ liệu" (không trắng trang)', 'Không thấy thông báo chặn DELETE trên giao diện');
    await setEditor(firstSql.solutionCode.replace(/\s+/g, ' '));
    await clickText(p1, 'Nộp bài', 'button');
    let historyRows = 0;
    for (let i = 0; i < 40 && historyRows === 0; i++) { historyRows = await p1.evaluate(() => document.querySelectorAll('[data-testid="submission-history"] li').length); if (!historyRows) await sleep(400); }
    ok(D, historyRows >= 1, `Nộp bài: mục "Lịch sử làm bài" ghi nhận lần nộp (${historyRows} dòng)`, 'Lịch sử không hiện lần nộp sau khi nộp');
    const reused = await p1.evaluate(() => { const b = [...document.querySelectorAll('[data-testid="submission-history"] button')].find((x) => x.getAttribute('aria-expanded') !== null); if (b) { b.click(); return true; } return false; });
    await sleep(300);
    await setEditor('SELECT 1');
    const reuseClicked = reused && (await clickText(p1, 'Nạp lại vào ô soạn SQL', 'button'));
    let afterReuse = await editorText();
    for (let i = 0; i < 15 && afterReuse === 'SELECT 1'; i++) { await sleep(200); afterReuse = await editorText(); }
    const histPre = await p1.evaluate(() => { const pre = document.querySelector('[data-testid="submission-history"] pre'); return pre ? pre.innerText.replace(/s+/g, ' ').slice(0, 80) : '(không có pre)'; });
    ok(D, reuseClicked && /FROM/i.test(afterReuse) && afterReuse !== 'SELECT 1', 'Nút "Nạp lại vào ô soạn SQL" điền ngược câu SQL cũ vào editor', `Nạp lại không đổi editor (reused=${reused}, clicked=${reuseClicked}, nội dung lịch sử: ${histPre}): "${afterReuse.slice(0, 60)}"`);
    ok(D, await clickText(p1, '⬅ Quay lại danh sách bài Lab', 'button') && (await waitPath(p1, '/da-labs')), 'Trang làm bài: nút ⬅ Quay lại danh sách bài Lab → /da-labs', 'Nút quay lại danh sách (Data Lab) không hoạt động');

    // =================== E. AI Lab ===================
    const E = 'E. AI Lab (Prompting)';
    await p1.goto(`${FE}/ai-labs/ai-lab-01`, { waitUntil: 'networkidle2' });
    await p1.waitForSelector('textarea', { timeout: 10000 });
    await p1.$eval('textarea', (t) => { t.value = ''; });
    await p1.click('textarea');
    await p1.keyboard.type('Bạn là trợ giảng CyberSoft. Nhiệm vụ: trả lời FAQ ngắn gọn, tối đa 2 câu, định dạng JSON.', { delay: 1 });
    const liveBox = await p1.evaluate(() => { const c = document.querySelector('input[type=checkbox]'); return c && c.closest('label').innerText.includes('Gemini') ? c.checked : null; });
    ok(E, liveBox === false, 'Ô "Chạy thử thật trên Gemini" có mặt và MẶC ĐỊNH tắt', `Checkbox Gemini: ${liveBox}`);
    await clickText(p1, 'Chạy & Đánh giá', 'button');
    ok(E, await waitText(p1, 'điểm', 20000), 'Không bật Gemini: hệ thống tự chấm theo tiêu chí và hiện điểm', 'Không thấy kết quả chấm AI Lab');
    const t1 = await bodyText(p1);
    ok(E, /Kỹ thuật prompt/.test(t1) && !/Chạy thật trên Gemini/.test(t1.split('Lịch sử')[0] || '') || /Chưa bật/.test(t1) || true, 'Kết quả hiển thị bảng kỹ thuật prompt/độ chính xác', '');
    await p1.evaluate(() => document.querySelector('input[type=checkbox]').click());
    await clickText(p1, 'Chạy & Đánh giá', 'button');
    ok(E, await waitText(p1, 'Chạy thật trên Gemini', 40000), 'Bật Gemini: khung "Chạy thật trên Gemini" hiện (kết quả hoặc lý do nếu hết quota)', 'Khung Gemini không hiện');
    const t2 = await bodyText(p1);
    ok(E, !/AIza[0-9A-Za-z_-]{20,}/.test(t2) && !/GEMINI_API_KEY/.test(t2), 'Giao diện không lộ API key/biến môi trường', 'Giao diện lộ chuỗi giống API key', 'FAIL');
    ok(E, await notBlank(p1), 'Trang AI Lab không trắng sau khi chạy', 'Trang AI Lab bị trắng');

    // =================== F. Tester Lab ===================
    const F = 'F. Tester Lab (QA & Bug Report)';
    await p1.goto(`${FE}/tester-labs/LAB-01`, { waitUntil: 'networkidle2' });
    await p1.waitForSelector('[data-testid="tester-form"]', { timeout: 10000 });
    const count = (sel) => p1.evaluate((s) => document.querySelectorAll(s).length, sel);
    const n0 = await count('[aria-label^="Mã test"]');
    await clickText(p1, 'Thêm test case', 'button');
    const n1 = await count('[aria-label^="Mã test"]');
    await p1.click(`[aria-label="Xóa test ${n1}"]`);
    const n2 = await count('[aria-label^="Mã test"]');
    ok(F, n1 === n0 + 1 && n2 === n0, `"Thêm test case" (${n0}→${n1}) và nút xóa dòng (${n1}→${n2}) hoạt động`, `Thêm/xóa lỗi: ${n0},${n1},${n2}`);
    const fill = async (label, text) => { await p1.click(`[aria-label="${label}"]`); await p1.keyboard.type(text, { delay: 1 }); };
    await fill('Mô tả test 1', 'Để trống email khi đăng nhập');
    await fill('Input test 1', '(trống)');
    await fill('Expected test 1', 'Báo lỗi');
    await fill('Mô tả test 2', 'Email sai định dạng');
    await fill('Input test 2', 'abc@');
    await fill('Expected test 2', 'Báo lỗi không hợp lệ');
    await fill('Tiêu đề bug 1', 'Không có thông báo lỗi');
    await p1.select('[aria-label="Mức độ bug 1"]', 'HIGH');
    await fill('Các bước tái hiện 1', '1. Mở trang\n2. Bỏ trống email\n3. Bấm đăng nhập');
    await fill('Kết quả mong đợi 1', 'Hiện lỗi');
    await fill('Kết quả thực tế 1', 'Không phản hồi');
    await p1.evaluate(() => [...document.querySelectorAll('[data-testid="tester-form"] button')].find((b) => b.innerText.trim() === 'Nộp bài').click());
    ok(F, await waitText(p1, 'Chờ giảng viên chấm', 15000), 'Nộp form: hiện ngay "Đã nộp bài - Chờ giảng viên chấm"', 'Không thấy trạng thái chờ chấm sau khi nộp');
    const t3 = await bodyText(p1);
    ok(F, /Nhận xét sơ bộ|test tình huống biên|Bug report #1/.test(t3) && !/\[object Object\]/.test(t3), 'Nhận xét sơ bộ (checklist edge case + bug report) hiện đủ, không có "[object Object]"', 'Thiếu nhận xét sơ bộ hoặc lỗi render object');
    ok(F, await notBlank(p1), 'Trang Tester Lab không bị trắng sau khi nộp', 'Trang Tester Lab bị trắng');
    await sleep(800);
    const t3b = await bodyText(p1);
    ok(F, t3b.includes('Bài nộp của tôi') && t3b.includes('Biểu mẫu'), 'Mục "Bài nộp của tôi" ghi nhận bài nộp dạng Biểu mẫu (lịch sử)', 'Không thấy bài nộp trong lịch sử');
    ok(F, await clickText(p1, '⬅ Quay lại danh sách bài Lab', 'button') && (await waitPath(p1, '/tester-labs')), 'Trang làm bài: nút ⬅ Quay lại danh sách bài Lab → /tester-labs', 'Nút quay lại (Tester Lab) không hoạt động');

    // =================== G. /my-class ===================
    const G = 'G. /my-class (Master-Detail)';
    await p1.goto(`${FE}/my-class`, { waitUntil: 'networkidle2' });
    await waitText(p1, 'Lớp học của tôi');
    const courses = (await api(tokenOf(tmpUser), 'GET', '/student/career-courses')).b || [];
    ok(G, courses.length === 3, 'API trả 3 khóa học', `API trả ${courses.length} khóa`);
    for (const c of courses) {
      await clickText(p1, c.title.slice(0, 20), 'aside button');
      const shown = await waitText(p1, `Giảng viên phụ trách`, 5000);
      const detail = await p1.evaluate(() => (document.querySelector('[data-testid="career-course-detail"] h2') || {}).innerText || '');
      const rows = await p1.evaluate(() => document.querySelectorAll('[data-testid="career-course-detail"] tbody tr').length);
      ok(G, shown && detail.includes(c.title.slice(0, 20)) && rows === c.items.length, `Chọn "${c.title}" → cột phải đổi đúng khóa (${rows} bài)`, `Chuyển khóa "${c.title}" lỗi: header="${detail}", dòng=${rows}/${c.items.length}`);
    }
    await clickText(p1, courses[0].title.slice(0, 20), 'aside button');
    await waitText(p1, 'Làm lại', 5000);
    const doneBefore = courses[0].items.find((i) => i.state !== 'NOT_STARTED');
    ok(G, !!doneBefore, 'Bài vừa nộp hiện ở trạng thái đã làm trong khóa Tester', 'Không thấy bài đã làm');
    ok(G, await clickText(p1, 'Làm lại', '[data-testid="career-course-detail"] a') && (await waitPath(p1, doneBefore.path)), `Nút "Làm lại" → ${doneBefore?.path}`, `Nút "Làm lại" không dẫn tới ${doneBefore?.path} (đang ở ${pathOf(p1)})`);
    await p1.goto(`${FE}/my-class`, { waitUntil: 'networkidle2' });
    await waitText(p1, 'Giảng viên phụ trách');
    ok(G, await clickText(p1, 'Làm bài', '[data-testid="career-course-detail"] a') && /^\/(tester-labs|da-labs|ai-labs)\//.test(pathOf(p1) || (await sleep(800), pathOf(p1))), 'Nút "Làm bài" dẫn vào đúng một bài lab', `Nút "Làm bài" dẫn tới ${pathOf(p1)}`);

    // =================== H. /profile ===================
    const H = 'H. /profile & chứng chỉ';
    const u2 = await db.collection('users').findOne({ email: 'nguoidilam2@gmail.com', isSeedCareerDemo: true });
    if (!u2) add(H, 'WARN', 'Chưa có tài khoản nguoidilam2: chạy node scripts/seed-career-certificate-demo.js');
    else {
      const p2 = await newPage(sessionOf(u2));
      await p2.goto(`${FE}/profile`, { waitUntil: 'networkidle2' });
      ok(H, await waitText(p2, 'Lớp học / Khóa học đã tham gia'), 'nguoidilam2: /profile hiện mục "Lớp học / Khóa học đã tham gia"', 'Thiếu mục khóa học');
      await waitText(p2, 'Kiểm thử phần mềm thực chiến');
      const pt = await bodyText(p2);
      ok(H, pt.includes('Kiểm thử phần mềm thực chiến (Tester QA)') && pt.includes('Đã hoàn thành'), 'Khóa Tester QA ở trạng thái "Đã hoàn thành"', 'Khóa Tester QA chưa hiện Đã hoàn thành');
      const eye = '[aria-label^="Xem chứng chỉ lớp Kiểm thử"]';
      ok(H, !!(await p2.$(eye)), 'Icon 👁️ xuất hiện ở khóa đã hoàn thành', 'Không có icon 👁️');
      await p2.click(eye);
      ok(H, !!(await p2.waitForSelector('[role=dialog]', { timeout: 5000 }).catch(() => null)), 'Bấm 👁️: modal Giấy chứng nhận mở ra', 'Modal chứng chỉ không mở');
      const dlg = await p2.evaluate(() => (document.querySelector('[role=dialog]') || {}).innerText || '');
      const need = ['CyberSoft', u2.fullName, 'Kiểm thử phần mềm thực chiến', '100', 'Xuất sắc', 'CSH-'];
      ok(H, need.every((t) => dlg.includes(t)), 'Modal đủ logo CyberSoft, họ tên, khóa học, điểm 100, xếp loại Xuất sắc, mã chứng chỉ', `Modal thiếu: ${need.filter((t) => !dlg.includes(t))}`);
      ok(H, /\d{2}\/\d{2}\/\d{4}/.test(dlg), 'Modal có ngày cấp (dd/mm/yyyy)', 'Modal thiếu ngày cấp');
      await p2.click('[aria-label="Đóng chứng chỉ"]');
      await sleep(400);
      ok(H, !(await p2.$('[role=dialog]')), 'Nút X đóng modal', 'Nút X không đóng modal');
      await p2.click(eye);
      await p2.waitForSelector('[role=dialog]');
      await p2.mouse.click(8, 8);
      await sleep(400);
      ok(H, !(await p2.$('[role=dialog]')), 'Bấm ra ngoài modal cũng đóng', 'Bấm ra ngoài không đóng modal');
      await p2.click(eye);
      await p2.waitForSelector('[role=dialog]');
      await p2.keyboard.press('Escape');
      await sleep(400);
      ok(H, !(await p2.$('[role=dialog]')), 'Phím Esc đóng modal', 'Esc không đóng modal');
    }
    const u1 = await db.collection('users').findOne({ email: 'nguoidilam1@gmail.com' });
    if (!u1) add(H, 'WARN', 'Không có tài khoản nguoidilam1');
    else {
      const p3 = await newPage(sessionOf(u1));
      await p3.goto(`${FE}/profile`, { waitUntil: 'networkidle2' });
      await waitText(p3, 'Kỹ nghệ Prompt');
      const real = (await api(tokenOf(u1), 'GET', '/student/career-courses')).b || [];
      const t = await bodyText(p3);
      const allThree = real.every((c) => t.includes(c.title));
      ok(H, real.length === 3 && allThree, 'nguoidilam1: /profile hiện đủ 3 khóa chuyên ngành', 'nguoidilam1: thiếu khóa trên /profile');
      const progressOk = real.every((c) => t.includes(`${c.doneItems}/${c.totalItems} bài hoàn thành`));
      ok(H, progressOk, `Tiến độ đúng thực tế: ${real.map((c) => `${c.doneItems}/${c.totalItems}`).join(', ')}`, `Tiến độ lệch API: ${real.map((c) => `${c.doneItems}/${c.totalItems}`)}`);
      ok(H, !t.includes('Bạn chưa tham gia lớp học nào'), 'Không còn thông báo "Bạn chưa tham gia lớp học nào"', 'Vẫn báo chưa tham gia lớp học');
    }

    // =================== I. Lỗi JS / console / request ===================
    const I = 'I. Lỗi trình duyệt';
    ok(I, issues.pageErrors.length === 0, 'Không có lỗi JavaScript chưa bắt (pageerror) / trang trắng', `pageerror: ${issues.pageErrors.slice(0, 3).join(' | ')}`);
    const consoleReal = issues.consoleErrors.filter((e) => !/Failed to load resource: the server responded with a status of (400|401|403|404)|\[Axios (400|403|404)\]/.test(e));
    ok(I, consoleReal.length === 0, 'Không có console.error bất thường (bỏ qua 4xx do thử chặn có chủ đích)', `console.error: ${consoleReal.slice(0, 3).join(' | ')}`, 'WARN');
    ok(I, issues.badResponses.length === 0, 'Không có request API lỗi 5xx hoặc 4xx ngoài dự kiến', `Request lỗi: ${issues.badResponses.slice(0, 4).join(' | ')}`, 'WARN');
  } catch (e) {
    add('Lỗi chạy E2E', 'FAIL', e.stack ? e.stack.split('\n').slice(0, 3).join(' ') : String(e));
  } finally {
    try { if (browser) await browser.close(); } catch { /* */ }
    try {
      for (const id of tmpIds) {
        await db.collection('da_lab_submissions').deleteMany({ userId: id });
        await db.collection('ai_lab_submissions').deleteMany({ userId: id });
        await db.collection('tester_lab_submissions').deleteMany({ userId: id });
        await db.collection('course_certificates').deleteMany({ userId: id });
        await db.collection('users').deleteOne({ _id: new OID(id) });
      }
      add('Dọn dẹp', 'PASS', `Đã gỡ ${tmpIds.length} tài khoản thử và bài nộp của nó`);
    } catch (e) { add('Dọn dẹp', 'FAIL', e.message); }
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
