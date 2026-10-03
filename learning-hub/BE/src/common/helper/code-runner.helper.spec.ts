import { runPythonCode, checkPythonSyntax, outputsMatch } from './code-runner.helper';

describe('CodeRunnerHelper - runPythonCode', () => {
  jest.setTimeout(15000);

  it('runs simple code and captures stdout', async () => {
    const result = await runPythonCode('print("hello world")', '');
    expect(result.blocked).toBe(false);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe('hello world');
  });

  it('feeds stdin to the process via input()', async () => {
    const code = 'a = int(input())\nb = int(input())\nprint(a + b)';
    const result = await runPythonCode(code, '3\n5');
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe('8');
  });

  it('captures stderr and non-zero exit code on runtime error', async () => {
    const result = await runPythonCode('print(1 / 0)', '');
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain('ZeroDivisionError');
  });

  it('preserves UTF-8 non-ASCII output (Vietnamese text)', async () => {
    const result = await runPythonCode("print('Chẵn')", '');
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe('Chẵn');
  });

  it('kills the process and flags timedOut on infinite loop', async () => {
    const result = await runPythonCode('while True:\n    pass', '', 500);
    expect(result.timedOut).toBe(true);
  });

  it('blocks dangerous code before ever spawning python', async () => {
    const result = await runPythonCode('import os\nprint(os.listdir("/"))', '');
    expect(result.blocked).toBe(true);
    expect(result.blockedReason).toContain('os');
    expect(result.exitCode).toBeNull();
  });

  it('cannot read arbitrary host filesystem paths', async () => {
    const result = await runPythonCode(
      'print(open("C:/Windows/win.ini").read())',
      '',
    );
    expect(result.blocked).toBe(true);
  });
});

describe('CodeRunnerHelper - checkPythonSyntax', () => {
  jest.setTimeout(15000);

  it('accepts syntactically valid code', async () => {
    const result = await checkPythonSyntax('a = int(input())\nprint(a + 1)');
    expect(result.ok).toBe(true);
    expect(result.errorMessage).toBeUndefined();
  });

  it('rejects code with a SyntaxError', async () => {
    const result = await checkPythonSyntax('def f(:\n    pass');
    expect(result.ok).toBe(false);
    expect(result.errorMessage).toContain('SyntaxError');
  });

  it('rejects code with an IndentationError', async () => {
    const result = await checkPythonSyntax('if True:\nprint(1)');
    expect(result.ok).toBe(false);
    expect(result.errorMessage).toContain('IndentationError');
  });
});

describe('CodeRunnerHelper - outputsMatch', () => {
  it('matches identical strings exactly', () => {
    expect(outputsMatch('Chẵn', 'Chẵn')).toBe(true);
  });

  it('rejects genuinely different text', () => {
    expect(outputsMatch('Yes', 'No')).toBe(false);
  });

  it('tolerates Python float rounding error within epsilon', () => {
    // 1.5 + 3.2 in Python prints as 4.800000000000001
    expect(outputsMatch('4.800000000000001', '4.8')).toBe(true);
  });

  it('rejects floats that differ beyond the rounding epsilon', () => {
    expect(outputsMatch('4.9', '4.8')).toBe(false);
  });

  it('rejects a logic error masquerading as a float (wrong by a lot)', () => {
    expect(outputsMatch('10.0', '4.8')).toBe(false);
  });

  it('compares multi-line numeric output line by line', () => {
    expect(outputsMatch('1.0000000000000002\n2', '1.0\n2')).toBe(true);
  });

  it('rejects multi-line output with mismatched line count', () => {
    expect(outputsMatch('1\n2', '1')).toBe(false);
  });

  it('does not treat a string merely containing digits as a float', () => {
    expect(outputsMatch('v1.0-beta', 'v1.0-beta2')).toBe(false);
  });

  it('rejects negative-zero vs positive-zero text mismatch outside tolerance rules only when actually different', () => {
    expect(outputsMatch('-0.0', '0.0')).toBe(true);
  });

  it('rejects "007" vs "7" as equal — integer tokens compare as strict strings, not numerically', () => {
    expect(outputsMatch('007', '7')).toBe(false);
  });

  it('treats a zero-padded identifier as different from its unpadded form even when both look numeric', () => {
    expect(outputsMatch('00123', '123')).toBe(false);
  });

  it('still matches identical zero-padded integer strings exactly', () => {
    expect(outputsMatch('007', '007')).toBe(true);
  });

  it('does not apply epsilon tolerance when only one side is decimal notation', () => {
    expect(outputsMatch('7', '7.0')).toBe(false);
  });

  it('applies epsilon tolerance when both sides use scientific notation', () => {
    expect(outputsMatch('1.00000000001e1', '1e1')).toBe(true);
  });
});
