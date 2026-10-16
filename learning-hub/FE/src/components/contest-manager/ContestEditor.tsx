import React, { useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, ArrowRight, Check, Loader2, Lock, Rocket, Save, ShieldCheck } from 'lucide-react';
import { contestApi } from '../../axios/contestApi';
import type { ContestItem } from '../../types/contest';
import { useToast } from '../Toast';
import { ProblemPicker } from './ProblemPicker';
import {
  buildPayload,
  changeDuration,
  changeStart,
  DURATION_PRESETS,
  formFromContest,
  isStructureLocked,
  newContestForm,
  parseLocalInput,
  summarizeProblems,
  validateForm,
  windowMinutes,
  type ContestForm,
} from './contestForm';

const STEPS = ['Thông tin', 'Đề thi', 'Giám sát & xuất bản'] as const;

const labelCls = 'mb-1 block text-xs font-extrabold uppercase tracking-wider text-[var(--text-main)]';
const inputCls =
  'w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] px-4 py-2.5 text-sm text-[var(--text-main)] focus:border-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60';

const fmt = (value: string) => {
  const d = parseLocalInput(value);
  return d ? d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : '...';
};

interface ContestEditorProps {
  /** null: tạo mới. */
  contest: ContestItem | null;
  onClose: () => void;
  onSaved: () => void;
}

/**
 * Tạo/sửa cuộc thi theo 3 bước: thông tin → đề thi (trắc nghiệm + code) →
 * giám sát & xuất bản. Có thể lưu nháp ở mọi bước; xuất bản kiểm tra đủ điều kiện.
 */
export const ContestEditor: React.FC<ContestEditorProps> = ({ contest, onClose, onSaved }) => {
  const { showToast } = useToast();
  const [form, setForm] = useState<ContestForm>(() => (contest ? formFromContest(contest) : newContestForm()));
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState<'draft' | 'published' | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const locked = isStructureLocked(contest);
  const stats = useMemo(() => summarizeProblems(form.problems), [form.problems]);
  const windowMin = windowMinutes(form.startTime, form.endTime);
  const wasPublished = contest?.status === 'published';

  const patch = (changes: Partial<ContestForm>) => {
    setForm((prev) => ({ ...prev, ...changes }));
    setErrors([]);
  };

  const save = async (status: 'draft' | 'published') => {
    const found = validateForm(form, status === 'published');
    if (found.length > 0) {
      setErrors(found);
      return;
    }
    setSaving(status);
    try {
      const payload = buildPayload(form, status);
      if (contest?._id) await contestApi.updateContest(contest._id, payload);
      else await contestApi.createContest(payload);
      showToast(status === 'published' ? 'Đã xuất bản cuộc thi.' : 'Đã lưu bản nháp.', 'success');
      onSaved();
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setErrors([Array.isArray(message) ? message.join(' ') : message || 'Không lưu được cuộc thi. Vui lòng thử lại.']);
    } finally {
      setSaving(null);
    }
  };

  const next = () => {
    if (step === 0) {
      const found = validateForm({ ...form, problems: [] }, false);
      if (found.length > 0) {
        setErrors(found);
        return;
      }
    }
    setErrors([]);
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };

  return (
    <div className="space-y-5 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-2 text-xs font-bold text-[var(--text-main)]"
        >
          <ArrowLeft size={14} /> Danh sách cuộc thi
        </button>
        <h2 className="text-lg font-black tracking-tight text-[var(--text-main)]">
          {contest ? 'Sửa cuộc thi' : 'Tạo cuộc thi mới'}
        </h2>
      </div>

      {/* Các bước */}
      <ol className="grid grid-cols-3 gap-2" aria-label="Các bước tạo cuộc thi">
        {STEPS.map((label, i) => {
          const done = i < step;
          const current = i === step;
          return (
            <li key={label}>
              <button
                type="button"
                onClick={() => setStep(i)}
                aria-current={current ? 'step' : undefined}
                className={`flex w-full cursor-pointer items-center gap-2 rounded-2xl border px-3 py-2.5 text-left text-xs font-bold ${
                  current
                    ? 'border-indigo-600 bg-indigo-600 text-white'
                    : done
                      ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                      : 'border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-muted)]'
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] ${
                    current ? 'bg-indigo-900/50' : done ? 'bg-emerald-500 text-white' : 'bg-[var(--bg-main)]'
                  }`}
                >
                  {done ? <Check size={12} /> : i + 1}
                </span>
                <span className="truncate">{label}</span>
              </button>
            </li>
          );
        })}
      </ol>

      {errors.length > 0 && (
        <div role="alert" className="space-y-1 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-600 dark:text-rose-400">
          <p className="flex items-center gap-1.5 font-bold">
            <AlertTriangle size={14} /> Cần chỉnh lại:
          </p>
          <ul className="list-disc pl-5">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 shadow-sm md:p-6">
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <label htmlFor="contest-title" className={labelCls}>
                Tên cuộc thi *
              </label>
              <input
                id="contest-title"
                value={form.title}
                maxLength={200}
                onChange={(e) => patch({ title: e.target.value })}
                placeholder="Ví dụ: Thi giữa kỳ Python"
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="contest-desc" className={labelCls}>
                Mô tả / thể lệ
              </label>
              <textarea
                id="contest-desc"
                rows={3}
                value={form.description}
                maxLength={5000}
                onChange={(e) => patch({ description: e.target.value })}
                placeholder="Nội dung thi, quy định cho thí sinh..."
                className={`${inputCls} resize-none`}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="contest-start" className={labelCls}>
                  Mở đề lúc *
                </label>
                <input
                  id="contest-start"
                  type="datetime-local"
                  value={form.startTime}
                  disabled={locked}
                  onChange={(e) => {
                    setForm((prev) => changeStart(prev, e.target.value));
                    setErrors([]);
                  }}
                  className={`${inputCls} font-mono`}
                />
                {locked && (
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                    <Lock size={11} /> Cuộc thi đã bắt đầu, không đổi được giờ mở đề.
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="contest-end" className={labelCls}>
                  Đóng đề lúc *
                </label>
                <input
                  id="contest-end"
                  type="datetime-local"
                  value={form.endTime}
                  onChange={(e) => patch({ endTime: e.target.value })}
                  className={`${inputCls} font-mono`}
                />
              </div>
            </div>

            <div>
              <span className={labelCls}>Thời gian làm bài của mỗi thí sinh *</span>
              <div className="flex flex-wrap items-center gap-2">
                {DURATION_PRESETS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setForm((prev) => changeDuration(prev, m));
                      setErrors([]);
                    }}
                    className={`cursor-pointer rounded-xl border px-3 py-1.5 text-xs font-bold ${
                      form.durationMinutes === m
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] hover:border-indigo-400'
                    }`}
                  >
                    {m} phút
                  </button>
                ))}
                <input
                  type="number"
                  min={1}
                  max={14400}
                  aria-label="Thời gian làm bài (phút)"
                  value={form.durationMinutes}
                  onChange={(e) => {
                    setForm((prev) => changeDuration(prev, parseInt(e.target.value, 10) || 1));
                    setErrors([]);
                  }}
                  className="w-24 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] px-3 py-1.5 text-center font-mono text-xs font-bold text-[var(--text-main)]"
                />
                <span className="text-xs text-[var(--text-muted)]">phút</span>
              </div>
            </div>

            <p className="rounded-2xl border border-indigo-200 bg-indigo-50 p-3 text-xs leading-relaxed text-indigo-900 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200">
              Thí sinh được vào thi từ <strong>{fmt(form.startTime)}</strong> đến <strong>{fmt(form.endTime)}</strong> (
              {windowMin > 0 ? `${windowMin} phút` : '...'}). Đồng hồ của mỗi người chạy <strong>{form.durationMinutes} phút</strong> kể từ lúc bấm
              "Vào thi" và do máy chủ giữ, nên không thể kéo dài bằng cách đổi máy hoặc xóa dữ liệu trình duyệt.
            </p>
          </div>
        )}

        {step === 1 && (
          <ProblemPicker problems={form.problems} onChange={(problems) => patch({ problems })} locked={locked} />
        )}

        {step === 2 && (
          <div className="space-y-5">
            <section className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-extrabold text-[var(--text-main)]">
                <ShieldCheck size={16} /> Giám sát tính trung thực
              </h3>
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] p-4">
                <input
                  type="checkbox"
                  checked={form.integrityEnabled}
                  onChange={(e) => patch({ integrityEnabled: e.target.checked })}
                  className="mt-0.5 h-4 w-4 cursor-pointer"
                />
                <span className="space-y-1 text-xs">
                  <span className="block text-sm font-bold text-[var(--text-main)]">Bật tín hiệu liêm chính (khuyến nghị)</span>
                  <span className="block text-[var(--text-muted)]">
                    Ghi nhận thời gian làm bài, số lần thí sinh rời màn hình thi và mức giống nhau của mã nguồn giữa các bài.
                    Thí sinh được thông báo rõ trước khi vào thi.
                  </span>
                </span>
              </label>
              <p className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-3 text-xs text-[var(--text-main)]">
                Hệ thống <strong>không tự trừ điểm, không hủy bài, không tự kết luận gian lận</strong>. Bài có dấu hiệu bất thường chỉ
                được đưa vào hàng chờ "Cần xem xét" để bạn đối chiếu và quyết định ở mục Kết quả.
              </p>
            </section>

            <section className="space-y-2 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] p-4 text-xs text-[var(--text-main)]">
              <h3 className="text-sm font-extrabold">Tóm tắt</h3>
              <p>
                <strong>{form.title.trim() || '(chưa đặt tên)'}</strong>
              </p>
              <p>
                {fmt(form.startTime)} → {fmt(form.endTime)} · {form.durationMinutes} phút/thí sinh
              </p>
              <p>
                {stats.total} đề ({stats.quiz} trắc nghiệm, {stats.coding} code) · tổng <strong>{stats.totalPoints} điểm</strong> ·{' '}
                {form.integrityEnabled ? 'có giám sát liêm chính' : 'không giám sát'}
              </p>
              {stats.total === 0 && <p className="text-amber-700 dark:text-amber-400">Chưa có đề: chỉ lưu nháp được.</p>}
            </section>
          </div>
        )}
      </div>

      {/* Thanh thao tác cố định phía dưới */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--border-color)] bg-[var(--bg-card)]/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={step === 0 ? onClose : () => setStep((s) => s - 1)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] px-4 py-2 text-xs font-bold text-[var(--text-main)]"
          >
            <ArrowLeft size={14} /> {step === 0 ? 'Hủy' : 'Quay lại'}
          </button>
          <div className="flex flex-wrap items-center gap-2">
            {!(wasPublished && contest) && (
              <button
                type="button"
                disabled={saving !== null}
                onClick={() => save('draft')}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] px-4 py-2 text-xs font-bold text-[var(--text-main)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving === 'draft' ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Lưu nháp
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={next}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border-none bg-indigo-600 px-5 py-2 text-xs font-black text-white hover:bg-indigo-700"
              >
                Tiếp theo <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                disabled={saving !== null}
                onClick={() => save('published')}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border-none bg-emerald-700 px-5 py-2 text-xs font-black text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving === 'published' ? <Loader2 size={14} className="animate-spin" /> : <Rocket size={14} />}
                {wasPublished ? 'Lưu thay đổi' : 'Xuất bản'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContestEditor;
