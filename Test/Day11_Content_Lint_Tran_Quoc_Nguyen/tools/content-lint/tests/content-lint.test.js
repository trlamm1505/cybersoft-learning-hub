'use strict';
/**
 * Test độc lập cho content-lint (Ngày 11).
 *
 * Dùng module test runner có sẵn của Node (node:test, không cần cài thêm
 * package nào) - đúng tinh thần "test độc lập với kết luận của AI" trong
 * kế hoạch: không tin report CLI tự in ra, mà assert lại bằng code riêng.
 *
 * Chạy:
 *   node --test tests/
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const CLI = path.join(ROOT, 'content-lint.js');
const SAMPLES = path.join(ROOT, 'samples');

const { RULES } = require('../rules');

function runCli(args, opts = {}) {
  try {
    const stdout = execFileSync('node', [CLI, ...args], { encoding: 'utf8', cwd: ROOT, ...opts });
    return { stdout, code: 0 };
  } catch (err) {
    return { stdout: err.stdout ? err.stdout.toString() : '', stderr: err.stderr ? err.stderr.toString() : '', code: err.status };
  }
}

// ---------------------------------------------------------------- //
// 1. Rule catalog
// ---------------------------------------------------------------- //

test('có đúng 20 rule (CT001-CT020)', () => {
  assert.equal(RULES.length, 20);
  const codes = RULES.map((r) => r.code).sort();
  const expected = Array.from({ length: 20 }, (_, i) => `CT${String(i + 1).padStart(3, '0')}`);
  assert.deepEqual(codes, expected);
});

test('mỗi rule có mã, severity hợp lệ và hướng sửa không rỗng', () => {
  for (const r of RULES) {
    assert.match(r.code, /^CT\d{3}$/);
    assert.ok(['ERROR', 'WARNING'].includes(r.severity), `${r.code} có severity không hợp lệ`);
    assert.ok(r.fix && r.fix.trim().length > 0, `${r.code} thiếu hướng sửa`);
    assert.ok(r.description && r.description.trim().length > 0, `${r.code} thiếu mô tả`);
    assert.ok(Array.isArray(r.appliesTo) && r.appliesTo.length > 0);
  }
});

// ---------------------------------------------------------------- //
// 2. CLI chạy được trên JSON hợp lệ / không hợp lệ
// ---------------------------------------------------------------- //

test('JSON hợp lệ (lesson-good.json) -> CLI chạy được, exit 0, 0 finding', () => {
  const { stdout, code } = runCli([path.join(SAMPLES, 'lesson-good.json')]);
  assert.equal(code, 0, `stdout:\n${stdout}`);
  assert.match(stdout, /0 error\(s\), 0 warning\(s\)/);
});

test('Markdown hợp lệ (lesson-good.md) -> CLI chạy được, exit 0, 0 finding', () => {
  const { stdout, code } = runCli([path.join(SAMPLES, 'lesson-good.md')]);
  assert.equal(code, 0, `stdout:\n${stdout}`);
  assert.match(stdout, /0 error\(s\), 0 warning\(s\)/);
});

test('JSON không hợp lệ (lesson-invalid.json) -> báo lỗi parse CTPARSE, exit khác 0', () => {
  const { stdout, code } = runCli([path.join(SAMPLES, 'lesson-invalid.json')]);
  assert.notEqual(code, 0);
  assert.match(stdout, /ERROR CTPARSE/);
});

// ---------------------------------------------------------------- //
// 3. lesson-bad.json / lesson-bad.md phải bắt đúng lỗi đã cài
// ---------------------------------------------------------------- //

test('lesson-bad.json + lesson-bad.md cùng nhau kích hoạt đủ cả 20 rule', () => {
  const { stdout } = runCli([path.join(SAMPLES, 'lesson-bad.json'), path.join(SAMPLES, 'lesson-bad.md')]);
  const triggered = new Set([...stdout.matchAll(/\bCT\d{3}\b/g)].map((m) => m[0]));
  const missing = RULES.map((r) => r.code).filter((c) => !triggered.has(c));
  assert.deepEqual(missing, [], `Các rule KHÔNG được kích hoạt bởi sample bad: ${missing.join(', ')}`);
});

test('lesson-bad.json bắt đúng lỗi title is missing tại dòng có key "title"', () => {
  const { stdout } = runCli([path.join(SAMPLES, 'lesson-bad.json')]);
  assert.match(stdout, /ERROR CT001 lesson-bad\.json:\d+ title is missing/);
});

test('lesson-bad.md bắt đúng terminology "JS" is inconsistent', () => {
  const { stdout } = runCli([path.join(SAMPLES, 'lesson-bad.md')]);
  assert.match(stdout, /WARNING CT011 lesson-bad\.md:\d+ terminology "JS" is inconsistent/);
});

test('lesson-bad.json bắt CT010 - prerequisite tham chiếu bài học không tồn tại', () => {
  const { stdout } = runCli([path.join(SAMPLES, 'lesson-bad.json')]);
  assert.match(stdout, /ERROR CT010 .*references "Bài 99" which does not exist/);
});

// ---------------------------------------------------------------- //
// 4. Không sửa nội dung âm thầm
// ---------------------------------------------------------------- //

test('content-lint không được sửa/ghi đè file input', () => {
  const target = path.join(SAMPLES, 'lesson-bad.json');
  const before = fs.readFileSync(target);
  runCli([target]);
  const after = fs.readFileSync(target);
  assert.deepEqual(before, after, 'file input đã bị thay đổi sau khi chạy content-lint!');
});

// ---------------------------------------------------------------- //
// 5. Report JSON/CSV có vị trí lỗi
// ---------------------------------------------------------------- //

test('--out-dir sinh ra lint-report.json và lint-report.csv có field line/path/rule/fix', () => {
  const outDir = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'content-lint-test-'));
  const { code } = runCli([path.join(SAMPLES, 'lesson-bad.json'), '--out-dir', outDir]);
  assert.equal(code, 1);

  const jsonReportPath = path.join(outDir, 'lint-report.json');
  const csvReportPath = path.join(outDir, 'lint-report.csv');
  assert.ok(fs.existsSync(jsonReportPath));
  assert.ok(fs.existsSync(csvReportPath));

  const report = JSON.parse(fs.readFileSync(jsonReportPath, 'utf8'));
  assert.ok(report.findings.length > 0);
  for (const f of report.findings) {
    assert.ok('line' in f);
    assert.ok('path' in f);
    assert.ok('code' in f);
    assert.ok('fix' in f && f.fix.length > 0);
    assert.ok(['ERROR', 'WARNING'].includes(f.severity));
  }

  const csv = fs.readFileSync(csvReportPath, 'utf8');
  assert.match(csv, /^file,line,path,rule,severity,message,fix/);

  fs.rmSync(outDir, { recursive: true, force: true });
});

test('findings được sắp xếp ERROR trước WARNING', () => {
  const { stdout } = runCli([path.join(SAMPLES, 'lesson-bad.json'), path.join(SAMPLES, 'lesson-bad.md')]);
  const severities = stdout
    .split('\n')
    .filter((l) => /^(ERROR|WARNING)\s/.test(l))
    .map((l) => (l.startsWith('ERROR') ? 0 : 1));
  const sorted = [...severities].sort((a, b) => a - b);
  assert.deepEqual(severities, sorted);
});

// ---------------------------------------------------------------- //
// 6. --fail-on
// ---------------------------------------------------------------- //

test('--fail-on never luôn trả exit code 0 kể cả khi có lỗi', () => {
  const { code } = runCli([path.join(SAMPLES, 'lesson-bad.json'), '--fail-on', 'never']);
  assert.equal(code, 0);
});

test('định dạng file không hỗ trợ (.txt) báo lỗi rõ ràng thay vì crash im lặng', () => {
  const tmp = path.join(require('node:os').tmpdir(), 'unsupported.txt');
  fs.writeFileSync(tmp, 'noi dung khong lien quan');
  const { stdout, stderr, code } = runCli([tmp]);
  assert.notEqual(code, 0);
  assert.match((stdout + stderr), /Không hỗ trợ định dạng|not supported|no such/i);
  fs.unlinkSync(tmp);
});

// ---------------------------------------------------------------- //
// 7. Quét cả thư mục (không chỉ nhận danh sách file lẻ)
// ---------------------------------------------------------------- //

test('truyền 1 thư mục -> tự quét đệ quy hết file .json/.md bên trong', () => {
  const { stdout, code } = runCli([SAMPLES, '--fail-on', 'never']);
  assert.equal(code, 0, `stdout:\n${stdout}`);
  // samples/ có đúng 5 file .json/.md (lesson-good.json, lesson-bad.json,
  // lesson-bad.md, lesson-good.md, lesson-invalid.json) - không file nào bị bỏ sót.
  assert.match(stdout, /Scanned 5 file\(s\)/);
});

test('truyền 1 thư mục rỗng -> báo lỗi rõ ràng, không crash', () => {
  const emptyDir = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'content-lint-emptydir-'));
  const { stdout, stderr, code } = runCli([emptyDir]);
  assert.equal(code, 2);
  assert.match(stdout + stderr, /không có file \.json\/\.md|không tìm thấy file/i);
  fs.rmdirSync(emptyDir);
});

// ---------------------------------------------------------------- //
// 8. --check-links (kiểm tra link sống/chết qua mạng thật - dùng server cục
//    bộ trong test để không phụ thuộc mạng ngoài, vẫn xác nhận đúng hành vi)
// ---------------------------------------------------------------- //

test('--check-links: phân biệt đúng link OK (200) / DEAD (404 thật) / UNREACHABLE (không có server)', async () => {
  const http = require('node:http');
  const { spawn } = require('node:child_process');

  // Xin 2 cổng rảnh bằng cách bind tạm rồi đóng ngay: 1 cổng sẽ chạy server
  // test thật (mô phỏng OK/DEAD), cổng còn lại KHÔNG chạy gì (mô phỏng
  // UNREACHABLE - không có ai lắng nghe).
  async function freePort() {
    const srv = http.createServer();
    await new Promise((resolve) => srv.listen(0, '127.0.0.1', resolve));
    const p = srv.address().port;
    await new Promise((resolve) => srv.close(resolve));
    return p;
  }
  const port = await freePort();
  const deadPort = await freePort();

  // QUAN TRỌNG: server test phải chạy ở TIẾN TRÌNH RIÊNG (spawn), KHÔNG được
  // tạo in-process ngay trong test này. Đã tự kiểm chứng bằng 1 script tái
  // hiện lỗi riêng: trong sandbox này, tiến trình con spawn qua execFileSync
  // (chính là cách runCli() chạy content-lint.js) không kết nối được ngược lại
  // cổng do CHÍNH tiến trình cha của nó (tiến trình test) đang mở - dù cùng
  // máy, cùng localhost. Tách server ra 1 tiến trình độc lập (anh em, không
  // phải cha) thì kết nối bình thường - đây là cách né đúng giới hạn đó thay
  // vì viết 1 test trông có vẻ đúng nhưng luôn fail vì lý do không liên quan
  // đến code đang test.
  const serverScript = `
    const http = require('http');
    const server = http.createServer((req, res) => {
      if (req.url === '/ok') { res.writeHead(200); res.end('ok'); return; }
      res.writeHead(404); res.end('not found');
    });
    server.listen(${port}, '127.0.0.1', () => process.stdout.write('READY\\n'));
  `;
  const serverProc = spawn('node', ['-e', serverScript], { stdio: ['ignore', 'pipe', 'ignore'] });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('test HTTP server không khởi động kịp')), 4000);
    serverProc.stdout.on('data', (chunk) => {
      if (chunk.toString().includes('READY')) { clearTimeout(timer); resolve(); }
    });
  });

  const tmpDir = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'content-lint-linkcheck-'));
  const lessonPath = path.join(tmpDir, 'lesson.json');
  fs.writeFileSync(lessonPath, JSON.stringify([{
    title: 'Bài kiểm tra check-links',
    learningOutcome: ['Xác nhận CTLINK phân loại đúng OK/DEAD/UNREACHABLE cho từng link.'],
    prerequisite: [{ title: 'Không có', description: 'Không có' }],
    content: 'Nội dung đủ dài để qua rule content, cần tối thiểu bốn mươi ký tự có nghĩa trong đây.',
    links: [
      `http://127.0.0.1:${port}/ok`,
      `http://127.0.0.1:${port}/nope`,
      `http://127.0.0.1:${deadPort}/khong-ai-nghe`,
    ],
  }]));

  let stdout;
  let code;
  try {
    ({ stdout, code } = runCli([lessonPath, '--check-links', '--link-timeout', '1500', '--fail-on', 'never']));
  } finally {
    serverProc.kill();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  assert.equal(code, 0, `stdout:\n${stdout}`);
  assert.match(stdout, new RegExp(`ERROR CTLINK lesson\\.json:\\d+ link trả về lỗi HTTP 404: http://127\\.0\\.0\\.1:${port}/nope`));
  assert.match(stdout, new RegExp(`WARNING CTLINK lesson\\.json:\\d+ không thể xác minh link qua mạng.*127\\.0\\.0\\.1:${deadPort}`));
  assert.doesNotMatch(stdout, new RegExp(`CTLINK[^\\n]*:${port}/ok`)); // link OK không được tạo finding
});
