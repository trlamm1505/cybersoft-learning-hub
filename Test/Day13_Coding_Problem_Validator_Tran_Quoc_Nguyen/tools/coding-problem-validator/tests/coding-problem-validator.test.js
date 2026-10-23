'use strict';
/**
 * Test độc lập cho coding-problem-validator (Ngày 13).
 *
 * Dùng node:test (có sẵn trong Node, không cài package). Theo đúng style Ngày 11-12:
 * gọi CLI THẬT bằng execFileSync (black-box), không require thẳng hàm nội bộ để chấm điểm -
 * chỉ có test "catalog" đọc rules.js để đếm rule. Cần Python 3 trong PATH (như judge thật).
 *
 * Chạy:  node --test tests/
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const CLI = path.join(ROOT, 'coding-problem-validator.js');
const PROBLEMS = path.join(ROOT, 'problems');
const BASE = path.join(PROBLEMS, 'base-exercises.json');
const OVERRIDES = path.join(ROOT, 'problems-hardened', 'overrides.json');
const PRIME_MUTANTS = path.join(ROOT, 'mutants', 'kiem-tra-so-nguyen-to.json');
const SORT_MUTANTS = path.join(ROOT, 'mutants', 'sap-xep-tang-dan.json');
const MANIFEST = JSON.parse(fs.readFileSync(path.join(ROOT, 'fixtures-manifest.json'), 'utf8'));
const { RULES } = require('../rules');

function runCli(args, opts = {}) {
  try {
    const stdout = execFileSync('node', [CLI, ...args], { encoding: 'utf8', cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'], ...opts });
    return { stdout, stderr: '', code: 0 };
  } catch (err) {
    return { stdout: err.stdout ? err.stdout.toString() : '', stderr: err.stderr ? err.stderr.toString() : '', code: err.status };
  }
}
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'cpv-test-'));
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const validateFile = (file, extra = []) => {
  const out = tmp();
  const r = runCli(['validate', file, '--out-dir', out, '--fail-on', 'never', ...extra]);
  const report = fs.existsSync(path.join(out, 'validator-report.json')) ? readJson(path.join(out, 'validator-report.json')) : null;
  fs.rmSync(out, { recursive: true, force: true });
  return { ...r, report };
};

// ---------------------------------------------------------------- //
// 1. Rule catalog
// ---------------------------------------------------------------- //
test('có đúng 19 rule CP001-CP019 liên tục, mỗi rule đủ code/severity/group/mô tả/hướng sửa', () => {
  assert.equal(RULES.length, 19);
  assert.deepEqual(RULES.map((r) => r.code), Array.from({ length: 19 }, (_, i) => `CP${String(i + 1).padStart(3, '0')}`));
  for (const r of RULES) {
    assert.ok(['ERROR', 'WARNING'].includes(r.severity), `${r.code} severity`);
    assert.ok(r.group && r.description.trim() && r.fix.trim(), `${r.code} thiếu group/mô tả/fix`);
    assert.equal(typeof r.check, 'function');
  }
});

// ---------------------------------------------------------------- //
// 2. Fixture bank: mỗi fixture bad phải bị đúng rule mục tiêu bắt; fixture good không được báo oan
// ---------------------------------------------------------------- //
test('fixture bank: 19 bad + 6 good (25 fixture, mỗi rule CP001-CP019 có đúng 1 fixture bad)', () => {
  assert.equal(MANIFEST.filter((m) => m.kind === 'bad').length, 19);
  assert.equal(MANIFEST.filter((m) => m.kind === 'good').length, 6);
  assert.deepEqual(MANIFEST.filter((m) => m.kind === 'bad').map((m) => m.targetRule).sort(), RULES.map((r) => r.code));
});

for (const fx of MANIFEST.filter((m) => m.kind === 'bad')) {
  test(`${fx.id} (${fx.targetRule}): ${fx.what} -> phải bị ${fx.targetRule} bắt`, () => {
    const { report, code } = validateFile(path.join(ROOT, fx.file));
    assert.equal(code, 0, '--fail-on never phải thoát 0');
    const codes = report.findings.map((f) => f.code);
    assert.ok(codes.includes(fx.targetRule), `kỳ vọng ${fx.targetRule}, thực tế: ${[...new Set(codes)].join(',') || '(không có)'}`);
  });
}

for (const fx of MANIFEST.filter((m) => m.kind === 'good')) {
  test(`${fx.id}: ${fx.what} -> không báo oan`, () => {
    const { report } = validateFile(path.join(ROOT, fx.file));
    const findings = report.findings;
    if (fx.expect === 'clean') {
      assert.deepEqual(findings.map((f) => `${f.code}`), [], 'bài sạch phải 0 finding');
    } else {
      assert.equal(findings.filter((f) => f.severity === 'ERROR').length, 0, 'không được có ERROR');
      for (const c of fx.mustNotFire) assert.ok(!findings.some((f) => f.code === c), `${c} báo oan trên fixture good`);
    }
    assert.ok(report.referenceRuns.every((r) => r.status === 'AC'), 'reference của fixture good phải AC');
  });
}

test('JSON hỏng -> finding CPPARSE có số dòng, không crash', () => {
  const dir = tmp();
  const f = path.join(dir, 'broken.json');
  fs.writeFileSync(f, '[\n  { "slug": "x",\n  ]\n', 'utf8');
  const r = runCli(['validate', f, '--fail-on', 'never']);
  assert.match(r.stdout, /ERROR CPPARSE broken\.json:\d+/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('lỗi cách dùng: thiếu input / lệnh sai / file không tồn tại -> exit 2', () => {
  assert.equal(runCli([]).code, 2);
  assert.equal(runCli(['nhaycam']).code, 2);
  assert.equal(runCli(['validate', 'khong-ton-tai.json']).code, 2);
});

// ---------------------------------------------------------------- //
// 3. Chạy trên dữ liệu THẬT của Code Playground
// ---------------------------------------------------------------- //
test('dữ liệu thật: 30 bài, reference AC 30/30, 0 ERROR (EVD-D13-01)', () => {
  const { report } = validateFile(PROBLEMS);
  assert.equal(report.summary.problemsScanned, 30);
  assert.equal(report.summary.referenceAC, 30);
  assert.equal(report.summary.referenceRun, 30);
  assert.equal(report.summary.errors, 0);
});

test('dữ liệu thật: 27 WARNING - toàn bộ là CP002 (thiếu constraints) và CP013 (ít test)', () => {
  const { report } = validateFile(PROBLEMS);
  const byCode = {};
  report.findings.forEach((f) => { byCode[f.code] = (byCode[f.code] || 0) + 1; });
  assert.deepEqual(Object.keys(byCode).sort(), ['CP002', 'CP013']);
  assert.equal(byCode.CP013, 3);
});

test('overlay hardened: bài đã có constraints khai báo thì hết CP002 và vẫn reference AC', () => {
  const { report } = validateFile(PROBLEMS, ['--overlay', OVERRIDES]);
  assert.equal(report.summary.errors, 0);
  assert.equal(report.summary.referenceAC, 30);
  for (const slug of ['kiem-tra-so-nguyen-to', 'sap-xep-tang-dan']) {
    assert.ok(!report.findings.some((f) => f.problemId === slug && f.code === 'CP002'), `${slug} còn CP002`);
  }
});

// ---------------------------------------------------------------- //
// 4. Timeout (EVD-D13-05)
// ---------------------------------------------------------------- //
test('timeout: reference chạy vô hạn bị SIGKILL đúng hạn -> CP006 ghi TLE, không treo', () => {
  const dir = tmp();
  const f = path.join(dir, 'loop.json');
  fs.writeFileSync(f, JSON.stringify([{
    slug: 'loop', title: 'Loop', type: 'CODE_TEXT', description: 'Cho một số nguyên N (1 ≤ N ≤ 10). In ra N.',
    starterCode: 'n = int(input())\n', solutionCode: 'n = int(input())\nwhile True:\n    pass\n', timeLimitMs: 700,
    testCases: [{ input: '1', expectedOutput: '1', isHidden: false }, { input: '2', expectedOutput: '2', isHidden: true }, { input: '3', expectedOutput: '3', isHidden: true }, { input: '4', expectedOutput: '4', isHidden: true }],
  }]), 'utf8');
  const started = Date.now();
  const { report } = validateFile(f);
  const elapsed = Date.now() - started;
  const cp006 = report.findings.find((x) => x.code === 'CP006');
  assert.ok(cp006, 'phải có CP006');
  assert.match(cp006.message, /status=TLE/);
  assert.match(cp006.message, /Sample test #1=TLE/);
  assert.ok(elapsed < 4 * 700 + 4000, `4 test x 700ms + overhead nhưng mất ${elapsed}ms - timeout không hoạt động?`);
  fs.rmSync(dir, { recursive: true, force: true });
});

// ---------------------------------------------------------------- //
// 5. Mutation testing (EVD-D13-03/04/06)
// ---------------------------------------------------------------- //
function mutate(slug, mutants, extra = []) {
  const out = tmp();
  const r = runCli(['mutate', BASE, '--slug', slug, '--mutants', mutants, '--out-dir', out, ...extra]);
  const report = fs.existsSync(path.join(out, 'mutation-report.json')) ? readJson(path.join(out, 'mutation-report.json')) : null;
  const csv = fs.existsSync(path.join(out, 'mutation-report.csv')) ? fs.readFileSync(path.join(out, 'mutation-report.csv'), 'utf8') : '';
  const md = fs.existsSync(path.join(out, 'coverage-report.md')) ? fs.readFileSync(path.join(out, 'coverage-report.md'), 'utf8') : '';
  const files = fs.existsSync(out) ? fs.readdirSync(out) : [];
  return { ...r, report, csv, md, files, out };
}
const byId = (report, id) => report.mutants.find((m) => m.id === id);

test('số nguyên tố / test GỐC: score 66.7% < 80% => FAIL, survivor đúng 5 mutant, thoát exit 1', () => {
  const r = mutate('kiem-tra-so-nguyen-to', PRIME_MUTANTS);
  assert.equal(r.code, 1);
  assert.equal(r.report.summary.valid, 15);
  assert.equal(r.report.summary.killed, 10);
  assert.equal(r.report.summary.mutationScore, 66.7);
  assert.equal(r.report.summary.pass, false);
  assert.deepEqual(r.report.summary.survivors.map((s) => s.id), ['MUT-02', 'MUT-08', 'MUT-10', 'MUT-15', 'MUT-16']);
  assert.equal(byId(r.report, 'MUT-13').status, 'EQUIVALENT');
  fs.rmSync(r.out, { recursive: true, force: true });
});

test('số nguyên tố / test HARDENED: score 100% >= 80% => PASS, MUT-10 bị bắt bằng TIMEOUT', () => {
  const r = mutate('kiem-tra-so-nguyen-to', PRIME_MUTANTS, ['--overlay', OVERRIDES]);
  assert.equal(r.code, 0);
  assert.equal(r.report.summary.mutationScore, 100);
  assert.equal(r.report.summary.pass, true);
  assert.equal(byId(r.report, 'MUT-10').killedBy, 'TIMEOUT');
  assert.equal(byId(r.report, 'MUT-10').hasTimeout, true);
  assert.equal(r.report.reference.status, 'AC');
  fs.rmSync(r.out, { recursive: true, force: true });
});

test('output format: nhãn thừa / dòng debug / sai hoa-thường bị KILLED, chỉ khoảng trắng CUỐI được bỏ qua (judge trim)', () => {
  const r = mutate('kiem-tra-so-nguyen-to', PRIME_MUTANTS);
  for (const id of ['MUT-09', 'MUT-11', 'MUT-12']) {
    assert.equal(byId(r.report, id).status, 'KILLED', `${id} phải bị bắt`);
    assert.equal(byId(r.report, id).killedBy, 'SAMPLE');
  }
  assert.equal(byId(r.report, 'MUT-13').sampleResult, 'PASS');
  assert.equal(byId(r.report, 'MUT-13').hiddenResult, 'PASS');
  fs.rmSync(r.out, { recursive: true, force: true });
});

test('sắp xếp / test GỐC 90.9% PASS (1 survivor: bubble sort chậm); HARDENED 100%', () => {
  const a = mutate('sap-xep-tang-dan', SORT_MUTANTS);
  assert.equal(a.code, 0);
  assert.equal(a.report.summary.mutationScore, 90.9);
  assert.deepEqual(a.report.summary.survivors.map((s) => s.id), ['SRT-10']);
  fs.rmSync(a.out, { recursive: true, force: true });
  const b = mutate('sap-xep-tang-dan', SORT_MUTANTS, ['--overlay', OVERRIDES]);
  assert.equal(b.report.summary.mutationScore, 100);
  assert.equal(byId(b.report, 'SRT-10').killedBy, 'TIMEOUT');
  fs.rmSync(b.out, { recursive: true, force: true });
});

test('reference KHÔNG AC -> mutation dừng ngay, exit 3, không ghi report', () => {
  const dir = tmp();
  const f = path.join(dir, 'badref.json');
  fs.writeFileSync(f, JSON.stringify([{
    slug: 'badref', title: 'x', type: 'CODE_TEXT', description: 'In ra số N mà không thay đổi gì cả.',
    starterCode: '', solutionCode: 'n = int(input())\nprint(n + 1)', timeLimitMs: 2000,
    testCases: [{ input: '1', expectedOutput: '1', isHidden: false }, { input: '2', expectedOutput: '2', isHidden: true }],
  }]), 'utf8');
  const mfile = path.join(dir, 'm.json');
  fs.writeFileSync(mfile, JSON.stringify({ problemSlug: 'badref', mutants: [{ id: 'M1', type: 't', description: 'd', expected: 'KILLED', patch: [{ find: 'n + 1', replace: 'n + 2' }] }] }), 'utf8');
  const out = path.join(dir, 'out');
  const r = runCli(['mutate', f, '--slug', 'badref', '--mutants', mfile, '--out-dir', out]);
  assert.equal(r.code, 3);
  assert.match(r.stderr, /STOP/);
  assert.ok(!fs.existsSync(out));
  fs.rmSync(dir, { recursive: true, force: true });
});

test('patch không áp dụng được -> mutant INVALID, không tính vào mẫu số', () => {
  const dir = tmp();
  const mfile = path.join(dir, 'm.json');
  const good = readJson(PRIME_MUTANTS).mutants.slice(0, 2);
  fs.writeFileSync(mfile, JSON.stringify({ problemSlug: 'kiem-tra-so-nguyen-to', mutants: [...good, { id: 'BAD-1', type: 't', description: 'd', expected: 'KILLED', patch: [{ find: 'KHONG-CO-DOAN-NAY', replace: 'x' }] }] }), 'utf8');
  const r = mutate('kiem-tra-so-nguyen-to', mfile);
  assert.equal(byId(r.report, 'BAD-1').status, 'INVALID');
  assert.equal(r.report.summary.invalid, 1);
  assert.equal(r.report.summary.valid, 2);
  fs.rmSync(r.out, { recursive: true, force: true });
  fs.rmSync(dir, { recursive: true, force: true });
});

test('mutant đánh dấu equivalent nhưng test lại bắt được -> KILLED + có cờ xem lại (chống gian lận mẫu số)', () => {
  const dir = tmp();
  const mfile = path.join(dir, 'm.json');
  fs.writeFileSync(mfile, JSON.stringify({ problemSlug: 'kiem-tra-so-nguyen-to', mutants: [{ id: 'EQ-1', type: 't', description: 'd', expected: 'EQUIVALENT', equivalent: true, equivalentReason: 'thử', patch: [{ find: 'if x < 2:', replace: 'if x < 1:' }] }] }), 'utf8');
  const r = mutate('kiem-tra-so-nguyen-to', mfile);
  assert.equal(byId(r.report, 'EQ-1').status, 'KILLED');
  assert.match(byId(r.report, 'EQ-1').flag, /equivalentClaimWrong/);
  fs.rmSync(r.out, { recursive: true, force: true });
  fs.rmSync(dir, { recursive: true, force: true });
});

// ---------------------------------------------------------------- //
// 6. KHÔNG LỘ HIDDEN TEST (nghiệm thu riêng của Ngày 13)
// ---------------------------------------------------------------- //
test('report mutation + validate KHÔNG chứa input/expected của bất kỳ hidden test nào (kiểm bằng grep độc lập)', () => {
  const { loadProblemFile, applyOverlay } = require('../parsers/problem-loader');
  const loaded = loadProblemFile(BASE);
  applyOverlay(loaded.problems, OVERRIDES);
  const norm = (s) => String(s).replace(/\r\n/g, '\n').trim();
  const publicOf = (p) => [p.description, p.starterCode, p.solutionCode, p.constraintsText, ...p.testCases.filter((t) => !t.isHidden).flatMap((t) => [t.input, t.expectedOutput])].join('\n');
  const mutantSources = [PRIME_MUTANTS, SORT_MUTANTS].map((f) => JSON.stringify(readJson(f))).join('\n');

  const texts = [];
  for (const [slug, mf] of [['kiem-tra-so-nguyen-to', PRIME_MUTANTS], ['sap-xep-tang-dan', SORT_MUTANTS]]) {
    for (const extra of [[], ['--overlay', OVERRIDES]]) {
      const r = mutate(slug, mf, extra);
      texts.push(JSON.stringify(r.report), r.csv, r.md, r.stdout);
      // mã mutant sinh ra cũng là dữ liệu công khai
      const mdir = path.join(r.out, 'mutants');
      if (fs.existsSync(mdir)) fs.readdirSync(mdir).forEach((n) => texts.push(''));
      fs.rmSync(r.out, { recursive: true, force: true });
    }
  }
  const v = validateFile(PROBLEMS, ['--overlay', OVERRIDES]);
  texts.push(JSON.stringify(v.report), v.stdout);

  const joined = texts.join('\n');
  let checked = 0;
  for (const p of loaded.problems.filter((x) => ['kiem-tra-so-nguyen-to', 'sap-xep-tang-dan'].includes(x.slug))) {
    const pub = `${publicOf(p)}\n${mutantSources}`;
    for (const t of p.testCases.filter((x) => x.isHidden)) {
      for (const v2 of [norm(t.input), norm(t.expectedOutput)]) {
        if (v2.length < 4 || pub.includes(v2)) continue; // chuỗi ngắn/trùng dữ liệu công khai không kiểm bằng văn bản được (xem README)
        checked++;
        assert.ok(!joined.includes(v2), `LỘ hidden test của ${p.slug}: một giá trị ${v2.length} ký tự xuất hiện trong report`);
      }
    }
  }
  assert.ok(checked >= 8, `chỉ kiểm được ${checked} giá trị hidden - quá ít để có ý nghĩa`);
});

test('mọi kết quả hidden trong mutation-report chỉ có key trong danh sách cho phép; hidden chỉ được nhắc dưới dạng số thứ tự', () => {
  const r = mutate('kiem-tra-so-nguyen-to', PRIME_MUTANTS, ['--overlay', OVERRIDES]);
  for (const m of r.report.mutants) {
    assert.ok(Array.isArray(m.hiddenFailed) || m.hiddenFailed === undefined);
    (m.hiddenFailed || []).forEach((n) => assert.equal(typeof n, 'number'));
    assert.ok(m.hiddenPassed === undefined || /^\d+\/\d+$/.test(m.hiddenPassed));
    assert.ok(!('stderr' in m) && !('stdout' in m) && !('actual' in m));
  }
  assert.match(r.csv, /#0\d/);
  assert.ok(!/"?hiddenInput/i.test(JSON.stringify(r.report)));
  fs.rmSync(r.out, { recursive: true, force: true });
});

test('leak-guard CHẶN ghi report nếu hidden value lọt vào (mô phỏng: mô tả mutant chứa nguyên giá trị hidden) -> exit 4, không tạo file', () => {
  const dir = tmp();
  const mfile = path.join(dir, 'm.json');
  // 999999937 là giá trị input của 1 hidden test do QA thêm (overlay); nhét vào description để ép lọt ra report.
  fs.writeFileSync(mfile, JSON.stringify({ problemSlug: 'kiem-tra-so-nguyen-to', mutants: [{ id: 'LEAK-1', type: 't', description: 'thử với 999999937', expected: 'KILLED', patch: [{ find: 'if x < 2:', replace: 'if x < 1:' }] }] }), 'utf8');
  const out = path.join(dir, 'out');
  const r = runCli(['mutate', BASE, '--slug', 'kiem-tra-so-nguyen-to', '--mutants', mfile, '--overlay', OVERRIDES, '--out-dir', out]);
  assert.equal(r.code, 4);
  assert.match(r.stderr, /LỘ HIDDEN TEST/);
  assert.ok(!fs.existsSync(out), 'không được ghi file khi phát hiện lộ');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('message rule cho hidden test chỉ ghi "Hidden test #k" - không ghi giá trị (CP010/CP006 trên fixture có hidden sai)', () => {
  const { report } = validateFile(path.join(ROOT, 'fixtures', 'bad', MANIFEST.find((m) => m.targetRule === 'CP010').file.split('/').pop()));
  const cp010 = report.findings.find((f) => f.code === 'CP010');
  assert.match(cp010.message, /Hidden test #\d\d/);
  const cp006 = validateFile(path.join(ROOT, MANIFEST.find((m) => m.targetRule === 'CP006').file)).report.findings.find((f) => f.code === 'CP006');
  assert.match(cp006.message, /Hidden test #\d\d=WA|Sample test #\d=WA/);
});

test('probe-leak: mô phỏng cách BE lưu stderr của hidden test -> phát hiện đường lộ (exit 1), chỉ in số đếm, không in giá trị', () => {
  const r = runCli(['probe-leak', BASE, '--slug', 'sap-xep-tang-dan']);
  assert.equal(r.code, 1);
  assert.match(r.stdout, /2\/2 hidden test/);
  assert.ok(!/0 0 -2 3/.test(r.stdout));
});
