import React, { useState } from 'react';
import { CheckCircle2, ChevronLeft, Lock, Volume2, VolumeX } from 'lucide-react';
import { isSoundOn, setSoundOn, blip } from './gameSound';

/** Đầu trang chung của các trò chơi Blockly: nút quay lại, tên game, mô tả và công tắc âm thanh. */
export const GameHeader: React.FC<{ title: string; subtitle: string; onBack: () => void }> = ({ title, subtitle, onBack }) => {
  const [on, setOn] = useState(isSoundOn);
  const toggle = () => {
    const next = !on;
    setSoundOn(next);
    setOn(next);
    if (next) blip(440, 40, 'sine', 0.05);
  };
  return (
    <div className="rounded-3xl bg-gradient-to-r from-indigo-900 via-purple-900 to-cyan-900 p-6 text-white shadow-xl md:p-8">
      <button
        type="button"
        onClick={onBack}
        className="mb-2 inline-flex cursor-pointer items-center gap-1 text-xs font-bold text-indigo-200 hover:text-white"
      >
        <ChevronLeft size={14} strokeWidth={2.5} /> Chọn trò chơi khác
      </button>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-indigo-200">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={toggle}
          aria-pressed={on}
          aria-label={on ? 'Tắt âm thanh' : 'Bật âm thanh'}
          title={on ? 'Tắt âm thanh' : 'Bật âm thanh'}
          className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-white/20 bg-white/10 hover:bg-white/20"
        >
          {on ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
      </div>
    </div>
  );
};

/** Hàng chọn màn: màn sau chỉ mở khi hoàn thành màn trước. */
export const LevelTabs: React.FC<{
  count: number;
  level: number;
  isUnlocked: (n: number) => boolean;
  isDone: (n: number) => boolean;
  onSelect: (n: number) => void;
}> = ({ count, level, isUnlocked, isDone, onSelect }) => (
  <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Chọn màn chơi">
    {Array.from({ length: count }, (_, i) => i + 1).map((n) => {
      const open = isUnlocked(n);
      const done = isDone(n);
      const active = n === level;
      return (
        <button
          key={n}
          type="button"
          role="tab"
          aria-selected={active}
          disabled={!open}
          onClick={() => open && n !== level && onSelect(n)}
          title={open ? `Màn ${n}` : 'Hoàn thành màn trước để mở'}
          className={`flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-bold transition-colors ${
            !open
              ? 'cursor-not-allowed border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-muted)] opacity-60'
              : active
                ? 'cursor-pointer border-indigo-500 bg-indigo-600 text-white'
                : done
                  ? 'cursor-pointer border-emerald-500/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                  : 'cursor-pointer border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-main)] hover:border-indigo-300'
          }`}
        >
          {!open ? <Lock size={13} /> : done && !active ? <CheckCircle2 size={15} /> : n}
        </button>
      );
    })}
  </div>
);

export type Notice = { kind: 'success' | 'error' | 'info'; text: string };

export const NoticeBox: React.FC<{ notice: Notice | null }> = ({ notice }) =>
  notice ? (
    <p
      role="status"
      className={`rounded-xl border px-3 py-2 text-sm ${
        notice.kind === 'success'
          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
          : notice.kind === 'error'
            ? 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300'
            : 'border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300'
      }`}
    >
      {notice.text}
    </p>
  ) : null;

/** Props chung của mọi trò chơi dựng sẵn trong Block Puzzle. */
export interface GameProps {
  completedSlugs: Set<string>;
  onComplete: (slug: string) => void;
  onBack: () => void;
}
