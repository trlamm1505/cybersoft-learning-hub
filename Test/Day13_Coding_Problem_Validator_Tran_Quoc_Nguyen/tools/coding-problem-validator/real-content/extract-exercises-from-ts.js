#!/usr/bin/env node
'use strict';
/**
 * extract-exercises-from-ts.js
 * ------------------------------------------------------------------
 * Trích DỮ LIỆU BÀI CODING THẬT của Code Playground (seed data trong BE) ra
 * file JSON để coding-problem-validator đọc. Không sửa file gốc (.ts).
 *
 * Nguồn (mặc định, tính từ vị trí file này trong cybersoft-learning-hub/Test/...):
 *   BE/src/data/initial-exercises.ts        -> INITIAL_EXERCISES        (10 bài Python cơ bản)
 *   BE/src/data/initial-exercises-day14.ts  -> INITIAL_EXERCISES_DAY14 (20 bài lớp 6-9)
 *
 * Cách làm: 2 file .ts này chỉ chứa 1 mảng object-literal (JS hợp lệ, không có
 * type annotation) nên chỉ cần cắt phần `export const NAME = [ ... ];` rồi
 * chạy trong `vm` (không cần TypeScript compiler, không cài package).
 *
 * Dùng:
 *   node extract-exercises-from-ts.js [--be-data-dir DIR] [--out-dir DIR]
 *
 * Output (mỗi bài giữ đủ: slug, title, description, difficulty, starterCode,
 * solutionCode, timeLimitMs, testCases[{input,expectedOutput,isHidden}]):
 *   <out-dir>/base-exercises.json
 *   <out-dir>/day14-exercises.json
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function parseArgs(argv) {
  const args = {
    beDataDir: path.resolve(__dirname, '../../../../../learning-hub/BE/src/data'),
    outDir: path.resolve(__dirname, '../problems'),
  };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--be-data-dir') args.beDataDir = path.resolve(argv[++i]);
    else if (argv[i] === '--out-dir') args.outDir = path.resolve(argv[++i]);
    else throw new Error(`Unknown option: ${argv[i]}`);
  }
  return args;
}

function extractArray(tsSource, exportName) {
  const startRe = new RegExp(`export\\s+const\\s+${exportName}\\s*=\\s*\\[`);
  const m = startRe.exec(tsSource);
  if (!m) throw new Error(`Không tìm thấy "export const ${exportName} = [" trong file`);
  const literal = tsSource.slice(m.index + m[0].length - 1); // bắt đầu tại dấu '['
  // Cắt tới dấu ']' cuối cùng của file (file chỉ có 1 export).
  const end = literal.lastIndexOf(']');
  if (end === -1) throw new Error('Không thấy dấu đóng mảng');
  const arrayText = literal.slice(0, end + 1);
  return vm.runInNewContext(`(${arrayText})`, Object.create(null), { timeout: 2000 });
}

function slim(ex) {
  // Giữ đúng các field mà Code Playground/judge thật dùng để chấm.
  const out = {
    slug: ex.slug,
    title: ex.title,
    type: ex.type,
    difficulty: ex.difficulty,
    description: ex.description,
    starterCode: ex.starterCode,
    solutionCode: ex.solutionCode,
    timeLimitMs: ex.timeLimitMs,
    testCases: (ex.testCases || []).map((t) => ({
      input: t.input,
      expectedOutput: t.expectedOutput,
      isHidden: t.isHidden,
    })),
  };
  return out;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  fs.mkdirSync(args.outDir, { recursive: true });

  const jobs = [
    { file: 'initial-exercises.ts', name: 'INITIAL_EXERCISES', out: 'base-exercises.json' },
    { file: 'initial-exercises-day14.ts', name: 'INITIAL_EXERCISES_DAY14', out: 'day14-exercises.json' },
  ];
  for (const job of jobs) {
    const src = fs.readFileSync(path.join(args.beDataDir, job.file), 'utf8');
    const list = extractArray(src, job.name).map(slim);
    fs.writeFileSync(path.join(args.outDir, job.out), JSON.stringify(list, null, 2) + '\n', 'utf8');
    console.log(`${job.file}: ${list.length} bài -> ${path.join(args.outDir, job.out)}`);
  }
}

main();
