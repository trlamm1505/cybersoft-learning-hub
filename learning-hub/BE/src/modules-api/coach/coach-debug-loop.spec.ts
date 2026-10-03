import { analyzeDebugLoop, MAX_DEBUG_LOOPS } from './coach-debug-loop';
import { DebugLoopTestInput } from './coach-debug-loop.types';

function makeInput(
  overrides: Partial<DebugLoopTestInput> = {},
): DebugLoopTestInput {
  return {
    status: 'WA',
    passedCount: 1,
    totalCount: 2,
    firstFailingTest: {
      index: 1,
      input: '3 4',
      expectedOutput: '7',
      actualOutput: '34',
      isHidden: false,
    },
    ...overrides,
  };
}

describe('analyzeDebugLoop — phân loại lỗi', () => {
  it('AC -> PASSED, không có evidence lỗi', () => {
    const result = analyzeDebugLoop(
      makeInput({
        status: 'AC',
        passedCount: 2,
        totalCount: 2,
        firstFailingTest: undefined,
      }),
      { attemptsSoFar: 0 },
    );
    expect(result.errorCategory).toBe('PASSED');
    expect(result.evidence).toBeNull();
  });

  it('CE với SyntaxError -> COMPILE_SYNTAX, feedback trích nguyên văn stderr', () => {
    const input = makeInput({
      status: 'CE',
      firstFailingTest: {
        index: 0,
        stderr: "SyntaxError: '(' was never closed",
      },
    });
    const result = analyzeDebugLoop(input, { attemptsSoFar: 0 });
    expect(result.errorCategory).toBe('COMPILE_SYNTAX');
    expect(result.feedback).toContain("SyntaxError: '(' was never closed");
    expect(result.evidence?.stderrExcerpt).toContain('SyntaxError');
  });

  it('RE với NameError -> RUNTIME_EXCEPTION, giải thích đúng loại lỗi', () => {
    const input = makeInput({
      status: 'RE',
      firstFailingTest: {
        index: 2,
        stderr: "NameError: name 'x' is not defined",
      },
    });
    const result = analyzeDebugLoop(input, { attemptsSoFar: 0 });
    expect(result.errorCategory).toBe('RUNTIME_EXCEPTION');
    expect(result.feedback).toContain('NameError');
    expect(result.feedback).toContain('chưa được gán giá trị');
  });

  it('TLE -> TIMEOUT, nextStep gợi ý kiểm tra vòng lặp', () => {
    const input = makeInput({
      status: 'TLE',
      firstFailingTest: { index: 3, input: 'n=100000' },
    });
    const result = analyzeDebugLoop(input, { attemptsSoFar: 0 });
    expect(result.errorCategory).toBe('TIMEOUT');
    expect(result.nextStep).toMatch(/vòng lặp|độ phức tạp/);
  });

  it('WA với test công khai -> trích input/expected/actual thật, không bịa', () => {
    const result = analyzeDebugLoop(makeInput(), { attemptsSoFar: 0 });
    expect(result.errorCategory).toBe('WRONG_OUTPUT');
    expect(result.feedback).toContain('3 4');
    expect(result.feedback).toContain('7');
    expect(result.feedback).toContain('34');
    expect(result.evidence?.input).toBe('3 4');
    expect(result.evidence?.expectedOutput).toBe('7');
    expect(result.evidence?.actualOutput).toBe('34');
  });

  it('WA với test ẨN -> không lộ input/expected/actual của hidden test', () => {
    const input = makeInput({
      firstFailingTest: {
        index: 5,
        isHidden: true,
        input: 'BÍ MẬT',
        expectedOutput: 'BÍ MẬT',
        actualOutput: 'BÍ MẬT',
      },
    });
    const result = analyzeDebugLoop(input, { attemptsSoFar: 0 });
    expect(result.feedback).not.toContain('BÍ MẬT');
    expect(result.evidence?.input).toBeUndefined();
    expect(result.evidence?.expectedOutput).toBeUndefined();
    expect(result.evidence?.actualOutput).toBeUndefined();
    expect(result.evidence?.isHiddenTest).toBe(true);
  });
});

describe('analyzeDebugLoop — giới hạn vòng lặp', () => {
  it('loopCount tăng theo attemptsSoFar', () => {
    const result = analyzeDebugLoop(makeInput(), { attemptsSoFar: 2 });
    expect(result.loopCount).toBe(3);
  });

  it('chưa chạm giới hạn thì loopLimitReached=false', () => {
    const result = analyzeDebugLoop(makeInput(), { attemptsSoFar: 0 });
    expect(result.loopLimitReached).toBe(false);
  });

  it('chạm đúng MAX_DEBUG_LOOPS thì loopLimitReached=true và nextStep đổi hướng', () => {
    const result = analyzeDebugLoop(makeInput(), {
      attemptsSoFar: MAX_DEBUG_LOOPS - 1,
    });
    expect(result.loopCount).toBe(MAX_DEBUG_LOOPS);
    expect(result.loopLimitReached).toBe(true);
    expect(result.nextStep).toMatch(/giới hạn|người hướng dẫn/);
  });

  it('PASSED không bao giờ bị coi là chạm giới hạn dù attemptsSoFar rất lớn', () => {
    const result = analyzeDebugLoop(
      makeInput({ status: 'AC', firstFailingTest: undefined }),
      { attemptsSoFar: 999 },
    );
    expect(result.loopLimitReached).toBe(false);
  });

  it('có thể tuỳ chỉnh maxLoops qua tham số', () => {
    const result = analyzeDebugLoop(makeInput(), { attemptsSoFar: 1 }, 2);
    expect(result.loopCount).toBe(2);
    expect(result.loopLimitReached).toBe(true);
    expect(result.maxLoops).toBe(2);
  });
});
