import React, { useEffect, useMemo, useState } from 'react';
import { ClipboardCheck, LayoutDashboard, PenTool, School, Trophy } from 'lucide-react';
import type { AuthUser } from '../types/auth';
import type { TeacherClassSummary } from '../types/teacherAnalytics';
import teacherAnalyticsApi from '../axios/teacherAnalyticsApi';
import { canUseAiGeneratorFor, classGroupIcon, NO_ASSIGNED_CLASS_SHORT } from '../pages/teacherClassesModel';
import { TeacherClassesContext } from './teacherClassesContext';
import { AdminLayout, type NavEntry, type NavSubItem } from './AdminLayout';

/** Đúng 4 mục chính của Teacher Studio. Công cụ nội bộ (QA Harness, Usability, Bảo mật) chỉ ẩn khỏi menu, vẫn vào được bằng URL. */
export const TEACHER_NAV: NavEntry[] = [
  { to: '/teacher/dashboard', label: 'Tổng quan', Icon: LayoutDashboard },
  { to: '/teacher/classes', label: 'Lớp học của tôi', Icon: School },
  { to: '/teacher/grading', label: 'Chấm bài', Icon: ClipboardCheck },
  { to: '/teacher/authoring', label: 'Soạn đề', Icon: PenTool },
];

/**
 * Mục con của "Lớp học của tôi": CHỈ các lớp BE trả về từ GET /teacher/classes, tức các lớp tài khoản này có tên trong
 * teacherId hoặc teacherIds. Không có danh sách lớp nào được viết cứng ở FE.
 */
export function classSubItems(classes: TeacherClassSummary[]): NavSubItem[] {
  return classes.map((c) => ({
    key: c.id,
    to: `/teacher/classes?classId=${encodeURIComponent(c.id)}`,
    label: c.name,
    icon: classGroupIcon(c.ageGroup),
    ...(c.status === 'ARCHIVED' ? { badge: 'Đã lưu trữ' } : {}),
  }));
}

export const CLASS_LOAD_ERROR = 'Không tải được danh sách lớp. Vui lòng tải lại trang.';

/**
 * Thêm accordion danh sách lớp vào menu chuẩn (null = đang tải). Lỗi tải không bị coi là "chưa được phân công":
 * khi đó không hiện lớp nào và báo lỗi tải.
 */
/** Mục "Cuộc thi": chỉ giảng viên phụ trách lớp K6-9 / K10-12 (cùng điều kiện với AI Tạo Đề). */
export const CONTEST_NAV: NavEntry = { to: '/teacher/contests', label: 'Cuộc thi', Icon: Trophy };

export function teacherNavWithClasses(classes: TeacherClassSummary[] | null, loadFailed = false): NavEntry[] {
  const withClasses = TEACHER_NAV.map((n) =>
    n.to === '/teacher/classes'
      ? { ...n, subItems: loadFailed ? [] : classes === null ? null : classSubItems(classes), emptyText: loadFailed ? CLASS_LOAD_ERROR : NO_ASSIGNED_CLASS_SHORT }
      : n,
  );
  return !loadFailed && classes !== null && canUseAiGeneratorFor(classes) ? [...withClasses, CONTEST_NAV] : withClasses;
}

interface Props {
  authUser: AuthUser;
  isLightTheme: boolean;
  onToggleTheme: () => void;
  onLogout: () => void;
}

/** Khung Teacher Studio V2: dùng chung Shell với Admin Portal (sidebar trái, vùng nội dung bên phải). */
export const TeacherLayout: React.FC<Props> = (props) => {
  const [classes, setClasses] = useState<TeacherClassSummary[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    teacherAnalyticsApi
      .getClasses()
      .then((list) => {
        if (cancelled) return;
        setLoadFailed(false);
        setClasses(list);
      })
      // Lỗi tải: không suy diễn hiển thị lớp nào, cũng không báo nhầm là chưa được phân công.
      .catch(() => !cancelled && setLoadFailed(true));
    return () => {
      cancelled = true;
    };
  }, [props.authUser.id]);

  const nav = useMemo(() => teacherNavWithClasses(classes, loadFailed), [classes, loadFailed]);
  return (
    <TeacherClassesContext.Provider value={{ classes, loadFailed }}>
      <AdminLayout {...props} nav={nav} portalLabel="Teacher Studio" profilePath="/teacher/profile" />
    </TeacherClassesContext.Provider>
  );
};

export default TeacherLayout;
