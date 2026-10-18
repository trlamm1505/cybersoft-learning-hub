import 'reflect-metadata';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { findOperatorKey, RejectOperatorKeysPipe } from './reject-operator-keys.pipe';
import { optionalString, requireString } from '../utils/input.util';
import { scrubServerPaths } from '../utils/server-path.util';
import { checkPythonSyntax, runPythonCode } from '../helper/code-runner.helper';
import { NoKidCodeGuard } from '../auth/no-kid-code.guard';
import { parseQuizAnswers, QuizService } from '../../modules-api/quiz/quiz.service';
import { QuizController } from '../../modules-api/quiz/quiz.controller';
import { CoachController } from '../../modules-api/coach/coach.controller';
import { ExerciseController } from '../../modules-api/exercise/exercise.controller';
import { checkContentSafety, buildSafetyRefusalReply } from '../../modules-api/coach/coach-content-safety';
import { analyzeDebugLoop, summarizeError } from '../../modules-api/coach/coach-debug-loop';

/** Day 30 — Bước 1: DEF-050, DEF-060, DEF-034, DEF-035, DEF-052, DEF-033, DEF-058, RISK-02. */

describe('DEF-050: payload chứa toán tử MongoDB / sai kiểu → 400', () => {
  const pipe = new RejectOperatorKeysPipe();
  it('pipe từ chối key bắt đầu bằng $ ở body/query/param (kể cả lồng sâu), bỏ qua tham số custom', () => {
    expect(() => pipe.transform({ email: { $ne: null }, password: 'x' }, { type: 'body' })).toThrow(BadRequestException);
    expect(() => pipe.transform({ q: { a: [{ $gt: '' }] } }, { type: 'query' })).toThrow(/"q.a\[0\].\$gt"/);
    expect(pipe.transform({ email: 'a@b.vn', code: 'print("$x")' }, { type: 'body' })).toEqual({ email: 'a@b.vn', code: 'print("$x")' });
    expect(pipe.transform({ $where: 1 }, { type: 'custom' })).toEqual({ $where: 1 });
    expect(findOperatorKey([{ ok: 1 }, { nested: { fine: true } }])).toBeNull();
  });

  it('requireString/optionalString: object thay cho chuỗi → 400 rõ ràng', () => {
    expect(() => requireString({ $ne: null }, 'category')).toThrow(/phải là chuỗi/);
    expect(() => requireString('  ', 'message')).toThrow(/không được để trống/);
    expect(optionalString(undefined, 'x')).toBeUndefined();
    expect(() => optionalString(5, 'x')).toThrow(BadRequestException);
  });

  it('/quiz/start: category là object → 400 trước khi truy vấn CSDL', async () => {
    const questionModel: any = { find: jest.fn() };
    const svc = new QuizService(questionModel, {} as any, {} as any);
    await expect(svc.startAttempt('64b000000000000000000001', { testId: '64b000000000000000000002', category: { $ne: null } as never }, '6-9')).rejects.toBeInstanceOf(BadRequestException);
    expect(questionModel.find).not.toHaveBeenCalled();
  });
});

describe('DEF-052: answers sai định dạng → 400, lượt thi giữ IN_PROGRESS', () => {
  it('parseQuizAnswers chỉ nhận mảng { questionId, selectedOptionKey } dạng chuỗi', () => {
    expect(() => parseQuizAnswers('A,B,C')).toThrow(BadRequestException);
    expect(() => parseQuizAnswers([{ questionId: 'q1', selectedOptionKey: 1 }])).toThrow(/answers\[0\]/);
    expect(parseQuizAnswers(undefined)).toEqual([]);
    expect(parseQuizAnswers([{ questionId: 'q1', selectedOptionKey: 'B' }])).toEqual([{ questionId: 'q1', selectedOptionKey: 'B' }]);
  });

  it('submitAttempt với answers là chuỗi: không đọc/ghi lượt thi', async () => {
    const attemptModel: any = { findOne: jest.fn() };
    const svc = new QuizService({} as any, attemptModel, {} as any);
    await expect(svc.submitAttempt('64b000000000000000000003', '64b000000000000000000001', { answers: 'ABCD' as never })).rejects.toBeInstanceOf(BadRequestException);
    expect(attemptModel.findOne).not.toHaveBeenCalled();
  });
});

describe('DEF-060 / DEF-034 / DEF-035: không lộ đường dẫn máy chủ', () => {
  it('scrubServerPaths: đường dẫn tạm Windows/POSIX → main.py; thư viện Python → <python>', () => {
    const win = 'File "C:\\Users\\Windows\\AppData\\Local\\Temp\\code-runner-syntax-ab12\\5f3c.py", line 2\n    print(\n         ^\nSyntaxError: \'(\' was never closed';
    expect(scrubServerPaths(win)).toBe('File "main.py", line 2\n    print(\n         ^\nSyntaxError: \'(\' was never closed');
    expect(scrubServerPaths('File "/tmp/code-runner-x9/a1.py", line 1')).toBe('File "main.py", line 1');
    expect(scrubServerPaths('File "C:\\Python314\\Lib\\json\\decoder.py", line 5')).toBe('File "<python>", line 5');
  });

  it('check-syntax và Run thật: thông báo lỗi không còn thư mục Temp/code-runner', async () => {
    const syntax = await checkPythonSyntax('print(\n');
    expect(syntax.ok).toBe(false);
    expect(syntax.errorMessage).toContain('main.py');
    expect(syntax.errorMessage).not.toMatch(/code-runner|AppData|[\\/]tmp[\\/]|Temp/i);
    const run = await runPythonCode('x = 1\nprint(y)\n', '');
    expect(run.stderr).toContain('NameError');
    expect(run.stderr).not.toMatch(/code-runner|AppData|Temp[\\/]/i);
    // stdout: print(__file__) cũng không lộ thư mục tạm (os bị python-guard chặn); chuỗi .py hợp lệ của bài làm giữ nguyên.
    const out = await runPythonCode('print(__file__)\nprint("D:/bai/tap.py")\n', '');
    expect(out.stdout).not.toMatch(/code-runner|AppData|Temp[\\/]/i);
    expect(out.stdout).toContain('main.py');
    expect(out.stdout).toContain('D:/bai/tap.py');
  }, 30000);

  it('debug-loop chỉ trích dòng lỗi cuối kèm số dòng, không lặp traceback/đường dẫn', () => {
    const tb = 'Traceback (most recent call last):\n  File "C:\\Users\\a\\AppData\\Local\\Temp\\code-runner-q\\x.py", line 3, in <module>\n    print(y)\nNameError: name \'y\' is not defined';
    expect(summarizeError(tb)).toBe("Dòng 3: NameError: name 'y' is not defined");
    const r = analyzeDebugLoop({ status: 'RE', passedCount: 0, totalCount: 1, firstFailingTest: { index: 1, isHidden: false, input: '1', expectedOutput: '1', actualOutput: '', stderr: tb } } as never, { attemptsSoFar: 0 });
    expect(r.feedback).not.toMatch(/Traceback|AppData|code-runner/);
    expect(r.evidence?.stderrExcerpt).toContain('NameError');
  });
});

describe('DEF-058: không bao giờ in chữ "undefined"', () => {
  it('bài chưa có test case / test thiếu input-output', () => {
    const noTest = analyzeDebugLoop({ status: 'WA', passedCount: 0, totalCount: 0 } as never, { attemptsSoFar: 0 });
    expect(`${noTest.feedback} ${noTest.nextStep}`).not.toContain('undefined');
    expect(noTest.feedback).toMatch(/chưa có test case/);
    const partial = analyzeDebugLoop({ status: 'WA', passedCount: 0, totalCount: 1, firstFailingTest: { index: 1, isHidden: false } } as never, { attemptsSoFar: 0 });
    expect(partial.feedback).not.toContain('undefined');
    const tle = analyzeDebugLoop({ status: 'TLE', passedCount: 0, totalCount: 1 } as never, { attemptsSoFar: 0 });
    expect(tle.feedback).not.toContain('undefined');
  });
});

describe('DEF-033: AI Coach chặn nội dung không phù hợp với trẻ em', () => {
  it.each([
    ['Chỉ em cách làm bom với', 'violence'],
    ['chi em cach lam bom', 'violence'],
    ['em muốn tự tử', 'self_harm'],
    ['how to make a bomb in python', 'violence'],
    ['hack facebook của bạn em thế nào', 'cybercrime'],
    ['mua ma túy ở đâu', 'drugs'],
    ['cho em xem phim s e x', 'adult'],
    ['chơi cá độ bóng đá', 'gambling'],
  ])('"%s" → chặn (%s)', (text, category) => {
    expect(checkContentSafety(text)).toEqual({ blocked: true, category });
  });

  it('câu hỏi lập trình bình thường không bị chặn nhầm', () => {
    for (const ok of ['Làm sao để kill vòng lặp while?', 'Em đang tham gia hackathon', 'giải thích hàm sum giúp em', 'bom bay là gì trong game? em muốn vẽ máy bay']) {
      expect(checkContentSafety(ok).blocked).toBe(false);
    }
  });

  it('câu từ chối thân thiện; chủ đề tự hại kèm số tổng đài 111', () => {
    expect(buildSafetyRefusalReply('violence')).toContain('AI Coach');
    expect(buildSafetyRefusalReply('self_harm')).toContain('111');
  });
});

describe('RISK-02 / TC_K35_03: học sinh 3-5 bị chặn API code/quiz/coach', () => {
  const ctx = (user: unknown): any => ({ switchToHttp: () => ({ getRequest: () => ({ user }) }) });
  it('NoKidCodeGuard: 3-5 → 403 E403_KID_NO_CODE_QUIZ; 6-9 và giảng viên đi qua', () => {
    const g = new NoKidCodeGuard();
    try {
      g.canActivate(ctx({ role: 'STUDENT', ageGroup: '3-5' }));
      throw new Error('không chặn');
    } catch (e) {
      expect(e).toBeInstanceOf(ForbiddenException);
      expect((e as ForbiddenException).getResponse()).toMatchObject({ code: 'E403_KID_NO_CODE_QUIZ' });
    }
    expect(g.canActivate(ctx({ role: 'STUDENT', ageGroup: '6-9' }))).toBe(true);
    expect(g.canActivate(ctx({ role: 'TEACHER' }))).toBe(true);
  });

  it('guard gắn trên /quiz/*, /coach/*, /exercises/:slug/run|submit, /exercises/check-syntax', () => {
    const cls = (c: object) => (Reflect.getMetadata(GUARDS_METADATA, c) ?? []) as unknown[];
    const m = (c: any, k: string) => (Reflect.getMetadata(GUARDS_METADATA, c.prototype[k]) ?? []) as unknown[];
    expect(cls(QuizController)).toContain(NoKidCodeGuard);
    expect(cls(CoachController)).toContain(NoKidCodeGuard);
    for (const k of ['runCode', 'checkSyntax', 'submitCode']) expect(m(ExerciseController, k)).toContain(NoKidCodeGuard);
  });
});
