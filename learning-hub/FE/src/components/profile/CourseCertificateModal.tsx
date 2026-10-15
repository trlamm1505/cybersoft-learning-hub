import React from 'react';
import { Award, GraduationCap, X } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { formatCertificateDate, formatScore, GRADE_TONE } from '../../common/enrollmentFormat';
import type { EnrollmentCertificate } from '../../types/studentClasses';

interface CourseCertificateModalProps {
  certificate: EnrollmentCertificate;
  onClose: () => void;
}

/**
 * Chứng chỉ hoàn thành khóa học: khung vàng kép trên nền giấy kem. Màu cố định (không theo giao diện
 * Sáng/Tối) để luôn trông như một tấm chứng chỉ in. Đóng bằng nút, phím Esc hoặc bấm ra ngoài.
 */
export const CourseCertificateModal: React.FC<CourseCertificateModalProps> = ({ certificate, onClose }) => {
  const dialogRef = useFocusTrap(true, onClose);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-900/60 p-3 sm:p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Chứng chỉ hoàn thành khóa học"
        className="relative my-auto w-full max-w-3xl rounded-sm bg-gradient-to-br from-amber-50 via-white to-amber-100 p-2 shadow-2xl sm:p-3"
        style={{ border: '10px double #b8860b' }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng chứng chỉ"
          className="absolute right-2 top-2 z-10 cursor-pointer rounded-full border-none bg-amber-900/10 p-1.5 text-amber-900 hover:bg-amber-900/20"
        >
          <X size={18} />
        </button>

        <div className="border border-amber-600/60 px-4 py-6 text-center sm:px-12 sm:py-10" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
          <div className="flex items-center justify-center gap-2.5 text-slate-800">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-500 text-white shadow-md">
              <GraduationCap size={22} strokeWidth={2.25} aria-hidden="true" />
            </div>
            <span className="text-xl font-extrabold tracking-tight" style={{ fontFamily: 'system-ui, sans-serif' }}>
              CyberSoft<span className="ml-1 text-cyan-700">Learning Hub</span>
            </span>
          </div>

          <Award size={44} className="mx-auto mt-5 text-amber-600" strokeWidth={1.5} aria-hidden="true" />
          <h2 className="mt-2 text-2xl font-bold uppercase tracking-[0.18em] text-amber-800 sm:text-3xl">Chứng nhận hoàn thành</h2>
          <p className="mt-1 text-sm italic text-slate-600">Course Completion Certificate</p>

          <p className="mt-6 text-sm text-slate-600">Chứng nhận học viên</p>
          <p className="mt-1 break-words text-3xl font-bold text-slate-900 sm:text-4xl" data-testid="cert-name">
            {certificate.studentName}
          </p>
          <div className="mx-auto mt-2 h-px w-48 bg-amber-600/60" />

          <p className="mt-4 text-sm leading-relaxed text-slate-700 sm:text-base">
            đã hoàn thành khóa học <strong className="text-slate-900">{certificate.className}</strong>
            {certificate.teacherName ? (
              <>
                {' '}
                do giảng viên <strong className="text-slate-900">{certificate.teacherName}</strong> phụ trách
              </>
            ) : null}
            .
          </p>

          <div className="mx-auto mt-6 grid max-w-xl grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-amber-600/40 bg-white/70 p-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Điểm tổng kết</div>
              <div className="mt-1 text-2xl font-bold text-slate-900" data-testid="cert-score">
                {formatScore(certificate.finalScore)}
                <span className="text-sm font-medium text-slate-500"> / 100</span>
              </div>
              <div className="text-[11px] text-slate-500">
                ({formatScore(certificate.earned)}/{formatScore(certificate.max)} điểm bài tập)
              </div>
            </div>
            <div className="rounded-lg border border-amber-600/40 bg-white/70 p-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Xếp loại</div>
              <div className={`mt-2 inline-block rounded-full border px-3 py-1 text-lg font-bold ${GRADE_TONE[certificate.grade]}`} data-testid="cert-grade">
                {certificate.grade}
              </div>
            </div>
            <div className="rounded-lg border border-amber-600/40 bg-white/70 p-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Ngày hoàn thành</div>
              <div className="mt-1 text-lg font-bold text-slate-900" data-testid="cert-date">
                {formatCertificateDate(certificate.completedAt)}
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center justify-between gap-4 text-left sm:flex-row sm:items-end">
            <div className="text-xs text-slate-600">
              <div className="uppercase tracking-wide text-slate-500">Mã chứng chỉ</div>
              <div className="font-mono text-sm font-bold text-slate-800" data-testid="cert-code">
                {certificate.code}
              </div>
            </div>
            <div className="text-center text-xs text-slate-600">
              <div className="mx-auto mb-1 h-px w-44 bg-slate-500" />
              {certificate.teacherName ?? 'CyberSoft Learning Hub'}
              <div className="text-[11px] italic text-slate-500">Giảng viên phụ trách</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCertificateModal;
