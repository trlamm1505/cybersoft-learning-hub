import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { blockPuzzleApi } from '../axios/blockPuzzleApi';
import { BUILTIN_GAMES } from '../games/registry';
import { summarizeKidProgress } from '../common/kidProgress';
import type { LessonAuthoring } from '../types/authoring';
import type { AuthUser } from '../types/auth';

interface KidProgressViewProps {
  authUser: AuthUser | null;
  teacherLessons?: LessonAuthoring[];
}

const readCache = (key: string): Set<string> => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? new Set(JSON.parse(saved) as string[]) : new Set();
  } catch {
    return new Set();
  }
};

/**
 * Bảng Thành Tích của học sinh lớp 3-5: chỉ có sao, số màn đã phá đảo và huy hiệu.
 * Không hiển thị bất kỳ khái niệm kỹ thuật nào (input/output, AC/RE/WA...).
 */
export const KidProgressView: React.FC<KidProgressViewProps> = ({ authUser, teacherLessons = [] }) => {
  const navigate = useNavigate();
  const cacheKey = `app_block_puzzle_completed_${authUser?.id || 'guest'}`;
  const [done, setDone] = useState<Set<string>>(() => readCache(cacheKey));
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    blockPuzzleApi
      .getProgress()
      .then((res) => !cancelled && setDone(new Set(res.completedSlugs)))
      .catch(() => !cancelled && setDone(readCache(cacheKey)))
      .finally(() => !cancelled && setLoaded(true));
    return () => {
      cancelled = true;
    };
  }, [cacheKey]);

  const extraLevels = useMemo(
    () =>
      teacherLessons
        .filter((l) => (l.status === 'published' || !l.status) && l.type === 'block' && l.blockPuzzle)
        .map((l) => l.slug),
    [teacherLessons],
  );

  const summary = useMemo(() => summarizeKidProgress(done, BUILTIN_GAMES, extraLevels), [done, extraLevels]);
  const earnedCount = summary.badges.filter((b) => b.earned).length;
  const percent = summary.levelsTotal ? Math.round((summary.levelsDone / summary.levelsTotal) * 100) : 0;

  return (
    <div className="flex flex-col gap-6 pb-10" data-testid="kid-progress-view">
      <div className="rounded-3xl bg-gradient-to-r from-amber-300 via-orange-300 to-pink-300 p-6 text-slate-800 shadow-lg">
        <h1 className="text-3xl font-black sm:text-4xl">Bảng Thành Tích của {authUser?.fullName?.split(' ').pop() || 'bé'} 🌟</h1>
        <p className="mt-1 text-lg font-bold">Chơi thêm để nhận nhiều sao và huy hiệu nhé!</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border-4 border-yellow-300 bg-yellow-50 p-6 text-center shadow-md">
          <div className="text-5xl" aria-hidden="true">⭐</div>
          <div className="mt-2 text-5xl font-black text-yellow-600">{summary.stars}</div>
          <div className="text-lg font-bold text-slate-700">Sao đạt được</div>
        </div>
        <div className="rounded-2xl border-4 border-sky-300 bg-sky-50 p-6 text-center shadow-md">
          <div className="text-5xl" aria-hidden="true">🎮</div>
          <div className="mt-2 text-5xl font-black text-sky-600">
            {summary.levelsDone}/{summary.levelsTotal}
          </div>
          <div className="text-lg font-bold text-slate-700">Màn đã phá đảo</div>
          <div className="mx-auto mt-3 h-4 w-full overflow-hidden rounded-full bg-sky-100" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-blue-500" style={{ width: `${percent}%` }} />
          </div>
        </div>
        <div className="rounded-2xl border-4 border-pink-300 bg-pink-50 p-6 text-center shadow-md">
          <div className="text-5xl" aria-hidden="true">🏆</div>
          <div className="mt-2 text-5xl font-black text-pink-600">
            {earnedCount}/{summary.badges.length}
          </div>
          <div className="text-lg font-bold text-slate-700">Huy hiệu</div>
        </div>
      </div>

      <section aria-label="Huy hiệu">
        <h2 className="mb-3 text-2xl font-black text-slate-800">Huy hiệu của bé</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {summary.badges.map((b) => (
            <div
              key={b.id}
              className={`rounded-2xl border-4 p-5 text-center shadow-md ${
                b.earned ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-slate-100 opacity-70'
              }`}
            >
              <div className={`text-5xl ${b.earned ? '' : 'grayscale'}`} aria-hidden="true">{b.earned ? b.emoji : '🔒'}</div>
              <div className="mt-2 text-lg font-black text-slate-800">{b.title}</div>
              <div className="text-sm font-semibold text-slate-600">{b.earned ? 'Bé đã nhận được!' : b.hint}</div>
            </div>
          ))}
        </div>
      </section>

      <section aria-label="Các trò chơi">
        <h2 className="mb-3 text-2xl font-black text-slate-800">Các trò chơi</h2>
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {summary.games.map((g) => (
            <li key={g.id} className="flex items-center justify-between gap-3 rounded-2xl border-4 border-sky-200 bg-white p-4 shadow-sm">
              <span className="text-lg font-black text-slate-800">{g.title}</span>
              <span className={`rounded-full px-3 py-1 text-base font-black ${g.cleared ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'}`}>
                {g.cleared ? '🎉 Phá đảo!' : `${g.done}/${g.total} màn`}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {loaded && summary.levelsDone === 0 && (
        <button
          onClick={() => navigate('/block-puzzle')}
          className="cursor-pointer self-center rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 px-8 py-4 text-2xl font-black text-white shadow-lg hover:scale-105 active:scale-95"
        >
          Chơi màn đầu tiên nào!
        </button>
      )}
    </div>
  );
};
