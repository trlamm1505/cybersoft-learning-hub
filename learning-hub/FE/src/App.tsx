import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { MOCK_LESSONS } from './data/mockLessons';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ResponsiveGuideModal } from './components/ResponsiveGuideModal';
import { CourseCatalogPage } from './pages/CourseCatalogPage';
import { LessonDetailPage } from './pages/LessonDetailPage';
import { QuizTakingPage } from './pages/QuizTakingPage';
import { CodePlaygroundPage } from './pages/CodePlaygroundPage';
import { TeacherAuthoringPage } from './pages/TeacherAuthoringPage';
import { ContestListPage } from './pages/ContestListPage';
import type { Lesson } from './types/course';
import type { LessonAuthoring } from './types/authoring';
import { authoringApi } from './axios/authoringApi';
import './styles/main.css';

const mapAuthoringToCourseLesson = (al: LessonAuthoring, index: number): Lesson => ({
  id: al._id || al.slug,
  lessonNumber: 6 + index,
  title: al.title,
  slug: al.slug || `lesson-${index}`,
  category: al.type === 'coding' ? 'Lập trình' : 'Trắc nghiệm',
  summary: al.description || al.learningOutcome || 'Bài học thiết kế bởi Giảng viên',
  difficulty:
    al.difficulty === 'EASY'
      ? 'Beginner'
      : al.difficulty === 'HARD'
      ? 'Advanced'
      : 'Intermediate',
  durationMinutes: 30,
  durationText: '30 phút',
  objectives: al.learningOutcome ? [al.learningOutcome] : ['Nắm vững kiến thức bài học'],
  prerequisites: [
    {
      id: `pre-auth-${index}`,
      title: 'Kiến thức lập trình cơ bản',
      isCompleted: true,
      description: 'Nắm vững kiến thức nền tảng trước khi làm bài',
    },
  ],
  contentMarkdown: al.content || 'Nội dung bài học',
  instructor: {
    name: 'Giảng viên CyberSoft',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Teacher',
    role: 'Senior Instructor',
  },
  tags: [al.type === 'coding' ? 'Programming' : 'Quiz', 'Teacher'],
});

export function App() {
  const navigate = useNavigate();
  const [teacherLessons, setTeacherLessons] = useState<LessonAuthoring[]>([]);

  const [selectedLessonId, setSelectedLessonId] = useState<string>(
    () => localStorage.getItem('app_selected_lesson_id') || MOCK_LESSONS[0].id,
  );
  const [isLightTheme, setIsLightTheme] = useState<boolean>(() => {
    const saved = localStorage.getItem('app_is_light_theme');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [userRole, setUserRole] = useState<'student' | 'teacher'>(() => {
    const savedRole = localStorage.getItem('app_user_role');
    return savedRole === 'teacher' ? 'teacher' : 'student';
  });
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

  // Fetch teacher lessons from BE on load
  const fetchTeacherLessons = useCallback(async () => {
    try {
      const res = await authoringApi.getLessons();
      if (Array.isArray(res)) {
        setTeacherLessons(res);
      }
    } catch (err) {
      console.warn('Backend authoring API offline, using local storage cache.');
      const local = localStorage.getItem('app_teacher_saved_lessons');
      if (local) {
        try {
          setTeacherLessons(JSON.parse(local));
        } catch (e) {
          /* ignore */
        }
      }
    }
  }, []);

  useEffect(() => {
    fetchTeacherLessons();
  }, [fetchTeacherLessons]);

  // Filter published lessons for student views (Draft lessons are hidden from users)
  const publishedTeacherLessons = teacherLessons.filter(
    (l) => l.status === 'published' || l.status === undefined
  );

  // Combine Mock lessons with Published Teacher created lessons
  const convertedTeacherLessons = publishedTeacherLessons.map(mapAuthoringToCourseLesson);
  
  // Catalog lessons for Homepage (only core course curriculum, excluding standalone coding & quiz exercises)
  const catalogLessons: Lesson[] = [
    ...MOCK_LESSONS,
    ...convertedTeacherLessons.filter(
      (_, idx) => {
        const orig = publishedTeacherLessons[idx];
        return orig && orig.type !== 'coding' && orig.type !== 'quiz';
      }
    ),
  ];

  const allLessons: Lesson[] = [...MOCK_LESSONS, ...convertedTeacherLessons];

  // Sync theme class with document element and save preference
  useEffect(() => {
    localStorage.setItem('app_is_light_theme', JSON.stringify(isLightTheme));
    if (isLightTheme) {
      document.documentElement.classList.remove('theme-dark');
    } else {
      document.documentElement.classList.add('theme-dark');
    }
  }, [isLightTheme]);

  // Sync user role preference
  useEffect(() => {
    localStorage.setItem('app_user_role', userRole);
  }, [userRole]);

  // Save selected lesson ID to localStorage
  useEffect(() => {
    if (selectedLessonId) {
      localStorage.setItem('app_selected_lesson_id', selectedLessonId);
    }
  }, [selectedLessonId]);

  const currentLesson = allLessons.find((l) => l.id === selectedLessonId) || allLessons[0];

  const handleSelectLessonFromCatalog = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    navigate(`/detail/${lessonId}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleRole = () => {
    setUserRole((prev) => (prev === 'student' ? 'teacher' : 'student'));
  };

  const handleLessonSaved = (savedLesson: LessonAuthoring) => {
    setTeacherLessons((prev) => {
      const exists = prev.some((l) => (l._id && l._id === savedLesson._id) || l.slug === savedLesson.slug);
      const updated = exists
        ? prev.map((l) => ((l._id && l._id === savedLesson._id) || l.slug === savedLesson.slug ? savedLesson : l))
        : [savedLesson, ...prev];
      localStorage.setItem('app_teacher_saved_lessons', JSON.stringify(updated));
      return updated;
    });
  };

  const handleLessonDeleted = (deletedId: string) => {
    setTeacherLessons((prev) => {
      const updated = prev.filter((l) => l._id !== deletedId && l.slug !== deletedId);
      localStorage.setItem('app_teacher_saved_lessons', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation Header */}
      <Header
        isLightTheme={isLightTheme}
        onToggleTheme={() => setIsLightTheme(!isLightTheme)}
        onOpenGuide={() => setIsGuideOpen(true)}
        userRole={userRole}
        onToggleRole={handleToggleRole}
      />

      {/* Main Routes Container */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Navigate to={userRole === 'teacher' ? '/authoring' : '/catalog'} replace />} />
          <Route
            path="/catalog"
            element={
              <CourseCatalogPage
                lessons={catalogLessons}
                onSelectLesson={handleSelectLessonFromCatalog}
              />
            }
          />
          <Route
            path="/detail"
            element={
              <LessonDetailPage
                currentLesson={currentLesson}
                allLessons={allLessons}
                onSelectLesson={(id) => {
                  setSelectedLessonId(id);
                  navigate(`/detail/${id}`);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onBackToCatalog={() => {
                  navigate('/catalog');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            }
          />
          <Route
            path="/detail/:lessonId"
            element={
              <LessonDetailPage
                currentLesson={currentLesson}
                allLessons={allLessons}
                onSelectLesson={(id) => {
                  setSelectedLessonId(id);
                  navigate(`/detail/${id}`);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onBackToCatalog={() => {
                  navigate('/catalog');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            }
          />
          <Route
            path="/quiz"
            element={<QuizTakingPage teacherLessons={publishedTeacherLessons} />}
          />
          <Route path="/playground" element={<CodePlaygroundPage isDark={!isLightTheme} teacherLessons={publishedTeacherLessons} />} />
          <Route path="/contests" element={<ContestListPage />} />
          <Route
            path="/authoring"
            element={
              <TeacherAuthoringPage
                onLessonSaved={handleLessonSaved}
                onLessonDeleted={handleLessonDeleted}
              />
            }
          />
          <Route path="*" element={<Navigate to={userRole === 'teacher' ? '/authoring' : '/catalog'} replace />} />
        </Routes>
      </div>

      {/* Footer */}
      <Footer />

      {/* Responsive Screenshot Guide Modal */}
      <ResponsiveGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}

export default App;
