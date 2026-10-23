import React, { useState } from 'react';
import { Plus, Save, X } from 'lucide-react';
import type { BankBand, Difficulty } from '../../types/classDays';
import { addOption, optionLabel, QUIZ_MAX_OPTIONS, QUIZ_MIN_OPTIONS, removeOption, validateQuizForm, type QuizForm } from '../../pages/quizBankModel';

const inputCls =
  'w-full px-3 py-2 text-sm rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] focus:outline-none focus:border-indigo-500 disabled:opacity-60';
const labelCls = 'block text-xs font-bold text-[var(--text-main)] mb-1';

/**
 * Form soạn một câu hỏi trắc nghiệm cho Ngân hàng đề (Khối 6–9 / 10–12). Đáp án đúng chọn bằng radio; nhãn A, B, C…
 * luôn theo vị trí. Câu lưu xong chỉ dùng cho bài giao của lớp và đề cuộc thi, không hiện ở trang luyện tập công khai.
 */
export const QuizQuestionForm: React.FC<{
  initial: QuizForm;
  submitLabel: string;
  saving?: boolean;
  bandLocked?: boolean;
  onSubmit: (form: QuizForm) => void;
  onCancel?: () => void;
}> = ({ initial, submitLabel, saving = false, bandLocked = false, onSubmit, onCancel }) => {
  const [form, setForm] = useState<QuizForm>(initial);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof QuizForm>(k: K, v: QuizForm[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const problem = validateQuizForm(form);
    setError(problem);
    if (!problem) onSubmit(form);
  };

  return (
    <form onSubmit={submit} className="space-y-4" aria-label="Soạn câu hỏi trắc nghiệm">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label className={labelCls} htmlFor="qz-band">Khối</label>
          <select id="qz-band" className={inputCls} value={form.band} disabled={bandLocked} onChange={(e) => set('band', e.target.value as BankBand)}>
            <option value="6-9">Khối 6–9</option>
            <option value="10-12">Khối 10–12</option>
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="qz-diff">Độ khó</label>
          <select id="qz-diff" className={inputCls} value={form.difficulty} onChange={(e) => set('difficulty', e.target.value as Difficulty)}>
            <option value="EASY">Dễ</option>
            <option value="MEDIUM">Trung bình</option>
            <option value="HARD">Khó</option>
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="qz-points">Điểm</label>
          <input id="qz-points" type="number" min={1} max={100} className={inputCls} value={form.points} onChange={(e) => set('points', Number(e.target.value))} />
        </div>
      </div>

      <div>
        <label className={labelCls} htmlFor="qz-content">Nội dung câu hỏi</label>
        <textarea id="qz-content" rows={3} className={inputCls} value={form.content} onChange={(e) => set('content', e.target.value)} />
      </div>
      <div>
        <label className={labelCls} htmlFor="qz-code">Đoạn code minh họa (không bắt buộc)</label>
        <textarea id="qz-code" rows={3} className={`${inputCls} font-mono`} value={form.codeSnippet} onChange={(e) => set('codeSnippet', e.target.value)} />
      </div>

      <fieldset>
        <legend className={labelCls}>Đáp án (chọn đúng một đáp án đúng)</legend>
        <div className="space-y-2">
          {form.options.map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="radio"
                name="qz-correct"
                id={`qz-correct-${i}`}
                checked={form.correctIndex === i}
                onChange={() => set('correctIndex', i)}
                aria-label={`Đáp án ${optionLabel(i)} là đáp án đúng`}
                className="h-4 w-4 cursor-pointer accent-emerald-600"
              />
              <span className="w-5 text-center text-sm font-bold text-[var(--text-main)]" aria-hidden>{optionLabel(i)}</span>
              <input
                aria-label={`Nội dung đáp án ${optionLabel(i)}`}
                className={inputCls}
                value={o.text}
                onChange={(e) => set('options', form.options.map((x, j) => (j === i ? { text: e.target.value } : x)))}
              />
              <button
                type="button"
                onClick={() => setForm((f) => removeOption(f, i))}
                disabled={form.options.length <= QUIZ_MIN_OPTIONS}
                aria-label={`Xóa đáp án ${optionLabel(i)}`}
                className="cursor-pointer rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setForm(addOption)}
          disabled={form.options.length >= QUIZ_MAX_OPTIONS}
          className="mt-2 flex cursor-pointer items-center gap-1 text-xs font-bold text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus size={14} /> Thêm đáp án
        </button>
      </fieldset>

      <div>
        <label className={labelCls} htmlFor="qz-explain">Giải thích đáp án (học sinh xem sau khi nộp)</label>
        <textarea id="qz-explain" rows={3} className={inputCls} value={form.explanation} onChange={(e) => set('explanation', e.target.value)} />
      </div>

      {error && (
        <p role="alert" className="text-sm text-rose-600 dark:text-rose-300">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50">
          <Save size={16} /> {saving ? 'Đang lưu...' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="cursor-pointer rounded-xl border border-[var(--border-color)] px-4 py-2 text-sm font-bold text-[var(--text-main)]">
            Hủy
          </button>
        )}
      </div>
    </form>
  );
};

export default QuizQuestionForm;
