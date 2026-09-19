'use strict';
/**
 * runner.js
 * ------------------------------------------------------------------
 * "Judge mini" chạy code Python với danh sách test case, MÔ PHỎNG ĐÚNG hành vi
 * của judge thật trong BE (không phải judge mới tự nghĩ ra):
 *   - BE/src/common/helper/code-runner.helper.ts  (runPythonCode, checkPythonSyntax)
 *   - BE/src/common/helper/python-guard.helper.ts (scanPythonForViolations)
 *   - BE/src/modules-api/judge/judge-queue.service.ts (gradeOne: so sánh output)
 *
 * Các hành vi được giữ NGUYÊN so với BE (để kết luận "reference AC / mutant
 * KILLED" ở đây đúng với kết luận judge thật sẽ đưa ra):
 *   1. `python -I -B -X utf8 script.py`, cwd = thư mục tạm riêng mỗi lần chạy.
 *   2. Env chỉ còn PATH (+ SystemRoot trên Windows).
 *   3. Static guard chặn import os/sys/subprocess... và gọi eval/exec/open... => RE(blocked).
 *   4. Timeout cứng = timeLimitMs, quá hạn bị SIGKILL => TLE.
 *   5. So sánh: stdout.replace(CRLF->LF).trim() === expected.replace(CRLF->LF).trim()
 *      (=> khoảng trắng/xuống dòng THỪA Ở ĐẦU/CUỐI được bỏ qua, nhưng text thừa
 *      hoặc khoảng trắng Ở GIỮA thì bị bắt).
 *   6. Trạng thái tổng = trạng thái của test FAIL CUỐI CÙNG (đúng như BE: mỗi test
 *      fail ghi đè `status`), không phải test fail đầu tiên. Runner này chạy HẾT
 *      test (BE cũng vậy, trừ khi gặp blocked thì break).
 *
 * KHÁC BE ở đúng 1 chỗ, có chủ đích: kết quả của HIDDEN test chỉ giữ
 * {index, passed, kind, timeMs} - KHÔNG giữ stdout/stderr/input/expected
 * (xem mục "hidden leak" trong README: BE hiện vẫn lưu stderr của hidden test).
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const crypto = require('crypto');

// ---- Python guard (bản JS của python-guard.helper.ts) ----
const BLOCKED_MODULES = [
  'os', 'sys', 'subprocess', 'socket', 'shutil', 'pathlib', 'importlib', 'ctypes',
  'multiprocessing', 'threading', 'signal', 'resource', 'pty', 'platform', 'inspect',
  'gc', 'urllib', 'http', 'ftplib', 'telnetlib', 'ssl',
];
const BLOCKED_CALLS = ['eval', 'exec', 'compile', '__import__', 'open'];

function scanPythonForViolations(code) {
  const violations = [];
  code.split('\n').forEach((rawLine, idx) => {
    const line = rawLine.replace(/#.*$/, '').trim();
    if (!line) return;
    const im = line.match(/^(?:from|import)\s+([a-zA-Z0-9_.]+)/);
    if (im) {
      const root = im[1].split('.')[0];
      if (BLOCKED_MODULES.includes(root)) violations.push({ line: idx + 1, reason: `Không được phép import module "${root}"` });
    }
    for (const call of BLOCKED_CALLS) {
      const re = new RegExp(`(^|[^a-zA-Z0-9_.])${call}\\s*\\(`);
      if (re.test(line)) violations.push({ line: idx + 1, reason: `Không được phép gọi hàm "${call}(...)"` });
    }
  });
  return violations;
}

// ---- Python interpreter ----
function resolvePythonBin(override) {
  if (override) return override;
  if (process.env.PYTHON_BIN) return process.env.PYTHON_BIN;
  if (process.platform !== 'win32') return 'python3';
  // Giống BE: né "App Execution Alias" của Microsoft Store trên Windows.
  const local = process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Python', 'bin', 'python.exe');
  if (local && fs.existsSync(local)) return local;
  return 'python';
}

function minimalEnv() {
  const env = { PATH: process.env.PATH };
  if (process.platform === 'win32') env.SystemRoot = process.env.SystemRoot;
  return env;
}

const MAX_OUTPUT_BYTES = 64 * 1024;

function withScript(code, fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cpv-run-'));
  const file = path.join(dir, `${crypto.randomUUID()}.py`);
  fs.writeFileSync(file, code, 'utf8');
  try {
    return fn(dir, file);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  }
}

/** "Compile" step: py_compile (giống checkPythonSyntax của BE). */
function checkSyntax(code, opts = {}) {
  const py = resolvePythonBin(opts.python);
  return withScript(code, (dir, file) => {
    const r = spawnSync(py, ['-I', '-B', '-m', 'py_compile', file], { cwd: dir, env: minimalEnv(), encoding: 'utf8', timeout: 15000 });
    if (r.error) return { ok: false, errorMessage: `Không thể kiểm tra cú pháp: ${r.error.message}` };
    return { ok: r.status === 0, errorMessage: r.status === 0 ? undefined : (r.stderr || '').trim() };
  });
}

/** Chạy 1 lần với 1 stdin. */
function runOnce(code, stdin, timeoutMs, opts = {}) {
  const violations = scanPythonForViolations(code);
  if (violations.length > 0) {
    return { stdout: '', stderr: '', exitCode: null, timedOut: false, executionTimeMs: 0, blocked: true, blockedReason: violations.map((v) => `Dòng ${v.line}: ${v.reason}`).join('; ') };
  }
  const py = resolvePythonBin(opts.python);
  return withScript(code, (dir, file) => {
    const started = Date.now();
    const r = spawnSync(py, ['-I', '-B', '-X', 'utf8', file], {
      cwd: dir,
      env: minimalEnv(),
      input: stdin == null ? '' : stdin,
      encoding: 'utf8',
      timeout: timeoutMs,
      killSignal: 'SIGKILL',
      maxBuffer: 4 * MAX_OUTPUT_BYTES,
    });
    const elapsed = Date.now() - started;
    const timedOut = !!(r.error && r.error.code === 'ETIMEDOUT');
    if (r.error && !timedOut && r.error.code !== 'ENOBUFS') {
      return { stdout: '', stderr: `Không thể khởi chạy Python: ${r.error.message}`, exitCode: null, timedOut: false, executionTimeMs: elapsed, blocked: false };
    }
    return {
      stdout: (r.stdout || '').slice(0, MAX_OUTPUT_BYTES),
      stderr: (r.stderr || '').slice(0, MAX_OUTPUT_BYTES),
      exitCode: timedOut ? null : r.status,
      timedOut,
      executionTimeMs: elapsed,
      blocked: false,
    };
  });
}

const normalize = (s) => String(s == null ? '' : s).replace(/\r\n/g, '\n').trim();

function clip(s, n = 200) {
  s = String(s == null ? '' : s);
  return s.length > n ? `${s.slice(0, n)}…(+${s.length - n} ký tự)` : s;
}

/**
 * Chấm `code` trên toàn bộ `tests`. Trả về:
 *   { status: 'AC'|'WA'|'TLE'|'RE'|'CE', results:[...], passedCount, totalCount,
 *     hiddenPassed, hiddenTotal, maxTimeMs, compileError? }
 * results[i] cho test HIDDEN chỉ có {index, hiddenIndex, isHidden, passed, kind, timeMs}.
 */
function judge(code, tests, timeLimitMs, opts = {}) {
  const syntax = checkSyntax(code, opts);
  const totalCount = tests.length;
  const hiddenTotal = tests.filter((t) => t.isHidden).length;
  if (!syntax.ok) {
    return { status: 'CE', results: [], passedCount: 0, totalCount, hiddenPassed: 0, hiddenTotal, maxTimeMs: 0, compileError: clip(syntax.errorMessage, 300) };
  }

  const results = [];
  let status = 'AC';
  let hiddenSeen = 0;
  let maxTimeMs = 0;
  for (let i = 0; i < tests.length; i++) {
    const t = tests[i];
    const hiddenIndex = t.isHidden ? ++hiddenSeen : null;
    const run = runOnce(code, t.input, timeLimitMs, opts);
    if (run.blocked) {
      status = 'RE';
      results.push(shape(t, i, hiddenIndex, false, 'BLOCKED', 0, { stderr: run.blockedReason }));
      break;
    }
    const actual = normalize(run.stdout);
    const expected = normalize(t.expectedOutput);
    const passed = !run.timedOut && run.exitCode === 0 && actual === expected;
    maxTimeMs = Math.max(maxTimeMs, run.executionTimeMs);
    let kind = 'PASS';
    if (!passed) {
      if (run.timedOut) kind = 'TLE';
      else if (run.exitCode !== 0) kind = 'RE';
      else kind = 'WA';
      status = kind;
    }
    results.push(shape(t, i, hiddenIndex, passed, kind, run.executionTimeMs, { actual, expected, stderr: run.stderr }));
  }
  const passedCount = results.filter((r) => r.passed).length;
  const hiddenPassed = results.filter((r) => r.isHidden && r.passed).length;
  return { status, results, passedCount, totalCount, hiddenPassed, hiddenTotal, maxTimeMs };
}

function shape(t, index, hiddenIndex, passed, kind, timeMs, detail) {
  const base = { index, isHidden: !!t.isHidden, passed, kind, timeMs };
  if (t.isHidden) return { ...base, hiddenIndex }; // KHÔNG kèm input/expected/actual/stderr
  return { ...base, input: t.input, expected: detail.expected, actual: clip(detail.actual), stderr: detail.stderr ? clip(detail.stderr, 300) : undefined };
}

module.exports = { judge, runOnce, checkSyntax, scanPythonForViolations, normalize, resolvePythonBin, BLOCKED_MODULES, BLOCKED_CALLS };
