import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronDown, MoreHorizontal } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { computeVisibleCount, splitNavItems } from './navOverflow';

export interface NavItem {
  key: string;
  label: string;
  Icon: LucideIcon;
  path: string;
}

interface OverflowNavProps {
  items: NavItem[];
  activeKey: string;
  onNavigate: (path: string) => void;
  ariaLabel: string;
}

const GAP_PX = 6; // gap-1.5
const PILL_CHROME_PX = 10; // p-1 hai bên + viền

const itemCls = (active: boolean) =>
  `flex items-center h-full gap-1.5 text-[13px] font-semibold leading-none rounded-[10px] px-3.5 cursor-pointer whitespace-nowrap transition-all duration-150 border-none ${
    active
      ? 'bg-indigo-600 text-white shadow-[0_0_0_1px_rgba(99,102,241,0.4),0_4px_14px_-2px_rgba(99,102,241,0.55)]'
      : 'bg-transparent text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)]'
  }`;

/**
 * Thanh điều hướng dạng viên thuốc: mục nào không đủ chỗ thì tự gom vào menu
 * "Thêm" (dropdown) thay vì tràn hoặc đè lên logo. Mục đang mở luôn hiện sẵn.
 */
export const OverflowNav: React.FC<OverflowNavProps> = ({ items, activeKey, onNavigate, ariaLabel }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLUListElement>(null);
  const menuRef = useRef<HTMLLIElement>(null);
  const [count, setCount] = useState(items.length);
  const [open, setOpen] = useState(false);

  const measure = useCallback(() => {
    const container = containerRef.current;
    const ruler = measureRef.current;
    if (!container || !ruler) return;
    const children = Array.from(ruler.children) as HTMLElement[];
    const widths = children.slice(0, items.length).map((el) => el.getBoundingClientRect().width);
    const moreWidth = children[items.length]?.getBoundingClientRect().width ?? 96;
    setCount(
      computeVisibleCount({
        widths,
        available: container.clientWidth - PILL_CHROME_PX,
        moreWidth,
        gap: GAP_PX,
      }),
    );
  }, [items]);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    // Font tải xong thì chiều rộng chữ đổi: đo lại.
    void document.fonts?.ready.then(measure);
    return () => observer.disconnect();
  }, [measure]);

  // Đóng menu khi bấm ra ngoài, nhấn Esc hoặc khi đã chuyển trang.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [activeKey]);

  const { visible, overflow } = splitNavItems(items, activeKey, count);
  const overflowActive = overflow.some((i) => i.key === activeKey);

  return (
    <div ref={containerRef} className="relative flex min-w-0 flex-1 justify-center">
      <ul
        className="m-0 flex h-10 list-none items-center gap-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)]/60 p-1 backdrop-blur-sm"
        aria-label={ariaLabel}
      >
        {visible.map((item) => (
          <li key={item.key} className="h-full">
            <button
              type="button"
              className={itemCls(activeKey === item.key)}
              aria-current={activeKey === item.key ? 'page' : undefined}
              onClick={() => onNavigate(item.path)}
            >
              <item.Icon size={15} strokeWidth={2} aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          </li>
        ))}

        {overflow.length > 0 && (
          <li className="relative h-full" ref={menuRef}>
            <button
              type="button"
              className={itemCls(overflowActive && !visible.some((v) => v.key === activeKey))}
              aria-haspopup="menu"
              aria-expanded={open}
              onClick={() => setOpen((o) => !o)}
            >
              <MoreHorizontal size={15} strokeWidth={2} aria-hidden="true" />
              <span>Thêm</span>
              <ChevronDown size={13} strokeWidth={2.5} className={`transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
            {open && (
              <div
                role="menu"
                aria-label="Mục khác"
                className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] py-1 shadow-xl"
              >
                {overflow.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setOpen(false);
                      onNavigate(item.path);
                    }}
                    className={`flex w-full cursor-pointer items-center gap-2.5 border-none px-4 py-2.5 text-left text-sm font-semibold transition-colors ${
                      item.key === activeKey
                        ? 'bg-indigo-600/10 text-indigo-600'
                        : 'bg-transparent text-[var(--text-main)] hover:bg-[var(--bg-main)]'
                    }`}
                  >
                    <item.Icon size={15} strokeWidth={2} aria-hidden="true" />
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </li>
        )}
      </ul>

      {/* Thước đo ẩn: chiều rộng thật của từng mục (và nút Thêm) để biết mục nào còn vừa.
          Bọc trong khung 0x0 overflow-hidden để không làm trang cuộn ngang. */}
      <div aria-hidden="true" className="pointer-events-none invisible absolute left-0 top-0 h-0 w-0 overflow-hidden">
        <ul className="m-0 flex list-none gap-1.5 p-0" ref={measureRef}>
          {items.map((item) => (
            <li key={item.key} className="h-10">
              <span className={itemCls(false)}>
                <item.Icon size={15} strokeWidth={2} />
                <span>{item.label}</span>
              </span>
            </li>
          ))}
          <li className="h-10">
            <span className={itemCls(false)}>
              <MoreHorizontal size={15} strokeWidth={2} />
              <span>Thêm</span>
              <ChevronDown size={13} strokeWidth={2.5} />
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default OverflowNav;
