import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import adminClassesApi from '../axios/adminClassesApi';
import {
  describeAddResult,
  IMPORT_ACCEPT,
  parseIdentifiers,
  summarizeImport,
  validateImportFile,
} from '../pages/classManagementModel';
import { slugify } from '../pages/adminModel';
import type {
  AdminClassDetail,
  AdminClassSummary,
  CatalogStudent,
  ImportResult,
  PersonRef,
} from '../types/teacherAnalytics';
import { control, hairline, selectControl } from './adminStyles';
import { StudentProfileDrawer } from './StudentProfileDrawer';

const errorMessage = (err: unknown, fallback: string) =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;

const labelCls = 'mb-1 block text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]';
const link =
  'cursor-pointer text-xs text-[var(--text-muted)] underline hover:text-[var(--text-main)] disabled:cursor-default disabled:no-underline disabled:opacity-50';
const linkMain =
  'cursor-pointer text-sm text-indigo-600 underline disabled:cursor-default disabled:no-underline disabled:opacity-50 dark:text-indigo-400';
/** Nút viền mảnh cho hành động chính của khối (không tô màu đặc). */
const hairBtn = `cursor-pointer rounded-md border px-3 py-1 text-sm text-[var(--text-main)] hover:bg-neutral-100 disabled:cursor-default disabled:opacity-50 dark:hover:bg-neutral-800 ${hairline}`;

const Block: React.FC<{ title: string; hint?: string; children: React.ReactNode }> = ({ title, hint, children }) => (
  <section className={`rounded-md border ${hairline}`}>
    <div className={`flex items-baseline justify-between border-b px-4 py-2 ${hairline}`}>
      <h3 className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">{title}</h3>
      {hint && <span className="text-xs text-[var(--text-muted)]">{hint}</span>}
    </div>
    <div className="p-4">{children}</div>
  </section>
);

const Names: React.FC<{ title: string; items: string[] }> = ({ title, items }) =>
  items.length === 0 ? null : (
    <details className="text-xs text-[var(--text-muted)]">
      <summary className="cursor-pointer">
        {title} ({items.length})
      </summary>
      <ul className="mt-1 max-h-40 overflow-y-auto pl-4">
        {items.map((s) => (
          <li key={s} className="list-disc break-all">
            {s}
          </li>
        ))}
      </ul>
    </details>
  );

interface Props {
  classes: AdminClassSummary[];
  selectedId: string;
  onSelect: (id: string) => void;
  /** Gọi sau mọi thay đổi để trang tải lại danh sách lớp; truyền id lớp cần chọn ('' = lớp đầu tiên). */
  onChanged: (selectId?: string) => void;
}

/** Quản trị lớp (chỉ Admin): danh sách lớp bên trái, chi tiết chia khối viền mảnh bên phải. */
export const AdminClassPanel: React.FC<Props> = ({ classes, selectedId, onSelect, onChanged }) => {
  const [teachers, setTeachers] = useState<PersonRef[]>([]);
  const [detail, setDetail] = useState<AdminClassDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  const [creating, setCreating] = useState(classes.length === 0);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newTeacher, setNewTeacher] = useState('');

  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [idText, setIdText] = useState('');
  const [suggestions, setSuggestions] = useState<CatalogStudent[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const say = (text: string, error = false) => setMessage({ text, error });

  useEffect(() => {
    adminClassesApi
      .searchTeachers()
      .then(setTeachers)
      .catch(() => setTeachers([]));
  }, []);

  const load = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const d = await adminClassesApi.detail(id);
      setDetail(d);
      setName(d.name);
      setDesc(d.description);
      setTeacherId(d.teacherId);
      setConfirmDelete(false);
    } catch (err) {
      setDetail(null);
      say(errorMessage(err, 'Không tải được lớp.'), true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setImportResult(null);
    if (selectedId) void load(selectedId);
    else setDetail(null);
  }, [selectedId, load]);

  // Gợi ý học viên khi gõ một từ khóa vào ô thêm nhanh.
  useEffect(() => {
    const term = idText.trim();
    if (!selectedId || term.length < 2 || /[\s,;]/.test(term)) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(() => {
      adminClassesApi
        .searchStudents(term)
        .then((list) => !cancelled && setSuggestions(list.filter((s) => !detail?.students.some((m) => m.id === s.id))))
        .catch(() => !cancelled && setSuggestions([]));
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [idText, selectedId, detail]);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setMessage(null);
    try {
      await action();
    } catch (err) {
      say(errorMessage(err, 'Thao tác thất bại.'), true);
    } finally {
      setBusy(false);
    }
  };

  const reload = async () => {
    onChanged(selectedId);
    await load(selectedId);
  };

  const createClass = () =>
    run(async () => {
      const created = await adminClassesApi.create({ name: newName.trim(), description: newDesc.trim(), teacherId: newTeacher });
      setNewName('');
      setNewDesc('');
      setNewTeacher('');
      setCreating(false);
      say('Đã tạo lớp.');
      onChanged(created.id);
    });

  const saveInfo = () =>
    run(async () => {
      await adminClassesApi.update(selectedId, { name: name.trim(), description: desc.trim(), teacherId });
      say('Đã lưu.');
      await reload();
    });

  const toggleArchive = () =>
    run(async () => {
      await adminClassesApi.update(selectedId, { archived: !detail?.archived });
      say(detail?.archived ? 'Đã mở lại lớp.' : 'Đã lưu trữ lớp.');
      await reload();
    });

  const deleteClass = () =>
    run(async () => {
      await adminClassesApi.remove(selectedId);
      say('Đã xóa lớp.');
      setDetail(null);
      onChanged('');
    });

  const addStudents = (identifiers: string[]) =>
    run(async () => {
      if (identifiers.length === 0) return;
      const r = await adminClassesApi.addStudents(selectedId, identifiers);
      say(describeAddResult(r), r.added.length === 0 && r.notFound.length > 0);
      if (r.notFound.length === 0) setIdText('');
      setSuggestions([]);
      await reload();
    });

  const removeStudent = (id: string) =>
    run(async () => {
      await adminClassesApi.removeStudent(selectedId, id);
      await reload();
    });

  const importFile = (file: File | undefined) =>
    run(async () => {
      setImportResult(null);
      const problem = validateImportFile(file);
      if (problem || !file) {
        say(problem ?? 'Chưa chọn file.', true);
        return;
      }
      const r = await adminClassesApi.importStudents(selectedId, file);
      setImportResult(r);
      say(summarizeImport(r), r.added.length === 0 && r.totalRows > 0);
      await reload();
    }).finally(() => {
      if (fileRef.current) fileRef.current.value = '';
    });

  const infoUnchanged =
    !!detail && name.trim() === detail.name && desc.trim() === detail.description && teacherId === detail.teacherId;

  const teacherSelect = (value: string, onChange: (v: string) => void, aria: string) => (
    <select aria-label={aria} value={value} onChange={(e) => onChange(e.target.value)} className={`${selectControl} w-full`}>
      <option value="">Chọn giảng viên phụ trách</option>
      {teachers.map((t) => (
        <option key={t.id} value={t.id}>
          {t.name} ({t.email})
        </option>
      ))}
    </select>
  );

  return (
    <div className="grid gap-5 lg:grid-cols-[19rem_minmax(0,1fr)]">
      {/* Cột trái: danh sách lớp */}
      <div className="min-w-0 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">Danh sách lớp ({classes.length})</span>
          <button className={linkMain} onClick={() => setCreating((v) => !v)}>
            {creating ? 'Đóng' : 'Tạo lớp'}
          </button>
        </div>

        {creating && (
          <form
            className={`space-y-2 rounded-md border p-3 ${hairline}`}
            onSubmit={(e) => {
              e.preventDefault();
              if (newName.trim() && newTeacher) void createClass();
            }}
          >
            <label className="block">
              <span className={labelCls}>Tên lớp</span>
              <input aria-label="Tên lớp mới" value={newName} maxLength={100} onChange={(e) => setNewName(e.target.value)} className={`${control} w-full`} />
            </label>
            <label className="block">
              <span className={labelCls}>Mô tả</span>
              <input aria-label="Mô tả lớp mới" value={newDesc} maxLength={300} onChange={(e) => setNewDesc(e.target.value)} className={`${control} w-full`} />
            </label>
            <label className="block">
              <span className={labelCls}>Giảng viên phụ trách</span>
              {teacherSelect(newTeacher, setNewTeacher, 'Giảng viên phụ trách lớp mới')}
            </label>
            {teachers.length === 0 && <p className="text-xs text-[var(--text-muted)]">Chưa có tài khoản giảng viên nào để gán.</p>}
            <button type="submit" disabled={busy || !newName.trim() || !newTeacher} className={hairBtn}>
              Tạo lớp
            </button>
          </form>
        )}

        {classes.length === 0 ? (
          !creating && <p className="py-4 text-sm text-[var(--text-muted)]">Chưa có lớp nào.</p>
        ) : (
          <div className={`overflow-hidden rounded-md border ${hairline}`}>
            <table className="w-full">
              <thead>
                <tr className={`border-b ${hairline}`}>
                  {['Lớp', 'Giảng viên', 'Sĩ số'].map((h, i) => (
                    <th key={h} className={`px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)] ${i === 2 ? 'text-right' : 'text-left'}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {classes.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => onSelect(c.id)}
                    aria-selected={c.id === selectedId}
                    className={`cursor-pointer border-t first:border-t-0 ${hairline} ${
                      c.id === selectedId ? 'bg-neutral-100 dark:bg-neutral-800' : 'hover:bg-neutral-50 dark:hover:bg-neutral-900'
                    }`}
                  >
                    <td className="max-w-[8rem] truncate px-3 py-2 text-sm text-[var(--text-main)]">
                      {c.name}
                      {c.archived && <span className="ml-1 text-[10px] text-[var(--text-muted)]">lưu trữ</span>}
                    </td>
                    <td className="max-w-[6rem] truncate px-3 py-2 text-xs text-[var(--text-muted)]">{c.teacher?.name ?? '—'}</td>
                    <td className="px-3 py-2 text-right text-sm tabular-nums text-[var(--text-main)]">{c.studentCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cột phải: chi tiết lớp theo khối */}
      <div className="min-w-0 space-y-4">
        {message && (
          <p role="status" className={`text-xs ${message.error ? 'text-rose-500' : 'text-[var(--text-muted)]'}`}>
            {message.text}
          </p>
        )}

        {!selectedId ? (
          <p className="py-6 text-sm text-[var(--text-muted)]">Chọn một lớp ở danh sách bên trái, hoặc tạo lớp mới.</p>
        ) : loading && !detail ? (
          <div className="flex items-center py-6 text-sm text-[var(--text-muted)]">
            <Loader2 className="mr-2 animate-spin" size={14} /> Đang tải...
          </div>
        ) : detail ? (
          <>
            <Block title="Thông tin cơ bản">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className={labelCls}>Tên lớp</span>
                  <input aria-label="Tên lớp" value={name} maxLength={100} onChange={(e) => setName(e.target.value)} className={`${control} w-full`} />
                </label>
                <label className="block">
                  <span className={labelCls}>Slug</span>
                  <input aria-label="Slug" value={slugify(name)} readOnly tabIndex={-1} className={`${control} w-full text-[var(--text-muted)]`} />
                </label>
                <label className="block sm:col-span-2">
                  <span className={labelCls}>Mô tả</span>
                  <input aria-label="Mô tả" value={desc} maxLength={300} onChange={(e) => setDesc(e.target.value)} className={`${control} w-full`} />
                </label>
                <label className="block sm:col-span-2">
                  <span className={labelCls}>Giảng viên phụ trách</span>
                  {teacherSelect(teacherId, setTeacherId, 'Giảng viên phụ trách')}
                </label>
              </div>
              <div className="mt-3">
                <button className={hairBtn} disabled={busy || !name.trim() || !teacherId || infoUnchanged} onClick={() => void saveInfo()}>
                  Lưu thay đổi
                </button>
              </div>
            </Block>

            <Block title="Học viên trong lớp" hint={`${detail.students.length}`}>
              <form
                className="mb-2 flex flex-wrap items-center gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  void addStudents(parseIdentifiers(idText));
                }}
              >
                <input
                  aria-label="Email hoặc mã học viên"
                  placeholder="Thêm nhanh: email hoặc mã học viên"
                  value={idText}
                  onChange={(e) => setIdText(e.target.value)}
                  className={`${control} w-full max-w-xs`}
                />
                <button type="submit" disabled={busy || parseIdentifiers(idText).length === 0} className={hairBtn}>
                  Thêm
                </button>
                <label className={`${hairBtn} inline-block`}>
                  Import từ file
                  <input
                    ref={fileRef}
                    type="file"
                    accept={IMPORT_ACCEPT}
                    disabled={busy}
                    className="sr-only"
                    aria-label="Chọn file danh sách học viên"
                    onChange={(e) => void importFile(e.target.files?.[0])}
                  />
                </label>
              </form>
              <p className="mb-3 text-[11px] text-[var(--text-muted)]">.xlsx, .xls, .csv · tối đa 2MB, 500 dòng · có cột email</p>

              {suggestions.length > 0 && (
                <ul className={`mb-3 max-w-xs rounded-md border ${hairline}`}>
                  {suggestions.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void addStudents([s.email])}
                        className="flex w-full cursor-pointer justify-between px-2 py-1 text-left text-sm text-[var(--text-main)] hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      >
                        <span>{s.name}</span>
                        <span className="text-xs text-[var(--text-muted)]">{s.studentCode ?? s.email}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {importResult && (
                <div className={`mb-3 space-y-1 border-l pl-3 ${hairline}`}>
                  <p className="text-xs text-[var(--text-main)]">{summarizeImport(importResult)}</p>
                  <Names title="Đã thêm" items={importResult.added.map((a) => a.name)} />
                  <Names title="Đã có trong lớp" items={importResult.already} />
                  <Names title="Không có trong hệ thống hoặc không phải học viên" items={importResult.notFound} />
                  <Names title="Sai cú pháp email" items={importResult.invalid} />
                </div>
              )}

              {detail.students.length === 0 ? (
                <p className="py-2 text-sm text-[var(--text-muted)]">Lớp chưa có học viên.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr>
                        {['Họ tên', 'Mã số', 'Email', ''].map((h) => (
                          <th key={h} className="px-2 py-1.5 text-left text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {detail.students.map((s) => (
                        <tr
                          key={s.id}
                          onClick={() => setProfileId(s.id)}
                          className={`cursor-pointer border-t hover:bg-neutral-50 dark:hover:bg-neutral-900 ${hairline}`}
                        >
                          <td className="px-2 py-1.5 text-sm font-medium text-[var(--text-main)]">{s.name}</td>
                          <td className="px-2 py-1.5 text-xs tabular-nums text-[var(--text-muted)]">{s.studentCode ?? '—'}</td>
                          <td className="px-2 py-1.5 text-xs text-[var(--text-muted)]">{s.email}</td>
                          <td className="px-2 py-1.5 text-right" onClick={(e) => e.stopPropagation()}>
                            <button className={link} disabled={busy} onClick={() => void removeStudent(s.id)} aria-label={`Gỡ ${s.name}`}>
                              Gỡ
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Block>

            <Block title="Trạng thái lớp">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className={labelCls}>Hiện tại</span>
                  <span className="text-sm font-medium text-[var(--text-main)]">{detail.archived ? 'Lưu trữ' : 'Đang mở'}</span>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {detail.archived ? 'Giảng viên không thấy lớp này ở Tổng quan; dữ liệu vẫn được giữ.' : 'Giảng viên phụ trách thấy và giao bài được cho lớp.'}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <button className={hairBtn} disabled={busy} onClick={() => void toggleArchive()}>
                    {detail.archived ? 'Mở lại lớp' : 'Lưu trữ lớp'}
                  </button>
                  {confirmDelete ? (
                    <span className="text-xs text-[var(--text-muted)]">
                      Xóa hẳn lớp này?{' '}
                      <button className="cursor-pointer text-rose-500 underline" disabled={busy} onClick={() => void deleteClass()}>
                        Xóa
                      </button>{' '}
                      <button className={link} onClick={() => setConfirmDelete(false)}>
                        Hủy
                      </button>
                    </span>
                  ) : (
                    <button className="cursor-pointer text-xs text-rose-500 underline" disabled={busy} onClick={() => setConfirmDelete(true)}>
                      Xóa lớp
                    </button>
                  )}
                </div>
              </div>
            </Block>
          </>
        ) : null}
      </div>

      <StudentProfileDrawer userId={profileId} onClose={() => setProfileId(null)} />
    </div>
  );
};

export default AdminClassPanel;
