import React from 'react';
import type { AgeGroupKey, DashboardSummary, HealthReport } from '../../types/adminPortal';
import {
  AGE_GROUP_LABEL,
  AGE_GROUP_ORDER,
  barHeights,
  formatLatency,
  HEALTH_DOT_CLASS,
  HEALTH_LABEL,
  HEALTH_TONE,
  percent,
  shortDay,
} from '../../pages/adminPortalModel';
import { card, Pill, Skeleton } from './AdminUi';

/** Thẻ số liệu: nhãn nhỏ, số lớn, ghi chú bên dưới; `skeleton` giữ nguyên kích thước khi đang tải. */
export const MetricCard: React.FC<{
  label: string;
  value?: React.ReactNode;
  loading?: boolean;
  children?: React.ReactNode;
  accent?: string;
}> = ({ label, value, loading, children, accent }) => (
  <section className={`${card} flex flex-col gap-2 p-5`} aria-label={label}>
    <div className="flex items-center justify-between">
      <h2 className="text-sm font-medium text-[var(--text-muted)]">{label}</h2>
      {accent && <span className={`h-2 w-2 rounded-full ${accent}`} aria-hidden="true" />}
    </div>
    {loading ? <Skeleton className="h-9 w-24" /> : <div className="text-3xl font-semibold tabular-nums tracking-tight text-[var(--text-main)]">{value}</div>}
    <div className="mt-auto min-h-[1.5rem] text-xs text-[var(--text-muted)]">{loading ? <Skeleton className="h-4 w-40" /> : children}</div>
  </section>
);

export const HealthSummaryCard: React.FC<{
  report: HealthReport | undefined;
  loading: boolean;
  failed: boolean;
}> = ({ report, loading, failed }) => {
  const status = report?.status;
  return (
    <MetricCard
      label="Sức khỏe hệ thống"
      loading={loading}
      accent={status ? HEALTH_DOT_CLASS[status] : undefined}
      value={
        failed && !report ? (
          <span className="text-lg text-[var(--text-muted)]">Chưa kiểm tra được</span>
        ) : status ? (
          <span className="flex items-center gap-2 text-2xl">
            <span className={`h-3.5 w-3.5 rounded-full ${HEALTH_DOT_CLASS[status]}`} aria-hidden="true" />
            {HEALTH_LABEL[status]}
          </span>
        ) : (
          '—'
        )
      }
    >
      {report ? (
        <div className="flex flex-wrap gap-1.5">
          {report.clusters.map((c) => (
            <Pill key={c.key} tone={HEALTH_TONE[c.status]}>
              {c.label.split(' (')[0]}
            </Pill>
          ))}
        </div>
      ) : (
        'Mở tab "Trạng thái API" để kiểm tra chi tiết.'
      )}
    </MetricCard>
  );
};

/** Biểu đồ cột ngang: số học viên của 4 khối. Thanh đo theo tỷ lệ với khối đông nhất. */
export const AgeGroupBars: React.FC<{ data: DashboardSummary['studentsByAgeGroup'] }> = ({ data }) => {
  const total = AGE_GROUP_ORDER.reduce((s, g) => s + (data[g] ?? 0), 0);
  const max = Math.max(1, ...AGE_GROUP_ORDER.map((g) => data[g] ?? 0));
  const colors: Record<AgeGroupKey, string> = {
    '3-5': 'bg-amber-400',
    '6-9': 'bg-emerald-500',
    '10-12': 'bg-sky-500',
    CAREER_ADULT: 'bg-violet-500',
  };
  return (
    <ul className="space-y-3" aria-label="Học viên theo khối tuổi">
      {AGE_GROUP_ORDER.map((g) => {
        const n = data[g] ?? 0;
        return (
          <li key={g}>
            <div className="mb-1 flex items-baseline justify-between text-sm">
              <span className="text-[var(--text-main)]">{AGE_GROUP_LABEL[g]}</span>
              <span className="tabular-nums text-[var(--text-muted)]">
                <strong className="font-semibold text-[var(--text-main)]">{n}</strong> · {percent(n, total)}%
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800" role="img" aria-label={`${AGE_GROUP_LABEL[g]}: ${n} học viên`}>
              <div className={`h-full rounded-full transition-[width] duration-500 ${colors[g]}`} style={{ width: `${(n / max) * 100}%` }} />
            </div>
          </li>
        );
      })}
      {(data.NONE ?? 0) > 0 && <li className="text-xs text-[var(--text-muted)]">{data.NONE} học viên chưa chọn khối.</li>}
    </ul>
  );
};

/** Biểu đồ cột dọc: số bài nộp 7 ngày gần nhất. Ngày không có bài không vẽ cột nhưng vẫn hiện nhãn và số 0. */
export const SubmissionBars: React.FC<{ days: DashboardSummary['submissionsLast7Days'] }> = ({ days }) => {
  const heights = barHeights(days.map((d) => d.count));
  const total = days.reduce((s, d) => s + d.count, 0);
  return (
    <div>
      <div className="flex h-44 items-end gap-2 sm:gap-3" role="img" aria-label={`Bài nộp 7 ngày gần nhất, tổng ${total}`}>
        {days.map((d, i) => (
          <div key={d.date} className="flex h-full min-w-0 flex-1 flex-col justify-end">
            <div className="mb-1 text-center text-xs font-medium tabular-nums text-[var(--text-main)]">{d.count}</div>
            <div
              className={`w-full rounded-t-md transition-[height] duration-500 ${i === days.length - 1 ? 'bg-indigo-600' : 'bg-indigo-300 dark:bg-indigo-500/60'}`}
              style={{ height: `${heights[i] * 0.85}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2 sm:gap-3">
        {days.map((d) => (
          <div key={d.date} className="min-w-0 flex-1 truncate text-center text-[11px] text-[var(--text-muted)]">
            {shortDay(d.date)}
          </div>
        ))}
      </div>
    </div>
  );
};

export const LatencyBadge: React.FC<{ ms: number }> = ({ ms }) => <span className="tabular-nums">{formatLatency(ms)}</span>;
