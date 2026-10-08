import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  FileText,
  ClipboardList,
  Code2,
  Puzzle,
  Trophy,
  Wrench,
  Moon,
  Sun,
  Menu,
  X,
  GraduationCap,
  Sparkles,
  FlaskConical,
  Database,
  BrainCircuit,
  ClipboardCheck,
  ListChecks,
  BarChart3,
  ShieldAlert,
  ShieldCheck,
  User,
  Users,
  ChevronDown,
  LogOut,
} from 'lucide-react';
import type { AuthUser } from '../types/auth';
import { ROLE_LABEL } from '../types/auth';
import { OverflowNav } from './OverflowNav';
import { UserAvatar } from './UserAvatar';
import type { NavItem } from './OverflowNav';

/** Mục chỉ dành cho học viên; khớp StudentRoute trong App.tsx. */
const STUDENT_ONLY_TABS = new Set(['da-labs', 'ai-labs']);

const STUDENT_NAV: NavItem[] = [
  { key: 'catalog', label: 'Danh mục khóa học', Icon: BookOpen, path: '/catalog' },
  { key: 'detail', label: 'Chi tiết bài học', Icon: FileText, path: '/detail' },
  { key: 'quiz', label: 'Thi Trắc Nghiệm', Icon: ClipboardList, path: '/quiz' },
  { key: 'playground', label: 'Code Playground', Icon: Code2, path: '/playground' },
  { key: 'block-puzzle', label: 'Block Puzzle', Icon: Puzzle, path: '/block-puzzle' },
  { key: 'contests', label: 'Cuộc Thi & Lịch Thi', Icon: Trophy, path: '/contests' },
  { key: 'tester-labs', label: 'Tester Lab', Icon: FlaskConical, path: '/tester-labs' },
  { key: 'da-labs', label: 'DA Lab', Icon: Database, path: '/da-labs' },
  { key: 'ai-labs', label: 'AI Lab', Icon: BrainCircuit, path: '/ai-labs' },
];

const TEACHER_NAV: NavItem[] = [
  { key: 'dashboard', label: 'Lớp của tôi', Icon: BarChart3, path: '/teacher/dashboard' },
  { key: 'authoring', label: 'Soạn Thảo Bài Thi', Icon: Wrench, path: '/authoring' },
  { key: 'teacher-library', label: 'Xem Các Bài Thi', Icon: ClipboardList, path: '/authoring?view=library' },
  { key: 'teacher-contests', label: 'Quản Lý Cuộc Thi', Icon: Trophy, path: '/authoring?view=contests' },
  { key: 'teacher-qa', label: 'Quality & QA Harness', Icon: ClipboardCheck, path: '/authoring?view=qa' },
  { key: 'teacher-usability', label: 'Usability & Age UI', Icon: Users, path: '/authoring?view=usability' },
  { key: 'teacher-resilience', label: 'Bảo Mật & Tải', Icon: ShieldCheck, path: '/authoring?view=resilience' },
  { key: 'problem-generator', label: 'AI Tạo Đề', Icon: Sparkles, path: '/problem-generator' },
  { key: 'review-queue', label: 'Chấm Insight', Icon: ClipboardCheck, path: '/teacher/review-queue' },
  { key: 'lab-submissions', label: 'Bài nộp Lab', Icon: ListChecks, path: '/teacher/lab-submissions' },
  { key: 'integrity', label: 'Xem xét trung thực', Icon: ShieldAlert, path: '/teacher/integrity' },
  { key: 'tester-labs', label: 'Tester Lab', Icon: FlaskConical, path: '/tester-labs' },
];

interface HeaderProps {
  isLightTheme: boolean;
  onToggleTheme: () => void;
  userRole: 'student' | 'teacher';
  authUser: AuthUser | null;
  onLogout: () => void;
}

const iconBtnCls =
  'inline-flex items-center justify-center h-9 w-9 text-[var(--text-main)] bg-[var(--bg-main)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] rounded-[10px] transition-all cursor-pointer shrink-0';

export const Header: React.FC<HeaderProps> = ({ isLightTheme, onToggleTheme, userRole, authUser, onLogout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const avatarMenuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Click bên ngoài cụm avatar/dropdown thì tự đóng menu; Esc cũng đóng.
  useEffect(() => {
    if (!avatarMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target as Node)) {
        setAvatarMenuOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAvatarMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [avatarMenuOpen]);

  // Chuyển trang thì đóng menu di động.
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  const getActiveTab = () => {
    const path = location.pathname;
    const search = location.search;
    if (path.startsWith('/authoring')) {
      if (search.includes('view=library')) return 'teacher-library';
      if (search.includes('view=contests')) return 'teacher-contests';
      if (search.includes('view=qa')) return 'teacher-qa';
      if (search.includes('view=usability')) return 'teacher-usability';
      if (search.includes('view=resilience')) return 'teacher-resilience';
      return 'authoring';
    }
    if (path.startsWith('/problem-generator')) return 'problem-generator';
    if (path.startsWith('/contests')) return 'contests';
    if (path.startsWith('/playground')) return 'playground';
    if (path.startsWith('/progress')) return 'progress';
    if (path.startsWith('/tester-labs')) return 'tester-labs';
    if (path.startsWith('/da-labs')) return 'da-labs';
    if (path.startsWith('/ai-labs')) return 'ai-labs';
    if (path.startsWith('/teacher/review-queue')) return 'review-queue';
    if (path.startsWith('/teacher/lab-submissions')) return 'lab-submissions';
    if (path.startsWith('/teacher/integrity')) return 'integrity';
    if (path.startsWith('/teacher/dashboard')) return 'dashboard';
    if (path.startsWith('/block-puzzle')) return 'block-puzzle';
    if (path.startsWith('/quiz')) return 'quiz';
    if (path.startsWith('/detail')) return 'detail';
    return 'catalog';
  };

  const activeTab = getActiveTab();
  // AI Lab, DA Lab là trang làm bài: chỉ tài khoản STUDENT thấy (ADMIN cũng dùng menu học viên).
  const isStudent = authUser?.role === 'STUDENT';

  const navItems = useMemo(
    () => (userRole === 'student' ? STUDENT_NAV.filter((item) => isStudent || !STUDENT_ONLY_TABS.has(item.key)) : TEACHER_NAV),
    [userRole, isStudent],
  );

  const handleNavigate = (path: string) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header
      className="sticky top-0 z-50 bg-[var(--bg-card)]/90 backdrop-blur-md border-b border-[var(--border-color)] transition-colors shadow-xs"
      role="banner"
    >
      <div className="w-full px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo */}
        <button
          onClick={() => handleNavigate(userRole === 'teacher' ? '/authoring' : '/catalog')}
          className="flex items-center gap-2.5 text-[var(--text-main)] font-extrabold text-lg tracking-tight bg-transparent border-none cursor-pointer text-left shrink-0"
          aria-label="Trang chủ CyberSoft Learning Hub"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
            <GraduationCap size={18} strokeWidth={2.25} />
          </div>
          <div className="flex items-center whitespace-nowrap">
            <span>CyberSoft</span>
            <span className="text-cyan-700 dark:text-cyan-400 ml-1">Hub</span>
            {userRole === 'teacher' ? (
              <span className="hidden lg:inline-flex text-[10px] bg-amber-700 text-white font-bold px-2 py-0.5 rounded-full ml-2 uppercase tracking-wide items-center gap-1 shadow-xs">
                Teacher Studio
              </span>
            ) : (
              <span className="hidden lg:inline-block text-[10px] bg-indigo-600 text-white font-semibold px-1.5 py-0.5 rounded ml-2 uppercase">
                v0.1
              </span>
            )}
          </div>
        </button>

        {/* Điều hướng desktop/tablet: mục không đủ chỗ tự vào menu "Thêm" */}
        <nav role="navigation" aria-label="Thanh điều hướng chính" className="hidden md:flex flex-1 min-w-0">
          <OverflowNav
            items={navItems}
            activeKey={activeTab}
            onNavigate={handleNavigate}
            ariaLabel={userRole === 'student' ? 'Điều hướng Học viên' : 'Điều hướng Giảng viên'}
          />
        </nav>

        {/* Theme + tài khoản */}
        <div className="flex items-center gap-2 shrink-0 ml-auto md:ml-0">
          <button
            onClick={onToggleTheme}
            className={iconBtnCls}
            aria-label={isLightTheme ? 'Chuyển sang Giao diện Tối' : 'Chuyển sang Giao diện Sáng'}
            title={isLightTheme ? 'Chuyển sang Giao diện Tối' : 'Chuyển sang Giao diện Sáng'}
          >
            {isLightTheme ? <Moon size={16} strokeWidth={2} /> : <Sun size={16} strokeWidth={2} />}
          </button>

          <div className="hidden sm:block w-px h-6 bg-[var(--border-color)]" aria-hidden="true" />

          {authUser ? (
            <div className="relative hidden sm:block" ref={avatarMenuRef}>
              <button
                onClick={() => setAvatarMenuOpen((prev) => !prev)}
                className="flex items-center gap-1.5 cursor-pointer bg-transparent border-none"
                aria-haspopup="menu"
                aria-expanded={avatarMenuOpen}
                aria-label="Menu tài khoản"
              >
                <UserAvatar user={authUser} size={36} />
                <ChevronDown
                  size={14}
                  strokeWidth={2.5}
                  className={`text-[var(--text-muted)] transition-transform ${avatarMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {avatarMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-2 w-64 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-xl z-50 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-[var(--border-color)]">
                    <p className="text-sm font-semibold text-[var(--text-main)] truncate">{authUser.fullName || authUser.email}</p>
                    <p className="text-xs text-[var(--text-muted)] truncate">{authUser.email}</p>
                    <span className="inline-flex items-center mt-1.5 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-indigo-600/10 text-indigo-600 dark:text-indigo-400">
                      {ROLE_LABEL[authUser.role] ?? authUser.role}
                    </span>
                  </div>

                  <button
                    role="menuitem"
                    onClick={() => {
                      setAvatarMenuOpen(false);
                      handleNavigate('/profile');
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--text-main)] hover:bg-[var(--bg-main)] transition-colors bg-transparent border-none cursor-pointer text-left"
                  >
                    <User size={15} strokeWidth={2} />
                    Thông tin cá nhân
                  </button>

                  {userRole === 'student' && (
                    <button
                      role="menuitem"
                      onClick={() => {
                        setAvatarMenuOpen(false);
                        handleNavigate('/progress');
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--text-main)] hover:bg-[var(--bg-main)] transition-colors bg-transparent border-none cursor-pointer text-left"
                    >
                      <BarChart3 size={15} strokeWidth={2} />
                      Tiến độ học tập
                    </button>
                  )}

                  <div className="border-t border-[var(--border-color)]" />

                  <button
                    role="menuitem"
                    onClick={() => {
                      setAvatarMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors bg-transparent border-none cursor-pointer text-left"
                  >
                    <LogOut size={15} strokeWidth={2} />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => handleNavigate('/login')}
                className="inline-flex items-center h-9 px-3.5 text-xs font-semibold text-[var(--text-main)] bg-[var(--bg-main)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] rounded-[10px] transition-all cursor-pointer whitespace-nowrap"
              >
                Đăng nhập
              </button>
              <button
                onClick={() => handleNavigate('/register')}
                className="inline-flex items-center h-9 px-3.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-[10px] transition-all cursor-pointer whitespace-nowrap"
              >
                Đăng ký
              </button>
            </div>
          )}

          <button
            className={`md:hidden ${iconBtnCls}`}
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label={mobileMenuOpen ? 'Đóng menu' : 'Mở menu'}
          >
            {mobileMenuOpen ? <X size={18} strokeWidth={2} /> : <Menu size={18} strokeWidth={2} />}
          </button>
        </div>
      </div>

      {/* Menu di động: cùng danh sách mục với desktop, cuộn được khi dài */}
      {mobileMenuOpen && (
        <nav
          id="mobile-menu"
          className="md:hidden max-h-[calc(100vh-4rem)] overflow-y-auto flex flex-col gap-1 p-3 bg-[var(--bg-card)] border-t border-[var(--border-color)]"
          aria-label="Menu di động"
        >
          {navItems.map((item) => {
            const active = activeTab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => handleNavigate(item.path)}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-left border-none cursor-pointer transition-colors ${
                  active ? 'bg-indigo-600 text-white' : 'bg-transparent text-[var(--text-main)] hover:bg-[var(--bg-main)]'
                }`}
              >
                <item.Icon size={17} strokeWidth={2} aria-hidden="true" /> {item.label}
              </button>
            );
          })}

          <div className="mt-2 pt-3 border-t border-[var(--border-color)] flex flex-col gap-1">
            {authUser ? (
              <>
                <div className="px-3 pb-1">
                  <p className="text-sm font-semibold text-[var(--text-main)] truncate">{authUser.fullName || authUser.email}</p>
                  <p className="text-xs text-[var(--text-muted)] truncate">{authUser.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleNavigate('/profile')}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-left text-[var(--text-main)] bg-transparent border-none cursor-pointer hover:bg-[var(--bg-main)]"
                >
                  <User size={17} strokeWidth={2} /> Thông tin cá nhân
                </button>
                {userRole === 'student' && (
                  <button
                    type="button"
                    onClick={() => handleNavigate('/progress')}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-left text-[var(--text-main)] bg-transparent border-none cursor-pointer hover:bg-[var(--bg-main)]"
                  >
                    <BarChart3 size={17} strokeWidth={2} /> Tiến độ học tập
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-left text-rose-600 dark:text-rose-400 bg-transparent border-none cursor-pointer hover:bg-rose-500/10"
                >
                  <LogOut size={17} strokeWidth={2} /> Đăng xuất
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleNavigate('/login')}
                  className="rounded-xl px-3 py-3 text-sm font-semibold text-[var(--text-main)] bg-[var(--bg-main)] border border-[var(--border-color)] cursor-pointer"
                >
                  Đăng nhập
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigate('/register')}
                  className="rounded-xl px-3 py-3 text-sm font-bold text-white bg-indigo-600 border-none cursor-pointer"
                >
                  Đăng ký
                </button>
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  );
};
