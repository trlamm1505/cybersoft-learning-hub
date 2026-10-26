import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { TeacherLayout, TEACHER_NAV } from './TeacherLayout';
import { AUTHORING_TABS, isSubNavActive } from './TeacherSubNav';

const user = { id: 't1', email: 't@x.com', fullName: 'Cô Hương', role: 'TEACHER' } as never;

describe('Teacher Studio V2 shell', () => {
  it('sidebar có đúng 4 mục chính', () => {
    expect(TEACHER_NAV.map((n) => n.to)).toEqual([
      '/teacher/dashboard',
      '/teacher/classes',
      '/teacher/grading',
      '/teacher/authoring',
    ]);
  });

  it('công cụ nội bộ không nằm trong menu', () => {
    const joined = TEACHER_NAV.map((n) => n.to).join(' ');
    expect(joined).not.toMatch(/harness|usability|resilience/);
  });

  it('render 4 liên kết điều hướng, không còn top navbar cũ', () => {
    const html = renderToString(
      <MemoryRouter initialEntries={['/teacher/classes']}>
        <Routes>
          <Route element={<TeacherLayout authUser={user} isLightTheme onToggleTheme={() => {}} onLogout={() => {}} />}>
            <Route path="/teacher/classes" element={<div>nội dung</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    const navHtml = html.match(/<nav aria-label="Điều hướng Teacher Studio"[\s\S]*?<\/nav>/)?.[0] ?? '';
    expect(navHtml.match(/<a /g)).toHaveLength(4);
    expect(html).toContain('nội dung');
  });

  it('Soạn đề chỉ còn 2 chế độ: thủ công và AI Tạo Đề', () => {
    expect(AUTHORING_TABS.map((t) => t.label)).toEqual(['Soạn bài thủ công', 'AI Tạo Đề', 'Ngân hàng đề']);
    expect(AUTHORING_TABS.filter((t) => t.requiresAi).map((t) => t.to)).toEqual(['/teacher/authoring/ai', '/teacher/authoring/bank']);
    const [manual, ai] = AUTHORING_TABS;
    expect(isSubNavActive(manual, '/teacher/authoring', '')).toBe(true);
    expect(isSubNavActive(manual, '/teacher/authoring/ai', '')).toBe(false);
    expect(isSubNavActive(ai, '/teacher/authoring/ai', '')).toBe(true);
  });
});

import { AdminLayout, isSubItemActive } from './AdminLayout';
import { teacherNavWithClasses } from './TeacherLayout';

const cls = (id: string, name: string, ageGroup: string) =>
  ({ id, name, ageGroup, code: '', teacherId: 't', description: '', archived: false, studentCount: 0, exerciseCount: 0, status: 'ACTIVE', pendingSubmissions: 0, isPrimaryTeacher: true, coTeachers: [] }) as never;

const renderAt = (path: string, classes: never[] | null) =>
  renderToString(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<AdminLayout authUser={user} nav={teacherNavWithClasses(classes)} portalLabel="Teacher Studio" isLightTheme onToggleTheme={() => {}} onLogout={() => {}} />}>
          <Route path="/teacher/classes" element={<div>trang lớp</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );

describe('Sidebar "Lớp học của tôi": chỉ lớp được phân công', () => {
  it('chỉ đúng các lớp API trả về, kèm biểu tượng khối và link ?classId=', () => {
    const nav = teacherNavWithClasses([cls('c1', 'Lập trình Sáng tạo Nhí (K3-5)', '3-5')]);
    const classesEntry = nav.find((n) => n.to === '/teacher/classes')!;
    expect(classesEntry.subItems).toEqual([{ key: 'c1', to: '/teacher/classes?classId=c1', label: 'Lập trình Sáng tạo Nhí (K3-5)', icon: '🎒' }]);
    const html = renderAt('/teacher/classes?classId=c1', [cls('c1', 'Lập trình Sáng tạo Nhí (K3-5)', '3-5')]);
    expect(html.match(/href="\/teacher\/classes\?classId=/g)).toHaveLength(1);
    expect(html).toContain('aria-current="page"');
  });

  it('chưa được phân công lớp nào: không có lớp con, hiện thông báo lịch sự', () => {
    const html = renderAt('/teacher/classes', []);
    expect(html).not.toMatch(/classId=/);
    expect(html).toContain('Bạn chưa được phân công lớp học nào.');
  });

  it('lỗi tải danh sách lớp: không hiện lớp nào và không báo nhầm "chưa được phân công"', () => {
    const entry = teacherNavWithClasses(null, true).find((n) => n.to === '/teacher/classes')!;
    expect(entry.subItems).toEqual([]);
    expect(entry.emptyText).toContain('Không tải được');
  });

  it('các mục khác không có accordion', () => {
    expect(teacherNavWithClasses([]).filter((n) => n.subItems !== undefined).map((n) => n.to)).toEqual(['/teacher/classes']);
  });

  it('mục con sáng theo đúng classId trên URL', () => {
    expect(isSubItemActive('/teacher/classes?classId=a', '/teacher/classes', '?classId=a')).toBe(true);
    expect(isSubItemActive('/teacher/classes?classId=a', '/teacher/classes', '?classId=b')).toBe(false);
    expect(isSubItemActive('/teacher/classes?classId=a', '/teacher/grading', '?classId=a')).toBe(false);
  });
});

describe('Lớp đã lưu trữ trên sidebar giảng viên', () => {
  it('vẫn hiện, kèm badge "Đã lưu trữ"; lớp đang hoạt động không có badge', () => {
    const archived = { ...(cls('c2', 'Lớp Demo Dashboard', '10-12') as object), status: 'ARCHIVED' } as never;
    const nav = teacherNavWithClasses([cls('c1', 'K3-5', '3-5'), archived]);
    const subs = nav.find((n) => n.to === '/teacher/classes')!.subItems!;
    expect(subs.map((s) => [s.label, s.badge])).toEqual([
      ['K3-5', undefined],
      ['Lớp Demo Dashboard', 'Đã lưu trữ'],
    ]);
    const html = renderAt('/teacher/classes?classId=c2', [cls('c1', 'K3-5', '3-5'), archived]);
    expect(html).toContain('Đã lưu trữ');
    expect(html.match(/href="\/teacher\/classes\?classId=/g)).toHaveLength(2);
  });
});

import { TeacherClassesContext } from './teacherClassesContext';
import { TeacherSubNav } from './TeacherSubNav';
import { canUseAiGeneratorFor } from '../pages/teacherClassesModel';

describe('AI Tạo Đề chỉ hiện khi phụ trách lớp K6-9 / K10-12', () => {
  const renderNav = (classes: unknown[] | null) =>
    renderToString(
      <MemoryRouter initialEntries={['/teacher/authoring']}>
        <TeacherClassesContext.Provider value={{ classes: classes as never, loadFailed: false }}>
          <Routes>
            <Route path="/teacher/authoring" element={<TeacherSubNav title="Soạn đề" items={AUTHORING_TABS} />} />
          </Routes>
        </TeacherClassesContext.Provider>
      </MemoryRouter>,
    );

  it('có lớp K10-12 -> thấy tab AI Tạo Đề; chỉ K3-5 / Career / lớp lưu trữ / đang tải -> không thấy', () => {
    expect(renderNav([cls('a', 'K10-12', '10-12')])).toContain('AI Tạo Đề');
    expect(renderNav([cls('a', 'K3-5', '3-5')])).not.toContain('AI Tạo Đề');
    expect(renderNav([{ ...(cls('a', 'Tester', null as never) as object), courseKey: 'tester-qa' }])).not.toContain('AI Tạo Đề');
    expect(renderNav([{ ...(cls('a', 'K6-9', '6-9') as object), status: 'ARCHIVED' }])).not.toContain('AI Tạo Đề');
    expect(renderNav(null)).not.toContain('AI Tạo Đề');
    expect(renderNav([cls('a', 'K6-9', '6-9')])).toContain('Soạn bài thủ công');
  });

  it('khớp quy tắc BE canUseAiGenerator', () => {
    expect(canUseAiGeneratorFor([{ ageGroup: '6-9' }])).toBe(true);
    expect(canUseAiGeneratorFor([{ ageGroup: '3-5' }, { ageGroup: null, courseKey: 'data-sql' }])).toBe(false);
    expect(canUseAiGeneratorFor([{ ageGroup: '10-12', status: 'ARCHIVED' }])).toBe(false);
  });
});

describe('Mục "Cuộc thi": chỉ cho giảng viên phụ trách lớp K6-9 / K10-12', () => {
  it('có mục khi phụ trách lớp 6-9 hoặc 10-12', () => {
    expect(teacherNavWithClasses([cls('c1', 'Python (K6-9)', '6-9')]).map((n) => n.to)).toContain('/teacher/contests');
    expect(teacherNavWithClasses([cls('c2', 'Thuật toán (K10-12)', '10-12')]).map((n) => n.to)).toContain('/teacher/contests');
  });

  it('không có mục khi chỉ phụ trách K3-5, chưa tải xong hoặc lỗi tải', () => {
    expect(teacherNavWithClasses([cls('c1', 'Nhí', '3-5')]).map((n) => n.to)).not.toContain('/teacher/contests');
    expect(teacherNavWithClasses(null).map((n) => n.to)).not.toContain('/teacher/contests');
    expect(teacherNavWithClasses(null, true).map((n) => n.to)).not.toContain('/teacher/contests');
  });
});
