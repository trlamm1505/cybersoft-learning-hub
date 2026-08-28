import React from 'react';
import type { PrerequisiteItem } from '../types/course';

interface PrerequisiteCardProps {
  prerequisites: PrerequisiteItem[];
}

export const PrerequisiteCard: React.FC<PrerequisiteCardProps> = ({ prerequisites }) => {
  if (!prerequisites || prerequisites.length === 0) {
    return <p className="text-[var(--text-muted)] text-sm">Khóa học này không yêu cầu điều kiện tiên quyết.</p>;
  }

  return (
    <div className="flex flex-col gap-3" aria-label="Danh sách điều kiện tiên quyết">
      {prerequisites.map((item) => (
        <div key={item.id} className="flex items-start gap-3 p-3.5 bg-[var(--bg-main)] rounded-xl border border-[var(--border-color)]">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold text-xs ${
              item.isCompleted
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30'
                : 'bg-amber-100 text-amber-700 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30'
            }`}
            title={item.isCompleted ? 'Đã hoàn thành' : 'Khuyên dùng trước khi học'}
            aria-label={item.isCompleted ? 'Đã đáp ứng điều kiện' : 'Chưa đáp ứng điều kiện'}
          >
            {item.isCompleted ? '✓' : '!'}
          </div>
          <div>
            <div className="font-semibold text-sm text-[var(--text-main)] flex items-center gap-2">
              <span>{item.title}</span>
              {item.isCompleted && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  (Đã đáp ứng)
                </span>
              )}
            </div>
            {item.description && (
              <div className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                {item.description}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
