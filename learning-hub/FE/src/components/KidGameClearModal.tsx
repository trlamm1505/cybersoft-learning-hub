import React, { useEffect, useState } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface KidGameClearModalProps {
  gameTitle: string;
  /** Huy hiệu bé vừa nhận khi phá đảo game này (nếu game có huy hiệu). */
  badge?: { title: string; emoji: string };
  /** Tổng số sao bé có sau khi phá đảo. */
  stars: number;
  /** Thành tích đã được ghi lên máy chủ (bảng vinh danh đọc từ đó). Chưa xong thì chờ, chưa chuyển trang. */
  saved: boolean;
  onGoToLeaderboard: () => void;
}

const CONFETTI = ['⭐', '🎉', '✨', '🌟', '🎈', '💛', '🌈', '🎊', '🏆', '🥳'];
const AUTO_GO_SECONDS = 8;

/**
 * Chúc mừng khi bé PHÁ ĐẢO trọn một trò chơi: pháo giấy/sao rơi, thành tích vừa nhận, rồi tự chuyển sang
 * Bảng Vinh Danh sau vài giây (hoặc bấm nút để đi ngay). Chỉ chuyển khi thành tích đã được lưu.
 */
export const KidGameClearModal: React.FC<KidGameClearModalProps> = ({ gameTitle, badge, stars, saved, onGoToLeaderboard }) => {
  const [seconds, setSeconds] = useState(AUTO_GO_SECONDS);
  // Không có Esc: hộp chúc mừng tự chuyển trang, nhưng tiêu điểm bàn phím vẫn bị giữ trong hộp.
  const dialogRef = useFocusTrap(true);

  useEffect(() => {
    if (!saved) return;
    if (seconds <= 0) {
      onGoToLeaderboard();
      return;
    }
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [saved, seconds, onGoToLeaderboard]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/55 p-4">
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Chúc mừng phá đảo"
        className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border-8 border-yellow-400 bg-gradient-to-b from-yellow-50 via-white to-pink-50 p-8 text-center shadow-[0_0_44px_rgba(250,204,21,0.85)]"
      >
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          {CONFETTI.concat(CONFETTI).map((c, i) => (
            <span
              key={i}
              className="kid-confetti absolute text-2xl"
              style={{ left: `${(i * 89) % 100}%`, animationDelay: `${(i % 9) * 0.3}s`, animationDuration: `${2.8 + (i % 4)}s` }}
            >
              {c}
            </span>
          ))}
        </div>

        <div className="relative">
          <div className="text-7xl" aria-hidden="true">🏆</div>
          <h2 className="mt-2 text-4xl font-black text-orange-500">Chúc mừng bé!</h2>
          <p className="mt-3 text-2xl font-black text-slate-700">
            Bé đã phá đảo <span className="text-pink-500">{gameTitle}</span>!
          </p>

          <div className="mt-4 rounded-2xl border-4 border-amber-300 bg-amber-50 p-4">
            <p className="text-lg font-black text-amber-700">Thành tích bé nhận được</p>
            <p className="mt-1 text-xl font-black text-slate-800">⭐ Tổng {stars} sao</p>
            {badge && (
              <p className="mt-1 text-xl font-black text-slate-800">
                <span aria-hidden="true">{badge.emoji}</span> Huy hiệu “{badge.title}”
              </p>
            )}
          </div>

          <p className="mt-4 text-lg font-bold text-slate-600">
            {saved ? `Mình sang Bảng Vinh Danh sau ${seconds} giây nhé...` : 'Đang ghi nhận thành tích của bé...'}
          </p>
          <button
            onClick={onGoToLeaderboard}
            disabled={!saved}
            className="mt-4 cursor-pointer rounded-2xl border-none bg-gradient-to-r from-pink-400 to-orange-400 px-8 py-3 text-xl font-black text-white shadow-lg hover:scale-105 active:scale-95 disabled:cursor-wait disabled:opacity-60"
          >
            Xem Bảng Vinh Danh 🏅
          </button>
        </div>
      </div>
    </div>
  );
};
