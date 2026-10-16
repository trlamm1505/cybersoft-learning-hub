import type { AgeGroupKey, AuditAction, AuditLogItem, HealthStatus } from '../types/adminPortal';

/** Làm mới Dashboard mỗi 30 giây bằng React Query (không dùng setInterval thủ công); dữ liệu "tươi" 10 giây. */
export const DASHBOARD_REFETCH_MS = 30_000;
export const QUERY_STALE_MS = 10_000;

export const AGE_GROUP_LABEL: Record<AgeGroupKey, string> = {
  '3-5': 'Khối 3-5 tuổi',
  '6-9': 'Khối 6-9 tuổi',
  '10-12': 'Khối 10-12 tuổi',
  CAREER_ADULT: 'Người đi làm',
};

export const AGE_GROUP_ORDER: AgeGroupKey[] = ['3-5', '6-9', '10-12', 'CAREER_ADULT'];

export const ageGroupLabel = (g: string | null | undefined): string =>
  g && g in AGE_GROUP_LABEL ? AGE_GROUP_LABEL[g as AgeGroupKey] : 'Chưa chọn';

/** Nhãn ngắn cho cột Khối trong bảng (vừa một dòng). */
export const AGE_GROUP_SHORT: Record<AgeGroupKey, string> = { '3-5': 'Lớp 3–5', '6-9': 'Lớp 6–9', '10-12': 'Lớp 10–12', CAREER_ADULT: 'Người đi làm' };

export type Tone = 'green' | 'yellow' | 'red' | 'blue' | 'violet' | 'slate';

/** Class màu theo ngữ nghĩa, có cặp sáng/tối riêng để chữ luôn đọc được ở cả hai giao diện. */
export const TONE_CLASS: Record<Tone, string> = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/30',
  yellow: 'bg-amber-50 text-amber-800 ring-amber-600/25 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/30',
  red: 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/30',
  blue: 'bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-400/30',
  violet: 'bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-400/30',
  slate: 'bg-slate-100 text-slate-700 ring-slate-500/20 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-400/30',
};

export const ROLE_TONE: Record<string, Tone> = { STUDENT: 'blue', TEACHER: 'violet', ADMIN: 'slate' };

// ------------------------------- Health -------------------------------

export const HEALTH_LABEL: Record<HealthStatus, string> = {
  HEALTHY: 'Hoạt động tốt',
  DEGRADED: 'Chậm / cần chú ý',
  DOWN: 'Gián đoạn',
};

export const HEALTH_TONE: Record<HealthStatus, Tone> = { HEALTHY: 'green', DEGRADED: 'yellow', DOWN: 'red' };

export const HEALTH_LIGHT: Record<HealthStatus, string> = { HEALTHY: '🟢', DEGRADED: '🟡', DOWN: '🔴' };

export const HEALTH_DOT_CLASS: Record<HealthStatus, string> = {
  HEALTHY: 'bg-emerald-500',
  DEGRADED: 'bg-amber-400',
  DOWN: 'bg-rose-500',
};

export const formatLatency = (ms: number | null | undefined): string =>
  ms === null || ms === undefined || !Number.isFinite(ms) ? '—' : `${Math.round(ms)} ms`;

// ------------------------------- Audit -------------------------------

export const AUDIT_LABEL: Record<AuditAction, string> = {
  USER_LOCK: 'KHÓA USER',
  USER_UNLOCK: 'MỞ KHÓA USER',
  ROLE_CHANGE: 'ĐỔI VAI TRÒ',
  CLASS_ASSIGN: 'GÁN LỚP',
  CLASS_ARCHIVE: 'LƯU TRỮ LỚP',
  CONFIG_UPDATE: 'ĐỔI CẤU HÌNH',
  BULK_LOCK: 'KHÓA HÀNG LOẠT',
  BULK_UNLOCK: 'MỞ KHÓA HÀNG LOẠT',
  USER_CREATE: 'TẠO USER',
  USER_UPDATE: 'SỬA USER',
};

export const AUDIT_TONE: Record<AuditAction, Tone> = {
  USER_LOCK: 'red',
  BULK_LOCK: 'red',
  USER_UNLOCK: 'green',
  BULK_UNLOCK: 'green',
  ROLE_CHANGE: 'violet',
  CLASS_ASSIGN: 'blue',
  CLASS_ARCHIVE: 'slate',
  CONFIG_UPDATE: 'yellow',
  USER_CREATE: 'green',
  USER_UPDATE: 'slate',
};

export const AUDIT_FILTERS: Array<{ key: '' | AuditAction; label: string }> = [
  { key: '', label: 'Tất cả hành động' },
  { key: 'USER_LOCK', label: 'Khóa user' },
  { key: 'USER_UNLOCK', label: 'Mở khóa user' },
  { key: 'ROLE_CHANGE', label: 'Đổi vai trò' },
  { key: 'CLASS_ASSIGN', label: 'Gán lớp' },
  { key: 'CLASS_ARCHIVE', label: 'Lưu trữ lớp' },
  { key: 'CONFIG_UPDATE', label: 'Đổi cấu hình' },
  { key: 'BULK_LOCK', label: 'Khóa hàng loạt' },
  { key: 'BULK_UNLOCK', label: 'Mở khóa hàng loạt' },
  { key: 'USER_CREATE', label: 'Tạo user' },
  { key: 'USER_UPDATE', label: 'Sửa user' },
];

/** Nhãn cho khóa cấu hình trong audit log: "ĐỔI API KEY" cho khóa Gemini, "ĐỔI PROMPT" cho system prompt. */
export function auditActionLabel(item: Pick<AuditLogItem, 'action' | 'targetId'>): string {
  if (item.action === 'CONFIG_UPDATE') return item.targetId === 'GEMINI_API_KEY' ? 'ĐỔI API KEY' : 'ĐỔI PROMPT';
  return AUDIT_LABEL[item.action] ?? item.action;
}

const PROMPT_TARGET: Record<string, string> = {
  'prompt.coach': 'Prompt AI Tutor gợi ý',
  'prompt.debug': 'Prompt phân tích lỗi',
  'prompt.ailab': 'Prompt AI Lab Evaluator',
  GEMINI_API_KEY: 'Gemini API Key',
};

export function auditTargetLabel(item: Pick<AuditLogItem, 'targetType' | 'targetId' | 'diff'>): string {
  if (item.targetType === 'CONFIG') return PROMPT_TARGET[item.targetId] ?? item.targetId;
  const snap = (item.diff?.after ?? item.diff?.before) as { email?: string; className?: string; fullName?: string } | null;
  if (item.targetType === 'CLASS') return snap?.className ? `Lớp ${snap.className}` : `Lớp ${item.targetId}`;
  if (item.targetId.startsWith('bulk:')) return `${item.targetId.slice(5)} người dùng`;
  return snap?.email || snap?.fullName || item.targetId;
}

/** Chuỗi JSON thụt lề để hiển thị diff; không bao giờ ném lỗi. */
export function prettyJson(v: unknown): string {
  if (v === null || v === undefined) return '— (không có)';
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

/** Các khóa khác nhau giữa before và after (để tô nổi dòng thay đổi). Chỉ so sánh mức một cấp. */
export function changedKeys(before: unknown, after: unknown): string[] {
  const b = (before && typeof before === 'object' ? before : {}) as Record<string, unknown>;
  const a = (after && typeof after === 'object' ? after : {}) as Record<string, unknown>;
  return [...new Set([...Object.keys(b), ...Object.keys(a)])].filter((k) => JSON.stringify(b[k]) !== JSON.stringify(a[k]));
}

export function formatDateTimeVi(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN', { hour12: false });
}

// ------------------------------- Users -------------------------------

export const isLocked = (u: { status: string }): boolean => u.status === 'LOCKED';

export const STATUS_PILL: Record<string, { label: string; tone: Tone }> = {
  ACTIVE: { label: 'Hoạt động', tone: 'green' },
  LOCKED: { label: 'Đã khóa', tone: 'red' },
};

/** Chọn/bỏ chọn một id (bất biến). */
export function toggleId(selected: ReadonlySet<string>, id: string): Set<string> {
  const next = new Set(selected);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

/** Chọn tất cả/bỏ chọn tất cả trên trang hiện tại: đã chọn đủ thì bỏ, còn thiếu thì chọn thêm. */
export function togglePage(selected: ReadonlySet<string>, pageIds: string[]): Set<string> {
  const next = new Set(selected);
  const all = pageIds.length > 0 && pageIds.every((id) => next.has(id));
  for (const id of pageIds) {
    if (all) next.delete(id);
    else next.add(id);
  }
  return next;
}

export const selectionLabel = (n: number): string => `Đã chọn ${n} người dùng`;

/** Admin không được tự khóa chính mình hay khóa tài khoản Admin hàng loạt: loại khỏi danh sách chọn được. */
export const isSelectable = (u: { id: string; role: string }, selfId: string): boolean => u.role !== 'ADMIN' && u.id !== selfId;

// ------------------------------- Dashboard -------------------------------

/** Chiều cao cột (0-100) cho biểu đồ cột; cột lớn nhất = 100, ngày 0 bài = 0 (không vẽ cột giả). */
export function barHeights(values: number[]): number[] {
  const max = Math.max(0, ...values);
  return values.map((v) => (max === 0 ? 0 : Math.max(v > 0 ? 4 : 0, Math.round((v / max) * 100))));
}

/** Nhãn ngày ngắn "T2 16/10" cho trục biểu đồ. */
export function shortDay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const names = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  return `${names[dow]} ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
}

/** Tỷ lệ (%) làm tròn, 0 khi tổng bằng 0. */
export const percent = (part: number, total: number): number => (total > 0 ? Math.round((part / total) * 100) : 0);

// ------------------------------- Settings -------------------------------

export const GEMINI_KEY_NAME = 'GEMINI_API_KEY';

/** Bộ đếm ký tự của textarea prompt: "123 / 8000", chuyển cảnh báo khi >= 90% giới hạn. */
export function charCounter(len: number, max: number): { text: string; tone: 'ok' | 'warn' | 'over' } {
  return { text: `${len.toLocaleString('vi-VN')} / ${max.toLocaleString('vi-VN')}`, tone: len > max ? 'over' : len >= max * 0.9 ? 'warn' : 'ok' };
}

/** Kiểm tra trước khi lưu prompt (BE kiểm tra lại): trống = về mặc định, còn lại 20-max ký tự. */
export function validatePrompt(value: string, max: number): string | null {
  const v = value.trim();
  if (v === '') return null;
  if (v.length < 20) return 'Prompt cần ít nhất 20 ký tự (hoặc để trống để dùng mặc định).';
  if (v.length > max) return `Prompt tối đa ${max.toLocaleString('vi-VN')} ký tự.`;
  return null;
}

/** Kiểm tra sơ bộ API key nhập vào (BE kiểm tra lại). */
export function validateApiKey(value: string): string | null {
  const v = value.trim();
  if (v.length < 20 || v.length > 200 || /\s/.test(v)) return 'API key không hợp lệ (20-200 ký tự, không có khoảng trắng).';
  return null;
}

/** Chuỗi hiển thị cho ô khóa khi chưa nhập gì: dạng che từ BE hoặc dấu chấm. */
export const MASK_PLACEHOLDER = '••••••••';

// ------------------------------- Lớp học & khóa học -------------------------------

/** Ý nghĩa nghiệp vụ hai trạng thái lớp, hiển thị ở badge, tooltip và hộp xác nhận. */
export const CLASS_STATUS = {
  OPEN: {
    label: 'Đang hoạt động',
    short: 'Hoạt động',
    tone: 'green' as Tone,
    hint: 'Lớp đang trong kỳ học: học viên được nộp bài, tính hạn chót và chấm điểm.',
  },
  ARCHIVED: {
    label: 'Lưu trữ / Đã bế giảng',
    short: 'Lưu trữ',
    tone: 'slate' as Tone,
    hint: 'Lớp đã kết thúc: học viên không còn nộp bài mới; dữ liệu và kết quả cũ được giữ nguyên.',
  },
} as const;

export type ClassStatusKey = keyof typeof CLASS_STATUS;

/** Trạng thái một bài của lớp (cột phải phần xổ xuống). */
export const EXERCISE_STATUS: Record<string, { label: string; tone: Tone }> = {
  OPEN: { label: 'Đang mở', tone: 'green' },
  UPCOMING: { label: 'Chưa mở', tone: 'yellow' },
  CLOSED: { label: 'Đã hết hạn', tone: 'slate' },
};

export const EXERCISE_KIND: Record<string, string> = {
  CODING: 'Code',
  QUIZ: 'Trắc nghiệm',
  TESTER: 'Tester',
  SQL: 'SQL',
  INSIGHT: 'Insight',
  AI: 'AI Prompt',
};

export const CLASS_AGE_FILTERS: Array<{ key: '' | AgeGroupKey; label: string }> = [
  { key: '', label: 'Tất cả' },
  { key: '3-5', label: 'Lớp 3–5' },
  { key: '6-9', label: 'Lớp 6–9' },
  { key: '10-12', label: 'Lớp 10–12' },
  { key: 'CAREER_ADULT', label: 'Người đi làm' },
];

export interface ClassFilter {
  ageGroup: '' | AgeGroupKey;
  status: '' | ClassStatusKey;
  q: string;
}

/** Lọc danh sách lớp theo khối đào tạo, trạng thái và từ khóa (tên, mã lớp, tên giảng viên). */
export function filterClasses<
  T extends { name: string; code: string | null; ageGroup: string | null; status: string; teachers: Array<{ name: string }> },
>(rows: T[], f: ClassFilter): T[] {
  const q = f.q.trim().toLowerCase();
  return rows.filter(
    (r) =>
      (!f.ageGroup || r.ageGroup === f.ageGroup) &&
      (!f.status || r.status === f.status) &&
      (!q || r.name.toLowerCase().includes(q) || (r.code ?? '').toLowerCase().includes(q) || r.teachers.some((t) => t.name.toLowerCase().includes(q))),
  );
}

/** Số lớp theo từng khối (để hiện trên tab lọc). */
export function countByAgeGroup(rows: Array<{ ageGroup: string | null }>): Record<string, number> {
  const out: Record<string, number> = { '': rows.length };
  for (const r of rows) if (r.ageGroup) out[r.ageGroup] = (out[r.ageGroup] ?? 0) + 1;
  return out;
}

export const classActionLabel = (status: ClassStatusKey): string => (status === 'OPEN' ? 'Chuyển vào Lưu trữ' : 'Kích hoạt lại');

// ------------------------------- Teacher assignment -------------------------------

/** Danh sách id sau khi bật/tắt một giảng viên, giữ thứ tự chọn (người đầu là giảng viên chính). */
export function toggleTeacher(ids: string[], id: string, max = 10): string[] {
  if (ids.includes(id)) return ids.filter((x) => x !== id);
  return ids.length >= max ? ids : [...ids, id];
}

// ------------------------------- Visual diff (nhật ký) -------------------------------

export type DiffCell = { type: 'none' } | { type: 'text'; value: string } | { type: 'tags'; values: string[] };
export interface DiffRow {
  label: string;
  before: DiffCell;
  after: DiffCell;
}

const OBJECT_ID = /^[0-9a-f]{24}$/i;
const STATUS_VI: Record<string, string> = { ACTIVE: 'Hoạt động', LOCKED: 'Đã khóa' };
const ROLE_VI_LABEL: Record<string, string> = { STUDENT: 'Học viên', TEACHER: 'Giảng viên', ADMIN: 'Quản trị viên' };
const NONE: DiffCell = { type: 'none' };

/** Không bao giờ để lộ mã nội bộ (ObjectId) ra giao diện chính. */
export const hideIds = (v: string): string => (OBJECT_ID.test(v.trim()) ? '(mã nội bộ)' : v);

const text = (v: unknown): DiffCell =>
  v === undefined || v === null || v === '' ? NONE : { type: 'text', value: hideIds(String(v)) };

const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});

const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

function teacherCell(side: Record<string, unknown>): DiffCell {
  const names = Array.isArray(side.teacherNames) ? (side.teacherNames as unknown[]) : null;
  const ids = Array.isArray(side.teacherIds) ? (side.teacherIds as unknown[]) : null;
  if (names) return { type: 'tags', values: names.map((n) => (typeof n === 'string' && n.trim() ? hideIds(n) : 'Giảng viên đã xóa')) };
  if (ids) return ids.length ? { type: 'tags', values: ids.map(() => 'Giảng viên (không rõ tên)') } : { type: 'tags', values: [] };
  return NONE;
}

const promptPreview = (v: unknown): DiffCell => {
  if (typeof v !== 'string' || !v) return NONE;
  const flat = v.replace(/\s+/g, ' ').trim();
  return { type: 'text', value: `${flat.length > 180 ? `${flat.slice(0, 180)}…` : flat} (${v.length.toLocaleString('vi-VN')} ký tự)` };
};

/**
 * Chuyển diff before/after thành các dòng nghiệp vụ tiếng Việt (Giảng viên, Trạng thái, Cấu hình...). Chỉ trả những trường THỰC SỰ
 * thay đổi; ẩn mọi trường kỹ thuật nội bộ (id, mã) và không bao giờ in ObjectId.
 */
export function buildDiffView(item: Pick<AuditLogItem, 'action' | 'targetId' | 'diff'>): DiffRow[] {
  const b = obj(item.diff?.before);
  const a = obj(item.diff?.after);
  const rows: DiffRow[] = [];
  const push = (label: string, before: DiffCell, after: DiffCell) => rows.push({ label, before, after });

  switch (item.action) {
    case 'CLASS_ASSIGN': {
      const bc = teacherCell(b);
      const ac = teacherCell(a);
      if (!same(bc, ac)) push('Giảng viên phụ trách', bc, ac);
      break;
    }
    case 'CLASS_ARCHIVE':
      if (!same(b.archived, a.archived)) push('Trạng thái lớp', text(b.archived ? 'Lưu trữ / Đã bế giảng' : 'Đang hoạt động'), text(a.archived ? 'Lưu trữ / Đã bế giảng' : 'Đang hoạt động'));
      break;
    case 'BULK_LOCK':
    case 'BULK_UNLOCK': {
      const before = Array.isArray(item.diff?.before) ? (item.diff.before as Array<Record<string, unknown>>) : [];
      const after = Array.isArray(item.diff?.after) ? (item.diff.after as Array<Record<string, unknown>>) : [];
      after.forEach((p, i) => push(String(p.email ?? `Người dùng ${i + 1}`), text(STATUS_VI[String(before[i]?.status)] ?? before[i]?.status), text(STATUS_VI[String(p.status)] ?? p.status)));
      break;
    }
    case 'CONFIG_UPDATE':
      if (item.targetId === 'GEMINI_API_KEY') push('Gemini API Key', text(b.masked ?? 'Chưa cấu hình'), text(a.masked));
      else if (!same(b.value, a.value)) push('Nội dung prompt', promptPreview(b.value), promptPreview(a.value));
      break;
    default: {
      // Hồ sơ người dùng: Trạng thái, Vai trò, Họ tên, Khối học, Mật khẩu...
      const fields: Array<[string, string, (v: unknown) => DiffCell]> = [
        ['fullName', 'Họ tên', text],
        ['email', 'Email', text],
        ['role', 'Vai trò', (v) => text(ROLE_VI_LABEL[String(v)] ?? v)],
        ['ageGroup', 'Khối học', (v) => text(v ? ageGroupLabel(String(v)) : null)],
        ['status', 'Trạng thái', (v) => text(STATUS_VI[String(v)] ?? v)],
        ['passwordReset', 'Mật khẩu', (v) => (v === true ? { type: 'text', value: 'Đã đặt lại' } : NONE)],
      ];
      for (const [key, label, cell] of fields) {
        if (!(key in a) && !(key in b)) continue;
        if (key === 'email' && item.action !== 'USER_CREATE') continue;
        if (same(b[key], a[key])) continue;
        push(label, cell(b[key]), cell(a[key]));
      }
    }
  }
  return rows;
}

/** Tên lớp/đối tượng nói về điều gì, để làm dòng giới thiệu phía trên thẻ so sánh. */
export function diffSubject(item: Pick<AuditLogItem, 'targetType' | 'targetId' | 'diff'>): string | null {
  if (item.targetType === 'CLASS') {
    const s = obj(item.diff?.after ?? item.diff?.before);
    return typeof s.className === 'string' ? `Lớp: ${s.className}` : null;
  }
  return null;
}

// ------------------------------- Chọn nhanh tại dòng -------------------------------

/** Gỡ một giảng viên khỏi danh sách; lớp luôn phải còn ít nhất một giảng viên nên gỡ người cuối cùng thì giữ nguyên. Người đầu danh sách là giảng viên chính. */
export function removeTeacher(ids: string[], id: string): string[] {
  return ids.length <= 1 ? ids : ids.filter((x) => x !== id);
}

export const initials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export interface StudentSuggestionInput {
  id: string;
  fullName: string;
  email: string;
  ageGroup: string | null;
  classCount?: number | null;
}

/**
 * Gợi ý học viên để thêm vào lớp: bỏ người đã trong lớp; ưu tiên cùng khối tuổi, rồi người chưa vào lớp nào; cuối cùng theo tên.
 */
export function rankStudentSuggestions<T extends StudentSuggestionInput>(list: T[], memberIds: ReadonlySet<string>, classAgeGroup: string | null): T[] {
  const score = (s: T) => (classAgeGroup && s.ageGroup === classAgeGroup ? 0 : 2) + (s.classCount === 0 ? 0 : 1);
  return list
    .filter((s) => !memberIds.has(s.id))
    .map((s, i) => ({ s, i }))
    .sort((a, b) => score(a.s) - score(b.s) || (a.s.fullName || a.s.email).localeCompare(b.s.fullName || b.s.email, 'vi') || a.i - b.i)
    .map((x) => x.s);
}

/** Lọc giảng viên theo tên/email khi gõ vào ô tìm kiếm trong hộp thả xuống (không phân biệt hoa thường và dấu). */
export function filterByText<T extends { fullName?: string; email?: string }>(list: T[], q: string): T[] {
  const fold = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase();
  const needle = fold(q.trim());
  return needle ? list.filter((t) => fold(`${t.fullName ?? ''} ${t.email ?? ''}`).includes(needle)) : list;
}

/** Giảng viên CHƯA được phân công cho lớp (để hiện trong hàng chọn nhanh). */
export function unassignedTeachers<T extends { id: string }>(all: T[], assignedIds: readonly string[]): T[] {
  const set = new Set(assignedIds);
  return all.filter((t) => !set.has(t.id));
}
