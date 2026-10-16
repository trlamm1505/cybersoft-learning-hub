import { certificateCode, gradeOf } from '../class-assignments/class-completion';
import type { Grade, EnrollmentStatus } from '../class-assignments/class-completion';

/**
 * Khóa học chuyên ngành của Người đi làm / Trái ngành (CAREER_ADULT). Mỗi phòng lab là một khóa học; mỗi bài lab là một bài
 * của khóa. Hàm thuần (không đụng CSDL) để kiểm thử độc lập: service chỉ việc gom dữ liệu thật rồi gọi buildCareerCourses.
 */
export type CareerCourseKey = 'tester-qa' | 'data-sql' | 'ai-prompt';

export const CAREER_COURSES: Array<{ key: CareerCourseKey; title: string; hubPath: string; certKey: string }> = [
  { key: 'tester-qa', title: 'Kiểm thử phần mềm thực chiến (Tester QA)', hubPath: '/tester-labs', certKey: 'TESTERQA' },
  { key: 'data-sql', title: 'Phân tích dữ liệu & Truy vấn SQL (Data Lab)', hubPath: '/da-labs', certKey: 'DATASQL' },
  { key: 'ai-prompt', title: 'Kỹ nghệ Prompt & Ứng dụng AI (AI Lab)', hubPath: '/ai-labs', certKey: 'AIPROMPT' },
];

/** Trạng thái một bài lab của học viên. */
export type LabItemState = 'DONE' | 'PENDING' | 'IN_PROGRESS' | 'NOT_STARTED';

export interface CareerLabItemInput {
  courseKey: CareerCourseKey;
  /** Mã/slug dùng dựng đường dẫn vào bài. */
  ref: string;
  title: string;
  maxScore: number;
  order: number;
  /** Lần nộp gần nhất của học viên (null nếu chưa nộp). */
  latest: null | {
    state: Exclude<LabItemState, 'NOT_STARTED'>;
    score: number;
    maxScore?: number;
    submittedAt: Date | null;
    feedback: string | null;
    /** Nhận xét do giảng viên viết hay do hệ thống chấm tự động. */
    feedbackBy: 'TEACHER' | 'SYSTEM' | null;
    attempts: number;
  };
}

export interface CareerLabItem {
  ref: string;
  title: string;
  path: string;
  state: LabItemState;
  score: number | null;
  maxScore: number;
  lastSubmittedAt: Date | null;
  feedback: string | null;
  feedbackBy: 'TEACHER' | 'SYSTEM' | null;
  attempts: number;
}

export interface CareerCertificate {
  studentName: string;
  className: string;
  teacherName: string | null;
  finalScore: number;
  earned: number;
  max: number;
  grade: Grade;
  completedAt: Date;
  code: string;
}

export interface CareerCourse {
  key: CareerCourseKey;
  title: string;
  hubPath: string;
  teacherName: string | null;
  status: EnrollmentStatus;
  totalItems: number;
  /** Số bài đã làm (đã nộp ít nhất một lần). */
  attemptedItems: number;
  /** Số bài đã hoàn thành. */
  doneItems: number;
  /** Tỷ lệ hoàn thành theo số bài đã hoàn thành. */
  percent: number;
  earned: number;
  max: number;
  items: CareerLabItem[];
  certificate: CareerCertificate | null;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function buildCareerCourses(args: {
  items: CareerLabItemInput[];
  userId: string;
  studentName: string;
  teacherNames: Partial<Record<CareerCourseKey, string | null>>;
}): CareerCourse[] {
  return CAREER_COURSES.map((def) => {
    const items: CareerLabItem[] = args.items
      .filter((i) => i.courseKey === def.key)
      .sort((a, b) => a.order - b.order)
      .map((i) => ({
        ref: i.ref,
        title: i.title,
        path: `${def.hubPath}/${encodeURIComponent(i.ref)}`,
        state: i.latest?.state ?? 'NOT_STARTED',
        score: i.latest && i.latest.state === 'DONE' ? i.latest.score : null,
        maxScore: i.latest?.maxScore ?? i.maxScore,
        lastSubmittedAt: i.latest?.submittedAt ?? null,
        feedback: i.latest?.feedback ?? null,
        feedbackBy: i.latest?.feedbackBy ?? null,
        attempts: i.latest?.attempts ?? 0,
      }));

    const done = items.filter((i) => i.state === 'DONE');
    const earned = round1(done.reduce((s, i) => s + (i.score ?? 0), 0));
    const max = done.reduce((s, i) => s + i.maxScore, 0);
    const finalScore = max > 0 ? Math.round((earned / max) * 1000) / 10 : 0;
    const allDone = items.length > 0 && done.length === items.length;
    const grade = allDone ? gradeOf(finalScore) : null;
    const status: EnrollmentStatus = !allDone ? 'IN_PROGRESS' : grade ? 'COMPLETED' : 'ENDED';

    let completedAt: Date | null = null;
    if (allDone) {
      for (const i of items) {
        if (i.lastSubmittedAt && (!completedAt || i.lastSubmittedAt > completedAt)) completedAt = i.lastSubmittedAt;
      }
    }
    const teacherName = args.teacherNames[def.key] ?? null;
    const certificate: CareerCertificate | null =
      status === 'COMPLETED' && grade && completedAt
        ? {
            studentName: args.studentName,
            className: def.title,
            teacherName,
            finalScore,
            earned,
            max,
            grade,
            completedAt,
            code: certificateCode(def.certKey, def.key, args.userId, completedAt),
          }
        : null;

    return {
      key: def.key,
      title: def.title,
      hubPath: def.hubPath,
      teacherName,
      status,
      totalItems: items.length,
      attemptedItems: items.filter((i) => i.state !== 'NOT_STARTED').length,
      doneItems: done.length,
      percent: items.length ? Math.round((done.length / items.length) * 100) : 0,
      earned,
      max,
      items,
      certificate,
    };
  });
}

/** Chứng chỉ đã cấp và lưu vĩnh viễn (collection course_certificates). */
export interface IssuedCertificate {
  courseKey: string;
  studentName: string;
  courseTitle: string;
  teacherName?: string | null;
  finalScore: number;
  earned: number;
  max: number;
  grade: Grade;
  completedAt: Date;
  code: string;
}

/**
 * Áp chứng chỉ ĐÃ CẤP lên danh sách khóa: có chứng chỉ đã cấp thì luôn dùng đúng bản đó (mã, ngày cấp, điểm, xếp loại gốc) và khóa
 * giữ trạng thái "Đã hoàn thành" dù sau này có thêm bài lab mới. Chỉ tiến độ (số bài, %) vẫn tính theo dữ liệu hiện tại.
 */
export function applyIssuedCertificates(courses: CareerCourse[], issued: IssuedCertificate[]): CareerCourse[] {
  const byKey = new Map(issued.map((c) => [c.courseKey, c]));
  return courses.map((course) => {
    const cert = byKey.get(course.key);
    if (!cert) return course;
    return {
      ...course,
      status: 'COMPLETED',
      certificate: {
        studentName: cert.studentName,
        className: cert.courseTitle,
        teacherName: cert.teacherName ?? null,
        finalScore: cert.finalScore,
        earned: cert.earned,
        max: cert.max,
        grade: cert.grade,
        completedAt: cert.completedAt,
        code: cert.code,
      },
    };
  });
}

/** Dạng MyEnrollment mà trang Hồ sơ đang dùng cho "Lớp học / Khóa học đã tham gia". */
export function careerCoursesToEnrollments(courses: CareerCourse[]) {
  return courses.map((c) => ({
    classId: c.key,
    className: c.title,
    classCode: null,
    teacherName: c.teacherName,
    status: c.status,
    totalAssignments: c.totalItems,
    doneCount: c.doneItems,
    earned: c.earned,
    max: c.max,
    percent: c.percent,
    certificate: c.certificate,
  }));
}
