import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, Plus, Search } from 'lucide-react';
import adminPortalApi from '../axios/adminPortalApi';
import { CreateClassModal } from '../components/admin/ClassModals';
import { ClassExpandedRow, type RowPanel } from '../components/admin/ClassExpandedRow';
import { ClassStatusBadge } from '../components/admin/ClassStatusBadge';
import { btnGhost, btnPrimary, card, ConfirmModal, ErrorBanner, errorMessage, inputCls, PageHeader, Pill, selectCls, SkeletonRows } from '../components/admin/AdminUi';
import { useToast } from '../components/Toast';
import type { PortalClassRow } from '../types/adminPortal';
import {
  AGE_GROUP_SHORT,
  CLASS_AGE_FILTERS,
  CLASS_STATUS,
  classActionLabel,
  countByAgeGroup,
  filterClasses,
  QUERY_STALE_MS,
  type ClassFilter,
} from './adminPortalModel';
import { QK } from './adminPortalQueries';

const th = 'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] whitespace-nowrap';
const td = 'px-4 py-3 text-sm text-[var(--text-main)] align-middle';

/**
 * Lớp học & Khóa học (/admin/classes): quản lý cả lớp phổ thông (3–5, 6–9, 10–12) và 3 khóa chuyên ngành của Người đi làm.
 * Bấm một dòng để xổ chi tiết ngay bên dưới (bấm lại để thu gọn), phân công nhiều giảng viên, lưu trữ/kích hoạt lại.
 */
export const AdminClassesPage: React.FC = () => {
  const qc = useQueryClient();
  const { showToast } = useToast();
  const [filter, setFilter] = useState<ClassFilter>({ ageGroup: '', status: '', q: '' });
  const [creating, setCreating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [panel, setPanel] = useState<RowPanel>(null);
  const [archiving, setArchiving] = useState<PortalClassRow | null>(null);

  const rows = useQuery({ queryKey: QK.classes, queryFn: adminPortalApi.classes, staleTime: QUERY_STALE_MS });
  const all = useMemo(() => rows.data ?? [], [rows.data]);
  const visible = useMemo(() => filterClasses(all, filter), [all, filter]);
  const counts = useMemo(() => countByAgeGroup(all), [all]);

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: QK.classes });
    void qc.invalidateQueries({ queryKey: QK.summary });
    void qc.invalidateQueries({ queryKey: QK.audit });
  };

  const archive = useMutation({
    mutationFn: (c: PortalClassRow) => adminPortalApi.setArchived(c.id, c.status === 'OPEN'),
    onSuccess: (_r, c) => {
      showToast(c.status === 'OPEN' ? `Đã chuyển "${c.name}" vào Lưu trữ.` : `Đã kích hoạt lại "${c.name}".`, 'success');
      setArchiving(null);
      refresh();
    },
    onError: (err) => {
      showToast(errorMessage(err, 'Không đổi được trạng thái lớp.'), 'error');
      setArchiving(null);
    },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <PageHeader
        title="Lớp học & Khóa học"
        subtitle="Gồm lớp phổ thông (3–5, 6–9, 10–12) và 3 khóa chuyên ngành của Người đi làm. Phân công giảng viên và thêm/gỡ học viên ngay tại dòng, có hiệu lực tức thì."
        actions={
          <button onClick={() => setCreating(true)} className={btnPrimary}>
            <Plus size={16} /> Tạo lớp mới
          </button>
        }
      />

      <div role="tablist" aria-label="Lọc theo khối đào tạo" className="flex flex-wrap gap-1.5">
        {CLASS_AGE_FILTERS.map((f) => {
          const on = filter.ageGroup === f.key;
          return (
            <button
              key={f.key || 'all'}
              role="tab"
              aria-selected={on}
              onClick={() => setFilter((cur) => ({ ...cur, ageGroup: f.key }))}
              className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                on
                  ? 'border-indigo-600 bg-indigo-600 font-medium text-white'
                  : 'border-neutral-300 bg-white text-[var(--text-main)] hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800'
              }`}
            >
              {f.label} <span className={`ml-1 tabular-nums ${on ? 'text-indigo-100' : 'text-[var(--text-muted)]'}`}>{counts[f.key] ?? 0}</span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_14rem]">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            aria-label="Tìm theo tên lớp, mã lớp hoặc giảng viên"
            placeholder="Tìm theo tên lớp, mã lớp hoặc giảng viên..."
            value={filter.q}
            onChange={(e) => setFilter((cur) => ({ ...cur, q: e.target.value }))}
            className={`${inputCls} pl-9`}
          />
        </div>
        <select aria-label="Lọc theo trạng thái" value={filter.status} onChange={(e) => setFilter((cur) => ({ ...cur, status: e.target.value as ClassFilter['status'] }))} className={selectCls}>
          <option value="">Mọi trạng thái</option>
          <option value="OPEN">{CLASS_STATUS.OPEN.label}</option>
          <option value="ARCHIVED">{CLASS_STATUS.ARCHIVED.label}</option>
        </select>
      </div>

      <ErrorBanner message={rows.isError ? errorMessage(rows.error, 'Không tải được danh sách lớp.') : null} onRetry={() => void rows.refetch()} />

      <div className={`${card} overflow-hidden`}>
        {rows.isPending ? (
          <SkeletonRows rows={6} cols={5} />
        ) : visible.length === 0 ? (
          <p className="px-6 py-14 text-center text-sm text-[var(--text-muted)]">{all.length === 0 ? 'Chưa có lớp nào. Bấm "Tạo lớp mới" để bắt đầu.' : 'Không có lớp nào phù hợp bộ lọc.'}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] table-fixed">
              <colgroup>
                <col className="w-[32%]" />
                <col className="w-[12%]" />
                <col className="w-[22%]" />
                <col className="w-[14%]" />
                <col className="w-[20%]" />
              </colgroup>
              <thead className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950/50">
                <tr>
                  <th className={th}>Tên lớp & Mã lớp</th>
                  <th className={th}>Khối tuổi</th>
                  <th className={th}>Giảng viên</th>
                  <th className={th}>Trạng thái</th>
                  <th className={`${th} text-right`}>Thao tác</th>
                </tr>
              </thead>
              {visible.map((c) => {
                const open = expandedId === c.id;
                const toggleRow = () => {
                  setExpandedId(open ? null : c.id);
                  setPanel(null);
                };
                return (
                  <tbody key={c.id} className="border-t border-neutral-100 first:border-t-0 dark:border-neutral-800">
                    <tr onClick={toggleRow} className={`cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/40 ${open ? 'bg-neutral-50 dark:bg-neutral-800/30' : ''} ${c.status === 'ARCHIVED' ? 'opacity-80' : ''}`}>
                      <td className={td}>
                        <div className="flex items-start gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRow();
                            }}
                            aria-expanded={open}
                            aria-label={open ? `Thu gọn ${c.name}` : `Xem chi tiết ${c.name}`}
                            className="mt-0.5 shrink-0 cursor-pointer rounded p-0.5 text-[var(--text-muted)] hover:bg-neutral-200 dark:hover:bg-neutral-700"
                          >
                            {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </button>
                          <div className="min-w-0">
                            <div className="truncate font-medium" title={c.name}>
                              {c.name}
                            </div>
                            <div className="truncate text-xs text-[var(--text-muted)]">
                              <span className="font-mono">{c.code ?? '—'}</span> · {c.studentCount} học viên · {c.exerciseCount} bài
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className={`${td} text-[var(--text-muted)]`}>{c.ageGroup ? AGE_GROUP_SHORT[c.ageGroup] : '—'}</td>
                      <td className={td}>
                        {c.teachers.length === 0 ? (
                          <Pill tone="yellow">Chưa gán</Pill>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {c.teachers.slice(0, 2).map((t, i) => (
                              <Pill key={t.id} tone={i === 0 ? 'violet' : 'slate'} className="max-w-full truncate">
                                {t.name}
                              </Pill>
                            ))}
                            {c.teachers.length > 2 && <Pill tone="slate">+{c.teachers.length - 2}</Pill>}
                          </div>
                        )}
                      </td>
                      <td className={td}>
                        <ClassStatusBadge status={c.status} fixed />
                      </td>
                      <td className={`${td} text-right`} onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1 whitespace-nowrap">
                          <button onClick={toggleRow} aria-expanded={open} className={`${btnGhost} w-[72px] justify-center`}>
                            Chi tiết {open ? '▴' : '▾'}
                          </button>
                          <button
                            onClick={() => {
                              setExpandedId(c.id);
                              setPanel(open && panel === 'teachers' ? null : 'teachers');
                            }}
                            className={`${btnGhost} w-[74px] justify-center`}
                          >
                            Phân công
                          </button>
                          <button onClick={() => setArchiving(c)} className={`${btnGhost} w-[78px] justify-center`}>
                            {c.status === 'OPEN' ? 'Lưu trữ' : 'Kích hoạt'}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {open && (
                      <tr>
                        <td colSpan={5} className="p-0">
                          <ClassExpandedRow cls={c} panel={panel} onPanel={setPanel} />
                        </td>
                      </tr>
                    )}
                  </tbody>
                );
              })}
            </table>
          </div>
        )}
      </div>

      {creating && (
        <CreateClassModal
          onClose={() => setCreating(false)}
          onDone={(m) => {
            setCreating(false);
            showToast(m, 'success');
            refresh();
          }}
        />
      )}
      {archiving && (
        <ConfirmModal
          title={archiving.status === 'OPEN' ? 'Chuyển vào Lưu trữ?' : 'Kích hoạt lại lớp?'}
          confirmLabel={classActionLabel(archiving.status)}
          danger={archiving.status === 'OPEN'}
          busy={archive.isPending}
          onClose={() => setArchiving(null)}
          onConfirm={() => archive.mutate(archiving)}
          message={
            archiving.status === 'OPEN' ? (
              <>
                <strong>{archiving.name}</strong> sẽ kết thúc: {CLASS_STATUS.ARCHIVED.hint.replace('Lớp đã kết thúc: ', '').toLowerCase()} Có thể kích hoạt lại bất cứ lúc nào.
              </>
            ) : (
              <>
                <strong>{archiving.name}</strong> hoạt động trở lại: {CLASS_STATUS.OPEN.hint.replace('Lớp đang trong kỳ học: ', '')}
              </>
            )
          }
        />
      )}
    </div>
  );
};

export default AdminClassesPage;
