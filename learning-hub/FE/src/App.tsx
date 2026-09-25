import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { MOCK_LESSONS } from './data/mockLessons';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CourseCatalogPage } from './pages/CourseCatalogPage';
import { LessonDetailPage } from './pages/LessonDetailPage';
import { QuizTakingPage } from './pages/QuizTakingPage';
import { CodePlaygroundPage } from './pages/CodePlaygroundPage';
import { BlockPuzzlePage } from './pages/BlockPuzzlePage';
import { TeacherAuthoringPage } from './pages/TeacherAuthoringPage';
import { ContestListPage } from './pages/ContestListPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { AgeGroupModal } from './components/AgeGroupModal';
import type { Lesson } from './types/course';
import type { LessonAuthoring } from './types/authoring';
import type { AuthUser, AuthResponse } from './types/auth';
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
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('app_auth_user');
    if (!saved) return null;
    try {
      return JSON.parse(saved) as AuthUser;
    } catch {
      return null;
    }
  });
  // Role hiện được suy ra từ tài khoản đã đăng nhập; mặc định 'student' khi chưa đăng nhập
  // (giữ trải nghiệm xem trước hiện có cho khách chưa có tài khoản).
  const userRole: 'student' | 'teacher' = authUser?.role === 'TEACHER' ? 'teacher' : 'student';

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

  // Only core course curriculum (theory/article lessons) belongs in "Lesson Detail" —
  // standalone coding/quiz/block exercises live in Code Playground / Quiz / Block
  // Puzzle instead, and must not leak into this list (used both for the Catalog
  // grid and for Lesson Detail's sidebar + prev/next navigation).
  const curriculumTeacherLessons = convertedTeacherLessons.filter((_, idx) => {
    const orig = publishedTeacherLessons[idx];
    return orig && orig.type !== 'coding' && orig.type !== 'quiz' && orig.type !== 'block';
  });

  const catalogLessons: Lesson[] = [...MOCK_LESSONS, ...curriculumTeacherLessons];

  const allLessons: Lesson[] = [...MOCK_LESSONS, ...curriculumTeacherLessons];

  // Sync theme class with document element and save preference
  useEffect(() => {
    localStorage.setItem('app_is_light_theme', JSON.stringify(isLightTheme));
    if (isLightTheme) {
      document.documentElement.classList.remove('theme-dark');
    } else {
      document.documentElement.classList.add('theme-dark');
    }
  }, [isLightTheme]);

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

  const handleAuthSuccess = (auth: AuthResponse) => {
    localStorage.setItem('token', auth.accessToken);
    localStorage.setItem('app_auth_user', JSON.stringify(auth.user));
    setAuthUser(auth.user);
  };

  // Modal chọn nhóm tuổi bắt buộc hiện ngay khi một tài khoản STUDENT chưa
  // có ageGroup đăng nhập (lần đầu tiên) — thay cho việc chọn lúc đăng ký.
  const needsAgeGroup = authUser?.role === 'STUDENT' && !authUser.ageGroup;

  const handleAgeGroupSelected = (ageGroup: AuthUser['ageGroup']) => {
    setAuthUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ageGroup };
      localStorage.setItem('app_auth_user', JSON.stringify(updated));
      return updated;
    });
  };

  const handleLogout = () => {
    // Chỉ xoá phiên đăng nhập — KHÔNG xoá tiến độ học tập namespace theo
    // authUser.id (app_code_playground_completed_<id>, app_block_puzzle_completed_<id>...).
    // Tiến độ đó phải được GIỮ LẠI để lần sau đăng nhập đúng tài khoản này
    // vẫn thấy đúng những gì đã hoàn thành; namespace theo id đã đủ để tách
    // biệt giữa các tài khoản khác nhau trên cùng trình duyệt, không cần xoá.
    localStorage.removeItem('token');
    localStorage.removeItem('app_auth_user');
    setAuthUser(null);
    navigate('/catalog');
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
      {needsAgeGroup && <AgeGroupModal onSelected={handleAgeGroupSelected} />}

      {/* Navigation Header */}
      <Header
        isLightTheme={isLightTheme}
        onToggleTheme={() => setIsLightTheme(!isLightTheme)}
        userRole={userRole}
        authUser={authUser}
        onLogout={handleLogout}
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
              authUser ? (
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
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/detail/:lessonId"
            element={
              authUser ? (
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
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/quiz"
            element={<QuizTakingPage teacherLessons={publishedTeacherLessons} authUser={authUser} />}
          />
          <Route
            path="/playground"
            element={<CodePlaygroundPage isDark={!isLightTheme} teacherLessons={publishedTeacherLessons} authUser={authUser} />}
          />
          <Route
            path="/block-puzzle"
            element={<BlockPuzzlePage teacherLessons={publishedTeacherLessons} authUser={authUser} />}
          />
          <Route path="/contests" element={<ContestListPage authUser={authUser} />} />
          <Route path="/login" element={<LoginPage onAuthSuccess={handleAuthSuccess} />} />
          <Route path="/register" element={<RegisterPage onAuthSuccess={handleAuthSuccess} />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route
            path="/authoring"
            element={
              authUser?.role === 'TEACHER' ? (
                <TeacherAuthoringPage
                  onLessonSaved={handleLessonSaved}
                  onLessonDeleted={handleLessonDeleted}
                />
              ) : (
                <Navigate to={authUser ? '/catalog' : '/login'} replace />
              )
            }
          />
          <Route path="*" element={<Navigate to={userRole === 'teacher' ? '/authoring' : '/catalog'} replace />} />
        </Routes>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default App;
