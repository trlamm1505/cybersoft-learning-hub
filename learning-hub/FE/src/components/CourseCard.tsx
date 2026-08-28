import React from 'react';
import type { Lesson } from '../types/course';
import { DifficultyBadge } from './DifficultyBadge';

interface CourseCardProps {
  lesson: Lesson;
  onSelect: (lessonId: string) => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({ lesson, onSelect }) => {
  return (
    <article className="card card-hover" style={{ display: 'flex', flexDirection: 'column', height: '100%', borderRadius: 'var(--radius-lg)' }}>
      {/* Category & Badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Bài {lesson.lessonNumber} • {lesson.category}
        </span>
        <DifficultyBadge difficulty={lesson.difficulty} />
      </div>

      {/* Title */}
      <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem', lineHeight: '1.35', fontWeight: 700 }}>
        {lesson.title}
      </h3>

      {/* Summary */}
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem', flex: 1, lineHeight: '1.5' }}>
        {lesson.summary}
      </p>

      {/* Key Stats Pill List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1.25rem', fontSize: '0.825rem', background: 'var(--bg-main)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
          <span>⏱ Thời lượng:</span>
          <strong style={{ color: 'var(--text-main)' }}>{lesson.durationText}</strong>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
          <span>🎯 Mục tiêu:</span>
          <strong style={{ color: 'var(--text-main)' }}>{lesson.objectives.length} kết quả đầu ra</strong>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
          <span>📋 Điều kiện tiên quyết:</span>
          <strong style={{ color: 'var(--text-main)' }}>{lesson.prerequisites.length} yêu cầu</strong>
        </div>
      </div>

      {/* Instructor & CTA */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <img
            src={lesson.instructor.avatar}
            alt={lesson.instructor.name}
            style={{ width: '30px', height: '30px', borderRadius: '50%', border: '1px solid var(--border-color)', background: 'var(--bg-main)' }}
          />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {lesson.instructor.name}
          </span>
        </div>

        <button
          onClick={() => onSelect(lesson.id)}
          className="btn btn-primary btn-sm"
          aria-label={`Vào xem bài học ${lesson.title}`}
        >
          Học ngay →
        </button>
      </div>
    </article>
  );
};
