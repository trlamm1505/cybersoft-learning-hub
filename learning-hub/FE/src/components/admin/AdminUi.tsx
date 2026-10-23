import React, { useEffect, useId } from 'react';
import { Loader2, X } from 'lucide-react';
import { TONE_CLASS, type Tone } from '../../pages/adminPortalModel';

/** Thông báo lỗi từ phản hồi Nest (message có thể là chuỗi hoặc mảng). */
export function errorMessage(err: unknown, fallback: string): string {
  const m = (err as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
  if (Array.isArray(m)) return m.join(', ');
  return typeof m === 'string' && m ? m : fallback;
}

export const card = 'rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900';

export const btnPrimary =
  'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:cursor-not-allowed disabled:opacity-50';
export const btnSecondary =
  'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800';
export const btnDanger =
  'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 disabled:cursor-not-allowed disabled:opacity-50';
export const btnGhost =
  'inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-indigo-700 transition-colors hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-indigo-500 disabled:cursor-not-allowed disabled:opacity-40 dark:text-indigo-300 dark:hover:bg-indigo-500/10';

export const Pill: React.FC<{ tone: Tone; children: React.ReactNode; className?: string }> = ({ tone, children, className = '' }) => (
  <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${TONE_CLASS[tone]} ${className}`}>
    {children}
  </span>
);

/** Khối khung xương khi đang tải: chiều cao giữ nguyên nên bố cục không nhảy khi dữ liệu về. */
export const Skeleton: React.FC<{ className?: string }> = ({ className = 'h-4 w-full' }) => (
  <div aria-hidden="true" className={`animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-800 ${className}`} />
);

export const SkeletonRows: React.FC<{ rows?: number; cols?: number }> = ({ rows = 6, cols = 5 }) => (
  <div role="status" aria-label="Đang tải dữ liệu" className="space-y-3 p-4">
    {Array.from({ length: rows }, (_, r) => (
      <div key={r} className="flex gap-4">
        {Array.from({ length: cols }, (_, c) => (
          <Skeleton key={c} className={`h-5 ${c === 0 ? 'w-1/4' : 'flex-1'}`} />
        ))}
      </div>
    ))}
  </div>
);

export const PageHeader: React.FC<{ title: string; subtitle?: string; actions?: React.ReactNode }> = ({ title, subtitle, actions }) => (
  <div className="flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-main)]">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-[var(--text-muted)]">{subtitle}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

export const ErrorBanner: React.FC<{ message: string | null; onRetry?: () => void }> = ({ message, onRetry }) =>
  message ? (
    <div role="alert" className="flex items-center justify-between gap-3 rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
      <span>{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="cursor-pointer font-medium underline">
          Thử lại
        </button>
      )}
    </div>
  ) : null;

/** Ngăn xếp hộp thoại đang mở: Esc chỉ đóng hộp trên cùng (mở hộp phụ từ hộp chi tiết không làm đóng cả hai). */
const openModals: symbol[] = [];

/** Hộp thoại: nút ✕, Esc và bấm nền đều đóng; khóa cuộn trang phía sau và trả lại khi đóng. */
export const Modal: React.FC<{
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
}> = ({ title, onClose, children, footer, width = 'max-w-md' }) => {
  const titleId = useId();
  useEffect(() => {
    const me = Symbol('modal');
    openModals.push(me);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && openModals[openModals.length - 1] === me) onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      openModals.splice(openModals.indexOf(me), 1);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-10 sm:py-20" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="fixed inset-0 bg-neutral-950/50" onClick={onClose} />
      <div className={`relative w-full ${width} rounded-xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-900`}>
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3.5 dark:border-neutral-800">
          <h2 id={titleId} className="text-base font-semibold text-[var(--text-main)]">
            {title}
          </h2>
          <button onClick={onClose} aria-label="Đóng" className="cursor-pointer rounded-md p-1 text-[var(--text-muted)] hover:bg-neutral-100 dark:hover:bg-neutral-800">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-neutral-200 px-5 py-3 dark:border-neutral-800">{footer}</div>}
      </div>
    </div>
  );
};

export const ConfirmModal: React.FC<{
  title: string;
  message: React.ReactNode;
  confirmLabel: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}> = ({ title, message, confirmLabel, danger, busy, onConfirm, onClose }) => (
  <Modal
    title={title}
    onClose={onClose}
    footer={
      <>
        <button onClick={onClose} className={btnSecondary} disabled={busy}>
          Hủy
        </button>
        <button onClick={onConfirm} className={danger ? btnDanger : btnPrimary} disabled={busy}>
          {busy && <Loader2 size={14} className="animate-spin" />} {confirmLabel}
        </button>
      </>
    }
  >
    <div className="text-sm leading-relaxed text-[var(--text-main)]">{message}</div>
  </Modal>
);

export const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
  <label className="block">
    <span className="mb-1 block text-sm font-medium text-[var(--text-main)]">{label}</span>
    {children}
    {hint && <span className="mt-1 block text-xs text-[var(--text-muted)]">{hint}</span>}
  </label>
);

export const inputCls =
  'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500';

export const selectCls =
  `${inputCls} cursor-pointer dark:[color-scheme:dark] [&>option]:bg-white [&>option]:text-neutral-900 dark:[&>option]:bg-neutral-800 dark:[&>option]:text-neutral-100`;
