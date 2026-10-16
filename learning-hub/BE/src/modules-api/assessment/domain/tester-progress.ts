import { TESTER_RUBRIC } from './tester-rubric';

/** Khóa khóa học Tester QA (Career Adult) và mã lớp mặc định của khóa. */
export const TESTER_COURSE_KEY = 'tester-qa';
export const TESTER_CLASS_CODE = 'CL-CAREER-TESTER';

/** Lớp Tester QA: lớp khóa học tester-qa hoặc mang mã CL-CAREER-TESTER. Chương trình gồm các Lab cố định, không giao bài và không giám sát out-tab. */
export const isTesterClass = (cls: { courseKey?: string | null; code?: string | null } | null | undefined): boolean =>
  !!cls && (cls.courseKey === TESTER_COURSE_KEY || cls.code === TESTER_CLASS_CODE);

/** Ba khóa Career Adult: Tester QA, Data SQL Lab, AI Prompt Lab. */
export const CAREER_COURSE_KEYS = ['tester-qa', 'data-sql', 'ai-prompt'] as const;
export type CareerCourseKey = (typeof CAREER_COURSE_KEYS)[number];

/** Lớp khóa Career (có courseKey hoặc mã CL-CAREER-*): học theo Lab cố định, không giao bài lẻ, không đo out-tab. */
export const isCareerCourseClass = (cls: { courseKey?: string | null; code?: string | null } | null | undefined): boolean =>
  !!cls && (!!cls.courseKey || /^CL-CAREER-/i.test(cls.code ?? ''));

/** Lớp Data SQL / AI Prompt: Lab tự chấm trên sandbox, giảng viên chỉ theo dõi. */
export const isSandboxCareerClass = (cls: { courseKey?: string | null } | null | undefined): boolean => cls?.courseKey === 'data-sql' || cls?.courseKey === 'ai-prompt';

/** Khối được dùng AI Tạo Đề (sinh bài tập code): chỉ lớp phổ thông khối 6-9 và 10-12. */
export const AI_GENERATOR_BANDS: ReadonlySet<string> = new Set(['6-9', '10-12']);

/** Giảng viên dùng được AI Tạo Đề khi đang phụ trách ít nhất một lớp khối 6-9 hoặc 10-12 còn hoạt động. */
export const canUseAiGenerator = (classes: Array<{ ageGroup?: string | null; archived?: boolean; status?: string; courseKey?: string | null }>): boolean =>
  classes.some((c) => !!c.ageGroup && AI_GENERATOR_BANDS.has(c.ageGroup) && !c.courseKey && c.archived !== true && c.status !== 'ARCHIVED');

export type TesterRating = 'EXCELLENT' | 'GOOD' | 'PASS' | 'NEEDS_WORK' | 'NONE';

export const TESTER_RATING_LABEL: Record<TesterRating, string> = {
  EXCELLENT: 'Xuất sắc',
  GOOD: 'Khá',
  PASS: 'Đạt',
  NEEDS_WORK: 'Cần cải thiện',
  NONE: 'Chưa có điểm',
};

/** Xếp loại theo điểm trung bình thang 100: >= 85 Xuất sắc, >= 70 Khá, >= 50 Đạt, còn lại Cần cải thiện; chưa chấm bài nào thì chưa xếp loại. */
export function testerRating(avg: number | null): TesterRating {
  if (avg === null) return 'NONE';
  if (avg >= 85) return 'EXCELLENT';
  if (avg >= 70) return 'GOOD';
  if (avg >= 50) return 'PASS';
  return 'NEEDS_WORK';
}

export interface TesterSubmissionLite {
  labId: string;
  status: 'SUBMITTED' | 'REVIEWED';
  invalidated?: boolean;
  rubricGrades?: Array<{ key: string; score: number }>;
}

/** Rubric 10 điểm đời đầu (5 tiêu chí x 2 điểm): bài đã chấm trước khi có rubric chuẩn vẫn được tính, quy về thang 100. */
const LEGACY_KEYS = ['scope-design', 'actual-expected', 'evidence', 'severity-result', 'cleanup'];
const LEGACY_MAX = 10;

/**
 * Tổng điểm một bài (thang 100) = tổng điểm 3 tiêu chí chuẩn; bài chấm theo rubric 10 điểm cũ được nhân 10; null nếu chưa chấm hoặc chấm thiếu.
 */
export function submissionTotal(grades: Array<{ key: string; score: number }> | undefined): number | null {
  if (!grades || grades.length === 0) return null;
  const known = new Set(TESTER_RUBRIC.map((c) => c.key));
  const rel = grades.filter((g) => known.has(g.key));
  if (rel.length === TESTER_RUBRIC.length) return rel.reduce((s, g) => s + g.score, 0);
  const legacy = grades.filter((g) => LEGACY_KEYS.includes(g.key));
  if (legacy.length === LEGACY_KEYS.length) {
    const sum = legacy.reduce((s, g) => s + g.score, 0);
    return Math.min(100, Math.round((sum / LEGACY_MAX) * 100));
  }
  return null;
}

export interface TesterStudentSummary {
  labsCompleted: number;
  labsTotal: number;
  /** Trung bình điểm tốt nhất của từng Lab đã hoàn thành; null khi chưa có Lab nào được chấm. */
  avgScore: number | null;
  rating: TesterRating;
  pending: number;
}

/**
 * Tổng hợp tiến độ một học viên từ chính các bài nộp Tester Lab của họ (không có bảng tổng hợp riêng):
 * một Lab được tính hoàn thành khi có ít nhất một bài đã chấm (REVIEWED, chưa bị hủy); điểm của Lab là điểm cao nhất trong các lần nộp.
 */
export function summarizeTesterStudent(subs: TesterSubmissionLite[], labsTotal: number): TesterStudentSummary {
  const best = new Map<string, number>();
  let pending = 0;
  for (const s of subs) {
    if (s.invalidated) continue;
    if (s.status === 'SUBMITTED') pending++;
    if (s.status !== 'REVIEWED') continue;
    const total = submissionTotal(s.rubricGrades);
    if (total === null) continue;
    best.set(s.labId, Math.max(best.get(s.labId) ?? 0, total));
  }
  const scores = [...best.values()];
  const avgScore = scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : null;
  return { labsCompleted: best.size, labsTotal, avgScore, rating: testerRating(avgScore), pending };
}
