import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, Download, Loader2, RefreshCw, ShieldAlert, ShieldCheck } from 'lucide-react';
import { contestApi } from '../../axios/contestApi';
import type { ContestItem, ContestManageResults, ContestParticipantRow } from '../../types/contest';
import { IntegrityReviewModal } from '../IntegrityReviewModal';
import { DECISION_LABEL, formatDuration, formatSimilarity, REVIEW_STATUS_LABEL } from '../../pages/integrityFormat';
import { filterParticipants, PARTICIPANT_STATUS_LABEL, sortParticipants, toCsv } from './resultsFormat';

const cellCls = 'px-3 py-2.5 text-xs text-[var(--text-main)] align-top';
const headCls = 'px-3 py-2.5 text-left text-xs font-semibold text-[var(--text-main)] whitespace-nowrap';

const STATUS_TONE: Record<ContestParticipantRow['status'], string> = {
  NOT_STARTED: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  IN_PROGRESS: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
  FINISHED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  EXPIRED: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
};

const errorMessage = (err: unknown, fallback: string) =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;

interface ContestResultsPanelProps {
  contest: ContestItem;
  onBack: () => void;
}

/** Kết quả theo thí sinh và hàng chờ xem xét tính trung thực của một cuộc thi. */
export const ContestResultsPanel: React.FC<ContestResultsPanelProps> = ({ contest, onBack }) => {
  const contestId = contest._id || contest.slug;
  const [data, setData] = useState<ContestManageResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onlyReview, setOnlyReview] = useState(false);
  const [reviewing, setReviewing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await contestApi.getManageResults(contestId));
    } catch (err) {
      setError(errorMessage(err, 'Không tải được kết quả cuộc thi.'));
    } finally {
      setLoading(false);
    }
  }, [contestId]);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => (data ? filterParticipants(sortParticipants(data.rows), onlyReview) : []), [data, onlyReview]);

  const exportCsv = () => {
    if (!data) return;
    // BOM để Excel đọc đúng tiếng Việt.
    const blob = new Blob(['﻿' + toCsv(data)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ket-qua-${data.contest.slug}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-2 text-xs font-bold text-[var(--text-main)]"
        >
          <ArrowLeft size={14} /> Danh sách cuộc thi
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-2 text-xs font-bold text-[var(--text-main)] disabled:opacity-60"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Làm mới
          </button>
          <button
            type="button"
            onClick={exportCsv}
            disabled={!data}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border-none bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={13} /> Xuất CSV
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-black tracking-tight text-[var(--text-main)]">Kết quả: {contest.title}</h2>
        <p className="text-xs text-[var(--text-muted)]">
          Điểm do máy chủ chấm tự động. Mục trung thực chỉ là tín hiệu để bạn xem xét, không tự trừ điểm hay hủy bài.
        </p>
      </div>

      {loading && !data ? (
        <div className="flex items-center py-10 text-sm text-[var(--text-muted)]">
          <Loader2 className="mr-2 animate-spin" size={16} /> Đang tải...
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-500">
          <AlertTriangle size={16} /> {error}
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: 'Đã đăng ký', value: data.summary.registered },
              { label: 'Đã vào thi', value: data.summary.started },
              { label: 'Đã nộp bài', value: data.summary.finished },
              { label: 'Cần xem xét', value: data.summary.needsReview, accent: data.summary.needsReview > 0 },
            ].map((c) => (
              <div
                key={c.label}
                className={`rounded-2xl border p-4 ${
                  c.accent ? 'border-amber-500/50 bg-amber-500/10' : 'border-[var(--border-color)] bg-[var(--bg-card)]'
                }`}
              >
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">{c.label}</p>
                <p className="mt-1 text-2xl font-black text-[var(--text-main)]">{c.value}</p>
              </div>
            ))}
          </div>

          {data.contest.integrityEnabled ? (
            <label className="flex w-fit cursor-pointer items-center gap-2 text-xs font-semibold text-[var(--text-main)]">
              <input type="checkbox" checked={onlyReview} onChange={(e) => setOnlyReview(e.target.checked)} className="h-4 w-4 cursor-pointer" />
              Chỉ hiện thí sinh cần xem xét
            </label>
          ) : (
            <p className="text-xs text-[var(--text-muted)]">Cuộc thi này không bật giám sát liêm chính.</p>
          )}

          {rows.length === 0 ? (
            <p className="py-6 text-center text-sm text-[var(--text-muted)]">
              {onlyReview ? 'Không có thí sinh nào cần xem xét.' : 'Chưa có thí sinh đăng ký.'}
            </p>
          ) : (
            <div className="overflow-auto rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)]">
              <table className="min-w-full">
                <thead className="bg-[var(--bg-main)]">
                  <tr>
                    <th className={headCls}>Thí sinh</th>
                    <th className={headCls}>Trạng thái</th>
                    {data.contest.problems.map((p) => (
                      <th key={p.slug} className={`${headCls} max-w-40`} title={p.title}>
                        <span className="block truncate">{p.title}</span>
                        <span className="font-normal text-[var(--text-muted)]">/{p.maxPoints}</span>
                      </th>
                    ))}
                    <th className={headCls}>Tổng /{data.contest.maxScore}</th>
                    {data.contest.integrityEnabled && (
                      <>
                        <th className={headCls}>Thao tác thực tế</th>
                        <th className={headCls}>Rời màn hình</th>
                        <th className={headCls}>Tương đồng mã</th>
                        <th className={headCls}>Trung thực</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.studentId} className="border-t border-[var(--border-color)]">
                      <td className={`${cellCls} font-semibold`}>{r.studentName}</td>
                      <td className={cellCls}>
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_TONE[r.status]}`}>
                          {PARTICIPANT_STATUS_LABEL[r.status]}
                        </span>
                      </td>
                      {data.contest.problems.map((p) => {
                        const s = r.perProblem.find((x) => x.slug === p.slug);
                        return (
                          <td key={p.slug} className={`${cellCls} font-mono`}>
                            {s?.score ?? '–'}
                          </td>
                        );
                      })}
                      <td className={`${cellCls} font-mono font-black`}>{r.totalScore}</td>
                      {data.contest.integrityEnabled && (
                        <>
                          <td className={`${cellCls} font-mono`}>{r.integrity ? formatDuration(r.integrity.activeSeconds) : '–'}</td>
                          <td className={`${cellCls} font-mono`}>
                            {r.integrity ? `${r.integrity.focusCount} lần (${formatDuration(r.integrity.awaySeconds)})` : '–'}
                          </td>
                          <td className={`${cellCls} font-mono`}>{r.integrity ? formatSimilarity(r.integrity.similarityScore) : '–'}</td>
                          <td className={cellCls}>
                            {r.integrity && r.attemptId ? (
                              <div className="flex flex-col items-start gap-1">
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                                    r.integrity.reviewStatus === 'NEEDS_REVIEW'
                                      ? 'border-amber-500/30 bg-amber-500/15 text-amber-800 dark:text-amber-300'
                                      : 'border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                                  }`}
                                >
                                  {r.integrity.reviewStatus === 'NEEDS_REVIEW' ? <ShieldAlert size={11} /> : <ShieldCheck size={11} />}
                                  {REVIEW_STATUS_LABEL[r.integrity.reviewStatus]}
                                </span>
                                {r.integrity.decision && (
                                  <span className="text-[11px] text-[var(--text-muted)]">{DECISION_LABEL[r.integrity.decision]}</span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setReviewing(r.attemptId)}
                                  className="cursor-pointer rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-main)]"
                                >
                                  Xem chi tiết
                                </button>
                              </div>
                            ) : (
                              '–'
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : null}

      {reviewing && (
        <IntegrityReviewModal
          load={() => contestApi.getIntegrityDetail(contestId, reviewing)}
          save={(decision, note) => contestApi.reviewIntegrity(contestId, reviewing, decision, note)}
          onClose={() => setReviewing(null)}
          onReviewed={() => {
            setReviewing(null);
            load();
          }}
        />
      )}
    </div>
  );
};

export default ContestResultsPanel;
