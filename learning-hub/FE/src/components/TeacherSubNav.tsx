import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useCanUseAiGenerator } from './teacherClassesContext';

export interface SubNavItem {
  to: string;
  label: string;
  end?: boolean;
  /** Chỉ hiện khi giảng viên được dùng AI Tạo Đề. */
  requiresAi?: boolean;
}

/** Mục đang mở: cùng đường dẫn và cùng query `view` (Soạn đề dùng ?view= cho Thư viện, Cuộc thi). */
export const isSubNavActive = (item: SubNavItem, pathname: string, search: string): boolean => {
  const [path, query = ''] = item.to.split('?');
  const want = new URLSearchParams(query).get('view') ?? '';
  const have = new URLSearchParams(search).get('view') ?? '';
  const samePath = item.end ? pathname === path : pathname === path || pathname.startsWith(`${path}/`);
  return samePath && want === have;
};

/** Thanh tab phụ trong một mục của sidebar (Chấm bài, Soạn đề); nội dung trang con hiện bên dưới. */
export const TeacherSubNav: React.FC<{ title: string; items: SubNavItem[] }> = ({ title, items: allItems }) => {
  const { pathname, search } = useLocation();
  // AI Tạo Đề chỉ hiện khi giảng viên phụ trách lớp K6-9 / K10-12 (đang tải thì chưa hiện để không nhấp nháy).
  const canAi = useCanUseAiGenerator();
  const items = allItems.filter((it) => !it.requiresAi || canAi === true);
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-[var(--text-main)]">{title}</h1>
        <nav aria-label={title} className="mt-3 flex flex-wrap gap-4 border-b border-[var(--border-color)]">
          {items.map((it) => {
            const active = isSubNavActive(it, pathname, search);
            return (
              <Link
                key={it.to}
                to={it.to}
                aria-current={active ? 'page' : undefined}
                className={`border-b-2 px-1 pb-2 text-sm ${
                  active
                    ? 'border-indigo-600 font-medium text-[var(--text-main)]'
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                {it.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <Outlet />
    </div>
  );
};

/** Soạn đề: soạn bài thủ công, AI tạo đề và quản lý Ngân hàng đề (hai mục sau chỉ cho giảng viên phụ trách lớp K6-9 / K10-12). */
export const AUTHORING_TABS: SubNavItem[] = [
  { to: '/teacher/authoring', label: 'Soạn bài thủ công', end: true },
  { to: '/teacher/authoring/ai', label: 'AI Tạo Đề', end: true, requiresAi: true },
  { to: '/teacher/authoring/bank', label: 'Ngân hàng đề', end: true, requiresAi: true },
];
