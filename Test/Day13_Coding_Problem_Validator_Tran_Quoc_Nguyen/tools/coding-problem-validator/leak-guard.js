'use strict';
/**
 * leak-guard.js
 * ------------------------------------------------------------------
 * Chốt chặn cuối trước khi ghi report: đảm bảo report KHÔNG chứa dữ liệu của
 * hidden test (điều kiện nghiệm thu riêng của Ngày 13).
 *
 * Hai lớp kiểm tra:
 *  1. CẤU TRÚC: mọi object có isHidden === true chỉ được có các key trong
 *     HIDDEN_ALLOWED_KEYS (không input/expected/actual/stderr/stdout...).
 *  2. VĂN BẢN: với mỗi hidden test, nếu input hoặc expectedOutput (đã trim, dài
 *     >= 4 ký tự) xuất hiện nguyên văn trong report mà KHÔNG xuất hiện trong dữ
 *     liệu công khai (đề, starterCode, reference, sample, mã mutant) thì báo lộ.
 *
 * GIỚI HẠN (ghi trong README): giá trị hidden ngắn (<4 ký tự, vd "0", "NO") hoặc
 * trùng với chuỗi công khai không kiểm bằng văn bản được - lớp 1 (cấu trúc) là
 * lớp bảo vệ chính cho các trường hợp này.
 */
const { normalize } = require('./runner');

const HIDDEN_ALLOWED_KEYS = new Set(['index', 'hiddenIndex', 'isHidden', 'passed', 'kind', 'timeMs']);

function structuralLeaks(node, pathStr = '$', out = []) {
  if (Array.isArray(node)) {
    node.forEach((v, i) => structuralLeaks(v, `${pathStr}[${i}]`, out));
  } else if (node && typeof node === 'object') {
    if (node.isHidden === true) {
      for (const k of Object.keys(node)) {
        if (!HIDDEN_ALLOWED_KEYS.has(k)) out.push({ kind: 'structure', where: pathStr, detail: `hidden result có key "${k}" không được phép` });
      }
    }
    for (const [k, v] of Object.entries(node)) structuralLeaks(v, `${pathStr}.${k}`, out);
  }
  return out;
}

/**
 * @param {string[]} reportTexts  các chuỗi sắp ghi ra file (json/csv/md/console)
 * @param {object[]} problems     bài (đã gồm testCases đầy đủ)
 * @param {string[]} publicTexts  văn bản công khai bổ sung (mã mutant, patch...)
 */
function textLeaks(reportTexts, problems, publicTexts = []) {
  const out = [];
  for (const p of problems) {
    const pub = [p.description, p.starterCode, p.solutionCode, p.constraintsText, ...publicTexts]
      .concat(p.testCases.filter((t) => !t.isHidden).flatMap((t) => [t.input, t.expectedOutput]))
      .filter(Boolean)
      .join('\n');
    let h = 0;
    for (const t of p.testCases) {
      if (!t.isHidden) continue;
      h++;
      for (const [field, raw] of [['input', t.input], ['expectedOutput', t.expectedOutput]]) {
        const v = normalize(raw);
        if (v.length < 4 || pub.includes(v)) continue;
        if (reportTexts.some((txt) => txt.includes(v))) {
          out.push({ kind: 'text', where: `${p.slug} Hidden test #${String(h).padStart(2, '0')}`, detail: `giá trị "${field}" xuất hiện nguyên văn trong report` });
        }
      }
    }
  }
  return out;
}

function findLeaks({ objects = [], texts = [], problems = [], publicTexts = [] }) {
  const leaks = [];
  objects.forEach((o, i) => structuralLeaks(o, `report[${i}]`, leaks));
  leaks.push(...textLeaks(texts, problems, publicTexts));
  return leaks;
}

module.exports = { findLeaks, structuralLeaks, textLeaks, HIDDEN_ALLOWED_KEYS };
