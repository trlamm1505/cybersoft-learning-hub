const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { STANDARD_ACCOUNTS, BANK_CODE, BANK_QUIZ, DEMO_DASH_CONTENT } = require('./seed-standard-data');

/** Python giống bộ chạy code của backend: PYTHON_BIN, rồi python3/python. */
function findPython() {
  const local = process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Python', 'bin', 'python.exe') : '';
  for (const bin of [process.env.PYTHON_BIN, local, 'python3', 'python'].filter(Boolean)) {
    const r = spawnSync(bin, ['--version'], { encoding: 'utf8' });
    if (r.status === 0) return bin;
  }
  return null;
}
const PY = findPython();

function runAll(solution, cases) {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'seed-sol-')), 'main.py');
  fs.writeFileSync(file, solution);
  return cases.map((c) => {
    const r = spawnSync(PY, ['-I', file], { input: c.input, encoding: 'utf8', timeout: 10000 });
    return { expected: c.expectedOutput, got: (r.stdout || '').trim(), err: (r.stderr || '').trim() };
  });
}

test('tài khoản chuẩn: email không trùng, học viên luôn có khối, giảng viên/admin không có khối', () => {
  assert.equal(new Set(STANDARD_ACCOUNTS.map((a) => a.email)).size, STANDARD_ACCOUNTS.length);
  for (const a of STANDARD_ACCOUNTS) {
    if (a.role === 'STUDENT') assert.ok(['3-5', '6-9', '10-12'].includes(a.ageGroup), a.email);
    else assert.equal(a.ageGroup, undefined, a.email);
  }
  for (const email of ['teacher3-5@gmail.com', 'teacher6-9@gmail.com', 'teacher10-12@gmail.com', 'lop3-5@gmail.com', 'lop6-9@gmail.com', 'lop10-12@gmail.com', 'duongchiviet2004@gmail.com']) {
    assert.ok(STANDARD_ACCOUNTS.find((a) => a.email === email)?.classCode, `${email} phải gắn lớp`);
  }
});

test('Ngân hàng đề: mỗi khối 6-9 / 10-12 có bài code (≥ 1 test hiện + ≥ 1 test ẩn) và câu trắc nghiệm đúng MỘT đáp án', () => {
  for (const band of ['6-9', '10-12']) {
    const codes = BANK_CODE.filter((e) => e.band === band);
    const quiz = BANK_QUIZ.filter((q) => q.band === band);
    assert.ok(codes.length >= 3 && quiz.length >= 4, band);
    for (const e of codes) {
      assert.ok(e.testCases.some((t) => !t.isHidden) && e.testCases.some((t) => t.isHidden), e.slug);
      assert.match(e.slug, /^seed-bank-/);
    }
    for (const q of quiz) {
      assert.equal(q.options.filter((o) => o.isCorrect).length, 1, q.seedKey);
      assert.ok(q.options.length >= 2 && q.options.length <= 6 && q.explanation, q.seedKey);
    }
  }
  assert.equal(new Set(BANK_QUIZ.map((q) => q.seedKey)).size, BANK_QUIZ.length);
});

test('lời giải mẫu chạy đúng MỌI test case (bài Ngân hàng đề + bài demo-dash)', { skip: PY ? false : 'không có Python trên máy' }, () => {
  const all = [...BANK_CODE.map((e) => [e.slug, e]), ...Object.entries(DEMO_DASH_CONTENT)];
  for (const [slug, e] of all) {
    assert.ok(e.testCases.some((t) => !t.isHidden), `${slug}: cần test case hiện cho Playground`);
    for (const r of runAll(e.solution, e.testCases)) assert.equal(r.got, r.expected, `${slug}: ${r.err}`);
  }
});
