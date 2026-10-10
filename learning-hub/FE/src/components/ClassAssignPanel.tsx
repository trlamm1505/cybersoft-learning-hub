import React, { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import teacherAnalyticsApi from '../axios/teacherAnalyticsApi';
import { groupByType, sameSet, toggleSlug } from '../pages/classManagementModel';
import { control as input, selectControl } from './adminStyles';
import type { CatalogExercise, ClassDetail, ClassSummary } from '../types/teacherAnalytics';

const errorMessage = (err: unknown, fallback: string) =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;

const link =
  'cursor-pointer text-xs text-[var(--text-muted)] underline hover:text-[var(--text-main)] disabled:cursor-default disabled:no-underline disabled:opacity-50';
const linkMain =
  'cursor-pointer text-sm text-indigo-600 underline disabled:cursor-default disabled:no-underline disabled:opacity-50 dark:text-indigo-400';
const rule = 'border-t border-[var(--border-color)]';

interface Props {
  classes: ClassSummary[];
  selectedId: string;
  onSelect: (id: string) => void;
  /** Gọi sau khi lưu để Tổng quan tải lại số liệu. */
  onChanged: () => void;
}

/** Giảng viên giao danh mục bài cho lớp được phân công. Không có thao tác tạo/xóa lớp hay quản lý học viên. */
export const ClassAssignPanel: React.FC<Props> = ({ classes, selectedId, onSelect, onChanged }) => {
  const [detail, setDetail] = useState<ClassDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);
  const [catalog, setCatalog] = useState<CatalogExercise[]>([]);
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<string[]>([]);

  const load = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const d = await teacherAnalyticsApi.getClassDetail(id);
      setDetail(d);
      setPicked(d.exercises.map((e) => e.slug));
    } catch (err) {
      setDetail(null);
      setMessage({ text: errorMessage(err, 'Không tải được lớp.'), error: true });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId) void load(selectedId);
    else setDetail(null);
  }, [selectedId, load]);

  // Danh mục bài: tải lại khi tìm kiếm, chờ ngắn để không gọi mỗi phím.
  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    const t = setTimeout(() => {
      teacherAnalyticsApi
        .searchExercises(query)
        .then((list) => !cancelled && setCatalog(list))
        .catch(() => !cancelled && setCatalog([]));
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, selectedId]);

  const save = async () => {
    setBusy(true);
    setMessage(null);
    try {
      await teacherAnalyticsApi.setExercises(selectedId, picked);
      setMessage({ text: picked.length ? `Đã giao ${picked.length} bài.` : 'Đã bỏ giao hết bài.' });
      onChanged();
      await load(selectedId);
    } catch (err) {
      setMessage({ text: errorMessage(err, 'Không lưu được.'), error: true });
    } finally {
      setBusy(false);
    }
  };

  if (classes.length === 0) {
    return <p className="py-6 text-sm text-[var(--text-muted)]">Bạn chưa được phân công lớp nào. Liên hệ quản trị viên.</p>;
  }

  const assigned = detail?.exercises.map((e) => e.slug) ?? [];
  const dirty = !!detail && !sameSet(picked, assigned);
  // Bài đã giao mà không nằm trong kết quả tìm kiếm vẫn phải thấy để bỏ chọn được.
  const visible = [
    ...catalog,
    ...(detail?.exercises ?? []).filter((e) => !catalog.some((c) => c.slug === e.slug) && !query.trim()),
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <select aria-label="Chọn lớp để giao bài" value={selectedId} onChange={(e) => onSelect(e.target.value)} className={selectControl}>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {message && (
          <span role="status" className={`text-xs ${message.error ? 'text-rose-500' : 'text-[var(--text-muted)]'}`}>
            {message.text}
          </span>
        )}
      </div>

      {loading && !detail ? (
        <div className="flex items-center py-6 text-sm text-[var(--text-muted)]">
          <Loader2 className="mr-2 animate-spin" size={14} /> Đang tải...
        </div>
      ) : detail ? (
        <section className={`${rule} pt-4`}>
          <div className="mb-2 flex items-baseline justify-between">
            <h3 className="text-sm font-medium text-[var(--text-main)]">Bài tập giao cho lớp</h3>
            <span className="text-xs text-[var(--text-muted)]">{picked.length} đã chọn</span>
          </div>
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <input
              aria-label="Tìm bài tập"
              placeholder="Tìm theo tên hoặc nhãn"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={`${input} w-full max-w-xs`}
            />
            <button className={linkMain} disabled={busy || !dirty} onClick={() => void save()}>
              Lưu danh mục
            </button>
            {dirty && (
              <button className={link} onClick={() => setPicked(assigned)}>
                Hoàn tác
              </button>
            )}
          </div>
          {visible.length === 0 ? (
            <p className="py-2 text-sm text-[var(--text-muted)]">{query.trim() ? 'Không tìm thấy bài nào.' : 'Chưa có bài tập nào.'}</p>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {groupByType(visible).map((g) => (
                <div key={g.label} className="mb-2">
                  <div className="py-1 text-xs text-[var(--text-muted)]">{g.label}</div>
                  {g.items.map((e) => (
                    <label key={e.slug} className={`${rule} flex cursor-pointer items-center gap-2 py-1.5 text-sm text-[var(--text-main)]`}>
                      <input type="checkbox" checked={picked.includes(e.slug)} onChange={() => setPicked((p) => toggleSlug(p, e.slug))} />
                      <span className="flex-1">{e.title}</span>
                      {e.tags.length > 0 && <span className="text-xs text-[var(--text-muted)]">{e.tags.join(', ')}</span>}
                    </label>
                  ))}
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
};

export default ClassAssignPanel;
