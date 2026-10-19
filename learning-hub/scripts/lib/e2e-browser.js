/**
 * Thư viện E2E bằng TRÌNH DUYỆT THẬT (Chrome/Edge qua puppeteer-core) dùng cho scripts/e2e-browser-qa.js.
 *  - Đăng nhập bằng FORM đăng nhập thật (phiên là cookie httpOnly, không tiêm token).
 *  - Mỗi tài khoản một "browser context" ẩn danh riêng (cookie/localStorage không lẫn nhau).
 *  - Thu mọi lỗi: console error, pageerror (cả unhandled rejection), phản hồi HTTP >= 400, request thất bại.
 */
const fs = require('fs');
const path = require('path');

const BROWSERS = [
  process.env.BROWSER_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
].filter(Boolean);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class Session {
  constructor(e2e, ctx, page, email) {
    this.e2e = e2e;
    this.ctx = ctx;
    this.page = page;
    this.email = email;
    this.issues = [];
    this.allowed = [];
    this.dialogs = [];
    page.on('pageerror', (e) => this.issues.push({ kind: 'pageerror', msg: e.message, url: page.url() }));
    page.on('console', (m) => {
      if (m.type() !== 'error') return;
      // Lỗi 4xx CÓ CHỦ ĐÍCH của kịch bản (allow) cũng sinh dòng console của trình duyệt và của axios: không tính là lỗi.
      if (this.allowed.some((rx) => rx.test(`console ${m.text()}`))) return;
      this.issues.push({ kind: 'console', msg: m.text().slice(0, 300), url: page.url() });
    });
    page.on('requestfailed', (r) => {
      const err = r.failure()?.errorText || '';
      if (/ERR_ABORTED|net::ERR_FAILED/.test(err) && !/localhost:3000/.test(r.url())) return; // điều hướng/ảnh bị hủy là bình thường
      if (/ERR_ABORTED/.test(err)) return;
      this.issues.push({ kind: 'requestfailed', msg: `${r.method()} ${r.url()} ${err}`, url: page.url() });
    });
    page.on('response', (r) => {
      const s = r.status();
      if (s < 400) return;
      const line = `${s} ${r.request().method()} ${r.url().replace(e2e.api, '')}`;
      if (this.allowed.some((rx) => rx.test(line))) return;
      this.issues.push({ kind: 'http', msg: line, url: page.url() });
    });
    page.on('dialog', async (d) => {
      this.dialogs.push(d.message());
      await d.accept();
    });
  }

  /** Cho phép (không coi là lỗi) các phản hồi HTTP lỗi CÓ CHỦ ĐÍCH của kịch bản, vd /403 .*locked/. */
  allow(...rxs) {
    this.allowed.push(...rxs);
  }

  /** Lấy và xóa các lỗi đã thu kể từ lần gọi trước. */
  drain() {
    const out = this.issues;
    this.issues = [];
    return out;
  }

  async goto(p) {
    await this.page.goto(`${this.e2e.fe}/${p.replace(/^\//, '')}`, { waitUntil: 'networkidle2', timeout: 45000 });
    await sleep(500);
  }

  get path() {
    return new URL(this.page.url()).pathname;
  }

  get url() {
    const u = new URL(this.page.url());
    return u.pathname + u.search;
  }

  async text() {
    return this.page.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
  }

  async has(text) {
    return (await this.text()).includes(text);
  }

  /** Chờ tới khi trang có chuỗi (hoặc hết giờ). */
  async waitText(text, timeout = 15000) {
    const t0 = Date.now();
    while (Date.now() - t0 < timeout) {
      if (await this.has(text)) return true;
      await sleep(250);
    }
    return false;
  }

  async waitGone(text, timeout = 15000) {
    const t0 = Date.now();
    while (Date.now() - t0 < timeout) {
      if (!(await this.has(text))) return true;
      await sleep(250);
    }
    return false;
  }

  /** Chờ điều kiện chạy trong trình duyệt. */
  async waitFor(fn, arg, timeout = 15000) {
    try {
      await this.page.waitForFunction(fn, { timeout }, arg);
      return true;
    } catch {
      return false;
    }
  }

  /** Mọi phần tử bấm được có chữ chứa `text` (so khớp theo innerText hoặc aria-label). */
  async findClickable(text, { selector = 'button, a, [role=button], [role=tab], summary', exact = false } = {}) {
    const handles = await this.page.$$(selector);
    const out = [];
    for (const h of handles) {
      const label = await h.evaluate((el) => `${(el.innerText || '').replace(/\s+/g, ' ').trim()}\u0000${el.getAttribute('aria-label') || ''}`);
      const [inner, aria] = label.split('\u0000');
      const hit = exact ? inner === text || aria === text : inner.includes(text) || aria.includes(text);
      if (hit) out.push(h);
      else await h.dispose();
    }
    return out;
  }

  async clickText(text, opts = {}) {
    const found = await this.findClickable(text, opts);
    if (!found.length) throw new Error(`Không thấy nút/liên kết "${text}" trên ${this.url}`);
    await found[0].click();
    await sleep(opts.settle ?? 400);
    return found.length;
  }

  async count(text, opts = {}) {
    return (await this.findClickable(text, opts)).length;
  }

  async select(selector, label) {
    await this.page.select(selector, label);
  }

  /** Ô nhập / ô chọn nằm trong <label> có chữ đầu tiên là `label` (cấu trúc Field của Admin). */
  async control(label, scope) {
    const h = await this.page.evaluateHandle(
      (lab, scopeSel) => {
        const root = (scopeSel && document.querySelector(scopeSel)) || document;
        for (const l of root.querySelectorAll('label')) {
          const t = ((l.querySelector('span') || l).innerText || '').trim();
          if (t === lab || t.startsWith(lab)) return l.querySelector('input,select,textarea');
        }
        return null;
      },
      label,
      scope || '',
    );
    const el = h.asElement();
    if (!el) throw new Error(`Không thấy ô "${label}" trên ${this.url}`);
    return el;
  }

  /** Điền ô (gõ) hoặc chọn mục (theo chữ hiển thị) cho control theo nhãn. */
  async setControl(label, value, scope) {
    const el = await this.control(label, scope);
    const tag = await el.evaluate((e) => e.tagName);
    if (tag === 'SELECT') {
      const val = await el.evaluate((e, v) => [...e.options].find((o) => o.text.includes(v))?.value, value);
      if (val === undefined) throw new Error(`Ô "${label}" không có mục "${value}"`);
      await el.select(val);
    } else {
      await el.click({ clickCount: 3 });
      await this.page.keyboard.press('Backspace');
      if (value !== '') await el.type(value, { delay: 4 });
    }
    await sleep(150);
  }

  /** Đọc các mục (chữ) của một ô chọn theo nhãn. */
  async options(label, scope) {
    const el = await this.control(label, scope);
    return el.evaluate((e) => [...e.options].map((o) => o.text.trim()));
  }

  /** Điền ô nhập có sẵn nội dung: xóa hết rồi gõ như người dùng. */
  async fill(selector, value) {
    await this.page.click(selector, { clickCount: 3 });
    await this.page.keyboard.press('Backspace');
    if (value !== '') await this.page.type(selector, value, { delay: 5 });
  }

  /** Thay toàn bộ nội dung trình soạn code CodeMirror (như dán code). */
  async setEditor(code) {
    await this.page.waitForSelector('.cm-content', { timeout: 15000 });
    // Chờ đề bài tải xong (code khởi tạo hiện ra): nếu gán code trước, lần tải đề muộn sẽ ĐÈ lên code vừa gán.
    await this.page.waitForFunction(() => (document.querySelector('.cm-content')?.innerText || '').trim().length > 0, { timeout: 8000 }).catch(() => undefined);
    const want = code.replace(/\s+$/, '');
    for (let attempt = 0; attempt < 4; attempt++) {
      const ok = await this.page.evaluate((c) => {
        const el = document.querySelector('.cm-content');
        const view = el && (el.cmTile?.view || el.cmView?.view || el.cmView?.rootView?.view); // cmTile: @codemirror/view >= 6.36
        if (!view) return false;
        view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: c } });
        return true;
      }, code);
      if (!ok) {
        await this.page.click('.cm-content');
        await this.page.keyboard.down('Control');
        await this.page.keyboard.press('a');
        await this.page.keyboard.up('Control');
        await this.page.keyboard.press('Backspace');
        await this.page.keyboard.type(code);
      }
      await sleep(700);
      // Nội dung phải còn nguyên sau khi trang xử lý xong (chống bị đè muộn).
      const got = await this.page.evaluate(() => (document.querySelector('.cm-content')?.innerText || '').replace(/ /g, ' '));
      if (got.replace(/\s+/g, ' ').trim() === want.replace(/\s+/g, ' ').trim()) return;
    }
  }

  async shot(name) {
    const dir = this.e2e.shotDir;
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `${name.replace(/[^a-z0-9_-]+/gi, '_')}.png`);
    await this.page.screenshot({ path: file, fullPage: true }).catch(() => undefined);
    return file;
  }

  /** Kiểm tra layout: trang không trắng, không tràn ngang bất thường. */
  async layoutProblems() {
    return this.page.evaluate(() => {
      const probs = [];
      const body = document.body;
      if ((body.innerText || '').trim().length < 20) probs.push('trang trắng / gần như không có nội dung');
      const doc = document.documentElement;
      if (doc.scrollWidth > window.innerWidth + 24) probs.push(`tràn ngang ${doc.scrollWidth}px > ${window.innerWidth}px`);
      const overlay = document.querySelector('vite-error-overlay');
      if (overlay) probs.push('Vite error overlay đang hiện');
      return probs;
    });
  }

  async close() {
    await this.ctx.close().catch(() => undefined);
  }
}

class E2E {
  constructor({ fe, api, shotDir }) {
    this.fe = fe;
    this.api = api;
    this.shotDir = shotDir;
    this.lastLogin = new Map();
  }

  async start({ headed = false } = {}) {
    const puppeteer = require(path.join(__dirname, '..', '..', 'node_modules', 'puppeteer-core'));
    const exe = BROWSERS.find((p) => fs.existsSync(p));
    if (!exe) throw new Error('Không tìm thấy Chrome/Edge. Đặt BROWSER_PATH.');
    this.browser = await puppeteer.launch({ executablePath: exe, headless: headed ? false : 'new', args: ['--no-sandbox', '--window-size=1366,900'], defaultViewport: { width: 1366, height: 900 } });
    this.exe = exe;
  }

  /** Mở phiên ẩn danh mới và ĐĂNG NHẬP BẰNG FORM. Trả { session, landedOn }. */
  async login(email, password = '123456') {
    // Giới hạn đăng nhập: 5 lần/phút/email. Giãn cách nếu cùng email đăng nhập dày.
    const last = this.lastLogin.get(email) ?? [];
    const recent = last.filter((t) => Date.now() - t < 60000);
    if (recent.length >= 4) await sleep(60000 - (Date.now() - recent[0]) + 500);
    this.lastLogin.set(email, [...recent, Date.now()]);

    await this.waitApi();
    const ctx = await this.browser.createBrowserContext();
    const page = await ctx.newPage();
    const s = new Session(this, ctx, page, email);
    await page.goto(`${this.fe}/login`, { waitUntil: 'networkidle2', timeout: 45000 });
    await page.type('#login-email', email, { delay: 3 });
    await page.type('#login-password', password, { delay: 3 });
    await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => null), page.click('button[type=submit]')]);
    await sleep(600);
    return { session: s, landedOn: s.path };
  }

  /** Chờ backend sẵn sàng (chế độ watch có thể đang biên dịch lại / khởi động lại). */
  async waitApi(timeout = 90000) {
    const t0 = Date.now();
    while (Date.now() - t0 < timeout) {
      const ok = await fetch(`${this.api}/health`, { signal: AbortSignal.timeout(3000) }).then((r) => r.ok).catch(() => false);
      if (ok) return true;
      await sleep(1000);
    }
    throw new Error(`Backend ${this.api} không phản hồi sau ${timeout / 1000}s`);
  }

  async stop() {
    await this.browser?.close().catch(() => undefined);
  }
}

module.exports = { E2E, Session, sleep };
