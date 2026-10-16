import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import adminPortalApi from '../../axios/adminPortalApi';
import type { PortalClassRow } from '../../types/adminPortal';
import { EXERCISE_KIND, EXERCISE_STATUS, formatDateTimeVi, QUERY_STALE_MS } from '../../pages/adminPortalModel';
import { QK } from '../../pages/adminPortalQueries';
import { ErrorBanner, errorMessage, Pill, Skeleton } from './AdminUi';
import { RemovableTag } from './ClassPickers';
import { PanelToggle, StudentPanel, TeacherPanel } from './ClassPanels';
import { useAssignTeachers, useClassStudents } from './useClassOps';

const NAME_PREVIEW = 6;

/**
 * Phần xổ xuống ngay dưới dòng lớp (không popup che màn hình): cột trái là giảng viên và học viên chỉnh TẠI CHỖ (hộp thả xuống chọn nhanh, ✕ để gỡ), cột phải là giảng viên và học viên, cột phải là bài tập/lab kèm trạng thái.
 * Bấm lại dòng để thu gọn; component chỉ được render khi đang mở nên state được hủy sạch khi thu gọn.
 */
export type RowPanel = 'teachers' | 'students' | null;

export const ClassExpandedRow: React.FC<{ cls: PortalClassRow; panel: RowPanel; onPanel: (p: RowPanel) => void }> = ({ cls, panel, onPanel }) => {
  const [allNames, setAllNames] = useState(false);
  const detail = useQuery({ queryKey: QK.classDetail(cls.id), queryFn: () => adminPortalApi.classDetail(cls.id), staleTime: QUERY_STALE_MS });
  // Ưu tiên giảng viên từ dòng bảng (cập nhật ngay khi phân công), phần còn lại lấy từ chi tiết.
  const students = detail.data?.students ?? [];
  const exercises = detail.data?.exercises ?? [];
  const shown = allNames ? students : students.slice(0, NAME_PREVIEW);
  const memberIds = new Set(students.map((x) => x.id));
  const teacherOps = useAssignTeachers(cls);
  const studentOps = useClassStudents(cls);

  return (
    <div className="grid gap-6 border-t border-neutral-200 bg-neutral-50 px-5 py-5 dark:border-neutral-800 dark:bg-neutral-950/40 md:grid-cols-2" style={{ animation: 'classRowIn 160ms ease-out' }}>
      <style>{'@keyframes classRowIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}'}</style>

      <div className="min-w-0 space-y-5">
        <section aria-label="Giảng viên phụ trách">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-[var(--text-main)]">Giảng viên phụ trách</h3>
            <PanelToggle open={panel === 'teachers'} onClick={() => onPanel(panel === 'teachers' ? null : 'teachers')} label="Phân công GV" controls={`teacher-panel-${cls.id}`} />
          </div>
          {cls.teachers.length === 0 ? (
            <Pill tone="yellow">Chưa gán giảng viên</Pill>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {cls.teachers.map((t, i) => (
                <RemovableTag
                  key={t.id}
                  label={`${t.name}${i === 0 && cls.teachers.length > 1 ? ' · chính' : ''}${t.locked ? ' · Đã khóa' : ''}`}
                  tone={t.locked ? 'locked' : i === 0 ? 'violet' : 'slate'}
                  title={t.locked ? 'Tài khoản đang bị khóa' : undefined}
                  removeLabel={`Gỡ ${t.name} khỏi lớp`}
                  disabledReason={cls.teachers.length <= 1 ? 'Lớp cần ít nhất một giảng viên' : undefined}
                  onRemove={() => teacherOps.remove(t.id)}
                />
              ))}
            </div>
          )}
          <TeacherPanel id={`teacher-panel-${cls.id}`} cls={cls} open={panel === 'teachers'} onClose={() => onPanel(null)} />
        </section>

        <section aria-label="Học viên ghi danh">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-[var(--text-main)]">Sĩ số: {cls.studentCount} học viên</h3>
            {cls.kind === 'SCHOOL' && <PanelToggle open={panel === 'students'} onClick={() => onPanel(panel === 'students' ? null : 'students')} label="Thêm học viên" controls={`student-panel-${cls.id}`} />}
          </div>
          {cls.kind === 'SCHOOL' && <StudentPanel id={`student-panel-${cls.id}`} cls={cls} open={panel === 'students'} members={memberIds} ready={!!detail.data} onClose={() => onPanel(null)} />}
          {cls.kind === 'CAREER' && <p className="mb-2 text-xs text-[var(--text-muted)]">Mọi tài khoản Người đi làm đang hoạt động đều học đủ 3 khóa, nên không thêm/gỡ thủ công.</p>}
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
                <RemovableTag
                  key={s.id}
                  label={s.fullName || s.email}
                  tone="plain"
                  title={s.email}
                  removeLabel={`Gỡ ${s.fullName || s.email} khỏi lớp`}
                  onRemove={cls.kind === 'SCHOOL' ? () => studentOps.remove.mutate(s) : undefined}
                />
              ))}
              {students.length > NAME_PREVIEW && (
                <button onClick={() => setAllNames((v) => !v)} className="cursor-pointer rounded-md px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-500/10">
                  {allNames ? 'Thu gọn' : `+${students.length - NAME_PREVIEW} người khác`}
                </button>
              )}
            </div>
          )}
        </section>
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
