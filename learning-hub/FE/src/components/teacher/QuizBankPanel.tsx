import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Pencil, Trash2, X } from 'lucide-react';
import questionBankApi from '../../axios/questionBankApi';
import { control, hairline } from '../adminStyles';
import { useToast } from '../Toast';
import type { BankBand, Difficulty, Paged } from '../../types/classDays';
import type { QuizBankDetail, QuizBankRow } from '../../types/questionBank';
import { DIFFICULTY_LABEL, pageLabel } from '../../pages/classDaysModel';
import { apiMessage, bandLabel, usageLabel } from '../../pages/questionBankModel';
import { quizFormFromDetail, quizPayload, type QuizForm } from '../../pages/quizBankModel';
import { QuizQuestionForm } from './QuizQuestionForm';

const head = 'px-3 py-2 text-left text-xs font-semibold whitespace-nowrap text-[var(--text-main)]';
const cell = 'px-3 py-2 text-sm text-[var(--text-main)] align-middle';

/**
 * Tab "Câu Trắc nghiệm" của Ngân hàng đề (Day 30): câu hỏi giảng viên soạn cho Khối 6–9 / 10–12, chỉ dùng cho bài giao
 * của lớp và đề cuộc thi. Sửa/xóa câu của mình; câu đang dùng thì không xóa và không đổi khối được (máy chủ trả 409).
 */
export const QuizBankPanel: React.FC<{ band: BankBand | ''; q: string; difficulty: Difficulty | '' }> = ({ band, q, difficulty }) => {
  const { showToast } = useToast();
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paged<QuizBankRow> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [editing, setEditing] = useState<QuizBankDetail | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => setPage(1), [q, band, difficulty]);
  useEffect(() => {
    let cancelled = false;
    setError(null);
    const t = setTimeout(() => {
      questionBankApi
        .listQuiz({ q, band, difficulty, page })
        .then((r) => !cancelled && setData(r))
        .catch((err) => !cancelled && setError(apiMessage(err, 'Không tải được câu trắc nghiệm.')));
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q, band, difficulty, page, reload]);

  const open = async (row: QuizBankRow) => {
    try {
      setEditing(await questionBankApi.quizDetail(row.id));
    } catch (err) {
      showToast(apiMessage(err, 'Không mở được câu hỏi.'), 'error');
    }
  };

  const save = async (f: QuizForm) => {
    if (!editing) return;
    setSaving(true);
    try {
      await questionBankApi.updateQuiz(editing.id, quizPayload(f));
      showToast('Đã lưu câu hỏi.', 'success');
      setEditing(null);
      setReload((n) => n + 1);
    } catch (err) {
      showToast(apiMessage(err, 'Không lưu được câu hỏi.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: QuizBankRow) => {
    if (!window.confirm('Xóa câu hỏi này khỏi Ngân hàng đề?')) return;
    try {
      await questionBankApi.removeQuiz(row.id);
      showToast('Đã xóa câu hỏi.', 'success');
      setReload((n) => n + 1);
    } catch (err) {
      showToast(apiMessage(err, 'Không xóa được câu hỏi.'), 'error');
    }
  };

  return (
    <div className="space-y-3">
      {error && <p role="alert" className="text-sm text-rose-600 dark:text-rose-300">{error}</p>}
      <div className={`overflow-x-auto rounded-xl border ${hairline}`}>
        <table className="w-full min-w-[40rem] border-collapse">
          <thead className="bg-neutral-50 dark:bg-neutral-900">
            <tr>
              <th scope="col" className={head}>Câu hỏi</th>
              <th scope="col" className={head}>Khối</th>
              <th scope="col" className={head}>Độ khó</th>
              <th scope="col" className={head}>Đang dùng</th>
              <th scope="col" className={head}><span className="sr-only">Thao tác</span></th>
            </tr>
          </thead>
          <tbody>
            {!data ? (
              <tr>
                <td colSpan={5} className={`${cell} text-center`}>
                  <Loader2 size={16} className="inline animate-spin" aria-label="Đang tải" />
                </td>
              </tr>
            ) : data.items.length === 0 ? (
              <tr>
                <td colSpan={5} className={`${cell} text-center text-[var(--text-muted)]`}>Chưa có câu trắc nghiệm nào. Soạn câu mới ở tab "Soạn bài thủ công".</td>
              </tr>
            ) : (
              data.items.map((r) => (
                <tr key={r.id} className={`border-t ${hairline}`}>
                  <td className={`${cell} max-w-[28rem]`}>
                    <div className="truncate">{r.content}</div>
                    <div className="text-xs text-[var(--text-muted)]">{r.optionCount} đáp án · {r.points} điểm{r.mine ? ' · của bạn' : ''}</div>
                  </td>
                  <td className={cell}>{bandLabel(r.band)}</td>
                  <td className={cell}>{DIFFICULTY_LABEL[r.difficulty] ?? r.difficulty}</td>
                  <td className={cell}>{usageLabel(r.usage) || '—'}</td>
                  <td className={`${cell} whitespace-nowrap text-right`}>
                    <button type="button" onClick={() => open(r)} aria-label={`Sửa câu: ${r.content}`} className="cursor-pointer rounded-lg p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950">
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(r)}
                      disabled={r.inUse}
                      title={r.inUse ? 'Câu đang được dùng trong Lớp học hoặc Cuộc thi' : undefined}
                      aria-label={`Xóa câu: ${r.content}`}
                      className="cursor-pointer rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-rose-950"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 text-sm text-[var(--text-main)]">
          <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} aria-label="Trang trước" className={`${control} cursor-pointer disabled:opacity-40`}>
            <ChevronLeft size={14} />
          </button>
          <span>{pageLabel(data.page, data.totalPages, data.total).replace('bài', 'câu')}</span>
          <button type="button" onClick={() => setPage((p) => p + 1)} disabled={page >= data.totalPages} aria-label="Trang sau" className={`${control} cursor-pointer disabled:opacity-40`}>
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {editing && (
        <div role="dialog" aria-modal="true" aria-label="Sửa câu trắc nghiệm" className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-[var(--bg-card)] p-5 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-[var(--text-main)]">Sửa câu trắc nghiệm</h3>
              <button type="button" onClick={() => setEditing(null)} aria-label="Đóng" className="cursor-pointer rounded-lg p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                <X size={16} />
              </button>
            </div>
            {editing.inUse && <p className="mb-2 text-xs text-amber-700 dark:text-amber-300">Câu đang được dùng: vẫn sửa được nội dung nhưng không đổi khối.</p>}
            <QuizQuestionForm initial={quizFormFromDetail(editing)} submitLabel="Lưu thay đổi" saving={saving} bandLocked={editing.inUse} onSubmit={save} onCancel={() => setEditing(null)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizBankPanel;
