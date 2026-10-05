import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Loader2, ShieldAlert } from 'lucide-react';
import integrityApi from '../axios/integrityApi';
import { IntegrityReviewModal } from '../components/IntegrityReviewModal';
import type { IntegrityQueueRow } from '../types/integrity';
import { formatDuration, formatSimilarity, REVIEW_STATUS_LABEL, sortQueue } from './integrityFormat';

type Filter = 'NEEDS_REVIEW' | 'REVIEWED';

const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: 'NEEDS_REVIEW', label: 'Cần xem xét' },
  { key: 'REVIEWED', label: 'Đã duyệt' },
];

const cellCls = 'px-3 py-2 text-xs text-[var(--text-main)] align-top';
const headCls = 'px-3 py-2 text-left text-xs font-semibold text-[var(--text-main)] whitespace-nowrap';

const studentName = (s: { fullName?: string; email?: string; id: string }) => s.fullName || s.email || s.id;
const formatTime = (iso: string) => new Date(iso).toLocaleString('vi-VN');
const errorMessage = (err: unknown, fallback: string) =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;

const StatusBadge: React.FC<{ row: IntegrityQueueRow }> = ({ row }) => {
  const status = row.integrity.reviewStatus;
  const tone =
    status === 'NEEDS_REVIEW'
      ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30'
      : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30';
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-semibold ${tone}`}>
      {REVIEW_STATUS_LABEL[status]}
    </span>
  );
};

/** Hàng chờ xem xét tính trung thực: giảng viên/quản trị viên là người quyết định cuối cùng. */
export const TeacherIntegrityQueuePage: React.FC = () => {
  const [filter, setFilter] = useState<Filter>('NEEDS_REVIEW');
  const [rows, setRows] = useState<IntegrityQueueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    integrityApi
      .getQueue(filter === 'REVIEWED' ? 'REVIEWED' : undefined)
      .then((r) => !cancelled && setRows(sortQueue(r)))
      .catch((err) => !cancelled && setError(errorMessage(err, 'Không tải được hàng chờ.')))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [filter, reloadKey]);

  const handleReviewed = useCallback(() => {
    setOpenId(null);
    setReloadKey((k) => k + 1);
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-[var(--text-main)]">
        <ShieldAlert size={24} /> Xem xét tính trung thực
      </h1>
      <p className="text-sm text-[var(--text-muted)]">
        Các bài dưới đây chỉ được đánh dấu để bạn xem xét. Hệ thống không tự kết tội, không trừ điểm hay hủy bài.
      </p>

      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-semibold ${
              filter === f.key
                ? 'border-indigo-600 bg-indigo-600 text-white'
                : 'border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-main)]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center py-8 text-sm text-[var(--text-muted)]">
          <Loader2 className="mr-2 animate-spin" size={16} /> Đang tải...
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-500">
          <AlertTriangle size={16} /> {error}
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">Không có bài nào trong mục này.</p>
      ) : (
        <div className="overflow-auto rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)]">
          <table className="min-w-full">
            <thead className="bg-[var(--bg-main)]">
              <tr>
                {['Học viên', 'Bài tập', 'Thao tác thực tế', 'Rời màn hình', 'Tương đồng mã', 'Trạng thái', 'Nộp lúc', ''].map(
                  (h) => (
                    <th key={h} className={headCls}>
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-[var(--border-color)]">
                  <td className={cellCls}>{studentName(r.student)}</td>
                  <td className={cellCls}>{r.exercise.title ?? r.exercise.slug ?? r.exercise.id}</td>
                  <td className={`${cellCls} font-mono`}>{formatDuration(r.integrity.timeline.activeSeconds)}</td>
                  <td className={`${cellCls} font-mono`}>
                    {r.integrity.focusSummary.count} lần ({formatDuration(r.integrity.focusSummary.totalAwaySeconds)})
                  </td>
                  <td className={`${cellCls} font-mono`}>{formatSimilarity(r.integrity.similarity.score)}</td>
                  <td className={cellCls}>
                    <StatusBadge row={r} />
                  </td>
                  <td className={`${cellCls} whitespace-nowrap`}>{formatTime(r.submittedAt)}</td>
                  <td className={cellCls}>
                    <button
                      onClick={() => setOpenId(r.id)}
                      className="cursor-pointer rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] px-3 py-1 text-xs font-semibold text-[var(--text-main)]"
                    >
                      Xem chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {openId && (
        <IntegrityReviewModal
          load={() => integrityApi.getDetail(openId)}
          save={(decision, note) => integrityApi.review(openId, decision, note)}
          onClose={() => setOpenId(null)}
          onReviewed={handleReviewed}
        />
      )}
    </div>
  );
};

export default TeacherIntegrityQueuePage;
