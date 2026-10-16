import React from 'react';
import { Link } from 'react-router-dom';
import { AgeGroupBars, HealthSummaryCard, MetricCard, SubmissionBars } from '../components/admin/DashboardParts';
import { card, ErrorBanner, errorMessage, PageHeader, Pill, Skeleton } from '../components/admin/AdminUi';
import { AGE_GROUP_LABEL, AGE_GROUP_ORDER, formatDateTimeVi, ROLE_TONE } from './adminPortalModel';
import { useDashboardSummary, useHealthReport } from './adminPortalQueries';

const ROLE_NAME: Record<string, string> = { STUDENT: 'Học viên', TEACHER: 'Giảng viên', ADMIN: 'Quản trị' };

/**
 * Tổng quan (/admin/dashboard). Số liệu tự làm mới mỗi 30 giây bằng React Query nên không cần F5; lần tải đầu hiện khung xương,
 * các lần sau giữ nguyên dữ liệu cũ trong lúc tải để không nhấp nháy.
 */
export const AdminDashboardPage: React.FC = () => {
  const summary = useDashboardSummary();
  const health = useHealthReport({ autoRefresh: true });
  const s = summary.data;
  const loading = summary.isPending;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Tổng quan hệ thống"
        subtitle={s ? `Cập nhật lúc ${formatDateTimeVi(s.generatedAt)} · tự làm mới mỗi 30 giây` : 'Đang tải số liệu...'}
      />
      <ErrorBanner message={summary.isError ? errorMessage(summary.error, 'Không tải được số liệu tổng quan.') : null} onRetry={() => void summary.refetch()} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Tổng người dùng" value={s?.totalUsers} loading={loading}>
          {s && (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {(['STUDENT', 'TEACHER', 'ADMIN'] as const).map((r) => (
                  <Pill key={r} tone={ROLE_TONE[r]}>
                    {ROLE_NAME[r]} {s.byRole[r] ?? 0}
                  </Pill>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {AGE_GROUP_ORDER.map((g) => (
                  <Pill key={g} tone="slate">
                    {AGE_GROUP_LABEL[g].replace('Khối ', '').replace(' tuổi', '')}: {s.studentsByAgeGroup[g] ?? 0}
                  </Pill>
                ))}
              </div>
              {s.lockedUsers > 0 && <div className="text-rose-600 dark:text-rose-300">{s.lockedUsers} tài khoản đang bị khóa</div>}
            </div>
          )}
        </MetricCard>

        <MetricCard label="Lớp học đang mở" value={s?.openClasses} loading={loading}>
          {s && (
            <>
              {s.totalClasses - s.openClasses} lớp đã lưu trữ ·{' '}
              <Link to="/admin/classes" className="font-medium text-indigo-700 underline dark:text-indigo-300">
                Quản lý
              </Link>
            </>
          )}
        </MetricCard>

        <MetricCard label="Bài nộp hôm nay" value={s?.submissionsToday} loading={loading}>
          {s && (
            <div className="flex items-center gap-2">
              <Pill tone={s.submissionsToday === 0 ? 'slate' : s.completionRateToday >= 60 ? 'green' : s.completionRateToday >= 30 ? 'yellow' : 'red'}>
                Hoàn thành {s.completionRateToday}%
              </Pill>
              <span>{s.acToday} bài đạt</span>
            </div>
          )}
        </MetricCard>

        <HealthSummaryCard report={health.data} loading={health.isPending} failed={health.isError} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className={`${card} p-5`} aria-label="Học viên theo khối">
          <h2 className="mb-4 text-base font-semibold text-[var(--text-main)]">Học viên theo khối</h2>
          {s ? <AgeGroupBars data={s.studentsByAgeGroup} /> : <ChartSkeleton />}
        </section>
        <section className={`${card} p-5`} aria-label="Bài nộp 7 ngày">
          <h2 className="mb-4 text-base font-semibold text-[var(--text-main)]">Bài nộp 7 ngày gần nhất</h2>
          {s ? <SubmissionBars days={s.submissionsLast7Days} /> : <ChartSkeleton />}
        </section>
      </div>
    </div>
  );
};

const ChartSkeleton: React.FC = () => (
  <div role="status" aria-label="Đang tải biểu đồ" className="space-y-3">
    {Array.from({ length: 4 }, (_, i) => (
      <Skeleton key={i} className="h-7 w-full" />
    ))}
  </div>
);

export default AdminDashboardPage;
