import React, { useState } from 'react';
import { Code2, ListChecks, Plus, Save, X } from 'lucide-react';
import exerciseApi from '../axios/exerciseApi';
import type { ExerciseWritePayload } from '../axios/exerciseApi';
import questionBankApi from '../axios/questionBankApi';
import { useToast } from '../components/Toast';
import { QuizQuestionForm } from '../components/teacher/QuizQuestionForm';
import type { ExerciseTestCase } from '../types/exercise';
import { TEACHER_BANDS, type TeacherBand } from '../common/exerciseMatrix';
import { emptyQuizForm, quizPayload, type QuizForm } from './quizBankModel';

interface FormState {
  title: string;
  slug: string;
  description: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  points: number;
  band: TeacherBand;
  timeLimitMs: number;
  memoryLimitMb: number;
  starterCode: string;
  testCases: ExerciseTestCase[];
  hiddenTestCases: ExerciseTestCase[];
  officialSolution: string;
}

const EMPTY: FormState = {
  title: '',
  slug: '',
  description: '',
  difficulty: 'EASY',
  points: 10,
  band: '6-9',
  timeLimitMs: 2000,
  memoryLimitMb: 128,
  starterCode: '',
  testCases: [{ input: '', expectedOutput: '', isHidden: false }],
  hiddenTestCases: [],
  officialSolution: '',
};

const errMsg = (e: unknown): string => {
  const m = (e as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
  return (Array.isArray(m) ? m.join('; ') : m) || 'Có lỗi xảy ra, vui lòng thử lại.';
};

const inputCls =
  'w-full px-3 py-2 text-sm rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] focus:outline-none focus:border-indigo-500 disabled:opacity-60';
const labelCls = 'block text-xs font-bold text-[var(--text-main)] mb-1';

type Kind = 'code' | 'quiz';
const KINDS: Array<{ value: Kind; label: string; Icon: typeof Code2 }> = [
  { value: 'code', label: 'Bài tập Code', Icon: Code2 },
  { value: 'quiz', label: 'Câu hỏi Trắc nghiệm', Icon: ListChecks },
];

/**
 * Soạn bài thủ công cho Ngân hàng đề (Day 30): hai loại đề, chỉ Khối 6–9 và Khối 10–12. Mọi đề lưu ở đây chỉ dùng để
 * giao bài theo Ngày cho lớp và đưa vào Cuộc thi — không xuất hiện ở Code Playground hay trang trắc nghiệm công khai.
 */
export const TeacherExerciseFormPage: React.FC = () => {
  const { showToast } = useToast();
  const [kind, setKind] = useState<Kind>('code');
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [quizKey, setQuizKey] = useState(0);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));
  const bandInfo = TEACHER_BANDS.find((b) => b.band === form.band)!;

  /** Dòng test để trống cả input lẫn output (bấm "Thêm" rồi bỏ đó) bị bỏ khi lưu: nếu giữ, mọi lời giải đúng đều lỗi EOFError trên dòng đó. */
  const filled = (rows: ExerciseTestCase[]) => rows.filter((t) => t.input.trim() !== '' || (t.expectedOutput ?? '').trim() !== '');

  const buildPayload = (): ExerciseWritePayload => ({
    title: form.title.trim(),
    description: form.description.trim(),
    difficulty: form.difficulty,
    points: Number(form.points) || 0,
    targetGroup: bandInfo.targetGroup,
    labType: bandInfo.labType,
    ...(form.slug.trim() ? { slug: form.slug.trim() } : {}),
    ...(form.band === '10-12' ? { timeLimitMs: Number(form.timeLimitMs), memoryLimitMb: Number(form.memoryLimitMb) } : {}),
    starterCode: form.starterCode,
    testCases: filled(form.testCases).map((t) => ({ ...t, isHidden: false })),
    hiddenTestCases: filled(form.hiddenTestCases).map((t) => ({ ...t, isHidden: true })),
    officialSolution: form.officialSolution,
  });

  const saveCode = async () => {
    if (!form.title.trim() || !form.description.trim()) return showToast('Cần nhập tiêu đề và mô tả.', 'error');
    if (!form.testCases.some((t) => t.input.trim() || (t.expectedOutput ?? '').trim())) return showToast('Cần ít nhất một test hiển thị cho học viên.', 'error');
    setSaving(true);
    try {
      await exerciseApi.createExercise(buildPayload());
      showToast(`Đã lưu vào Ngân hàng đề (${bandInfo.label}). Bài dùng để giao cho lớp và đưa vào cuộc thi.`, 'success');
      setForm({ ...EMPTY, band: form.band });
    } catch (e) {
      showToast(errMsg(e), 'error');
    } finally {
      setSaving(false);
    }
  };

  const saveQuiz = async (f: QuizForm) => {
    setSaving(true);
    try {
      await questionBankApi.createQuiz(quizPayload(f));
      showToast(`Đã lưu câu trắc nghiệm vào Ngân hàng đề (Khối ${f.band === '6-9' ? '6–9' : '10–12'}).`, 'success');
      setQuizKey((k) => k + 1);
    } catch (e) {
      showToast(errMsg(e), 'error');
    } finally {
      setSaving(false);
    }
  };

  const testRows = (key: 'testCases' | 'hiddenTestCases', title: string) => (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className={labelCls}>{title}</span>
        <button
          type="button"
          onClick={() => set(key, [...form[key], { input: '', expectedOutput: '', isHidden: key === 'hiddenTestCases' }])}
          className="flex cursor-pointer items-center gap-1 text-xs font-bold text-indigo-600"
        >
          <Plus size={14} /> Thêm
        </button>
      </div>
      {form[key].map((t, i) => (
        <div key={i} className="mb-2 grid grid-cols-[1fr_1fr_auto] gap-2">
          <textarea
            aria-label={`${title} ${i + 1} input`}
            rows={2}
            placeholder="Input"
            value={t.input}
            onChange={(e) => set(key, form[key].map((x, j) => (j === i ? { ...x, input: e.target.value } : x)))}
            className={`${inputCls} font-mono`}
          />
          <textarea
            aria-label={`${title} ${i + 1} expected`}
            rows={2}
            placeholder="Output mong đợi"
            value={t.expectedOutput ?? ''}
            onChange={(e) => set(key, form[key].map((x, j) => (j === i ? { ...x, expectedOutput: e.target.value } : x)))}
            className={`${inputCls} font-mono`}
          />
          <button
            type="button"
            aria-label="Xóa dòng"
            onClick={() => set(key, form[key].filter((_, j) => j !== i))}
            className="cursor-pointer self-start rounded-lg p-2 text-red-600 hover:bg-red-50"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 shadow-xs">
        <h1 className="text-lg font-black tracking-tight text-[var(--text-main)]">Soạn đề cho Ngân hàng đề</h1>
        <p className="text-xs text-[var(--text-muted)]">
          Chỉ Khối 6–9 và Khối 10–12. Đề lưu ở đây dùng để giao bài theo Ngày cho lớp và đưa vào Cuộc thi, không hiện ở Code Playground.
        </p>
        <div role="tablist" aria-label="Loại đề" className="mt-3 inline-flex rounded-xl border border-[var(--border-color)] p-1">
          {KINDS.map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={kind === value}
              onClick={() => setKind(value)}
              className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold ${kind === value ? 'bg-indigo-600 text-white' : 'text-[var(--text-main)]'}`}
            >
              <Icon size={15} aria-hidden /> {label}
            </button>
          ))}
        </div>
      </div>

      {kind === 'quiz' ? (
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 shadow-xs">
          <QuizQuestionForm key={quizKey} initial={emptyQuizForm()} submitLabel="Lưu câu hỏi" saving={saving} onSubmit={saveQuiz} />
        </div>
      ) : (
        <div className="space-y-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 shadow-xs">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className={labelCls} htmlFor="ex-title">Tiêu đề</label>
              <input id="ex-title" className={inputCls} value={form.title} onChange={(e) => set('title', e.target.value)} />
            </div>
            <div>
              <label className={labelCls} htmlFor="ex-slug">Slug (để trống sẽ tự tạo)</label>
              <input id="ex-slug" className={inputCls} value={form.slug} onChange={(e) => set('slug', e.target.value)} />
            </div>
            <div>
              <label className={labelCls} htmlFor="ex-band">Khối</label>
              <select id="ex-band" className={inputCls} value={form.band} onChange={(e) => set('band', e.target.value as TeacherBand)}>
                {TEACHER_BANDS.map((b) => (
                  <option key={b.band} value={b.band}>{b.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="ex-diff">Độ khó</label>
              <select id="ex-diff" className={inputCls} value={form.difficulty} onChange={(e) => set('difficulty', e.target.value as FormState['difficulty'])}>
                <option value="EASY">EASY</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HARD">HARD</option>
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="ex-points">Điểm</label>
              <input id="ex-points" type="number" min={0} className={inputCls} value={form.points} onChange={(e) => set('points', Number(e.target.value))} />
            </div>
          </div>

          <div>
            <label className={labelCls} htmlFor="ex-desc">Mô tả đề bài</label>
            <textarea id="ex-desc" rows={4} className={inputCls} value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>

          {form.band === '10-12' && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className={labelCls} htmlFor="ex-time">Giới hạn thời gian timeLimitMs (ms)</label>
                <input id="ex-time" type="number" min={100} className={inputCls} value={form.timeLimitMs} onChange={(e) => set('timeLimitMs', Number(e.target.value))} />
              </div>
              <div>
                <label className={labelCls} htmlFor="ex-mem">Giới hạn bộ nhớ memoryLimitMb (MB)</label>
                <input id="ex-mem" type="number" min={16} className={inputCls} value={form.memoryLimitMb} onChange={(e) => set('memoryLimitMb', Number(e.target.value))} />
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className={labelCls} htmlFor="ex-starter">Code khởi tạo (starterCode)</label>
              <textarea id="ex-starter" rows={4} className={`${inputCls} font-mono`} value={form.starterCode} onChange={(e) => set('starterCode', e.target.value)} />
            </div>
            {testRows('testCases', 'Test hiển thị cho học viên')}
            {testRows('hiddenTestCases', 'Test ẩn (chỉ dùng để chấm, học viên không thấy)')}
            <div>
              <label className={labelCls} htmlFor="ex-solution">Lời giải chính thức (chỉ Giảng viên/Admin thấy)</label>
              <textarea id="ex-solution" rows={4} className={`${inputCls} font-mono`} value={form.officialSolution} onChange={(e) => set('officialSolution', e.target.value)} />
            </div>
          </div>

          <button
            type="button"
            onClick={saveCode}
            disabled={saving}
            className="flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            <Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu vào Ngân hàng đề'}
          </button>
        </div>
      )}
    </div>
  );
};

export default TeacherExerciseFormPage;
