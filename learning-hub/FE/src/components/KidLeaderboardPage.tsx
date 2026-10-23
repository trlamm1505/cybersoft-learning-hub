import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BUILTIN_GAMES } from '../games/registry';
import { allKidGames, lessonGamesFromLessons } from '../common/kidProgress';
import type { LessonAuthoring } from '../types/authoring';
import { KidLeaderboard } from './KidLeaderboard';

/** Trang /kid-leaderboard: tiêu đề + bảng vinh danh 2 cột cho đủ 5 game. */
export const KidLeaderboardPage: React.FC<{ teacherLessons?: LessonAuthoring[] }> = ({ teacherLessons = [] }) => {
  const [params] = useSearchParams();
  const games = useMemo(() => allKidGames(BUILTIN_GAMES, lessonGamesFromLessons(teacherLessons)), [teacherLessons]);
  return (
    <div className="flex flex-col gap-5 pb-10">
      <div className="rounded-3xl bg-gradient-to-r from-pink-300 via-orange-200 to-yellow-200 p-6 text-slate-800 shadow-lg">
        <h1 className="text-3xl font-black sm:text-4xl">Bảng Vinh Danh 🏅</h1>
        <p className="mt-1 text-lg font-bold">Những bé phá đảo trọn trò chơi nhanh nhất!</p>
      </div>
      <KidLeaderboard key={params.get('game') ?? ''} games={games} initialGameId={params.get('game')} />
    </div>
  );
};
