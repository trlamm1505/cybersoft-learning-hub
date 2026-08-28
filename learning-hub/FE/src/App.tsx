import { useState, useEffect } from 'react';
import { MOCK_LESSONS } from './data/mockLessons';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ResponsiveGuideModal } from './components/ResponsiveGuideModal';
import { CourseCatalogPage } from './pages/CourseCatalogPage';
import { LessonDetailPage } from './pages/LessonDetailPage';
import './styles/main.css';

export function App() {
  const [activeTab, setActiveTab] = useState<'catalog' | 'detail'>('catalog');
  const [selectedLessonId, setSelectedLessonId] = useState<string>(MOCK_LESSONS[0].id);
  const [isLightTheme, setIsLightTheme] = useState<boolean>(false);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

  // Sync theme class with body element
  useEffect(() => {
    if (isLightTheme) {
      document.documentElement.classList.add('theme-light');
    } else {
      document.documentElement.classList.remove('theme-light');
    }
  }, [isLightTheme]);

  const currentLesson = MOCK_LESSONS.find((l) => l.id === selectedLessonId) || MOCK_LESSONS[0];

  const handleNavigate = (tab: 'catalog' | 'detail', lessonId?: string) => {
    setActiveTab(tab);
    if (lessonId) {
      setSelectedLessonId(lessonId);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectLessonFromCatalog = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    setActiveTab('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="app-container">
      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        onNavigate={handleNavigate}
        isLightTheme={isLightTheme}
        onToggleTheme={() => setIsLightTheme(!isLightTheme)}
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      {/* Main Container */}
      <div className="main-content">
        {activeTab === 'catalog' ? (
          <CourseCatalogPage
            lessons={MOCK_LESSONS}
            onSelectLesson={handleSelectLessonFromCatalog}
          />
        ) : (
          <LessonDetailPage
            currentLesson={currentLesson}
            allLessons={MOCK_LESSONS}
            onSelectLesson={(id) => handleNavigate('detail', id)}
            onBackToCatalog={() => handleNavigate('catalog')}
          />
        )}
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
