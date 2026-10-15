import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Loader2 } from 'lucide-react';
import authApi from '../axios/authApi';
import type { AuthResponse } from '../types/auth';
import { homeFor } from '../common/authRoutes';
import { emailError, normalizeEmail } from '../common/authValidation';
import { FieldError, authInputCls } from '../components/auth/AuthFormParts';

interface LoginPageProps {
  onAuthSuccess: (auth: AuthResponse) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onAuthSuccess }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Báo lỗi theo thời gian thực: khi đã rời ô hoặc đang gõ dở. Đăng nhập không áp chính sách mật khẩu mạnh
  // (tài khoản cũ có thể có mật khẩu theo quy tắc cũ), chỉ bắt buộc phải nhập.
  const emailErr = (touched.email || email.length > 0) ? emailError(email) : undefined;
  const passwordErr = touched.password && !password ? 'Vui lòng nhập mật khẩu.' : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (emailError(email) || !password) return;
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const auth = await authApi.login({ email: normalizeEmail(email), password });
      onAuthSuccess(auth);
      navigate(homeFor(auth.user));
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
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
          <h1 className="text-xl font-black text-[var(--text-main)]">Đăng nhập</h1>
          <p className="text-xs text-[var(--text-muted)]">Chào mừng bạn quay lại CyberSoft Hub.</p>
        </div>

        {errorMsg && (
          <div role="alert" className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs font-semibold text-rose-700 dark:text-rose-300">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">Email</label>
            <input
              id="login-email"
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
              aria-describedby={emailErr ? 'login-email-err' : undefined}
              className={authInputCls(!!emailErr)}
              placeholder="ban@example.com"
            />
            <FieldError id="login-email-err" message={emailErr} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="login-password" className="block text-[11px] font-semibold text-[var(--text-muted)]">Mật khẩu</label>
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-[11px] font-bold text-indigo-600 dark:text-cyan-400 bg-transparent border-none cursor-pointer hover:underline"
              >
                Quên mật khẩu?
              </button>
            </div>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              aria-invalid={!!passwordErr}
              aria-describedby={passwordErr ? 'login-password-err' : undefined}
              className={authInputCls(!!passwordErr)}
              placeholder="••••••••"
            />
            <FieldError id="login-password-err" message={passwordErr} />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 text-sm font-extrabold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-1.5">
                <Loader2 size={14} className="animate-spin" /> Đang đăng nhập...
              </span>
            ) : (
              'Đăng nhập'
            )}
          </button>
        </form>

        <p className="text-center text-xs text-[var(--text-muted)]">
          Chưa có tài khoản?{' '}
          <button
            onClick={() => navigate('/register')}
            className="font-bold text-indigo-600 dark:text-cyan-400 bg-transparent border-none cursor-pointer hover:underline"
          >
            Đăng ký ngay
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
