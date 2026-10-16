#!/usr/bin/env node
'use strict';
/**
 * run-all.js - chạy lại TOÀN BỘ quy trình Ngày 13 từ đầu, sinh lại mọi report + evidence.
 *   node run-all.js [--python PY] [--skip-tests]
 * Thứ tự: (0) trích bài thật từ BE nếu có -> (1) validate (baseline + hardened) -> (2) mutation 4 lượt
 *         -> (3) probe-leak -> (4) kiểm chứng độc lập bằng Python -> (5) node --test.
 * Exit code khác 0 nếu bước "bắt buộc" fail (validate có ERROR, hardened < 80%, kiểm chứng độc lập chênh lệch, test fail).
 * Lưu ý: mutation "baseline" của bài số nguyên tố CỐ Ý ra FAIL (66.7%) - đó là kết quả cần báo cáo, không phải lỗi tool.
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const pyIdx = args.indexOf('--python');
const python = pyIdx >= 0 ? args[pyIdx + 1] : null;
const skipTests = args.includes('--skip-tests');
const pyFlag = python ? ['--python', python] : [];
const py = python || (process.platform === 'win32' ? 'python' : 'python3');
const CLI = path.join(__dirname, 'coding-problem-validator.js');

let failed = 0;
function step(title, cmd, cmdArgs, { okCodes = [0], required = true } = {}) {
  console.log(`\n=== ${title}`);
  const r = spawnSync(cmd, cmdArgs, { cwd: __dirname, stdio: 'inherit' });
  const ok = okCodes.includes(r.status);
  console.log(`--- exit ${r.status} ${ok ? '(đúng kỳ vọng)' : '(KHÔNG như kỳ vọng)'}`);
  if (!ok && required) failed++;
}

const cli = (a, opts) => [process.execPath, [CLI, ...a, ...pyFlag], opts];
const BASE = 'problems/base-exercises.json';
const OV = 'problems-hardened/overrides.json';
const PRIME = ['--slug', 'kiem-tra-so-nguyen-to', '--mutants', 'mutants/kiem-tra-so-nguyen-to.json', '--mutants-out', 'solutions/mutants/kiem-tra-so-nguyen-to'];
const SORT = ['--slug', 'sap-xep-tang-dan', '--mutants', 'mutants/sap-xep-tang-dan.json', '--mutants-out', 'solutions/mutants/sap-xep-tang-dan'];

// reference solution của 2 bài đã làm mutation -> solutions/reference/<slug>.py (để con người đọc/đối chiếu)
for (const slug of ['kiem-tra-so-nguyen-to', 'sap-xep-tang-dan']) {
  const list = JSON.parse(fs.readFileSync(path.join(__dirname, BASE), 'utf8'));
  const p = list.find((x) => x.slug === slug);
  fs.mkdirSync(path.join(__dirname, 'solutions', 'reference'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, 'solutions', 'reference', `${slug}.py`), `${p.solutionCode}\n`, 'utf8');
}

step('1a. validate 30 bài thật (test gốc)', ...cli(['validate', 'problems', '--out-dir', 'reports/validate-baseline']));
step('1b. validate 30 bài thật + overlay hardened', ...cli(['validate', 'problems', '--overlay', OV, '--out-dir', 'reports/validate-hardened']));
step('2a. mutation SỐ NGUYÊN TỐ - test gốc (kỳ vọng exit 1 = FAIL 66.7%)', ...cli(['mutate', BASE, ...PRIME, '--out-dir', 'reports/mutation-prime-baseline'], { okCodes: [1] }));
step('2b. mutation SỐ NGUYÊN TỐ - test hardened (kỳ vọng PASS 100%)', ...cli(['mutate', BASE, ...PRIME, '--overlay', OV, '--out-dir', 'reports/mutation-prime-hardened']));
step('2c. mutation SẮP XẾP - test gốc (kỳ vọng PASS 90.9%)', ...cli(['mutate', BASE, ...SORT, '--out-dir', 'reports/mutation-sort-baseline']));
step('2d. mutation SẮP XẾP - test hardened (kỳ vọng PASS 100%)', ...cli(['mutate', BASE, ...SORT, '--overlay', OV, '--out-dir', 'reports/mutation-sort-hardened']));
step('3. probe-leak (kỳ vọng exit 1 = phát hiện đường lộ qua stderr, xem README mục 8)', ...cli(['probe-leak', BASE, '--slug', 'sap-xep-tang-dan', '--out-dir', 'reports/probe-leak'], { okCodes: [1] }));
step('3b. hint3 == solutionCode? (F-D13-08; kỳ vọng exit 1 = có trùng; bỏ qua nếu không thấy thư mục BE)', process.execPath, ['real-content/check-hint3-equals-solution.js'], { okCodes: [0, 1], required: false });
for (const [rep, slug, ov] of [
  ['mutation-prime-baseline', 'kiem-tra-so-nguyen-to', null], ['mutation-prime-hardened', 'kiem-tra-so-nguyen-to', OV],
  ['mutation-sort-baseline', 'sap-xep-tang-dan', null], ['mutation-sort-hardened', 'sap-xep-tang-dan', OV],
]) {
  step(`4. kiểm chứng độc lập (Python) - ${rep}`, py, ['verify-independent.py', `reports/${rep}`, `solutions/mutants/${slug}`, BASE, slug, ...(ov ? [ov] : [])]);
}
if (!skipTests) step('5. node --test', process.execPath, ['--test', 'tests/coding-problem-validator.test.js']);
console.log(`\n${failed === 0 ? 'TẤT CẢ BƯỚC ĐÚNG KỲ VỌNG' : `${failed} BƯỚC KHÔNG NHƯ KỲ VỌNG`}`);
process.exit(failed === 0 ? 0 : 1);
