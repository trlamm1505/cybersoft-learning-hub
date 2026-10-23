import React from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface KidCertificateModalProps {
  kidName: string;
  recordTitle: string;
  /** Ngày đã định dạng dd/mm/yyyy. */
  dateText: string;
  emoji?: string;
  onClose: () => void;
}

const CONFETTI = ['⭐', '🎉', '✨', '🌟', '🎈', '💛', '🌈', '🎊'];

/** Giấy Khen Thưởng: popup bo tròn viền vàng, ngôi sao/pháo giấy rơi, đóng bằng nút hoặc phím Esc. */
export const KidCertificateModal: React.FC<KidCertificateModalProps> = ({ kidName, recordTitle, dateText, emoji = '🏆', onClose }) => {
  // Giữ Tab/Shift+Tab trong hộp thoại, Esc để đóng, trả tiêu điểm về nút con mắt khi đóng.
  const dialogRef = useFocusTrap(true, onClose);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Giấy khen"
        className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border-8 border-yellow-400 bg-gradient-to-b from-yellow-50 via-white to-sky-50 p-8 text-center shadow-[0_0_40px_rgba(250,204,21,0.8)]"
      >
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          {CONFETTI.concat(CONFETTI).map((c, i) => (
            <span
              key={i}
              className="kid-confetti absolute text-2xl"
              style={{ left: `${(i * 97) % 100}%`, animationDelay: `${(i % 8) * 0.35}s`, animationDuration: `${3 + (i % 4)}s` }}
            >
              {c}
            </span>
          ))}
        </div>

        <div className="relative">
          <div className="text-6xl" aria-hidden="true">{emoji}</div>
          <h2 className="mt-2 text-3xl font-black tracking-wide text-orange-500">GIẤY KHEN</h2>
          <p className="mt-4 text-xl font-bold leading-relaxed text-slate-700">
            Chứng nhận Bé <span className="text-2xl font-black text-pink-500">{kidName}</span> đã xuất sắc đạt Thành tích{' '}
            <span className="font-black text-sky-600">{recordTitle}</span> vào ngày{' '}
            <span className="font-black text-emerald-600">{dateText}</span>.
          </p>
          <p className="mt-3 text-lg font-bold text-slate-500">Cố gắng phát huy nhé! 🌈</p>
          <button
            onClick={onClose}
            className="mt-6 cursor-pointer rounded-2xl border-none bg-gradient-to-r from-pink-400 to-orange-400 px-8 py-3 text-xl font-black text-white shadow-lg hover:scale-105 active:scale-95"
          >
            Đóng lại nhé!
          </button>
        </div>
      </div>
    </div>
  );
};
