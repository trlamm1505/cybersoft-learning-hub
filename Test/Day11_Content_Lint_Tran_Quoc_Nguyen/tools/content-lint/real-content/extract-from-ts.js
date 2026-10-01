#!/usr/bin/env node
'use strict';
/**
 * extract-from-ts.js
 * ------------------------------------------------------------------
 * Trích xuất bài học THẬT từ seed data của BE (initial-data.ts) và
 * mock data của FE (mockLessons.ts) trong repo cybersoft-learning-hub,
 * ghi ra JSON dạng mảng bài học để content-lint.js lint được trực tiếp
 * (không cần thư viện ngoài - chỉ dùng module có sẵn của Node).
 *
 * Cách làm: strip phần "import" ở đầu file (chỉ chấp nhận "import type",
 * không dùng runtime import), strip type annotation sau "export const NAME",
 * rồi chạy phần còn lại trong 1 sandbox riêng (vm module) để lấy đúng giá
 * trị JS thật (giữ nguyên template string, nested object...).
 *
 * Dùng:
 *   node extract-from-ts.js be <path/to/initial-data.ts> <output.json>
 *   node extract-from-ts.js fe <path/to/mockLessons.ts> <output.json>
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function stripAndCollectExports(source, filePath) {
  const lines = source.split('\n');
  let firstExportIdx = lines.findIndex((l) => /^\s*export\s+const\s+/.test(l));
  if (firstExportIdx === -1) firstExportIdx = lines.length;
  const headerLines = lines.slice(0, firstExportIdx);
  const bodyLines = lines.slice(firstExportIdx);

  const kept = [];
  const suspicious = [];
  for (const line of headerLines) {
    const m = line.match(/^\s*import\s+(type\s+)?.*from\s+['"].*['"]\s*;?\s*$/);
    if (m) {
      if (!m[1]) suspicious.push(line.trim());
      continue;
    }
    kept.push(line);
  }
  if (suspicious.length) {
    throw new Error(`File ${filePath} có import runtime ở đầu file, extractor chưa hỗ trợ:\n  ${suspicious.join('\n  ')}`);
  }

  let code = kept.concat(bodyLines).join('\n');
  code = code.replace(/export\s+const\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*(:[^=]+)?=/g, 'module.exports.$1 =');
  return code;
}

function extractFile(filePath) {
  const abs = path.resolve(filePath);
  const source = fs.readFileSync(abs, 'utf8');
  const jsCode = stripAndCollectExports(source, filePath);
  const sandbox = { module: { exports: {} }, exports: {} };
  sandbox.module.exports = sandbox.exports;
  vm.createContext(sandbox);
  new vm.Script(jsCode, { filename: abs }).runInContext(sandbox, { timeout: 5000 });
  return sandbox.module.exports;
}

function main() {
  const [mode, inputPath, outputPath] = process.argv.slice(2);
  if (!mode || !inputPath || !outputPath) {
    console.error('Usage: node extract-from-ts.js <be|fe> <input.ts> <output.json>');
    process.exit(2);
  }

  const exported = extractFile(inputPath);
  let lessons = [];

  if (mode === 'be') {
    const courses = exported.INITIAL_COURSES || [];
    courses.forEach((course) => {
      (course.lessons || []).forEach((lesson) => {
        lessons.push({ ...lesson, _courseTitle: course.title, _courseSlug: course.slug });
      });
    });
  } else if (mode === 'fe') {
    lessons = exported.MOCK_LESSONS || [];
  } else {
    console.error(`Mode không hợp lệ: ${mode} (chỉ nhận "be" hoặc "fe")`);
    process.exit(2);
  }

  if (lessons.length === 0) {
    console.error(`Không trích xuất được bài học nào từ ${inputPath}`);
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(path.resolve(outputPath)), { recursive: true });
  fs.writeFileSync(path.resolve(outputPath), JSON.stringify(lessons, null, 2), 'utf8');
  console.log(`OK: ${inputPath} -> ${outputPath} (${lessons.length} lesson(s))`);
}

main();
