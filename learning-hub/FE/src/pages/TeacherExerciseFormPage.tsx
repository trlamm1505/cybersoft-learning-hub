import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ImagePlus, Plus, Save, Trash2, X } from 'lucide-react';
import exerciseApi from '../axios/exerciseApi';
import type { ExerciseWritePayload } from '../axios/exerciseApi';
import { useToast } from '../components/Toast';
import type { ExerciseListItem, ExerciseTestCase } from '../types/exercise';
import {
  LAB_TYPE_LABEL,
  TARGET_GROUP_OPTIONS,
  labTypeAfterGroupChange,
  labTypesFor,
  type LabType,
  type TargetGroup,
} from '../common/exerciseMatrix';

/** Dataset mẫu có thể liên kết với bài DATA_SQL. */
const DATASET_OPTIONS = [{ value: 'sales_v1', label: 'sales_v1 — doanh thu bán lẻ (mẫu)' }];

const MAX_IMAGE_BYTES = 400 * 1024;

interface FormState {
  id: string | null;
  title: string;
  slug: string;
  description: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  points: number;
  targetGroup: TargetGroup | '';
  labType: LabType | '';
  storyContext: string;
  illustrationUrl: string;
  timeLimitMs: number;
  memoryLimitMb: number;
  datasetId: string;
  starterCode: string;
  testCases: ExerciseTestCase[];
  hiddenTestCases: ExerciseTestCase[];
  officialSolution: string;
}

const EMPTY: FormState = {
  id: null,
  title: '',
  slug: '',
  description: '',
  difficulty: 'EASY',
  points: 10,
  targetGroup: '',
  labType: '',
  storyContext: '',
  illustrationUrl: '',
  timeLimitMs: 2000,
  memoryLimitMb: 128,
  datasetId: '',
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

/** Trang soạn/sửa bài thực hành theo ma trận nhóm x lab — chỉ TEACHER/ADMIN (route đã chặn). */
export const TeacherExerciseFormPage: React.FC<{ isAdmin?: boolean }> = ({ isAdmin = false }) => {
  const { showToast } = useToast();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [items, setItems] = useState<ExerciseListItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [backfilling, setBackfilling] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const reload = useCallback(() => {
    exerciseApi
      .listExercises()
      .then(setItems)
      .catch(() => showToast('Không tải được danh sách bài.', 'error'));
  }, [showToast]);
  useEffect(reload, [reload]);

  const allowedLabs = useMemo(() => labTypesFor(form.targetGroup), [form.targetGroup]);
  const labLocked = allowedLabs.length === 1;
  const showStory = form.targetGroup === 'K3_5';
  const showJudgeLimits = form.targetGroup === 'K10_12';
  const showDataset = form.labType === 'DATA_SQL';
  const showCode = form.targetGroup === 'K6_9' || form.targetGroup === 'K10_12';

  const onGroupChange = (group: TargetGroup | '') =>
    setForm((f) => ({ ...f, targetGroup: group, labType: labTypeAfterGroupChange(group, f.labType) }));

  const onImage = (file: File | undefined) => {
    if (!file) return;
    if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) return showToast('Chỉ nhận ảnh png, jpeg, webp hoặc gif.', 'error');
    if (file.size > MAX_IMAGE_BYTES) return showToast('Ảnh quá lớn (tối đa 400KB).', 'error');
    const reader = new FileReader();
    reader.onload = () => set('illustrationUrl', String(reader.result));
    reader.readAsDataURL(file);
  };

  const edit = async (item: ExerciseListItem) => {
    try {
      const full = await exerciseApi.getExerciseFull(item.slug);
      setForm({
        ...EMPTY,
        id: full._id,
        title: full.title,
        slug: full.slug,
        description: full.description,
        difficulty: full.difficulty,
        points: full.points,
        targetGroup: full.targetGroup ?? '',
        labType: full.labType ?? '',
        storyContext: full.storyContext ?? '',
        illustrationUrl: full.illustrationUrl ?? '',
        timeLimitMs: full.timeLimitMs ?? 2000,
        memoryLimitMb: full.memoryLimitMb ?? 128,
        datasetId: full.datasetId ?? '',
        starterCode: full.starterCode ?? '',
        testCases: full.testCases?.filter((t) => !t.isHidden) ?? [],
        hiddenTestCases: [...(full.hiddenTestCases ?? []), ...(full.testCases?.filter((t) => t.isHidden) ?? [])],
        officialSolution: full.officialSolution ?? full.solutionCode ?? '',
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      showToast(errMsg(e), 'error');
    }
  };

  const buildPayload = (): ExerciseWritePayload => {
    const base: ExerciseWritePayload = {
      title: form.title.trim(),
      description: form.description.trim(),
      difficulty: form.difficulty,
      points: Number(form.points) || 0,
      targetGroup: form.targetGroup,
      labType: form.labType,
    };
    if (form.slug.trim()) base.slug = form.slug.trim();
    if (showStory) {
      base.storyContext = form.storyContext;
      base.illustrationUrl = form.illustrationUrl;
    }
    if (showJudgeLimits) {
      base.timeLimitMs = Number(form.timeLimitMs);
      base.memoryLimitMb = Number(form.memoryLimitMb);
    }
    if (showDataset) base.datasetId = form.datasetId;
    if (showCode) {
      base.starterCode = form.starterCode;
      base.testCases = form.testCases.map((t) => ({ ...t, isHidden: false }));
      base.hiddenTestCases = form.hiddenTestCases.map((t) => ({ ...t, isHidden: true }));
      base.officialSolution = form.officialSolution;
    }
    return base;
  };

  const save = async () => {
    if (!form.title.trim() || !form.description.trim()) return showToast('Cần nhập tiêu đề và mô tả.', 'error');
    if (!form.targetGroup || !form.labType) return showToast('Hãy chọn nhóm tuổi và loại phòng thực hành.', 'error');
    setSaving(true);
    try {
      const payload = buildPayload();
      if (form.id) await exerciseApi.updateExercise(form.id, payload);
      else await exerciseApi.createExercise(payload);
      const where = TARGET_GROUP_OPTIONS.find((o) => o.value === form.targetGroup)?.label ?? '';
      showToast(
        form.id ? 'Đã cập nhật bài.' : `Đã tạo bài mới. Bài hiện ngay trong Code Playground, khối ${where}.`,
        'success',
      );
      setForm(EMPTY);
      reload();
    } catch (e) {
      showToast(errMsg(e), 'error');
    } finally {
      setSaving(false);
    }
  };

  // ADMIN: gán nhóm 6-9 / PYTHON_CODE cho bài Python cũ chưa phân lớp (xem trước rồi mới ghi).
  const backfillLegacy = async () => {
    setBackfilling(true);
    try {
      const preview = await exerciseApi.assignLegacyGrade(true);
      if (preview.matched === 0) {
        showToast('Không còn bài cũ nào cần gán nhóm.', 'info');
        return;
      }
      const ok = window.confirm(
        `Gán nhóm Lớp 6–9 (PYTHON_CODE) cho ${preview.matched} bài cũ?\n\n${preview.slugs.join(', ')}`,
      );
      if (!ok) return;
      const res = await exerciseApi.assignLegacyGrade(false);
      showToast(`Đã gán nhóm cho ${res.matched} bài cũ.`, 'success');
      reload();
    } catch (e) {
      showToast(errMsg(e), 'error');
    } finally {
      setBackfilling(false);
    }
  };

  const remove = async (item: ExerciseListItem) => {
    if (!window.confirm(`Xóa bài "${item.title}"?`)) return;
    try {
      await exerciseApi.deleteExercise(item._id);
      showToast('Đã xóa bài.', 'success');
      if (form.id === item._id) setForm(EMPTY);
      reload();
    } catch (e) {
      showToast(errMsg(e), 'error');
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
        <h1 className="text-lg font-black tracking-tight text-[var(--text-main)]">Soạn bài thực hành theo nhóm tuổi</h1>
        <p className="text-xs text-[var(--text-muted)]">
          Chọn nhóm tuổi trước; loại phòng thực hành sẽ được lọc theo nhóm. Máy chủ vẫn kiểm tra lại ma trận khi lưu.
        </p>
      </div>

      <div className="space-y-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 shadow-xs">
        <h2 className="text-sm font-extrabold text-[var(--text-main)]">{form.id ? `Đang sửa: ${form.slug}` : 'Bài mới'}</h2>

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
            <label className={labelCls} htmlFor="ex-group">Nhóm tuổi</label>
            <select id="ex-group" className={inputCls} value={form.targetGroup} onChange={(e) => onGroupChange(e.target.value as TargetGroup | '')}>
              <option value="">— Chọn nhóm tuổi —</option>
              {TARGET_GROUP_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="ex-lab">Loại phòng thực hành</label>
            <select
              id="ex-lab"
              className={inputCls}
              value={form.labType}
              disabled={!form.targetGroup || labLocked}
              onChange={(e) => set('labType', e.target.value as LabType)}
            >
              {!labLocked && <option value="">— Chọn loại lab —</option>}
              {allowedLabs.map((l) => (
                <option key={l} value={l}>{LAB_TYPE_LABEL[l]}</option>
              ))}
            </select>
            {labLocked && <p className="mt-1 text-[11px] text-[var(--text-muted)]">Nhóm này chỉ có một loại lab nên đã được chọn sẵn.</p>}
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

        {showStory && (
          <div className="space-y-3 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/60 p-4 dark:bg-amber-950/20">
            <div>
              <label className={labelCls} htmlFor="ex-story">Câu chuyện dẫn dắt (storyContext)</label>
              <textarea id="ex-story" rows={4} className={inputCls} value={form.storyContext} onChange={(e) => set('storyContext', e.target.value)} />
            </div>
            <div>
              <span className={labelCls}>Ảnh minh họa (png/jpeg/webp/gif, tối đa 400KB)</span>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] px-3 py-2 text-xs font-bold text-[var(--text-main)]">
                <ImagePlus size={16} /> Chọn ảnh
                <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={(e) => onImage(e.target.files?.[0])} />
              </label>
              {form.illustrationUrl && (
                <div className="mt-2 flex items-start gap-3">
                  <img src={form.illustrationUrl} alt="Xem trước ảnh minh họa" className="max-h-32 rounded-xl border border-[var(--border-color)]" />
                  <button type="button" onClick={() => set('illustrationUrl', '')} className="cursor-pointer text-xs font-bold text-red-600">Bỏ ảnh</button>
                </div>
              )}
            </div>
          </div>
        )}

        {showJudgeLimits && (
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

        {showDataset && (
          <div>
            <label className={labelCls} htmlFor="ex-dataset">Dataset mẫu liên kết</label>
            <select id="ex-dataset" className={inputCls} value={form.datasetId} onChange={(e) => set('datasetId', e.target.value)}>
              <option value="">— Chọn dataset —</option>
              {DATASET_OPTIONS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
        )}

        {showCode && (
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
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            <Save size={16} /> {saving ? 'Đang lưu...' : form.id ? 'Cập nhật' : 'Tạo bài'}
          </button>
          {form.id && (
            <button type="button" onClick={() => setForm(EMPTY)} className="cursor-pointer rounded-xl border border-[var(--border-color)] px-4 py-2 text-sm font-bold text-[var(--text-main)]">
              Hủy sửa
            </button>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 shadow-xs">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-extrabold text-[var(--text-main)]">Bài trong ngân hàng ({items.length})</h2>
          {isAdmin && (
            <button
              type="button"
              onClick={backfillLegacy}
              disabled={backfilling}
              className="cursor-pointer rounded-xl border border-indigo-500 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 disabled:opacity-50"
            >
              {backfilling ? 'Đang xử lý...' : 'Gán nhóm 6–9 cho bài cũ'}
            </button>
          )}
        </div>
        <ul className="divide-y divide-[var(--border-color)]">
          {items.map((it) => (
            <li key={it._id} className="flex items-center justify-between gap-3 py-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-bold text-[var(--text-main)]">{it.title}</div>
                <div className="text-[11px] text-[var(--text-muted)]">
                  {it.slug} · {it.targetGroup ?? 'chưa phân nhóm'} · {it.labType ?? '—'}
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <button type="button" onClick={() => edit(it)} className="cursor-pointer text-xs font-bold text-indigo-600">Sửa</button>
                <button type="button" aria-label={`Xóa ${it.title}`} onClick={() => remove(it)} className="cursor-pointer text-red-600">
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TeacherExerciseFormPage;
