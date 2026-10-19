import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, Download, Loader2, RefreshCw, ShieldAlert, ShieldCheck } from 'lucide-react';
import { contestApi } from '../../axios/contestApi';
import type { ContestItem, ContestManageResults, ContestParticipantRow } from '../../types/contest';
import { IntegrityReviewModal } from '../IntegrityReviewModal';
import { DECISION_LABEL, formatDuration, formatSimilarity, REVIEW_STATUS_LABEL } from '../../pages/integrityFormat';
import { filterParticipants, PARTICIPANT_STATUS_LABEL, sortByRank, sortParticipants, toCsv } from './resultsFormat';

/** Làm mới số liệu giám sát theo thời gian thực khi cuộc thi còn diễn ra. */
const LIVE_REFRESH_MS = 10_000;

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
  const [sortMode, setSortMode] = useState<'rank' | 'review'>('rank');
  const [dq, setDq] = useState<{ row: ContestParticipantRow; reason: string; busy: boolean; error: string | null } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      setData(await contestApi.getManageResults(contestId));
    } catch (err) {
      if (!silent) setError(errorMessage(err, 'Không tải được kết quả cuộc thi.'));
    } finally {
      if (!silent) setLoading(false);
    }
  }, [contestId]);

  useEffect(() => {
    load();
  }, [load]);

  // Giám sát thời gian thực: tự làm mới khi cuộc thi đang diễn ra.
  const live = !!data && new Date(data.contest.startTime) <= new Date() && new Date() <= new Date(data.contest.endTime);
  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => void load(true), LIVE_REFRESH_MS);
    return () => clearInterval(t);
  }, [live, load]);

  const rows = useMemo(() => (data ? filterParticipants(sortMode === 'rank' ? sortByRank(data.rows) : sortParticipants(data.rows), onlyReview) : []), [data, onlyReview, sortMode]);

  const confirmDisqualify = async () => {
    if (!dq?.row.attemptId) return;
    if (dq.reason.trim().length < 10) return setDq({ ...dq, error: 'Cần nhập lý do ít nhất 10 ký tự.' });
    setDq({ ...dq, busy: true, error: null });
    try {
      await contestApi.disqualifyAttempt(contestId, dq.row.attemptId, dq.reason.trim());
      setDq(null);
      await load(true);
    } catch (err) {
      setDq((cur) => (cur ? { ...cur, busy: false, error: errorMessage(err, 'Không thực hiện được. Vui lòng thử lại.') } : cur));
    }
  };

  const reinstate = async (r: ContestParticipantRow) => {
    if (!r.attemptId) return;
    setActionError(null);
    try {
      await contestApi.reinstateAttempt(contestId, r.attemptId);
      await load(true);
    } catch (err) {
      setActionError(errorMessage(err, 'Không khôi phục được kết quả.'));
    }
  };

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
            onClick={() => void load()}
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
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {[
              { label: 'Đã đăng ký', value: data.summary.registered },
              { label: 'Đã vào thi', value: data.summary.started },
              { label: 'Đã nộp bài', value: data.summary.finished },
              { label: 'Không công nhận', value: data.summary.disqualified ?? 0, accent: (data.summary.disqualified ?? 0) > 0 },
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

          {live && <p className="text-xs text-emerald-600">● Đang diễn ra — số liệu tự làm mới mỗi {LIVE_REFRESH_MS / 1000} giây.</p>}
          {actionError && <p className="text-sm text-rose-500">{actionError}</p>}
          <div role="tablist" aria-label="Cách sắp xếp" className="flex gap-2">
            {([['rank', 'Bảng xếp hạng'], ['review', 'Ưu tiên cần xem xét']] as const).map(([k, label]) => (
              <button key={k} role="tab" type="button" aria-selected={sortMode === k} onClick={() => setSortMode(k)} className={`cursor-pointer rounded-xl border px-3 py-1.5 text-xs font-bold ${sortMode === k ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-main)]'}`}>
                {label}
              </button>
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
                    <th className={headCls}>Hạng</th>
                    <th className={headCls}>Thí sinh</th>
                    <th className={headCls}>Trạng thái</th>
                    {data.contest.problems.map((p) => (
                      <th key={p.slug} className={`${headCls} max-w-40`} title={p.title}>
                        <span className="block truncate">{p.title}</span>
                        <span className="font-normal text-[var(--text-muted)]">/{p.maxPoints}</span>
                      </th>
                    ))}
                    <th className={headCls}>Tổng /{data.contest.maxScore}</th>
                    <th className={headCls}>Thời gian làm</th>
                    <th className={headCls}>Out-tab</th>
                    <th className={headCls}>Kết quả</th>
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
                    <tr key={r.studentId} className={`border-t border-[var(--border-color)] ${r.disqualified ? 'bg-rose-500/5' : ''}`}>
                      <td className={`${cellCls} font-mono font-black`}>{r.officialRank ?? '–'}</td>
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
                      <td className={`${cellCls} font-mono`}>{r.completionMinutes !== null ? `${r.completionMinutes} phút` : '–'}</td>
                      <td className={`${cellCls} font-mono ${r.leaveCount >= 3 ? 'font-black text-rose-600' : ''}`}>{r.attemptId ? `${r.leaveCount} lần` : '–'}</td>
                      <td className={cellCls}>
                        {r.disqualified ? (
                          <div className="flex flex-col items-start gap-1">
                            <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[11px] font-semibold text-rose-700 dark:text-rose-300">Không công nhận</span>
                            {r.disqualifiedReason && <span className="max-w-48 text-[11px] text-[var(--text-muted)]">{r.disqualifiedReason}</span>}
                            <button type="button" onClick={() => void reinstate(r)} className="cursor-pointer rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-main)]">Khôi phục</button>
                          </div>
                        ) : r.canDisqualify ? (
                          <button type="button" onClick={() => setDq({ row: r, reason: '', busy: false, error: null })} className="cursor-pointer rounded-lg border border-rose-300 bg-rose-600/10 px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-600 hover:text-white dark:text-rose-300">Không công nhận kết quả</button>
                        ) : (
                          <span className="text-[11px] text-[var(--text-muted)]">{r.status === 'NOT_STARTED' ? '–' : 'Hợp lệ'}</span>
                        )}
                      </td>
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

      {dq && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Không công nhận kết quả">
          <div className="fixed inset-0 bg-black/40" onClick={() => !dq.busy && setDq(null)} />
          <div className="relative w-full max-w-md space-y-3 rounded-xl border border-neutral-200 bg-white p-5 shadow-xl dark:border-neutral-800 dark:bg-neutral-950">
            <h3 className="text-base font-semibold text-[var(--text-main)]">Không công nhận kết quả của {dq.row.studentName}?</h3>
            <p className="text-xs text-[var(--text-muted)]">Thí sinh rời màn hình {dq.row.leaveCount} lần. Học viên vẫn xem được bài và điểm của mình nhưng bị loại khỏi bảng xếp hạng chính thức. Bạn có thể khôi phục sau.</p>
            <textarea value={dq.reason} onChange={(e) => setDq({ ...dq, reason: e.target.value })} rows={3} maxLength={500} placeholder="Lý do (bắt buộc, ít nhất 10 ký tự)" aria-label="Lý do không công nhận" className="w-full rounded-md border border-neutral-300 bg-transparent p-2 text-sm dark:border-neutral-700" />
            {dq.error && <p className="text-sm text-rose-500">{dq.error}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setDq(null)} disabled={dq.busy} className="cursor-pointer rounded-md border border-neutral-300 px-4 py-2 text-sm dark:border-neutral-700">Hủy</button>
              <button type="button" onClick={() => void confirmDisqualify()} disabled={dq.busy} className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-60">
                {dq.busy && <Loader2 size={14} className="animate-spin" />} Xác nhận không công nhận
              </button>
            </div>
          </div>
        </div>
      )}

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
