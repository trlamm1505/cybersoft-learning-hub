'use strict';
/**
 * problem-loader.js
 * ------------------------------------------------------------------
 * Đọc file JSON chứa 1 MẢNG bài coding (format của Exercise trong BE) và gắn
 * SỐ DÒNG thật cho từng bài / từng field / từng test case, để report chỉ ra
 * chính xác "file:dòng" thay vì chỉ có JSONPath (cùng kỹ thuật Ngày 11-12).
 *
 * Tùy chọn "overlay" (--suite hardened): file overrides của QA thêm
 *   { slug, constraints?, extraTests?: [{input, expectedOutput, isHidden, note?}] }
 * vào bài gốc mà KHÔNG sửa file gốc. Test do QA thêm được gắn `addedByQA: true`.
 */
const fs = require('fs');
const path = require('path');
const { charOffsetToLine, scanArrayItems, findKeyLine, findArrayOpenForKey } = require('./text-scan');

function loadProblemFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    let line = 1;
    const m = /position (\d+)/.exec(e.message);
    if (m) line = charOffsetToLine(raw, parseInt(m[1], 10));
    return { ok: false, filePath, error: e.message, line };
  }
  if (!Array.isArray(data)) {
    return { ok: false, filePath, error: 'File phải chứa 1 mảng JSON các bài coding', line: 1 };
  }

  const openIdx = raw.indexOf('[');
  const { items } = scanArrayItems(raw, openIdx);
  const fileBase = path.basename(filePath);

  const problems = data.map((p, i) => {
    const span = items[i] || { start: 0, end: raw.length };
    const startLine = charOffsetToLine(raw, span.start);
    const keyLine = (key) => findKeyLine(raw, key, span.start, span.end + 1) || startLine;
    const loc = {
      startLine,
      slug: keyLine('slug'),
      title: keyLine('title'),
      description: keyLine('description'),
      starterCode: keyLine('starterCode'),
      solutionCode: keyLine('solutionCode'),
      timeLimitMs: keyLine('timeLimitMs'),
      testCases: keyLine('testCases'),
    };

    // dòng của từng test case
    const testLines = [];
    const tcOpen = findArrayOpenForKey(raw, 'testCases', span.start, span.end + 1);
    if (tcOpen !== -1) {
      const scanned = scanArrayItems(raw, tcOpen);
      scanned.items.forEach((it) => testLines.push(charOffsetToLine(raw, it.start)));
    }

    const tests = Array.isArray(p.testCases) ? p.testCases : [];
    return {
      ...p,
      testCases: tests.map((t, k) => ({ ...t, line: testLines[k] || loc.testCases, addedByQA: false })),
      __file: fileBase,
      __filePath: filePath,
      __index: i,
      loc,
    };
  });
  return { ok: true, filePath, problems };
}

/** Áp overlay của QA (constraints + extraTests) lên danh sách bài đã load. */
function applyOverlay(problems, overlayPath) {
  const overlay = JSON.parse(fs.readFileSync(overlayPath, 'utf8'));
  const bySlug = new Map(overlay.map((o) => [o.slug, o]));
  for (const p of problems) {
    const o = bySlug.get(p.slug);
    if (!o) continue;
    if (o.constraints) p.constraints = o.constraints;
    if (o.constraintsText) p.constraintsText = o.constraintsText;
    (o.extraTests || []).forEach((t, k) => {
      p.testCases.push({ input: t.input, expectedOutput: t.expectedOutput, isHidden: t.isHidden !== false, line: p.loc.testCases, addedByQA: true, note: t.note, overlayIndex: k });
    });
    p.suite = 'hardened';
  }
  return problems;
}

module.exports = { loadProblemFile, applyOverlay };
