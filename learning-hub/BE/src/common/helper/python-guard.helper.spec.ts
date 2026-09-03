import { scanPythonForViolations } from './python-guard.helper';

describe('PythonGuardHelper - scanPythonForViolations', () => {
  it('allows plain code using input()/print()', () => {
    const code = 'a = int(input())\nb = int(input())\nprint(a + b)';
    expect(scanPythonForViolations(code)).toEqual([]);
  });

  it('blocks "import os"', () => {
    const violations = scanPythonForViolations('import os\nprint(os.listdir("/"))');
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].reason).toContain('os');
  });

  it('blocks "from subprocess import ..."', () => {
    const violations = scanPythonForViolations('from subprocess import run\nrun(["ls"])');
    expect(violations.some((v) => v.reason.includes('subprocess'))).toBe(true);
  });

  it('blocks open() calls attempting filesystem access', () => {
    const violations = scanPythonForViolations('f = open("/etc/passwd")\nprint(f.read())');
    expect(violations.some((v) => v.reason.includes('open'))).toBe(true);
  });

  it('blocks eval()/exec()', () => {
    const violations = scanPythonForViolations('eval("__import__(\'os\').system(\'ls\')")');
    expect(violations.some((v) => v.reason.includes('eval'))).toBe(true);
  });

  it('ignores blocked keywords inside comments', () => {
    const violations = scanPythonForViolations('# import os is dangerous\nprint("hello")');
    expect(violations).toEqual([]);
  });

  it('reports the correct line number', () => {
    const code = 'x = 1\ny = 2\nimport sys\n';
    const violations = scanPythonForViolations(code);
    expect(violations[0].line).toBe(3);
  });
});
