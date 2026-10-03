import React, { useEffect, useState } from 'react';
import { AlertTriangle, ClipboardCheck, Inbox, Loader2, X } from 'lucide-react';
import daLabApi from '../axios/daLabApi';
import { useToast } from './Toast';
import type { PendingInsightSubmission } from '../types/daLab';

const errorMessage = (err: any, fallback: string): string =>
  err?.response?.data?.message || fallback;

const formatTime = (iso: string) =>
  new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });

/* ---------- Modal chấm bài (component riêng để input không bị remount khi gõ) ---------- */

interface ReviewModalProps {
  submission: PendingInsightSubmission;
  onClose: () => void;
  onSaved: (id: string) => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ submission, onClose, onSaved }) => {
  const { showToast } = useToast();
  const maxScore = submission.maxScore;
  const [score, setScore] = useState('');
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !saving && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, saving]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(score);
    if (score.trim() === '' || !Number.isFinite(value) || value < 0 || value > maxScore) {
      setFormError(`Điểm phải là số từ 0 đến ${maxScore}.`);
      return;
    }
    setFormError(null);
    setSaving(true);
    try {
      await daLabApi.reviewSubmission(submission.id, value, comment.trim());
      showToast(`Đã lưu điểm ${value}/${maxScore} cho ${submission.student.fullName ?? 'học viên'}.`, 'success');
      onSaved(submission.id);
    } catch (err) {
      setFormError(errorMessage(err, 'Lưu điểm thất bại. Vui lòng thử lại.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={() => !saving && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-modal-title"
        className="w-full max-w-2xl max-h-[90vh] overflow-auto rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="review-modal-title" className="text-lg font-bold text-[var(--text-main)]">
              {submission.exercise.title ?? submission.exercise.slug}
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              {submission.student.fullName ?? submission.student.id}
              {submission.student.email ? ` · ${submission.student.email}` : ''} · nộp lúc{' '}
              {formatTime(submission.submittedAt)}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            aria-label="Đóng"
            className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-main)] bg-transparent border-none cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex items-start gap-2 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-sm">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{submission.aiExplanation || 'AI chưa chấm bài này.'}</span>
        </div>

        <div>
          <div className="text-sm font-semibold text-[var(--text-main)] mb-1">Bài làm của học viên</div>
          <div className="whitespace-pre-wrap rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] p-3 text-sm text-[var(--text-main)] max-h-64 overflow-auto">
            {submission.content}
          </div>
        </div>

        {!!submission.exercise.insightRubric?.length && (
          <ul className="text-xs text-[var(--text-muted)] list-disc ml-5">
            {submission.exercise.insightRubric.map((c) => (
              <li key={c.id}>
                <b>{c.title}</b> ({c.maxPoints}đ): {c.description}
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleSave} className="space-y-3">
          <label className="block text-sm font-semibold text-[var(--text-main)]">
            Điểm (0 - {maxScore})
            <input
              type="number"
              min={0}
              max={maxScore}
              step={0.5}
              value={score}
              onChange={(e) => setScore(e.target.value)}
              autoFocus
              className="mt-1 block w-32 rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] px-3 py-2 text-sm font-normal text-[var(--text-main)]"
            />
          </label>
          <label className="block text-sm font-semibold text-[var(--text-main)]">
            Nhận xét
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="Nhận xét về nhận định, số liệu và đề xuất của học viên..."
              className="mt-1 block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] px-3 py-2 text-sm font-normal text-[var(--text-main)]"
            />
          </label>
          {formError && <p className="text-sm text-rose-500">{formError}</p>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-lg border border-[var(--border-color)] bg-transparent text-sm font-semibold text-[var(--text-main)] cursor-pointer disabled:opacity-50"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold border-none cursor-pointer disabled:opacity-50"
            >
              {saving && <Loader2 size={15} className="animate-spin" />}
              Lưu điểm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ---------- Bảng hàng chờ ---------- */

export const TeacherReviewQueue: React.FC = () => {
  const [items, setItems] = useState<PendingInsightSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<PendingInsightSubmission | null>(null);

  useEffect(() => {
    daLabApi
      .getPendingReviews()
      .then(setItems)
      .catch((err) => setError(errorMessage(err, 'Không tải được hàng chờ chấm bài.')))
      .finally(() => setLoading(false));
  }, []);

  const handleSaved = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setSelected(null);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-main)] flex items-center gap-2">
          <ClipboardCheck size={24} /> Hàng chờ chấm Insight
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Bài nộp DA Lab mà AI không chấm được (bị guardrail từ chối, AI lỗi hoặc chưa cấu hình), cũ nhất xếp trước.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-[var(--text-muted)]">
          <Loader2 className="animate-spin mr-2" size={20} /> Đang tải hàng chờ...
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500">
          <AlertTriangle size={18} /> {error}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-[var(--text-muted)]">
          <Inbox size={32} />
          Không còn bài nào chờ chấm.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)]">
          <table className="min-w-full text-sm">
            <thead className="bg-[var(--bg-main)] text-left text-[var(--text-main)]">
              <tr>
                <th className="px-4 py-3 font-semibold">Học viên</th>
                <th className="px-4 py-3 font-semibold">Bài tập</th>
                <th className="px-4 py-3 font-semibold">Lý do chờ chấm</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Thời gian nộp</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-[var(--border-color)] align-top">
                  <td className="px-4 py-3 text-[var(--text-main)]">
                    <div className="font-medium">{item.student.fullName ?? item.student.id}</div>
                    {item.student.email && (
                      <div className="text-xs text-[var(--text-muted)]">{item.student.email}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-main)]">
                    <div>{item.exercise.title ?? item.exercise.slug}</div>
                    <div className="text-xs text-[var(--text-muted)]">{item.exercise.slug}</div>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)] max-w-md">
                    <span className="line-clamp-2">{item.aiExplanation || 'PENDING_REVIEW'}</span>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)] whitespace-nowrap">
                    {formatTime(item.submittedAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelected(item)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold border-none cursor-pointer whitespace-nowrap"
                    >
                      Chấm bài
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <ReviewModal submission={selected} onClose={() => setSelected(null)} onSaved={handleSaved} />
      )}
    </div>
  );
};

export default TeacherReviewQueue;
