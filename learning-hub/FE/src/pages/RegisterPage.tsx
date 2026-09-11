import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authApi from '../axios/authApi';
import type { AuthResponse } from '../types/auth';

interface RegisterPageProps {
  onAuthSuccess: (auth: AuthResponse) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onAuthSuccess }) => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'STUDENT' | 'TEACHER'>('STUDENT');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const auth = await authApi.register({ email, password, fullName, role });
      onAuthSuccess(auth);
      navigate(auth.user.role === 'TEACHER' ? '/authoring' : '/catalog');
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
          <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-500 flex items-center justify-center text-white text-xl shadow-md">
            ⚡
          </div>
          <h1 className="text-xl font-black text-[var(--text-main)]">Tạo tài khoản mới</h1>
          <p className="text-xs text-[var(--text-muted)]">Tham gia CyberSoft Hub để học tập và thi đấu.</p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs font-semibold text-rose-700 dark:text-rose-300">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">Họ và tên</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] focus:outline-none focus:border-indigo-500"
              placeholder="Nguyễn Văn A"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] focus:outline-none focus:border-indigo-500"
              placeholder="ban@example.com"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">Mật khẩu</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] focus:outline-none focus:border-indigo-500"
              placeholder="Ít nhất 6 ký tự"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1.5">Bạn là</label>
            <div className="flex items-center p-1 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-xs font-semibold shadow-xs">
              <button
                type="button"
                onClick={() => setRole('STUDENT')}
                className={`flex-1 px-3 py-2 rounded-lg transition-all cursor-pointer border-none text-xs ${
                  role === 'STUDENT'
                    ? 'bg-indigo-600 text-white shadow-xs font-bold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)] bg-transparent'
                }`}
              >
                🎓 Học viên (Student)
              </button>
              <button
                type="button"
                onClick={() => setRole('TEACHER')}
                className={`flex-1 px-3 py-2 rounded-lg transition-all cursor-pointer border-none text-xs ${
                  role === 'TEACHER'
                    ? 'bg-amber-600 text-white shadow-xs font-bold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)] bg-transparent'
                }`}
              >
                👨‍🏫 Giảng viên (Teacher)
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 text-sm font-extrabold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? '⏳ Đang tạo tài khoản...' : 'Đăng ký'}
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
