import React, { useState } from 'react';
import { Baby, Gamepad2, Rocket, Loader2 } from 'lucide-react';
import authApi from '../axios/authApi';
import type { AgeGroup } from '../types/auth';

interface AgeGroupModalProps {
  onSelected: (ageGroup: AgeGroup) => void;
}

const OPTIONS: { value: AgeGroup; label: string; desc: string; Icon: typeof Baby; gradient: string }[] = [
  { value: '3-5', label: 'Lớp 3-5', desc: 'Làm quen tư duy lập trình qua trò chơi hình khối', Icon: Baby, gradient: 'from-orange-400 to-pink-500' },
  { value: '6-9', label: 'Lớp 6-9', desc: 'Python căn bản, giải thuật đơn giản', Icon: Gamepad2, gradient: 'from-indigo-600 to-cyan-500' },
  { value: '10-12', label: 'Lớp 10-12', desc: 'Thuật toán nâng cao, luyện thi', Icon: Rocket, gradient: 'from-slate-700 to-slate-900' },
];

/**
 * Modal bắt buộc chọn nhóm tuổi ngay sau lần đăng nhập đầu tiên của một tài
 * khoản STUDENT chưa có ageGroup — thay cho việc chọn lúc đăng ký (đã bỏ để
 * form đăng ký gọn hơn). Không có nút đóng/bỏ qua: học viên phải chọn một
 * lần rồi thôi, lần đăng nhập sau ageGroup đã có nên modal không hiện lại.
 */
export const AgeGroupModal: React.FC<AgeGroupModalProps> = ({ onSelected }) => {
  const [selected, setSelected] = useState<AgeGroup | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!selected) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await authApi.setAgeGroup({ ageGroup: selected });
      onSelected(selected);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Không thể lưu lựa chọn. Vui lòng thử lại.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl p-6 sm:p-8 space-y-5">
        <div className="text-center space-y-1.5">
          <h2 className="text-xl font-black text-[var(--text-main)]">Chào mừng bạn đến CyberSoft Hub!</h2>
          <p className="text-sm text-[var(--text-muted)]">Chọn nhóm tuổi để chúng tôi cá nhân hóa nội dung học phù hợp với bạn.</p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs font-semibold text-rose-700 dark:text-rose-300">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {OPTIONS.map(({ value, label, desc, Icon, gradient }) => (
            <button
              key={value}
              type="button"
              onClick={() => setSelected(value)}
              className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col gap-2.5 ${
                selected === value
                  ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/50 shadow-md'
                  : 'border-[var(--border-color)] bg-[var(--bg-main)] hover:border-indigo-300'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-md`}>
                <Icon size={20} strokeWidth={2} />
              </div>
              <div>
                <div className="font-extrabold text-sm text-[var(--text-main)]">{label}</div>
                <div className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-snug">{desc}</div>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={handleConfirm}
          disabled={!selected || isSubmitting}
          className="w-full py-3 text-sm font-extrabold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-1.5">
              <Loader2 size={14} className="animate-spin" /> Đang lưu...
            </span>
          ) : (
            'Xác nhận'
          )}
        </button>
      </div>
    </div>
  );
};

export default AgeGroupModal;
