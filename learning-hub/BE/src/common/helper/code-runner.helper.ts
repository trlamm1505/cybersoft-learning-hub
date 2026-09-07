import { spawn } from 'child_process';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { scanPythonForViolations } from './python-guard.helper';

export interface RunResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timedOut: boolean;
  executionTimeMs: number;
  blocked: boolean;
  blockedReason?: string;
  peakMemoryMb?: number;
}

export interface SyntaxCheckResult {
  ok: boolean;
  errorMessage?: string;
}

const DEFAULT_TIMEOUT_MS = 2000;
const MAX_OUTPUT_BYTES = 64 * 1024; // 64KB stdout/stderr cap

/**
 * On Windows, the bare `python` on PATH is often the Microsoft Store /
 * "App Execution Alias" shim, which re-resolves the real interpreter via
 * %LOCALAPPDATA%. Once we strip env vars down to a minimal set that lookup
 * breaks and the shim falls back to launching the Python install manager
 * instead of running the script. Resolve a concrete interpreter path once at
 * module load to sidestep the shim entirely.
 */
function resolvePythonBin(): string {
  if (process.platform !== 'win32') return 'python3';

  const candidates = [
    process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Python', 'bin', 'python.exe') : null,
  ].filter((p): p is string => !!p);

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return 'python';
}

const PYTHON_BIN = resolvePythonBin();

/**
 * Runs untrusted Python source against a single stdin payload.
 * Isolation strategy (no Docker available on this host):
 *  - static AST-ish guard rejects dangerous imports/calls before anything runs
 *  - `python -I` (isolated mode: ignores env vars / user site-packages)
 *  - execution cwd is a fresh temp dir per run, deleted immediately after
 *  - hard wall-clock timeout kills the process tree
 *  - stdout/stderr are truncated to MAX_OUTPUT_BYTES to bound memory
 */
export async function runPythonCode(
  code: string,
  stdin: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<RunResult> {
  const violations = scanPythonForViolations(code);
  if (violations.length > 0) {
    return {
      stdout: '',
      stderr: '',
      exitCode: null,
      timedOut: false,
      executionTimeMs: 0,
      blocked: true,
      blockedReason: violations
        .map((v) => `Dòng ${v.line}: ${v.reason}`)
        .join('; '),
    };
  }

  const runDir = fs.mkdtempSync(path.join(os.tmpdir(), 'code-runner-'));
  const scriptPath = path.join(runDir, `${randomUUID()}.py`);
  fs.writeFileSync(scriptPath, code, 'utf-8');

  const startedAt = Date.now();

  try {
    return await new Promise<RunResult>((resolve) => {
      // Only PATH (and SystemRoot on Windows, required for the OS loader to
      // resolve DLLs) survive — every other env var, including anything from
      // the host's own .env, is stripped before the child ever spawns.
      const minimalEnv: NodeJS.ProcessEnv = { PATH: process.env.PATH };
      if (process.platform === 'win32') {
        minimalEnv.SystemRoot = process.env.SystemRoot;
      }

      // `-X utf8` forces UTF-8 stdio regardless of the Windows console
      // codepage. `-I` (isolated mode) ignores PYTHONIOENCODING entirely,
      // so this must be a CLI flag, not an env var — without it, non-ASCII
      // output (Vietnamese exercise text included) crashes with
      // UnicodeEncodeError against cp1252.
      const child = spawn(PYTHON_BIN, ['-I', '-B', '-X', 'utf8', scriptPath], {
        cwd: runDir,
        env: minimalEnv,
        windowsHide: true,
      });

      let stdout = '';
      let stderr = '';
      let timedOut = false;
      let settled = false;
      let peakMemoryMb: number | undefined;

      const timer = setTimeout(() => {
        timedOut = true;
        child.kill('SIGKILL');
      }, timeoutMs);

      const memorySampler = child.pid
        ? setInterval(() => {
            sampleProcessMemoryMb(child.pid as number).then((mb) => {
              if (mb !== undefined && (peakMemoryMb === undefined || mb > peakMemoryMb)) {
                peakMemoryMb = mb;
              }
            });
          }, MEMORY_SAMPLE_INTERVAL_MS)
        : undefined;

      child.stdout.on('data', (chunk) => {
        if (stdout.length < MAX_OUTPUT_BYTES) stdout += chunk.toString('utf-8');
      });
      child.stderr.on('data', (chunk) => {
        if (stderr.length < MAX_OUTPUT_BYTES) stderr += chunk.toString('utf-8');
      });

      child.on('error', (err) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (memorySampler) clearInterval(memorySampler);
        resolve({
          stdout: '',
          stderr: `Không thể khởi chạy Python: ${err.message}`,
          exitCode: null,
          timedOut: false,
          executionTimeMs: Date.now() - startedAt,
          blocked: false,
        });
      });

      child.on('close', (exitCode) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (memorySampler) clearInterval(memorySampler);
        resolve({
          stdout: stdout.slice(0, MAX_OUTPUT_BYTES),
          stderr: stderr.slice(0, MAX_OUTPUT_BYTES),
          exitCode,
          timedOut,
          executionTimeMs: Date.now() - startedAt,
          blocked: false,
          peakMemoryMb,
        });
      });

      child.stdin.write(stdin ?? '');
      child.stdin.end();
    });
  } finally {
    // Windows can briefly hold the killed child's file handle open; retry a couple times.
    fs.rmSync(runDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  }
}

const MEMORY_SAMPLE_INTERVAL_MS = 100;

/**
 * Best-effort peak-RSS sampling for a child process. Not precise (no cgroup/Docker-level
 * accounting available on this host — see Day 8 worklog), just enough to record memory
 * "at an appropriate level" alongside execution time. Silently returns undefined if the
 * platform-specific probe fails (e.g. `wmic` deprecated on newer Windows builds, or the
 * process already exited between sampling ticks) — memory becomes "not available" rather
 * than blocking/failing the actual grading.
 */
async function sampleProcessMemoryMb(pid: number): Promise<number | undefined> {
  try {
    if (process.platform === 'linux' || process.platform === 'darwin') {
      const status = fs.readFileSync(`/proc/${pid}/status`, 'utf-8');
      const match = status.match(/VmRSS:\s*(\d+)\s*kB/);
      if (match) return Number(match[1]) / 1024;
      return undefined;
    }

    // Windows: shell out to wmic. Deliberately not polled tightly (see MEMORY_SAMPLE_INTERVAL_MS
    // usage above being capped by the caller's own timeout) since spawning a process per sample
    // is expensive relative to the thing being measured.
    return await new Promise<number | undefined>((resolve) => {
      const probe = spawn('wmic', ['process', 'where', `ProcessId=${pid}`, 'get', 'WorkingSetSize', '/value'], {
        windowsHide: true,
      });
      let out = '';
      probe.stdout?.on('data', (c) => (out += c.toString('utf-8')));
      probe.on('close', () => {
        const match = out.match(/WorkingSetSize=(\d+)/);
        resolve(match ? Number(match[1]) / (1024 * 1024) : undefined);
      });
      probe.on('error', () => resolve(undefined));
    });
  } catch {
    return undefined;
  }
}

/**
 * Pre-execution syntax check ("compile step" for an interpreted language) via `python -m
 * py_compile`. Run once per submission before the test-case loop, since the source doesn't
 * change between test cases — a SyntaxError/IndentationError here maps to judge status CE,
 * distinct from RE (a runtime error raised by otherwise-valid code).
 */
export async function checkPythonSyntax(code: string): Promise<SyntaxCheckResult> {
  const runDir = fs.mkdtempSync(path.join(os.tmpdir(), 'code-runner-syntax-'));
  const scriptPath = path.join(runDir, `${randomUUID()}.py`);
  fs.writeFileSync(scriptPath, code, 'utf-8');

  try {
    return await new Promise<SyntaxCheckResult>((resolve) => {
      const minimalEnv: NodeJS.ProcessEnv = { PATH: process.env.PATH };
      if (process.platform === 'win32') {
        minimalEnv.SystemRoot = process.env.SystemRoot;
      }

      const child = spawn(PYTHON_BIN, ['-I', '-B', '-m', 'py_compile', scriptPath], {
        cwd: runDir,
        env: minimalEnv,
        windowsHide: true,
      });

      let stderr = '';
      let settled = false;

      child.stderr.on('data', (chunk) => {
        stderr += chunk.toString('utf-8');
      });

      child.on('error', (err) => {
        if (settled) return;
        settled = true;
        resolve({ ok: false, errorMessage: `Không thể kiểm tra cú pháp: ${err.message}` });
      });

      child.on('close', (exitCode) => {
        if (settled) return;
        settled = true;
        resolve({ ok: exitCode === 0, errorMessage: exitCode === 0 ? undefined : stderr.trim() });
      });
    });
  } finally {
    fs.rmSync(runDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  }
}
