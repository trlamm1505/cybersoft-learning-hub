import React, { useCallback, useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import testerLabApi from '../axios/testerLabApi';
import type { ReviewableSubmission, TesterLab } from '../types/testerLab';

interface Props {
  lab: TesterLab;
  isStudent: boolean;
}

/** Danh sách bài của người khác + modal chấm rubric (giảng viên / peer). */
export const TesterLabReviewPanel: React.FC<Props> = ({ lab, isStudent }) => {
  const [items, setItems] = useState<ReviewableSubmission[]>([]);
  const [target, setTarget] = useState<ReviewableSubmission | null>(null);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);

  const load = useCallback(async () => {
    setItems(await testerLabApi.getReviewable(lab.labCode));
  }, [lab.labCode]);

  useEffect(() => {
    load().catch(() => setDenied(true));
  }, [load]);

  const open = (s: ReviewableSubmission) => {
    setTarget(s);
    setScores(Object.fromEntries(s.rubricGrades.map((g) => [g.key, String(g.score)])));
    setNotes(s.reviewerNotes);
    setError(null);
  };

  const save = async () => {
    if (!target) return;
    const grades = [];
    for (const c of lab.rubricCriteria) {
      const score = Number(scores[c.key]);
      if (scores[c.key] === undefined || scores[c.key] === '' || !(score >= 0 && score <= c.maxScore)) {
        setError(`"${c.label}" cần điểm từ 0 đến ${c.maxScore}`);
        return;
      }
      grades.push({ key: c.key, score });
    }
    setSaving(true);
    try {
      await testerLabApi.review(target._id, grades, notes);
      setTarget(null);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Lưu điểm thất bại. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  // Học viên chỉ thấy khối này khi backend bật peer-review và có bài để chấm.
  if (denied || (isStudent && items.length === 0)) return null;

  return (
    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
      <h2 className="font-semibold text-[var(--text-main)] mb-2">Bài cần chấm (giảng viên / peer)</h2>
      {items.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">Chưa có bài nộp nào của người khác.</p>
      ) : (
        <ul className="space-y-2 list-none p-0 m-0">
          {items.map((s) => (
            <li key={s._id} className="flex items-center justify-between gap-2 text-sm text-[var(--text-main)]">
              <span>
                {new Date(s.createdAt).toLocaleString('vi-VN')} — .{s.fileType}{' '}
                <span className={s.status === 'REVIEWED' ? 'text-emerald-500' : 'text-amber-500'}>
                  ({s.status === 'REVIEWED' ? 'Đã chấm' : 'Chờ chấm'})
                </span>
              </span>
              <span className="flex gap-2">
                <button
                  aria-label="Tải bài nộp"
                  onClick={() => testerLabApi.downloadArtifact(s._id, s.fileType)}
                  className="p-1.5 rounded-lg border border-[var(--border-color)] bg-transparent text-[var(--text-main)] cursor-pointer"
                >
                  <Download size={14} />
                </button>
                <button
                  onClick={() => open(s)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white border-none cursor-pointer text-xs font-semibold"
                >
                  {s.status === 'REVIEWED' ? 'Chấm lại' : 'Chấm điểm'}
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      {target && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div className="w-full max-w-lg rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] p-5 space-y-3 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[var(--text-main)]">Chấm rubric — {lab.labCode}</h3>
              <button
                aria-label="Đóng"
                onClick={() => setTarget(null)}
                className="bg-transparent border-none cursor-pointer text-[var(--text-muted)]"
              >
                <X size={18} />
              </button>
            </div>
            {lab.rubricCriteria.map((c) => (
              <label key={c.key} className="flex items-center justify-between gap-3 text-sm text-[var(--text-main)]">
                <span>
                  {c.label}{' '}
                  <span className="text-xs text-[var(--text-muted)]">
                    ({c.kind === 'severity' ? 'Severity' : 'Quality'})
                  </span>
                </span>
                <input
                  type="number"
                  min={0}
                  max={c.maxScore}
                  step={0.5}
                  value={scores[c.key] ?? ''}
                  onChange={(e) => setScores((prev) => ({ ...prev, [c.key]: e.target.value }))}
                  className="w-20 shrink-0 px-2 py-1 rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)]"
                  aria-label={c.label}
                />
              </label>
            ))}
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={2000}
              rows={3}
              placeholder="Nhận xét cho học viên..."
              className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] text-sm"
            />
            {error && <p className="text-sm text-rose-500">{error}</p>}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setTarget(null)}
                className="px-4 py-2 rounded-lg border border-[var(--border-color)] bg-transparent text-[var(--text-main)] cursor-pointer text-sm"
              >
                Hủy
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white border-none cursor-pointer text-sm font-semibold disabled:opacity-60"
              >
                {saving ? 'Đang lưu...' : 'Lưu điểm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TesterLabReviewPanel;
