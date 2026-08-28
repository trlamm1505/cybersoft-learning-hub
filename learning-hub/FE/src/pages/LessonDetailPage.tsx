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
    <div className="lesson-detail-page">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" style={{ marginBottom: '1.25rem' }}>
        <ol style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', listStyle: 'none', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          <li>
            <button
              onClick={onBackToCatalog}
              style={{ background: 'none', border: 'none', color: 'var(--secondary)', cursor: 'pointer', padding: 0, fontSize: '0.875rem', fontWeight: 600 }}
            >
              📚 Danh mục bài học
            </button>
          </li>
          <li aria-hidden="true">/</li>
          <li style={{ color: 'var(--text-main)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Bài {currentLesson.lessonNumber}: {currentLesson.title}
          </li>
        </ol>
      </nav>

      {/* Main 2-Column Responsive Layout - Aligned Header & Sidebar */}
      <div className="detail-layout">
        {/* Left Main Content */}
        <main id="main-content">
          {/* Lesson Header Title */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Bài {currentLesson.lessonNumber} • {currentLesson.category}
              </span>
              <DifficultyBadge difficulty={currentLesson.difficulty} />
            </div>

            <h1 style={{ marginBottom: '0.5rem', lineHeight: '1.3' }}>
              {currentLesson.title}
            </h1>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>
              {currentLesson.summary}
            </p>
          </div>

          {/* Video Player Container (Dynamic iframe key forces instant refresh) */}
          <div className="video-container" aria-label="Khung trình chiếu bài học">
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
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '2rem', textAlign: 'center', color: '#f8fafc', background: 'linear-gradient(135deg, #1e1b4b, #0f172a)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎬</div>
                <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>Khung phát bài học mẫu #{currentLesson.lessonNumber}</h3>
                <p style={{ fontSize: '0.875rem', color: '#94a3b8', maxWidth: '480px', marginBottom: '1rem' }}>
                  Video mẫu thực hành bài học: <strong>{currentLesson.title}</strong> ({currentLesson.durationText}).
                </p>
                {currentLesson.videoUrl && (
                  <a
                    href={currentLesson.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary btn-sm"
                  >
                    Xem trực tiếp trên Youtube ↗
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Metadata Grid */}
          <div className="meta-grid" aria-label="Thông số bài học">
            <div className="meta-item">
              <span className="meta-label">🎯 Độ khó</span>
              <span className="meta-value">
                <DifficultyBadge difficulty={currentLesson.difficulty} />
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label">⏱ Thời lượng</span>
              <span className="meta-value" style={{ color: 'var(--secondary)' }}>
                {currentLesson.durationText}
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label">📋 Tiên quyết</span>
              <span className="meta-value">
                {currentLesson.prerequisites.length} Yêu cầu
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label">👨‍🏫 Giảng viên</span>
              <span className="meta-value" style={{ fontSize: '0.85rem' }}>
                {currentLesson.instructor.name}
              </span>
            </div>
          </div>

          {/* Section 1: Learning Objectives */}
          <section className="info-section" aria-labelledby="section-objectives">
            <h2 id="section-objectives" className="info-section-title">
              🎯 Mục tiêu bài học (Learning Objectives)
            </h2>
            <ObjectiveList objectives={currentLesson.objectives} />
          </section>

          {/* Section 2: Prerequisites */}
          <section className="info-section" aria-labelledby="section-prerequisites">
            <h2 id="section-prerequisites" className="info-section-title">
              📋 Điều kiện tiên quyết (Prerequisites)
            </h2>
            <PrerequisiteCard prerequisites={currentLesson.prerequisites} />
          </section>

          {/* Section 3: Detailed Content */}
          <section className="info-section" aria-labelledby="section-content">
            <h2 id="section-content" className="info-section-title">
              📖 Nội dung hướng dẫn chi tiết
            </h2>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                background: 'var(--bg-main)',
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                whiteSpace: 'pre-wrap',
                lineHeight: '1.6',
                color: 'var(--text-main)'
              }}
            >
              {currentLesson.contentMarkdown}
            </div>
          </section>

          {/* Navigation Controls */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem',
              marginTop: '1.75rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid var(--border-color)'
            }}
            aria-label="Chuyển hướng bài học"
          >
            {prevLesson ? (
              <button
                onClick={() => { setVideoError(false); onSelectLesson(prevLesson.id); }}
                className="btn btn-secondary"
                aria-label={`Bài trước: ${prevLesson.title}`}
              >
                ← Bài {prevLesson.lessonNumber}
              </button>
            ) : (
              <div />
            )}

            <button onClick={onBackToCatalog} className="btn btn-outline btn-sm">
              📋 Danh mục
            </button>

            {nextLesson ? (
              <button
                onClick={() => { setVideoError(false); onSelectLesson(nextLesson.id); }}
                className="btn btn-primary"
                aria-label={`Bài tiếp theo: ${nextLesson.title}`}
              >
                Bài {nextLesson.lessonNumber} →
              </button>
            ) : (
              <button onClick={onBackToCatalog} className="btn btn-primary">
                🎉 Hoàn thành khóa học
              </button>
            )}
          </div>
        </main>

        {/* Right Sidebar: Aligned with video player on desktop */}
        <div style={{ position: 'sticky', top: '80px' }}>
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
