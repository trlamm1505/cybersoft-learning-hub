import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { PASSWORD_RULES } from '../../common/authValidation';

/** Lớp CSS ô nhập của form xác thực; viền đỏ khi đang có lỗi. */
export const authInputCls = (hasError: boolean) =>
  `w-full px-3.5 py-2.5 text-sm rounded-xl bg-[var(--bg-main)] border text-[var(--text-main)] focus:outline-none ${
    hasError ? 'border-red-500 focus:border-red-500' : 'border-[var(--border-color)] focus:border-indigo-500'
  }`;

/** Dòng báo lỗi màu đỏ ngay dưới ô nhập. */
export const FieldError: React.FC<{ id: string; message?: string }> = ({ id, message }) =>
  message ? (
    <p id={id} role="alert" className="mt-1 text-xs font-semibold text-red-600 dark:text-red-400">
      {message}
    </p>
  ) : null;

/** Danh sách điều kiện mật khẩu: điều kiện chưa đạt hiện màu đỏ, đã đạt hiện màu xanh. */
export const PasswordChecklist: React.FC<{ id: string; password: string }> = ({ id, password }) => (
  <ul id={id} aria-label="Điều kiện mật khẩu" className="mt-1.5 space-y-0.5">
    {PASSWORD_RULES.map((r) => {
      const ok = r.test(password);
      return (
        <li
          key={r.id}
          data-ok={ok}
          className={`flex items-start gap-1.5 text-xs font-semibold ${ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}
        >
          {ok ? <CheckCircle2 size={13} className="mt-px shrink-0" aria-hidden="true" /> : <Circle size={13} className="mt-px shrink-0" aria-hidden="true" />}
          <span>{r.label}</span>
        </li>
      );
    })}
  </ul>
);

/** Ô tick đồng ý điều khoản: nút gửi form chỉ bật khi đã tick. */
export const TermsCheckbox: React.FC<{ id: string; checked: boolean; onChange: (v: boolean) => void }> = ({ id, checked, onChange }) => (
  <label htmlFor={id} className="flex cursor-pointer items-start gap-2 text-xs leading-relaxed text-[var(--text-main)]">
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-indigo-600"
    />
    <span>Tôi đồng ý với Điều khoản dịch vụ và Chính sách bảo vệ dữ liệu học tập của CyberSoft</span>
  </label>
);
