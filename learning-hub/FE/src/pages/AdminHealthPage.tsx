import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, RefreshCw } from 'lucide-react';
import { btnPrimary, card, ErrorBanner, PageHeader, Pill, Skeleton } from '../components/admin/AdminUi';
import { useToast } from '../components/Toast';
import type { ClusterHealth, HealthReport } from '../types/adminPortal';
import { formatDateTimeVi, formatLatency, HEALTH_DOT_CLASS, HEALTH_LABEL, HEALTH_LIGHT, HEALTH_TONE } from './adminPortalModel';
import { useHealthReport } from './adminPortalQueries';

const ORDER: ClusterHealth['key'][] = ['auth_db', 'core_engine', 'ai_gateway', 'submissions_classes', 'contests'];
const TITLE: Record<ClusterHealth['key'], string> = {
  auth_db: 'Auth & Database',
  core_engine: 'In-Memory SQLite',
  ai_gateway: 'AI Gateway',
  submissions_classes: 'Submissions & Classes',
  contests: 'Contests',
};

export const ClusterCard: React.FC<{ cluster: ClusterHealth }> = ({ cluster }) => (
  <article className={`${card} flex flex-col gap-3 p-5`} aria-label={TITLE[cluster.key]}>
    <div className="flex items-center justify-between gap-2">
      <h2 className="text-base font-semibold text-[var(--text-main)]">{TITLE[cluster.key]}</h2>
      <Pill tone={HEALTH_TONE[cluster.status]}>{HEALTH_LABEL[cluster.status]}</Pill>
    </div>
    <div className="flex items-center gap-3">
      <span className="text-4xl leading-none" role="img" aria-label={HEALTH_LABEL[cluster.status]}>
        {HEALTH_LIGHT[cluster.status]}
      </span>
      <div>
        <div className="text-sm text-[var(--text-muted)]">Latency</div>
        <div className="text-xl font-semibold tabular-nums text-[var(--text-main)]">{formatLatency(cluster.latencyMs)}</div>
      </div>
    </div>
    <p className="text-sm leading-relaxed text-[var(--text-muted)]">{cluster.detail}</p>
  </article>
);

export const HealthGrid: React.FC<{ report: HealthReport }> = ({ report }) => (
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
    {ORDER.map((k) => report.clusters.find((c) => c.key === k)).filter((c): c is ClusterHealth => !!c).map((c) => (
      <ClusterCard key={c.key} cluster={c} />
    ))}
  </div>
);

/** Trạng thái API (/admin/health): kiểm tra song song 5 cụm chức năng. BE giới hạn 1 lần / 10 giây cho mỗi Admin. */
export const AdminHealthPage: React.FC = () => {
  const qc = useQueryClient();
  const { showToast } = useToast();
  const health = useHealthReport();
  const report = health.data;

  const run = async () => {
    const res = await health.refetch();
    if (res.isError) {
      const status = (res.error as { response?: { status?: number } })?.response?.status;
      showToast(status === 429 ? 'Vui lòng đợi vài giây giữa hai lần kiểm tra (giới hạn 1 lần / 10 giây).' : 'Không chạy được kiểm tra hệ thống.', status === 429 ? 'warning' : 'error');
      if (status === 429) void qc.cancelQueries({ queryKey: ['admin', 'health'] });
    }
  };

  const spinning = health.isFetching;
  const tooFast = health.isError && (health.error as { response?: { status?: number } })?.response?.status === 429;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Trạng thái API"
        subtitle={report ? `Lần kiểm tra gần nhất: ${formatDateTimeVi(report.checkedAt)}` : 'Kiểm tra song song 5 cụm chức năng, mỗi cụm tối đa 2 giây.'}
        actions={
          <button onClick={() => void run()} disabled={spinning} className={btnPrimary}>
            {spinning ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} Kiểm tra toàn bộ hệ thống ngay
          </button>
        }
      />

      {report && (
        <div className="flex items-center gap-2 text-sm text-[var(--text-main)]" role="status">
          <span className={`h-3 w-3 rounded-full ${HEALTH_DOT_CLASS[report.status]}`} aria-hidden="true" />
          Tổng thể: <strong>{HEALTH_LABEL[report.status]}</strong>
        </div>
      )}

      <ErrorBanner
        message={health.isError && !tooFast ? 'Không chạy được kiểm tra hệ thống. Máy chủ có thể đang gián đoạn.' : tooFast ? 'Bạn vừa kiểm tra xong. Vui lòng đợi khoảng 10 giây rồi thử lại.' : null}
      />

      {health.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" role="status" aria-label="Đang kiểm tra hệ thống">
          {ORDER.map((k) => (
            <div key={k} className={`${card} space-y-3 p-5`}>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      ) : report ? (
        <div className={spinning ? 'opacity-70 transition-opacity' : 'transition-opacity'}>
          <HealthGrid report={report} />
        </div>
      ) : null}
    </div>
  );
};

export default AdminHealthPage;
