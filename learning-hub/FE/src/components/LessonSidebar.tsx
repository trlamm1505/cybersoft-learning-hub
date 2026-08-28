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
    <aside className="card" aria-label="Danh sách bài học trong khóa học">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
        <h3 style={{ fontSize: '1.1rem' }}>Danh sách bài học</h3>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {lessons.length} bài học
        </span>
      </div>

      <nav className="sidebar-lessons" aria-label="Điều hướng nhanh bài học">
        {lessons.map((item) => {
          const isActive = item.id === currentLessonId;
          return (
            <button
              key={item.id}
              onClick={() => onSelectLesson(item.id)}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
              aria-label={`Bài ${item.lessonNumber}: ${item.title}`}
            >
              <div className="sidebar-num">{item.lessonNumber}</div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: isActive ? 600 : 500, lineHeight: '1.25' }}>
                  {item.title}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
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
