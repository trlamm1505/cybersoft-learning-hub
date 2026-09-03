/**
 * Static AST guard for untrusted Python code before it is ever executed.
 * Blocks imports/calls that could read the host filesystem, spawn processes,
 * or reach the network, so a `python -I` run cannot escape its temp sandbox dir.
 */

const BLOCKED_MODULES = [
  'os',
  'sys',
  'subprocess',
  'socket',
  'shutil',
  'pathlib',
  'importlib',
  'ctypes',
  'multiprocessing',
  'threading',
  'signal',
  'resource',
  'pty',
  'platform',
  'inspect',
  'gc',
  'urllib',
  'http',
  'ftplib',
  'telnetlib',
  'ssl',
];

// NOTE: `input()` is intentionally NOT blocked — exercises feed stdin test cases through it.
const BLOCKED_CALLS = ['eval', 'exec', 'compile', '__import__', 'open'];

export interface GuardViolation {
  line: number;
  reason: string;
}

/**
 * Checks Python source for obviously dangerous constructs via regex line-scan.
 * A regex is not a real parser, but it is enough to catch the standard
 * "import os / open('/etc/passwd')" escape attempts a learning-exercise judge needs to stop;
 * it is not a security boundary on its own — the sandbox process limits (cwd, timeout, no
 * network) are what actually contain execution.
 */
export function scanPythonForViolations(code: string): GuardViolation[] {
  const violations: GuardViolation[] = [];
  const lines = code.split('\n');

  lines.forEach((rawLine, idx) => {
    const line = rawLine.replace(/#.*$/, '').trim();
    if (!line) return;

    const importMatch = line.match(/^(?:from|import)\s+([a-zA-Z0-9_.]+)/);
    if (importMatch) {
      const rootModule = importMatch[1].split('.')[0];
      if (BLOCKED_MODULES.includes(rootModule)) {
        violations.push({
          line: idx + 1,
          reason: `Không được phép import module "${rootModule}"`,
        });
      }
    }

    for (const call of BLOCKED_CALLS) {
      const callPattern = new RegExp(`(^|[^a-zA-Z0-9_.])${call}\\s*\\(`);
      if (callPattern.test(line)) {
        violations.push({
          line: idx + 1,
          reason: `Không được phép gọi hàm "${call}(...)"`,
        });
      }
    }
  });

  return violations;
}
