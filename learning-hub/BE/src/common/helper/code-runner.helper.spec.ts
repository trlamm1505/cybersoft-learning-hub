import { runPythonCode } from './code-runner.helper';

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
    const result = await runPythonCode('print(open("C:/Windows/win.ini").read())', '');
    expect(result.blocked).toBe(true);
  });
});
