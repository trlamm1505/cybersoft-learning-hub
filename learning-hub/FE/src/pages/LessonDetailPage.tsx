import React, { useState } from 'react';
import type { Lesson } from '../types/course';
import { DifficultyBadge } from '../components/DifficultyBadge';
import { ObjectiveList } from '../components/ObjectiveList';
import { PrerequisiteCard } from '../components/PrerequisiteCard';
import { LessonSidebar } from '../components/LessonSidebar';

interface LessonDetailPageProps {
  currentLesson: Lesson;
  allLessons: Lesson[];
  onSelectLesson: (lessonId: string) => void;
  onBackToCatalog: () => void;
}

export const LessonDetailPage: React.FC<LessonDetailPageProps> = ({
  currentLesson,
  allLessons,
  onSelectLesson,
  onBackToCatalog
}) => {
  const [videoError, setVideoError] = useState(false);

  // Navigation indexes for Previous / Next lesson
  const currentIndex = allLessons.findIndex((l) => l.id === currentLesson.id);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  return (
    <div className="flex flex-col gap-5">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <li>
            <button
              onClick={onBackToCatalog}
              className="text-indigo-600 dark:text-cyan-400 font-semibold hover:underline cursor-pointer"
            >
              📚 Danh mục bài học
            </button>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-[var(--text-main)] font-medium truncate">
            Bài {currentLesson.lessonNumber}: {currentLesson.title}
          </li>
        </ol>
      </nav>

      {/* Main 2-Column Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
        {/* Left Column: Lesson Player & Info */}
        <main id="main-content" className="flex flex-col">
          {/* Header Title */}
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-bold text-indigo-600 dark:text-cyan-400 uppercase tracking-wider">
                Bài {currentLesson.lessonNumber} • {currentLesson.category}
              </span>
              <DifficultyBadge difficulty={currentLesson.difficulty} />
            </div>

            <h1 className="text-2xl font-bold text-[var(--text-main)] mb-2 leading-tight">
              {currentLesson.title}
            </h1>

            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              {currentLesson.summary}
            </p>
          </div>

          {/* Video Player */}
          <div className="aspect-video-container bg-slate-950 rounded-2xl overflow-hidden border border-[var(--border-color)] shadow-lg mb-5">
            {!videoError && currentLesson.videoUrl ? (
              <iframe
                key={currentLesson.id}
                src={`${currentLesson.videoUrl}?autoplay=0&rel=0`}
                title={`Video bài học ${currentLesson.lessonNumber}: ${currentLesson.title}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                onError={() => setVideoError(true)}
              ></iframe>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-gradient-to-br from-slate-900 to-indigo-950 text-white">
                <div className="text-4xl mb-2">🎬</div>
                <h3 className="text-base font-bold text-white mb-1">Khung phát bài học mẫu #{currentLesson.lessonNumber}</h3>
                <p className="text-xs text-slate-300 max-w-md mb-4 leading-relaxed">
                  Video mẫu thực hành bài học: <strong>{currentLesson.title}</strong> ({currentLesson.durationText}).
                </p>
                {currentLesson.videoUrl && (
                  <a
                    href={currentLesson.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-md"
                  >
                    Xem trực tiếp trên Youtube ↗
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[var(--bg-main)] p-4 rounded-xl border border-[var(--border-color)] mb-5" aria-label="Thông số bài học">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">🎯 Độ khó</span>
              <span><DifficultyBadge difficulty={currentLesson.difficulty} /></span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">⏱ Thời lượng</span>
              <span className="text-sm font-semibold text-indigo-600 dark:text-cyan-400">{currentLesson.durationText}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">📋 Tiên quyết</span>
              <span className="text-sm font-semibold text-[var(--text-main)]">{currentLesson.prerequisites.length} Yêu cầu</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">👨‍🏫 Giảng viên</span>
              <span className="text-xs font-semibold text-[var(--text-main)]">{currentLesson.instructor.name}</span>
            </div>
          </div>

          {/* Section 1: Learning Objectives */}
          <section className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 mb-5 shadow-xs" aria-labelledby="section-objectives">
            <h2 id="section-objectives" className="flex items-center gap-2 text-base font-bold text-[var(--text-main)] pb-3 mb-3 border-b border-[var(--border-color)]">
              🎯 Mục tiêu bài học (Learning Objectives)
            </h2>
            <ObjectiveList objectives={currentLesson.objectives} />
          </section>

          {/* Section 2: Prerequisites */}
          <section className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 mb-5 shadow-xs" aria-labelledby="section-prerequisites">
            <h2 id="section-prerequisites" className="flex items-center gap-2 text-base font-bold text-[var(--text-main)] pb-3 mb-3 border-b border-[var(--border-color)]">
              📋 Điều kiện tiên quyết (Prerequisites)
            </h2>
            <PrerequisiteCard prerequisites={currentLesson.prerequisites} />
          </section>

          {/* Section 3: Detailed Content */}
          <section className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 mb-5 shadow-xs" aria-labelledby="section-content">
            <h2 id="section-content" className="flex items-center gap-2 text-base font-bold text-[var(--text-main)] pb-3 mb-3 border-b border-[var(--border-color)]">
              📖 Nội dung hướng dẫn chi tiết
            </h2>
            <div className="font-mono text-xs text-[var(--text-main)] bg-[var(--bg-main)] p-4 rounded-xl border border-[var(--border-color)] leading-relaxed whitespace-pre-wrap">
              {currentLesson.contentMarkdown}
            </div>
          </section>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between gap-4 pt-4 border-t border-[var(--border-color)] mt-2" aria-label="Chuyển hướng bài học">
            {prevLesson ? (
              <button
                onClick={() => { setVideoError(false); onSelectLesson(prevLesson.id); }}
                className="px-4 py-2 text-xs font-semibold text-[var(--text-main)] bg-[var(--bg-main)] hover:bg-slate-200 dark:hover:bg-slate-800 border border-[var(--border-color)] rounded-xl transition-all"
                aria-label={`Bài trước: ${prevLesson.title}`}
              >
                ← Bài {prevLesson.lessonNumber}
              </button>
            ) : (
              <div />
            )}

            <button onClick={onBackToCatalog} className="px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-cyan-400 hover:bg-indigo-50 dark:hover:bg-cyan-500/10 border border-indigo-200 dark:border-cyan-500/40 rounded-xl transition-all">
              📋 Danh mục
            </button>

            {nextLesson ? (
              <button
                onClick={() => { setVideoError(false); onSelectLesson(nextLesson.id); }}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all"
                aria-label={`Bài tiếp theo: ${nextLesson.title}`}
              >
                Bài {nextLesson.lessonNumber} →
              </button>
            ) : (
              <button onClick={onBackToCatalog} className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all">
                🎉 Hoàn thành khóa học
              </button>
            )}
          </div>
        </main>

        {/* Right Sticky Sidebar */}
        <div className="lg:sticky lg:top-20">
          <LessonSidebar
            lessons={allLessons}
            currentLessonId={currentLesson.id}
            onSelectLesson={(id) => {
              setVideoError(false);
              onSelectLesson(id);
            }}
          />
        </div>
      </div>
    </div>
  );
};
