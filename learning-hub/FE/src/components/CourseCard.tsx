import React from 'react';
import type { Lesson } from '../types/course';
import { DifficultyBadge } from './DifficultyBadge';

interface CourseCardProps {
  lesson: Lesson;
  onSelect: (lessonId: string) => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({ lesson, onSelect }) => {
  return (
    <article className="group flex flex-col h-full bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-indigo-500/60 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1.5 shadow-xs hover:shadow-xl hover:shadow-indigo-500/10">
      {/* Category & Badge */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-indigo-600 dark:text-cyan-400 uppercase tracking-wider">
          Bài {lesson.lessonNumber} • {lesson.category}
        </span>
        <DifficultyBadge difficulty={lesson.difficulty} />
      </div>

      {/* Title */}
      <h3 className="text-lg font-bold text-[var(--text-main)] mb-2 group-hover:text-indigo-600 dark:group-hover:text-cyan-300 transition-colors line-clamp-2 leading-snug">
        {lesson.title}
      </h3>

      {/* Summary */}
      <p className="text-sm text-[var(--text-muted)] mb-4 flex-1 line-clamp-3 leading-relaxed">
        {lesson.summary}
      </p>

      {/* Key Stats Panel */}
      <div className="flex flex-col gap-2 mb-5 text-xs bg-[var(--bg-main)] p-3 rounded-xl border border-[var(--border-color)]">
        <div className="flex items-center justify-between text-[var(--text-muted)]">
          <span>⏱ Thời lượng:</span>
          <strong className="text-[var(--text-main)]">{lesson.durationText}</strong>
        </div>
        <div className="flex items-center justify-between text-[var(--text-muted)]">
          <span>🎯 Mục tiêu:</span>
          <strong className="text-[var(--text-main)]">{lesson.objectives.length} kết quả đầu ra</strong>
        </div>
        <div className="flex items-center justify-between text-[var(--text-muted)]">
          <span>📋 Tiên quyết:</span>
          <strong className="text-[var(--text-main)]">{lesson.prerequisites.length} yêu cầu</strong>
        </div>
      </div>

      {/* Instructor & CTA Button */}
      <div className="flex items-center justify-between pt-3 border-t border-[var(--border-color)]">
        <div className="flex items-center gap-2">
          <img
            src={lesson.instructor.avatar}
            alt={lesson.instructor.name}
            className="w-8 h-8 rounded-full border border-[var(--border-color)] bg-[var(--bg-main)]"
          />
          <span className="text-xs font-semibold text-[var(--text-muted)]">
            {lesson.instructor.name}
          </span>
        </div>

        <button
          onClick={() => onSelect(lesson.id)}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-gradient-to-r dark:from-indigo-600 dark:to-cyan-500 dark:hover:from-indigo-500 dark:hover:to-cyan-400 rounded-xl shadow-md hover:shadow-indigo-500/25 transition-all cursor-pointer"
          aria-label={`Vào xem bài học ${lesson.title}`}
        >
          Học ngay →
        </button>
      </div>
    </article>
  );
};
