import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface HeaderProps {
  isLightTheme: boolean;
  onToggleTheme: () => void;
  onOpenGuide: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isLightTheme,
  onToggleTheme,
  onOpenGuide,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const getActiveTab = () => {
    const path = location.pathname;
    if (path.startsWith('/playground')) return 'playground';
    if (path.startsWith('/quiz')) return 'quiz';
    if (path.startsWith('/detail')) return 'detail';
    return 'catalog';
  };

  const activeTab = getActiveTab();

  const handleNavigate = (path: string) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header
      className="sticky top-0 z-50 bg-[var(--bg-card)]/90 backdrop-blur-md border-b border-[var(--border-color)] transition-colors shadow-xs"
      role="banner"
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand Logo */}
        <button
          onClick={() => handleNavigate('/catalog')}
          className="flex items-center gap-3 text-[var(--text-main)] font-extrabold text-lg tracking-tight bg-transparent border-none cursor-pointer text-left"
          aria-label="Trang chủ CyberSoft Learning Hub"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-500 flex items-center justify-center text-white text-lg shadow-md shadow-indigo-500/20">
            ⚡
          </div>
          <div className="flex items-center">
            <span>CyberSoft</span>
            <span className="text-cyan-600 dark:text-cyan-400 ml-1">Hub</span>
            <span className="text-[10px] bg-indigo-600 text-white font-semibold px-1.5 py-0.5 rounded ml-2 uppercase">
              v0.1
            </span>
          </div>
        </button>

        {/* Desktop Navigation Menu */}
        <nav role="navigation" aria-label="Thanh điều hướng chính">
          <ul className="hidden md:flex items-center gap-6 list-none">
            <li>
              <button
                className={`text-sm font-medium transition-colors hover:text-indigo-600 dark:hover:text-cyan-400 bg-transparent border-none cursor-pointer ${
                  activeTab === 'catalog'
                    ? 'text-indigo-600 dark:text-cyan-400 font-semibold'
                    : 'text-[var(--text-muted)]'
                }`}
                onClick={() => handleNavigate('/catalog')}
              >
                📚 Danh mục khóa học
              </button>
            </li>
            <li>
              <button
                className={`text-sm font-medium transition-colors hover:text-indigo-600 dark:hover:text-cyan-400 bg-transparent border-none cursor-pointer ${
                  activeTab === 'detail'
                    ? 'text-indigo-600 dark:text-cyan-400 font-semibold'
                    : 'text-[var(--text-muted)]'
                }`}
                onClick={() => handleNavigate('/detail')}
              >
                📖 Chi tiết bài học
              </button>
            </li>
            <li>
              <button
                className={`text-sm font-medium transition-colors hover:text-indigo-600 dark:hover:text-cyan-400 bg-transparent border-none cursor-pointer ${
                  activeTab === 'quiz'
                    ? 'text-indigo-600 dark:text-cyan-400 font-semibold'
                    : 'text-[var(--text-muted)]'
                }`}
                onClick={() => handleNavigate('/quiz')}
              >
                📝 Thi Trắc Nghiệm
              </button>
            </li>
            <li>
              <button
                className={`text-sm font-medium transition-colors hover:text-indigo-600 dark:hover:text-cyan-400 bg-transparent border-none cursor-pointer ${
                  activeTab === 'playground'
                    ? 'text-indigo-600 dark:text-cyan-400 font-semibold'
                    : 'text-[var(--text-muted)]'
                }`}
                onClick={() => handleNavigate('/playground')}
              >
                🧑‍💻 Code Playground
              </button>
            </li>
          </ul>
        </nav>

        {/* Header Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenGuide}
            className="px-3.5 py-1.5 text-xs font-semibold text-[var(--text-main)] bg-[var(--bg-main)] hover:bg-slate-200 dark:hover:bg-slate-800 border border-[var(--border-color)] rounded-xl transition-all shadow-xs cursor-pointer"
            aria-label="Mở hướng dẫn chụp ảnh responsive"
            title="Hướng dẫn nghiệm thu Responsive"
          >
            📸 HD Responsive
          </button>

          <button
            onClick={onToggleTheme}
            className="px-3.5 py-1.5 text-xs font-semibold text-[var(--text-main)] bg-[var(--bg-main)] hover:bg-slate-200 dark:hover:bg-slate-800 border border-[var(--border-color)] rounded-xl transition-all shadow-xs cursor-pointer"
            aria-label={isLightTheme ? 'Chuyển sang Giao diện Tối' : 'Chuyển sang Giao diện Sáng'}
            title="Thay đổi Theme Light/Dark"
          >
            {isLightTheme ? '🌙 Dark' : '☀️ Light'}
          </button>

          <button
            className="md:hidden p-2 text-[var(--text-main)] bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg cursor-pointer"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle Mobile Menu"
          >
            ☰
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <nav
          className="md:hidden flex flex-col gap-3 p-4 bg-[var(--bg-card)] border-b border-[var(--border-color)]"
          aria-label="Menu di động"
        >
          <button
            className={`text-sm font-medium text-left transition-colors bg-transparent border-none cursor-pointer ${
              activeTab === 'catalog'
                ? 'text-indigo-600 dark:text-cyan-400 font-semibold'
                : 'text-[var(--text-muted)]'
            }`}
            onClick={() => {
              handleNavigate('/catalog');
              setMobileMenuOpen(false);
            }}
          >
            📚 Danh mục khóa học
          </button>
          <button
            className={`text-sm font-medium text-left transition-colors bg-transparent border-none cursor-pointer ${
              activeTab === 'detail'
                ? 'text-indigo-600 dark:text-cyan-400 font-semibold'
                : 'text-[var(--text-muted)]'
            }`}
            onClick={() => {
              handleNavigate('/detail');
              setMobileMenuOpen(false);
            }}
          >
            📖 Chi tiết bài học
          </button>
          <button
            className={`text-sm font-medium text-left transition-colors bg-transparent border-none cursor-pointer ${
              activeTab === 'quiz'
                ? 'text-indigo-600 dark:text-cyan-400 font-semibold'
                : 'text-[var(--text-muted)]'
            }`}
            onClick={() => {
              handleNavigate('/quiz');
              setMobileMenuOpen(false);
            }}
          >
            📝 Thi Trắc Nghiệm
          </button>
          <button
            className={`text-sm font-medium text-left transition-colors bg-transparent border-none cursor-pointer ${
              activeTab === 'playground'
                ? 'text-indigo-600 dark:text-cyan-400 font-semibold'
                : 'text-[var(--text-muted)]'
            }`}
            onClick={() => {
              handleNavigate('/playground');
              setMobileMenuOpen(false);
            }}
          >
            🧑‍💻 Code Playground
          </button>
        </nav>
      )}
    </header>
  );
};
