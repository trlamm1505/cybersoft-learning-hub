#!/usr/bin/env node
'use strict';
/**
 * build-fixtures.js - sinh fixture bank cho coding-problem-validator.
 *   fixtures/bad/FIX-B##-CPxxx.json   : mỗi file chứa 1 lỗi cố ý, MỤC TIÊU phải bị rule CPxxx bắt.
 *   fixtures/good/FIX-G##-*.json      : bài sạch / ca "gần lỗi nhưng hợp lệ" - rule tương ứng KHÔNG được báo oan.
 *   fixtures-manifest.json            : kết quả kỳ vọng của từng fixture (đặt NGOÀI thư mục fixtures/ để CLI quét thư mục
 *                                        không tự gom nó vào - bài học từ Ngày 12).
 * Mỗi fixture là 1 mảng JSON chứa 1 bài, cùng format với problems/*.json (format Exercise của BE).
 */
const fs = require('fs');
const path = require('path');

const PRIME_SOL = 'n = int(input())\ndef is_prime(x):\n    if x < 2:\n        return False\n    for i in range(2, int(x ** 0.5) + 1):\n        if x % i == 0:\n            return False\n    return True\nprint("YES" if is_prime(n) else "NO")';
const STARTER = 'n = int(input())\n# Viết code của bạn ở đây\n';
const DESC = 'Cho một số nguyên dương N (1 ≤ N ≤ 10^9). In ra "YES" nếu N là số nguyên tố, ngược lại in ra "NO".';

const base = () => ({
  slug: 'fx-prime', title: 'Kiểm tra số nguyên tố', type: 'CODE_TEXT', difficulty: 'MEDIUM',
  description: DESC, starterCode: STARTER, solutionCode: PRIME_SOL, timeLimitMs: 2000,
  testCases: [
    { input: '7', expectedOutput: 'YES', isHidden: false },
    { input: '10', expectedOutput: 'NO', isHidden: false },
    { input: '1', expectedOutput: 'NO', isHidden: true },
    { input: '97', expectedOutput: 'YES', isHidden: true },
    { input: '2', expectedOutput: 'YES', isHidden: true },
    { input: '9', expectedOutput: 'NO', isHidden: true },
  ],
});
const vary = (fn) => { const p = base(); fn(p); return p; };

const day14 = JSON.parse(fs.readFileSync(path.join(__dirname, 'problems', 'day14-exercises.json'), 'utf8'));
const real = (slug) => day14.find((p) => p.slug === slug);

const bad = [
  ['CP001', 'description rỗng', vary((p) => { p.description = ''; })],
  ['CP002', 'đề không có cận số học', vary((p) => { p.description = 'Cho một số nguyên dương N. In ra "YES" nếu N là số nguyên tố, ngược lại in ra "NO".'; })],
  ['CP003', 'không có sample test', vary((p) => { p.testCases.forEach((t) => { t.isHidden = true; }); })],
  ['CP004', 'test thiếu expectedOutput', vary((p) => { delete p.testCases[0].expectedOutput; })],
  ['CP005', 'thiếu solutionCode', vary((p) => { p.solutionCode = ''; })],
  ['CP006', 'reference sai (luôn in YES)', vary((p) => { p.solutionCode = 'n = int(input())\nprint("YES")'; })],
  ['CP007', 'timeLimitMs = 0', vary((p) => { p.timeLimitMs = 0; })],
  ['CP008', 'expectedOutput có nhãn "Result:"', vary((p) => { p.testCases[0].expectedOutput = 'Result: YES'; })],
  ['CP009', 'không có hidden test', vary((p) => { p.testCases = p.testCases.filter((t) => !t.isHidden); p.testCases.push({ input: '13', expectedOutput: 'YES', isHidden: false }, { input: '15', expectedOutput: 'NO', isHidden: false }); })],
  ['CP010', 'input 0 trong khi đề nói nguyên dương', vary((p) => { p.testCases[2].input = '0'; })],
  ['CP011', 'hai test cùng input', vary((p) => { p.testCases[3].input = '1'; p.testCases[3].expectedOutput = 'NO'; })],
  ['CP012', 'hidden trùng input với sample', vary((p) => { p.testCases[2].input = '7'; p.testCases[2].expectedOutput = 'YES'; })],
  ['CP013', 'chỉ 3 test (1 hidden)', vary((p) => { p.testCases = p.testCases.slice(0, 3); })],
  ['CP014', 'starterCode = solutionCode', vary((p) => { p.starterCode = PRIME_SOL; })],
  ['CP015', 'reference import os', vary((p) => { p.solutionCode = `import os\n${PRIME_SOL}`; })],
  ['CP016', 'giá trị hidden nằm trong đề', vary((p) => { p.description = `${DESC} Lưu ý: 9973 là một ví dụ.`; p.testCases[4] = { input: '9973', expectedOutput: 'YES', isHidden: true }; })],
  ['CP017', 'slug trùng nhau', [vary(() => {}), vary(() => {})]],
  ['CP018', 'expectedOutput thừa dòng trống cuối', vary((p) => { p.testCases[0].expectedOutput = 'YES\n'; })],
  ['CP019', 'expectedOutput > 64KB', vary((p) => { p.solutionCode = 'n = int(input())\nprint("A" * 70000)'; p.testCases[0].expectedOutput = 'A'.repeat(70000); p.testCases[0].input = '7'; })],
];

const good = [
  ['clean-prime', 'bài sạch hoàn toàn (0 finding)', [base()], 'clean'],
  ['multiline-output-real-xep-loai', 'output nhiều dòng, mỗi dòng thuộc tập {A,B,C,D,F}; câu "mỗi kết quả trên một dòng" KHÔNG phải yêu cầu output 1 dòng', [real('day14-ham-quy-doi-diem-chu')], ['CP008']],
  ['positive-N-with-zero-price-real-hoa-don', 'N nguyên dương ở dòng 2, dòng 3 là giá tiền = 0 (hợp lệ)', [real('day14-dinh-dang-hoa-don')], ['CP010']],
  ['function-starter-with-driver-real-giai-thua', 'starterCode có sẵn dòng print() gọi hàm của học viên - đó là khung, không phải đáp án', [real('day14-ham-tinh-giai-thua')], ['CP014']],
  ['empty-expected-output-real-tui-do', 'expectedOutput rỗng "" hợp lệ (đề: túi rỗng thì không in gì)', [real('day14-mo-phong-tui-do')], ['CP004', 'CP008', 'CP018']],
  ['structured-constraints', 'constraints khai báo dạng cấu trúc và mọi test nằm trong khoảng', [vary((p) => { p.constraints = [{ name: 'N', line: 0, min: 1, max: 1000000000 }]; })], 'clean'],
];

const root = __dirname;
fs.rmSync(path.join(root, 'fixtures'), { recursive: true, force: true });
fs.mkdirSync(path.join(root, 'fixtures', 'bad'), { recursive: true });
fs.mkdirSync(path.join(root, 'fixtures', 'good'), { recursive: true });
const manifest = [];
bad.forEach(([code, what, content], i) => {
  const id = `FIX-B${String(i + 1).padStart(2, '0')}`;
  const file = `fixtures/bad/${id}-${code}.json`;
  fs.writeFileSync(path.join(root, file), JSON.stringify(Array.isArray(content) ? content : [content], null, 2) + '\n', 'utf8');
  manifest.push({ id, kind: 'bad', file, targetRule: code, what });
});
good.forEach(([name, what, content, expect], i) => {
  const id = `FIX-G${String(i + 1).padStart(2, '0')}`;
  const file = `fixtures/good/${id}-${name}.json`;
  fs.writeFileSync(path.join(root, file), JSON.stringify(content, null, 2) + '\n', 'utf8');
  manifest.push({ id, kind: 'good', file, expect: expect === 'clean' ? 'clean' : 'no-false-positive', mustNotFire: expect === 'clean' ? [] : expect, what });
});
fs.writeFileSync(path.join(root, 'fixtures-manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');
console.log(`Đã sinh ${bad.length} fixture bad + ${good.length} fixture good + fixtures-manifest.json`);
