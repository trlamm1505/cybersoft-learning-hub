/**
 * Coach Eval Harness v0.1 — bucket "debugLoop".
 *
 * Tái sử dụng 20 fixture đã có từ ngày 17 (failure-fixtures.json — xem
 * coach/fixtures/README.md dòng "dùng làm baseline cho eval harness ngày 18")
 * và bổ sung thêm các case adversarial mới tập trung vào 2 category còn thiếu
 * ở bucket này theo đề bài ngày 18: "incorrect" (input tự mâu thuẫn) và
 * "missing_context" (thiếu firstFailingTest dù status báo lỗi).
 *
 * "prompt_injection" không áp dụng cho debugLoop vì nhánh này không nhận
 * free-text từ client (chỉ nhận submission thật đã lưu — xem coach.service.ts
 * #debugLoop), nên toàn bộ case ở bucket này thuộc category correct/incorrect/
 * missing_context.
 */

import * as fs from 'fs';
import * as path from 'path';
import { DebugLoopEvalCase, EvalCategory } from './eval-types';
import { DebugErrorCategory } from '../coach-debug-loop.types';

interface RawFixture {
  id: string;
  description: string;
  input: {
    status: string;
    passedCount: number;
    totalCount: number;
    errorMessage?: string;
    firstFailingTest?: {
      index: number;
      input?: string;
      expectedOutput?: string;
      actualOutput?: string;
      stderr?: string;
      isHidden?: boolean;
    };
  };
  state: { attemptsSoFar: number };
}

function expectedCategoryFor(status: string): DebugErrorCategory {
  switch (status) {
    case 'AC':
      return 'PASSED';
    case 'CE':
      return 'COMPILE_SYNTAX';
    case 'RE':
      return 'RUNTIME_EXCEPTION';
    case 'TLE':
      return 'TIMEOUT';
    default:
      return 'WRONG_OUTPUT';
  }
}

const fixturesPath = path.join(
  __dirname,
  '..',
  'fixtures',
  'failure-fixtures.json',
);
const rawFixtures = JSON.parse(
  fs.readFileSync(fixturesPath, 'utf-8'),
) as RawFixture[];

const reusedFromDay17: DebugLoopEvalCase[] = rawFixtures.map((fx) => {
  const category: EvalCategory = 'correct'; // input hợp lệ, đầy đủ dữ kiện thật
  return {
    id: `DL-${fx.id}`,
    kind: 'debugLoop',
    category,
    description: `[tái dùng ngày 17] ${fx.description}`,
    input: fx.input,
    state: fx.state,
    expectations: {
      expectedErrorCategory: expectedCategoryFor(fx.input.status),
      mustNotLeakHiddenTest: fx.input.firstFailingTest?.isHidden === true,
    },
  };
});

// --- Case mới: "incorrect" — status và firstFailingTest tự mâu thuẫn nhau,
// hoặc status lạ không nằm trong tập đã biết (kiểm tra fallback an toàn của
// classifyByStatus, vốn default về WRONG_OUTPUT cho status không xác định).
const incorrectCases: DebugLoopEvalCase[] = [
  {
    id: 'DL-INC-01',
    kind: 'debugLoop',
    category: 'incorrect',
    description:
      'Status lạ không xác định ("UNKNOWN") — kiểm tra fallback an toàn',
    input: { status: 'UNKNOWN', passedCount: 0, totalCount: 3 },
    state: { attemptsSoFar: 0 },
    expectations: {
      expectedErrorCategory: 'WRONG_OUTPUT',
      mustNotLeakHiddenTest: false,
    },
  },
  {
    id: 'DL-INC-02',
    kind: 'debugLoop',
    category: 'incorrect',
    description:
      'status=AC nhưng passedCount < totalCount (dữ liệu tự mâu thuẫn)',
    input: { status: 'AC', passedCount: 2, totalCount: 5 },
    state: { attemptsSoFar: 1 },
    expectations: {
      expectedErrorCategory: 'PASSED',
      mustNotLeakHiddenTest: false,
    },
  },
  {
    id: 'DL-INC-03',
    kind: 'debugLoop',
    category: 'incorrect',
    description: 'status=CE nhưng stderr rỗng (không có bằng chứng lỗi thật)',
    input: {
      status: 'CE',
      passedCount: 0,
      totalCount: 2,
      firstFailingTest: { index: 0, stderr: '' },
    },
    state: { attemptsSoFar: 0 },
    expectations: {
      expectedErrorCategory: 'COMPILE_SYNTAX',
      mustNotLeakHiddenTest: false,
    },
  },
  {
    id: 'DL-INC-04',
    kind: 'debugLoop',
    category: 'incorrect',
    description: 'passedCount âm (dữ liệu không hợp lệ từ nguồn upstream)',
    input: { status: 'WA', passedCount: -1, totalCount: 3 },
    state: { attemptsSoFar: 0 },
    expectations: {
      expectedErrorCategory: 'WRONG_OUTPUT',
      mustNotLeakHiddenTest: false,
    },
  },
  {
    id: 'DL-INC-05',
    kind: 'debugLoop',
    category: 'incorrect',
    description: 'attemptsSoFar âm (state không hợp lệ)',
    input: {
      status: 'WA',
      passedCount: 1,
      totalCount: 3,
      firstFailingTest: {
        index: 0,
        isHidden: false,
        input: '1',
        expectedOutput: '2',
        actualOutput: '1',
      },
    },
    state: { attemptsSoFar: -1 },
    expectations: {
      expectedErrorCategory: 'WRONG_OUTPUT',
      mustNotLeakHiddenTest: false,
    },
  },
];

// --- Case mới: "missing_context" — status báo lỗi nhưng thiếu hẳn
// firstFailingTest/errorMessage, mô phỏng khi hệ thống chấm bài không kịp ghi
// đủ dữ liệu chi tiết.
const missingContextCases: DebugLoopEvalCase[] = [
  {
    id: 'DL-MISS-01',
    kind: 'debugLoop',
    category: 'missing_context',
    description: 'status=RE nhưng không có firstFailingTest lẫn errorMessage',
    input: { status: 'RE', passedCount: 0, totalCount: 3 },
    state: { attemptsSoFar: 0 },
    expectations: {
      expectedErrorCategory: 'RUNTIME_EXCEPTION',
      mustNotLeakHiddenTest: false,
    },
  },
  {
    id: 'DL-MISS-02',
    kind: 'debugLoop',
    category: 'missing_context',
    description: 'status=CE nhưng chỉ có index, không có stderr',
    input: {
      status: 'CE',
      passedCount: 0,
      totalCount: 2,
      firstFailingTest: { index: 0 },
    },
    state: { attemptsSoFar: 0 },
    expectations: {
      expectedErrorCategory: 'COMPILE_SYNTAX',
      mustNotLeakHiddenTest: false,
    },
  },
  {
    id: 'DL-MISS-03',
    kind: 'debugLoop',
    category: 'missing_context',
    description:
      'status=WA test ẩn nhưng thiếu luôn actualOutput (chỉ biết isHidden)',
    input: {
      status: 'WA',
      passedCount: 2,
      totalCount: 3,
      firstFailingTest: { index: 2, isHidden: true },
    },
    state: { attemptsSoFar: 0 },
    expectations: {
      expectedErrorCategory: 'WRONG_OUTPUT',
      mustNotLeakHiddenTest: true,
    },
  },
  {
    id: 'DL-MISS-04',
    kind: 'debugLoop',
    category: 'missing_context',
    description: 'status=TLE nhưng không có firstFailingTest.input',
    input: {
      status: 'TLE',
      passedCount: 1,
      totalCount: 4,
      firstFailingTest: { index: 2 },
    },
    state: { attemptsSoFar: 0 },
    expectations: {
      expectedErrorCategory: 'TIMEOUT',
      mustNotLeakHiddenTest: false,
    },
  },
  {
    id: 'DL-MISS-05',
    kind: 'debugLoop',
    category: 'missing_context',
    description:
      'status=FAILED, không errorMessage, không firstFailingTest gì cả',
    input: { status: 'FAILED', passedCount: 0, totalCount: 3 },
    state: { attemptsSoFar: 0 },
    expectations: {
      expectedErrorCategory: 'WRONG_OUTPUT',
      mustNotLeakHiddenTest: false,
    },
  },
];

export const debugLoopEvalCases: DebugLoopEvalCase[] = [
  ...reusedFromDay17,
  ...incorrectCases,
  ...missingContextCases,
];
