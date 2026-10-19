import React from 'react';
import { CheckCircle2, Lock, PlayCircle } from 'lucide-react';
import type { PlaygroundExercise, PlaygroundResponse } from '../types/exercise';
import { canOpen, DIFFICULTY_BADGE, lockedHint, progressText } from '../pages/playgroundModel';

/** "Tiến độ: X/N bài đã hoàn thành": cùng con số với trang Tiến độ học tập và Hồ sơ (cùng nguồn máy chủ). */
export const PlaygroundProgress: React.FC<{ data: Pick<PlaygroundResponse, 'completed' | 'total'> }> = ({ data }) => (
  <div role="status" data-testid="playground-progress" className="text-xs font-semibold text-[var(--text-muted)] px-1">
    {progressText(data)}
  </div>
);

interface GridProps {
  items: PlaygroundExercise[];
  /** Học viên: hiện trạng thái hoàn thành / đang mở / khóa. Giảng viên, Admin: xem lộ trình, không khóa, không huy hiệu. */
  showStatus: boolean;
  onOpen: (slug: string) => void;
}

/** Lưới bài #1..#N. Bài đã hoàn thành: huy hiệu xanh "Đã hoàn thành", không ổ khóa. Bài đang mở: "Đang mở". Bài khóa: ổ khóa, không bấm được. */
export const PlaygroundGrid: React.FC<GridProps> = ({ items, showStatus, onOpen }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {items.map((item) => {
      const open = !showStatus || canOpen(item);
      const completed = showStatus && item.status === 'completed';
      const current = showStatus && item.status === 'available';
      return (
        <button
          key={item.slug}
          type="button"
          disabled={!open}
          aria-disabled={!open}
          data-status={showStatus ? item.status : undefined}
          title={!open ? lockedHint(items, item) : undefined}
          onClick={() => open && onOpen(item.slug)}
          className={`p-4 border rounded-2xl text-left transition-all flex flex-col gap-2 ${
            !open
              ? 'border-[var(--border-color)] bg-[var(--bg-card)] opacity-50 cursor-not-allowed'
              : current
                ? 'border-indigo-500 bg-[var(--bg-card)] ring-1 ring-indigo-500/40 hover:shadow-md cursor-pointer'
                : 'border-[var(--border-color)] bg-[var(--bg-card)] hover:border-indigo-500 hover:shadow-md cursor-pointer'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-[var(--text-muted)]">#{item.order}</span>
            {completed ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                <CheckCircle2 size={14} strokeWidth={2} /> Đã hoàn thành
              </span>
            ) : current ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full">
                <PlayCircle size={14} strokeWidth={2} /> Đang mở
              </span>
            ) : !open ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--text-muted)]">
                <Lock size={14} strokeWidth={2} /> Chưa mở khóa
              </span>
            ) : null}
          </div>
          <div className="font-bold text-sm text-[var(--text-main)] leading-snug">{item.title}</div>
          <span className={`self-start text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${DIFFICULTY_BADGE[item.difficulty] || ''}`}>
            {item.difficulty}
          </span>
        </button>
      );
    })}
  </div>
);
