import React, { useEffect, useMemo, useState } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { blockPuzzleApi, type KidCardResponse } from '../axios/blockPuzzleApi';
import { ageGroupLabel, summarizeKidProgress, topTitle, type KidGameInfo } from '../common/kidProgress';
import { UserAvatar } from './UserAvatar';

interface KidFriendCardModalProps {
  userId: string;
  games: KidGameInfo[];
  onClose: () => void;
}

/** Thẻ thông tin bạn học: avatar, họ tên, khối lớp, tổng số sao và các huy hiệu đang có. */
export const KidFriendCardModal: React.FC<KidFriendCardModalProps> = ({ userId, games, onClose }) => {
  const [card, setCard] = useState<KidCardResponse | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    blockPuzzleApi
      .getKidCard(userId)
      .then((c) => !cancelled && setCard(c))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Giữ Tab/Shift+Tab trong hộp thoại, Esc để đóng, trả tiêu điểm về nút con mắt khi đóng.
  const dialogRef = useFocusTrap(true, onClose);

  const summary = useMemo(
    () => (card ? summarizeKidProgress(new Set(card.completedSlugs), games) : null),
    [card, games],
  );
  const earned = summary?.badges.filter((b) => b.earned) ?? [];
  const best = summary ? topTitle(summary.badges) : null;

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
        aria-label="Thông tin bạn học"
        className="w-full max-w-md rounded-[2rem] border-8 border-sky-300 bg-gradient-to-b from-sky-50 via-white to-amber-50 p-6 text-center shadow-2xl"
      >
        {failed && <p className="text-lg font-bold text-amber-700">Chưa xem được thông tin bạn này.</p>}
        {!card && !failed && <p className="text-lg font-bold text-slate-600">Đang mở thẻ bạn học...</p>}
        {card && summary && best && (
          <>
            <div className="flex justify-center">
              <div className="rounded-full border-8 border-white shadow-lg">
                <UserAvatar user={{ fullName: card.fullName, email: '', avatar: card.avatar ?? undefined }} size={96} />
              </div>
            </div>
            <h2 className="mt-3 text-3xl font-black text-slate-800">{card.fullName}</h2>
            <p className="mt-1 inline-block rounded-full bg-amber-200 px-4 py-1 text-lg font-black text-amber-800">{ageGroupLabel(card.ageGroup)}</p>
            <p className="mt-2 text-xl font-black text-pink-600">
              <span aria-hidden="true">{best.emoji}</span> {best.title}
            </p>
            <p className="mt-1 text-2xl font-black text-yellow-600">⭐ {summary.stars} sao</p>

            <h3 className="mt-4 text-lg font-black text-slate-700">Huy hiệu nổi bật</h3>
            {earned.length === 0 ? (
              <p className="text-base font-semibold text-slate-500">Bạn ấy chưa có huy hiệu nào.</p>
            ) : (
              <ul className="mt-2 flex flex-wrap justify-center gap-2">
                {earned.map((b) => (
                  <li key={b.id} className="rounded-full border-2 border-amber-300 bg-amber-50 px-3 py-1 text-base font-black text-slate-800">
                    <span aria-hidden="true">{b.emoji}</span> {b.title}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
        <button
          onClick={onClose}
          className="mt-6 cursor-pointer rounded-2xl border-none bg-gradient-to-r from-pink-400 to-orange-400 px-8 py-3 text-xl font-black text-white shadow-lg hover:scale-105 active:scale-95"
        >
          Đóng lại nhé!
        </button>
      </div>
    </div>
  );
};
