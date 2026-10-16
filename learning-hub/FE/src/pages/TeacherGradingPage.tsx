import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Inbox, Loader2, ShieldAlert } from 'lucide-react';
import testerLabApi from '../axios/testerLabApi';
import integrityApi from '../axios/integrityApi';
import { control, hairline } from '../components/adminStyles';
import { useToast } from '../components/Toast';
import type { ProctorAlertRow } from '../types/integrity';
import type { ReviewQueueItem } from '../types/testerLab';
import { MIN_FEEDBACK_LENGTH, MIN_REASON_LENGTH, outTabSeverity, rubricHint, rubricTitle, rubricTotal, validateGrades } from './teacherGradingModel';

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

  const load = useCallback(() => {
    testerLabApi
      .getReviewQueue()
      .then(setItems)
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
          <Inbox size={16} /> Không có bài nào đang chờ chấm.
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

/* ---------- Khu vực 2: hàng chờ cảnh báo liêm chính (out-tab) ---------- */

const IntegrityQueue: React.FC = () => {
  const { showToast } = useToast();
  const [alerts, setAlerts] = useState<ProctorAlertRow[] | null>(null);
  const [invalidating, setInvalidating] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(() => {
    integrityApi
      .getAlerts()
      .then(setAlerts)
      .catch(() => setAlerts([]));
  }, []);
  useEffect(load, [load]);

  const sorted = useMemo(() => [...(alerts ?? [])].sort((a, b) => b.leaveCount - a.leaveCount), [alerts]);
  const remove = (id: string) => setAlerts((cur) => (cur ?? []).filter((a) => a.id !== id));

  const ignore = async (a: ProctorAlertRow) => {
    setBusy(a.id);
    try {
      await integrityApi.ackAlert(a.id);
      remove(a.id);
      showToast('Đã bỏ qua cảnh báo.', 'info');
    } catch (err) {
      showToast(errorMessage(err, 'Không bỏ qua được cảnh báo.'), 'error');
    } finally {
      setBusy(null);
    }
  };

  const invalidate = async (a: ProctorAlertRow) => {
    if (reason.trim().length < MIN_REASON_LENGTH) return setFormError(`Vui lòng nhập lý do hủy (tối thiểu ${MIN_REASON_LENGTH} ký tự).`);
    setBusy(a.id);
    setFormError(null);
    try {
      await integrityApi.invalidateAlert(a.id, reason.trim());
      remove(a.id);
      setInvalidating(null);
      setReason('');
      showToast(`Đã hủy kết quả của ${a.student.fullName}.`, 'success');
    } catch (err) {
      setFormError(errorMessage(err, 'Không hủy được kết quả.'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <section aria-label="Cảnh báo liêm chính" className="space-y-3">
      <h2 className="flex items-center gap-2 text-base font-semibold text-[var(--text-main)]">
        <ShieldAlert size={16} aria-hidden /> Giám sát liêm chính chung (Out-tab)
      </h2>
      {alerts === null ? (
        <div className="flex items-center py-4 text-sm text-[var(--text-muted)]">
          <Loader2 size={14} className="mr-2 animate-spin" /> Đang tải...
        </div>
      ) : sorted.length === 0 ? (
        <div className={`flex items-center gap-2 rounded-lg border p-4 text-sm text-[var(--text-muted)] ${hairline}`}>
          <Inbox size={16} /> Không có ca vi phạm nào cần xem xét.
        </div>
      ) : (
        <div className={`overflow-x-auto rounded-lg border ${hairline}`}>
          <table className="min-w-full">
            <thead>
              <tr>
                {['Học viên', 'Bài thi', 'Số lần out-tab', 'Thời gian', ''].map((h) => (
                  <th key={h} className={th}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((a) => {
                const red = outTabSeverity(a.leaveCount) === 'RED';
                return (
                  <React.Fragment key={a.id}>
                    <tr className={`border-t ${hairline} ${red ? 'bg-red-50/70 dark:bg-red-950/20' : ''}`}>
                      <td className={td}>
                        {a.student.fullName}
                        {a.className && <div className="text-xs text-[var(--text-muted)]">{a.className}</div>}
                      </td>
                      <td className={td}>
                        <span className={`mr-2 rounded px-1.5 py-0.5 text-[10px] font-medium ${a.kind === 'CONTEST' ? 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200' : 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200'}`}>
                          {a.kind === 'CONTEST' ? '🏆 Cuộc thi' : '📚 Bài tập lớp'}
                        </span>
                        {a.refTitle}
                      </td>
                      <td className={td}>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${red ? 'bg-red-600 text-white' : 'bg-amber-100 text-amber-800'}`}>
                          <AlertTriangle size={12} aria-hidden /> {a.leaveCount} lần
                        </span>
                      </td>
                      <td className={`${td} tabular-nums`}>
                        {typeof a.awaySeconds === 'number' ? `${a.awaySeconds} giây · ` : ''}
                        {fmt(a.lastLeaveAt)}
                      </td>
                      <td className={`${td} whitespace-nowrap text-right`}>
                        <button onClick={() => void ignore(a)} disabled={busy === a.id} className="mr-3 cursor-pointer text-xs text-[var(--text-muted)] underline disabled:opacity-50">
                          Bỏ qua
                        </button>
                        <button
                          onClick={() => {
                            setInvalidating(invalidating === a.id ? null : a.id);
                            setReason('');
                            setFormError(null);
                          }}
                          className="cursor-pointer rounded-md border border-rose-300 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-950"
                        >
                          Hủy kết quả
                        </button>
                      </td>
                    </tr>
                    {invalidating === a.id && (
                      <tr className={`border-t ${hairline}`}>
                        <td colSpan={5} className="px-3 py-3">
                          <div className="flex flex-wrap items-start gap-2">
                            <input
                              value={reason}
                              onChange={(e) => setReason(e.target.value)}
                              placeholder="Lý do hủy kết quả (bắt buộc, tối thiểu 10 ký tự)"
                              aria-label="Lý do hủy kết quả"
                              maxLength={500}
                              className={`${control} min-w-[18rem] flex-1`}
                            />
                            <button
                              onClick={() => void invalidate(a)}
                              disabled={busy === a.id}
                              className="cursor-pointer rounded-md bg-rose-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-60"
                            >
                              Xác nhận hủy
                            </button>
                          </div>
                          {formError && <p className="mt-1 text-xs text-rose-500">{formError}</p>}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

/** Tab "Chấm bài": hàng chờ Tester QA và hàng chờ cảnh báo liêm chính, hai khu vực trên cùng một trang. */
export const TeacherGradingPage: React.FC = () => (
  <div className="space-y-8">
    <h1 className="text-xl font-semibold text-[var(--text-main)]">Chấm bài &amp; Duyệt Lab</h1>
    <TesterQueue />
    <IntegrityQueue />
    <p className="text-xs text-[var(--text-muted)]">
      Công cụ khác:{' '}
      <Link to="/teacher/grading/insight" className="underline">
        Chấm DA Insight
      </Link>{' '}
      ·{' '}
      <Link to="/teacher/grading/labs" className="underline">
        Bài nộp DA/AI Lab
      </Link>{' '}
      ·{' '}
      <Link to="/teacher/grading/integrity" className="underline">
        Xem xét trung thực chi tiết
      </Link>
    </p>
  </div>
);

export default TeacherGradingPage;
