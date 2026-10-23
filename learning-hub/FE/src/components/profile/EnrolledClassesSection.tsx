import React, { useEffect, useState } from 'react';
import { Eye, GraduationCap, Loader2 } from 'lucide-react';
import studentClassesApi from '../../axios/studentClassesApi';
import { ENROLLMENT_STATUS_LABEL, ENROLLMENT_STATUS_TONE, formatScore } from '../../common/enrollmentFormat';
import type { EnrollmentCertificate, MyEnrollment } from '../../types/studentClasses';
import { CourseCertificateModal } from './CourseCertificateModal';

/** Danh sách lớp/khóa học đã tham gia. Lớp hoàn thành có biểu tượng 👁️ mở chứng chỉ. */
export const EnrolledClassesList: React.FC<{ items: MyEnrollment[]; onViewCertificate: (c: EnrollmentCertificate) => void }> = ({
  items,
  onViewCertificate,
}) => (
  <ul className="grid gap-3 md:grid-cols-2">
    {items.map((e) => (
      <li key={e.classId} className="flex items-start justify-between gap-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
        <div className="min-w-0">
          <div className="truncate text-sm font-bold text-[var(--text-main)]">{e.className}</div>
          <div className="mt-0.5 text-xs text-[var(--text-muted)]">Giảng viên: {e.teacherName ?? 'Chưa cập nhật'}</div>
          <div className="mt-1 text-xs text-[var(--text-muted)]">
            {e.doneCount}/{e.totalAssignments} bài hoàn thành · {formatScore(e.earned)}/{formatScore(e.max)} điểm
          </div>
          <span className={`mt-2 inline-block rounded-full border px-2 py-0.5 text-[11px] font-semibold ${ENROLLMENT_STATUS_TONE[e.status]}`}>
            {ENROLLMENT_STATUS_LABEL[e.status]}
          </span>
        </div>
        {e.certificate && (
          <button
            type="button"
            onClick={() => onViewCertificate(e.certificate as EnrollmentCertificate)}
            aria-label={`Xem chứng chỉ lớp ${e.className}`}
            title="Xem chứng chỉ hoàn thành"
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-amber-500/50 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 dark:text-amber-300"
          >
            <Eye size={18} />
          </button>
        )}
      </li>
    ))}
  </ul>
);

/** Mục "Lớp học / Khóa học đã tham gia" ở trang Hồ sơ của học viên. */
export const EnrolledClassesSection: React.FC = () => {
  const [items, setItems] = useState<MyEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [certificate, setCertificate] = useState<EnrollmentCertificate | null>(null);

  useEffect(() => {
    let cancelled = false;
    studentClassesApi
      .getEnrollments()
      .then((res) => !cancelled && setItems(res))
      .catch(() => !cancelled && setError('Không tải được danh sách lớp học.'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section aria-label="Lớp học đã tham gia" className="mt-10">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-[var(--text-main)]">
        <GraduationCap size={18} /> Lớp học / Khóa học đã tham gia
      </h2>
      {loading ? (
        <p className="flex items-center text-sm text-[var(--text-muted)]">
          <Loader2 size={14} className="mr-2 animate-spin" /> Đang tải...
        </p>
      ) : error ? (
        <p className="text-sm text-rose-500">{error}</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">Bạn chưa tham gia lớp học nào.</p>
      ) : (
        <EnrolledClassesList items={items} onViewCertificate={setCertificate} />
      )}
      {certificate && <CourseCertificateModal certificate={certificate} onClose={() => setCertificate(null)} />}
    </section>
  );
};

export default EnrolledClassesSection;
