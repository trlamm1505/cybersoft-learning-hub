import React, { useState, useMemo } from 'react';
import type { Lesson } from '../types/course';
import { CourseCard } from '../components/CourseCard';

interface CourseCatalogPageProps {
  lessons: Lesson[];
  onSelectLesson: (lessonId: string) => void;
}

export const CourseCatalogPage: React.FC<CourseCatalogPageProps> = ({
  lessons,
  onSelectLesson
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');

  // Filter lessons based on search query and difficulty filter
  const filteredLessons = useMemo(() => {
    return lessons.filter((lesson) => {
      const matchesSearch =
        lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lesson.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lesson.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesDifficulty =
        selectedDifficulty === 'All' || lesson.difficulty === selectedDifficulty;

      return matchesSearch && matchesDifficulty;
    });
  }, [lessons, searchQuery, selectedDifficulty]);

  // Statistics calculation
  const totalMinutes = useMemo(() => {
    return lessons.reduce((acc, curr) => acc + curr.durationMinutes, 0);
  }, [lessons]);

  return (
    <div className="catalog-page">
      {/* Compact Modern Hero Banner */}
      <section className="hero-banner" aria-label="Giới thiệu danh mục bài học">
        <h1 className="hero-title">Danh mục Khóa học & Bài học Thực chiến</h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '680px', margin: '0 auto 1.25rem', fontSize: '0.95rem' }}>
          Khám phá 5 bài học mẫu chuẩn CyberSoft với đầy đủ <strong>Mục tiêu đầu ra, Độ khó phân cấp, Thời lượng tối ưu</strong> và <strong>Điều kiện tiên quyết</strong>.
        </p>

        {/* Quick Stats Summary */}
        <div style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '1.25rem', justifyContent: 'center', background: 'var(--bg-card)', padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-color)', fontSize: '0.825rem', boxShadow: 'var(--shadow-sm)' }}>
          <div>📚 Bài học: <strong style={{ color: 'var(--secondary)' }}>{lessons.length} bài</strong></div>
          <div aria-hidden="true">•</div>
          <div>⏱ Tổng thời lượng: <strong style={{ color: 'var(--secondary)' }}>{totalMinutes} phút</strong></div>
          <div aria-hidden="true">•</div>
          <div>🎯 Chuẩn đầu ra: <strong style={{ color: 'var(--secondary)' }}>100% Thực chiến</strong></div>
        </div>
      </section>

      {/* Search & Filter Controls */}
      <section className="catalog-controls" aria-label="Bộ lọc và tìm kiếm bài học">
        <div style={{ position: 'relative', width: '100%', maxWidth: '420px' }}>
          <input
            type="search"
            placeholder="🔍 Tìm kiếm bài học (HTML, React, Flexbox)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            aria-label="Tìm kiếm bài học"
          />
        </div>

        <div className="filter-tabs" role="tablist" aria-label="Lọc theo độ khó">
          {['All', 'Beginner', 'Intermediate', 'Advanced'].map((level) => {
            const labelMap: Record<string, string> = {
              All: 'Tất cả độ khó',
              Beginner: 'Cơ bản',
              Intermediate: 'Trung bình',
              Advanced: 'Nâng cao'
            };
            const isActive = selectedDifficulty === level;
            return (
              <button
                key={level}
                role="tab"
                aria-selected={isActive}
                onClick={() => setSelectedDifficulty(level)}
                className={`tab-btn ${isActive ? 'active' : ''}`}
              >
                {labelMap[level]}
              </button>
            );
          })}
        </div>
      </section>

      {/* Course Grid */}
      <main id="catalog-content">
        {filteredLessons.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔍</div>
            <h3>Không tìm thấy bài học phù hợp</h3>
            <p style={{ marginTop: '0.5rem' }}>Hãy thử thay đổi từ khóa tìm kiếm hoặc chọn lại độ khó.</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedDifficulty('All'); }}
              className="btn btn-secondary btn-sm"
              style={{ marginTop: '1rem' }}
            >
              Đặt lại bộ lọc
            </button>
          </div>
        ) : (
          <div className="course-grid">
            {filteredLessons.map((lesson) => (
              <CourseCard
                key={lesson.id}
                lesson={lesson}
                onSelect={onSelectLesson}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
