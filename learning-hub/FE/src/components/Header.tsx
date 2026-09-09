import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface HeaderProps {
  isLightTheme: boolean;
  onToggleTheme: () => void;
  onOpenGuide: () => void;
  userRole: 'student' | 'teacher';
  onToggleRole: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isLightTheme,
  onToggleTheme,
  onOpenGuide,
  userRole,
  onToggleRole,
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
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
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
        <nav role="navigation" aria-label="Thanh điều hướng chính">
          <ul className="hidden md:flex items-center gap-4 list-none m-0 p-0">
            {userRole === 'student' ? (
              /* Student Mode Navigation */
              <>
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
                <li>
                  <button
                    className={`text-sm font-medium transition-colors hover:text-indigo-600 dark:hover:text-cyan-400 bg-transparent border-none cursor-pointer ${
                      activeTab === 'contests'
                        ? 'text-indigo-600 dark:text-cyan-400 font-semibold'
                        : 'text-[var(--text-muted)]'
                    }`}
                    onClick={() => handleNavigate('/contests')}
                  >
                    🏆 Cuộc Thi & Lịch Thi
                  </button>
                </li>
              </>
            ) : (
              /* Teacher Mode Navigation - 3 clear tabs */
              <>
                <li>
                  <button
                    className={`text-sm font-semibold transition-all px-3 py-1.5 rounded-xl border cursor-pointer ${
                      activeTab === 'authoring'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-[var(--bg-main)] text-[var(--text-main)] border-[var(--border-color)] hover:border-indigo-500'
                    }`}
                    onClick={() => handleNavigate('/authoring')}
                  >
                    🛠️ Soạn Thảo Bài Thi
                  </button>
                </li>
                <li>
                  <button
                    className={`text-sm font-semibold transition-all px-3 py-1.5 rounded-xl border cursor-pointer ${
                      activeTab === 'teacher-library'
                        ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs'
                        : 'bg-[var(--bg-main)] text-[var(--text-main)] border-[var(--border-color)] hover:border-cyan-500'
                    }`}
                    onClick={() => handleNavigate('/authoring?view=library')}
                  >
                    📋 Xem Các Bài Thi
                  </button>
                </li>
                <li>
                  <button
                    className={`text-sm font-semibold transition-all px-3 py-1.5 rounded-xl border cursor-pointer ${
                      activeTab === 'teacher-contests'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-[var(--bg-main)] text-[var(--text-main)] border-[var(--border-color)] hover:border-amber-500'
                    }`}
                    onClick={() => handleNavigate('/authoring?view=contests')}
                  >
                    🏆 Quản Lý Cuộc Thi
                  </button>
                </li>
              </>
            )}
          </ul>
        </nav>

        {/* Header Actions & Role Switcher */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Role Switcher Toggle */}
          <div
            className="flex items-center p-1 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-xs font-semibold shadow-xs"
            title="Chuyển đổi góc nhìn giữa Học viên và Quản trị Giảng viên"
          >
            <button
              onClick={() => {
                if (userRole !== 'student') {
                  onToggleRole();
                  handleNavigate('/catalog');
                }
              }}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer border-none text-xs ${
                userRole === 'student'
                  ? 'bg-indigo-600 text-white shadow-xs font-bold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)] bg-transparent'
              }`}
            >
              🎓 Student
            </button>
            <button
              onClick={() => {
                if (userRole !== 'teacher') {
                  onToggleRole();
                  handleNavigate('/authoring');
                }
              }}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer border-none text-xs ${
                userRole === 'teacher'
                  ? 'bg-amber-600 text-white shadow-xs font-bold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)] bg-transparent'
              }`}
            >
              👨‍🏫 Teacher
            </button>
          </div>

          <button
            onClick={onOpenGuide}
            className="hidden sm:inline-block px-3 py-1.5 text-xs font-semibold text-[var(--text-main)] bg-[var(--bg-main)] hover:bg-slate-200 dark:hover:bg-slate-800 border border-[var(--border-color)] rounded-xl transition-all shadow-xs cursor-pointer"
            aria-label="Mở hướng dẫn chụp ảnh responsive"
            title="Hướng dẫn nghiệm thu Responsive"
          >
            📸 HD Responsive
          </button>

          <button
            onClick={onToggleTheme}
            className="px-3 py-1.5 text-xs font-semibold text-[var(--text-main)] bg-[var(--bg-main)] hover:bg-slate-200 dark:hover:bg-slate-800 border border-[var(--border-color)] rounded-xl transition-all shadow-xs cursor-pointer"
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
        </nav>
      )}
    </header>
  );
};
