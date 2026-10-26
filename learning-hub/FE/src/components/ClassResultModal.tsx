import React from 'react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useFocusTrap } from '../hooks/useFocusTrap';

export const BACK_TO_CLASS_LABEL = '⬅ Quay lại Lớp học của tôi';

/** Nút lớn đưa học viên về /my-class (trang đó tải lại số liệu nên dấu ✅ và điểm được cập nhật). */
export const BackToClassButton: React.FC<{ onClick: () => void; className?: string }> = ({ onClick, className = '' }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-none bg-indigo-600 px-6 py-3 text-base font-black text-white shadow-lg hover:bg-indigo-500 ${className}`}
  >
    {BACK_TO_CLASS_LABEL}
  </button>
);

interface ClassResultModalProps {
  /** Tên bài vừa nộp. */
  title: string;
  /** Dòng điểm, vd "Điểm: 9/10". */
  scoreText: string;
  note?: string;
  onBack: () => void;
  /** Đóng pop-up để xem lại bài (không bắt buộc quay lại ngay). */
  onClose?: () => void;
}

/** Pop-up kết quả sau khi nộp bài của lớp (trắc nghiệm hoặc code): điểm rõ ràng + nút quay lại lớp. */
export const ClassResultModal: React.FC<ClassResultModalProps> = ({ title, scoreText, note, onBack, onClose }) => {
  const dialogRef = useFocusTrap(true, onClose);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4">
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Kết quả bài của lớp"
        className="w-full max-w-md rounded-3xl border border-emerald-300 bg-white p-6 text-center shadow-2xl dark:border-emerald-800 dark:bg-slate-900"
      >
        <CheckCircle2 size={48} className="mx-auto text-emerald-600" aria-hidden="true" />
        <h2 className="mt-2 text-lg font-extrabold text-slate-900 dark:text-white">Đã nộp bài thành công!</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{title}</p>
        <p className="mt-3 text-3xl font-black text-emerald-700 dark:text-emerald-400" data-testid="class-result-score">
          {scoreText}
        </p>
        {note && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{note}</p>}
        <BackToClassButton onClick={onBack} className="mt-5 w-full" />
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="mt-3 inline-flex cursor-pointer items-center gap-1 border-none bg-transparent text-xs font-semibold text-slate-500 underline"
          >
            <ArrowLeft size={12} aria-hidden="true" /> Xem lại bài làm
          </button>
        )}
      </div>
    </div>
  );
};
