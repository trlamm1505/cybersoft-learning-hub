import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, Loader2, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import questionBankApi from '../axios/questionBankApi';
import { control, hairline, selectControl } from '../components/adminStyles';
import { useToast } from '../components/Toast';
import type { BankBand, Difficulty, Paged } from '../types/classDays';
import type { QuestionBankDetail, QuestionBankRow } from '../types/questionBank';
import { DIFFICULTY_LABEL, pageLabel } from './classDaysModel';
import { apiMessage, bandLabel, diffUpdate, formFromDetail, sourceLabel, usageLabel, validateEditForm, type EditForm } from './questionBankModel';
import { QuizBankPanel } from '../components/teacher/QuizBankPanel';

/** Hai loại đề của Ngân hàng đề (Day 30). */
const KIND_TABS: Array<{ value: 'code' | 'quiz'; label: string }> = [
  { value: 'code', label: 'Bài Code' },
  { value: 'quiz', label: 'Câu Trắc nghiệm' },
];

const BAND_TABS: Array<{ value: BankBand | ''; label: string }> = [
  { value: '', label: 'Tất cả' },
  { value: '6-9', label: 'Khối 6–9' },
  { value: '10-12', label: 'Khối 10–12' },
];

const DIFF_STYLE: Record<string, string> = {
  EASY: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  MEDIUM: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  HARD: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200',
};

const head = 'px-3 py-2 text-left text-xs font-semibold whitespace-nowrap text-[var(--text-main)]';
const cell = 'px-3 py-2 text-sm text-[var(--text-main)] align-middle';

/** Quản lý Ngân hàng đề: bảng phân trang 10 bài/trang, lọc khối + độ khó, xem/sửa chi tiết, xóa an toàn. */
export const TeacherQuestionBankPage: React.FC = () => {
  const { showToast } = useToast();
  const [q, setQ] = useState('');
  const [band, setBand] = useState<BankBand | ''>('');
  const [difficulty, setDifficulty] = useState<Difficulty | ''>('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paged<QuestionBankRow> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<QuestionBankRow | null>(null);
  const [kind, setKind] = useState<'code' | 'quiz'>('code');

  useEffect(() => setPage(1), [q, band, difficulty]);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    const t = setTimeout(() => {
      questionBankApi
        .list({ q, band, difficulty, page })
        .then((r) => !cancelled && setData(r))
        .catch((err) => !cancelled && setError(apiMessage(err, 'Không tải được Ngân hàng đề.')));
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q, band, difficulty, page, reload]);

  const refresh = () => setReload((n) => n + 1);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-main)]">Ngân hàng đề</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Bài tập code và câu trắc nghiệm theo khối, chỉ dùng để giao bài theo Ngày cho lớp hoặc đưa vào đề Cuộc thi (không hiện ở Code Playground hay trang trắc nghiệm công khai). Bài của Code Playground là kho cố định nên chỉ xem.
        </p>
      </div>

      <div role="tablist" aria-label="Loại đề" className="flex gap-1.5">
        {KIND_TABS.map((t) => (
          <button key={t.value} role="tab" aria-selected={kind === t.value} onClick={() => setKind(t.value)} className={`cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium ${kind === t.value ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900' : 'border border-neutral-300 text-[var(--text-main)] dark:border-neutral-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div role="tablist" aria-label="Lọc theo khối" className="flex gap-1.5">
          {BAND_TABS.map((t) => (
            <button key={t.value || 'all'} role="tab" aria-selected={band === t.value} onClick={() => setBand(t.value)} className={`cursor-pointer rounded-full px-3 py-1 text-xs ${band === t.value ? 'bg-indigo-600 font-medium text-white' : 'border border-neutral-300 text-[var(--text-main)] dark:border-neutral-700'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative min-w-[12rem] flex-1">
          <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" aria-hidden />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tên hoặc tag..." aria-label="Tìm trong Ngân hàng đề" className={`${control} w-full pl-8`} />
        </div>
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty | '')} aria-label="Lọc theo độ khó" className={selectControl}>
          <option value="">Mọi độ khó</option>
          <option value="EASY">Dễ (EASY)</option>
          <option value="MEDIUM">Trung bình (MEDIUM)</option>
          <option value="HARD">Khó (HARD)</option>
        </select>
      </div>

      {kind === 'quiz' ? (
        <QuizBankPanel band={band} q={q} difficulty={difficulty} />
      ) : (
        <>
      {error && <p className="text-sm text-rose-500">{error}</p>}
      {data === null && !error ? (
        <div className="flex items-center py-6 text-sm text-[var(--text-muted)]">
          <Loader2 size={14} className="mr-2 animate-spin" /> Đang tải...
        </div>
      ) : data && data.items.length === 0 ? (
        <p className="py-6 text-center text-sm text-[var(--text-muted)]">Không có bài nào khớp bộ lọc.</p>
      ) : data ? (
        <div className={`overflow-x-auto rounded-xl border ${hairline} bg-[var(--bg-card)]`}>
          <table className="min-w-full" aria-label="Danh sách Ngân hàng đề">
            <thead className="bg-[var(--bg-main)]">
              <tr>
                {['Bài tập', 'Khối', 'Độ khó', 'Nguồn', 'Sử dụng', 'Thao tác'].map((h) => (
                  <th key={h} className={head}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.items.map((r) => (
                <tr key={r.slug} className="border-t border-[var(--border-color)]">
                  <td className={cell}>
                    <div className="max-w-xs truncate font-semibold" title={r.title}>
                      {r.title}
                    </div>
                    {r.tags.length > 0 && <div className="max-w-xs truncate text-[11px] text-[var(--text-muted)]">{r.tags.slice(0, 4).join(' · ')}</div>}
                  </td>
                  <td className={cell}>
                    <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[11px] text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200">{bandLabel(r.band)}</span>
                  </td>
                  <td className={cell}>{r.difficulty && <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${DIFF_STYLE[r.difficulty] ?? ''}`}>{DIFFICULTY_LABEL[r.difficulty] ?? r.difficulty}</span>}</td>
                  <td className={`${cell} text-xs`}>{sourceLabel(r.source)}</td>
                  <td className={`${cell} text-xs text-[var(--text-muted)]`}>{usageLabel(r.usage) || '—'}</td>
                  <td className={cell}>
                    <div className="flex gap-1.5">
                      <button onClick={() => setOpenSlug(r.slug)} aria-label={`${r.editable ? 'Sửa' : 'Xem'} ${r.title}`} className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-neutral-300 px-2 py-1 text-xs dark:border-neutral-700">
                        {r.editable ? <Pencil size={12} /> : <Eye size={12} />} {r.editable ? 'Sửa' : 'Xem'}
                      </button>
                      {r.editable && (
                        <button onClick={() => setDeleting(r)} aria-label={`Xóa ${r.title}`} className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-rose-300 px-2 py-1 text-xs text-rose-700 hover:bg-rose-600 hover:text-white dark:border-rose-900 dark:text-rose-300">
                          <Trash2 size={12} /> Xóa
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {data && (
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span>{pageLabel(data.page, data.totalPages, data.total)}</span>
          <span className="flex gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={data.page <= 1} aria-label="Trang trước" className="flex cursor-pointer items-center rounded border border-neutral-300 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700">
              <ChevronLeft size={14} /> Trước
            </button>
            <button onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))} disabled={data.page >= data.totalPages} aria-label="Trang sau" className="flex cursor-pointer items-center rounded border border-neutral-300 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700">
              Sau <ChevronRight size={14} />
            </button>
          </span>
        </div>
      )}

        </>
      )}
      {openSlug && (
        <DetailDrawer
          slug={openSlug}
          onClose={() => setOpenSlug(null)}
          onSaved={() => {
            showToast('Đã lưu bài tập.', 'success');
            refresh();
          }}
        />
      )}
      {deleting && (
        <ConfirmDelete
          row={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={() => {
            setDeleting(null);
            showToast(`Đã xóa "${deleting.title}".`, 'success');
            refresh();
          }}
        />
      )}
    </div>
  );
};

const Overlay: React.FC<{ label: string; onClose: () => void; children: React.ReactNode; wide?: boolean }> = ({ label, onClose, children, wide }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto p-4" role="dialog" aria-modal="true" aria-label={label}>
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className={`relative my-6 w-full ${wide ? 'max-w-3xl' : 'max-w-md'} space-y-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-xl dark:border-neutral-800 dark:bg-neutral-950`}>{children}</div>
    </div>
  );
};

const ConfirmDelete: React.FC<{ row: QuestionBankRow; onClose: () => void; onDeleted: () => void }> = ({ row, onClose, onDeleted }) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await questionBankApi.remove(row.slug);
      onDeleted();
    } catch (err) {
      setError(apiMessage(err, 'Không xóa được bài tập.'));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Overlay label="Xác nhận xóa bài tập" onClose={() => !busy && onClose()}>
      <h3 className="text-base font-semibold text-[var(--text-main)]">Xóa bài "{row.title}"?</h3>
      <p className="text-sm text-[var(--text-muted)]">Bài bị xóa khỏi Ngân hàng đề và không khôi phục được. Bài đang được gán vào Ngày học hoặc nằm trong đề cuộc thi sẽ không xóa được.</p>
      {row.inUse && <p className="rounded-md bg-amber-50 p-2 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">{usageLabel(row.usage)}. Hệ thống sẽ từ chối xóa.</p>}
      {error && (
        <p role="alert" className="text-sm text-rose-500">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <button onClick={onClose} disabled={busy} className="cursor-pointer rounded-md border border-neutral-300 px-4 py-2 text-sm dark:border-neutral-700">
          Hủy
        </button>
        <button onClick={() => void confirm()} disabled={busy} className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-60">
          {busy && <Loader2 size={14} className="animate-spin" />} Xác nhận xóa
        </button>
      </div>
    </Overlay>
  );
};

const DetailDrawer: React.FC<{ slug: string; onClose: () => void; onSaved: () => void }> = ({ slug, onClose, onSaved }) => {
  const [detail, setDetail] = useState<QuestionBankDetail | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Chỉ nhận phản hồi của lần gọi MỚI NHẤT: chế độ StrictMode (dev) gọi effect hai lần, phản hồi thứ hai đến muộn sẽ đặt lại form
  // và xóa mất chữ người dùng đang gõ dở trong ô tiêu đề.
  useEffect(() => {
    let alive = true;
    questionBankApi
      .detail(slug)
      .then((d) => {
        if (!alive) return;
        setDetail(d);
        setForm(formFromDetail(d));
      })
      .catch((err) => {
        if (alive) setError(apiMessage(err, 'Không tải được chi tiết bài.'));
      });
    return () => {
      alive = false;
    };
  }, [slug]);

  const editable = detail?.editable === true;
  const set = (patch: Partial<EditForm>) => setForm((f) => (f ? { ...f, ...patch } : f));
  const setCase = (i: number, patch: Partial<EditForm['testCases'][number]>) => form && set({ testCases: form.testCases.map((t, j) => (j === i ? { ...t, ...patch } : t)) });

  const save = async () => {
    if (!detail || !form) return;
    const problem = validateEditForm(form);
    if (problem) return setError(problem);
    const body = diffUpdate(detail, form);
    if (Object.keys(body).length === 0) return onClose();
    setSaving(true);
    setError(null);
    try {
      await questionBankApi.update(slug, body);
      onSaved();
      onClose();
    } catch (err) {
      setError(apiMessage(err, 'Không lưu được. Vui lòng thử lại.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Overlay label="Chi tiết bài tập" onClose={() => !saving && onClose()} wide>
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-[var(--text-main)]">{editable ? 'Sửa bài tập' : 'Chi tiết bài tập'}</h3>
        <button onClick={onClose} aria-label="Đóng" className="cursor-pointer text-[var(--text-muted)]">
          <X size={18} />
        </button>
      </div>
      {!detail || !form ? (
        error ? (
          <p className="text-sm text-rose-500">{error}</p>
        ) : (
          <div className="flex items-center py-4 text-sm text-[var(--text-muted)]">
            <Loader2 size={14} className="mr-2 animate-spin" /> Đang tải...
          </div>
        )
      ) : (
        <>
          {!editable && <p className="rounded-md bg-neutral-100 p-2 text-sm text-[var(--text-muted)] dark:bg-neutral-900">Bài thuộc kho Code Playground cố định: chỉ xem, không sửa hoặc xóa tại đây.</p>}
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-xs text-[var(--text-muted)] sm:col-span-3">
              Tiêu đề
              <input value={form.title} onChange={(e) => set({ title: e.target.value })} disabled={!editable} maxLength={200} className={`${control} mt-1 w-full`} />
            </label>
            <label className="text-xs text-[var(--text-muted)]">
              Khối
              <select value={form.band} onChange={(e) => set({ band: e.target.value as EditForm['band'] })} disabled={!editable} className={`${selectControl} mt-1 w-full`}>
                <option value="6-9">K6_9 · Khối 6–9</option>
                <option value="10-12">K10_12 · Khối 10–12</option>
              </select>
            </label>
            <label className="text-xs text-[var(--text-muted)]">
              Độ khó
              <select value={form.difficulty} onChange={(e) => set({ difficulty: e.target.value as EditForm['difficulty'] })} disabled={!editable} className={`${selectControl} mt-1 w-full`}>
                <option value="EASY">EASY</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HARD">HARD</option>
              </select>
            </label>
            <div className="text-xs text-[var(--text-muted)]">
              Đang dùng
              <div className="mt-1 py-1 text-sm text-[var(--text-main)]">{usageLabel(detail.usage) || 'Chưa dùng ở đâu'}</div>
            </div>
            <label className="text-xs text-[var(--text-muted)] sm:col-span-3">
              Mô tả đề bài
              <textarea value={form.description} onChange={(e) => set({ description: e.target.value })} disabled={!editable} rows={5} className={`${control} mt-1 w-full`} />
            </label>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-[var(--text-main)]">Test case ({form.testCases.length})</h4>
              {editable && (
                <button onClick={() => set({ testCases: [...form.testCases, { input: '', expectedOutput: '', isHidden: true }] })} className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-neutral-300 px-2 py-1 text-xs dark:border-neutral-700">
                  <Plus size={12} /> Thêm test
                </button>
              )}
            </div>
            <ul className="space-y-2">
              {form.testCases.map((t, i) => (
                <li key={i} className={`grid gap-2 rounded-lg border p-2 sm:grid-cols-[1fr_1fr_auto] ${hairline}`}>
                  <label className="text-[11px] text-[var(--text-muted)]">
                    Input #{i + 1}
                    <textarea value={t.input} onChange={(e) => setCase(i, { input: e.target.value })} disabled={!editable} rows={2} className={`${control} mt-1 w-full font-mono`} />
                  </label>
                  <label className="text-[11px] text-[var(--text-muted)]">
                    Kết quả mong đợi
                    <textarea value={t.expectedOutput} onChange={(e) => setCase(i, { expectedOutput: e.target.value })} disabled={!editable} rows={2} className={`${control} mt-1 w-full font-mono`} />
                  </label>
                  <div className="flex flex-col items-start justify-between gap-1 text-xs">
                    <label className="flex items-center gap-1">
                      <input type="checkbox" checked={t.isHidden} onChange={(e) => setCase(i, { isHidden: e.target.checked })} disabled={!editable} /> Ẩn
                    </label>
                    {editable && (
                      <button onClick={() => set({ testCases: form.testCases.filter((_, j) => j !== i) })} aria-label={`Xóa test ${i + 1}`} className="cursor-pointer text-rose-600">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {error && (
            <p role="alert" className="text-sm text-rose-500">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button onClick={onClose} disabled={saving} className="cursor-pointer rounded-md border border-neutral-300 px-4 py-2 text-sm dark:border-neutral-700">
              {editable ? 'Hủy' : 'Đóng'}
            </button>
            {editable && (
              <button onClick={() => void save()} disabled={saving} className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
                {saving && <Loader2 size={14} className="animate-spin" />} Lưu thay đổi
              </button>
            )}
          </div>
        </>
      )}
    </Overlay>
  );
};

export default TeacherQuestionBankPage;
