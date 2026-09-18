import React, { useEffect, useState } from 'react';
import { Snowflake, Flag, Radio, ScrollText, ArrowLeft, Medal } from 'lucide-react';
import { leaderboardApi } from '../axios/leaderboardApi';
import type { LeaderboardResponse } from '../axios/leaderboardApi';
import { ContestRulesModal } from './ContestRulesModal';

interface ContestLeaderboardProps {
  contestId: string;
  contestTitle: string;
  onExit: () => void;
}

export const ContestLeaderboard: React.FC<ContestLeaderboardProps> = ({ contestId, contestTitle, onExit }) => {
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRules, setShowRules] = useState(false);

  const fetchLeaderboard = async () => {
    try {
      const res = await leaderboardApi.getLeaderboard(contestId);
      setData(res);
      setError(null);
    } catch {
      setError('Không thể tải bảng xếp hạng. Vui lòng thử lại.');
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    const timer = setInterval(fetchLeaderboard, 15_000); // live polling
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contestId]);

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-16">
      {showRules && <ContestRulesModal contestId={contestId} onClose={() => setShowRules(false)} />}

      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {data && (
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                  data.isFrozen
                    ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border-cyan-300'
                    : data.computedStatus === 'ENDED'
                    ? 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-400'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300'
                }`}
              >
                {data.isFrozen ? (
                  <>
                    <Snowflake size={11} /> FROZEN
                  </>
                ) : data.computedStatus === 'ENDED' ? (
                  <>
                    <Flag size={11} /> FINAL
                  </>
                ) : (
                  <>
                    <Radio size={11} /> LIVE
                  </>
                )}
              </span>
            )}
            <span className="text-xs text-[var(--text-muted)] font-semibold">Bảng Xếp Hạng</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-[var(--text-main)] tracking-tight mt-1">
            {contestTitle}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowRules(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-800 dark:text-indigo-300 text-xs font-bold cursor-pointer border-none"
          >
            <ScrollText size={14} /> Quy chế xếp hạng
          </button>
          <button
            type="button"
            onClick={onExit}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[var(--bg-main)] hover:bg-slate-200 dark:hover:bg-slate-800 text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-color)] text-xs font-bold cursor-pointer"
          >
            <ArrowLeft size={14} /> Quay Lại
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-300 text-red-700 dark:text-red-300 text-xs font-semibold">
          {error}
        </div>
      )}

      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-[var(--bg-main)] text-[var(--text-muted)] border-b border-[var(--border-color)] font-bold uppercase">
            <tr>
              <th className="px-4 py-3">Hạng</th>
              <th className="px-4 py-3">Thí Sinh</th>
              <th className="px-4 py-3 text-right">Số Bài Đạt Full</th>
              <th className="px-4 py-3 text-right">Thời Gian (phút)</th>
              <th className="px-4 py-3 text-right">Phạt (phút)</th>
              <th className="px-4 py-3 text-right">Tổng Điểm</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]">
            {(data?.rows ?? []).map((row) => (
              <tr key={row.studentId} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                <td className="px-4 py-3.5 font-black font-mono text-[var(--text-main)]">
                  {row.rank === 1 ? (
                    <Medal size={16} className="text-amber-500" />
                  ) : row.rank === 2 ? (
                    <Medal size={16} className="text-slate-400" />
                  ) : row.rank === 3 ? (
                    <Medal size={16} className="text-orange-700" />
                  ) : (
                    row.rank
                  )}
                </td>
                <td className="px-4 py-3.5 font-bold text-[var(--text-main)]">
                  {row.studentName} <span className="text-[var(--text-muted)] font-mono">({row.studentId})</span>
                </td>
                <td className="px-4 py-3.5 text-right font-mono">{row.solvedCount}</td>
                <td className="px-4 py-3.5 text-right font-mono">{row.timeMinutes}</td>
                <td className="px-4 py-3.5 text-right font-mono">{row.penaltyMinutes}</td>
                <td className="px-4 py-3.5 text-right font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {row.totalScore}
                </td>
              </tr>
            ))}
            {data && data.rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[var(--text-muted)] font-semibold">
                  Chưa có thí sinh nào nộp bài.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ContestLeaderboard;
