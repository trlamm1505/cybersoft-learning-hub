#!/usr/bin/env node
'use strict';
/**
 * coding-problem-validator.js
 * ========================================================================
 * NGÀY 13 - Validator bài coding và test case
 * Kế hoạch: 03_Ke_hoach_30_ngay_Thuc_tap_sinh_QA_AI_Evaluation.docx, Tuần 3.
 *
 * 3 lệnh con (CLI Node thuần, không cài package; cần Python 3 trong PATH):
 *
 *   validate  - kiểm 19 rule (CP001-CP019) trên file/thư mục bài coding + CHẠY reference
 *               solution qua judge mini (CP006/CP007).
 *   mutate    - mutation testing 1 bài: chạy từng mutant qua sample + hidden test,
 *               tính Mutation Score, in coverage report.
 *   probe-leak- kiểm xem stderr có thể làm lộ input của hidden test không (mô phỏng
 *               cách BE judge-queue.service.ts lưu kết quả). Chỉ in số đếm, KHÔNG in dữ liệu.
 *
 * Ví dụ:
 *   node coding-problem-validator.js validate problems --out-dir reports/validate-baseline
 *   node coding-problem-validator.js validate problems --overlay problems-hardened/overrides.json --out-dir reports/validate-hardened
 *   node coding-problem-validator.js mutate problems/base-exercises.json --slug kiem-tra-so-nguyen-to \
 *        --mutants mutants/kiem-tra-so-nguyen-to.json --mutants-out solutions/mutants/kiem-tra-so-nguyen-to --out-dir reports/mutation-prime-baseline
 *   node coding-problem-validator.js mutate problems/base-exercises.json --slug kiem-tra-so-nguyen-to \
 *        --mutants mutants/kiem-tra-so-nguyen-to.json --overlay problems-hardened/overrides.json --out-dir reports/mutation-prime-hardened
 *
 * Exit code: 0 ok | 1 có finding vượt ngưỡng --fail-on (validate) hoặc score < threshold (mutate)
 *            2 sai cách dùng | 3 reference KHÔNG AC (mutate dừng) | 4 phát hiện lộ hidden test trong report
 */
const fs = require('fs');
const path = require('path');

const { loadProblemFile, applyOverlay } = require('./parsers/problem-loader');
const { RULES } = require('./rules');
const { judge, runOnce, resolvePythonBin } = require('./runner');
const { runMutation, summarize, toCsv: mutationCsv, coverageMarkdown } = require('./mutation');
const { findLeaks } = require('./leak-guard');

function parseArgs(argv) {
  const a = { cmd: argv[0], inputs: [], outDir: null, failOn: 'error', noRun: false, python: null, overlay: null, slug: null, mutants: null, mutantsOut: null, threshold: 80, only: null };
  for (let i = 1; i < argv.length; i++) {
    const x = argv[i];
    if (x === '--out-dir') a.outDir = argv[++i];
    else if (x === '--fail-on') a.failOn = argv[++i];
    else if (x === '--no-run') a.noRun = true;
    else if (x === '--python') a.python = argv[++i];
    else if (x === '--overlay') a.overlay = argv[++i];
    else if (x === '--slug') a.slug = argv[++i];
    else if (x === '--mutants') a.mutants = argv[++i];
    else if (x === '--mutants-out') a.mutantsOut = argv[++i];
    else if (x === '--threshold') a.threshold = Number(argv[++i]);
    else if (x === '--only') a.only = argv[++i].split(',');
    else if (x.startsWith('--')) throw new Error(`Unknown option: ${x}`);
    else a.inputs.push(x);
  }
  return a;
}

function walkJson(dir) {
  const found = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true }).filter((e) => !e.name.startsWith('.')).sort((a, b) => a.name.localeCompare(b.name))) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) found.push(...walkJson(full));
    else if (e.isFile() && e.name.toLowerCase().endsWith('.json')) found.push(full);
  }
  return found;
}

function expandInputs(inputs) {
  const out = [];
  for (const p of inputs) {
    if (!fs.existsSync(p)) throw new Error(`file not found: ${p}`);
    if (fs.statSync(p).isDirectory()) out.push(...walkJson(p));
    else out.push(p);
  }
  return out;
}

function loadAll(files, overlay) {
  const problems = [];
  const parseErrors = [];
  for (const f of files) {
    const r = loadProblemFile(f);
    if (!r.ok) {
      parseErrors.push({ severity: 'ERROR', code: 'CPPARSE', file: path.basename(f), problemId: `${path.basename(f)}#(parse error)`, line: r.line, message: `JSON không hợp lệ - ${r.error}`, fix: 'Sửa cú pháp JSON.', humanVerification: '', falsePositive: '', finalResult: '' });
      continue;
    }
    problems.push(...r.problems);
  }
  if (overlay) applyOverlay(problems, overlay);
  return { problems, parseErrors };
}

function csvEscape(v) {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// ---------------------------------------------------------------------------------
// validate
// ---------------------------------------------------------------------------------
function cmdValidate(a) {
  const files = expandInputs(a.inputs);
  if (files.length === 0) throw new Error('không tìm thấy file .json nào');
  let { problems, parseErrors } = loadAll(files, a.overlay);
  if (a.only) problems = problems.filter((p) => a.only.includes(p.slug));
  const opts = { python: a.python };

  const findings = [...parseErrors];
  const referenceRuns = [];
  for (const p of problems) {
    let run = null;
    if (!a.noRun && typeof p.solutionCode === 'string' && p.solutionCode.trim() && Array.isArray(p.testCases) && p.timeLimitMs > 0) {
      run = judge(p.solutionCode, p.testCases, p.timeLimitMs, opts);
      referenceRuns.push({ problemId: p.slug, file: p.__file, suite: p.suite || 'baseline', status: run.status, passed: run.passedCount, total: run.totalCount, hiddenPassed: run.hiddenPassed, hiddenTotal: run.hiddenTotal, maxTimeMs: run.maxTimeMs });
    }
    const ctx = { run, corpus: problems, noRun: a.noRun };
    for (const rule of RULES) {
      for (const r of rule.check(p, ctx) || []) {
        findings.push({ severity: rule.severity, code: rule.code, file: p.__file, problemId: p.slug || `${p.__file}#${p.__index + 1}`, line: r.line || p.loc.startLine, message: r.message, fix: rule.fix, humanVerification: '', falsePositive: '', finalResult: '' });
      }
    }
  }

  const rank = { ERROR: 0, WARNING: 1 };
  findings.sort((x, y) => rank[x.severity] - rank[y.severity] || x.file.localeCompare(y.file) || (x.line || 0) - (y.line || 0) || x.code.localeCompare(y.code));

  findings.forEach((f) => console.log(`${f.severity} ${f.code} ${f.file}:${f.line} [${f.problemId}] ${f.message}`));
  const nErr = findings.filter((f) => f.severity === 'ERROR').length;
  const nWarn = findings.filter((f) => f.severity === 'WARNING').length;
  const refAc = referenceRuns.filter((r) => r.status === 'AC').length;
  console.log('');
  console.log(`Scanned ${files.length} file(s), ${problems.length} problem(s). ${nErr} error(s), ${nWarn} warning(s).`);
  if (!a.noRun) console.log(`Reference solution: ${refAc}/${referenceRuns.length} đạt AC.`);

  const report = {
    summary: { filesScanned: files.length, problemsScanned: problems.length, rulesApplied: RULES.length, errors: nErr, warnings: nWarn, referenceAC: refAc, referenceRun: referenceRuns.length, python: resolvePythonBin(a.python) },
    rules: RULES.map((r) => ({ code: r.code, severity: r.severity, group: r.group, description: r.description, fix: r.fix })),
    referenceRuns,
    findings,
  };
  const header = ['ruleId', 'severity', 'file', 'problemId', 'line', 'message', 'suggestedFix', 'humanVerification', 'falsePositive', 'finalResult'];
  const csv = [header.join(',')].concat(findings.map((f) => [f.code, f.severity, f.file, f.problemId, f.line, f.message, f.fix, f.humanVerification, f.falsePositive, f.finalResult].map(csvEscape).join(','))).join('\n');
  const json = JSON.stringify(report, null, 2);

  const leaks = findLeaks({ objects: [report], texts: [json, csv, findings.map((f) => f.message).join('\n')], problems });
  if (leaks.length) return reportLeaks(leaks);

  if (a.outDir) {
    fs.mkdirSync(a.outDir, { recursive: true });
    fs.writeFileSync(path.join(a.outDir, 'validator-report.json'), json, 'utf8');
    fs.writeFileSync(path.join(a.outDir, 'validator-report.csv'), csv, 'utf8');
    console.log(`Đã ghi validator-report.json và validator-report.csv vào ${a.outDir}`);
  }
  if (a.failOn === 'error' && nErr > 0) return 1;
  if (a.failOn === 'warning' && (nErr > 0 || nWarn > 0)) return 1;
  return 0;
}

function reportLeaks(leaks) {
  console.error('ERROR PHÁT HIỆN LỘ HIDDEN TEST trong report - KHÔNG ghi file:');
  leaks.forEach((l) => console.error(`  - [${l.kind}] ${l.where}: ${l.detail}`));
  return 4;
}

// ---------------------------------------------------------------------------------
// mutate
// ---------------------------------------------------------------------------------
function cmdMutate(a) {
  if (!a.slug || !a.mutants || a.inputs.length === 0) throw new Error('mutate cần: <problems.json> --slug SLUG --mutants FILE');
  const { problems, parseErrors } = loadAll(expandInputs(a.inputs), a.overlay);
  if (parseErrors.length) throw new Error(parseErrors[0].message);
  const problem = problems.find((p) => p.slug === a.slug);
  if (!problem) throw new Error(`không thấy bài "${a.slug}"`);
  const manifest = JSON.parse(fs.readFileSync(a.mutants, 'utf8'));
  if (manifest.problemSlug && manifest.problemSlug !== a.slug) throw new Error(`mutant manifest dành cho "${manifest.problemSlug}", không phải "${a.slug}"`);
  const suite = problem.suite || 'baseline';
  const opts = { python: a.python };

  console.log(`== Mutation testing: ${problem.slug} | suite=${suite} | ${problem.testCases.length} test (${problem.testCases.filter((t) => t.isHidden).length} hidden) | limit ${problem.timeLimitMs}ms`);

  // BƯỚC 0: reference phải AC, nếu không thì DỪNG (baseline không đáng tin).
  const ref = judge(problem.solutionCode, problem.testCases, problem.timeLimitMs, opts);
  console.log(`Reference: ${ref.status} (${ref.passedCount}/${ref.totalCount}, hidden ${ref.hiddenPassed}/${ref.hiddenTotal}, max ${ref.maxTimeMs}ms)`);
  if (ref.status !== 'AC') {
    console.error('STOP: reference solution KHÔNG đạt AC - baseline chưa đáng tin, không chạy mutation.');
    return 3;
  }

  const { records, materialized } = runMutation(problem, manifest, opts);
  records.forEach((r) => {
    const detail = r.status === 'KILLED' ? `killed by ${r.killedBy}` : r.status === 'SURVIVED' ? 'SURVIVED  <-- lỗ hổng độ phủ' : r.status === 'EQUIVALENT' ? `equivalent (${r.equivalentReason})` : `invalid (${r.reason})`;
    const mark = r.expectedMatch === false ? '  [KHÔNG NHƯ KỲ VỌNG]' : '';
    console.log(`${r.id.padEnd(8)} ${String(r.type).padEnd(22)} sample=${(r.sampleResult || '-').padEnd(4)} hidden=${(r.hiddenPassed || '-').padEnd(5)} ${detail}${mark}`);
  });

  const summary = summarize(records, a.threshold);
  console.log('');
  console.log(`Mutation Score = ${summary.killed}/${summary.valid} = ${summary.mutationScore}%  (ngưỡng ${a.threshold}%)  => ${summary.pass ? 'PASS' : 'FAIL'}`);
  console.log(`Killed ${summary.killed} (sample ${summary.killedBy.SAMPLE}, hidden ${summary.killedBy.HIDDEN}, timeout ${summary.killedBy.TIMEOUT}), Survived ${summary.survived}, Equivalent ${summary.equivalent}, Invalid ${summary.invalid}`);
  if (summary.survivors.length) console.log(`Survivors: ${summary.survivors.map((s) => s.id).join(', ')}`);

  const referenceOut = { status: ref.status, passedCount: ref.passedCount, totalCount: ref.totalCount, hiddenPassed: ref.hiddenPassed, hiddenTotal: ref.hiddenTotal, maxTimeMs: ref.maxTimeMs };
  const report = {
    problem: problem.slug, suite, timeLimitMs: problem.timeLimitMs,
    tests: { total: problem.testCases.length, hidden: problem.testCases.filter((t) => t.isHidden).length, addedByQA: problem.testCases.filter((t) => t.addedByQA).length },
    reference: referenceOut, summary, mutants: records,
  };
  const json = JSON.stringify(report, null, 2);
  const csv = mutationCsv(problem, suite, records);
  const md = coverageMarkdown(problem, suite, summary, records, referenceOut);
  const publicTexts = materialized.map((m) => m.source).concat(records.flatMap((r) => (r.patch || []).flatMap((p) => [p.find, p.replace])));

  const leaks = findLeaks({ objects: [report], texts: [json, csv, md], problems: [problem], publicTexts });
  if (leaks.length) return reportLeaks(leaks);

  if (a.outDir) {
    fs.mkdirSync(a.outDir, { recursive: true });
    fs.writeFileSync(path.join(a.outDir, 'mutation-report.json'), json, 'utf8');
    fs.writeFileSync(path.join(a.outDir, 'mutation-report.csv'), csv, 'utf8');
    fs.writeFileSync(path.join(a.outDir, 'coverage-report.md'), md, 'utf8');
    const mdir = a.mutantsOut || path.join(a.outDir, 'mutants');
    fs.mkdirSync(mdir, { recursive: true });
    materialized.forEach((m) => fs.writeFileSync(path.join(mdir, `${m.id}.py`), m.source, 'utf8'));
    console.log(`Đã ghi mutation-report.json/.csv, coverage-report.md vào ${a.outDir}; ${materialized.length} file mutant (.py) vào ${mdir}`);
  }
  return summary.pass ? 0 : 1;
}

// ---------------------------------------------------------------------------------
// probe-leak
// ---------------------------------------------------------------------------------
/**
 * Mô phỏng đúng cách BE lưu kết quả 1 test hidden: judge-queue.service.ts (dòng ~138)
 * giữ `stderr: run.stderr || undefined` và (dòng ~147) `errorMessage = run.stderr`
 * cho CẢ test hidden, còn input/expected/actual thì được bỏ. Nếu stderr của 1 chương
 * trình học viên có thể chứa nguyên văn input hidden thì đó là đường lộ dữ liệu.
 * Lệnh này chạy 1 "probe" vô hại (ném exception kèm dòng input đầu) và CHỈ in
 * true/false + số đếm, không in giá trị.
 */
function cmdProbeLeak(a) {
  if (!a.slug || a.inputs.length === 0) throw new Error('probe-leak cần: <problems.json> --slug SLUG');
  const { problems } = loadAll(expandInputs(a.inputs), a.overlay);
  const p = problems.find((x) => x.slug === a.slug);
  if (!p) throw new Error(`không thấy bài "${a.slug}"`);
  const probe = 'raise ValueError(input())\n';
  let hidden = 0;
  let leaked = 0;
  const detail = [];
  for (const t of p.testCases) {
    if (!t.isHidden) continue;
    hidden++;
    const firstLine = String(t.input).replace(/\r\n/g, '\n').split('\n')[0];
    const run = runOnce(probe, t.input, p.timeLimitMs, { python: a.python });
    const echoed = !run.blocked && run.stderr.includes(firstLine) && firstLine.trim().length > 0;
    if (echoed) leaked++;
    detail.push({ hiddenIndex: hidden, guardBlocked: !!run.blocked, stderrEchoesFirstInputLine: echoed });
  }
  console.log(`probe-leak ${p.slug}: probe không bị python-guard chặn = ${!detail.some((d) => d.guardBlocked)}`);
  console.log(`  ${leaked}/${hidden} hidden test có dòng input đầu tiên bị in nguyên văn trong stderr (BE lưu stderr này trong Submission.results[].stderr và errorMessage).`);
  detail.forEach((d) => console.log(`  Hidden test #${String(d.hiddenIndex).padStart(2, '0')}: echo=${d.stderrEchoesFirstInputLine}`));
  if (a.outDir) {
    fs.mkdirSync(a.outDir, { recursive: true });
    fs.writeFileSync(path.join(a.outDir, 'probe-leak.json'), JSON.stringify({ problem: p.slug, hiddenTotal: hidden, leakedViaStderr: leaked, detail }, null, 2), 'utf8');
  }
  return leaked > 0 ? 1 : 0;
}

function main() {
  const argv = process.argv.slice(2);
  const usage = 'Usage: node coding-problem-validator.js <validate|mutate|probe-leak> <files|dirs> [--out-dir D] [--overlay F] [--slug S] [--mutants F] [--mutants-out DIR] [--threshold 80] [--fail-on error|warning|never] [--no-run] [--python PY]';
  if (argv.length === 0) { console.error(usage); process.exit(2); }
  let a;
  try {
    a = parseArgs(argv);
    if (!['validate', 'mutate', 'probe-leak'].includes(a.cmd)) throw new Error(`lệnh không hợp lệ: ${a.cmd}`);
    if (a.inputs.length === 0) throw new Error('thiếu file/thư mục input');
    const code = a.cmd === 'validate' ? cmdValidate(a) : a.cmd === 'mutate' ? cmdMutate(a) : cmdProbeLeak(a);
    process.exit(code);
  } catch (err) {
    console.error(`ERROR ${err.message}`);
    console.error(usage);
    process.exit(2);
  }
}

main();
