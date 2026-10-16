import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { UserPlus } from 'lucide-react';
import adminClassesApi from '../../axios/adminClassesApi';
import adminPortalApi from '../../axios/adminPortalApi';
import type { PortalClassRow } from '../../types/adminPortal';
import { EXERCISE_KIND, EXERCISE_STATUS, formatDateTimeVi, QUERY_STALE_MS } from '../../pages/adminPortalModel';
import { QK } from '../../pages/adminPortalQueries';
import { AdminClassPanel } from '../AdminClassPanel';
import { btnGhost, ErrorBanner, errorMessage, Pill, Skeleton, SkeletonRows } from './AdminUi';

const NAME_PREVIEW = 6;

/**
 * Phần xổ xuống ngay dưới dòng lớp (không phải popup): cột trái là giảng viên và học viên, cột phải là bài tập/lab kèm trạng thái.
 * Bấm lại dòng để thu gọn; component chỉ được render khi đang mở nên state được hủy sạch khi thu gọn.
 */
export const ClassExpandedRow: React.FC<{ cls: PortalClassRow; onAssign: (c: PortalClassRow) => void; onChanged: () => void }> = ({ cls, onAssign, onChanged }) => {
  const qc = useQueryClient();
  const [allNames, setAllNames] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const detail = useQuery({ queryKey: QK.classDetail(cls.id), queryFn: () => adminPortalApi.classDetail(cls.id), staleTime: QUERY_STALE_MS });
  const legacy = useQuery({
    queryKey: [...QK.classes, 'legacy'],
    queryFn: adminClassesApi.list,
    enabled: advanced && cls.kind === 'SCHOOL',
    staleTime: QUERY_STALE_MS,
  });
  // Ưu tiên giảng viên từ dòng bảng (cập nhật ngay khi phân công), phần còn lại lấy từ chi tiết.
  const students = detail.data?.students ?? [];
  const exercises = detail.data?.exercises ?? [];
  const shown = allNames ? students : students.slice(0, NAME_PREVIEW);

  return (
    <div className="grid gap-6 border-t border-neutral-200 bg-neutral-50 px-5 py-5 dark:border-neutral-800 dark:bg-neutral-950/40 md:grid-cols-2" style={{ animation: 'classRowIn 160ms ease-out' }}>
      <style>{'@keyframes classRowIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}'}</style>

      <div className="min-w-0 space-y-5">
        <section aria-label="Giảng viên phụ trách">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-[var(--text-main)]">Giảng viên phụ trách</h3>
            <button onClick={() => onAssign(cls)} className={btnGhost}>
              <UserPlus size={13} /> Phân công GV
            </button>
          </div>
          {cls.teachers.length === 0 ? (
            <Pill tone="yellow">Chưa gán giảng viên</Pill>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {cls.teachers.map((t, i) => (
                <Pill key={t.id} tone={i === 0 ? 'violet' : 'slate'}>
                  {t.name}
                  {i === 0 && cls.teachers.length > 1 ? ' · chính' : ''}
                </Pill>
              ))}
            </div>
          )}
        </section>

        <section aria-label="Học viên ghi danh">
          <h3 className="mb-2 text-sm font-semibold text-[var(--text-main)]">Sĩ số: {cls.studentCount} học viên</h3>
          {cls.kind === 'CAREER' && <p className="mb-2 text-xs text-[var(--text-muted)]">Mọi tài khoản Người đi làm đang hoạt động đều học đủ 3 khóa.</p>}
          <ErrorBanner message={detail.isError ? errorMessage(detail.error, 'Không tải được chi tiết lớp.') : null} onRetry={() => void detail.refetch()} />
          {detail.isPending ? (
            <div className="flex gap-1.5" role="status" aria-label="Đang tải học viên">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-6 w-24" />
              ))}
            </div>
          ) : students.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">Chưa có học viên nào.</p>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5">
              {shown.map((s) => (
                <span key={s.id} title={s.email} className="rounded-full bg-white px-2.5 py-0.5 text-xs text-[var(--text-main)] ring-1 ring-inset ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-700">
                  {s.fullName || s.email}
                </span>
              ))}
              {students.length > NAME_PREVIEW && (
                <button onClick={() => setAllNames((v) => !v)} className={btnGhost}>
                  {allNames ? 'Thu gọn' : `+${students.length - NAME_PREVIEW} người khác`}
                </button>
              )}
            </div>
          )}
        </section>

        {cls.kind === 'SCHOOL' && (
          <section aria-label="Quản lý nâng cao">
            <button onClick={() => setAdvanced((v) => !v)} aria-expanded={advanced} className={btnGhost}>
              {advanced ? 'Ẩn quản lý học viên' : 'Quản lý học viên & bài tập (thêm, xóa, nhập Excel)'}
            </button>
            {advanced && (
              <div className="mt-3">
                {legacy.isPending ? (
                  <SkeletonRows rows={3} cols={3} />
                ) : (
                  <AdminClassPanel
                    classes={(legacy.data ?? []).filter((c) => c.id === cls.id)}
                    selectedId={cls.id}
                    onSelect={() => undefined}
                    onChanged={() => {
                      void qc.invalidateQueries({ queryKey: QK.classDetail(cls.id) });
                      onChanged();
                    }}
                  />
                )}
              </div>
            )}
          </section>
        )}
      </div>

      <section aria-label="Bài tập của lớp" className="min-w-0">
        <h3 className="mb-2 text-sm font-semibold text-[var(--text-main)]">{cls.kind === 'CAREER' ? `Bài lab của khóa (${cls.exerciseCount})` : `Bài tập đã giao (${cls.exerciseCount})`}</h3>
        {detail.isPending ? (
          <div className="space-y-2" role="status" aria-label="Đang tải bài tập">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : exercises.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">Chưa có bài tập nào được giao.</p>
        ) : (
          <ul className="max-h-64 divide-y divide-neutral-100 overflow-y-auto rounded-lg border border-neutral-200 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900">
            {exercises.map((e, i) => {
              const st = EXERCISE_STATUS[e.status] ?? EXERCISE_STATUS.OPEN;
              return (
                <li key={`${e.title}-${i}`} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate text-[var(--text-main)]">{e.title}</span>
                    <span className="block text-xs text-[var(--text-muted)]">
                      {EXERCISE_KIND[e.kind] ?? e.kind}
                      {e.dueAt ? ` · hạn ${formatDateTimeVi(e.dueAt)}` : ''}
                    </span>
                  </span>
                  <Pill tone={st.tone} className="shrink-0">
                    {st.label}
                  </Pill>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};
