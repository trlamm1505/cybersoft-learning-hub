import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { AuthUser } from '../types/auth';

interface HeaderProps {
  isLightTheme: boolean;
  onToggleTheme: () => void;
  onOpenGuide: () => void;
  userRole: 'student' | 'teacher';
  authUser: AuthUser | null;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isLightTheme,
  onToggleTheme,
  onOpenGuide,
  userRole,
  authUser,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const getActiveTab = () => {
    const path = location.pathname;
    const search = location.search;
    if (path.startsWith('/authoring')) {
      if (search.includes('view=library')) return 'teacher-library';
      if (search.includes('view=contests')) return 'teacher-contests';
      return 'authoring';
    }
    if (path.startsWith('/contests')) return 'contests';
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
      <div className="w-full px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <button
          onClick={() => handleNavigate(userRole === 'teacher' ? '/authoring' : '/catalog')}
          className="flex items-center gap-3 text-[var(--text-main)] font-extrabold text-lg tracking-tight bg-transparent border-none cursor-pointer text-left shrink-0"
          aria-label="Trang chủ CyberSoft Learning Hub"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-500 flex items-center justify-center text-white text-lg shadow-md shadow-indigo-500/20">
            ⚡
          </div>
          <div className="flex items-center">
            <span>CyberSoft</span>
            <span className="text-cyan-600 dark:text-cyan-400 ml-1">Hub</span>
            {userRole === 'teacher' ? (
              <span className="text-[10px] bg-amber-600 text-white font-bold px-2 py-0.5 rounded-full ml-2 uppercase tracking-wide flex items-center gap-1 shadow-xs">
                👨‍🏫 Teacher Studio
              </span>
            ) : (
              <span className="text-[10px] bg-indigo-600 text-white font-semibold px-1.5 py-0.5 rounded ml-2 uppercase">
                v0.1
              </span>
            )}
          </div>
        </button>

        {/* Desktop Navigation Menu */}
        <nav role="navigation" aria-label="Thanh điều hướng chính" className="hidden md:flex flex-1 min-w-0 justify-center">
          {userRole === 'student' ? (
            /* Student Mode Navigation — single dark-glass pill bar, matches Teacher nav style */
            <ul
              className="flex items-center gap-1.5 list-none m-0 p-1 h-10 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)]/60 backdrop-blur-sm"
              aria-label="Điều hướng Học viên"
            >
              {[
                { key: 'catalog', label: 'Danh mục khóa học', icon: '📚', path: '/catalog' },
                { key: 'detail', label: 'Chi tiết bài học', icon: '📖', path: '/detail' },
                { key: 'quiz', label: 'Thi Trắc Nghiệm', icon: '📝', path: '/quiz' },
                { key: 'playground', label: 'Code Playground', icon: '🧑‍💻', path: '/playground' },
                { key: 'contests', label: 'Cuộc Thi & Lịch Thi', icon: '🏆', path: '/contests' },
              ].map((item) => {
                const isActive = activeTab === item.key;
                return (
                  <li key={item.key} className="h-full">
                    <button
                      className={`flex items-center h-full gap-1.5 text-[13px] font-semibold leading-none rounded-[10px] px-3.5 cursor-pointer whitespace-nowrap transition-all duration-150 border-none ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-[0_0_0_1px_rgba(99,102,241,0.4),0_4px_14px_-2px_rgba(99,102,241,0.55)]'
                          : 'bg-transparent text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)]'
                      }`}
                      onClick={() => handleNavigate(item.path)}
                    >
                      <span aria-hidden="true">{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            /* Teacher Mode Navigation — single dark-glass pill bar, 3 tabs */
            <ul
              className="flex items-center gap-1.5 list-none m-0 p-1 h-10 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)]/60 backdrop-blur-sm"
              aria-label="Điều hướng Giảng viên"
            >
              {[
                { key: 'authoring', label: 'Soạn Thảo Bài Thi', icon: '🛠️', path: '/authoring' },
                { key: 'teacher-library', label: 'Xem Các Bài Thi', icon: '📋', path: '/authoring?view=library' },
                { key: 'teacher-contests', label: 'Quản Lý Cuộc Thi', icon: '🏆', path: '/authoring?view=contests' },
              ].map((item) => {
                const isActive = activeTab === item.key;
                return (
                  <li key={item.key} className="h-full">
                    <button
                      className={`flex items-center h-full gap-1.5 text-[13px] font-semibold leading-none rounded-[10px] px-3.5 cursor-pointer whitespace-nowrap transition-all duration-150 border-none ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-[0_0_0_1px_rgba(99,102,241,0.4),0_4px_14px_-2px_rgba(99,102,241,0.55)]'
                          : 'bg-transparent text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)]'
                      }`}
                      onClick={() => handleNavigate(item.path)}
                    >
                      <span aria-hidden="true">{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </nav>

        {/* Header Actions & Auth — single row, compact pill controls, consistent height */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenGuide}
            className="hidden sm:inline-flex items-center h-8 px-3.5 text-xs font-semibold text-[var(--text-main)] bg-[var(--bg-main)] hover:bg-slate-200 dark:hover:bg-slate-800 border border-[var(--border-color)] rounded-[10px] transition-all cursor-pointer whitespace-nowrap"
            aria-label="Mở hướng dẫn chụp ảnh responsive"
            title="Hướng dẫn nghiệm thu Responsive"
          >
            📸 HD Responsive
          </button>

          <button
            onClick={onToggleTheme}
            className="inline-flex items-center justify-center h-8 w-8 text-sm text-[var(--text-main)] bg-[var(--bg-main)] hover:bg-slate-200 dark:hover:bg-slate-800 border border-[var(--border-color)] rounded-[10px] transition-all cursor-pointer"
            aria-label={isLightTheme ? 'Chuyển sang Giao diện Tối' : 'Chuyển sang Giao diện Sáng'}
            title={isLightTheme ? 'Chuyển sang Giao diện Tối' : 'Chuyển sang Giao diện Sáng'}
          >
            {isLightTheme ? '🌙' : '☀️'}
          </button>

          {/* Separator between utility controls and auth actions */}
          <div className="hidden sm:block w-px h-6 bg-[var(--border-color)]" aria-hidden="true" />

          {authUser ? (
            <button
              onClick={onLogout}
              className="hidden sm:inline-flex items-center h-8 px-3.5 text-xs font-semibold text-[var(--text-main)] bg-[var(--bg-main)] hover:bg-slate-200 dark:hover:bg-slate-800 border border-[var(--border-color)] rounded-[10px] transition-all cursor-pointer whitespace-nowrap"
            >
              Đăng xuất
            </button>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => handleNavigate('/login')}
                className="inline-flex items-center h-8 px-3.5 text-xs font-semibold text-[var(--text-main)] bg-[var(--bg-main)] hover:bg-slate-200 dark:hover:bg-slate-800 border border-[var(--border-color)] rounded-[10px] transition-all cursor-pointer whitespace-nowrap"
              >
                Đăng nhập
              </button>
              <button
                onClick={() => handleNavigate('/register')}
                className="inline-flex items-center h-8 px-3.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-[10px] transition-all cursor-pointer whitespace-nowrap"
              >
                Đăng ký
              </button>
            </div>
          )}

          <button
            className="md:hidden inline-flex items-center justify-center h-8 w-8 text-[var(--text-main)] bg-[var(--bg-main)] border border-[var(--border-color)] rounded-[10px] cursor-pointer"
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
          {userRole === 'student' ? (
            <>
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
              <button
                className={`text-sm font-medium text-left transition-colors bg-transparent border-none cursor-pointer ${
                  activeTab === 'contests'
                    ? 'text-indigo-600 dark:text-cyan-400 font-semibold'
                    : 'text-[var(--text-muted)]'
                }`}
                onClick={() => {
                  handleNavigate('/contests');
                  setMobileMenuOpen(false);
                }}
              >
                🏆 Cuộc Thi & Lịch Thi
              </button>
            </>
          ) : (
            <>
              <button
                className={`text-sm font-bold text-left transition-colors bg-transparent border-none cursor-pointer ${
                  activeTab === 'authoring'
                    ? 'text-indigo-600 dark:text-cyan-400 font-bold'
                    : 'text-[var(--text-main)]'
                }`}
                onClick={() => {
                  handleNavigate('/authoring');
                  setMobileMenuOpen(false);
                }}
              >
                🛠️ Soạn Thảo Bài Thi
              </button>
              <button
                className={`text-sm font-bold text-left transition-colors bg-transparent border-none cursor-pointer ${
                  activeTab === 'teacher-library'
                    ? 'text-cyan-600 dark:text-cyan-400 font-bold'
                    : 'text-[var(--text-main)]'
                }`}
                onClick={() => {
                  handleNavigate('/authoring?view=library');
                  setMobileMenuOpen(false);
                }}
              >
                📋 Xem Các Bài Thi
              </button>
              <button
                className={`text-sm font-bold text-left transition-colors bg-transparent border-none cursor-pointer ${
                  activeTab === 'teacher-contests'
                    ? 'text-amber-600 dark:text-amber-400 font-bold'
                    : 'text-[var(--text-main)]'
                }`}
                onClick={() => {
                  handleNavigate('/authoring?view=contests');
                  setMobileMenuOpen(false);
                }}
              >
                🏆 Quản Lý Cuộc Thi
              </button>
            </>
          )}

          {/* Auth actions (mobile) */}
          <div className="pt-3 mt-1 border-t border-[var(--border-color)] flex flex-col gap-2">
            {authUser ? (
              <>
                <span className="text-xs font-semibold text-[var(--text-muted)]">
                  {userRole === 'teacher' ? '👨‍🏫' : '🎓'} {authUser.fullName} ({authUser.email})
                </span>
                <button
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-sm font-semibold text-left text-[var(--text-main)] bg-transparent border-none cursor-pointer"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    handleNavigate('/login');
                    setMobileMenuOpen(false);
                  }}
                  className="text-sm font-semibold text-left text-[var(--text-main)] bg-transparent border-none cursor-pointer"
                >
                  Đăng nhập
                </button>
                <button
                  onClick={() => {
                    handleNavigate('/register');
                    setMobileMenuOpen(false);
                  }}
                  className="text-sm font-bold text-left text-indigo-600 dark:text-cyan-400 bg-transparent border-none cursor-pointer"
                >
                  Đăng ký
                </button>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
};
