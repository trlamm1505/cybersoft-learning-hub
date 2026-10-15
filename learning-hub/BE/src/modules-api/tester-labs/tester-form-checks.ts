import { BadRequestException } from '@nestjs/common';
import type { AutoCheckResult } from '../../modules-system/database/schemas/tester-lab-submission.schema';

export const MAX_TEST_CASES = 100;
export const MAX_BUG_REPORTS = 30;
export const MIN_TEST_CASES = 5;
const MAX_FIELD = 1000;
export const BUG_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

export interface TesterTestCase {
  code: string;
  description: string;
  input: string;
  expected: string;
}

export interface TesterBugReport {
  title: string;
  steps: string;
  expected: string;
  actual: string;
  severity: (typeof BUG_SEVERITIES)[number];
}

export interface TesterFormData {
  testCases: TesterTestCase[];
  bugReports: TesterBugReport[];
}

const str = (v: unknown, max = MAX_FIELD): string => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** Chuẩn hóa dữ liệu biểu mẫu do client gửi (không tin kiểu dữ liệu, cắt độ dài, giới hạn số dòng). */
export function sanitizeTesterForm(raw: unknown): TesterFormData {
  const body = (raw ?? {}) as { testCases?: unknown; bugReports?: unknown };
  const rawCases = Array.isArray(body.testCases) ? body.testCases : [];
  const rawBugs = Array.isArray(body.bugReports) ? body.bugReports : [];
  if (rawCases.length > MAX_TEST_CASES || rawBugs.length > MAX_BUG_REPORTS) {
    throw new BadRequestException(`Tối đa ${MAX_TEST_CASES} test case và ${MAX_BUG_REPORTS} bug report mỗi bài nộp.`);
  }
  const testCases = rawCases
    .map((c: any) => ({ code: str(c?.code, 30), description: str(c?.description), input: str(c?.input), expected: str(c?.expected) }))
    .filter((c) => c.code || c.description || c.input || c.expected);
  const bugReports = rawBugs
    .map((b: any) => ({
      title: str(b?.title, 200),
      steps: str(b?.steps, 3000),
      expected: str(b?.expected),
      actual: str(b?.actual),
      severity: (BUG_SEVERITIES as readonly string[]).includes(b?.severity) ? b.severity : 'MEDIUM',
    }))
    .filter((b) => b.title || b.steps || b.expected || b.actual);
  if (testCases.length === 0 && bugReports.length === 0) {
    throw new BadRequestException('Hãy nhập ít nhất một test case hoặc một bug report trước khi nộp.');
  }
  return { testCases, bugReports };
}

/** Nhóm từ khóa của các tình huống biên (edge case) mà bài tester nên có. */
export const EDGE_CASE_GROUPS: Array<{ id: string; label: string; pattern: RegExp }> = [
  { id: 'empty', label: 'Dữ liệu rỗng / để trống / null', pattern: /(rỗng|để trống|bỏ trống|trống|null|empty|blank)/i },
  { id: 'boundary', label: 'Giá trị biên (min/max, 0, âm, giới hạn)', pattern: /(biên|boundary|giới hạn|tối đa|tối thiểu|\bmax\b|\bmin\b|âm|\b0\b|lớn nhất|nhỏ nhất)/i },
  { id: 'invalid', label: 'Định dạng sai / không hợp lệ', pattern: /(sai định dạng|không hợp lệ|invalid|định dạng sai|malformed|sai kiểu)/i },
  { id: 'special', label: 'Ký tự đặc biệt / XSS / SQL injection', pattern: /(ký tự đặc biệt|đặc biệt|special|unicode|emoji|<script|xss|sql injection|' or |injection)/i },
  { id: 'duplicate', label: 'Dữ liệu trùng lặp', pattern: /(trùng|đã tồn tại|duplicate|already exists)/i },
  { id: 'long', label: 'Chuỗi quá dài / quá nhiều dữ liệu', pattern: /(quá dài|rất dài|dài nhất|vượt quá|too long|overflow)/i },
];

/**
 * Kiểm tra nhanh biểu mẫu Tester Lab bằng luật/từ khóa để cho nhận xét sơ bộ NGAY khi nộp. Chỉ là gợi ý cho học viên
 * và giảng viên: điểm chính thức do giảng viên chấm theo rubric.
 */
export function runFormChecks(form: TesterFormData): AutoCheckResult[] {
  const results: AutoCheckResult[] = [];
  const cases = form.testCases;

  const complete = cases.filter((c) => c.code && c.description && c.input && c.expected);
  results.push({
    check: 'test-case-count',
    passed: complete.length >= MIN_TEST_CASES,
    message:
      complete.length >= MIN_TEST_CASES
        ? `Có ${complete.length} test case đầy đủ (mã, mô tả, input, expected).`
        : `Mới có ${complete.length} test case đầy đủ; nên có ít nhất ${MIN_TEST_CASES} (mỗi test case cần đủ mã, mô tả, input và expected output).`,
  });

  const incomplete = cases.length - complete.length;
  if (incomplete > 0) {
    results.push({ check: 'test-case-complete', passed: false, message: `${incomplete} test case còn thiếu trường (mã/mô tả/input/expected).` });
  }

  const codes = cases.map((c) => c.code.toLowerCase()).filter(Boolean);
  const dup = codes.filter((c, i) => codes.indexOf(c) !== i);
  if (dup.length > 0) {
    results.push({ check: 'test-case-unique', passed: false, message: `Mã test case bị trùng: ${[...new Set(dup)].join(', ')}.` });
  }

  const blob = cases.map((c) => `${c.description} ${c.input}`).join('\n');
  for (const g of EDGE_CASE_GROUPS) {
    const hit = g.pattern.test(blob);
    results.push({
      check: `edge-${g.id}`,
      passed: hit,
      message: hit ? `Có test tình huống biên: ${g.label}.` : `Chưa thấy test tình huống biên: ${g.label}.`,
    });
  }

  if (form.bugReports.length === 0) {
    results.push({ check: 'bug-report', passed: false, message: 'Chưa có bug report nào.' });
  } else {
    form.bugReports.forEach((b, i) => {
      const steps = b.steps.split(/\n+/).filter((s) => s.trim()).length;
      const missing = [!b.title && 'tiêu đề', steps < 2 && 'các bước tái hiện (ít nhất 2 bước)', !b.expected && 'kết quả mong đợi', !b.actual && 'kết quả thực tế'].filter(Boolean);
      results.push({
        check: `bug-report-${i + 1}`,
        passed: missing.length === 0,
        message: missing.length === 0 ? `Bug report #${i + 1} đầy đủ (tiêu đề, bước tái hiện, mong đợi, thực tế).` : `Bug report #${i + 1} còn thiếu: ${missing.join(', ')}.`,
      });
    });
  }
  return results;
}
