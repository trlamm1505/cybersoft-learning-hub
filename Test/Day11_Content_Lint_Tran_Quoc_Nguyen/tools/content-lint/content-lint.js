#!/usr/bin/env node
'use strict';
/**
 * content-lint.js
 * ========================================================================
 * NGÀY 11 - Content lint cho bài học
 * Kế hoạch: 03_Ke_hoach_30_ngay_Thuc_tap_sinh_QA_AI_Evaluation.docx
 *
 * CLI kiểm tra cấu trúc bài học (title, learning outcome, prerequisite,
 * terminology, link) trên file JSON hoặc Markdown, áp dụng 20 rule
 * (CT001-CT020, xem rules.js). Đây là công cụ CHỈ ĐỌC - không sửa file
 * input, chỉ in ra report.
 *
 * Cách dùng:
 *   node content-lint.js <file1|dir1> [file2|dir2 ...] [--out-dir DIR]
 *                        [--fail-on error|warning|never]
 *                        [--check-links] [--link-timeout MS]
 *
 * Ví dụ:
 *   node content-lint.js samples/lesson-bad.json
 *   node content-lint.js samples/*.json samples/*.md --out-dir reports
 *   node content-lint.js samples --out-dir reports        (quét cả thư mục)
 *   node content-lint.js samples --check-links            (kiểm tra link sống/chết qua mạng thật)
 *
 * Output console (mỗi dòng 1 finding, ERROR trước WARNING):
 *   ERROR CT001 lesson-bad.json:2 title is missing
 *   WARNING CT014 lesson-bad.json:18 terminology "JS" is inconsistent
 *
 * Truyền 1 THƯ MỤC thay vì file: tool tự quét đệ quy, gom hết file .json/.md
 * bên trong (file định dạng khác trong thư mục bị bỏ qua âm thầm - vì đây là
 * quét tự động, không phải người tự chọn 1 file cụ thể; truyền thẳng 1 file
 * định dạng lạ vẫn báo lỗi rõ ràng như cũ, xem loadFile()).
 *
 * --check-links: BẬT THÊM (mặc định TẮT) bước kiểm tra link sống/chết bằng
 * HTTP request thật (không cần cài package - dùng http/https có sẵn của
 * Node). Tách khỏi 20 rule CT001-CT020 (dùng code riêng CTLINK) vì đây là
 * kiểm tra ĐỘNG (cần mạng), khác bản chất phân tích TĨNH của 20 rule còn lại
 * - xem link-checker.js để biết vì sao lỗi mạng bị phân loại WARNING thay vì
 * ERROR (tránh báo oan khi máy chạy không có kết nối ra ngoài).
 */

const fs = require('fs');
const path = require('path');

const { parseJsonLessonsFile } = require('./parsers/json-lesson-parser');
const { parseMarkdownLessonFile } = require('./parsers/md-lesson-parser');
const { charOffsetToLine } = require('./parsers/text-scan');
const { RULES, isValidUrl, normText } = require('./rules');

function parseArgs(argv) {
  const files = [];
  let outDir = null;
  let failOn = 'error';
  let checkLinks = false;
  let linkTimeout = 5000;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out-dir') {
      outDir = argv[++i];
    } else if (a === '--fail-on') {
      failOn = argv[++i];
    } else if (a === '--check-links') {
      checkLinks = true;
    } else if (a === '--link-timeout') {
      linkTimeout = parseInt(argv[++i], 10);
      if (!Number.isFinite(linkTimeout) || linkTimeout <= 0) {
        throw new Error('--link-timeout phải là số mili-giây > 0');
      }
    } else if (a.startsWith('--')) {
      throw new Error(`Unknown option: ${a}`);
    } else {
      files.push(a);
    }
  }
  return { files, outDir, failOn, checkLinks, linkTimeout };
}

const SUPPORTED_EXTS = new Set(['.json', '.md', '.markdown']);

/** Quét đệ quy 1 thư mục, trả về danh sách file .json/.md (đã sort để output ổn định). */
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

/** Mở rộng danh sách input: nếu là thư mục thì quét đệ quy ra file .json/.md,
 * nếu là file (kể cả định dạng lạ) thì giữ nguyên để loadFile() tự báo lỗi. */
function expandFileArgs(inputs) {
  const out = [];
  for (const p of inputs) {
    let stat;
    try {
      stat = fs.statSync(p);
    } catch (e) {
      out.push(p); // giữ nguyên - để nhánh "file not found" phía sau xử lý như cũ
      continue;
    }
    if (stat.isDirectory()) {
      const found = walkDir(p);
      if (found.length === 0) {
        console.error(`CẢNH BÁO: thư mục "${p}" không có file .json/.md nào để lint.`);
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
  if (ext === '.json') {
    const result = parseJsonLessonsFile(filePath);
    if (!result.ok) {
      let line = 1;
      const m = /position (\d+)/.exec(result.error.message);
      if (m) line = charOffsetToLine(result.raw, parseInt(m[1], 10));
      return {
        ok: false,
        filePath,
        parseError: {
          severity: 'ERROR',
          code: 'CTPARSE',
          file: path.basename(filePath),
          line,
          path: null,
          message: `invalid JSON - ${result.error.message}`,
          fix: 'Sửa lại cú pháp JSON (dùng linter JSON hoặc VSCode để xem lỗi cụ thể).',
        },
      };
    }
    return { ok: true, filePath, lessons: result.lessons };
  }
  if (ext === '.md' || ext === '.markdown') {
    const result = parseMarkdownLessonFile(filePath);
    return { ok: true, filePath, lessons: result.lessons };
  }
  throw new Error(`Không hỗ trợ định dạng file: ${filePath} (chỉ hỗ trợ .json, .md)`);
}

function runLint(files) {
  const perFileParsed = [];
  const parseErrorFindings = [];

  for (const f of files) {
    const parsed = loadFile(f);
    if (!parsed.ok) {
      parseErrorFindings.push(parsed.parseError);
      continue;
    }
    perFileParsed.push(parsed);
  }

  // corpus = tất cả lesson của mọi file parse thành công trong lần chạy này,
  // dùng cho rule cần đối chiếu chéo (vd CT010 - prerequisite reference).
  const corpus = perFileParsed.flatMap((p) => p.lessons);

  const findings = [...parseErrorFindings];
  // Danh sách link http/https hợp lệ về cú pháp (đã qua CT014), thu thập sẵn để
  // --check-links dùng lại (không phải parse lại file) - mỗi phần tử nhớ đúng
  // file/line/path gốc để CTLINK báo trí lỗi chính xác như 20 rule còn lại.
  const linkTargets = [];

  for (const p of perFileParsed) {
    const fileBase = path.basename(p.filePath);
    for (const lesson of p.lessons) {
      for (const ruleDef of RULES) {
        if (!ruleDef.appliesTo.includes(lesson.format)) continue;
        const results = ruleDef.check(lesson, { corpus, filePath: p.filePath }) || [];
        for (const r of results) {
          findings.push({
            severity: ruleDef.severity,
            code: ruleDef.code,
            file: fileBase,
            line: r.line || lesson.loc.startLine,
            path: r.path || lesson.jsonPath,
            message: r.message,
            fix: ruleDef.fix,
          });
        }
      }
      for (const { field, url, line } of lesson.links || []) {
        const u = normText(url);
        if (!u || !isValidUrl(u)) continue; // link rỗng/sai định dạng đã bị CT014/CT015 bắt, không đáng kiểm tra mạng
        let proto = '';
        try { proto = new URL(u).protocol; } catch (e) { /* đã lọc bởi isValidUrl ở trên */ }
        if (proto !== 'http:' && proto !== 'https:') continue; // javascript:/ftp:/data:... đã bị CT016 bắt riêng
        linkTargets.push({
          url: u,
          file: fileBase,
          line: line || lesson.loc.startLine,
          path: `${lesson.jsonPath}.${field}`,
        });
      }
    }
  }

  sortFindings(findings);

  return { findings, lessonsScanned: corpus.length, filesScanned: files.length, linkTargets };
}

function sortFindings(findings) {
  const severityRank = { ERROR: 0, WARNING: 1 };
  findings.sort((a, b) => {
    if (severityRank[a.severity] !== severityRank[b.severity]) {
      return severityRank[a.severity] - severityRank[b.severity];
    }
    if (a.file !== b.file) return a.file.localeCompare(b.file);
    if (a.line !== b.line) return (a.line || 0) - (b.line || 0);
    return a.code.localeCompare(b.code);
  });
  return findings;
}

function toCsv(findings) {
  const header = ['file', 'line', 'path', 'rule', 'severity', 'message', 'fix'];
  const escape = (v) => {
    const s = v === null || v === undefined ? '' : String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const rows = [header.join(',')];
  findings.forEach((f) => {
    rows.push([f.file, f.line, f.path, f.code, f.severity, f.message, f.fix].map(escape).join(','));
  });
  return rows.join('\n');
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 0) {
    console.error('Usage: node content-lint.js <file1|dir1> [file2|dir2 ...] [--out-dir DIR] [--fail-on error|warning|never] [--check-links] [--link-timeout MS]');
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
    console.error('ERROR: không tìm thấy file .json/.md nào để lint (kiểm tra lại đường dẫn/thư mục truyền vào).');
    process.exit(2);
  }

  for (const f of args.files) {
    if (!fs.existsSync(f)) {
      console.error(`ERROR file not found: ${f}`);
      process.exit(2);
    }
  }

  let lintResult;
  try {
    lintResult = runLint(args.files);
  } catch (err) {
    console.error(`ERROR ${err.message}`);
    process.exit(2);
  }
  const { findings, lessonsScanned, filesScanned, linkTargets } = lintResult;

  if (args.checkLinks) {
    const { checkUrls } = require('./link-checker');
    const urls = linkTargets.map((t) => t.url);
    let results = new Map();
    try {
      results = await checkUrls(urls, { timeoutMs: args.linkTimeout });
    } catch (err) {
      console.error(`CẢNH BÁO: --check-links gặp lỗi khi chạy (${err.message}), bỏ qua bước này.`);
    }
    for (const t of linkTargets) {
      const r = results.get(t.url);
      if (!r || r.status === 'ok') continue;
      if (r.status === 'dead') {
        findings.push({
          severity: 'ERROR',
          code: 'CTLINK',
          file: t.file,
          line: t.line,
          path: t.path,
          message: `link trả về lỗi HTTP ${r.httpStatus}: ${t.url}`,
          fix: 'Sửa lại URL hoặc thay bằng link còn hoạt động (tài nguyên có thể đã bị xoá/di chuyển).',
        });
      } else {
        findings.push({
          severity: 'WARNING',
          code: 'CTLINK',
          file: t.file,
          line: t.line,
          path: t.path,
          message: `không thể xác minh link qua mạng (lỗi kết nối/timeout - không chắc link có thật sự chết): ${t.url}`,
          fix: 'Tự mở link bằng tay để xác nhận, hoặc chạy lại --check-links khi có kết nối mạng ổn định.',
        });
      }
    }
    sortFindings(findings);
  }

  findings.forEach((f) => {
    const locPart = f.line ? `${f.file}:${f.line}` : f.file;
    console.log(`${f.severity} ${f.code} ${locPart} ${f.message}`);
  });

  const nError = findings.filter((f) => f.severity === 'ERROR').length;
  const nWarning = findings.filter((f) => f.severity === 'WARNING').length;
  console.log('');
  console.log(`Scanned ${filesScanned} file(s), ${lessonsScanned} lesson(s). ${nError} error(s), ${nWarning} warning(s).`);

  if (args.outDir) {
    fs.mkdirSync(args.outDir, { recursive: true });
    const jsonReport = {
      summary: {
        filesScanned,
        lessonsScanned,
        rulesApplied: RULES.length,
        checkLinks: args.checkLinks,
        errors: nError,
        warnings: nWarning,
      },
      rules: RULES.map((r) => ({ code: r.code, severity: r.severity, group: r.group, description: r.description, fix: r.fix })),
      findings,
    };
    fs.writeFileSync(path.join(args.outDir, 'lint-report.json'), JSON.stringify(jsonReport, null, 2), 'utf8');
    fs.writeFileSync(path.join(args.outDir, 'lint-report.csv'), toCsv(findings), 'utf8');
    console.log(`Đã ghi reports/lint-report.json và reports/lint-report.csv vào ${args.outDir}`);
  }

  if (args.failOn === 'error' && nError > 0) process.exit(1);
  if (args.failOn === 'warning' && (nError > 0 || nWarning > 0)) process.exit(1);
  process.exit(0);
}

main().catch((err) => {
  console.error(`ERROR ${err.message}`);
  process.exit(2);
});
