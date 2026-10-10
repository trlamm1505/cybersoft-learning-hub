#!/usr/bin/env node
'use strict';
/**
 * build-manifest.js
 * ------------------------------------------------------------------
 * Gắn thêm metadata THIẾT KẾ (learning outcome, parameter rules, sourceVersion)
 * lên trên `sources-raw.json` (dữ liệu trích THẬT, không sửa). Phần metadata này
 * là quyết định của Day15 (không có trong schema BE thật - xem PHASE1_SURVEY.md
 * mục 8.2), lưu RIÊNG trong `source-manifest.json` của Day15, không đụng BE.
 *
 * sourceVersion bắt đầu "1.0". Lần chạy sau: nếu contentHash lệch so với giá trị
 * đã lưu trong manifest cũ -> phải tự tăng version và cảnh báo (source đã đổi).
 */
const fs = require('fs');
const path = require('path');

const DESIGN = {
  'tinh-tong-hai-so-nguyen': {
    learningOutcome: 'Học viên đọc 2 số nguyên từ 2 dòng input và in đúng tổng A+B.',
    allowedToChange: ['testCases (giá trị A, B)'],
    mustNotChange: ['description', 'starterCode', 'solutionCode', 'type', 'difficulty'],
    paramRules: { a: { type: 'int', min: -999999, max: 999999 }, b: { type: 'int', min: -999999, max: 999999 } },
  },
  'kiem-tra-so-chan-le': {
    learningOutcome: 'Học viên xác định 1 số nguyên N là chẵn hay lẻ bằng phép %.',
    allowedToChange: ['testCases (giá trị N)'],
    mustNotChange: ['description', 'starterCode', 'solutionCode', 'type', 'difficulty'],
    paramRules: { n: { type: 'int', min: -999999, max: 999999 } },
  },
  'kiem-tra-so-nguyen-to': {
    learningOutcome: 'Học viên xác định 1 số nguyên dương N có phải số nguyên tố không (kể cả biên n<2, n=2).',
    allowedToChange: ['testCases (giá trị N, nên phủ đủ: hợp số, nguyên tố, biên <2, biên =2)'],
    mustNotChange: ['description', 'starterCode', 'solutionCode', 'type', 'difficulty'],
    paramRules: { n: { type: 'int', min: 1, max: 100000 } },
  },
  'tim-so-lon-nhat': {
    learningOutcome: 'Học viên tìm giá trị lớn nhất trong 1 danh sách N số nguyên.',
    allowedToChange: ['testCases (N và danh sách số)'],
    mustNotChange: ['description', 'starterCode', 'solutionCode', 'type', 'difficulty'],
    paramRules: { n: { type: 'int', min: 1, max: 20 }, values: { type: 'int[]', min: -1000, max: 1000 } },
  },
  'initial-quiz-questions.ts#Q5': {
    learningOutcome: 'Học viên hiểu `typeof` trong JavaScript LUÔN trả về 1 chuỗi (string) - nên typeof(typeof BẤT KỲ giá trị nào) luôn là "string".',
    allowedToChange: ['codeSnippet (literal bên trong typeof), content (câu dẫn nếu cần khớp literal)'],
    mustNotChange: ['category', 'difficulty', 'points', 'options (giữ đúng 4 lựa chọn A/B/C/D, đáp án đúng luôn là B "string")', 'explanation (giữ nguyên lý do, chỉ có thể diễn giải lại literal cụ thể)', 'tags'],
    paramRules: { literal: { type: 'js-literal-source', allowed: ['number', 'string', 'boolean', 'null', 'undefined', 'array', 'object', 'float'] } },
  },
};

function main() {
  const [rawPath, outPath] = process.argv.slice(2);
  const raw = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
  const manifest = raw.map((s) => {
    const d = DESIGN[s.sourceId];
    if (!d) throw new Error(`Thiếu DESIGN metadata cho sourceId="${s.sourceId}" - phải tự thêm trước khi build manifest.`);
    return {
      sourceId: s.sourceId,
      sourceType: s.sourceType,
      sourceFile: s.sourceFile,
      sourceVersion: '1.0',
      contentHash: s.contentHash,
      learningOutcome: d.learningOutcome,
      allowedToChange: d.allowedToChange,
      mustNotChange: d.mustNotChange,
      paramRules: d.paramRules,
      content: s.content,
    };
  });
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log(`OK: ${manifest.length} source -> ${outPath}`);
}

main();
