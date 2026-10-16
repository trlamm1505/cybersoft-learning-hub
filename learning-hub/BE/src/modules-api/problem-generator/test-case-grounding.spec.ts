import { groundTestCases, GroundingError, type Runner } from './test-case-grounding';
import { buildProblemPrompt, BAND_INSTRUCTION } from './problem-prompt-builder';
import { bankLabels, exerciseBandFilter, exerciseFitsBand, normalizeBankBand, questionBandFilter } from '../exercise/exercise-matrix';
import type { ProblemDraft } from './problem-generator.types';

const draft = (testCases: ProblemDraft['testCases'], solutionCode = 'print(1)'): ProblemDraft => ({
  specId: 's',
  band: '6-9',
  title: 'Số lớn nhất',
  slug: 'so-lon-nhat',
  description: 'In số lớn nhất.',
  difficulty: 'EASY',
  tags: [],
  starterCode: '',
  solutionCode,
  testCases,
});

/** Runner giả: "lời giải" là hàm JS trên input, mô phỏng stdout thật. */
const fakeRunner = (fn: (input: string) => string | Error, syntaxOk = true): Runner => ({
  syntax: (async () => (syntaxOk ? { ok: true } : { ok: false, errorMessage: 'SyntaxError' })) as never,
  run: (async (_code: string, input: string) => {
    const r = fn(input);
    if (r instanceof Error) return { stdout: '', stderr: r.message, exitCode: 1, timedOut: false, blocked: false };
    return { stdout: r + '\n', stderr: '', exitCode: 0, timedOut: false, blocked: false };
  }) as never,
});

const max = (s: string) => String(Math.max(...s.split(/\s+/).map(Number)));

describe('groundTestCases: expectedOutput lấy từ kết quả chạy thật', () => {
  it('sửa expectedOutput bịa (48 không có trong dãy) thành kết quả thật 44', async () => {
    const { draft: g, report } = await groundTestCases(
      draft([
        { input: '15 3 9 22 1 44 8 12 10 5', expectedOutput: '48', isHidden: false },
        { input: '1 2 3', expectedOutput: '3', isHidden: true },
      ]),
      fakeRunner(max),
    );
    expect(g.testCases[0].expectedOutput).toBe('44');
    expect(report).toEqual({ checked: 2, corrected: 1, dropped: 0 });
  });

  it('bỏ test case mà lời giải chạy lỗi, còn đủ thì giữ bài', async () => {
    const { draft: g, report } = await groundTestCases(
      draft([
        { input: '1 2', expectedOutput: '2', isHidden: false },
        { input: 'abc', expectedOutput: 'x', isHidden: false },
        { input: '5 7', expectedOutput: '7', isHidden: true },
      ]),
      fakeRunner((i) => (/[a-z]/.test(i) ? new Error('ValueError') : max(i))),
    );
    expect(g.testCases.map((t) => t.input)).toEqual(['1 2', '5 7']);
    expect(report.dropped).toBe(1);
  });

  it('dưới 2 test chạy được hoặc sai cú pháp -> GroundingError', async () => {
    const two = [{ input: 'a', expectedOutput: '1', isHidden: false }, { input: 'b', expectedOutput: '2', isHidden: true }];
    await expect(groundTestCases(draft(two), fakeRunner(() => new Error('x')))).rejects.toBeInstanceOf(GroundingError);
    await expect(groundTestCases(draft(two), fakeRunner(max, false))).rejects.toThrow(/sai cú pháp/);
  });

  it('luôn còn một test hiện và một test ẩn', async () => {
    const { draft: g } = await groundTestCases(draft([{ input: '1 2', expectedOutput: '2', isHidden: true }, { input: '3 4', expectedOutput: '4', isHidden: true }]), fakeRunner(max));
    expect(g.testCases.some((t) => !t.isHidden)).toBe(true);
    expect(g.testCases.some((t) => t.isHidden)).toBe(true);
  });
});

describe('chỉ thị sư phạm và nhãn theo khối', () => {
  const spec = { id: 's', learningOutcome: 'vòng lặp', level: 'EASY' as const, constraints: [], tags: [] };
  it('prompt kèm chỉ thị đúng khối', () => {
    expect(buildProblemPrompt({ ...spec, band: '6-9' } as never)).toContain(BAND_INSTRUCTION['6-9']);
    const p = buildProblemPrompt({ ...spec, band: '10-12' } as never);
    expect(p).toContain(BAND_INSTRUCTION['10-12']);
    expect(p).toContain('O(N log N)');
  });

  it('nhãn khối và chuẩn hoá', () => {
    expect(bankLabels('6-9')).toEqual({ targetGroup: 'K6_9', labType: 'PYTHON_CODE', gradeBand: '6-9' });
    expect(bankLabels('10-12')).toMatchObject({ targetGroup: 'K10_12', labType: 'ALGO_JUDGE' });
    expect(normalizeBankBand('3-5')).toBeUndefined();
    expect(normalizeBankBand('10-12')).toBe('10-12');
  });

  it('exerciseFitsBand', () => {
    expect(exerciseFitsBand({ targetGroup: 'K10_12' }, '6-9')).toBe(false);
    expect(exerciseFitsBand({ targetGroup: 'K6_9' }, '6-9')).toBe(true);
    expect(exerciseFitsBand({ gradeBand: '9-12' }, '10-12')).toBe(true);
    expect(exerciseFitsBand({ gradeBand: '6-9' }, '10-12')).toBe(false);
    expect(exerciseFitsBand({}, '6-9')).toBe(true);
  });

  it('bộ lọc Mongo theo khối', () => {
    expect(JSON.stringify(exerciseBandFilter('10-12'))).toContain('K10_12');
    expect(JSON.stringify(questionBandFilter('6-9'))).toContain('"gradeBands":"6-9"');
  });
});
