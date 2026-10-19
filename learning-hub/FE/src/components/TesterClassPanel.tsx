import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Inbox, Loader2, X } from 'lucide-react';
import assessmentApi from '../axios/assessmentApi';
import { hairline } from './adminStyles';
import { ReviewPanel } from '../pages/TeacherGradingPage';
import type { TesterRating, TesterRoster, TesterRosterRow, TesterStudentDetail, TesterSubmissionDetail } from '../types/assessment';
import type { ReviewQueueItem } from '../types/testerLab';
import { rubricHint, rubricTitle } from '../pages/teacherGradingModel';

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

const RatingBadge: React.FC<{ rating: TesterRating; label: string }> = ({ rating, label }) => (
  <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${RATING_STYLE[rating]}`}>{label}</span>
);

/** Xem nội dung một bài nộp (test case + bug report) qua endpoint đọc dành riêng cho giảng viên. */
const SubmissionBody: React.FC<{ submissionId: string }> = ({ submissionId }) => {
  const [data, setData] = useState<TesterSubmissionDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    assessmentApi
      .getTesterSubmission(submissionId)
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setError('Không tải được nội dung bài nộp.'));
    return () => {
      cancelled = true;
    };
  }, [submissionId]);
  if (error) return <p className="mt-2 text-xs text-rose-500">{error}</p>;
  if (!data) return <p className="mt-2 text-xs text-[var(--text-muted)]">Đang tải...</p>;
  return (
    <div className="mt-2 space-y-2 text-xs text-[var(--text-main)]">
      <div>
        <div className="mb-1 font-medium text-[var(--text-muted)]">Test case ({data.formData?.testCases.length ?? 0})</div>
        <ul className="space-y-1">
          {(data.formData?.testCases ?? []).map((t) => (
            <li key={t.code}>
              <span className="font-mono">{t.code}</span> · {t.description} → <span className="text-[var(--text-muted)]">{t.expected}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <div className="mb-1 font-medium text-[var(--text-muted)]">Bug report ({data.formData?.bugReports.length ?? 0})</div>
        <ul className="space-y-1">
          {(data.formData?.bugReports ?? []).map((b, i) => (
            <li key={i}>
              <strong>{b.title}</strong> <span className="rounded bg-neutral-100 px-1 text-[10px] uppercase dark:bg-neutral-800">{b.severity}</span>
              <div className="text-[var(--text-muted)]">Mong đợi: {b.expected} · Thực tế: {b.actual}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

/** Drawer hồ sơ bài làm của một học viên: từng Lab, điểm từng tiêu chí rubric và nhận xét của giảng viên. */
const StudentDrawer: React.FC<{ classId: string; student: TesterRosterRow; onClose: () => void }> = ({ classId, student, onClose }) => {
  const [detail, setDetail] = useState<TesterStudentDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    assessmentApi
      .getTesterStudent(classId, student.studentId)
      .then((d) => !cancelled && setDetail(d))
      .catch(() => !cancelled && setError('Không tải được hồ sơ bài làm.'));
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
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label={`Hồ sơ bài làm của ${student.fullName}`}>
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
                Lab hoàn thành: <strong className="tabular-nums">{detail.summary.labsCompleted}/{detail.summary.labsTotal}</strong>
              </span>
              <span>
                Điểm TB: <strong className="tabular-nums">{detail.summary.avgScore ?? '—'}</strong>
              </span>
              <RatingBadge rating={detail.summary.rating} label={detail.summary.ratingLabel} />
            </div>
            {detail.submissions.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">Học viên chưa nộp bài Lab nào.</p>
            ) : (
              <ul className="space-y-3">
                {detail.submissions.map((s) => (
                  <li key={s.id} className={`rounded-lg border p-3 ${hairline}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-[var(--text-main)]">
                        {s.lab.labCode} · {s.lab.title}
                      </span>
                      {s.status === 'REVIEWED' ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">✅ {s.total}/100</span>
                      ) : s.status === 'SUBMITTED' ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">🟡 Chờ chấm</span>
                      ) : (
                        <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-600">Đã hủy</span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                      Nộp {fmt(s.submittedAt)} · {s.testCaseCount} test case · {s.bugReportCount} bug report
                    </p>
                    {s.criteria.length > 0 && (
                      <table className="mt-2 w-full text-xs">
                        <tbody>
                          {s.criteria.map((c) => (
                            <tr key={c.key} className={`border-t ${hairline}`}>
                              <td className="py-1 pr-2 text-[var(--text-main)]">
                                {rubricTitle(c.label)}
                                {rubricHint(c.label) && <span className="block text-[10px] text-[var(--text-muted)]">{rubricHint(c.label)}</span>}
                              </td>
                              <td className="whitespace-nowrap py-1 text-right font-medium tabular-nums text-[var(--text-main)]">
                                {c.score ?? '—'}/{c.max}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    <button onClick={() => setExpanded((cur) => (cur === s.id ? null : s.id))} className="mt-2 cursor-pointer text-xs text-indigo-600 underline">
                      {expanded === s.id ? 'Ẩn test case & bug report' : 'Xem test case & bug report'}
                    </button>
                    {expanded === s.id && <SubmissionBody submissionId={s.id} />}
                    {s.feedback && <p className="mt-2 rounded-md bg-neutral-50 p-2 text-xs text-[var(--text-main)] dark:bg-neutral-900">💬 {s.feedback}</p>}
                  </li>
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
 * Lớp Tester QA (Career Adult): không có Giao bài, không đo out-tab (tester được tra cứu spec/mở công cụ ngoài). Hai tab nghiệp vụ:
 * "Bảng xếp hạng & Tiến độ" và "Hàng chờ chấm" với panel chấm rubric 40/30/30 ngay trong lớp.
 */
export const TesterClassPanel: React.FC<{ classId: string; onPendingChange?: () => void }> = ({ classId, onPendingChange }) => {
  const [tab, setTab] = useState<'rank' | 'queue'>('rank');
  const [roster, setRoster] = useState<TesterRoster | null>(null);
  const [queue, setQueue] = useState<ReviewQueueItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drawerFor, setDrawerFor] = useState<TesterRosterRow | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [justGraded, setJustGraded] = useState<ReviewQueueItem[]>([]);

  const load = useCallback(() => {
    assessmentApi
      .getTesterRoster(classId)
      .then(setRoster)
      .catch(() => setError('Không tải được bảng xếp hạng.'));
    assessmentApi
      .getTesterQueue(classId)
      .then(setQueue)
      .catch(() => setError('Không tải được hàng chờ chấm.'));
  }, [classId]);

  useEffect(() => {
    setRoster(null);
    setQueue(null);
    setError(null);
    setOpenId(null);
    setJustGraded([]);
    setTab('rank');
    load();
  }, [load]);

  const open = queue?.find((q) => q.id === openId) ?? null;
  const pending = queue?.length ?? 0;

  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="Nội dung lớp Tester QA" className={`flex gap-4 border-b ${hairline}`}>
        {(
          [
            ['rank', 'Bảng xếp hạng & Tiến độ'],
            ['queue', 'Hàng chờ chấm'],
          ] as Array<['rank' | 'queue', string]>
        ).map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`cursor-pointer border-b-2 px-1 pb-2 text-sm ${tab === key ? 'border-indigo-600 font-medium text-[var(--text-main)]' : 'border-transparent text-[var(--text-muted)]'}`}
          >
            {label}
            {key === 'queue' && pending > 0 && <span className="ml-2 rounded-full bg-amber-100 px-1.5 text-xs font-medium text-amber-800">{pending}</span>}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-rose-500">{error}</p>}

      {tab === 'rank' ? (
        roster === null ? (
          <div className="flex items-center py-6 text-sm text-[var(--text-muted)]">
            <Loader2 size={14} className="mr-2 animate-spin" /> Đang tải...
          </div>
        ) : (
          <div className={`overflow-x-auto rounded-lg border ${hairline}`}>
            <table className="min-w-full">
              <thead>
                <tr>
                  {['Hạng', 'Học viên', 'Lab hoàn thành', 'Điểm TB Tester', 'Xếp loại', 'Chờ chấm', ''].map((h) => (
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
                      <td className={`${td} font-semibold tabular-nums`}>{s.avgScore ?? '—'}</td>
                      <td className={td}>
                        <RatingBadge rating={s.rating} label={s.ratingLabel} />
                      </td>
                      <td className={`${td} tabular-nums`}>{s.pending > 0 ? <span className="text-amber-600">🟡 {s.pending}</span> : '—'}</td>
                      <td className={`${td} text-right`}>
                        <button onClick={() => setDrawerFor(s)} className="cursor-pointer rounded-md border border-indigo-300 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-950">
                          Xem chi tiết hồ sơ bài làm
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <div className="space-y-4">
          {queue === null ? (
            <div className="flex items-center py-6 text-sm text-[var(--text-muted)]">
              <Loader2 size={14} className="mr-2 animate-spin" /> Đang tải...
            </div>
          ) : queue.length === 0 ? (
            <div className={`flex items-center gap-2 rounded-lg border p-4 text-sm text-[var(--text-muted)] ${hairline}`}>
              <Inbox size={16} /> Không có bài nào đang chờ chấm.
            </div>
          ) : (
            <div className={`overflow-x-auto rounded-lg border ${hairline}`}>
              <table className="min-w-full">
                <thead>
                  <tr>
                    {['Học viên', 'Bài lab', 'Nộp lúc', 'Test case', 'Bug', 'Trạng thái', ''].map((h) => (
                      <th key={h} className={th}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {queue.map((i) => (
                    <tr key={i.id} className={`border-t ${hairline} ${i.id === openId ? 'bg-indigo-50/60 dark:bg-indigo-950/30' : ''}`}>
                      <td className={td}>
                        <div>{i.student.fullName || i.student.email}</div>
                        <div className="text-xs text-[var(--text-muted)]">{i.student.email}</div>
                      </td>
                      <td className={td}>
                        {i.lab.labCode} · {i.lab.title}
                      </td>
                      <td className={`${td} tabular-nums`}>{fmt(i.submittedAt)}</td>
                      <td className={`${td} tabular-nums`}>{i.formData?.testCases.length ?? 0}</td>
                      <td className={`${td} tabular-nums`}>{i.formData?.bugReports.length ?? 0}</td>
                      <td className={td}>
                        <span className="whitespace-nowrap rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">🟡 Chờ chấm</span>
                      </td>
                      <td className={`${td} text-right`}>
                        <button onClick={() => setOpenId(i.id)} className="cursor-pointer rounded-md border border-indigo-300 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-950">
                          Chấm bài
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {open && (
            <ReviewPanel
              key={open.id}
              item={open}
              onClose={() => setOpenId(null)}
              onDone={(id) => {
                // Cập nhật ngay tại chỗ: bài rời hàng chờ, hiện ở khối "Vừa chấm xong", bảng xếp hạng tải lại điểm mới.
                setJustGraded((cur) => [open, ...cur.filter((g) => g.id !== id)]);
                setQueue((cur) => (cur ?? []).filter((x) => x.id !== id));
                setOpenId(null);
                assessmentApi.getTesterRoster(classId).then(setRoster).catch(() => undefined);
                onPendingChange?.();
              }}
            />
          )}

          {justGraded.length > 0 && (
            <section aria-label="Vừa chấm xong" className={`rounded-lg border p-3 ${hairline}`}>
              <h3 className="mb-2 text-sm font-medium text-[var(--text-main)]">Vừa chấm xong</h3>
              <ul className="space-y-1">
                {justGraded.map((g) => (
                  <li key={g.id} className="flex items-center gap-2 text-sm text-[var(--text-main)]">
                    <CheckCircle2 size={14} className="text-emerald-600" aria-hidden />
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">✅ Đã chấm</span>
                    {g.student.fullName || g.student.email} · {g.lab.labCode}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {drawerFor && <StudentDrawer classId={classId} student={drawerFor} onClose={() => setDrawerFor(null)} />}
    </div>
  );
};

export default TesterClassPanel;
