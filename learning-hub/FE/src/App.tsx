import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { MOCK_LESSONS } from './data/mockLessons';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CourseCatalogPage } from './pages/CourseCatalogPage';
import { LessonDetailPage } from './pages/LessonDetailPage';
import { QuizTakingPage } from './pages/QuizTakingPage';
import { CodePlaygroundPage } from './pages/CodePlaygroundPage';
import { BlockPuzzlePage } from './pages/BlockPuzzlePage';
import { TeacherAuthoringPage } from './pages/TeacherAuthoringPage';
import { TeacherExerciseFormPage } from './pages/TeacherExerciseFormPage';
import { KidHeader } from './components/KidHeader';
import { MyClassPage } from './pages/MyClassPage';
import { KidFooter } from './components/KidFooter';
import { KidProgressView } from './components/KidProgressView';
import { KidProfileView } from './components/KidProfileView';
import { KidLeaderboardPage } from './components/KidLeaderboardPage';
import { isKidAllowedPath, isKidMode, KID_HOME } from './common/kidMode';
import { homeFor, isAuthPath } from './common/authRoutes';
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
import { CareerLabsPage } from './pages/CareerLabsPage';
import { CareerMyClassPage } from './pages/CareerMyClassPage';
import { careerBlockedPath, isCareerAdult } from './common/userGroups';
import { TeacherDashboardPage } from './pages/TeacherDashboardPage';
import { TeacherOverviewPage } from './pages/TeacherOverviewPage';
import { TeacherClassesPage } from './pages/TeacherClassesPage';
import { TeacherLayout } from './components/TeacherLayout';
import { AUTHORING_TABS, TeacherSubNav } from './components/TeacherSubNav';
import { TeacherGradingPage } from './pages/TeacherGradingPage';
import { AiGeneratorGate } from './components/AiGeneratorGate';
import { AdminClassesPage } from './pages/AdminClassesPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AdminSettingsPage } from './pages/AdminSettingsPage';
import { AdminHealthPage } from './pages/AdminHealthPage';
import { AdminAuditPage } from './pages/AdminAuditPage';
import { AdminLayout } from './components/AdminLayout';
import { portalHome } from './pages/adminDashboardModel';
import { ContestListPage } from './pages/ContestListPage';
import { TeacherQuestionBankPage } from './pages/TeacherQuestionBankPage';
import { TeacherContestAuthoring } from './components/TeacherContestAuthoring';
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
import { browserSessionGuard, markSessionExpiredNotice } from './common/sessionGuard';
import { AUTH_USER_KEY, clearAuthSession, getStoredToken, isTokenExpired } from './common/authSession';
import './styles/main.css';

export function App() {
  const navigate = useNavigate();
  const location = useLocation();
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
      // Có token cũ nhưng đã hết hạn: báo thân thiện ở trang đăng nhập thay vì chỉ lặng lẽ đẩy ra.
      if (token && isTokenExpired(token)) markSessionExpiredNotice();
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

  // Kid Mode (Lớp 3-5): toàn bộ vỏ giao diện đổi sang bản trẻ em, luôn ở giao diện sáng.
  const kidMode = isKidMode(authUser, location.search);

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
  // Catalog chỉ hiện 5 bài mẫu chuẩn; bài giảng GV tự tạo (đánh số 31/32...) chỉ nằm trong Chi tiết bài học.
  const catalogLessons: Lesson[] = [...MOCK_LESSONS];

  // Sidebar /detail cũng chỉ giữ 5 bài chuẩn: bài giảng GV tự tạo (Bài 31/32...) không lẫn vào danh sách.
  const allLessons: Lesson[] = [...MOCK_LESSONS];

  // Sync theme class with document element and save preference
  // Kid Mode: mỗi lần đổi trang đều về đầu trang (không bắt bé kéo lên).
  useEffect(() => {
    if (kidMode) window.scrollTo({ top: 0, behavior: 'auto' });
  }, [kidMode, location.pathname, location.search]);

  useEffect(() => {
    document.documentElement.classList.toggle('kid-mode', kidMode);
  }, [kidMode]);

  useEffect(() => {
    localStorage.setItem('app_is_light_theme', JSON.stringify(isLightTheme));
    if (isLightTheme || kidMode) {
      document.documentElement.classList.remove('theme-dark');
    } else {
      document.documentElement.classList.add('theme-dark');
    }
  }, [isLightTheme, kidMode]);

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
    browserSessionGuard.reset();
    localStorage.setItem('token', auth.accessToken);
    if (auth.csrfToken) localStorage.setItem('csrf_token', auth.csrfToken);
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
    // Thu hồi token phía server trước khi xoá bản lưu cục bộ; lỗi mạng không chặn đăng xuất.
    authApi.logout().catch(() => undefined);
    clearAuthSession();
    setAuthUser(null);
    // Học sinh Kid Mode về trang đăng nhập sạch; người dùng khác giữ hành vi cũ.
    // Chưa đăng nhập thì chỉ được ở trang đăng nhập (xem route guard bên dưới).
    navigate('/login');
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
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
          <Route path="/admin/health" element={<AdminHealthPage />} />
          <Route path="/admin/audit" element={<AdminAuditPage />} />
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

  if (authUser?.role === 'TEACHER') {
    // Công cụ soạn bài giảng/đề trắc nghiệm đời đầu và các màn QA nội bộ giữ nguyên tại /teacher/lessons (ẩn khỏi menu).
    const toLessons = (view?: string) => (
      <Navigate to={`/teacher/lessons${view ? `?view=${view}` : location.search}`} replace />
    );
    return (
      <Routes>
        <Route
          element={
            <TeacherLayout
              authUser={authUser}
              isLightTheme={isLightTheme}
              onToggleTheme={() => setIsLightTheme(!isLightTheme)}
              onLogout={handleLogout}
            />
          }
        >
          <Route path="/teacher" element={<TeacherOverviewPage />} />
          <Route path="/teacher/dashboard" element={<TeacherOverviewPage />} />
          <Route path="/teacher/classes" element={<TeacherClassesPage />} />
          <Route path="/teacher/analytics" element={<TeacherDashboardPage />} />
          <Route path="/teacher/grading" element={<TeacherGradingPage />} />
          <Route path="/teacher/grading/insight" element={<TeacherReviewQueue />} />
          <Route path="/teacher/grading/labs" element={<TeacherLabSubmissionsPage />} />
          <Route path="/teacher/grading/integrity" element={<TeacherIntegrityQueuePage />} />
          <Route path="/teacher/authoring" element={<TeacherSubNav title="Soạn đề" items={AUTHORING_TABS} />}>
            <Route index element={<TeacherExerciseFormPage />} />
            <Route path="ai" element={<AiGeneratorGate><TeacherProblemGeneratorPage /></AiGeneratorGate>} />
            <Route path="bank" element={<AiGeneratorGate><TeacherQuestionBankPage /></AiGeneratorGate>} />
          </Route>
          <Route path="/teacher/contests" element={<AiGeneratorGate redirectTo="/teacher/dashboard"><TeacherContestAuthoring /></AiGeneratorGate>} />
          <Route
            path="/teacher/lessons"
            element={<TeacherAuthoringPage onLessonSaved={handleLessonSaved} onLessonDeleted={handleLessonDeleted} />}
          />
          {/* Công cụ nội bộ: ẩn khỏi sidebar nhưng vẫn vào được bằng URL cho đội QA/Dev. */}
          <Route path="/teacher/harness" element={toLessons('qa')} />
          <Route path="/teacher/usability" element={toLessons('usability')} />
          <Route path="/teacher/resilience" element={toLessons('resilience')} />
          <Route path="/tester-labs" element={<TesterLabListPage />} />
          <Route path="/tester-labs/:labCode" element={<TesterLabDetailPage isStudent={false} />} />
          <Route
            path="/teacher/profile"
            element={<ProfilePage authUser={authUser} onAvatarChange={handleAvatarChanged} onProfileChange={handleProfileUpdated} />}
          />
          {/* Đường dẫn cũ của giao diện giảng viên trước V2. */}
          <Route path="/authoring" element={toLessons()} />
          <Route path="/teacher/exercises" element={<Navigate to="/teacher/authoring" replace />} />
          <Route path="/problem-generator" element={<Navigate to="/teacher/authoring/ai" replace />} />
          <Route path="/teacher/authoring/exercises" element={<Navigate to="/teacher/authoring" replace />} />
          <Route path="/teacher/authoring/generator" element={<Navigate to="/teacher/authoring/ai" replace />} />
          <Route path="/teacher/review-queue" element={<Navigate to="/teacher/grading/insight" replace />} />
          <Route path="/teacher/lab-submissions" element={<Navigate to="/teacher/grading/labs" replace />} />
          <Route path="/teacher/integrity" element={<Navigate to="/teacher/grading/integrity" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/teacher/dashboard" replace />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {needsAgeGroup && <AgeGroupModal onSelected={handleAgeGroupSelected} />}

      {/* Navigation Header: Kid Mode dùng thanh điều hướng riêng với đúng 2 nút lớn */}
      {kidMode ? (
        <KidHeader authUser={authUser} onLogout={handleLogout} />
      ) : (
        <Header
          isLightTheme={isLightTheme}
          onToggleTheme={() => setIsLightTheme(!isLightTheme)}
          userRole={userRole}
          authUser={authUser}
          onLogout={handleLogout}
        />
      )}

      {/* Main Routes Container */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-6">
        {/* Khóa trang khi chưa đăng nhập: mọi đường dẫn ngoài trang xác thực đều chuyển về /login. */}
        {!authUser && !isAuthPath(location.pathname) && <Navigate to="/login" replace />}
        {/* Đã đăng nhập mà vào trang đăng nhập/đăng ký thì đưa về trang chủ theo vai trò và nhóm tuổi. */}
        {authUser && (location.pathname === '/login' || location.pathname === '/register') && (
          <Navigate to={homeFor(authUser)} replace />
        )}
        {/* Kid Mode: chỉ mở Góc Học Tập, Block Puzzle, Thành tích, Hồ sơ; mọi trang khác về Góc Học Tập. */}
        {kidMode && !isKidAllowedPath(location.pathname) && <Navigate to={KID_HOME} replace />}
        {/* Người đi làm / Trái ngành: ẩn Playground, Thi trắc nghiệm phổ thông và Cuộc thi; về Hub phòng lab. */}
        {isCareerAdult(authUser) && careerBlockedPath(location.pathname, location.search) && <Navigate to="/career-labs" replace />}
        <Routes>
          <Route path="/" element={<Navigate to={homeFor(authUser)} replace />} />
          <Route path="/career-labs" element={<StudentRoute authUser={authUser}><CareerLabsPage /></StudentRoute>} />
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
            element={<CodePlaygroundPage isDark={!isLightTheme} teacherLessons={publishedTeacherLessons} authUser={authUser} kidMode={kidMode} />}
          />
          <Route
            path="/block-puzzle"
            element={<BlockPuzzlePage teacherLessons={publishedTeacherLessons} authUser={authUser} kidMode={kidMode} />}
          />
          <Route
            path="/kid-leaderboard"
            element={kidMode ? <KidLeaderboardPage teacherLessons={publishedTeacherLessons} /> : <Navigate to={isCareerAdult(authUser) ? '/career-labs' : '/catalog'} replace />}
          />
          <Route path="/contests" element={<ContestListPage authUser={authUser} />} />
          <Route path="/login" element={<LoginPage onAuthSuccess={handleAuthSuccess} />} />
          <Route path="/register" element={<RegisterPage onAuthSuccess={handleAuthSuccess} />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route
            path="/progress"
            element={
              kidMode ? (
                <KidProgressView authUser={authUser} teacherLessons={publishedTeacherLessons} />
              ) : authUser?.role === 'STUDENT' ? (
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
          {/* Teacher Studio có khung riêng; người không phải giảng viên vào /teacher/* bị đưa về trang chủ của vai trò mình (hoặc /login). */}
          <Route path="/teacher/*" element={<Navigate to={authUser ? homeFor(authUser) : '/login'} replace />} />
          <Route path="/authoring" element={<Navigate to={authUser ? homeFor(authUser) : '/login'} replace />} />
          <Route path="/problem-generator" element={<Navigate to={authUser ? homeFor(authUser) : '/login'} replace />} />
          {/* Admin Portal có khung riêng; ai không phải ADMIN vào /admin/* đều bị đưa về trang chủ của vai trò mình. */}
          <Route path="/admin/*" element={<Navigate to={authUser ? portalHome(authUser.role) : '/login'} replace />} />
          <Route path="/my-class" element={<StudentRoute authUser={authUser}>{isCareerAdult(authUser) ? <CareerMyClassPage /> : <MyClassPage />}</StudentRoute>} />
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
            element={
              authUser ? (
                kidMode ? (
                  <KidProfileView
                    authUser={authUser}
                    teacherLessons={publishedTeacherLessons}
                    onAvatarChange={handleAvatarChanged}
                    onProfileChange={handleProfileUpdated}
                  />
                ) : (
                  <ProfilePage authUser={authUser} onAvatarChange={handleAvatarChanged} onProfileChange={handleProfileUpdated} />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route path="*" element={<Navigate to={homeFor(authUser)} replace />} />
        </Routes>
      </div>

      {/* Footer */}
      {kidMode ? <KidFooter /> : <Footer />}
    </div>
  );
}

export default App;
