#!/usr/bin/env node
'use strict';
/**
 * extract-quiz-from-ts.js
 * ------------------------------------------------------------------
 * Trích xuất câu hỏi trắc nghiệm THẬT từ seed data của BE
 * (`initial-quiz-questions.ts` trong repo cybersoft-learning-hub) ra JSON
 * dạng mảng câu hỏi để quiz-validator.js kiểm tra trực tiếp - không dùng
 * thư viện ngoài, chỉ dùng module có sẵn của Node (cùng kỹ thuật đã dùng ở
 * `extract-from-ts.js` của Ngày 11).
 *
 * Cách làm: file nguồn chỉ có 1 khai báo `export interface InitialQuestion
 * {...}` (thuần TypeScript, KHÔNG phải JS hợp lệ) rồi mới tới
 * `export const INITIAL_QUIZ_QUESTIONS: InitialQuestion[] = [...]`. Vì
 * không có import runtime nào trong file, cách đơn giản và an toàn nhất là
 * BỎ HẲN phần trước dòng "export const" đầu tiên (không cần giữ lại interface
 * - nó không dùng được trong sandbox JS thuần), rồi mới chạy phần còn lại
 * trong 1 sandbox riêng (vm module).
 *
 * Nếu BE đổi cấu trúc file (vd thêm import runtime phía trên), script báo
 * lỗi rõ ràng thay vì chạy sai lặng lẽ (xem hàm extractFile()).
 *
 * Dùng:
 *   node extract-quiz-from-ts.js <path/to/initial-quiz-questions.ts> <output.json>
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function extractFile(filePath) {
  const abs = path.resolve(filePath);
  const source = fs.readFileSync(abs, 'utf8');

  const lines = source.split('\n');
  const firstExportConstIdx = lines.findIndex((l) => /^\s*export\s+const\s+/.test(l));
  if (firstExportConstIdx === -1) {
    throw new Error(`Không tìm thấy "export const ..." nào trong ${filePath} - cấu trúc file đã đổi, cần cập nhật lại extractor.`);
  }

  const headerLines = lines.slice(0, firstExportConstIdx);
  const suspiciousImports = headerLines.filter((l) => /^\s*import\s+/.test(l) && !/^\s*import\s+type\s+/.test(l));
  if (suspiciousImports.length) {
    throw new Error(`File ${filePath} có import runtime ở đầu file, extractor chưa hỗ trợ:\n  ${suspiciousImports.join('\n  ')}`);
  }
  // Phần header (nếu có) chỉ được phép là comment / import type / khai báo
  // "interface" thuần TypeScript - KHÔNG giữ lại (không chạy được trong JS
  // sandbox); chỉ giữ phần từ "export const" trở đi.
  const bodyLines = lines.slice(firstExportConstIdx);
  let code = bodyLines.join('\n');
  code = code.replace(/export\s+const\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*(:[^=]+)?=/g, 'module.exports.$1 =');

  const sandbox = { module: { exports: {} }, exports: {} };
  sandbox.module.exports = sandbox.exports;
  vm.createContext(sandbox);
  new vm.Script(code, { filename: abs }).runInContext(sandbox, { timeout: 5000 });
  return sandbox.module.exports;
}

function main() {
  const [inputPath, outputPath] = process.argv.slice(2);
  if (!inputPath || !outputPath) {
    console.error('Usage: node extract-quiz-from-ts.js <input.ts> <output.json>');
    process.exit(2);
  }

  const exported = extractFile(inputPath);
  const questions = exported.INITIAL_QUIZ_QUESTIONS || [];

  if (questions.length === 0) {
    console.error(`Không trích xuất được câu hỏi nào từ ${inputPath} (export "INITIAL_QUIZ_QUESTIONS" rỗng hoặc không tồn tại).`);
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(path.resolve(outputPath)), { recursive: true });
  fs.writeFileSync(path.resolve(outputPath), JSON.stringify(questions, null, 2), 'utf8');
  console.log(`OK: ${inputPath} -> ${outputPath} (${questions.length} question(s))`);
}

main();
