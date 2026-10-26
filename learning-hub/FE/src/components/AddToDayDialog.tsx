import React, { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import teacherClassAssignmentsApi from '../axios/teacherClassAssignmentsApi';
import { BankPicker } from './BankPicker';
import type { BankBand } from '../types/classDays';
import { control } from './adminStyles';
import { buildPayload, dayTitle, defaultDueLocal, toggleId, TYPE_BADGE, validateAddForm, type AddForm } from '../pages/classDaysModel';

const errorMessage = (err: unknown, fallback: string) =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;

interface Props {
  classId: string;
  day: { date: string; dayNumber: number };
  band?: BankBand | null;
  onClose: () => void;
  onSaved: () => void;
}

/** Hộp thoại "Thêm bài vào ngày": chọn loại (Code / Trắc nghiệm), chọn từ ngân hàng đề (phân trang), đặt hạn nộp rồi lưu. */
export const AddToDayDialog: React.FC<Props> = ({ classId, day, band, onClose, onSaved }) => {
  const [form, setForm] = useState<AddForm>({
    type: 'CODING',
    exerciseSlug: '',
    exerciseTitle: '',
    questionIds: [],
    title: '',
    maxPoints: 10,
    dueLocal: defaultDueLocal(day.date),
  });
  const [titleEdited, setTitleEdited] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !saving && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, saving]);

  const set = (patch: Partial<AddForm>) => setForm((f) => ({ ...f, ...patch }));

  const save = async () => {
    const problem = validateAddForm(form, day.date);
    if (problem) return setError(problem);
    setSaving(true);
    setError(null);
    try {
      await teacherClassAssignmentsApi.create(classId, buildPayload(form, day.date));
      onSaved();
    } catch (err) {
      setError(errorMessage(err, 'Không lưu được bài. Vui lòng thử lại.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto p-4" role="dialog" aria-modal="true" aria-label={`Thêm bài vào ${dayTitle(day)}`}>
      <div className="fixed inset-0 bg-black/40" onClick={() => !saving && onClose()} />
      <div className="relative my-6 w-full max-w-2xl space-y-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-xl dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-base font-semibold text-[var(--text-main)]">Thêm bài vào {dayTitle(day)}</h2>
          <button onClick={onClose} aria-label="Đóng" className="cursor-pointer text-[var(--text-muted)]">
            <X size={18} />
          </button>
        </div>

        <div role="tablist" aria-label="Loại bài" className="flex gap-2">
          {(['CODING', 'QUIZ'] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={form.type === t}
              onClick={() => set({ type: t, exerciseSlug: '', exerciseTitle: '', questionIds: [], ...(titleEdited ? {} : { title: '' }) })}
              className={`cursor-pointer rounded-md px-3 py-1.5 text-sm ${form.type === t ? 'bg-indigo-600 font-medium text-white' : 'border border-neutral-300 text-[var(--text-main)] dark:border-neutral-700'}`}
            >
              {TYPE_BADGE[t].icon} {t === 'CODING' ? 'Bài tập Code' : 'Bài trắc nghiệm'}
            </button>
          ))}
        </div>

        <BankPicker
          defaultBand={band}
          type={form.type}
          selectedSlug={form.exerciseSlug}
          selectedIds={form.questionIds}
          onPickExercise={(e) => set({ exerciseSlug: e.slug, exerciseTitle: e.title, ...(titleEdited ? {} : { title: e.title }), ...(e.points ? { maxPoints: Math.min(100, Math.max(1, e.points)) } : {}) })}
          onToggleQuestion={(id) => set({ questionIds: toggleId(form.questionIds, id) })}
        />

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-xs text-[var(--text-muted)] sm:col-span-3">
            Tiêu đề bài
            <input value={form.title} onChange={(e) => { setTitleEdited(true); set({ title: e.target.value }); }} maxLength={200} className={`${control} mt-1 w-full`} />
          </label>
          <label className="text-xs text-[var(--text-muted)] sm:col-span-2">
            Hạn nộp (giờ Việt Nam)
            <input type="datetime-local" value={form.dueLocal} onChange={(e) => set({ dueLocal: e.target.value })} className={`${control} mt-1 w-full`} />
          </label>
          <label className="text-xs text-[var(--text-muted)]">
            Tổng điểm
            <input type="number" min={1} max={100} value={form.maxPoints} onChange={(e) => set({ maxPoints: Number(e.target.value) })} className={`${control} mt-1 w-full`} />
          </label>
        </div>

        {error && <p className="text-sm text-rose-500">{error}</p>}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} disabled={saving} className="cursor-pointer rounded-md border border-neutral-300 px-4 py-2 text-sm dark:border-neutral-700">
            Hủy
          </button>
          <button onClick={() => void save()} disabled={saving} className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
            {saving && <Loader2 size={14} className="animate-spin" />} Lưu vào ngày
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddToDayDialog;
