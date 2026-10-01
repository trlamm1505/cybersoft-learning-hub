#!/usr/bin/env node
'use strict';
/**
 * quiz-validator.js
 * ========================================================================
 * NGÀY 12 - Validator đề trắc nghiệm
 * Kế hoạch: 03_Ke_hoach_30_ngay_Thuc_tap_sinh_QA_AI_Evaluation.docx, Tuần 3.
 *
 * CLI kiểm tra chất lượng câu hỏi trắc nghiệm (JSON): số đáp án, trùng lặp,
 * rỗng, answer key, ambiguity flag, content quality, và pattern đáp án lệch
 * trong cả file - áp dụng 23 rule (QV001-QV023, xem rules.js). Công cụ CHỈ
 * ĐỌC - không sửa file input, chỉ in ra report.
 *
 * Cách dùng:
 *   node quiz-validator.js <file1|dir1> [file2|dir2 ...] [--out-dir DIR]
 *                          [--fail-on error|warning|never]
 *
 * Ví dụ:
 *   node quiz-validator.js samples/quiz-bad.json
 *   node quiz-validator.js samples/quiz-good.json samples/quiz-bad.json --out-dir reports
 *   node quiz-validator.js fixtures --out-dir reports/fixtures-run   (quét cả thư mục)
 *
 * Output console (mỗi dòng 1 finding, ERROR trước WARNING):
 *   ERROR QV002 quiz-bad.json:12 only 1 option(s) found - a question needs at least 2
 *   WARNING QV017 quiz-bad.json correct answer sits at option position 0 in ...
 *
 * Truyền 1 THƯ MỤC thay vì file: tool tự quét đệ quy, gom hết file .json bên
 * trong (file định dạng khác bị bỏ qua âm thầm vì đây là quét tự động;
 * truyền thẳng 1 file định dạng lạ vẫn báo lỗi rõ ràng, xem loadFile()).
 *
 * QV017/QV018 là 2 rule CẤP FILE (xét toàn bộ câu hỏi trong 1 file, không
 * phải từng câu riêng lẻ) - finding của chúng có "line: null" khi không thể
 * quy về 1 dòng cụ thể (QV017) hoặc trỏ tới dòng câu hỏi ĐẦU TIÊN của chuỗi
 * lặp (QV018).
 */

const fs = require('fs');
const path = require('path');

const { parseJsonQuizFile } = require('./parsers/quiz-parser');
const { charOffsetToLine } = require('./parsers/text-scan');
const { RULES, FILE_LEVEL_RULES } = require('./rules');

function parseArgs(argv) {
  const files = [];
  let outDir = null;
  let failOn = 'error';
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out-dir') {
      outDir = argv[++i];
    } else if (a === '--fail-on') {
      failOn = argv[++i];
    } else if (a.startsWith('--')) {
      throw new Error(`Unknown option: ${a}`);
    } else {
      files.push(a);
    }
  }
  return { files, outDir, failOn };
}

const SUPPORTED_EXTS = new Set(['.json']);

/** Quét đệ quy 1 thư mục, trả về danh sách file .json (đã sort để output ổn định). */
function walkDir(dir) {
  const found = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true })
    .filter((e) => !e.name.startsWith('.'))
    .sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...walkDir(full));
    } else if (entry.isFile() && SUPPORTED_EXTS.has(path.extname(entry.name).toLowerCase())) {
      found.push(full);
    }
  }
  return found;
}

function expandFileArgs(inputs) {
  const out = [];
  for (const p of inputs) {
    let stat;
    try {
      stat = fs.statSync(p);
    } catch (e) {
      out.push(p); // giữ nguyên - nhánh "file not found" phía sau xử lý
      continue;
    }
    if (stat.isDirectory()) {
      const found = walkDir(p);
      if (found.length === 0) {
        console.error(`CẢNH BÁO: thư mục "${p}" không có file .json nào để kiểm tra.`);
      }
      out.push(...found);
    } else {
      out.push(p);
    }
  }
  return out;
}

function loadFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext !== '.json') {
    throw new Error(`Không hỗ trợ định dạng file: ${filePath} (chỉ hỗ trợ .json)`);
  }
  const result = parseJsonQuizFile(filePath);
  if (!result.ok) {
    let line = 1;
    const m = /position (\d+)/.exec(result.error.message);
    if (m) line = charOffsetToLine(result.raw, parseInt(m[1], 10));
    return {
      ok: false,
      filePath,
      parseError: {
        severity: 'ERROR',
        code: 'QVPARSE',
        file: path.basename(filePath),
        questionId: `${path.basename(filePath)}#(parse error)`,
        line,
        path: null,
        message: `invalid JSON - ${result.error.message}`,
        fix: 'Sửa lại cú pháp JSON (dùng linter JSON hoặc VSCode để xem lỗi cụ thể).',
        humanVerification: '',
        falsePositive: '',
        finalResult: '',
      },
    };
  }
  return { ok: true, filePath, questions: result.questions };
}

function sortFindings(findings) {
  const severityRank = { ERROR: 0, WARNING: 1 };
  findings.sort((a, b) => {
    if (severityRank[a.severity] !== severityRank[b.severity]) {
      return severityRank[a.severity] - severityRank[b.severity];
    }
    if (a.file !== b.file) return a.file.localeCompare(b.file);
    const la = a.line || 0;
    const lb = b.line || 0;
    if (la !== lb) return la - lb;
    return a.code.localeCompare(b.code);
  });
  return findings;
}

function runValidate(files) {
  const perFileParsed = [];
  const parseErrorFindings = [];

  for (const f of files) {
    const parsed = loadFile(f);
    if (!parsed.ok) {
      parseErrorFindings.push(parsed.parseError);
      continue;
    }
    const fileBase = path.basename(f);
    parsed.questions.forEach((q) => { q.__file = fileBase; });
    perFileParsed.push(parsed);
  }

  // corpus = tất cả câu hỏi của MỌI file parse thành công trong lần chạy này,
  // dùng cho rule cần đối chiếu chéo (QV006 - trùng câu hỏi).
  const corpus = perFileParsed.flatMap((p) => p.questions);

  const findings = [...parseErrorFindings];

  for (const p of perFileParsed) {
    const fileBase = path.basename(p.filePath);

    // 21 rule cấp CÂU HỎI (QV001-QV016, QV019-QV023)
    for (const q of p.questions) {
      // "File/Question ID" trong Quality Report = <tên file>#<index câu hỏi,
      // 1-based> - đủ để tra ngược đúng câu hỏi nào trong file nào, không cần
      // câu hỏi có field "id" riêng (schema thật không có field này).
      const questionId = `${fileBase}#Q${q.index + 1}`;
      for (const ruleDef of RULES) {
        const results = ruleDef.check(q, { corpus, filePath: p.filePath }) || [];
        for (const r of results) {
          findings.push({
            severity: ruleDef.severity,
            code: ruleDef.code,
            file: fileBase,
            questionId,
            line: r.line || q.loc.startLine,
            path: r.path || q.jsonPath,
            message: r.message,
            fix: ruleDef.fix,
            // 3 cột dưới đây CỐ Ý để trống - tool KHÔNG tự phán quyết, con
            // người điền tay sau khi xem lại từng finding (điều kiện nghiệm
            // thu "không dùng AI/tool làm nguồn phán quyết duy nhất").
            humanVerification: '',
            falsePositive: '',
            finalResult: '',
          });
        }
      }
    }

    // 2 rule cấp FILE (QV017/QV018 - pattern đáp án lệch)
    for (const ruleDef of FILE_LEVEL_RULES) {
      const results = ruleDef.check(p.questions, { corpus, filePath: p.filePath }) || [];
      for (const r of results) {
        findings.push({
          severity: ruleDef.severity,
          code: ruleDef.code,
          file: fileBase,
          questionId: `${fileBase}#(toàn file)`,
          line: r.line,
          path: r.path || '$',
          message: r.message,
          fix: ruleDef.fix,
          humanVerification: '',
          falsePositive: '',
          finalResult: '',
        });
      }
    }
  }

  sortFindings(findings);

  return { findings, questionsScanned: corpus.length, filesScanned: files.length };
}

function toCsv(findings) {
  // Cột khớp với "Quality Report" mở rộng theo hướng dẫn v2: Rule ID,
  // Severity, File/Question ID, Path, Message, Suggested Fix, rồi 3 cột
  // CỐ Ý để trống do tool điền (Human Verification, False Positive?, Final
  // Result) - con người mở CSV/Excel này điền tay sau khi xem lại từng dòng.
  const header = ['ruleId', 'severity', 'file', 'questionId', 'line', 'path', 'message', 'suggestedFix', 'humanVerification', 'falsePositive', 'finalResult'];
  const escape = (v) => {
    const s = v === null || v === undefined ? '' : String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const rows = [header.join(',')];
  findings.forEach((f) => {
    rows.push([f.code, f.severity, f.file, f.questionId, f.line, f.path, f.message, f.fix, f.humanVerification, f.falsePositive, f.finalResult].map(escape).join(','));
  });
  return rows.join('\n');
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 0) {
    console.error('Usage: node quiz-validator.js <file1|dir1> [file2|dir2 ...] [--out-dir DIR] [--fail-on error|warning|never]');
    process.exit(2);
  }

  let args;
  try {
    args = parseArgs(argv);
  } catch (err) {
    console.error(`ERROR ${err.message}`);
    process.exit(2);
  }

  args.files = expandFileArgs(args.files);
  if (args.files.length === 0) {
    console.error('ERROR: không tìm thấy file .json nào để kiểm tra (kiểm tra lại đường dẫn/thư mục truyền vào).');
    process.exit(2);
  }

  for (const f of args.files) {
    if (!fs.existsSync(f)) {
      console.error(`ERROR file not found: ${f}`);
      process.exit(2);
    }
  }

  let result;
  try {
    result = runValidate(args.files);
  } catch (err) {
    console.error(`ERROR ${err.message}`);
    process.exit(2);
  }
  const { findings, questionsScanned, filesScanned } = result;

  findings.forEach((f) => {
    const locPart = f.line ? `${f.file}:${f.line}` : f.file;
    console.log(`${f.severity} ${f.code} ${locPart} ${f.message}`);
  });

  const nError = findings.filter((f) => f.severity === 'ERROR').length;
  const nWarning = findings.filter((f) => f.severity === 'WARNING').length;
  console.log('');
  console.log(`Scanned ${filesScanned} file(s), ${questionsScanned} question(s). ${nError} error(s), ${nWarning} warning(s).`);

  if (args.outDir) {
    fs.mkdirSync(args.outDir, { recursive: true });
    const jsonReport = {
      summary: {
        filesScanned,
        questionsScanned,
        rulesApplied: RULES.length + FILE_LEVEL_RULES.length,
        errors: nError,
        warnings: nWarning,
      },
      rules: [...RULES, ...FILE_LEVEL_RULES].map((r) => ({ code: r.code, severity: r.severity, group: r.group, description: r.description, fix: r.fix })),
      findings,
    };
    fs.writeFileSync(path.join(args.outDir, 'quality-report.json'), JSON.stringify(jsonReport, null, 2), 'utf8');
    fs.writeFileSync(path.join(args.outDir, 'quality-report.csv'), toCsv(findings), 'utf8');
    console.log(`Đã ghi quality-report.json và quality-report.csv vào ${args.outDir}`);
  }

  if (args.failOn === 'error' && nError > 0) process.exit(1);
  if (args.failOn === 'warning' && (nError > 0 || nWarning > 0)) process.exit(1);
  process.exit(0);
}

main();
