import React, { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastState {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DURATION_MS = 3000;

const TOAST_STYLE: Record<ToastType, { bg: string; Icon: typeof CheckCircle2 }> = {
  success: { bg: 'bg-emerald-600 border-emerald-500', Icon: CheckCircle2 },
  error: { bg: 'bg-red-600 border-red-500', Icon: XCircle },
  info: { bg: 'bg-indigo-600 border-indigo-500', Icon: Info },
};

/**
 * Toast dùng chung cho toàn app — thay cho 3 bản cài đặt trùng lặp trước đây
 * (ContestListPage, ContestExamWorkspace, TeacherAuthoringPage đều tự viết
 * useState + setTimeout + JSX riêng, mỗi nơi một kiểu vị trí/animation
 * khác nhau). Đặt Provider ở App.tsx để mọi trang gọi useToast() mà không
 * cần truyền prop xuyên nhiều tầng.
 *
 * Vị trí: giữa trên cùng màn hình, animate trượt/rơi xuống từ mép trên rồi
 * tự biến mất sau ~3s.
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, TOAST_DURATION_MS);
  }, []);

  const dismiss = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 pointer-events-none">
        {toasts.map((toast) => {
          const { bg, Icon } = TOAST_STYLE[toast.type];
          return (
            <div
              key={toast.id}
              className={`toast-drop-in pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-sm font-semibold text-white max-w-md ${bg}`}
            >
              <Icon size={18} className="shrink-0" />
              <span className="flex-1">{toast.message}</span>
              <button
                onClick={() => dismiss(toast.id)}
                className="shrink-0 opacity-80 hover:opacity-100 cursor-pointer"
                aria-label="Đóng thông báo"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast phải được gọi bên trong <ToastProvider>');
  }
  return ctx;
}
