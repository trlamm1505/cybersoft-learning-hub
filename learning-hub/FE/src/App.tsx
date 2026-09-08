import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { MOCK_LESSONS } from './data/mockLessons';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ResponsiveGuideModal } from './components/ResponsiveGuideModal';
import { CourseCatalogPage } from './pages/CourseCatalogPage';
import { LessonDetailPage } from './pages/LessonDetailPage';
import { QuizTakingPage } from './pages/QuizTakingPage';
import { CodePlaygroundPage } from './pages/CodePlaygroundPage';
import './styles/main.css';

export function App() {
  const navigate = useNavigate();
  const [selectedLessonId, setSelectedLessonId] = useState<string>(
    () => localStorage.getItem('app_selected_lesson_id') || MOCK_LESSONS[0].id,
  );
  const [isLightTheme, setIsLightTheme] = useState<boolean>(() => {
    const saved = localStorage.getItem('app_is_light_theme');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

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

  const currentLesson = MOCK_LESSONS.find((l) => l.id === selectedLessonId) || MOCK_LESSONS[0];

  const handleSelectLessonFromCatalog = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    navigate(`/detail/${lessonId}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation Header */}
      <Header
        isLightTheme={isLightTheme}
        onToggleTheme={() => setIsLightTheme(!isLightTheme)}
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      {/* Main Routes Container */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-6">
        <Routes>
          <Route
            path="/"
            element={<Navigate to="/catalog" replace />}
          />
          <Route
            path="/catalog"
            element={
              <CourseCatalogPage
                lessons={MOCK_LESSONS}
                onSelectLesson={handleSelectLessonFromCatalog}
              />
            }
          />
          <Route
            path="/detail"
            element={
              <LessonDetailPage
                currentLesson={currentLesson}
                allLessons={MOCK_LESSONS}
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
                allLessons={MOCK_LESSONS}
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
          <Route path="/quiz" element={<QuizTakingPage />} />
          <Route path="/playground" element={<CodePlaygroundPage isDark={!isLightTheme} />} />
          <Route path="*" element={<Navigate to="/catalog" replace />} />
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
