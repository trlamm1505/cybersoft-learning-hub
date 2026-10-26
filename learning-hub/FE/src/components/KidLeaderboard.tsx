import React, { useCallback, useEffect, useState } from 'react';
import { Crown, Eye, RefreshCw, type LucideIcon } from 'lucide-react';
import { blockPuzzleApi, type LeaderboardResponse, type LeaderboardRow } from '../axios/blockPuzzleApi';
import { formatKidDate, formatKidDuration, type KidGameInfo } from '../common/kidProgress';
import { KidFriendCardModal } from './KidFriendCardModal';

interface KidLeaderboardProps {
  /** Đủ 5 game (xem allKidGames). */
  games: KidGameInfo[];
  /** Game mở sẵn khi vào trang (ví dụ vừa phá đảo xong). */
  initialGameId?: string | null;
}

const REFRESH_MS = 20_000;

const GAME_EMOJI: Record<string, string> = {
  'blockly-maze': '🧩',
  'blockly-turtle': '🐢',
  'blockly-bird': '🐦',
  'blockly-puzzle': '🦁',
  'robot-ve-nha': '🤖',
};

interface PodiumStyle {
  ring: string;
  label: string;
  badge: string;
  Icon?: LucideIcon;
  iconCls?: string;
  emoji?: string;
}

const PODIUM: PodiumStyle[] = [
  {
    ring: 'border-yellow-400 bg-gradient-to-b from-yellow-100 via-amber-50 to-yellow-200 kid-sparkle',
    label: 'Hạng 1',
    badge: 'bg-yellow-400 text-yellow-900',
    Icon: Crown,
    iconCls: 'text-yellow-500',
  },
  {
    ring: 'border-slate-300 bg-gradient-to-b from-slate-100 via-white to-slate-200 shadow-[0_0_18px_rgba(148,163,184,0.6)]',
    label: 'Hạng 2',
    badge: 'bg-slate-300 text-slate-800',
    emoji: '🥈',
  },
  {
    ring: 'border-orange-400 bg-gradient-to-b from-orange-100 via-amber-50 to-orange-200 shadow-[0_0_18px_rgba(251,146,60,0.55)]',
    label: 'Hạng 3',
    badge: 'bg-orange-400 text-orange-950',
    emoji: '🥉',
  },
];

/**
 * Bảng Vinh Danh (2 cột): trái là 5 trò chơi, phải là Top 10 bé ĐÃ PHÁ ĐẢO 100% trò đang chọn.
 * Top 3 vàng/bạc/đồng; mỗi bé có nút con mắt để xem thẻ thông tin.
 */
export const KidLeaderboard: React.FC<KidLeaderboardProps> = ({ games, initialGameId }) => {
  const [gameId, setGameId] = useState<string>(
    games.find((g) => g.id === initialGameId)?.id ?? games[0]?.id ?? '',
  );
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [friendId, setFriendId] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId && games[0]) setGameId(games[0].id);
  }, [games, gameId]);

  const load = useCallback(() => {
    if (!gameId) return;
    setLoading(true);
    blockPuzzleApi
      .getLeaderboard(gameId)
      .then((res) => {
        setData(res);
        setFailed(false);
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, [gameId]);

  // Tải khi đổi game, rồi tự cập nhật định kỳ để bảng luôn mới.
  useEffect(() => {
    setData(null);
    load();
    const t = setInterval(load, REFRESH_MS);
    return () => clearInterval(t);
  }, [load]);

  const game = games.find((g) => g.id === gameId);
  const top3 = data?.top.slice(0, 3) ?? [];
  const rest = data?.top.slice(3) ?? [];

  const eye = (row: LeaderboardRow) => (
    <button
      onClick={() => setFriendId(row.userId)}
      aria-label={`Xem thông tin bạn ${row.fullName}`}
      title="Xem thông tin bạn"
      className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-2xl border-none bg-sky-100 text-sky-700 hover:bg-sky-200"
    >
      <Eye size={24} strokeWidth={2.5} />
    </button>
  );

  const finishText = (row: LeaderboardRow) =>
    `⏱ ${formatKidDuration(
      new Date(row.lastCompletedAt).getTime() - new Date(row.firstCompletedAt).getTime(),
    )} · phá đảo ${formatKidDate(row.lastCompletedAt)}`;

  const podium = (row: LeaderboardRow, idx: number) => {
    const s = PODIUM[idx];
    return (
      <div
        key={row.userId}
        data-testid={`podium-${row.rank}`}
        className={`relative flex items-center gap-4 rounded-3xl border-4 p-4 ${s.ring} ${row.isMe ? 'ring-4 ring-pink-400' : ''}`}
      >
        {s.Icon ? (
          <s.Icon size={56} className={`${s.iconCls ?? ""} shrink-0`} fill="currentColor" aria-hidden="true" />
        ) : (
          <span className="shrink-0 text-5xl leading-none" aria-hidden="true">{s.emoji}</span>
        )}
        <div className="min-w-0 flex-1">
          <span className={`rounded-full px-3 py-0.5 text-sm font-black ${s.badge}`}>{s.label}</span>
          <div className="mt-1 break-words text-2xl font-black leading-tight text-slate-800">
            {row.fullName}
            {row.isMe ? ' (Bé)' : ''}
          </div>
          <div className="text-sm font-bold text-slate-600">{finishText(row)}</div>
        </div>
        {eye(row)}
      </div>
    );
  };

  return (
    <section aria-label="Bảng vinh danh" className="grid grid-cols-1 gap-5 md:grid-cols-[17rem_1fr]" data-testid="kid-leaderboard">
      {/* Cột trái: 5 trò chơi */}
      <nav aria-label="Chọn trò chơi" className="flex flex-row flex-wrap gap-3 md:flex-col">
        {games.map((g) => {
          const active = g.id === gameId;
          return (
            <button
              key={g.id}
              onClick={() => setGameId(g.id)}
              aria-pressed={active}
              className={`flex cursor-pointer items-center gap-3 rounded-2xl border-4 px-4 py-3 text-left text-lg font-black shadow-md transition-transform hover:scale-[1.03] ${
                active
                  ? 'border-pink-300 bg-gradient-to-r from-pink-400 to-orange-400 text-white'
                  : 'border-sky-200 bg-white text-sky-700'
              }`}
            >
              <span className="text-3xl" aria-hidden="true">{GAME_EMOJI[g.id] ?? '🎮'}</span>
              <span>{g.title}</span>
            </button>
          );
        })}
      </nav>

      {/* Cột phải: Top 10 */}
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-2xl font-black text-slate-800">
            Top 10 · {game?.title} {GAME_EMOJI[gameId] ?? ''}
          </h2>
          <button
            onClick={load}
            aria-label="Làm mới bảng"
            className="flex cursor-pointer items-center gap-1 rounded-2xl border-none bg-amber-100 px-3 py-2 text-sm font-black text-amber-700"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Làm mới
          </button>
        </div>
        <p className="text-base font-semibold text-slate-600">
          Chỉ các bé đã phá đảo hết {data?.totalLevels || game?.levels || ''} màn mới được lên bảng. Thời gian càng ngắn, hạng càng cao!
        </p>

        {failed && <p className="rounded-2xl bg-amber-50 p-4 text-base font-bold text-amber-700">Chưa tải được bảng vinh danh, bé thử lại nhé!</p>}

        {data && data.top.length === 0 && !failed && (
          <div className="rounded-3xl border-4 border-dashed border-sky-200 bg-sky-50 p-8 text-center">
            <div className="text-5xl" aria-hidden="true">🏁</div>
            <p className="mt-2 text-xl font-black text-slate-700">Chưa có bé nào phá đảo trò này. Bé hãy là người đầu tiên nhé!</p>
          </div>
        )}

        {top3.length > 0 && <div className="flex flex-col gap-3">{top3.map((r, i) => podium(r, i))}</div>}

        {rest.length > 0 && (
          <ol className="flex flex-col gap-2" start={4}>
            {rest.map((r) => (
              <li
                key={r.userId}
                className={`flex items-center gap-3 rounded-2xl border-2 bg-white px-4 py-2 text-lg font-bold text-slate-700 ${r.isMe ? 'border-pink-400' : 'border-sky-100'}`}
              >
                <span className="w-8 text-center text-xl font-black text-sky-600">{r.rank}</span>
                <span className="min-w-0 flex-1 break-words">
                  {r.fullName}
                  {r.isMe ? ' (Bé)' : ''}
                  <span className="block text-sm font-semibold text-slate-500">{finishText(r)}</span>
                </span>
                {eye(r)}
              </li>
            ))}
          </ol>
        )}

        {data?.me && (
          <div className="rounded-2xl border-4 border-pink-300 bg-pink-50 px-4 py-3 text-lg font-black text-pink-700">
            Bé đang ở hạng {data.me.rank} của trò này
          </div>
        )}
        {data?.myProgress && (
          <div className="rounded-2xl border-4 border-sky-300 bg-sky-50 px-4 py-3 text-lg font-black text-sky-700">
            Bé mới phá đảo {data.myProgress.levelsCompleted}/{data.myProgress.totalLevels} màn. Phá đảo hết để lên bảng nhé! 🚀
          </div>
        )}
      </div>

      {friendId && <KidFriendCardModal userId={friendId} games={games} onClose={() => setFriendId(null)} />}
    </section>
  );
};
