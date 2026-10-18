import type { UserRole, UserStatus } from './teacherAnalytics';

export type AgeGroupKey = '3-5' | '6-9' | '10-12' | 'CAREER_ADULT';

export interface DashboardSummary {
  totalUsers: number;
  byRole: Record<UserRole, number>;
  lockedUsers: number;
  studentsByAgeGroup: Record<AgeGroupKey | 'NONE', number>;
  openClasses: number;
  totalClasses: number;
  submissionsToday: number;
  acToday: number;
  completionRateToday: number;
  submissionsLast7Days: Array<{ date: string; count: number }>;
  generatedAt: string;
}

export type HealthStatus = 'HEALTHY' | 'DEGRADED' | 'DOWN';

export interface ClusterHealth {
  key: 'auth_db' | 'core_engine' | 'ai_gateway' | 'submissions_classes' | 'contests';
  label: string;
  status: HealthStatus;
  latencyMs: number;
  detail: string;
}

export interface HealthReport {
  status: HealthStatus;
  checkedAt: string;
  clusters: ClusterHealth[];
}

export interface PortalClassRow {
  id: string;
  code: string | null;
  name: string;
  description: string;
  /** CAREER: khóa chuyên ngành của Người đi làm; SCHOOL: lớp phổ thông. */
  kind: 'CAREER' | 'SCHOOL';
  courseKey: 'tester-qa' | 'data-sql' | 'ai-prompt' | null;
  ageGroup: AgeGroupKey | null;
  /** locked: tài khoản giảng viên đang bị khóa (vẫn giữ lịch sử phân công). */
  teachers: Array<{ id: string; name: string; locked?: boolean }>;
  /** Id giảng viên "ma" (tài khoản đã bị xóa hoặc không còn là giảng viên): không gửi lại khi phân công, gỡ được tự do. */
  missingTeacherIds?: string[];
  studentCount: number;
  /** Số bài tập: bài giao cho lớp phổ thông, hoặc số bài lab của khóa. */
  exerciseCount: number;
  status: 'OPEN' | 'ARCHIVED';
}

export interface ClassExerciseItem {
  title: string;
  /** CODING | QUIZ (lớp phổ thông) hoặc TESTER | SQL | INSIGHT | AI (khóa Người đi làm). */
  kind: string;
  status: 'UPCOMING' | 'OPEN' | 'CLOSED';
  dueAt: string | null;
}

export interface PortalClassDetail extends PortalClassRow {
  exercises: ClassExerciseItem[];
  students: Array<{ id: string; fullName: string; email: string; studentCode: string | null; ageGroup: AgeGroupKey | null }>;
}

export type AuditAction =
  | 'USER_LOCK'
  | 'USER_UNLOCK'
  | 'ROLE_CHANGE'
  | 'CLASS_ASSIGN'
  | 'CLASS_ARCHIVE'
  | 'CLASS_CREATE'
  | 'CLASS_UPDATE'
  | 'CLASS_DELETE'
  | 'STUDENT_ADD'
  | 'STUDENT_REMOVE'
  | 'CONFIG_UPDATE'
  | 'BULK_LOCK'
  | 'BULK_UNLOCK'
  | 'USER_CREATE'
  | 'USER_UPDATE';

export interface AuditLogItem {
  id: string;
  timestamp: string;
  actorId: string;
  actorEmail: string;
  action: AuditAction;
  targetType: 'USER' | 'CLASS' | 'CONFIG';
  targetId: string;
  diff: { before: unknown; after: unknown };
}

export interface AuditLogList {
  items: AuditLogItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PromptConfig {
  configKey: string;
  key: 'coach' | 'debug' | 'ailab';
  title: string;
  description: string;
  value: string;
  isDefault: boolean;
  updatedAt: string | null;
  updatedBy: string | null;
  maxChars: number;
}

export interface ConfigsResponse {
  encryptionReady: boolean;
  gemini: {
    configured: boolean;
    source: 'database' | 'env' | 'none';
    masked: string;
    updatedAt: string | null;
    updatedBy: string | null;
  };
  prompts: PromptConfig[];
}

export interface GeminiTestResult {
  valid: boolean;
  latencyMs: number;
  reason?: string;
}

export interface PortalUserRow {
  id: string;
  fullName: string;
  email: string;
  studentCode: string | null;
  role: UserRole;
  status: UserStatus;
  ageGroup: AgeGroupKey | null;
  avatar: string | null;
  createdAt: string | null;
  classCount?: number | null;
}

export interface PortalUserList {
  items: PortalUserRow[];
  total: number;
  page: number;
  pageSize: number;
}

export interface BulkStatusResult {
  updated: number;
  changed: Array<{ id: string; email: string; before: UserStatus; after: UserStatus }>;
  skipped: Array<{ id: string; reason: string }>;
}
