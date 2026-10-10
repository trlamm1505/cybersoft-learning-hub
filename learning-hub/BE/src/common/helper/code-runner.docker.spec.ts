import { EventEmitter } from 'events';
import { spawn } from 'child_process';
import {
  buildDockerRunArgs,
  interpretDockerExit,
  runPythonCode,
} from './code-runner.helper';
import type { RunResult } from './code-runner.helper';

jest.mock('child_process', () => ({
  ...jest.requireActual('child_process'),
  spawn: jest.fn(),
}));
jest.mock('./python-guard.helper', () => ({
  scanPythonForViolations: jest.fn().mockResolvedValue([]),
}));

const spawnMock = spawn as unknown as jest.Mock;

/** Tiến trình giả: phát stdout/stderr rồi đóng với mã thoát cho trước. */
function fakeChild(exitCode: number, stdout = '', stderr = '') {
  const child = Object.assign(new EventEmitter(), {
    pid: 1234,
    stdout: new EventEmitter(),
    stderr: new EventEmitter(),
    stdin: { write: jest.fn(), end: jest.fn() },
    kill: jest.fn(),
  });
  setImmediate(() => {
    if (stdout) child.stdout.emit('data', Buffer.from(stdout));
    if (stderr) child.stderr.emit('data', Buffer.from(stderr));
    child.emit('close', exitCode);
  });
  return child;
}

const baseResult: RunResult = {
  stdout: '',
  stderr: '',
  exitCode: 0,
  timedOut: false,
  executionTimeMs: 10,
  blocked: false,
};

describe('CodeRunnerHelper - Docker sandbox', () => {
  const previousMode = process.env.PYTHON_SANDBOX;

  beforeEach(() => {
    process.env.PYTHON_SANDBOX = 'docker';
    spawnMock.mockReset();
  });

  afterAll(() => {
    process.env.PYTHON_SANDBOX = previousMode;
  });

  it('chạy bằng docker run với đủ giới hạn cô lập', async () => {
    spawnMock.mockImplementation(() => fakeChild(0, 'hello\n'));

    const result = await runPythonCode('print("hello")', '', 2000, 64);

    expect(result.stdout).toBe('hello\n');
    const [command, args] = spawnMock.mock.calls[0];
    expect(command).toBe('docker');
    const joined = args.join(' ');
    expect(joined).toContain('run --rm -i');
    expect(joined).toContain('--network none');
    expect(joined).toContain('--memory 64m --memory-swap 64m');
    expect(joined).toContain('--pids-limit 64');
    expect(joined).toContain('--read-only');
    expect(joined).toContain('--cap-drop ALL');
    expect(joined).toContain('--security-opt no-new-privileges');
    expect(joined).toContain('--user 65534:65534');
    expect(joined).toMatch(/:\/sandbox:ro/);
    expect(joined).toMatch(/timeout 2\.0 python -I -B -X utf8 \/sandbox\/.+\.py$/);
  });

  it('mã thoát 124 của `timeout` trong container thành TLE', async () => {
    spawnMock.mockImplementation(() => fakeChild(124));

    const result = await runPythonCode('while True: pass', '', 500);

    expect(result.timedOut).toBe(true);
  });

  it('mã thoát 137 (OOM killer) báo vượt giới hạn bộ nhớ', async () => {
    spawnMock.mockImplementation(() => fakeChild(137));

    const result = await runPythonCode('x = [0] * 10**9', '', 2000, 128);

    expect(result.timedOut).toBe(false);
    expect(result.exitCode).toBe(137);
    expect(result.stderr).toContain('vượt giới hạn bộ nhớ 128MB');
  });

  it('Docker không chạy thì báo lỗi sandbox, không chạy code trên host', async () => {
    spawnMock.mockImplementation(() =>
      fakeChild(
        1,
        '',
        'error during connect: open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified.',
      ),
    );

    const result = await runPythonCode('print(1)', '');

    expect(result.exitCode).toBeNull();
    expect(result.stderr).toContain('Sandbox Docker chưa sẵn sàng');
    expect(spawnMock).toHaveBeenCalledTimes(1);
    expect(spawnMock.mock.calls[0][0]).toBe('docker');
  });

  it('lỗi runtime thật của học viên giữ nguyên stderr và mã thoát', () => {
    const run = interpretDockerExit(
      { ...baseResult, exitCode: 1, stderr: 'ZeroDivisionError: division by zero' },
      128,
    );

    expect(run.exitCode).toBe(1);
    expect(run.stderr).toBe('ZeroDivisionError: division by zero');
  });

  it('PYTHON_SANDBOX_IMAGE đổi được image', () => {
    const args = buildDockerRunArgs({
      containerName: 'c',
      runDir: '/tmp/x',
      scriptFile: 'a.py',
      timeoutMs: 1500,
      memoryLimitMb: 256,
      image: 'my-python:3.12',
    });

    expect(args).toContain('my-python:3.12');
    expect(args).toContain('256m');
  });
});
