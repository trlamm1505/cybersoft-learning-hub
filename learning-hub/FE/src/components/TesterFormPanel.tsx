import React, { useState } from 'react';
import { CheckCircle2, Loader2, Plus, Trash2, XCircle } from 'lucide-react';
import testerLabApi from '../axios/testerLabApi';
import type { AutoCheckResult } from '../types/testerLab';

export interface FormTestCase {
  code: string;
  description: string;
  input: string;
  expected: string;
}
export interface FormBugReport {
  title: string;
  steps: string;
  expected: string;
  actual: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export const SUBMITTED_STATUS_LABEL = 'Đã nộp bài - Chờ giảng viên chấm';
export const emptyCase = (n: number): FormTestCase => ({ code: `TC${String(n).padStart(2, '0')}`, description: '', input: '', expected: '' });
export const emptyBug = (): FormBugReport => ({ title: '', steps: '', expected: '', actual: '', severity: 'MEDIUM' });

/** Dòng chỉ có mã tự điền (chưa nhập mô tả/input/expected) bị bỏ qua khi nộp. */
export const caseHasContent = (c: FormTestCase): boolean => [c.description, c.input, c.expected].some((v) => v.trim() !== '');
export const bugHasContent = (b: FormBugReport): boolean => [b.title, b.steps, b.expected, b.actual].some((v) => v.trim() !== '');

const fieldCls = 'w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)] px-2 py-1.5 text-xs text-[var(--text-main)]';

/** Kết quả nhận xét sơ bộ (luật/từ khóa) hiện ngay sau khi nộp. */
export const PreliminaryFeedback: React.FC<{ results: AutoCheckResult[] }> = ({ results }) => (
  <ul className="space-y-1" aria-label="Nhận xét sơ bộ">
    {results.map((r) => (
      <li key={r.check} className="flex items-start gap-1.5 text-xs">
        {r.passed ? <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-500" /> : <XCircle size={14} className="mt-0.5 shrink-0 text-amber-500" />}
        <span className="text-[var(--text-main)]">{r.message}</span>
      </li>
    ))}
  </ul>
);

/** Nộp Tester Lab bằng biểu mẫu: danh sách test case (mã, mô tả, input, expected) và bug report. */
export const TesterFormPanel: React.FC<{ labCode: string; onSubmitted?: () => void }> = ({ labCode, onSubmitted }) => {
  const [cases, setCases] = useState<FormTestCase[]>([emptyCase(1), emptyCase(2), emptyCase(3)]);
  const [bugs, setBugs] = useState<FormBugReport[]>([emptyBug()]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<AutoCheckResult[] | null>(null);

  const setCase = (i: number, patch: Partial<FormTestCase>) => setCases((cs) => cs.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  const setBug = (i: number, patch: Partial<FormBugReport>) => setBugs((bs) => bs.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await testerLabApi.submitForm(labCode, {
        testCases: cases.filter(caseHasContent),
        bugReports: bugs.filter(bugHasContent),
      });
      setFeedback(res.autoCheckResults);
      onSubmitted?.();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Nộp bài thất bại. Vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4" data-testid="tester-form">
      <section aria-label="Danh sách test case" className="space-y-2">
        <h3 className="text-sm font-semibold text-[var(--text-main)]">Danh sách Test Case</h3>
        {cases.map((c, i) => (
          <div key={i} className="grid grid-cols-12 gap-1.5 rounded-lg border border-[var(--border-color)] p-2">
            <input aria-label={`Mã test ${i + 1}`} className={`${fieldCls} col-span-3`} placeholder="Mã test" value={c.code} onChange={(e) => setCase(i, { code: e.target.value })} />
            <input aria-label={`Mô tả test ${i + 1}`} className={`${fieldCls} col-span-9`} placeholder="Mô tả" value={c.description} onChange={(e) => setCase(i, { description: e.target.value })} />
            <input aria-label={`Input test ${i + 1}`} className={`${fieldCls} col-span-6`} placeholder="Input" value={c.input} onChange={(e) => setCase(i, { input: e.target.value })} />
            <input aria-label={`Expected test ${i + 1}`} className={`${fieldCls} col-span-5`} placeholder="Expected output" value={c.expected} onChange={(e) => setCase(i, { expected: e.target.value })} />
            <button type="button" aria-label={`Xóa test ${i + 1}`} onClick={() => setCases((cs) => cs.filter((_, idx) => idx !== i))} className="col-span-1 cursor-pointer rounded-lg border-none bg-transparent text-rose-500">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        <button type="button" onClick={() => setCases((cs) => [...cs, emptyCase(cs.length + 1)])} className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] px-3 py-1 text-xs font-semibold text-[var(--text-main)]">
          <Plus size={13} /> Thêm test case
        </button>
      </section>

      <section aria-label="Bug report" className="space-y-2">
        <h3 className="text-sm font-semibold text-[var(--text-main)]">Bug Report</h3>
        {bugs.map((b, i) => (
          <div key={i} className="space-y-1.5 rounded-lg border border-[var(--border-color)] p-2">
            <div className="flex gap-1.5">
              <input aria-label={`Tiêu đề bug ${i + 1}`} className={`${fieldCls} flex-1`} placeholder="Tiêu đề lỗi" value={b.title} onChange={(e) => setBug(i, { title: e.target.value })} />
              <select aria-label={`Mức độ bug ${i + 1}`} className={`${fieldCls} w-28`} value={b.severity} onChange={(e) => setBug(i, { severity: e.target.value as FormBugReport['severity'] })}>
                <option value="LOW">Thấp</option>
                <option value="MEDIUM">Trung bình</option>
                <option value="HIGH">Cao</option>
                <option value="CRITICAL">Nghiêm trọng</option>
              </select>
              <button type="button" aria-label={`Xóa bug ${i + 1}`} onClick={() => setBugs((bs) => bs.filter((_, idx) => idx !== i))} className="cursor-pointer border-none bg-transparent text-rose-500">
                <Trash2 size={14} />
              </button>
            </div>
            <textarea aria-label={`Các bước tái hiện ${i + 1}`} rows={3} className={fieldCls} placeholder={'Các bước tái hiện (mỗi bước một dòng)\n1. ...\n2. ...'} value={b.steps} onChange={(e) => setBug(i, { steps: e.target.value })} />
            <div className="grid grid-cols-2 gap-1.5">
              <input aria-label={`Kết quả mong đợi ${i + 1}`} className={fieldCls} placeholder="Kết quả mong đợi" value={b.expected} onChange={(e) => setBug(i, { expected: e.target.value })} />
              <input aria-label={`Kết quả thực tế ${i + 1}`} className={fieldCls} placeholder="Kết quả thực tế" value={b.actual} onChange={(e) => setBug(i, { actual: e.target.value })} />
            </div>
          </div>
        ))}
        <button type="button" onClick={() => setBugs((bs) => [...bs, emptyBug()])} className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] px-3 py-1 text-xs font-semibold text-[var(--text-main)]">
          <Plus size={13} /> Thêm bug report
        </button>
      </section>

      <button type="button" onClick={submit} disabled={busy} className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-none bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50">
        {busy && <Loader2 size={14} className="animate-spin" />} Nộp bài
      </button>
      {error && <p className="text-sm text-rose-500">{error}</p>}
      {feedback && (
        <div className="space-y-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
          <p className="text-sm font-semibold text-emerald-600">{SUBMITTED_STATUS_LABEL}</p>
          <PreliminaryFeedback results={feedback} />
        </div>
      )}
    </div>
  );
};

export default TesterFormPanel;
