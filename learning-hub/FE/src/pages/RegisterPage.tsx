import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Loader2 } from 'lucide-react';
import authApi from '../axios/authApi';
import type { AgeGroup, AuthResponse } from '../types/auth';
import { USER_GROUP_OPTIONS } from '../common/userGroups';
import { homeFor } from '../common/authRoutes';
import { emailError, fullNameError, normalizeEmail, passwordError } from '../common/authValidation';
import { FieldError, PasswordChecklist, TermsCheckbox, authInputCls } from '../components/auth/AuthFormParts';

interface RegisterPageProps {
  onAuthSuccess: (auth: AuthResponse) => void;
}

// Đăng ký công khai chỉ tạo tài khoản STUDENT — Teacher/Admin được cấp quyền
// bằng tay (qua Admin) sau này, không tự chọn role qua form nữa để tránh bất
// kỳ ai cũng có thể tự phong mình làm Giảng viên.
export const RegisterPage: React.FC<RegisterPageProps> = ({ onAuthSuccess }) => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [terms, setTerms] = useState(false);
  const [group, setGroup] = useState<AgeGroup | ''>('');
  const [touched, setTouched] = useState({ fullName: false, email: false, password: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Báo lỗi theo thời gian thực: khi đã rời ô hoặc đang gõ dở.
  const nameErr = (touched.fullName || fullName.length > 0) ? fullNameError(fullName) : undefined;
  const emailErr = (touched.email || email.length > 0) ? emailError(email) : undefined;
  const showPassword = touched.password || password.length > 0;
  const passwordErr = showPassword ? passwordError(password) : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ fullName: true, email: true, password: true });
    if (fullNameError(fullName) || emailError(email) || passwordError(password)) return;
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const auth = await authApi.register({ email: normalizeEmail(email), password, fullName: fullName.trim(), role: 'STUDENT', ...(group ? { ageGroup: group } : {}) });
      onAuthSuccess(auth);
      navigate(homeFor(auth.user));
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 sm:p-8 shadow-md space-y-5">
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md">
            <Zap size={22} strokeWidth={2.25} />
          </div>
          <h1 className="text-xl font-black text-[var(--text-main)]">Tạo tài khoản mới</h1>
          <p className="text-xs text-[var(--text-muted)]">Tham gia CyberSoft Hub để học tập và thi đấu.</p>
        </div>

        {errorMsg && (
          <div role="alert" className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs font-semibold text-rose-700 dark:text-rose-300">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label htmlFor="reg-name" className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">Họ và tên</label>
            <input
              id="reg-name"
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              onBlur={() => {
                setFullName((v) => v.trim());
                setTouched((t) => ({ ...t, fullName: true }));
              }}
              aria-invalid={!!nameErr}
              aria-describedby={nameErr ? 'reg-name-err' : undefined}
              className={authInputCls(!!nameErr)}
              placeholder="Nguyễn Văn A"
            />
            <FieldError id="reg-name-err" message={nameErr} />
          </div>

          <div>
            <label htmlFor="reg-email" className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">Email</label>
            <input
              id="reg-email"
              type="text"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => {
                setEmail((v) => normalizeEmail(v));
                setTouched((t) => ({ ...t, email: true }));
              }}
              aria-invalid={!!emailErr}
              aria-describedby={emailErr ? 'reg-email-err' : undefined}
              className={authInputCls(!!emailErr)}
              placeholder="ban@example.com"
            />
            <FieldError id="reg-email-err" message={emailErr} />
          </div>

          <div>
            <label htmlFor="reg-password" className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">Mật khẩu</label>
            <input
              id="reg-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              aria-invalid={!!passwordErr}
              aria-describedby="reg-password-rules"
              className={authInputCls(!!passwordErr)}
              placeholder="8–32 ký tự, có chữ hoa, thường, số, ký tự đặc biệt"
            />
            {showPassword ? <PasswordChecklist id="reg-password-rules" password={password} /> : <span id="reg-password-rules" />}
          </div>

          <div>
            <label htmlFor="reg-group" className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">Bạn thuộc nhóm nào?</label>
            <select
              id="reg-group"
              value={group}
              onChange={(e) => setGroup(e.target.value as AgeGroup | '')}
              className={authInputCls(false)}
            >
              <option value="">Chọn sau khi đăng nhập</option>
              {USER_GROUP_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <TermsCheckbox id="reg-terms" checked={terms} onChange={setTerms} />

          <button
            type="submit"
            disabled={!terms || isSubmitting}
            className="w-full py-3 text-sm font-extrabold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-1.5">
                <Loader2 size={14} className="animate-spin" /> Đang tạo tài khoản...
              </span>
            ) : (
              'Đăng ký'
            )}
          </button>
        </form>

        <p className="text-center text-xs text-[var(--text-muted)]">
          Đã có tài khoản?{' '}
          <button
            onClick={() => navigate('/login')}
            className="font-bold text-indigo-600 dark:text-cyan-400 bg-transparent border-none cursor-pointer hover:underline"
          >
            Đăng nhập
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
