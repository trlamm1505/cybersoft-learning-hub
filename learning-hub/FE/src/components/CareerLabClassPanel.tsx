import React, { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import assessmentApi from '../axios/assessmentApi';
import { hairline } from './adminStyles';
import type { CareerLabEntry, CareerRoster, CareerRosterRow, CareerStudentDetail, TesterRating } from '../types/assessment';

const th = 'px-3 py-2 text-left text-xs font-medium text-[var(--text-muted)] whitespace-nowrap';
const td = 'px-3 py-2 text-sm text-[var(--text-main)] align-middle';
const fmt = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '—');

const RATING_STYLE: Record<TesterRating, string> = {
  EXCELLENT: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  GOOD: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200',
  PASS: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  NEEDS_WORK: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200',
  NONE: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300',
};

export const CONTENT_LABEL = { 'data-sql': 'Câu SQL đã nộp', 'ai-prompt': 'Prompt đã nộp' } as const;
export const LAB_NAME = { 'data-sql': 'Data SQL Lab', 'ai-prompt': 'AI Prompt Lab' } as const;

const LabCard: React.FC<{ lab: CareerLabEntry; courseKey: 'data-sql' | 'ai-prompt' }> = ({ lab, courseKey }) => (
  <li className={`rounded-lg border p-3 ${hairline}`}>
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span className="text-sm font-medium text-[var(--text-main)]">
        {lab.title} <span className="text-xs font-normal text-[var(--text-muted)]">({lab.type === 'AI_LAB' ? 'Prompt' : lab.type === 'SQL' ? 'SQL' : 'Insight'})</span>
      </span>
      {lab.pendingReview ? (
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">Chờ chấm Insight</span>
      ) : (
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${lab.passed ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200'}`}>
          {lab.passed ? '✅ Đạt' : 'Chưa đạt'} · {lab.score}/{lab.maxScore}
        </span>
      )}
    </div>
    <p className="mt-0.5 text-xs text-[var(--text-muted)]">
      {lab.attempts} lần nộp · gần nhất {fmt(lab.lastAt)}
    </p>
    <div className="mt-2 text-xs font-medium text-[var(--text-muted)]">{CONTENT_LABEL[courseKey]}</div>
    <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-md bg-neutral-50 p-2 font-mono text-xs text-[var(--text-main)] dark:bg-neutral-900">{lab.content || '—'}</pre>
    {lab.feedback && <p className="mt-2 rounded-md bg-neutral-50 p-2 text-xs text-[var(--text-main)] dark:bg-neutral-900">💬 {lab.feedback}</p>}
    {lab.history.length > 0 && (
      <details className="mt-2 text-xs">
        <summary className="cursor-pointer text-indigo-600">Các lần nộp gần nhất ({lab.history.length})</summary>
        <ul className="mt-1 space-y-1.5">
          {lab.history.map((h, i) => (
            <li key={i} className={`rounded border p-2 ${hairline}`}>
              <div className="text-[var(--text-muted)]">
                {fmt(h.at)} · {h.score ?? '—'}/{h.maxScore ?? '—'} · {h.status}
              </div>
              <pre className="mt-1 max-h-24 overflow-auto whitespace-pre-wrap break-words font-mono text-[var(--text-main)]">{h.content}</pre>
            </li>
          ))}
        </ul>
      </details>
    )}
  </li>
);

const Drawer: React.FC<{ classId: string; courseKey: 'data-sql' | 'ai-prompt'; student: CareerRosterRow; onClose: () => void }> = ({ classId, courseKey, student, onClose }) => {
  const [detail, setDetail] = useState<CareerStudentDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    assessmentApi
      .getCareerStudent(classId, student.studentId)
      .then((d) => !cancelled && setDetail(d))
      .catch(() => !cancelled && setError('Không tải được chi tiết bài làm.'));
    return () => {
      cancelled = true;
    };
  }, [classId, student.studentId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label={`Chi tiết bài làm của ${student.fullName}`}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col overflow-y-auto border-l border-neutral-200 bg-white p-5 shadow-xl dark:border-neutral-800 dark:bg-neutral-950">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-main)]">{student.fullName}</h2>
            <p className="text-xs text-[var(--text-muted)]">{student.email}</p>
          </div>
          <button onClick={onClose} aria-label="Đóng" className="cursor-pointer text-[var(--text-muted)]">
            <X size={18} />
          </button>
        </div>
        {error && <p className="text-sm text-rose-500">{error}</p>}
        {!detail && !error && (
          <div className="flex items-center py-6 text-sm text-[var(--text-muted)]">
            <Loader2 size={14} className="mr-2 animate-spin" /> Đang tải...
          </div>
        )}
        {detail && (
          <div className="space-y-4">
            <div className={`flex flex-wrap items-center gap-x-6 gap-y-1 rounded-lg border p-3 text-sm ${hairline}`}>
              <span>
                Lab đạt: <strong className="tabular-nums">{detail.summary.labsCompleted}/{detail.summary.labsTotal}</strong>
              </span>
              <span>
                Điểm TB: <strong className="tabular-nums">{detail.summary.avgScore ?? '—'}</strong>
              </span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${RATING_STYLE[detail.summary.rating]}`}>{detail.summary.ratingLabel}</span>
            </div>
            {detail.labs.length === 0 ? <p className="text-sm text-[var(--text-muted)]">Học viên chưa làm Lab nào.</p> : (
              <ul className="space-y-3">
                {detail.labs.map((l) => (
                  <LabCard key={l.slug} lab={l} courseKey={courseKey} />
                ))}
              </ul>
            )}
          </div>
        )}
      </aside>
    </div>
  );
};

/**
 * Lớp Data SQL Lab / AI Prompt Lab: học viên làm bài tự động trên sandbox, giảng viên CHỈ theo dõi: không giao bài, không đo out-tab,
 * không có form chấm thủ công. Danh sách học viên, số Lab đạt, điểm trung bình, và xem câu SQL / prompt đã nộp.
 */
export const CareerLabClassPanel: React.FC<{ classId: string }> = ({ classId }) => {
  const [roster, setRoster] = useState<CareerRoster | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drawerFor, setDrawerFor] = useState<CareerRosterRow | null>(null);

  useEffect(() => {
    let cancelled = false;
    setRoster(null);
    setError(null);
    assessmentApi
      .getCareerRoster(classId)
      .then((r) => !cancelled && setRoster(r))
      .catch(() => !cancelled && setError('Không tải được danh sách học viên.'));
    return () => {
      cancelled = true;
    };
  }, [classId]);

  if (error) return <p className="text-sm text-rose-500">{error}</p>;
  if (!roster) {
    return (
      <div className="flex items-center py-6 text-sm text-[var(--text-muted)]">
        <Loader2 size={14} className="mr-2 animate-spin" /> Đang tải...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--text-muted)]">
        {LAB_NAME[roster.courseKey]}: học viên làm và được chấm tự động trên sandbox. Giảng viên theo dõi tiến độ, điểm số và xem chi tiết bài đã nộp.
      </p>
      <div className={`overflow-x-auto rounded-lg border ${hairline}`}>
        <table className="min-w-full">
          <thead>
            <tr>
              {['Hạng', 'Học viên', 'Lab đạt', 'Đã làm', 'Điểm TB', 'Xếp loại', ''].map((h) => (
                <th key={h} className={th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roster.students.length === 0 ? (
              <tr>
                <td colSpan={7} className={`${td} text-[var(--text-muted)]`}>
                  Khóa chưa có học viên.
                </td>
              </tr>
            ) : (
              roster.students.map((s) => (
                <tr key={s.studentId} className={`border-t ${hairline}`}>
                  <td className={`${td} tabular-nums`}>{s.rank ?? '—'}</td>
                  <td className={td}>
                    <div className="font-medium">{s.fullName}</div>
                    <div className="text-xs text-[var(--text-muted)]">{s.email}</div>
                  </td>
                  <td className={`${td} tabular-nums`}>
                    {s.labsCompleted}/{s.labsTotal} Lab
                  </td>
                  <td className={`${td} tabular-nums`}>{s.labsAttempted}</td>
                  <td className={`${td} font-semibold tabular-nums`}>{s.avgScore ?? '—'}</td>
                  <td className={td}>
                    <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${RATING_STYLE[s.rating]}`}>{s.ratingLabel}</span>
                  </td>
                  <td className={`${td} text-right`}>
                    <button onClick={() => setDrawerFor(s)} className="cursor-pointer rounded-md border border-indigo-300 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-950">
                      {roster.courseKey === 'data-sql' ? 'Xem câu SQL đã nộp' : 'Xem prompt đã nộp'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {drawerFor && <Drawer classId={classId} courseKey={roster.courseKey} student={drawerFor} onClose={() => setDrawerFor(null)} />}
    </div>
  );
};

export default CareerLabClassPanel;
