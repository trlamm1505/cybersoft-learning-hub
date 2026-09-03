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

      const timer = setTimeout(() => {
        timedOut = true;
        child.kill('SIGKILL');
      }, timeoutMs);

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
        resolve({
          stdout: stdout.slice(0, MAX_OUTPUT_BYTES),
          stderr: stderr.slice(0, MAX_OUTPUT_BYTES),
          exitCode,
          timedOut,
          executionTimeMs: Date.now() - startedAt,
          blocked: false,
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
