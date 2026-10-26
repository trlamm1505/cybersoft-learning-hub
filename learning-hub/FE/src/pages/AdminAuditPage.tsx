import React, { useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import adminPortalApi from '../axios/adminPortalApi';
import { btnGhost, btnSecondary, card, ErrorBanner, errorMessage, inputCls, Modal, PageHeader, Pill, selectCls, SkeletonRows } from '../components/admin/AdminUi';
import type { AuditAction, AuditLogItem } from '../types/adminPortal';
import { pageInfo } from './adminModel';
import { AUDIT_FILTERS, AUDIT_TONE, auditActionLabel, auditTargetLabel, buildDiffView, diffSubject, formatDateTimeVi, prettyJson, QUERY_STALE_MS, type DiffCell } from './adminPortalModel';
import { QK } from './adminPortalQueries';

const PAGE_SIZE = 20;
const th = 'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] whitespace-nowrap';
const td = 'px-4 py-3 text-sm text-[var(--text-main)] align-middle';

const Cell: React.FC<{ cell: DiffCell; side: 'before' | 'after' }> = ({ cell, side }) => {
  if (cell.type === 'none') return <span className="text-sm italic text-[var(--text-muted)]">(trống)</span>;
  const cls =
    side === 'after'
      ? 'bg-emerald-50 text-emerald-800 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/30'
      : 'bg-neutral-100 text-neutral-700 ring-neutral-400/20 dark:bg-neutral-800 dark:text-neutral-300 dark:ring-neutral-600/40';
  const values = cell.type === 'tags' ? cell.values : [cell.value];
  if (values.length === 0) return <span className="text-sm italic text-[var(--text-muted)]">(không có ai)</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {values.map((v, i) => (
        <span key={`${v}-${i}`} className={`inline-flex max-w-full items-start gap-1 break-words rounded-lg px-2.5 py-1 text-sm font-medium ring-1 ring-inset ${cls}`}>
          {side === 'after' && <span aria-hidden="true">+</span>}
          <span className="min-w-0 break-words">{v}</span>
        </span>
      ))}
    </div>
  );
};

/**
 * Thẻ so sánh trực quan bằng tiếng Việt: cột "Trước đây" và "Hiện tại" cho từng thay đổi nghiệp vụ (giảng viên, trạng thái, cấu hình).
 * Không in mã nội bộ; nút nhỏ [Xem mã JSON] mới hiện dữ liệu thô cho ai muốn soi.
 */
export const DiffView: React.FC<{ item: Pick<AuditLogItem, 'action' | 'targetType' | 'targetId' | 'diff'> }> = ({ item }) => {
  const [raw, setRaw] = useState(false);
  const rows = buildDiffView(item);
  const subject = diffSubject(item);
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-[var(--text-muted)]">{subject ?? (rows.length ? 'Các thay đổi trong thao tác này:' : '')}</p>
        <button onClick={() => setRaw((v) => !v)} aria-pressed={raw} className="shrink-0 cursor-pointer rounded-md border border-neutral-300 px-2 py-0.5 font-mono text-[11px] text-[var(--text-muted)] hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800">
          {raw ? 'Ẩn mã JSON' : 'Xem mã JSON'}
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-300 px-4 py-6 text-center text-sm text-[var(--text-muted)] dark:border-neutral-700">Không có thay đổi nghiệp vụ nào để hiển thị.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((r, i) => (
            <section key={`${r.label}-${i}`} className="rounded-xl border border-neutral-200 p-3.5 dark:border-neutral-800" aria-label={r.label}>
              <h3 className="mb-2.5 text-sm font-semibold text-[var(--text-main)]">{r.label}</h3>
              <div className="grid items-start gap-3 sm:grid-cols-[1fr_auto_1fr]">
                <div className="min-w-0">
                  <div className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Trước đây</div>
                  <Cell cell={r.before} side="before" />
                </div>
                <div aria-hidden="true" className="hidden self-center text-lg text-[var(--text-muted)] sm:block">
                  →
                </div>
                <div className="min-w-0">
                  <div className="mb-1 text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Hiện tại</div>
                  <Cell cell={r.after} side="after" />
                </div>
              </div>
            </section>
          ))}
        </div>
      )}

      {raw && (
        <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-neutral-200 bg-neutral-50 p-3 font-mono text-xs leading-relaxed text-neutral-800 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200">
          {prettyJson(item.diff)}
        </pre>
      )}
    </div>
  );
};

/** Nhật ký hoạt động (/admin/audit): ai làm gì, lúc nào, với đối tượng nào; mở popup xem chi tiết thay đổi (diff). */
export const AdminAuditPage: React.FC = () => {
  const [action, setAction] = useState<'' | AuditAction>('');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<AuditLogItem | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search.trim());
      setPage(1);
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  const q = useQuery({
    queryKey: [...QK.audit, { action, actor: debounced, page }],
    queryFn: () => adminPortalApi.auditLogs({ page, pageSize: PAGE_SIZE, action: action || undefined, actorEmail: debounced || undefined }),
    placeholderData: keepPreviousData,
    staleTime: QUERY_STALE_MS,
  });
  const items = q.data?.items ?? [];
  const info = q.data ? pageInfo(q.data.page, q.data.pageSize || PAGE_SIZE, q.data.total) : null;

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <PageHeader title="Nhật ký hoạt động" subtitle="Mọi thao tác quản trị đều được ghi lại và không thể sửa hay xóa." />

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_14rem]">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input aria-label="Tìm theo email admin" placeholder="Tìm theo email admin..." value={search} onChange={(e) => setSearch(e.target.value)} className={`${inputCls} pl-9`} />
        </div>
        <select
          aria-label="Lọc theo hành động"
          value={action}
          onChange={(e) => {
            setAction(e.target.value as '' | AuditAction);
            setPage(1);
          }}
          className={selectCls}
        >
          {AUDIT_FILTERS.map((f) => (
            <option key={f.key} value={f.key}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      <ErrorBanner message={q.isError ? errorMessage(q.error, 'Không tải được nhật ký.') : null} onRetry={() => void q.refetch()} />

      <div className={`${card} overflow-hidden`}>
        {q.isPending ? (
          <SkeletonRows rows={8} cols={5} />
        ) : items.length === 0 ? (
          <p className="px-6 py-14 text-center text-sm text-[var(--text-muted)]">{debounced || action ? 'Không có bản ghi phù hợp.' : 'Chưa có hoạt động nào được ghi.'}</p>
        ) : (
          <div className={`overflow-x-auto ${q.isPlaceholderData ? 'opacity-60 transition-opacity' : ''}`}>
            <table className="min-w-full">
              <thead className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950/50">
                <tr>
                  {['Thời gian', 'Admin', 'Hành động', 'Đối tượng', ''].map((h) => (
                    <th key={h || 'diff'} className={th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {items.map((it) => (
                  <tr key={it.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                    <td className={`${td} whitespace-nowrap tabular-nums text-[var(--text-muted)]`}>{formatDateTimeVi(it.timestamp)}</td>
                    <td className={td}>{it.actorEmail || '—'}</td>
                    <td className={td}>
                      <Pill tone={AUDIT_TONE[it.action] ?? 'slate'}>{auditActionLabel(it)}</Pill>
                    </td>
                    <td className={`${td} max-w-xs truncate`}>{auditTargetLabel(it)}</td>
                    <td className={`${td} text-right`}>
                      <button onClick={() => setOpen(it)} className={btnGhost}>
                        Xem chi tiết thay đổi (Diff)
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {info && items.length > 0 && (
          <div className="flex items-center justify-between border-t border-neutral-200 px-4 py-3 text-sm text-[var(--text-muted)] dark:border-neutral-800">
            <span>{info.label}</span>
            <span className="flex gap-2">
              <button className={btnSecondary} disabled={!info.hasPrev} onClick={() => setPage((p) => p - 1)}>
                Trước
              </button>
              <button className={btnSecondary} disabled={!info.hasNext} onClick={() => setPage((p) => p + 1)}>
                Sau
              </button>
            </span>
          </div>
        )}
      </div>

      {open && (
        <Modal
          title={`${auditActionLabel(open)} · ${auditTargetLabel(open)}`}
          width="max-w-3xl"
          onClose={() => setOpen(null)}
          footer={
            <button onClick={() => setOpen(null)} className={btnSecondary}>
              Đóng
            </button>
          }
        >
          <p className="mb-3 text-xs text-[var(--text-muted)]">
            {open.actorEmail} · {formatDateTimeVi(open.timestamp)}
          </p>
          <DiffView item={open} />
        </Modal>
      )}
    </div>
  );
};

export default AdminAuditPage;
