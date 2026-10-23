import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import type { IntegrityDecision, IntegrityDetail } from '../types/integrity';
import {
  canSubmitReview,
  DECISION_LABEL,
  DECISIONS,
  formatDuration,
  formatSimilarity,
} from '../pages/integrityFormat';

const studentName = (s: { fullName?: string; email?: string; id: string }) => s.fullName || s.email || s.id;
const formatTime = (iso: string) => new Date(iso).toLocaleString('vi-VN');
const errorMessage = (err: unknown, fallback: string) =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;

const CodeBox: React.FC<{ title: string; code: string }> = ({ title, code }) => (
  <div className="min-w-0">
    <p className="mb-1 text-xs font-semibold text-[var(--text-main)]">{title}</p>
    <pre className="max-h-72 overflow-auto rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] p-2 font-mono text-[11px] whitespace-pre-wrap">
      {code}
    </pre>
  </div>
);

interface IntegrityReviewModalProps {
  /** Tải chi tiết lượt cần xem (bài nộp Playground hoặc lượt thi của cuộc thi). */
  load: () => Promise<IntegrityDetail>;
  /** Lưu kết luận của giảng viên. */
  save: (decision: IntegrityDecision, note: string) => Promise<unknown>;
  onClose: () => void;
  onReviewed: () => void;
}

/**
 * Modal xem xét tính trung thực dùng chung: dòng thời gian, so sánh mã và form
 * kết luận. Chỉ là tín hiệu hỗ trợ; giảng viên quyết định cuối cùng.
 */
export const IntegrityReviewModal: React.FC<IntegrityReviewModalProps> = ({ load, save, onClose, onReviewed }) => {
  const [detail, setDetail] = useState<IntegrityDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [decision, setDecision] = useState<IntegrityDecision | ''>('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  // Props hàm thường là arrow inline (đổi identity mỗi lần render): giữ bản mới nhất trong ref, chỉ tải một lần khi mở.
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });

  useEffect(() => {
    let cancelled = false;
    loadRef.current()
      .then((d) => {
        if (cancelled) return;
        setDetail(d);
        setDecision(d.integrity.decision ?? '');
        setNote(d.integrity.reviewNote ?? '');
      })
      .catch((err) => !cancelled && setError(errorMessage(err, 'Không tải được chi tiết bài nộp.')));
    return () => {
      cancelled = true;
    };
  }, []);

  const submit = async () => {
    if (!detail || decision === '' || !canSubmitReview(decision, note)) return;
    setSaving(true);
    setError(null);
    try {
      await save(decision, note.trim());
      onReviewed();
    } catch (err) {
      setError(errorMessage(err, 'Không lưu được kết luận.'));
    } finally {
      setSaving(false);
    }
  };

  const sig = detail?.integrity;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Chi tiết xem xét tính trung thực"
    >
      <div className="w-full max-w-4xl rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 shadow-xl">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 className="text-lg font-bold text-[var(--text-main)]">Chi tiết xem xét</h2>
          <button onClick={onClose} aria-label="Đóng" className="cursor-pointer border-none bg-transparent text-[var(--text-main)]">
            <X size={18} />
          </button>
        </div>

        {!detail && !error && (
          <div className="flex items-center py-8 text-sm text-[var(--text-muted)]">
            <Loader2 className="mr-2 animate-spin" size={16} /> Đang tải...
          </div>
        )}
        {error && (
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-500">
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        {detail && sig && (
          <div className="space-y-4 text-xs text-[var(--text-main)]">
            <p>
              <strong>{studentName(detail.student)}</strong> · {detail.exercise.title ?? detail.exercise.slug} · nộp lúc{' '}
              {formatTime(detail.submittedAt)}
            </p>
            <p className="rounded-lg border border-sky-500/30 bg-sky-500/10 p-3">
              Đây chỉ là tín hiệu hỗ trợ. Hệ thống không tự trừ điểm hay kết luận gian lận; hãy cân nhắc bối cảnh và quyết
              định thủ công.
            </p>

            {sig.reasons.length > 0 && (
              <ul className="list-disc space-y-1 pl-5">
                {sig.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            )}

            <section>
              <h3 className="mb-1 text-sm font-bold">Dòng thời gian làm bài</h3>
              <ul className="space-y-1">
                <li>Bắt đầu: {formatTime(sig.timeline.startedAt)}</li>
                {sig.timeline.editMarks.map((m) => (
                  <li key={m.at}>
                    {formatTime(m.at)}: chỉnh sửa mã (độ dài {m.charCount} ký tự)
                  </li>
                ))}
                {sig.focusEvents.map((e) => (
                  <li key={e.leftAt}>
                    {formatTime(e.leftAt)}: rời màn hình {formatDuration(e.awaySeconds)}, quay lại {formatTime(e.returnedAt)}
                  </li>
                ))}
                <li>Nộp bài: {formatTime(sig.timeline.submittedAt)}</li>
              </ul>
              <p className="mt-1 text-[var(--text-muted)]">
                Tổng {formatDuration(sig.timeline.totalSeconds)} · thao tác thực tế {formatDuration(sig.timeline.activeSeconds)} ·
                rời màn hình {sig.focusSummary.count} lần ({formatDuration(sig.focusSummary.totalAwaySeconds)})
              </p>
            </section>

            <section>
              <h3 className="mb-1 text-sm font-bold">So sánh mã nguồn · tương đồng {formatSimilarity(sig.similarity.score)}</h3>
              {detail.match ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <CodeBox title={`Bài đang xem (${studentName(detail.student)})`} code={detail.code} />
                  <CodeBox title={`Bài so khớp (${studentName(detail.match.student)})`} code={detail.match.code} />
                </div>
              ) : (
                <>
                  <p className="mb-2 text-[var(--text-muted)]">Không có bài nào vượt ngưỡng tương đồng.</p>
                  <CodeBox title="Bài làm" code={detail.code} />
                </>
              )}
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-bold">Kết luận của giảng viên</h3>
              {sig.reviewStatus === 'REVIEWED' && (
                <p className="text-[var(--text-muted)]">
                  Đã duyệt{sig.reviewedAt ? ` lúc ${formatTime(sig.reviewedAt)}` : ''}. Có thể cập nhật lại kết luận.
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {DECISIONS.map((d) => (
                  <label
                    key={d}
                    className={`cursor-pointer rounded-lg border px-3 py-1.5 font-semibold ${
                      decision === d
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-[var(--border-color)] bg-[var(--bg-main)]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="decision"
                      className="sr-only"
                      checked={decision === d}
                      onChange={() => setDecision(d)}
                    />
                    {DECISION_LABEL[d]}
                  </label>
                ))}
              </div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="Nhận xét/lý do (bắt buộc)"
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] p-2 text-xs text-[var(--text-main)]"
              />
              <button
                onClick={submit}
                disabled={saving || !canSubmitReview(decision, note)}
                className="cursor-pointer rounded-lg border-none bg-indigo-600 px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? 'Đang lưu...' : 'Lưu kết luận'}
              </button>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntegrityReviewModal;
