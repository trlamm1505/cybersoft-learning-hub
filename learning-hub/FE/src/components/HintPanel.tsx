import React, { useEffect, useState } from 'react';
import hintApi from '../axios/hintApi';
import type { HintItem } from '../types/hint';

interface HintPanelProps {
  exerciseSlug: string;
  userId?: string;
  isDark?: boolean;
  onApplySolution?: (solutionCode: string) => void;
}

const TIER_META = [
  {
    level: 1,
    name: 'Khái niệm',
    subTitle: 'Định hướng tư duy',
    icon: '💡',
    badgeColor: 'border-amber-500/40 text-amber-600 dark:text-amber-300 bg-amber-500/10',
  },
  {
    level: 2,
    name: 'Chiến lược',
    subTitle: 'Các bước thuật toán',
    icon: '🎯',
    badgeColor: 'border-blue-500/40 text-blue-600 dark:text-cyan-300 bg-blue-500/10',
  },
  {
    level: 3,
    name: 'Code mẫu',
    subTitle: 'Python',
    icon: '💻',
    badgeColor: 'border-purple-500/40 text-purple-600 dark:text-purple-300 bg-purple-500/10',
  },
];

export const HintPanel: React.FC<HintPanelProps> = ({
  exerciseSlug,
  onApplySolution,
}) => {
  // Generate a unique session ID per practice attempt/exercise change
  const [sessionId, setSessionId] = useState<string>(
    () => `session_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
  );

  const [hints, setHints] = useState<HintItem[]>([]);
  const [activeLevel, setActiveLevel] = useState<1 | 2 | 3>(1);
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUnlocking, setIsUnlocking] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Reset session when exerciseSlug changes
  useEffect(() => {
    const newSession = `session_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setSessionId(newSession);
    setCooldownSeconds(0);
    setErrorMsg(null);
    setSuccessMsg(null);
    setActiveLevel(1);
  }, [exerciseSlug]);

  // Load hints for current exercise session
  const loadHints = async () => {
    if (!exerciseSlug) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await hintApi.getHintsByExercise(exerciseSlug, sessionId);
      setHints(res.hints || []);
      if (res.cooldownRemainingSeconds > 0) {
        setCooldownSeconds(res.cooldownRemainingSeconds);
      }
    } catch {
      setErrorMsg('Không thể tải gợi ý cho bài tập này. Vui lòng kiểm tra lại kết nối.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHints();
  }, [exerciseSlug, sessionId]);

  // Live timer countdown for cooldown
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  const activeHint = hints.find((h) => h.level === activeLevel);
  const unlockedCount = hints.filter((h) => h.isUnlocked).length;

  const handleUnlock = async (level: 1 | 2 | 3) => {
    setIsUnlocking(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await hintApi.unlockHint({
        exerciseSlug,
        level,
        userId: sessionId,
      });

      setSuccessMsg(res.message || `Đã mở gợi ý Tầng ${level} thành công!`);

      if (res.cooldownRemainingSeconds > 0) {
        setCooldownSeconds(res.cooldownRemainingSeconds);
      }

      // Auto-populate CodeEditor on the left when Level 3 is unlocked
      if (level === 3 && res.hint?.content) {
        onApplySolution?.(res.hint.content);
      }

      // Update state with unlocked content
      setHints((prevHints) =>
        prevHints.map((h) =>
          h.level === level
            ? { ...h, isUnlocked: true, content: res.hint.content }
            : h,
        ),
      );
    } catch (err: any) {
      if (err?.response?.data?.cooldownRemainingSeconds) {
        setCooldownSeconds(err.response.data.cooldownRemainingSeconds);
        setErrorMsg(err?.response?.data?.message || 'Thời gian hồi đang kích hoạt. Vui lòng đợi.');
      } else {
        setErrorMsg(
          err?.response?.data?.message || 'Mở gợi ý thất bại. Vui lòng thử lại.',
        );
      }
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-main)] p-4 sm:p-5 shadow-xs transition-colors duration-200">
      {/* Header & Progress Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-[var(--border-color)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">💡</span>
            <h3 className="font-extrabold text-base sm:text-lg text-[var(--text-main)]">
              Hint Engine — Bảng Gợi Ý
            </h3>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Gợi ý 3 tầng giúp bạn tự định hướng tư duy mà không làm mất đi niềm vui tự làm bài.
          </p>
        </div>

        {/* Unlocked Progress Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <div className="text-xs font-semibold text-[var(--text-muted)]">
            Tiến độ mở: <span className="text-indigo-600 dark:text-cyan-400 font-bold">{unlockedCount}/3</span>
          </div>
          <div className="w-20 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(unlockedCount / 3) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Cooldown Active Banner */}
      {cooldownSeconds > 0 && (
        <div className="mb-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 p-3 text-xs sm:text-sm flex items-center justify-between gap-2 animate-pulse">
          <div className="flex items-center gap-2 font-medium">
            <span>⏱️</span>
            <span>
              Thời gian đếm ngược hồi chiêu (Cooldown): <strong>{cooldownSeconds}s</strong>
            </span>
          </div>
          <span className="text-[11px] font-semibold opacity-80 whitespace-nowrap">Vui lòng chờ</span>
        </div>
      )}

      {/* Error & Success Messages */}
      {errorMsg && (
        <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 p-3 text-xs sm:text-sm">
          ⚠️ {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="mb-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 p-3 text-xs sm:text-sm">
          ✅ {successMsg}
        </div>
      )}

      {/* Synchronized 3-Tier Tab Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-5">
        {TIER_META.map((meta) => {
          const item = hints.find((h) => h.level === meta.level);
          const isUnlocked = item?.isUnlocked ?? false;
          const isActive = activeLevel === meta.level;

          return (
            <button
              key={meta.level}
              onClick={() => setActiveLevel(meta.level as 1 | 2 | 3)}
              className={`p-3 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between gap-2.5 cursor-pointer ${
                isActive
                  ? 'border-indigo-500 bg-indigo-500/10 shadow-xs ring-1 ring-indigo-500/30'
                  : 'border-[var(--border-color)] bg-[var(--bg-main)] hover:bg-[var(--bg-card-hover)]'
              }`}
            >
              {/* Row 1: Icon + Full Title */}
              <div className="flex items-center gap-1.5 font-bold text-xs text-[var(--text-main)]">
                <span className="text-base shrink-0">{meta.icon}</span>
                <span className="leading-tight">
                  Tầng {meta.level}: {meta.name}
                </span>
              </div>

              {/* Row 2: Subtitle & Status Badge */}
              <div className="flex items-center justify-between gap-1 w-full pt-1.5 border-t border-[var(--border-color)]">
                <span className="text-[11px] text-[var(--text-muted)] font-medium">
                  {meta.subTitle}
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap shrink-0 ${
                    isUnlocked
                      ? 'border-emerald-500/40 text-emerald-600 dark:text-emerald-300 bg-emerald-500/10'
                      : 'border-[var(--border-color)] text-[var(--text-muted)] bg-[var(--bg-card)]'
                  }`}
                >
                  {isUnlocked ? '🔓 Đã mở' : '🔒 Chưa mở'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Hint Content Card */}
      {isLoading ? (
        <div className="py-12 text-center text-sm text-[var(--text-muted)] animate-pulse">
          ⏳ Đang tải dữ liệu gợi ý...
        </div>
      ) : activeHint ? (
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] p-4 sm:p-5 text-[var(--text-main)]">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <h4 className="font-bold text-sm sm:text-base flex items-center gap-2 text-[var(--text-main)]">
              <span>{TIER_META[activeLevel - 1].icon}</span>
              <span>{activeHint.title || `Gợi ý Tầng ${activeLevel}`}</span>
            </h4>
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                TIER_META[activeLevel - 1].badgeColor
              }`}
            >
              Tầng {activeLevel}: {TIER_META[activeLevel - 1].name}
            </span>
          </div>

          {activeHint.isUnlocked && activeHint.content ? (
            <div className="mt-2 text-sm leading-relaxed text-[var(--text-main)] space-y-3">
              {activeLevel === 1 && (
                <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[var(--text-main)]">
                  <div className="text-xs font-semibold text-amber-600 dark:text-amber-300 mb-1 flex items-center gap-1">
                    <span>🛡️ Kiểm duyệt Khái niệm (Không chứa code)</span>
                  </div>
                  <p className="whitespace-pre-wrap">{activeHint.content}</p>
                </div>
              )}

              {activeLevel === 2 && (
                <div className="p-3.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[var(--text-main)]">
                  <div className="text-xs font-semibold text-blue-600 dark:text-cyan-300 mb-1">
                    🎯 Các bước chiến lược logic
                  </div>
                  <p className="whitespace-pre-wrap">{activeHint.content}</p>
                </div>
              )}

              {activeLevel === 3 && (
                <div className="p-3.5 rounded-lg bg-purple-500/10 border border-purple-500/20 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="text-xs font-semibold text-purple-600 dark:text-purple-300 flex items-center gap-1">
                      <span>💻 Mã nguồn Lời giải hoàn chỉnh (Python)</span>
                    </div>
                  </div>

                  <pre className="p-3.5 rounded-md bg-slate-900 text-purple-200 text-xs font-mono overflow-x-auto whitespace-pre-wrap border border-slate-800 shadow-inner">
                    {activeHint.content}
                  </pre>

                  {/* Interactive Button to Load Solution directly into Left Code Editor */}
                  <div className="pt-1 flex justify-end">
                    <button
                      onClick={() => onApplySolution?.(activeHint.content!)}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-semibold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>📋</span>
                      <span>Nạp lại code mẫu Python vào Editor (bên trái)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Locked State Card */
            <div className="py-8 px-4 text-center space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-2xl shadow-xs">
                🔒
              </div>
              <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto">
                Gợi ý <strong className="text-[var(--text-main)]">Tầng {activeLevel} ({TIER_META[activeLevel - 1].name})</strong> đang bị khóa. Hãy bấm mở khóa để xem hướng dẫn chi tiết.
              </p>

              <button
                onClick={() => handleUnlock(activeLevel)}
                disabled={isUnlocking || cooldownSeconds > 0}
                className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 cursor-pointer"
              >
                {isUnlocking ? (
                  <span>⏳ Đang xử lý...</span>
                ) : cooldownSeconds > 0 ? (
                  <span>⏱️ Cooldown active ({cooldownSeconds}s)</span>
                ) : (
                  <span>🔓 Mở khóa Tầng {activeLevel}</span>
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="py-8 text-center text-sm text-[var(--text-muted)]">
          Chưa có dữ liệu gợi ý cho tầng này.
        </div>
      )}
    </div>
  );
};

export default HintPanel;
