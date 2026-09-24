import { scanPythonForViolations } from './python-guard.helper';

describe('PythonGuardHelper - scanPythonForViolations (AST-based)', () => {
  jest.setTimeout(15000);

  it('allows plain code using input()/print()', async () => {
    const code = 'a = int(input())\nb = int(input())\nprint(a + b)';
    expect(await scanPythonForViolations(code)).toEqual([]);
  });

  it('blocks "import os"', async () => {
    const violations = await scanPythonForViolations(
      'import os\nprint(os.listdir("/"))',
    );
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].reason).toContain('os');
  });

  it('blocks "import os as o" (aliased import)', async () => {
    const violations = await scanPythonForViolations(
      'import os as o\nprint(o.listdir("/"))',
    );
    expect(violations.some((v) => v.reason.includes('os'))).toBe(true);
  });

  it('blocks "from subprocess import ..."', async () => {
    const violations = await scanPythonForViolations(
      'from subprocess import run\nrun(["ls"])',
    );
    expect(violations.some((v) => v.reason.includes('subprocess'))).toBe(true);
  });

  it('blocks open() calls attempting filesystem access', async () => {
    const violations = await scanPythonForViolations(
      'f = open("/etc/passwd")\nprint(f.read())',
    );
    expect(violations.some((v) => v.reason.includes('open'))).toBe(true);
  });

  it('blocks eval()/exec()', async () => {
    const violations = await scanPythonForViolations('eval("1+1")');
    expect(violations.some((v) => v.reason.includes('eval'))).toBe(true);
  });

  it('ignores blocked keywords inside comments and strings', async () => {
    const violations = await scanPythonForViolations(
      '# import os is dangerous\nprint("please import os")',
    );
    expect(violations).toEqual([]);
  });

  it('reports the correct line number', async () => {
    const code = 'x = 1\ny = 2\nimport sys\n';
    const violations = await scanPythonForViolations(code);
    expect(violations[0].line).toBe(3);
  });

  // Các trick bypass mà bản regex line-scan cũ KHÔNG bắt được (không match bất
  // kỳ từ khóa "import X"/"open(" nào trực tiếp), nhưng AST guard bắt được vì
  // nó thấy đúng cấu trúc cây cú pháp sau khi Python tự parse.
  describe('bypass tricks bị chặn bởi AST (không bắt được bằng regex thuần)', () => {
    it('blocks class-introspection privilege escalation (().__class__.__base__.__subclasses__())', async () => {
      const violations = await scanPythonForViolations(
        'x = ().__class__.__base__.__subclasses__()\nprint(x)',
      );
      expect(violations.some((v) => v.reason.includes('__subclasses__'))).toBe(
        true,
      );
      expect(violations.some((v) => v.reason.includes('__class__'))).toBe(true);
    });

    it('blocks reaching __builtins__ via function __globals__', async () => {
      const violations = await scanPythonForViolations(
        'def f(): pass\nb = f.__globals__["__builtins__"]\nprint(b)',
      );
      expect(violations.some((v) => v.reason.includes('__globals__'))).toBe(
        true,
      );
    });

    it('blocks __import__ used as a bare identifier (not a call syntax match)', async () => {
      const violations = await scanPythonForViolations(
        'imp = __import__\nimp("os")',
      );
      expect(violations.some((v) => v.reason.includes('__import__'))).toBe(
        true,
      );
    });

    it('blocks vars()/globals()/locals() introspection', async () => {
      const violations = await scanPythonForViolations('print(globals())');
      expect(violations.some((v) => v.reason.includes('globals'))).toBe(true);
    });
  });

  it('returns no violations for code with a SyntaxError (left to checkPythonSyntax)', async () => {
    const violations = await scanPythonForViolations('def f(:\n    pass');
    expect(violations).toEqual([]);
  });
});
