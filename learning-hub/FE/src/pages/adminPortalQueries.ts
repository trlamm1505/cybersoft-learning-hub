import { useQuery } from '@tanstack/react-query';
import adminPortalApi from '../axios/adminPortalApi';
import { DASHBOARD_REFETCH_MS, QUERY_STALE_MS } from './adminPortalModel';

/** Khóa cache dùng chung để các tab xem cùng một dữ liệu và invalidate đúng chỗ sau khi thay đổi. */
export const QK = {
  summary: ['admin', 'summary'] as const,
  health: ['admin', 'health'] as const,
  users: ['admin', 'users'] as const,
  classes: ['admin', 'classes'] as const,
  classDetail: (id: string) => ['admin', 'classes', 'detail', id] as const,
  configs: ['admin', 'configs'] as const,
  audit: ['admin', 'audit'] as const,
};

/** Số liệu Dashboard: tự làm mới mỗi 30 giây (React Query refetchInterval), dữ liệu tươi 10 giây. */
export function useDashboardSummary() {
  return useQuery({
    queryKey: QK.summary,
    queryFn: adminPortalApi.summary,
    refetchInterval: DASHBOARD_REFETCH_MS,
    staleTime: QUERY_STALE_MS,
  });
}

/**
 * Kết quả health-check dùng chung cho thẻ tóm tắt ở Dashboard và tab Trạng thái API. BE giới hạn 1 lần / 10 giây
 * cho mỗi Admin nên không tự refetch khi focus lại cửa sổ; Dashboard làm mới theo chu kỳ 30 giây.
 */
export function useHealthReport(opts: { autoRefresh?: boolean } = {}) {
  return useQuery({
    queryKey: QK.health,
    queryFn: adminPortalApi.health,
    refetchInterval: opts.autoRefresh ? DASHBOARD_REFETCH_MS : false,
    refetchOnWindowFocus: false,
    staleTime: QUERY_STALE_MS,
    retry: false,
  });
}

/** Giảng viên đang hoạt động (tối đa 100) cho hộp chọn giảng viên. */
export function useActiveTeachers() {
  return useQuery({
    queryKey: [...QK.users, 'teachers-active'],
    queryFn: () => adminPortalApi.users({ role: 'TEACHER', status: 'ACTIVE', pageSize: 100 }),
    staleTime: QUERY_STALE_MS,
  });
}
