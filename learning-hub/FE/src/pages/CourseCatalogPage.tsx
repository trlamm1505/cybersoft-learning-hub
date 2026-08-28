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
    <div className="flex flex-col gap-6">
      {/* Hero Banner - Glassmorphic Soft Gradient */}
      <section className="relative overflow-hidden bg-gradient-to-r from-indigo-500/10 via-sky-500/5 to-cyan-500/10 border border-[var(--border-color)] bg-[var(--bg-card)] rounded-3xl p-6 sm:p-8 text-center shadow-sm" aria-label="Giới thiệu danh mục bài học">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-600 dark:from-white dark:to-cyan-400 mb-2 tracking-tight">
          Danh mục Khóa học & Bài học Thực chiến
        </h1>
        <p className="text-[var(--text-muted)] max-w-2xl mx-auto mb-5 text-sm leading-relaxed">
          Khám phá 5 bài học mẫu chuẩn CyberSoft với đầy đủ <strong className="text-[var(--text-main)]">Mục tiêu đầu ra, Độ khó phân cấp, Thời lượng tối ưu</strong> và <strong className="text-[var(--text-main)]">Điều kiện tiên quyết</strong>.
        </p>

        {/* Quick Stats Pill */}
        <div className="inline-flex flex-wrap items-center justify-center gap-3 bg-[var(--bg-main)] px-4 py-2 rounded-full border border-[var(--border-color)] text-xs text-[var(--text-muted)] shadow-xs">
          <div>📚 Bài học: <strong className="text-indigo-600 dark:text-cyan-400 font-bold">{lessons.length} bài</strong></div>
          <div aria-hidden="true" className="opacity-40">•</div>
          <div>⏱ Tổng thời lượng: <strong className="text-indigo-600 dark:text-cyan-400 font-bold">{totalMinutes} phút</strong></div>
          <div aria-hidden="true" className="opacity-40">•</div>
          <div>🎯 Chuẩn đầu ra: <strong className="text-indigo-600 dark:text-cyan-400 font-bold">100% Thực chiến</strong></div>
        </div>
      </section>

      {/* Search & Filter Bar */}
      <section className="flex flex-col md:flex-row items-center justify-between gap-4" aria-label="Bộ lọc và tìm kiếm bài học">
        <div className="w-full md:max-w-md">
          <input
            type="search"
            placeholder="🔍 Tìm kiếm bài học (HTML, React, Tailwind)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-[var(--text-main)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:border-indigo-500 shadow-xs transition-colors"
            aria-label="Tìm kiếm bài học"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1" role="tablist" aria-label="Lọc theo độ khó">
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
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card-hover)]'
                }`}
              >
                {labelMap[level]}
              </button>
            );
          })}
        </div>
      </section>

      {/* Course Cards Grid */}
      <main id="catalog-content">
        {filteredLessons.length === 0 ? (
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl text-center p-12 text-[var(--text-muted)]">
            <div className="text-4xl mb-2">🔍</div>
            <h3 className="text-lg font-bold text-[var(--text-main)]">Không tìm thấy bài học phù hợp</h3>
            <p className="text-sm mt-1">Hãy thử thay đổi từ khóa tìm kiếm hoặc chọn lại độ khó.</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedDifficulty('All'); }}
              className="mt-4 px-4 py-2 text-xs font-semibold text-[var(--text-main)] bg-[var(--bg-main)] hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl border border-[var(--border-color)] transition-all"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
