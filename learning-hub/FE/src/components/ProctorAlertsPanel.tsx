import React, { useCallback, useEffect, useState } from 'react';
import { BellRing, CheckCheck, Loader2 } from 'lucide-react';
import integrityApi from '../axios/integrityApi';
import type { ProctorAlertRow } from '../types/integrity';

const POLL_MS = 30_000;

export const KIND_LABEL: Record<ProctorAlertRow['kind'], string> = {
  CONTEST: 'Cuộc thi',
  CLASS_ASSIGNMENT: 'Bài tập lớp',
};

const formatTime = (iso: string | null) => (iso ? new Date(iso).toLocaleString('vi-VN') : '');

/** Cảnh báo học viên rời màn hình làm bài: bài lớp (> 2 lần) và cuộc thi (từ lần 1). Tự làm mới định kỳ. */
export const ProctorAlertsPanel: React.FC = () => {
  const [alerts, setAlerts] = useState<ProctorAlertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setAlerts(await integrityApi.getAlerts());
      setError(null);
    } catch {
      setError('Không tải được cảnh báo rời màn hình.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  const acknowledge = async (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    try {
      await integrityApi.ackAlert(id);
    } catch {
      void load();
    }
  };

  return (
    <section aria-label="Cảnh báo rời màn hình" className="space-y-2 rounded-xl border border-red-500/30 bg-red-500/5 p-4">
      <h2 className="flex items-center gap-2 text-base font-bold text-[var(--text-main)]">
        <BellRing size={18} className="text-red-600" /> Cảnh báo rời màn hình làm bài
        {alerts.length > 0 && (
          <span className="rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-bold text-white">{alerts.length}</span>
        )}
      </h2>
      {loading ? (
        <p className="flex items-center text-sm text-[var(--text-muted)]">
          <Loader2 className="mr-2 animate-spin" size={14} /> Đang tải...
        </p>
      ) : error ? (
        <p className="text-sm text-rose-500">{error}</p>
      ) : alerts.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">Chưa có cảnh báo nào cần xem.</p>
      ) : (
        <ul className="space-y-2">
          {alerts.map((a) => (
            <li
              key={a.id}
              className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm ${
                a.severity === 'LOCKED'
                  ? 'border-red-600/60 bg-red-600/10 text-[var(--text-main)]'
                  : 'border-amber-500/40 bg-amber-500/10 text-[var(--text-main)]'
              }`}
            >
              <div className="min-w-0">
                <p className="font-semibold">{a.message}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {KIND_LABEL[a.kind]}: {a.refTitle || a.refId}
                  {a.className ? ` · Lớp ${a.className}` : ''} · {a.leaveCount} lần
                  {a.lastLeaveAt ? ` · ${formatTime(a.lastLeaveAt)}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void acknowledge(a.id)}
                className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] px-3 py-1 text-xs font-semibold text-[var(--text-main)]"
              >
                <CheckCheck size={14} /> Đã xem
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default ProctorAlertsPanel;
