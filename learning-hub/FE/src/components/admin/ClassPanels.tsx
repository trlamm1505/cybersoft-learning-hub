import React, { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ClipboardPaste, ListChecks, Loader2, Plus, Search } from 'lucide-react';
import adminClassesApi from '../../axios/adminClassesApi';
import adminPortalApi from '../../axios/adminPortalApi';
import type { PortalClassDetail, PortalClassRow } from '../../types/adminPortal';
import { describeAddResult, parseIdentifiers } from '../../pages/classManagementModel';
import { ageGroupLabel, filterByText, initials, QUERY_STALE_MS, rankStudentSuggestions, unassignedTeachers } from '../../pages/adminPortalModel';
import { QK } from '../../pages/adminPortalQueries';
import { btnGhost, btnPrimary, errorMessage, inputCls, Pill, Skeleton } from './AdminUi';
import { useAssignTeachers, useClassStudents } from './useClassOps';

/**
 * Vùng mở rộng NGAY TẠI DÒNG, nằm trong luồng bình thường của trang (không absolute/fixed): mở ra thì tự tăng chiều cao và đẩy
 * nội dung bên dưới xuống, đóng lại thì thu gọn mượt. Nội dung khi đóng bị vô hiệu (inert) nên không nhận focus bàn phím.
 */
export const Collapse: React.FC<{ open: boolean; children: React.ReactNode }> = ({ open, children }) => (
  <div className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`} aria-hidden={!open}>
    <div className="min-h-0 overflow-hidden" {...(open ? {} : { inert: true })}>
      {children}
    </div>
  </div>
);

/** Nút mở/đóng một vùng mở rộng (đổi nhãn thành "Đóng" khi đang mở). */
export const PanelToggle: React.FC<{ open: boolean; onClick: () => void; label: string; controls: string }> = ({ open, onClick, label, controls }) => (
  <button onClick={onClick} aria-expanded={open} aria-controls={controls} className={btnGhost}>
    {open ? 'Đóng' : <><Plus size={13} /> {label}</>}
  </button>
);

const panelCls = 'mt-2 rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-900';

/** Hàng chọn giảng viên chưa được phân công: tick là thêm tag và lưu ngay. */
export const TeacherPanel: React.FC<{ id: string; cls: PortalClassRow; open: boolean; onClose: () => void }> = ({ id, cls, open, onClose }) => {
  const a = useAssignTeachers(cls);
  const [q, setQ] = useState('');
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);
  const list = filterByText(unassignedTeachers(a.teachers.data?.items ?? [], a.current), q);

  return (
    <Collapse open={open}>
      <div id={id} className={panelCls} role="group" aria-label="Chọn giảng viên để phân công">
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm giảng viên chưa phân công..." aria-label="Tìm giảng viên" className={`${inputCls} py-1.5 pl-8`} />
        </div>
        <ul className="mt-2 max-h-52 space-y-0.5 overflow-y-auto" aria-label="Giảng viên chưa được phân công">
          {a.teachers.isPending ? (
            [0, 1, 2].map((i) => (
              <li key={i} className="p-1">
                <Skeleton className="h-8 w-full" />
              </li>
            ))
          ) : list.length === 0 ? (
            <li className="px-3 py-4 text-center text-sm text-[var(--text-muted)]">{q ? 'Không tìm thấy giảng viên.' : 'Mọi giảng viên đang hoạt động đều đã được phân công cho lớp này.'}</li>
          ) : (
            list.map((t) => (
              <li key={t.id}>
                <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-1.5 hover:bg-neutral-50 dark:hover:bg-neutral-800">
                  <input type="checkbox" checked={false} onChange={() => a.toggle(t.id)} className="h-4 w-4 cursor-pointer accent-indigo-600" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-[var(--text-main)]">{t.fullName || t.email}</span>
                    <span className="block truncate text-xs text-[var(--text-muted)]">{t.email}</span>
                  </span>
                </label>
              </li>
            ))
          )}
        </ul>
        <div className="mt-2 flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span className="flex items-center gap-1.5">{a.pending ? <><Loader2 size={12} className="animate-spin" /> Đang lưu...</> : <><Check size={12} /> Tick là lưu ngay</>}</span>
          <button onClick={onClose} className={btnGhost}>
            Đóng
          </button>
        </div>
      </div>
    </Collapse>
  );
};

const Avatar: React.FC<{ name: string }> = ({ name }) => (
  <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
    {initials(name)}
  </span>
);

type Mode = 'pick' | 'bulk';

/** Hàng thêm học viên: chế độ "Chọn từ danh sách" (tìm kiếm + cùng khối) và "Nhập danh sách nhanh" (dán nhiều email/mã). */
export const StudentPanel: React.FC<{ id: string; cls: PortalClassRow; open: boolean; members: ReadonlySet<string>; ready: boolean; onClose: () => void }> = ({ id, cls, open, members, ready, onClose }) => {
  const qc = useQueryClient();
  const ops = useClassStudents(cls);
  const [mode, setMode] = useState<Mode>('pick');
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [sameGrade, setSameGrade] = useState(true);
  const [text, setText] = useState('');
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 200);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(() => {
    if (open && mode === 'pick') input.current?.focus();
  }, [open, mode]);

  const grade = sameGrade && cls.ageGroup ? cls.ageGroup : undefined;
  const results = useQuery({
    queryKey: [...QK.users, 'student-suggest', { q: debounced, grade: grade ?? '' }],
    queryFn: () => adminPortalApi.users({ role: 'STUDENT', status: 'ACTIVE', ageGroup: grade, q: debounced || undefined, pageSize: 60 }),
    enabled: open && mode === 'pick',
    staleTime: QUERY_STALE_MS,
  });
  // Ai đã có trong lớp thì KHÔNG bao giờ xuất hiện trong gợi ý. Chưa biết danh sách thành viên (đang tải) thì chưa gợi ý, tránh thêm trùng.
  const ranked = ready ? rankStudentSuggestions(results.data?.items ?? [], members, grade ?? null).slice(0, 12) : [];

  const bulk = useMutation({
    mutationFn: (ids: string[]) => adminClassesApi.addStudents(cls.id, ids),
    onSuccess: (res) => {
      setResult({ ok: res.added.length > 0, msg: describeAddResult(res) });
      if (res.added.length) setText('');
      void qc.invalidateQueries({ queryKey: QK.classDetail(cls.id) });
      void qc.invalidateQueries({ queryKey: QK.classes });
      void qc.invalidateQueries({ queryKey: QK.users });
      void qc.invalidateQueries({ queryKey: QK.summary });
    },
    onError: (err) => {
      const bad = (err as { response?: { data?: { mismatched?: string[] } } })?.response?.data?.mismatched;
      setResult({ ok: false, msg: `${errorMessage(err, 'Không thêm được học viên.')}${bad?.length ? `: ${bad.join(', ')}` : ''}. Chưa thêm ai.` });
    },
  });
  const ids = parseIdentifiers(text);

  const tab = (m: Mode, label: string, Icon: typeof ListChecks) => (
    <button
      role="tab"
      aria-selected={mode === m}
      onClick={() => {
        setMode(m);
        setResult(null);
      }}
      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${mode === m ? 'bg-indigo-600 font-medium text-white' : 'text-[var(--text-muted)] hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
    >
      <Icon size={14} /> {label}
    </button>
  );

  return (
    <Collapse open={open}>
      <div id={id} className={panelCls} role="group" aria-label="Thêm học viên vào lớp">
        <div role="tablist" aria-label="Cách thêm học viên" className="mb-3 flex flex-wrap gap-1.5">
          {tab('pick', 'Chọn từ danh sách', ListChecks)}
          {tab('bulk', 'Nhập danh sách nhanh', ClipboardPaste)}
        </div>

        {mode === 'pick' ? (
          <>
            <div className="relative">
              <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tên, email hoặc mã học viên..." aria-label="Tìm học viên" className={`${inputCls} py-1.5 pl-8`} />
            </div>
            {cls.ageGroup && (
              <label className="mt-2 flex cursor-pointer items-center gap-2 px-0.5 text-xs text-[var(--text-muted)]">
                <input type="checkbox" checked={sameGrade} onChange={(e) => setSameGrade(e.target.checked)} className="h-3.5 w-3.5 cursor-pointer accent-indigo-600" />
                Chỉ hiện học viên cùng khối tuổi ({ageGroupLabel(cls.ageGroup)})
              </label>
            )}
            <ul className="mt-2 max-h-60 space-y-0.5 overflow-y-auto" aria-label="Gợi ý học viên chưa vào lớp">
              {!ready || results.isPending ? (
                [0, 1, 2].map((i) => (
                  <li key={i} className="p-1">
                    <Skeleton className="h-9 w-full" />
                  </li>
                ))
              ) : ranked.length === 0 ? (
                <li className="px-3 py-5 text-center text-sm text-[var(--text-muted)]">{debounced ? 'Không tìm thấy học viên phù hợp chưa vào lớp.' : 'Không còn học viên nào để thêm.'}</li>
              ) : (
                ranked.map((s) => (
                  <li key={s.id}>
                    <button
                      onClick={() => ops.add.mutate({ id: s.id, fullName: s.fullName, email: s.email, studentCode: s.studentCode, ageGroup: s.ageGroup } as PortalClassDetail['students'][number])}
                      className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    >
                      <Avatar name={s.fullName || s.email} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-[var(--text-main)]">{s.fullName || s.email}</span>
                        <span className="block truncate text-xs text-[var(--text-muted)]">{s.email}</span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-0.5">
                        {s.ageGroup && <span className="text-[11px] text-[var(--text-muted)]">{ageGroupLabel(s.ageGroup).replace('Khối ', '').replace(' tuổi', '')}</span>}
                        {s.classCount === 0 && <Pill tone="green">Chưa vào lớp</Pill>}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </>
        ) : (
          <div className="space-y-2">
            <textarea
              rows={3}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setResult(null);
              }}
              placeholder={'Dán nhiều email hoặc mã học viên, cách nhau bằng dấu phẩy hoặc xuống dòng\nvd: an@gmail.com, C0012, binh@gmail.com'}
              aria-label="Danh sách email hoặc mã học viên"
              className={`${inputCls} resize-y`}
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-[var(--text-muted)]">{ids.length > 0 ? `${ids.length} mục hợp lệ` : 'Chưa nhập gì'}</span>
              <button onClick={() => bulk.mutate(ids)} disabled={bulk.isPending || ids.length === 0} className={btnPrimary}>
                {bulk.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Thêm tất cả
              </button>
            </div>
            {result && (
              <p role="status" className={`text-sm ${result.ok ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'}`}>
                {result.msg}
              </p>
            )}
          </div>
        )}
        <div className="mt-2 flex justify-end">
          <button onClick={onClose} className={btnGhost}>
            Đóng
          </button>
        </div>
      </div>
    </Collapse>
  );
};
