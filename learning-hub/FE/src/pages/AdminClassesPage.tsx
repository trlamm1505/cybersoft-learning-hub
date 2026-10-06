import React, { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import adminClassesApi from '../axios/adminClassesApi';
import { AdminClassPanel } from '../components/AdminClassPanel';
import type { AdminClassSummary } from '../types/teacherAnalytics';

const errorMessage = (err: unknown, fallback: string) =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;

/** Trang quản trị lớp học (/admin/classes): chỉ Admin tạo lớp, gán giảng viên, quản lý học viên. */
export const AdminClassesPage: React.FC = () => {
  const [classes, setClasses] = useState<AdminClassSummary[] | null>(null);
  const [selectedId, setSelectedId] = useState('');
  const [error, setError] = useState<string | null>(null);

  // selectId '' nghĩa là chọn lại lớp đầu tiên (sau khi xóa lớp).
  const refresh = useCallback(async (selectId?: string) => {
    try {
      const list = await adminClassesApi.list();
      setClasses(list);
      setError(null);
      setSelectedId((cur) => {
        const want = selectId ?? cur;
        return want && list.some((c) => c.id === want) ? want : (list[0]?.id ?? '');
      });
    } catch (err) {
      setError(errorMessage(err, 'Không tải được danh sách lớp.'));
      setClasses((cur) => cur ?? []);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <h1 className="text-xl font-semibold text-[var(--text-main)]">Quản lý lớp học</h1>
      {error && <p className="text-sm text-rose-500">{error}</p>}
      {classes === null ? (
        <div className="flex items-center py-8 text-sm text-[var(--text-muted)]">
          <Loader2 className="mr-2 animate-spin" size={16} /> Đang tải...
        </div>
      ) : (
        <AdminClassPanel
          classes={classes}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onChanged={(id) => void refresh(id)}
        />
      )}
    </div>
  );
};

export default AdminClassesPage;
