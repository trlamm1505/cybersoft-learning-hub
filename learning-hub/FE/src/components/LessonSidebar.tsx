import React from 'react';
import type { Lesson } from '../types/course';
import { DifficultyBadge } from './DifficultyBadge';

interface LessonSidebarProps {
  lessons: Lesson[];
  currentLessonId: string;
  onSelectLesson: (lessonId: string) => void;
}

export const LessonSidebar: React.FC<LessonSidebarProps> = ({
  lessons,
  currentLessonId,
  onSelectLesson
}) => {
  return (
    <aside className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 shadow-xs" aria-label="Danh sách bài học trong khóa học">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border-color)]">
        <h3 className="text-base font-bold text-[var(--text-main)]">Danh sách bài học</h3>
        <span className="text-xs text-[var(--text-muted)] font-medium">
          {lessons.length} bài học
        </span>
      </div>

      <nav className="flex flex-col gap-2.5" aria-label="Điều hướng nhanh bài học">
        {lessons.map((item) => {
          const isActive = item.id === currentLessonId;
          return (
            <button
              key={item.id}
              onClick={() => onSelectLesson(item.id)}
              className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                isActive
                  ? 'bg-indigo-50 border-indigo-500/80 text-indigo-950 font-semibold shadow-xs dark:bg-gradient-to-r dark:from-indigo-900/40 dark:to-cyan-900/30 dark:border-cyan-500/60 dark:text-white'
                  : 'bg-[var(--bg-main)] border-[var(--border-color)] text-[var(--text-main)] hover:bg-[var(--bg-card-hover)]'
              }`}
              aria-current={isActive ? 'page' : undefined}
              aria-label={`Bài ${item.lessonNumber}: ${item.title}`}
            >
              <div
                className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-600 dark:bg-cyan-400 dark:text-slate-950 dark:border-cyan-400'
                    : 'bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border-color)]'
                }`}
              >
                {item.lessonNumber}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold leading-snug truncate">
                  {item.title}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] text-[var(--text-muted)]">
                    ⏱ {item.durationText}
                  </span>
                  <DifficultyBadge difficulty={item.difficulty} />
                </div>
              </div>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
