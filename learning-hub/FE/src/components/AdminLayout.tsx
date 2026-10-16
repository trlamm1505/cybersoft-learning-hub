import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  ChevronLeft,
  ChevronRight,
  School,
  ShieldCheck,
  Sun,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import type { AuthUser } from '../types/auth';
import { ROLE_LABEL } from '../types/auth';
import {
  clampSidebarWidth,
  loadSidebarState,
  saveSidebarState,
  SIDEBAR_COLLAPSED,
  SIDEBAR_DEFAULT,
  sidebarPixelWidth,
  type SidebarState,
} from '../pages/adminModel';
import { UserAvatar } from './UserAvatar';

interface NavEntry {
  to: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
}

/** Chỉ có mục quản trị: không có khóa học, trắc nghiệm, playground hay cuộc thi của học viên/giảng viên. */
const ADMIN_NAV: NavEntry[] = [
  { to: '/admin/dashboard', label: 'Tổng quan hệ thống', Icon: LayoutDashboard },
  { to: '/admin/users', label: 'Quản lý người dùng', Icon: Users },
  { to: '/admin/classes', label: 'Quản lý lớp học', Icon: School },
];

export interface AdminOutletContext {
  authUser: AuthUser;
}

interface Props {
  authUser: AuthUser;
  isLightTheme: boolean;
  onToggleTheme: () => void;
  onLogout: () => void;
}

const hairline = 'border-neutral-200 dark:border-neutral-800';
const itemBase = 'group relative flex items-center gap-2.5 rounded-md py-2 text-sm transition-colors';

/**
 * Khung riêng của Admin Portal: sidebar trái (thu gọn được, kéo chỉnh độ rộng, nhớ lựa chọn), thanh trên
 * với thông tin tài khoản ở góc phải (đổi sáng/tối, đăng xuất) và vùng nội dung. Không dùng Header/Footer của
 * học viên hay giảng viên. Dưới 768px sidebar thành ngăn kéo.
 */
export const AdminLayout: React.FC<Props> = ({ authUser, isLightTheme, onToggleTheme, onLogout }) => {
  const [sidebar, setSidebar] = useState<SidebarState>(() => loadSidebarState());
  const [drawer, setDrawer] = useState(false);
  const [menu, setMenu] = useState(false);
  const [dragging, setDragging] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const widthPx = sidebarPixelWidth(sidebar);

  const update = useCallback((next: SidebarState) => {
    setSidebar(next);
    saveSidebarState(next);
  }, []);

  // Menu tài khoản: bấm ra ngoài hoặc Esc thì đóng. Ngăn kéo: Esc đóng.
  useEffect(() => {
    if (!menu && !drawer) return;
    const onDown = (e: MouseEvent) => {
      if (menu && menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setMenu(false);
      setDrawer(false);
    };
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [menu, drawer]);

  // Kéo mép phải của sidebar để chỉnh độ rộng; kéo khi đang thu gọn thì mở lại.
  const startDrag = (e: React.PointerEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = sidebar.collapsed ? SIDEBAR_DEFAULT : sidebar.width;
    setDragging(true);
    const move = (ev: PointerEvent) =>
      setSidebar({ collapsed: false, width: clampSidebarWidth(startW + ev.clientX - startX) });
    const up = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      setDragging(false);
      update({ collapsed: false, width: clampSidebarWidth(startW + ev.clientX - startX) });
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const onResizeKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') update({ collapsed: false, width: clampSidebarWidth(widthPx - 16) });
    else if (e.key === 'ArrowRight') update({ collapsed: false, width: clampSidebarWidth(widthPx + 16) });
    else return;
    e.preventDefault();
  };

  const renderNav = (collapsed: boolean) => (
    <nav aria-label="Điều hướng quản trị" className="flex-1 space-y-0.5 px-2 py-3">
      {ADMIN_NAV.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          title={collapsed ? label : undefined}
          onClick={() => setDrawer(false)}
          className={({ isActive }) =>
            `${itemBase} ${collapsed ? 'justify-center px-0' : 'px-3'} ${
              isActive
                ? 'bg-neutral-100 font-medium text-[var(--text-main)] dark:bg-neutral-800'
                : 'text-[var(--text-muted)] hover:bg-neutral-100 hover:text-[var(--text-main)] dark:hover:bg-neutral-800'
            }`
          }
        >
          <Icon size={16} strokeWidth={1.75} />
          {collapsed ? (
            <span
              role="tooltip"
              className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-800 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            >
              {label}
            </span>
          ) : (
            <span className="truncate">{label}</span>
          )}
        </NavLink>
      ))}
    </nav>
  );

  const brand = (collapsed: boolean) => (
    <div className={`flex items-center gap-2.5 border-b px-3 py-3 ${hairline} ${collapsed ? 'justify-center' : ''}`}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white">
        <ShieldCheck size={17} strokeWidth={2} />
      </div>
      {!collapsed && (
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-sm font-semibold text-[var(--text-main)]">CyberSoft Hub</div>
          <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Admin Portal</div>
        </div>
      )}
    </div>
  );

  const displayName = authUser.fullName || authUser.email;

  return (
    <div
      className="min-h-screen bg-[var(--bg-main)]"
      style={{ ['--sidebar-w' as string]: `${widthPx}px` }}
    >
      {/* Sidebar cố định từ 768px: thu gọn thành icon, kéo mép phải để đổi độ rộng */}
      <aside
        aria-label="Thanh bên quản trị"
        className={`fixed inset-y-0 left-0 z-30 hidden border-r bg-white dark:bg-neutral-950 md:flex md:flex-col ${hairline} ${
          dragging ? '' : 'transition-[width] duration-150'
        }`}
        style={{ width: widthPx }}
      >
        {brand(sidebar.collapsed)}
        {renderNav(sidebar.collapsed)}
        <button
          onClick={() => update({ ...sidebar, collapsed: !sidebar.collapsed })}
          aria-label={sidebar.collapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'}
          aria-pressed={sidebar.collapsed}
          className="absolute -right-3 top-4 z-40 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500 shadow-sm hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          {sidebar.collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Kéo để đổi độ rộng thanh bên"
          aria-valuemin={SIDEBAR_COLLAPSED}
          aria-valuenow={widthPx}
          tabIndex={0}
          onPointerDown={startDrag}
          onKeyDown={onResizeKey}
          onDoubleClick={() => update({ collapsed: false, width: SIDEBAR_DEFAULT })}
          className={`absolute inset-y-0 -right-1 w-2 cursor-col-resize touch-none after:absolute after:inset-y-0 after:left-1/2 after:w-px after:-translate-x-1/2 hover:after:bg-indigo-500 focus-visible:after:bg-indigo-500 ${
            dragging ? 'after:bg-indigo-500' : ''
          }`}
        />
      </aside>

      {/* Ngăn kéo cho màn hình nhỏ */}
      {drawer && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label="Menu quản trị">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawer(false)} />
          <aside className={`absolute inset-y-0 left-0 flex w-64 flex-col border-r bg-white dark:bg-neutral-950 ${hairline}`}>
            <button
              onClick={() => setDrawer(false)}
              aria-label="Đóng menu"
              className="absolute right-2 top-3 cursor-pointer text-[var(--text-muted)]"
            >
              <X size={18} />
            </button>
            {brand(false)}
            {renderNav(false)}
          </aside>
        </div>
      )}

      <div className="md:ml-[var(--sidebar-w)] md:transition-[margin] md:duration-150">
        {/* Thanh trên: thông tin tài khoản ở góc phải */}
        <header
          className={`sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b bg-white/90 px-4 backdrop-blur dark:bg-neutral-950/90 ${hairline}`}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawer(true)}
              aria-label="Mở menu quản trị"
              aria-expanded={drawer}
              className="cursor-pointer text-[var(--text-main)] md:hidden"
            >
              <Menu size={20} />
            </button>
            <span className="text-xs uppercase tracking-wider text-[var(--text-muted)] md:hidden">Admin Portal</span>
          </div>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenu((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menu}
              aria-label="Menu tài khoản"
              className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <UserAvatar user={authUser} size={32} />
              <span className="hidden min-w-0 text-left leading-tight sm:block">
                <span className="block max-w-[14rem] truncate text-sm font-medium text-[var(--text-main)]">{displayName}</span>
                <span className="block max-w-[14rem] truncate text-[11px] text-[var(--text-muted)]">{authUser.email}</span>
              </span>
              <span className="hidden rounded border border-neutral-200 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--text-muted)] dark:border-neutral-700 md:inline">
                {ROLE_LABEL[authUser.role]}
              </span>
              <ChevronDown size={14} className="text-[var(--text-muted)]" />
            </button>
            {menu && (
              <div
                role="menu"
                className={`absolute right-0 mt-1 w-56 rounded-md border bg-white py-1 shadow-sm dark:bg-neutral-900 ${hairline}`}
              >
                <div className={`border-b px-3 py-2 sm:hidden ${hairline}`}>
                  <div className="truncate text-sm font-medium text-[var(--text-main)]">{displayName}</div>
                  <div className="truncate text-[11px] text-[var(--text-muted)]">{authUser.email}</div>
                </div>
                <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-[var(--text-muted)]">{ROLE_LABEL[authUser.role]}</div>
                <Link
                  role="menuitem"
                  to="/admin/profile"
                  onClick={() => setMenu(false)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--text-main)] hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  <UserRound size={14} /> Trang cá nhân
                </Link>
                <button
                  role="menuitem"
                  onClick={() => {
                    onToggleTheme();
                    setMenu(false);
                  }}
                  className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-[var(--text-main)] hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  {isLightTheme ? <Moon size={14} /> : <Sun size={14} />}
                  {isLightTheme ? 'Giao diện tối' : 'Giao diện sáng'}
                </button>
                <button
                  role="menuitem"
                  onClick={onLogout}
                  className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-[var(--text-main)] hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  <LogOut size={14} /> Đăng xuất
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="min-w-0 px-4 py-6 md:px-8">
          <Outlet context={{ authUser } satisfies AdminOutletContext} />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
