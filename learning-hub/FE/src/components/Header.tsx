import React, { useState } from 'react';

interface HeaderProps {
  activeTab: 'catalog' | 'detail' | 'quiz' | 'playground';
  onNavigate: (tab: 'catalog' | 'detail' | 'quiz' | 'playground', lessonId?: string) => void;
  isLightTheme: boolean;
  onToggleTheme: () => void;
  onOpenGuide: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onNavigate,
  isLightTheme,
  onToggleTheme,
  onOpenGuide
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[var(--bg-card)]/90 backdrop-blur-md border-b border-[var(--border-color)] transition-colors shadow-xs" role="banner">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand Logo */}
        <a
          href="#catalog"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('catalog');
          }}
          className="flex items-center gap-3 text-[var(--text-main)] font-extrabold text-lg tracking-tight"
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
        </a>

        {/* Desktop Navigation Menu */}
        <nav role="navigation" aria-label="Thanh điều hướng chính">
          <ul className="hidden md:flex items-center gap-6 list-none">
            <li>
              <a
                href="#catalog"
                className={`text-sm font-medium transition-colors hover:text-indigo-600 dark:hover:text-cyan-400 ${
                  activeTab === 'catalog'
                    ? 'text-indigo-600 dark:text-cyan-400 font-semibold'
                    : 'text-[var(--text-muted)]'
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('catalog');
                }}
              >
                📚 Danh mục khóa học
              </a>
            </li>
            <li>
              <a
                href="#detail"
                className={`text-sm font-medium transition-colors hover:text-indigo-600 dark:hover:text-cyan-400 ${
                  activeTab === 'detail'
                    ? 'text-indigo-600 dark:text-cyan-400 font-semibold'
                    : 'text-[var(--text-muted)]'
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('detail');
                }}
              >
                📖 Chi tiết bài học
              </a>
            </li>
            <li>
              <a
                href="#quiz"
                className={`text-sm font-medium transition-colors hover:text-indigo-600 dark:hover:text-cyan-400 ${
                  activeTab === 'quiz'
                    ? 'text-indigo-600 dark:text-cyan-400 font-semibold'
                    : 'text-[var(--text-muted)]'
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('quiz');
                }}
              >
                📝 Thi Trắc Nghiệm
              </a>
            </li>
            <li>
              <a
                href="#playground"
                className={`text-sm font-medium transition-colors hover:text-indigo-600 dark:hover:text-cyan-400 ${
                  activeTab === 'playground'
                    ? 'text-indigo-600 dark:text-cyan-400 font-semibold'
                    : 'text-[var(--text-muted)]'
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('playground');
                }}
              >
                🧑‍💻 Code Playground
              </a>
            </li>
          </ul>
        </nav>

        {/* Header Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenGuide}
            className="px-3.5 py-1.5 text-xs font-semibold text-[var(--text-main)] bg-[var(--bg-main)] hover:bg-slate-200 dark:hover:bg-slate-800 border border-[var(--border-color)] rounded-xl transition-all shadow-xs"
            aria-label="Mở hướng dẫn chụp ảnh responsive"
            title="Hướng dẫn nghiệm thu Responsive"
          >
            📸 HD Responsive
          </button>

          <button
            onClick={onToggleTheme}
            className="px-3.5 py-1.5 text-xs font-semibold text-[var(--text-main)] bg-[var(--bg-main)] hover:bg-slate-200 dark:hover:bg-slate-800 border border-[var(--border-color)] rounded-xl transition-all shadow-xs"
            aria-label={isLightTheme ? 'Chuyển sang Giao diện Tối' : 'Chuyển sang Giao diện Sáng'}
            title="Thay đổi Theme Light/Dark"
          >
            {isLightTheme ? '🌙 Dark' : '☀️ Light'}
          </button>

          <button
            className="md:hidden p-2 text-[var(--text-main)] bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg"
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
        <nav className="md:hidden flex flex-col gap-3 p-4 bg-[var(--bg-card)] border-b border-[var(--border-color)]" aria-label="Menu di động">
          <a
            href="#catalog"
            className={`text-sm font-medium transition-colors ${
              activeTab === 'catalog' ? 'text-indigo-600 dark:text-cyan-400 font-semibold' : 'text-[var(--text-muted)]'
            }`}
            onClick={(e) => {
              e.preventDefault();
              onNavigate('catalog');
              setMobileMenuOpen(false);
            }}
          >
            📚 Danh mục khóa học
          </a>
          <a
            href="#detail"
            className={`text-sm font-medium transition-colors ${
              activeTab === 'detail' ? 'text-indigo-600 dark:text-cyan-400 font-semibold' : 'text-[var(--text-muted)]'
            }`}
            onClick={(e) => {
              e.preventDefault();
              onNavigate('detail');
              setMobileMenuOpen(false);
            }}
          >
            📖 Chi tiết bài học
          </a>
          <a
            href="#quiz"
            className={`text-sm font-medium transition-colors ${
              activeTab === 'quiz' ? 'text-indigo-600 dark:text-cyan-400 font-semibold' : 'text-[var(--text-muted)]'
            }`}
            onClick={(e) => {
              e.preventDefault();
              onNavigate('quiz');
              setMobileMenuOpen(false);
            }}
          >
            📝 Thi Trắc Nghiệm
          </a>
          <a
            href="#playground"
            className={`text-sm font-medium transition-colors ${
              activeTab === 'playground' ? 'text-indigo-600 dark:text-cyan-400 font-semibold' : 'text-[var(--text-muted)]'
            }`}
            onClick={(e) => {
              e.preventDefault();
              onNavigate('playground');
              setMobileMenuOpen(false);
            }}
          >
            🧑‍💻 Code Playground
          </a>
        </nav>
      )}
    </header>
  );
};
