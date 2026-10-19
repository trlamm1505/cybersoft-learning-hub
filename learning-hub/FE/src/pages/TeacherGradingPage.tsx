import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Inbox, Loader2 } from 'lucide-react';
import testerLabApi from '../axios/testerLabApi';
import { control, hairline } from '../components/adminStyles';
import { useToast } from '../components/Toast';
import type { ReviewQueueItem } from '../types/testerLab';
import { MIN_FEEDBACK_LENGTH, rubricHint, rubricTitle, rubricTotal, validateGrades } from './teacherGradingModel';

const th = 'px-3 py-2 text-left text-xs font-medium text-[var(--text-muted)] whitespace-nowrap';
const td = 'px-3 py-2 text-sm text-[var(--text-main)] align-top';
const fmt = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '—');
const errorMessage = (err: unknown, fallback: string) =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;

/* ---------- Khu vực 1: hàng chờ chấm Tester QA ---------- */

export const ReviewPanel: React.FC<{ item: ReviewQueueItem; onClose: () => void; onDone: (id: string) => void }> = ({ item, onClose, onDone }) => {
  const { showToast } = useToast();
  const criteria = item.lab.rubricCriteria;
  const [scores, setScores] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const total = rubricTotal(criteria, scores);
  const notesLength = notes.trim().length;
  // Nút chỉ sáng khi đã chấm đủ mọi tiêu chí hợp lệ và nhận xét đủ 20 ký tự.
  const ready = validateGrades(criteria, scores).ok && notesLength >= MIN_FEEDBACK_LENGTH;

  const submit = async () => {
    const checked = validateGrades(criteria, scores);
    if (!checked.ok) return setFormError(checked.error);
    if (notes.trim().length < MIN_FEEDBACK_LENGTH) return setFormError(`Nhận xét bắt buộc, tối thiểu ${MIN_FEEDBACK_LENGTH} ký tự.`);
    setSaving(true);
    setFormError(null);
    try {
      await testerLabApi.review(item.id, checked.grades, notes.trim());
      showToast(`Đã chấm bài của ${item.student.fullName || item.student.email}.`, 'success');
      onDone(item.id);
    } catch (err) {
      setFormError(errorMessage(err, 'Không lưu được điểm. Vui lòng thử lại.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section aria-label="Chấm bài" className={`space-y-4 rounded-lg border p-4 ${hairline}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-main)]">
            {item.student.fullName || item.student.email} · {item.lab.labCode} {item.lab.title}
          </h3>
          <p className="text-xs text-[var(--text-muted)]">
            {item.student.email} · nộp lúc {fmt(item.submittedAt)}
          </p>
        </div>
        <button onClick={onClose} className="cursor-pointer text-xs text-[var(--text-muted)] underline">
          Đóng
        </button>
      </div>

      <div>
        <h4 className="mb-1 text-xs font-medium text-[var(--text-muted)]">Test case ({item.formData?.testCases.length ?? 0})</h4>
        <div className={`overflow-x-auto rounded-md border ${hairline}`}>
          <table className="min-w-full">
            <thead>
              <tr>
                {['Mã', 'Mô tả', 'Input', 'Kết quả mong đợi'].map((h) => (
                  <th key={h} className={th}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(item.formData?.testCases ?? []).map((t) => (
                <tr key={t.code} className={`border-t ${hairline}`}>
                  <td className={`${td} font-mono`}>{t.code}</td>
                  <td className={td}>{t.description}</td>
                  <td className={td}>{t.input}</td>
                  <td className={td}>{t.expected}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h4 className="mb-1 text-xs font-medium text-[var(--text-muted)]">Bug report ({item.formData?.bugReports.length ?? 0})</h4>
        <ul className="space-y-2">
          {(item.formData?.bugReports ?? []).map((b, i) => (
            <li key={i} className={`rounded-md border p-3 text-sm ${hairline}`}>
              <div className="flex items-center gap-2 font-medium text-[var(--text-main)]">
                {b.title}
                <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] uppercase text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">{b.severity}</span>
              </div>
              <p className="mt-1 whitespace-pre-line text-xs text-[var(--text-muted)]">Các bước:{'\n'}{b.steps}</p>
              <p className="mt-1 text-xs text-[var(--text-main)]">
                Mong đợi: {b.expected} · Thực tế: {b.actual}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h4 className="mb-2 text-xs font-medium text-[var(--text-muted)]">
          Điểm theo rubric · tổng {total.score}/{total.max}
        </h4>
        <div className="grid gap-2 sm:grid-cols-2">
          {criteria.map((c) => (
            <label key={c.key} className="flex items-center justify-between gap-3 text-sm text-[var(--text-main)]">
              <span className="min-w-0">
                <span className="block font-medium">
                  {rubricTitle(c.label)} <span className="font-normal text-[var(--text-muted)]">(Tối đa {c.maxScore}đ)</span>
                </span>
                {rubricHint(c.label) && <span className="block text-xs text-[var(--text-muted)]">{rubricHint(c.label)}</span>}
              </span>
              <span className="flex shrink-0 items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={c.maxScore}
                  value={scores[c.key] ?? ''}
                  onChange={(e) => setScores((s) => ({ ...s, [c.key]: e.target.value }))}
                  aria-label={`Điểm ${c.label}`}
                  className={`${control} w-16 text-right`}
                />
                <span className="text-xs text-[var(--text-muted)]">/{c.maxScore}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <label className="block text-sm text-[var(--text-main)]">
        Nhận xét gửi học viên
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} maxLength={2000} aria-describedby="notes-hint" className={`${control} mt-1 w-full`} />
        <span id="notes-hint" className={`text-xs ${notesLength >= MIN_FEEDBACK_LENGTH ? 'text-emerald-600' : 'text-[var(--text-muted)]'}`}>
          {notesLength}/{MIN_FEEDBACK_LENGTH} ký tự tối thiểu
        </span>
      </label>

      {formError && <p className="text-sm text-rose-500">{formError}</p>}
      <div className="flex justify-end">
        <button
          onClick={() => void submit()}
          disabled={saving || !ready}
          title={ready ? undefined : `Nhập đủ điểm 3 tiêu chí và nhận xét tối thiểu ${MIN_FEEDBACK_LENGTH} ký tự`}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Hoàn tất chấm điểm
        </button>
      </div>
    </section>
  );
};

const TesterQueue: React.FC = () => {
  const [items, setItems] = useState<ReviewQueueItem[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notOwner, setNotOwner] = useState(false);

  const load = useCallback(() => {
    // Hỏi quyền trước (luôn 200): giảng viên không phụ trách lớp Tester QA không gọi hàng chờ (tránh 403 đỏ ở console).
    testerLabApi
      .getCapabilities()
      .then((c) => {
        if (!c.canReviewTesterQueue) {
          setNotOwner(true);
          setItems([]);
          return undefined;
        }
        return testerLabApi.getReviewQueue().then(setItems);
      })
      .catch((err) => {
        setError(errorMessage(err, 'Không tải được hàng chờ chấm.'));
        setItems([]);
      });
  }, []);
  useEffect(load, [load]);

  const open = items?.find((i) => i.id === openId) ?? null;

  return (
    <section aria-label="Hàng chờ chấm Tester QA" className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-base font-semibold text-[var(--text-main)]">Hàng chờ chấm Tester QA</h2>
        {items && items.length > 0 && <span className="rounded-full bg-amber-100 px-2 text-xs font-medium text-amber-800">{items.length} chờ chấm</span>}
      </div>
      {error && <p className="text-sm text-rose-500">{error}</p>}
      {items === null ? (
        <div className="flex items-center py-4 text-sm text-[var(--text-muted)]">
          <Loader2 size={14} className="mr-2 animate-spin" /> Đang tải...
        </div>
      ) : items.length === 0 ? (
        <div className={`flex items-center gap-2 rounded-lg border p-4 text-sm text-[var(--text-muted)] ${hairline}`}>
          <Inbox size={16} /> {notOwner ? 'Bạn chưa phụ trách lớp Tester QA nào nên không có hàng chờ chấm.' : 'Không có bài nào đang chờ chấm.'}
        </div>
      ) : (
        <div className={`overflow-x-auto rounded-lg border ${hairline}`}>
          <table className="min-w-full">
            <thead>
              <tr>
                {['Học viên', 'Bài lab', 'Nộp lúc', 'Test case', 'Bug', 'Trạng thái', ''].map((h) => (
                  <th key={h} className={th}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id} className={`border-t ${hairline} ${i.id === openId ? 'bg-indigo-50/60 dark:bg-indigo-950/30' : ''}`}>
                  <td className={td}>
                    <div>{i.student.fullName || i.student.email}</div>
                    <div className="text-xs text-[var(--text-muted)]">{i.student.email}</div>
                  </td>
                  <td className={td}>
                    {i.lab.labCode} · {i.lab.title}
                  </td>
                  <td className={`${td} tabular-nums`}>{fmt(i.submittedAt)}</td>
                  <td className={`${td} tabular-nums`}>{i.formData?.testCases.length ?? 0}</td>
                  <td className={`${td} tabular-nums`}>{i.formData?.bugReports.length ?? 0}</td>
                  <td className={td}>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">🟡 Chờ chấm</span>
                  </td>
                  <td className={`${td} text-right`}>
                    <button onClick={() => setOpenId(i.id)} className="cursor-pointer rounded-md border border-indigo-300 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-950">
                      Chấm bài
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {open && (
        <ReviewPanel
          key={open.id}
          item={open}
          onClose={() => setOpenId(null)}
          onDone={(id) => {
            setOpenId(null);
            setItems((cur) => (cur ?? []).filter((x) => x.id !== id));
          }}
        />
      )}
    </section>
  );
};

/** Tab "Chấm bài": hàng chờ chấm bài Lab cần chấm tay (Tester QA). Cảnh báo out-tab xem ở Lớp học (bài tập lớp) và Kết quả cuộc thi. */
export const TeacherGradingPage: React.FC = () => (
  <div className="space-y-8">
    <h1 className="text-xl font-semibold text-[var(--text-main)]">Chấm bài &amp; Duyệt Lab</h1>
    <TesterQueue />
  </div>
);

export default TeacherGradingPage;
