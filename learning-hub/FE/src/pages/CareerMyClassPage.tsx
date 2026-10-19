import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, GraduationCap, Loader2, UserRound } from 'lucide-react';
import studentClassesApi from '../axios/studentClassesApi';
import type { CareerCourse, CareerItemState, CareerLabItem } from '../types/careerCourses';
import { ENROLLMENT_STATUS_LABEL, ENROLLMENT_STATUS_TONE } from '../common/enrollmentFormat';
import { formatSubmittedAt } from '../components/SubmissionHistory';
import { CourseCertificateModal } from '../components/profile/CourseCertificateModal';
import type { EnrollmentCertificate } from '../types/studentClasses';

export const NO_FEEDBACK_TEXT = 'Chưa có nhận xét';

export const itemStateLabel = (i: Pick<CareerLabItem, 'state' | 'score' | 'maxScore'>): string => {
  const map: Record<CareerItemState, string> = {
    DONE: `✅ Hoàn thành (${i.score ?? 0}/${i.maxScore})`,
    PENDING: '🟡 Chờ chấm',
    IN_PROGRESS: '🔵 Đang làm (chưa đạt)',
    NOT_STARTED: 'Chưa làm',
  };
  return map[i.state];
};

export const itemActionLabel = (state: CareerItemState): string => (state === 'NOT_STARTED' ? 'Làm bài' : 'Làm lại');

/** Nhận xét hiển thị: của giảng viên, hoặc "Hệ thống: ..." với bài chấm tự động; chưa có thì báo "Chưa có nhận xét". */
export const feedbackText = (i: Pick<CareerLabItem, 'feedback' | 'feedbackBy'>): string => {
  if (!i.feedback) return NO_FEEDBACK_TEXT;
  return i.feedbackBy === 'SYSTEM' ? `Hệ thống: ${i.feedback}` : i.feedback;
};

/** Cột chi tiết: tên khóa, giảng viên, tỷ lệ hoàn thành, bảng bài lab kèm lịch sử và nhận xét. */
export const CareerCourseDetail: React.FC<{ course: CareerCourse; onViewCertificate?: (c: EnrollmentCertificate) => void }> = ({
  course,
  onViewCertificate,
}) => (
  <section aria-label={course.title} className="space-y-4" data-testid="career-course-detail">
    <header className="space-y-2 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="text-lg font-extrabold text-[var(--text-main)]">{course.title}</h2>
        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${ENROLLMENT_STATUS_TONE[course.status]}`}>{ENROLLMENT_STATUS_LABEL[course.status]}</span>
      </div>
      <p className="flex items-center gap-1.5 text-sm text-[var(--text-muted)]">
        <UserRound size={14} /> Giảng viên phụ trách: <b className="text-[var(--text-main)]">{course.teacherName ?? 'Chưa phân công'}</b>
      </p>
      <div>
        <div className="mb-1 flex justify-between text-xs text-[var(--text-muted)]">
          <span>Tỷ lệ hoàn thành</span>
          <span className="font-mono font-semibold text-[var(--text-main)]">
            {course.doneItems}/{course.totalItems} bài · {course.percent}%
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[var(--border-color)]" role="progressbar" aria-valuenow={course.percent} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${course.percent}%` }} />
        </div>
      </div>
      {course.certificate && onViewCertificate && (
        <button
          type="button"
          onClick={() => onViewCertificate(course.certificate as EnrollmentCertificate)}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-300"
        >
          <Eye size={14} /> Xem chứng chỉ hoàn thành
        </button>
      )}
    </header>

    <div className="overflow-x-auto rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)]">
      <table className="min-w-full text-sm">
        <thead className="bg-[var(--bg-main)]">
          <tr className="text-left text-xs font-semibold text-[var(--text-main)]">
            {['Bài lab / Bài tập', 'Trạng thái & Điểm số', 'Nộp gần nhất', 'Nhận xét của Giảng viên'].map((h) => (
              <th key={h} className="whitespace-nowrap px-3 py-2">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {course.items.length === 0 && (
            <tr>
              <td colSpan={4} className="px-3 py-6 text-center text-[var(--text-muted)]">
                Khóa học chưa có bài lab nào.
              </td>
            </tr>
          )}
          {course.items.map((i) => (
            <tr key={i.ref} className="border-t border-[var(--border-color)] align-top text-[var(--text-main)]">
              <td className="px-3 py-2.5">
                <div className="font-semibold">{i.title}</div>
                <Link
                  to={i.path}
                  className="mt-1.5 inline-block rounded-lg bg-indigo-600 px-3 py-1 text-xs font-bold text-white no-underline hover:bg-indigo-500"
                >
                  {itemActionLabel(i.state)}
                </Link>
              </td>
              <td className="whitespace-nowrap px-3 py-2.5">{itemStateLabel(i)}</td>
              <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs">{i.lastSubmittedAt ? formatSubmittedAt(i.lastSubmittedAt) : '—'}</td>
              <td className={`px-3 py-2.5 text-xs ${i.feedback ? '' : 'italic text-[var(--text-muted)]'}`}>{feedbackText(i)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);

/** "Lớp học của tôi" cho Người đi làm / Trái ngành: bố cục 2 cột (danh sách khóa ~30% | chi tiết & lịch sử ~70%). */
export const CareerMyClassPage: React.FC = () => {
  const [courses, setCourses] = useState<CareerCourse[]>([]);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [certificate, setCertificate] = useState<EnrollmentCertificate | null>(null);

  useEffect(() => {
    let cancelled = false;
    studentClassesApi
      .getCareerCourses()
      .then((res) => {
        if (cancelled) return;
        setCourses(res);
        setActiveKey(res[0]?.key ?? null);
      })
      .catch(() => !cancelled && setError('Không tải được danh sách khóa học. Vui lòng thử lại sau.'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <p className="flex items-center justify-center py-20 text-sm text-[var(--text-muted)]">
        <Loader2 size={16} className="mr-2 animate-spin" /> Đang tải khóa học...
      </p>
    );
  }
  if (error) return <p className="py-10 text-center text-sm text-rose-500">{error}</p>;

  const active = courses.find((c) => c.key === activeKey) ?? courses[0];

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <h1 className="flex items-center gap-2 text-2xl font-black text-[var(--text-main)]">
        <GraduationCap size={24} /> Lớp học của tôi
      </h1>
      <div className="grid gap-5 lg:grid-cols-10">
        <aside aria-label="Khóa học được gán" className="space-y-2 lg:col-span-3">
          {courses.map((c) => {
            const on = c.key === active?.key;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setActiveKey(c.key)}
                aria-current={on ? 'true' : undefined}
                className={`w-full cursor-pointer rounded-2xl border p-4 text-left transition-colors ${
                  on ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40' : 'border-[var(--border-color)] bg-[var(--bg-card)] hover:border-indigo-300'
                }`}
              >
                <div className="text-sm font-bold leading-snug text-[var(--text-main)]">{c.title}</div>
                <div className="mt-1.5 text-xs text-[var(--text-muted)]">
                  Đã làm {c.attemptedItems}/{c.totalItems} bài
                </div>
                <span className={`mt-2 inline-block rounded-full border px-2 py-0.5 text-[11px] font-semibold ${ENROLLMENT_STATUS_TONE[c.status]}`}>{ENROLLMENT_STATUS_LABEL[c.status]}</span>
              </button>
            );
          })}
        </aside>
        <div className="lg:col-span-7">{active && <CareerCourseDetail course={active} onViewCertificate={setCertificate} />}</div>
      </div>
      {certificate && <CourseCertificateModal certificate={certificate} onClose={() => setCertificate(null)} />}
    </div>
  );
};

export default CareerMyClassPage;
