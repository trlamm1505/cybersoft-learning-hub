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
import { TeacherProblemGeneratorPage } from './pages/TeacherProblemGeneratorPage';
import { LearnerProgressPage } from './pages/LearnerProgressPage';
import { ProfilePage } from './pages/ProfilePage';
import { TesterLabListPage } from './pages/TesterLabListPage';
import { TesterLabDetailPage } from './pages/TesterLabDetailPage';
import { DaLabListPage } from './pages/DaLabListPage';
import { DaLabWorkspacePage } from './pages/DaLabWorkspacePage';
import { AiLabListPage } from './pages/AiLabListPage';
import { StudentRoute } from './components/StudentRoute';
import { AiLabWorkspacePage } from './pages/AiLabWorkspacePage';
import { TeacherReviewQueue } from './components/TeacherReviewQueue';
import { TeacherLabSubmissionsPage } from './pages/TeacherLabSubmissionsPage';
import { TeacherIntegrityQueuePage } from './pages/TeacherIntegrityQueuePage';
import { TeacherDashboardPage } from './pages/TeacherDashboardPage';
import { AdminClassesPage } from './pages/AdminClassesPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AdminLayout } from './components/AdminLayout';
import { portalHome } from './pages/adminDashboardModel';
import { ContestListPage } from './pages/ContestListPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { AgeGroupModal } from './components/AgeGroupModal';
import type { Lesson } from './types/course';
import type { LessonAuthoring } from './types/authoring';
import type { AuthUser, AuthResponse } from './types/auth';
import { isStaff } from './types/auth';
import { authoringApi } from './axios/authoringApi';
import { authApi } from './axios/authApi';
import { AUTH_USER_KEY, clearAuthSession, getStoredToken, isTokenExpired } from './common/authSession';
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
    // Không có token hoặc token đã hết hạn thì bản user lưu sẵn là vô nghĩa.
    const token = getStoredToken();
    const saved = localStorage.getItem(AUTH_USER_KEY);
    if (!token || isTokenExpired(token) || !saved) {
      clearAuthSession();
      return null;
    }
    try {
      return JSON.parse(saved) as AuthUser;
    } catch {
      return null;
    }
  });
  // Vai trò lưu trong localStorage có thể bị sửa tay: xác thực lại với BE
  // (GET /auth/me) trước khi render các trang phân quyền.
  const [authVerified, setAuthVerified] = useState(() => !getStoredToken());
  useEffect(() => {
    if (!getStoredToken()) return;
    authApi
      .me()
      .then((me) => {
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(me));
        setAuthUser(me);
      })
      .catch((err) => {
        // 401 đã được interceptor xử lý (xoá phiên, về /login). Lỗi mạng: giữ phiên
        // đã lưu, mọi API vẫn được BE kiểm tra quyền theo token.
        if (err?.response?.status === 401) setAuthUser(null);
      })
      .finally(() => setAuthVerified(true));
  }, []);
  // Role hiện được suy ra từ tài khoản đã đăng nhập; mặc định 'student' khi chưa đăng nhập
  // (giữ trải nghiệm xem trước hiện có cho khách chưa có tài khoản).
  // TEACHER và ADMIN cùng dùng giao diện giảng viên (ma trận quyền chung với BE).
  const userRole: 'student' | 'teacher' = isStaff(authUser?.role) ? 'teacher' : 'student';

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
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(auth.user));
    setAuthUser(auth.user);
    setAuthVerified(true);
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

  // Đổi/xóa ảnh đại diện: cập nhật phiên đăng nhập để header và trang cá nhân đổi ngay.
  const handleAvatarChanged = (avatar: string | undefined) => {
    setAuthUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, avatar };
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const handleProfileUpdated = (updated: AuthUser) => {
    setAuthUser((prev) => {
      if (!prev) return prev;
      const merged = { ...prev, ...updated };
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(merged));
      return merged;
    });
  };

  const handleLogout = () => {
    // Chỉ xoá phiên đăng nhập — KHÔNG xoá tiến độ học tập namespace theo
    // authUser.id (app_code_playground_completed_<id>, app_block_puzzle_completed_<id>...).
    // Tiến độ đó phải được GIỮ LẠI để lần sau đăng nhập đúng tài khoản này
    // vẫn thấy đúng những gì đã hoàn thành; namespace theo id đã đủ để tách
    // biệt giữa các tài khoản khác nhau trên cùng trình duyệt, không cần xoá.
    clearAuthSession();
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

  if (!authVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[var(--text-muted)]">
        Đang kiểm tra phiên đăng nhập...
      </div>
    );
  }

  if (authUser?.role === 'ADMIN') {
    return (
      <Routes>
        <Route
          element={
            <AdminLayout
              authUser={authUser}
              isLightTheme={isLightTheme}
              onToggleTheme={() => setIsLightTheme(!isLightTheme)}
              onLogout={handleLogout}
            />
          }
        >
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/classes" element={<AdminClassesPage />} />
          <Route
            path="/admin/profile"
            element={<ProfilePage authUser={authUser} onAvatarChange={handleAvatarChanged} onProfileChange={handleProfileUpdated} />}
          />
        </Route>
        {/* Mọi đường dẫn khác (kể cả trang học tập) đưa Admin về Admin Portal. */}
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    );
  }

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
                authUser={authUser}
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
              isStaff(authUser?.role) ? (
                <TeacherAuthoringPage
                  onLessonSaved={handleLessonSaved}
                  onLessonDeleted={handleLessonDeleted}
                />
              ) : (
                <Navigate to={authUser ? '/catalog' : '/login'} replace />
              )
            }
          />
          <Route
            path="/problem-generator"
            element={
              isStaff(authUser?.role) ? (
                <TeacherProblemGeneratorPage />
              ) : (
                <Navigate to={authUser ? '/catalog' : '/login'} replace />
              )
            }
          />
          <Route
            path="/progress"
            element={
              authUser?.role === 'STUDENT' ? (
                <LearnerProgressPage />
              ) : (
                <Navigate to={authUser ? '/catalog' : '/login'} replace />
              )
            }
          />
          <Route
            path="/tester-labs"
            element={authUser ? <TesterLabListPage /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/tester-labs/:labCode"
            element={authUser ? <TesterLabDetailPage isStudent={authUser.role === 'STUDENT'} /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/teacher/review-queue"
            element={
              isStaff(authUser?.role) ? (
                <TeacherReviewQueue />
              ) : (
                <Navigate to={authUser ? '/catalog' : '/login'} replace />
              )
            }
          />
          <Route
            path="/teacher/lab-submissions"
            element={
              isStaff(authUser?.role) ? (
                <TeacherLabSubmissionsPage />
              ) : (
                <Navigate to={authUser ? '/catalog' : '/login'} replace />
              )
            }
          />
          {/* Admin Portal có khung riêng; ai không phải ADMIN vào /admin/* đều bị đưa về trang chủ của vai trò mình. */}
          <Route path="/admin/*" element={<Navigate to={authUser ? portalHome(authUser.role) : '/login'} replace />} />
          <Route
            path="/teacher/dashboard"
            element={
              isStaff(authUser?.role) ? (
                <TeacherDashboardPage />
              ) : (
                <Navigate to={authUser ? '/catalog' : '/login'} replace />
              )
            }
          />
          <Route
            path="/teacher/integrity"
            element={
              isStaff(authUser?.role) ? (
                <TeacherIntegrityQueuePage />
              ) : (
                <Navigate to={authUser ? '/catalog' : '/login'} replace />
              )
            }
          />
          <Route
            path="/da-labs"
            element={<StudentRoute authUser={authUser}><DaLabListPage /></StudentRoute>}
          />
          <Route
            path="/da-labs/:slug"
            element={<StudentRoute authUser={authUser}><DaLabWorkspacePage isDark={!isLightTheme} /></StudentRoute>}
          />
          <Route
            path="/ai-labs"
            element={<StudentRoute authUser={authUser}><AiLabListPage /></StudentRoute>}
          />
          <Route
            path="/ai-labs/:slug"
            element={<StudentRoute authUser={authUser}><AiLabWorkspacePage /></StudentRoute>}
          />
          <Route
            path="/profile"
            element={authUser ? <ProfilePage authUser={authUser} onAvatarChange={handleAvatarChanged} onProfileChange={handleProfileUpdated} /> : <Navigate to="/login" replace />}
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
