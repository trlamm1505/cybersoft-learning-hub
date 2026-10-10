#!/usr/bin/env node
'use strict';
/**
 * check-hint3-equals-solution.js - kiểm chứng phát hiện F-D13-08: trong seed Ngày 14, hints.hint3 có trùng
 * nguyên văn solutionCode không? (chỉ ĐỌC, in số đếm - không in nội dung lời giải).
 *   node real-content/check-hint3-equals-solution.js [--be-data-dir DIR]
 * Liên quan: exercise.service.ts findBySlug() .select(... hints) trả nguyên object hints cho GET /exercises/:slug,
 * trong khi HintService che nội dung hint theo cơ chế unlock + cooldown.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const i = process.argv.indexOf('--be-data-dir');
const dir = i >= 0 ? path.resolve(process.argv[i + 1]) : path.resolve(__dirname, '../../../../../learning-hub/BE/src/data');
const file = path.join(dir, 'initial-exercises-day14.ts');
if (!fs.existsSync(file)) {
  console.error(`Không thấy ${file} - truyền --be-data-dir tới BE/src/data.`);
  process.exit(2);
}
const src = fs.readFileSync(file, 'utf8');
const start = src.indexOf('export const INITIAL_EXERCISES_DAY14 = ') + 'export const INITIAL_EXERCISES_DAY14 = '.length;
const list = vm.runInNewContext(`(${src.slice(start, src.lastIndexOf(']') + 1)})`, Object.create(null), { timeout: 2000 });
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
const withHint3 = list.filter((p) => p.hints && p.hints.hint3);
const same = withHint3.filter((p) => norm(p.hints.hint3) === norm(p.solutionCode));
console.log(`Bài Ngày 14 có hint3: ${withHint3.length}; hint3 trùng nguyên văn solutionCode: ${same.length}/${withHint3.length}`);
process.exit(same.length > 0 ? 1 : 0);
