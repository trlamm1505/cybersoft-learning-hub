import type { UserRole, UserStatus } from '../types/teacherAnalytics';

/** Nhãn hiển thị thân thiện cho người vận hành (không dùng mã kỹ thuật). */
export const ROLE_VI: Record<UserRole, string> = {
  STUDENT: 'Học viên',
  TEACHER: 'Giảng viên',
  ADMIN: 'Quản trị viên',
};

export const STATUS_VI: Record<UserStatus, string> = {
  ACTIVE: 'Hoạt động',
  LOCKED: 'Đã khóa',
};

export const KIND_VI: Record<string, string> = {
  CODE: 'Code',
  SQL: 'SQL',
  INSIGHT: 'Insight',
  AI_LAB: 'AI Lab',
};

export const RESULT_VI: Record<string, string> = {
  PASSED: 'Đạt',
  FAILED: 'Chưa đạt',
  PENDING: 'Chờ chấm',
};

/** Vai trò Admin được cấp/đổi: không có ADMIN (chống leo thang đặc quyền). */
export const ASSIGNABLE_ROLES: UserRole[] = ['STUDENT', 'TEACHER'];

export type RevokeMode = 'STUDENT' | 'LOCK';

export type RoleFilter = 'ALL' | UserRole;

export const ROLE_FILTERS: Array<{ key: RoleFilter; label: string }> = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'STUDENT', label: 'Học viên' },
  { key: 'TEACHER', label: 'Giảng viên' },
];

/** Slug hiển thị suy ra từ tên lớp: bỏ dấu tiếng Việt, chữ thường, nối bằng gạch ngang (không lưu vào CSDL). */
export function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export const formatDateTime = (iso: string | null | undefined): string =>
  iso ? new Date(iso).toLocaleDateString('vi-VN') : '—';

export const formatRate = (rate: number | null | undefined): string =>
  rate === null || rate === undefined ? '—' : `${Math.round(rate * 100)}%`;

/** Trang hiện tại có phải trang cuối không, và nhãn "1–20 / 53". */
export function pageInfo(page: number, pageSize: number, total: number): { label: string; hasPrev: boolean; hasNext: boolean } {
  if (total === 0) return { label: '0 / 0', hasPrev: false, hasNext: false };
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return { label: `${from}–${to} / ${total}`, hasPrev: page > 1, hasNext: to < total };
}

/** Kiểm tra form tạo tài khoản ở trình duyệt; BE kiểm tra lại đầy đủ. Trả về thông báo lỗi hoặc null. */
export function validateNewUser(v: { fullName: string; email: string; password: string }): string | null {
  if (!v.fullName.trim()) return 'Nhập họ tên.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@.]{2,}$/.test(v.email.trim())) return 'Email không hợp lệ.';
  if (v.password.length < 6) return 'Mật khẩu từ 6 ký tự.';
  return null;
}

// ---------- Sidebar ----------

export const SIDEBAR_MIN = 200;
export const SIDEBAR_MAX = 360;
export const SIDEBAR_DEFAULT = 240;
export const SIDEBAR_COLLAPSED = 64;
const STORAGE_KEY = 'admin_sidebar_v1';

export const clampSidebarWidth = (w: number): number =>
  Number.isFinite(w) ? Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, Math.round(w))) : SIDEBAR_DEFAULT;

export interface SidebarState {
  collapsed: boolean;
  width: number;
}

/** Đọc trạng thái đã lưu; dữ liệu hỏng hoặc storage bị chặn thì dùng mặc định. */
export function loadSidebarState(storage?: Pick<Storage, 'getItem'>): SidebarState {
  const fallback = { collapsed: false, width: SIDEBAR_DEFAULT };
  try {
    const raw = (storage ?? localStorage).getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const v = JSON.parse(raw) as Partial<SidebarState>;
    return { collapsed: v.collapsed === true, width: clampSidebarWidth(Number(v.width)) };
  } catch {
    return fallback;
  }
}

export function saveSidebarState(state: SidebarState, storage?: Pick<Storage, 'setItem'>): void {
  try {
    (storage ?? localStorage).setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage bị chặn: bỏ qua, giao diện vẫn dùng được
  }
}

export const sidebarPixelWidth = (s: SidebarState): number => (s.collapsed ? SIDEBAR_COLLAPSED : s.width);
