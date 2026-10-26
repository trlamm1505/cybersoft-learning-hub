import React from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

export const CHEAT_LOCK_TITLE = 'Phát hiện gian lận: Bạn đã rời khỏi màn hình thi 3 lần!';
export const CHEAT_LOCK_CONTACT = 'Mọi thắc mắc và giải trình, vui lòng liên hệ trực tiếp với Giảng viên phụ trách cuộc thi.';

/** Toàn màn hình đỏ khi bị khóa phòng thi (lần rời thứ 3): bài đã được nộp tự động, chỉ còn nút đóng phòng thi. */
export const CheatLockOverlay: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div
    role="alertdialog"
    aria-modal="true"
    aria-labelledby="cheat-lock-title"
    className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-red-700 px-6 text-center text-white"
  >
    <ShieldAlert size={72} strokeWidth={1.75} aria-hidden="true" />
    <h1 id="cheat-lock-title" className="max-w-2xl text-2xl font-black leading-snug sm:text-4xl">
      {CHEAT_LOCK_TITLE}
    </h1>
    <p className="max-w-xl text-base font-semibold sm:text-lg">Phòng thi đã bị khóa và bài làm của bạn đã được nộp tự động.</p>
    <p className="max-w-xl text-sm sm:text-base">{CHEAT_LOCK_CONTACT}</p>
    <button
      type="button"
      onClick={onClose}
      autoFocus
      className="cursor-pointer rounded-2xl border-none bg-white px-6 py-3 text-sm font-black text-red-700 shadow-lg hover:bg-red-50"
    >
      Đóng phòng thi
    </button>
  </div>
);

/** Dải cảnh báo đỏ nhấp nháy trên màn hình học viên sau mỗi lần rời màn hình (kèm tiếng bíp). */
export const LeaveWarningBanner: React.FC<{
  count: number;
  /** Cuộc thi: số lần rời để bị khóa phòng thi. */
  limit?: number;
  /** Bài lớp: rời QUÁ số lần này thì giảng viên được thông báo. */
  notifyAfter?: number;
  teacherNotified?: boolean;
}> = ({ count, limit, notifyAfter, teacherNotified = false }) => (
  <div
    role="alert"
    className="fixed inset-x-0 top-0 z-[90] flex animate-pulse items-center justify-center gap-2 bg-red-600 px-4 py-3 text-center text-sm font-bold text-white shadow-lg"
  >
    <AlertTriangle size={18} aria-hidden="true" />
    <span>
      Bạn vừa rời khỏi màn hình làm bài (lần {count}
      {limit ? `/${limit}` : ''}).
      {teacherNotified ? ' Giảng viên đã được thông báo.' : ''}
      {limit && count < limit ? ` Rời đủ ${limit} lần bài thi sẽ bị khóa và nộp tự động.` : ''}
      {notifyAfter !== undefined && !teacherNotified ? ` Rời quá ${notifyAfter} lần giảng viên sẽ được thông báo.` : ''}
    </span>
  </div>
);
