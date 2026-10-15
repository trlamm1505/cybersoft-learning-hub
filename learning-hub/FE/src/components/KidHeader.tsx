import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Medal, Rocket, Star, Trophy } from 'lucide-react';
import type { AuthUser } from '../types/auth';
import { KID_NAV } from '../common/kidMode';
import { UserAvatar } from './UserAvatar';

interface KidHeaderProps {
  authUser: AuthUser | null;
  onLogout: () => void;
}

const NAV_STYLE = {
  learn: { Icon: Rocket, active: 'from-sky-400 to-blue-500', idle: 'bg-sky-100 text-sky-700' },
  achievements: { Icon: Trophy, active: 'from-amber-400 to-orange-500', idle: 'bg-amber-100 text-amber-700' },
  honor: { Icon: Medal, active: 'from-pink-400 to-rose-500', idle: 'bg-pink-100 text-pink-700' },
} as const;

/**
 * Thanh điều hướng Kid Mode (Lớp 3–5): chỉ hai nút lớn "Góc Học Tập" (-> Block Puzzle) và
 * "Bảng Thành Tích", icon to, màu pastel. Bấm avatar mở hộp nhỏ có tên bé, nhóm tuổi và nút Đăng xuất.
 */
export const KidHeader: React.FC<KidHeaderProps> = ({ authUser, onLogout }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const activeKey = pathname.startsWith('/kid-leaderboard') ? 'honor' : pathname.startsWith('/progress') ? 'achievements' : 'learn';
  const [open, setOpen] = useState(false);
  // Bấm nút nào cũng về đầu trang, kể cả khi đang ở sẵn trang đó.
  const go = (path: string) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b-4 border-amber-200 bg-gradient-to-r from-sky-100 via-white to-amber-100 shadow-md" role="banner">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-3 py-2 sm:px-4 sm:py-3">
        <button
          onClick={() => go(KID_NAV[0].path)}
          className="flex cursor-pointer items-center gap-2 border-none bg-transparent text-left"
          aria-label="Về Góc Học Tập"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-300 to-orange-400 text-white shadow-md">
            <Star size={28} fill="currentColor" />
          </span>
          <span className="text-xl font-black text-sky-700 sm:text-2xl">
            <span className="hidden sm:inline">CyberSoft </span>
            <span className="text-pink-500">Kids</span>
          </span>
        </button>

        {/* Điện thoại: 3 nút nằm hàng riêng, chia đều bề ngang; từ màn hình sm trở lên nằm cùng hàng với logo. */}
        <nav aria-label="Điều hướng của bé" className="order-last grid w-full grid-cols-3 gap-2 sm:order-none sm:flex sm:w-auto sm:items-center sm:gap-3">
          {KID_NAV.map((item) => {
            const { Icon, active, idle } = NAV_STYLE[item.key];
            const isActive = activeKey === item.key;
            return (
              <button
                key={item.key}
                onClick={() => go(item.path)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex min-w-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-none px-2 py-2 text-center text-sm font-black leading-tight shadow-md transition-transform hover:scale-105 active:scale-95 sm:flex-row sm:gap-2 sm:px-4 sm:py-3 sm:text-lg ${
                  isActive ? `bg-gradient-to-r ${active} text-white` : idle
                }`}
              >
                <Icon size={24} strokeWidth={2.5} aria-hidden="true" className="shrink-0" /> <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {authUser && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={open}
              aria-label="Tài khoản của bé"
              className="cursor-pointer rounded-full border-4 border-amber-200 bg-white p-0.5 shadow-md hover:scale-105"
            >
              <UserAvatar user={authUser} size={44} />
            </button>
            {open && (
              <div
                role="menu"
                className="absolute right-0 top-full z-50 mt-3 w-64 rounded-3xl border-4 border-amber-200 bg-white p-4 text-center shadow-xl"
              >
                <div className="flex justify-center"><UserAvatar user={authUser} size={64} /></div>
                <p className="mt-2 truncate text-xl font-black text-slate-800">{authUser.fullName || 'Bé'}</p>
                <p className="mt-1 inline-block rounded-full bg-amber-100 px-3 py-1 text-base font-black text-amber-700">Lớp 3–5</p>
                <button
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    navigate('/profile');
                  }}
                  className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border-none bg-sky-100 px-4 py-3 text-lg font-black text-sky-700 hover:bg-sky-200"
                >
                  Trang cá nhân của bé
                </button>
                <button
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    onLogout();
                  }}
                  className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border-none bg-rose-500 px-4 py-3 text-lg font-black text-white shadow-md hover:bg-rose-600"
                >
                  <LogOut size={22} strokeWidth={2.5} /> Đăng xuất
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
