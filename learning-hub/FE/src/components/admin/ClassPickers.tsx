import React from 'react';
import { X } from 'lucide-react';

/** Thẻ tag có dấu ✕ nhỏ hiện khi rê chuột (hoặc focus bàn phím) để gỡ nhanh. */
export const RemovableTag: React.FC<{ label: string; tone: 'violet' | 'slate' | 'plain'; title?: string; onRemove?: () => void; removeLabel: string; disabledReason?: string }> = ({ label, tone, title, onRemove, removeLabel, disabledReason }) => {
  const base =
    tone === 'plain'
      ? 'bg-white text-[var(--text-main)] ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-700'
      : tone === 'violet'
        ? 'bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-400/30'
        : 'bg-slate-100 text-slate-700 ring-slate-500/20 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-400/30';
  return (
    <span title={title} className={`group inline-flex max-w-full items-center gap-1 rounded-full py-0.5 pl-2.5 pr-1 text-xs font-medium ring-1 ring-inset ${base}`}>
      <span className="truncate">{label}</span>
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!disabledReason) onRemove();
          }}
          aria-label={removeLabel}
          aria-disabled={!!disabledReason}
          title={disabledReason ?? removeLabel}
          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full opacity-0 transition-opacity hover:bg-rose-100 hover:text-rose-700 focus-visible:opacity-100 group-hover:opacity-100 dark:hover:bg-rose-500/20 dark:hover:text-rose-300 ${disabledReason ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <X size={11} />
        </button>
      )}
    </span>
  );
};
