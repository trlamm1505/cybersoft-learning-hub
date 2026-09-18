'use strict';
/**
 * Test độc lập cho quiz-validator (Ngày 12).
 *
 * Dùng module test runner có sẵn của Node (node:test, không cần cài thêm
 * package nào) - đúng tinh thần "test độc lập với kết luận của AI" và
 * "không dùng AI làm nguồn phán quyết duy nhất" trong kế hoạch: không tin
 * report CLI tự in ra, mà assert lại bằng code riêng, và toàn bộ 50 fixture
 * trong fixtures/ có kết quả kỳ vọng (manifest.json) được kiểm tra LẠI ở
 * đây độc lập với chính lúc sinh fixture.
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
const CLI = path.join(ROOT, 'quiz-validator.js');
const SAMPLES = path.join(ROOT, 'samples');
const FIXTURES = path.join(ROOT, 'fixtures');

const { RULES, FILE_LEVEL_RULES } = require('../rules');

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

test('có đúng 23 rule (QV001-QV023), gồm 21 rule cấp câu hỏi + 2 rule cấp file', () => {
  assert.equal(RULES.length + FILE_LEVEL_RULES.length, 23);
  const codes = [...RULES, ...FILE_LEVEL_RULES].map((r) => r.code).sort();
  const expected = Array.from({ length: 23 }, (_, i) => `QV${String(i + 1).padStart(3, '0')}`);
  assert.deepEqual(codes, expected);
});

// Điều kiện nghiệm thu mục 6/7 của hướng dẫn điều chỉnh: rule "ambiguity" và
// rule "answer-distribution/skew" CHỈ ĐƯỢC là WARNING (tín hiệu để con người
// xem lại), KHÔNG được là ERROR (không tự động kết luận đề sai).
test('mọi rule nhóm Ambiguity và Skew pattern đều là WARNING (không được là ERROR)', () => {
  for (const r of [...RULES, ...FILE_LEVEL_RULES]) {
    if (r.group === 'Ambiguity' || r.group === 'Skew pattern') {
      assert.equal(r.severity, 'WARNING', `${r.code} (nhóm ${r.group}) phải là WARNING, không được là ERROR`);
    }
  }
});

test('mỗi rule có mã, severity hợp lệ, group và hướng sửa không rỗng', () => {
  for (const r of [...RULES, ...FILE_LEVEL_RULES]) {
    assert.match(r.code, /^QV\d{3}$/);
    assert.ok(['ERROR', 'WARNING'].includes(r.severity), `${r.code} có severity không hợp lệ`);
    assert.ok(r.fix && r.fix.trim().length > 0, `${r.code} thiếu hướng sửa`);
    assert.ok(r.description && r.description.trim().length > 0, `${r.code} thiếu mô tả`);
    assert.ok(r.group && r.group.trim().length > 0, `${r.code} thiếu group`);
  }
});

// ---------------------------------------------------------------- //
// 2. CLI chạy được trên JSON hợp lệ / không hợp lệ
// ---------------------------------------------------------------- //

// quiz-good.json có 0 ERROR tuyệt đối, nhưng CÓ ĐÚNG 1 WARNING đã biết trước
// và được tài liệu hoá là false positive: câu hỏi Python "từ khoá nào dùng để
// gán giá trị" có đáp án đúng là "=" (1 ký tự) trong khi 3 distractor là
// "let"/"var"/"const" (dài hơn) - QV023 (option length outlier) bắt đúng
// pattern "đáp án đúng ngắn bất thường", nhưng ở đây đó là sự thật của ngôn
// ngữ Python, không phải lỗi ra đề. Xem README.md mục "False positive đã biết".
test('JSON hợp lệ (quiz-good.json) -> CLI chạy được, exit 0, 0 ERROR, đúng 1 WARNING đã biết (QV023 false positive)', () => {
  const { stdout, code } = runCli([path.join(SAMPLES, 'quiz-good.json')]);
  assert.equal(code, 0, `stdout:\n${stdout}`);
  assert.match(stdout, /0 error\(s\), 1 warning\(s\)/, `quiz-good.json lẽ ra chỉ có đúng 1 WARNING đã biết (QV023):\n${stdout}`);
  assert.match(stdout, /WARNING QV023/, `WARNING duy nhất trong quiz-good.json phải là QV023 (known false positive):\n${stdout}`);
});

test('JSON không hợp lệ -> báo lỗi parse QVPARSE, exit khác 0', () => {
  const tmp = path.join(ROOT, 'tests', '_tmp-invalid.json');
  fs.writeFileSync(tmp, '[ { "content": "thiếu dấu đóng"  ]', 'utf8');
  try {
    const { stdout, code } = runCli([tmp]);
    assert.notEqual(code, 0);
    assert.match(stdout, /ERROR QVPARSE/);
  } finally {
    fs.unlinkSync(tmp);
  }
});

test('file định dạng không hỗ trợ (.txt) báo lỗi rõ ràng thay vì crash im lặng', () => {
  const tmp = path.join(ROOT, 'tests', '_tmp-unsupported.txt');
  fs.writeFileSync(tmp, 'not json', 'utf8');
  try {
    const { stdout, stderr, code } = runCli([tmp]);
    assert.notEqual(code, 0);
    assert.match(`${stdout}${stderr || ''}`, /ERROR/);
  } finally {
    fs.unlinkSync(tmp);
  }
});

// ---------------------------------------------------------------- //
// 3. quiz-bad.json phải kích hoạt đủ cả 23 rule
// ---------------------------------------------------------------- //

test('samples/quiz-bad.json kích hoạt đủ cả 23 rule QV001-QV023', () => {
  const { stdout, code } = runCli([path.join(SAMPLES, 'quiz-bad.json'), '--fail-on', 'never']);
  assert.equal(code, 0);
  const codesFound = new Set([...stdout.matchAll(/\bQV\d{3}\b/g)].map((m) => m[0]));
  for (let i = 1; i <= 23; i++) {
    const code2 = `QV${String(i).padStart(3, '0')}`;
    assert.ok(codesFound.has(code2), `quiz-bad.json không kích hoạt ${code2}\n${stdout}`);
  }
});

// ---------------------------------------------------------------- //
// 4. Fixture bank (50 fixture: 25 good + 25 bad) - đối chiếu với manifest
// ---------------------------------------------------------------- //

const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'fixtures-manifest.json'), 'utf8'));

test('fixture bank có đúng 50 fixture (25 good + 25 bad)', () => {
  assert.equal(manifest.fixtures.length, 50);
  assert.equal(manifest.fixtures.filter((f) => f.kind === 'good').length, 25);
  assert.equal(manifest.fixtures.filter((f) => f.kind === 'bad').length, 25);
});

for (const fx of manifest.fixtures) {
  test(`fixture ${fx.fixtureId} (${fx.name}, ${fx.kind}) khớp kỳ vọng trong fixtures-manifest.json`, () => {
    const { stdout, code } = runCli([path.join(FIXTURES, fx.file), '--fail-on', 'never']);
    assert.equal(code, 0, `CLI lỗi khi chạy fixture ${fx.fixtureId}:\n${stdout}`);
    const codesFound = new Set([...stdout.matchAll(/\b(QV\d{3})\b/g)].map((m) => m[1]));
    const errorLines = stdout.split('\n').filter((l) => l.startsWith('ERROR'));

    if (fx.kind === 'good') {
      assert.equal(errorLines.length, 0, `fixture GOOD ${fx.fixtureId} (${fx.name}) lẽ ra không có ERROR nào nhưng có:\n${errorLines.join('\n')}`);
      for (const target of fx.targetRules) {
        assert.ok(!codesFound.has(target), `fixture GOOD ${fx.fixtureId} (${fx.name}) không được kích hoạt rule mục tiêu ${target} nhưng đã bị kích hoạt`);
      }
    } else {
      assert.ok(fx.targetRules.length > 0, `fixture BAD ${fx.fixtureId} (${fx.name}) thiếu targetRules trong manifest`);
      for (const target of fx.targetRules) {
        assert.ok(codesFound.has(target), `fixture BAD ${fx.fixtureId} (${fx.name}) phải kích hoạt rule mục tiêu ${target} nhưng không thấy trong:\n${stdout}`);
      }
    }
  });
}

// ---------------------------------------------------------------- //
// 5. Số dòng report đúng thật (không phải suy đoán)
// ---------------------------------------------------------------- //

test('QV008 báo đúng dòng chứa key "content" khi content rỗng', () => {
  const fx = manifest.fixtures.find((f) => f.kind === 'bad' && f.targetRules.includes('QV008'));
  assert.ok(fx, 'không tìm thấy fixture bad target QV008 trong manifest');
  const filePath = path.join(FIXTURES, fx.file);
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split('\n');
  const expectedLine = lines.findIndex((l) => /"content"\s*:/.test(l)) + 1;
  assert.ok(expectedLine > 0, 'không tìm thấy dòng "content" trong fixture để đối chiếu');

  const { stdout } = runCli([filePath, '--fail-on', 'never']);
  const m = /ERROR QV008 [^:]+:(\d+)/.exec(stdout);
  assert.ok(m, `không thấy finding QV008 trong:\n${stdout}`);
  assert.equal(Number(m[1]), expectedLine);
});

test('QV005 báo đúng dòng chứa option key trùng (không phải dòng đầu file)', () => {
  const fx = manifest.fixtures.find((f) => f.kind === 'bad' && f.targetRules.includes('QV005'));
  assert.ok(fx, 'không tìm thấy fixture bad target QV005 trong manifest');
  const { stdout } = runCli([path.join(FIXTURES, fx.file), '--fail-on', 'never']);
  const m = /ERROR QV005 [^:]+:(\d+)/.exec(stdout);
  assert.ok(m, `không thấy finding QV005 trong:\n${stdout}`);
  assert.ok(Number(m[1]) > 1, 'QV005 không nên báo dòng 1 (phải trỏ đúng vào option trùng)');
});

// ---------------------------------------------------------------- //
// 6. Không sửa/ghi đè file input (công cụ chỉ đọc)
// ---------------------------------------------------------------- //

test('quiz-validator không được sửa/ghi đè file input', () => {
  const filePath = path.join(SAMPLES, 'quiz-bad.json');
  const before = fs.readFileSync(filePath);
  runCli([filePath, '--fail-on', 'never']);
  const after = fs.readFileSync(filePath);
  assert.ok(before.equals(after), 'nội dung file input đã bị thay đổi sau khi chạy CLI');
});

// ---------------------------------------------------------------- //
// 7. Report JSON/CSV đúng field, --out-dir ghi đúng chỗ
// ---------------------------------------------------------------- //

test('--out-dir ghi quality-report.json/.csv đúng field, đúng nội dung', () => {
  const outDir = path.join(ROOT, 'tests', '_tmp-out');
  fs.rmSync(outDir, { recursive: true, force: true });
  runCli([path.join(SAMPLES, 'quiz-bad.json'), '--out-dir', outDir, '--fail-on', 'never']);
  try {
    const jsonReport = JSON.parse(fs.readFileSync(path.join(outDir, 'quality-report.json'), 'utf8'));
    assert.equal(jsonReport.summary.rulesApplied, 23);
    assert.ok(jsonReport.findings.length > 0);
    // Extended Quality Report schema (theo hướng dẫn v2): Rule ID, Severity,
    // File/Question ID, Path, Message, Suggested Fix, + 3 cột con người điền
    // tay sau khi review (Human Verification, False Positive?, Final Result).
    for (const f of jsonReport.findings) {
      for (const field of ['severity', 'code', 'file', 'questionId', 'message', 'fix', 'humanVerification', 'falsePositive', 'finalResult']) {
        assert.ok(field in f, `finding thiếu field "${field}"`);
      }
    }
    const csv = fs.readFileSync(path.join(outDir, 'quality-report.csv'), 'utf8');
    assert.match(csv, /^ruleId,severity,file,questionId,line,path,message,suggestedFix,humanVerification,falsePositive,finalResult/);
    assert.equal(csv.trim().split('\n').length - 1, jsonReport.findings.length);
  } finally {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------- //
// 8. --fail-on hoạt động đúng
// ---------------------------------------------------------------- //

test('--fail-on error: exit 1 khi có ERROR, exit 0 khi không truyền (mặc định = error)', () => {
  const bad = runCli([path.join(SAMPLES, 'quiz-bad.json')]);
  assert.equal(bad.code, 1);
  const good = runCli([path.join(SAMPLES, 'quiz-good.json')]);
  assert.equal(good.code, 0);
});

test('--fail-on never: luôn exit 0 kể cả khi có ERROR', () => {
  const { code } = runCli([path.join(SAMPLES, 'quiz-bad.json'), '--fail-on', 'never']);
  assert.equal(code, 0);
});

test('--fail-on warning: exit 1 kể cả khi chỉ có WARNING (quiz-good.json có đúng 1 WARNING đã biết QV023 nên exit 1)', () => {
  const { code } = runCli([path.join(SAMPLES, 'quiz-good.json'), '--fail-on', 'warning']);
  assert.equal(code, 1);
});

// ---------------------------------------------------------------- //
// 9. Quét cả thư mục
// ---------------------------------------------------------------- //

test('truyền 1 thư mục -> tự quét đệ quy hết file .json bên trong', () => {
  const { stdout, code } = runCli([FIXTURES, '--fail-on', 'never']);
  assert.equal(code, 0, stdout);
  const m = /Scanned (\d+) file\(s\)/.exec(stdout);
  assert.ok(m);
  assert.equal(Number(m[1]), manifest.fixtures.length);
});

// ---------------------------------------------------------------- //
// 10. Rule cấp file (QV017/QV018) không báo nhầm câu hỏi lỗi vào thống kê
// ---------------------------------------------------------------- //

test('QV017/QV018 loại câu hỏi đã lỗi (thiếu answer key, nhiều đáp án đúng...) khỏi thống kê pattern lệch', () => {
  const dir = path.join(ROOT, 'tests', '_tmp-skew-noise');
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const questions = [];
  // 6 câu KHÔNG hợp lệ (không có answer key) - phải bị loại khỏi tính toán skew
  for (let i = 0; i < 6; i++) {
    questions.push({
      content: `Câu hỏi lỗi số ${i + 1} (không có answer key).`,
      category: 'Noise',
      difficulty: 'EASY',
      points: 10,
      options: [
        { key: 'A', text: 'X', isCorrect: false },
        { key: 'B', text: 'Y', isCorrect: false },
      ],
      explanation: 'Giải thích đầy đủ cho câu hỏi noise, đủ dài.',
    });
  }
  fs.writeFileSync(path.join(dir, 'noise.json'), JSON.stringify(questions, null, 2), 'utf8');
  const { stdout } = runCli([path.join(dir, 'noise.json'), '--fail-on', 'never']);
  try {
    assert.ok(!/QV017/.test(stdout), `QV017 lẽ ra không được tính trên các câu đã lỗi (0 câu hợp lệ < ngưỡng tối thiểu):\n${stdout}`);
    assert.ok(!/QV018/.test(stdout), `QV018 lẽ ra không được tính trên các câu đã lỗi:\n${stdout}`);
    assert.match(stdout, /6 error\(s\)/); // vẫn phải báo đủ 6 lỗi QV010
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------- //
// 12. Checklist test tối thiểu theo hướng dẫn điều chỉnh (mục 8) - mỗi dòng
// dưới đây là 1 gạch đầu dòng trong checklist mentor đưa, viết thành test
// riêng có tên rõ ràng (không chỉ dựa vào vòng lặp fixture ở mục 4, để
// review dễ đối chiếu 1-1 với checklist gốc).
// ---------------------------------------------------------------- //

function findFixture(kind, ruleCode) {
  const fx = manifest.fixtures.find((f) => f.kind === kind && f.targetRules.includes(ruleCode));
  assert.ok(fx, `không tìm thấy fixture ${kind} target ${ruleCode} trong manifest`);
  return fx;
}

function findingsOf(fx) {
  const { stdout } = runCli([path.join(FIXTURES, fx.file), '--fail-on', 'never']);
  return stdout;
}

test('checklist #1: fixture GOOD hợp lệ -> không có ERROR nào', () => {
  const fx = findFixture('good', 'QV001');
  const stdout = findingsOf(fx);
  assert.ok(!/^ERROR/m.test(stdout), `fixture good "${fx.name}" không được có ERROR:\n${stdout}`);
});

test('checklist #2: content rỗng -> QV008 (ERROR)', () => {
  const fx = findFixture('bad', 'QV008');
  const stdout = findingsOf(fx);
  assert.match(stdout, /ERROR QV008/, stdout);
});

test('checklist #3: option trùng nội dung -> QV004 (ERROR)', () => {
  const fx = findFixture('bad', 'QV004');
  const stdout = findingsOf(fx);
  assert.match(stdout, /ERROR QV004/, stdout);
});

test('checklist #4: không có đáp án đúng nào -> QV010 (ERROR)', () => {
  const fx = findFixture('bad', 'QV010');
  const stdout = findingsOf(fx);
  assert.match(stdout, /ERROR QV010/, stdout);
});

test('checklist #5: có 2 đáp án đúng (không khai allowMultiple) -> QV011 (ERROR)', () => {
  const fx = findFixture('bad', 'QV011');
  const stdout = findingsOf(fx);
  assert.match(stdout, /ERROR QV011/, stdout);
});

test('checklist #6: option thiếu/rỗng answer key -> QV012 (ERROR)', () => {
  const fx = findFixture('bad', 'QV012');
  const stdout = findingsOf(fx);
  assert.match(stdout, /ERROR QV012/, stdout);
});

test('checklist #7: đáp án đúng lệch vị trí trong cả file -> QV017 (WARNING, không phải ERROR)', () => {
  const fx = findFixture('bad', 'QV017');
  const stdout = findingsOf(fx);
  assert.match(stdout, /WARNING QV017/, stdout);
  assert.ok(!/ERROR QV017/.test(stdout), 'QV017 phải là WARNING, không được là ERROR (chỉ để con người xem lại, không tự kết luận đề sai)');
});

test('checklist #8: mẫu câu ambiguity ("tất cả đáp án trên"...) -> WARNING, không phải ERROR (chỉ gắn cờ, không tự kết luận)', () => {
  const fx = findFixture('bad', 'QV015');
  const stdout = findingsOf(fx);
  assert.match(stdout, /WARNING QV015/, stdout);
  assert.ok(!/ERROR QV015/.test(stdout), 'QV015 (ambiguity) phải luôn là WARNING theo đúng yêu cầu mục 6 của hướng dẫn');
});

// ---------------------------------------------------------------- //
// 11. Nội dung thật (bonus) không rỗng và không lỗi ERROR nào
// ---------------------------------------------------------------- //

test('real-content/quiz-questions.json (30 câu thật) không có ERROR nào (chỉ có thể có WARNING)', () => {
  const realFile = path.join(ROOT, 'real-content', 'quiz-questions.json');
  assert.ok(fs.existsSync(realFile), 'chưa chạy extract-quiz-from-ts.js để sinh real-content/quiz-questions.json');
  const { stdout, code } = runCli([realFile, '--fail-on', 'never']);
  assert.equal(code, 0);
  const errorLines = stdout.split('\n').filter((l) => l.startsWith('ERROR'));
  assert.equal(errorLines.length, 0, `nội dung thật không nên có ERROR cấu trúc:\n${errorLines.join('\n')}`);
  const m = /Scanned \d+ file\(s\), (\d+) question\(s\)/.exec(stdout);
  assert.equal(Number(m[1]), 30);
});
