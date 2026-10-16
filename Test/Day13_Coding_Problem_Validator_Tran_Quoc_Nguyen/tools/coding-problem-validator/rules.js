'use strict';
/**
 * rules.js - 19 rule của coding-problem-validator (CP001-CP019).
 *
 * CP001-CP010 = đúng bộ rule mà kế hoạch Ngày 13 nêu (giữ nguyên số thứ tự để
 * đối chiếu với đề bài). CP011-CP019 là rule bổ sung, rút ra sau khi đọc dữ
 * liệu thật của Code Playground (10 bài base + 20 bài Ngày 14).
 *
 * Dạng rule (giống Ngày 11-12): { code, severity, group, description, fix, check(problem, ctx) }
 *   check() trả về mảng { line?, path?, message } - rỗng nếu bài đạt rule.
 *   ctx = { run, corpus, noRun }
 *     run  : kết quả chấm reference solution trên toàn bộ test (xem runner.judge), hoặc null
 *     noRun: true nếu chạy --no-run (bỏ qua các rule cần chạy code: CP006, CP007-thời gian)
 *
 * NGUYÊN TẮC "KHÔNG LỘ HIDDEN TEST": message của rule TUYỆT ĐỐI không in input /
 * expected của test hidden - chỉ in "Hidden test #k" + nguyên nhân. Có test tự
 * động kiểm điều này (tests/coding-problem-validator.test.js).
 */
const { scanPythonForViolations, normalize } = require('./runner');

const isNonEmptyString = (s) => typeof s === 'string' && s.trim().length > 0;
const lineOf = (p, key) => (p.loc && p.loc[key]) || (p.loc && p.loc.startLine) || 1;

/** Nhãn test AN TOÀN để đưa vào report (visible: #k; hidden: Hidden test #k, không kèm dữ liệu). */
function testLabel(p, idx) {
  let v = 0;
  let h = 0;
  for (let i = 0; i <= idx; i++) (p.testCases[i].isHidden ? h++ : v++);
  return p.testCases[idx].isHidden ? `Hidden test #${String(h).padStart(2, '0')}` : `Sample test #${String(v).padStart(2, '0')}`;
}

const INT_RE = /^-?\d+$/;
function inputLines(input) {
  return String(input == null ? '' : input).replace(/\r\n/g, '\n').split('\n');
}
function intTokens(input) {
  const out = [];
  inputLines(input).forEach((ln) => ln.trim().split(/\s+/).forEach((tok) => { if (INT_RE.test(tok)) out.push(Number(tok)); }));
  return out;
}


const LINE_ORD = { 'đầu': 0, hai: 1, ba: 2, 'bốn': 3 };

/** "Dòng hai là số lượng N" -> { N: 1 }  (biến -> chỉ số dòng input, 0-based). */
function lineMapFromStatement(desc) {
  const map = {};
  const re = /Dòng\s+(đầu|hai|ba|bốn)([^A-ZĐ.]*?)\b([A-Z])\b/g;
  let m;
  while ((m = re.exec(desc)) !== null) map[m[3]] = LINE_ORD[m[1]];
  return map;
}

/** Tên biến gắn với 1 cụm miền giá trị, vd phrase="nguyên dương": "N (nguyên dương)", "C là số nguyên dương", "nguyên dương A và B". */
function domainVars(desc, phrase) {
  const vars = new Set();
  const res = [
    new RegExp(`\\b([A-Z])\\s*\\((?:là )?(?:số )?${phrase}\\)`, 'g'),
    new RegExp(`\\b([A-Z])\\s+là\\s+(?:một\\s+)?(?:số\\s+)?${phrase}`, 'g'),
    new RegExp(`${phrase}\\s+([A-Z])\\b(?:\\s+và\\s+([A-Z])\\b)?`, 'g'),
  ];
  for (const re of res) {
    let m;
    while ((m = re.exec(desc)) !== null) { if (m[1]) vars.add(m[1]); if (m[2]) vars.add(m[2]); }
  }
  return vars;
}

/**
 * Lấy danh sách số nguyên cần kiểm cho 1 miền giá trị ("nguyên dương"/"không âm").
 * Cố ý BẢO THỦ để tránh báo oan (vd đề nói "N nguyên dương" nhưng dòng khác là giá tiền = 0):
 *  - biến đã gắn được với 1 dòng input ("Dòng hai là ... N") -> chỉ kiểm dòng đó;
 *  - không gắn được dòng: chỉ kiểm khi MỌI dòng input đều là số (input thuần số).
 */
function numbersUnderDomain(desc, phrase, lines) {
  if (!new RegExp(phrase, 'i').test(desc)) return [];
  const lineMap = lineMapFromStatement(desc);
  const vars = domainVars(desc, phrase);
  const allNumericInput = lines.filter((l) => l.trim()).every((l) => l.trim().split(/\s+/).every((tok) => INT_RE.test(tok)));
  const toInts = (ln) => (ln || '').trim().split(/\s+/).filter((tok) => INT_RE.test(tok)).map(Number);
  const picked = [];
  if (vars.size === 0) return allNumericInput ? lines.flatMap(toInts) : [];
  for (const v of vars) {
    if (lineMap[v] !== undefined) picked.push(...toInts(lines[lineMap[v]]));
    else if (allNumericInput) picked.push(...lines.flatMap(toInts));
  }
  return picked;
}

const CONSTRAINT_SIGNAL = /≤|≥|<=|>=|10\^|10\*\*|\b1e\d|không quá|tối đa|nhiều nhất|ít nhất|từ\s+\d+\s+đến\s+\d+|trong khoảng|\d\s*(<|≤)/i;

const RULES = [
  // ------------------------------------------------------------------ Statement
  {
    code: 'CP001', severity: 'ERROR', group: 'Statement',
    description: 'Thiếu đề bài (description rỗng hoặc quá ngắn để hiểu yêu cầu).',
    fix: 'Viết mô tả bài: input là gì, output là gì, in ra định dạng nào.',
    check(p) {
      const d = p.description;
      if (!isNonEmptyString(d)) return [{ line: lineOf(p, 'description'), message: 'description trống/thiếu - học viên không biết phải làm gì' }];
      if (d.trim().length < 20) return [{ line: lineOf(p, 'description'), message: `description chỉ có ${d.trim().length} ký tự (<20) - quá ngắn để mô tả input/output` }];
      return [];
    },
  },
  {
    code: 'CP002', severity: 'WARNING', group: 'Statement',
    description: 'Đề bài không nêu ràng buộc (constraints) - khoảng giá trị / kích thước input.',
    fix: 'Thêm ràng buộc số học rõ ràng (vd "1 ≤ N ≤ 10^9", "1 ≤ độ dài ≤ 10^5"). Không có ràng buộc thì không thể chứng minh test hiệu năng là công bằng.',
    check(p) {
      if (!isNonEmptyString(p.description)) return []; // đã có CP001, không báo chồng
      const hasStructured = Array.isArray(p.constraints) && p.constraints.length > 0;
      const text = `${p.description || ''} ${p.constraintsText || ''}`;
      if (hasStructured || isNonEmptyString(p.constraintsText) || CONSTRAINT_SIGNAL.test(text)) return [];
      const domain = /nguyên dương|không âm|chữ cái thường/i.test(text) ? ' (chỉ có miền giá trị như "nguyên dương", chưa có CẬN TRÊN/DƯỚI cụ thể)' : '';
      return [{ line: lineOf(p, 'description'), message: `đề không có ràng buộc số học cụ thể${domain}` }];
    },
  },
  // ------------------------------------------------------------------ Tests
  {
    code: 'CP003', severity: 'ERROR', group: 'Tests',
    description: 'Không có sample test (test không ẩn) - học viên không có ví dụ đối chiếu.',
    fix: 'Thêm ít nhất 1-2 test isHidden=false.',
    check(p) {
      const visible = p.testCases.filter((t) => !t.isHidden);
      return visible.length === 0 ? [{ line: lineOf(p, 'testCases'), message: 'không có test nào isHidden=false' }] : [];
    },
  },
  {
    code: 'CP004', severity: 'ERROR', group: 'Tests',
    description: 'Test thiếu input hoặc expectedOutput (không phải chuỗi).',
    fix: 'Mỗi test phải có input:string và expectedOutput:string (chuỗi rỗng "" hợp lệ nếu cố ý "không in gì").',
    check(p) {
      const out = [];
      p.testCases.forEach((t, i) => {
        if (typeof t.input !== 'string') out.push({ line: t.line, message: `${testLabel(p, i)}: thiếu/sai kiểu "input"` });
        if (typeof t.expectedOutput !== 'string') out.push({ line: t.line, message: `${testLabel(p, i)}: thiếu/sai kiểu "expectedOutput"` });
      });
      return out;
    },
  },
  // ------------------------------------------------------------------ Reference
  {
    code: 'CP005', severity: 'ERROR', group: 'Reference',
    description: 'Không có reference solution (solutionCode).',
    fix: 'Thêm solutionCode chuẩn - không có nó thì không kiểm được test và không làm được mutation testing.',
    check(p) {
      return isNonEmptyString(p.solutionCode) ? [] : [{ line: lineOf(p, 'solutionCode'), message: 'solutionCode trống/thiếu' }];
    },
  },
  {
    code: 'CP006', severity: 'ERROR', group: 'Reference',
    description: 'Reference solution KHÔNG đạt AC trên chính bộ test của bài (baseline không đáng tin).',
    fix: 'Sửa solutionCode hoặc sửa test cho khớp. DỪNG mutation testing cho tới khi reference = AC.',
    check(p, ctx) {
      if (ctx.noRun || !ctx.run || !isNonEmptyString(p.solutionCode)) return [];
      const r = ctx.run;
      if (r.status === 'AC') return [];
      if (r.status === 'CE') return [{ line: lineOf(p, 'solutionCode'), message: `reference bị CE (lỗi cú pháp): ${r.compileError}` }];
      const failing = r.results.filter((x) => !x.passed);
      const parts = failing.map((x) => {
        const label = x.isHidden ? `Hidden test #${String(x.hiddenIndex).padStart(2, '0')}` : `Sample test #${x.index + 1}`;
        return `${label}=${x.kind}`; // chỉ kind, KHÔNG in expected/actual của hidden
      });
      return [{ line: lineOf(p, 'solutionCode'), message: `reference status=${r.status}, ${r.passedCount}/${r.totalCount} test pass (fail: ${parts.join(', ')})` }];
    },
  },
  {
    code: 'CP007', severity: 'ERROR', group: 'Timeout',
    description: 'timeLimitMs không hợp lệ (thiếu, không phải số, ≤0) hoặc cấu hình bất hợp lý (quá lớn / quá sát thời gian chạy thật của reference).',
    fix: 'Đặt timeLimitMs trong khoảng 500-10000 ms và lớn hơn ~2x thời gian chạy thật của reference.',
    check(p, ctx) {
      const t = p.timeLimitMs;
      const out = [];
      if (typeof t !== 'number' || !Number.isFinite(t) || t <= 0) {
        return [{ line: lineOf(p, 'timeLimitMs'), message: `timeLimitMs=${JSON.stringify(t)} không hợp lệ (cần số > 0)` }];
      }
      if (t > 10000) out.push({ line: lineOf(p, 'timeLimitMs'), message: `timeLimitMs=${t}ms quá lớn (>10000) - thuật toán chậm vẫn sẽ AC` });
      if (t < 500) out.push({ line: lineOf(p, 'timeLimitMs'), message: `timeLimitMs=${t}ms quá nhỏ (<500) - dễ TLE oan chỉ vì Python khởi động chậm` });
      if (!ctx.noRun && ctx.run && ctx.run.maxTimeMs > t * 0.5) {
        out.push({ line: lineOf(p, 'timeLimitMs'), message: `reference chạy tới ${ctx.run.maxTimeMs}ms so với limit ${t}ms (>50%) - dễ flaky` });
      }
      return out;
    },
  },
  // ------------------------------------------------------------------ Output format
  {
    code: 'CP008', severity: 'ERROR', group: 'Output format',
    description: 'Định dạng expectedOutput mâu thuẫn với đề: có nhãn thừa ("Result: 10"), sai tập giá trị được đề liệt kê ("YES"/"NO"), hoặc nhiều dòng khi đề bảo "trên một dòng".',
    fix: 'Sửa expectedOutput đúng như đề yêu cầu, hoặc sửa đề cho khớp expectedOutput.',
    check(p) {
      const out = [];
      const desc = p.description || '';
      // (a) nhãn thừa kiểu "Result = 10"
      const withOutput = p.testCases.map((t, i) => ({ t, i })).filter(({ t }) => typeof t.expectedOutput === 'string'); // thiếu expected: CP004 lo
      withOutput.forEach(({ t, i }) => {
        const e = normalize(t.expectedOutput);
        const m = /^(result|kết quả|ket qua|answer|output|đáp án)\s*[:=]/i.exec(e);
        if (m && !new RegExp(m[1], 'i').test(desc)) out.push({ line: t.line, message: `${testLabel(p, i)}: expectedOutput bắt đầu bằng nhãn "${m[1]}" mà đề không yêu cầu` });
      });
      // (b) tập giá trị cố định đề liệt kê trong dấu ngoặc kép, vd "YES"/"NO"
      const quoted = [...desc.matchAll(/"([^"]+)"/g)].map((m) => m[1]).filter((s) => /^[^\s<>]+$/.test(s));
      if (quoted.length >= 2) {
        const idxIn = [];
        const idxOut = [];
        // expected có thể nhiều dòng (mỗi dòng 1 kết quả) - đạt nếu MỌI dòng đều thuộc tập.
        const allLinesInSet = (e) => normalize(e).split('\n').every((ln) => quoted.includes(ln.trim()));
        withOutput.forEach(({ t, i }) => (allLinesInSet(t.expectedOutput) ? idxIn : idxOut).push(i));
        if (idxIn.length > 0 && idxOut.length > 0) {
          idxOut.forEach((i) => out.push({ line: p.testCases[i].line, message: `${testLabel(p, i)}: expectedOutput không thuộc tập giá trị đề nêu (${quoted.map((q) => `"${q}"`).join(' / ')})` }));
        }
      }
      // (c) đề nói "trên một dòng" nhưng expected nhiều dòng
      // (bỏ qua câu có "mỗi/từng" - "mỗi kết quả trên một dòng" nghĩa là NHIỀU dòng)
      const oneLineSentence = desc.split('.').some((sn) => /trên một dòng|trên 1 dòng|trên cùng một dòng/i.test(sn) && !/mỗi|từng/i.test(sn));
      if (oneLineSentence) {
        withOutput.forEach(({ t, i }) => {
          if (normalize(t.expectedOutput).includes('\n')) out.push({ line: t.line, message: `${testLabel(p, i)}: đề yêu cầu "trên một dòng" nhưng expectedOutput có nhiều dòng` });
        });
      }
      return out;
    },
  },
  {
    code: 'CP009', severity: 'ERROR', group: 'Tests',
    description: 'Không có hidden test - không chống được code hard-code theo sample.',
    fix: 'Thêm ít nhất 2 test isHidden=true, phủ edge case mà sample không có.',
    check(p) {
      return p.testCases.some((t) => t.isHidden) ? [] : [{ line: lineOf(p, 'testCases'), message: 'không có test nào isHidden=true' }];
    },
  },
  // ------------------------------------------------------------------ Consistency
  {
    code: 'CP010', severity: 'ERROR', group: 'Consistency',
    description: 'Test không nhất quán với đề/constraints: input ngoài miền đề nêu ("nguyên dương", "không âm", "chữ cái thường", constraints khai báo) hoặc số phần tử/dòng không khớp N.',
    fix: 'Sửa test cho nằm trong miền của đề, hoặc sửa đề/constraints cho khớp test.',
    check(p) {
      const out = [];
      const desc = `${p.description || ''} ${p.constraintsText || ''}`;
      const lowerOnly = /chữ cái thường/i.test(desc);
      const countN = /Dòng đầu là (số lượng phần tử )?N|số nguyên N \(kích thước/i.test(desc);
      const isMatrix = /N x N|N dòng tiếp theo/i.test(desc);

      p.testCases.forEach((t, i) => {
        const label = testLabel(p, i);
        const lines = inputLines(t.input);
        if (numbersUnderDomain(desc, 'nguyên dương', lines).some((n) => n <= 0)) out.push({ line: t.line, message: `${label}: đề nói "nguyên dương" nhưng input có giá trị ≤ 0` });
        if (numbersUnderDomain(desc, 'không âm', lines).some((n) => n < 0)) out.push({ line: t.line, message: `${label}: đề nói "không âm" nhưng input có giá trị < 0` });
        if (lowerOnly && !lines.filter((l) => l.length).every((l) => /^[a-z]+$/.test(l.trim()))) out.push({ line: t.line, message: `${label}: đề nói "chỉ gồm chữ cái thường" nhưng input có ký tự khác` });

        // constraints khai báo: [{name, line, min, max, all}]
        (Array.isArray(p.constraints) ? p.constraints : []).forEach((c) => {
          const raw = (lines[c.line] || '').trim();
          const toks = raw ? raw.split(/\s+/).filter((x) => INT_RE.test(x)).map(Number) : [];
          const checkToks = c.all ? toks : toks.slice(0, 1);
          checkToks.forEach((v) => {
            if ((c.min !== undefined && v < c.min) || (c.max !== undefined && v > c.max)) {
              out.push({ line: t.line, message: `${label}: giá trị của ${c.name} nằm ngoài constraints khai báo [${c.min ?? '-∞'}, ${c.max ?? '+∞'}]` });
            }
          });
        });

        if (countN && INT_RE.test((lines[0] || '').trim())) {
          const n = Number(lines[0].trim());
          if (isMatrix) {
            const rows = lines.slice(1).filter((l) => l.trim().length);
            if (rows.length !== n) out.push({ line: t.line, message: `${label}: N=${n} nhưng có ${rows.length} dòng dữ liệu` });
            else if (rows.some((r) => r.trim().split(/\s+/).length !== n)) out.push({ line: t.line, message: `${label}: có dòng không đủ N=${n} phần tử` });
          } else if (/N số nguyên|gồm N/i.test(desc)) {
            const cnt = (lines[1] || '').trim() ? lines[1].trim().split(/\s+/).length : 0;
            if (cnt !== n) out.push({ line: t.line, message: `${label}: N=${n} nhưng dòng dữ liệu có ${cnt} phần tử` });
          }
        }
      });
      return out;
    },
  },
  {
    code: 'CP011', severity: 'WARNING', group: 'Tests',
    description: 'Hai test có cùng input (trùng lặp, tốn slot mà không thêm độ phủ).',
    fix: 'Xóa test trùng hoặc thay bằng input khác loại (edge case).',
    check(p) {
      const seen = new Map();
      const out = [];
      p.testCases.forEach((t, i) => {
        const key = `${t.isHidden ? 'H' : 'S'}|${normalize(t.input)}`; // sample-vs-hidden trùng nhau thuộc CP012
        if (seen.has(key)) out.push({ line: t.line, message: `${testLabel(p, i)} trùng input với ${testLabel(p, seen.get(key))}` });
        else seen.set(key, i);
      });
      return out;
    },
  },
  {
    code: 'CP012', severity: 'WARNING', group: 'Tests',
    description: 'Hidden test trùng input với sample test (không làm tăng độ phủ, chỉ làm học viên tưởng đã thử hết).',
    fix: 'Thay hidden test bằng input mới chưa có trong sample.',
    check(p) {
      const visible = new Set(p.testCases.filter((t) => !t.isHidden).map((t) => normalize(t.input)));
      const out = [];
      p.testCases.forEach((t, i) => {
        if (t.isHidden && visible.has(normalize(t.input))) out.push({ line: t.line, message: `${testLabel(p, i)} có input trùng một sample test` });
      });
      return out;
    },
  },
  {
    code: 'CP013', severity: 'WARNING', group: 'Tests',
    description: 'Bộ test quá mỏng: tổng < 4 test hoặc hidden < 2.',
    fix: 'Bổ sung test biên (giá trị nhỏ nhất/lớn nhất, rỗng/1 phần tử, trùng lặp, số âm...).',
    check(p) {
      const total = p.testCases.length;
      const hidden = p.testCases.filter((t) => t.isHidden).length;
      if (total >= 4 && hidden >= 2) return [];
      return [{ line: lineOf(p, 'testCases'), message: `chỉ có ${total} test (${hidden} hidden) - ngưỡng tối thiểu là 4 test, 2 hidden` }];
    },
  },
  {
    code: 'CP014', severity: 'ERROR', group: 'Reference',
    description: 'starterCode đã chứa sẵn lời giải (lộ đáp án cho học viên).',
    fix: 'Chỉ để phần khung (đọc input, def rỗng) + comment gợi ý trong starterCode; bỏ phần logic giải.',
    check(p) {
      if (!isNonEmptyString(p.starterCode) || !isNonEmptyString(p.solutionCode)) return [];
      if (normalize(p.starterCode) === normalize(p.solutionCode)) return [{ line: lineOf(p, 'starterCode'), message: 'starterCode giống hệt solutionCode' }];
      // Starter hợp lệ có thể chứa sẵn phần "khung" (def hàm rỗng, đọc input, dòng in gọi hàm của học viên).
      // Chỉ coi là LỘ ĐÁP ÁN khi starter đã chứa gần hết (>=90%) các dòng lệnh của lời giải.
      const norm = (src) => src.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
      const starter = new Set(norm(p.starterCode));
      const sol = norm(p.solutionCode);
      const shared = sol.filter((l) => starter.has(l)).length;
      const ratio = sol.length ? shared / sol.length : 0;
      return sol.length >= 3 && ratio >= 0.9 ? [{ line: lineOf(p, 'starterCode'), message: `starterCode đã chứa ${Math.round(ratio * 100)}% số dòng lệnh của lời giải (${shared}/${sol.length})` }] : [];
    },
  },
  {
    code: 'CP015', severity: 'ERROR', group: 'Reference',
    description: 'Reference solution vi phạm sandbox guard của judge (import os/sys..., gọi open/eval/exec...) => judge thật sẽ chặn chính lời giải chuẩn.',
    fix: 'Viết lại reference không dùng module/hàm bị chặn (xem BE/src/common/helper/python-guard.helper.ts).',
    check(p) {
      if (!isNonEmptyString(p.solutionCode)) return [];
      return scanPythonForViolations(p.solutionCode).map((v) => ({ line: lineOf(p, 'solutionCode'), message: `reference bị guard chặn - ${v.reason} (dòng ${v.line} trong solutionCode)` }));
    },
  },
  {
    code: 'CP016', severity: 'WARNING', group: 'Hidden leak',
    description: 'Dữ liệu của hidden test xuất hiện nguyên văn trong đề bài hoặc starterCode (học viên hard-code được).',
    fix: 'Đưa giá trị đó thành sample test (không ẩn) hoặc đổi hidden test sang giá trị khác.',
    check(p) {
      const visible = new Set();
      p.testCases.filter((t) => !t.isHidden).forEach((t) => { visible.add(normalize(t.input)); visible.add(normalize(t.expectedOutput)); });
      const haystack = `${p.description || ''}\n${p.starterCode || ''}`;
      const out = [];
      p.testCases.forEach((t, i) => {
        if (!t.isHidden) return;
        for (const [field, v] of [['input', normalize(t.input)], ['expectedOutput', normalize(t.expectedOutput)]]) {
          if (v.length >= 4 && !visible.has(v) && haystack.includes(v)) {
            // KHÔNG in giá trị v ra report
            out.push({ line: t.line, message: `${testLabel(p, i)}: giá trị "${field}" (${v.length} ký tự) xuất hiện nguyên văn trong đề/starterCode` });
          }
        }
      });
      return out;
    },
  },
  {
    code: 'CP017', severity: 'ERROR', group: 'Metadata',
    description: 'Thiếu/trùng ID (slug) hoặc thiếu title của bài.',
    fix: 'Mỗi bài cần slug duy nhất (chữ thường, số, dấu gạch ngang) và title không rỗng.',
    check(p, ctx) {
      const out = [];
      if (!isNonEmptyString(p.slug)) out.push({ line: lineOf(p, 'slug'), message: 'thiếu slug (Problem ID)' });
      else {
        if (!/^[a-z0-9-]+$/.test(p.slug)) out.push({ line: lineOf(p, 'slug'), message: `slug "${p.slug}" chứa ký tự không hợp lệ` });
        const dup = ctx.corpus.filter((q) => q.slug === p.slug);
        if (dup.length > 1) out.push({ line: lineOf(p, 'slug'), message: `slug "${p.slug}" bị trùng ${dup.length} lần trong bộ bài` });
      }
      if (!isNonEmptyString(p.title)) out.push({ line: lineOf(p, 'title'), message: 'thiếu title' });
      return out;
    },
  },
  {
    code: 'CP018', severity: 'WARNING', group: 'Output format',
    description: 'expectedOutput có khoảng trắng/xuống dòng thừa ở đầu-cuối hoặc CRLF. Judge thật trim nên vẫn chấm được, nhưng nếu đổi sang so sánh chính xác sẽ fail hàng loạt.',
    fix: 'Lưu expectedOutput đã trim, dùng "\\n" (không "\\r\\n").',
    check(p) {
      const out = [];
      p.testCases.forEach((t, i) => {
        const e = t.expectedOutput;
        if (typeof e !== 'string') return;
        if (e.includes('\r')) out.push({ line: t.line, message: `${testLabel(p, i)}: expectedOutput chứa ký tự \\r` });
        else if (e !== e.trim()) out.push({ line: t.line, message: `${testLabel(p, i)}: expectedOutput có khoảng trắng/xuống dòng thừa ở đầu hoặc cuối` });
      });
      return out;
    },
  },
  {
    code: 'CP019', severity: 'ERROR', group: 'Output format',
    description: 'expectedOutput dài hơn giới hạn 64KB stdout của judge (MAX_OUTPUT_BYTES trong code-runner.helper.ts). Judge cắt stdout ở 64KB nên ngay cả lời giải ĐÚNG cũng bị chấm WA.',
    fix: 'Rút ngắn test (giảm N / giá trị) để output < 64KB, hoặc nâng MAX_OUTPUT_BYTES trong BE nếu bài thật sự cần output lớn.',
    check(p) {
      const LIMIT = 64 * 1024;
      const out = [];
      p.testCases.forEach((t, i) => {
        if (typeof t.expectedOutput !== 'string') return;
        const bytes = Buffer.byteLength(t.expectedOutput, 'utf8');
        if (bytes > LIMIT) out.push({ line: t.line, message: `${testLabel(p, i)}: expectedOutput dài ${bytes} byte (> 65536) - judge cắt stdout nên không lời giải nào đạt AC` });
      });
      return out;
    },
  },
];

module.exports = { RULES, testLabel };
