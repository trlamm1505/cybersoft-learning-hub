import React, { useEffect, useState } from 'react';
import { leaderboardApi } from '../axios/leaderboardApi';
import type { LeaderboardRules } from '../axios/leaderboardApi';

interface ContestRulesModalProps {
  contestId: string;
  onClose: () => void;
}

export const ContestRulesModal: React.FC<ContestRulesModalProps> = ({ contestId, onClose }) => {
  const [rules, setRules] = useState<LeaderboardRules | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    leaderboardApi
      .getRules(contestId)
      .then(setRules)
      .catch(() => setError('Không thể tải quy chế xếp hạng. Vui lòng thử lại.'));
  }, [contestId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 md:p-8 shadow-2xl max-w-lg w-full space-y-5">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <h3 className="text-lg font-black text-[var(--text-main)]">📜 Quy Chế Xếp Hạng</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[var(--bg-main)] hover:bg-slate-200 dark:hover:bg-slate-800 text-[var(--text-muted)] border border-[var(--border-color)] cursor-pointer"
          >
            ✕
          </button>
        </div>

        {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}

        {!rules && !error && (
          <p className="text-xs text-[var(--text-muted)]">Đang tải quy chế...</p>
        )}

        {rules && (
          <ul className="space-y-3 text-xs text-[var(--text-muted)] leading-relaxed">
            <li>
              🏆 <strong className="text-[var(--text-main)]">Xếp hạng:</strong> theo tổng điểm giảm dần; nếu bằng
              điểm, ai có (thời gian đạt điểm tối đa + phạt) thấp hơn sẽ xếp trên.
            </li>
            <li>
              ⏱️ <strong className="text-[var(--text-main)]">Phạt thời gian:</strong> +{rules.penaltyMinutesPerWrong}{' '}
              phút cho mỗi lần nộp chưa đạt điểm tối đa trước lần đạt điểm tối đa trên cùng một bài (chỉ áp dụng cho
              bài đã đạt điểm tối đa).
            </li>
            <li>
              🔁 <strong className="text-[var(--text-main)]">Nộp lại nhiều lần:</strong> mỗi bài lấy điểm cao nhất
              trong các lần nộp hợp lệ, không lấy lần nộp cuối cùng.
            </li>
            <li>
              🥶 <strong className="text-[var(--text-main)]">Đóng băng bảng xếp hạng:</strong> {rules.freezeMinutes}{' '}
              phút cuối trước khi kết thúc cuộc thi, bảng xếp hạng công khai giữ nguyên kết quả tại thời điểm đóng
              băng. Bảng xếp hạng đầy đủ sẽ tự động hiện ra khi cuộc thi kết thúc.
            </li>
            <li>
              ⛔ <strong className="text-[var(--text-main)]">Nộp muộn:</strong> {rules.lateSubmitPolicy}
            </li>
          </ul>
        )}
      </div>
    </div>
  );
};

export default ContestRulesModal;
