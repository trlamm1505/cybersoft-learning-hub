import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { CareerCourseDetail, feedbackText, itemActionLabel, itemStateLabel, NO_FEEDBACK_TEXT } from './CareerMyClassPage';
import { BACK_TO_HUB_LABEL, LabHubBack } from '../components/LabBreadcrumb';
import type { CareerCourse } from '../types/careerCourses';

const text = (html: string) => html.replace(/<!-- -->/g, '').replace(/&amp;/g, '&').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

const course: CareerCourse = {
  key: 'tester-qa',
  title: 'Kiểm thử phần mềm thực chiến (Tester QA)',
  hubPath: '/tester-labs',
  teacherName: 'Cô Lan',
  status: 'IN_PROGRESS',
  totalItems: 12,
  attemptedItems: 3,
  doneItems: 1,
  percent: 8,
  earned: 8,
  max: 10,
  certificate: null,
  items: [
    { ref: 'LAB-01', title: 'LAB-01 · Bug hunt', path: '/tester-labs/LAB-01', state: 'DONE', score: 8, maxScore: 10, lastSubmittedAt: '2026-10-15T01:05:00.000Z', feedback: 'Test case bao phủ tốt các trường hợp biên', feedbackBy: 'TEACHER', attempts: 1 },
    { ref: 'LAB-02', title: 'LAB-02 · Exploratory', path: '/tester-labs/LAB-02', state: 'PENDING', score: null, maxScore: 10, lastSubmittedAt: '2026-10-15T02:00:00.000Z', feedback: null, feedbackBy: null, attempts: 1 },
    { ref: 'LAB-03', title: 'LAB-03 · API', path: '/tester-labs/LAB-03', state: 'NOT_STARTED', score: null, maxScore: 10, lastSubmittedAt: null, feedback: null, feedbackBy: null, attempts: 0 },
    { ref: 'LAB-04', title: 'LAB-04 · Form', path: '/tester-labs/LAB-04', state: 'IN_PROGRESS', score: null, maxScore: 10, lastSubmittedAt: '2026-10-14T23:30:00.000Z', feedback: 'Đạt: chất lượng 40/100', feedbackBy: 'SYSTEM', attempts: 2 },
  ],
};

describe('CareerMyClassPage (Master-Detail)', () => {
  it('nhãn trạng thái/điểm và nút hành động', () => {
    expect(itemStateLabel(course.items[0])).toBe('✅ Hoàn thành (8/10)');
    expect(itemStateLabel(course.items[1])).toBe('🟡 Chờ chấm');
    expect(itemStateLabel(course.items[2])).toBe('Chưa làm');
    expect(itemActionLabel('NOT_STARTED')).toBe('Làm bài');
    expect(itemActionLabel('DONE')).toBe('Làm lại');
    expect(itemActionLabel('PENDING')).toBe('Làm lại');
  });

  it('nhận xét: của giảng viên, của hệ thống, hoặc "Chưa có nhận xét"', () => {
    expect(feedbackText(course.items[0])).toBe('Test case bao phủ tốt các trường hợp biên');
    expect(feedbackText(course.items[3])).toBe('Hệ thống: Đạt: chất lượng 40/100');
    expect(feedbackText(course.items[2])).toBe(NO_FEEDBACK_TEXT);
    expect(NO_FEEDBACK_TEXT).toBe('Chưa có nhận xét');
  });

  it('cột phải: tên khóa, giảng viên, tỷ lệ hoàn thành và bảng 4 cột với liên kết vào từng bài', () => {
    const html = renderToString(
      <MemoryRouter>
        <CareerCourseDetail course={course} />
      </MemoryRouter>,
    );
    const t = text(html);
    expect(t).toContain('Kiểm thử phần mềm thực chiến (Tester QA)');
    expect(t).toContain('Giảng viên phụ trách: Cô Lan');
    expect(t).toContain('1/12 bài · 8%');
    for (const h of ['Bài lab / Bài tập', 'Trạng thái & Điểm số', 'Nộp gần nhất', 'Nhận xét của Giảng viên']) expect(t).toContain(h);
    expect(t).toContain('15/10/2026 08:05');
    expect(t).toContain('Chưa có nhận xét');
    expect(html).toContain('href="/tester-labs/LAB-01"');
    expect(html).toContain('href="/tester-labs/LAB-03"');
    expect(t).toContain('Làm bài');
    expect(t).toContain('Làm lại');
  });

  it('khóa đã hoàn thành có nút xem chứng chỉ', () => {
    const done: CareerCourse = {
      ...course,
      status: 'COMPLETED',
      certificate: { studentName: 'An', className: course.title, teacherName: 'Cô Lan', finalScore: 90, earned: 9, max: 10, grade: 'Xuất sắc', completedAt: '2026-10-15T00:00:00.000Z', code: 'CSH-2026-TESTERQA-ABCDEF12' },
    };
    const html = renderToString(
      <MemoryRouter>
        <CareerCourseDetail course={done} onViewCertificate={() => undefined} />
      </MemoryRouter>,
    );
    expect(text(html)).toContain('Xem chứng chỉ hoàn thành');
    expect(text(html)).toContain('Đã hoàn thành');
  });
});

describe('LabHubBack', () => {
  it('nút ⬅ Quay lại Phòng thực hành chuyên ngành và breadcrumb theo bộ lab', () => {
    expect(BACK_TO_HUB_LABEL).toBe('⬅ Quay lại Phòng thực hành chuyên ngành');
    for (const [group, name] of [['TESTER', 'Bộ lab Tester'], ['DATA', 'Data Lab'], ['AI', 'AI Lab']] as const) {
      const html = renderToString(
        <MemoryRouter>
          <LabHubBack group={group} />
        </MemoryRouter>,
      );
      const t = text(html);
      expect(t).toContain('⬅ Quay lại Phòng thực hành chuyên ngành');
      expect(t).toContain(`Phòng thực hành chuyên ngành ${name}`);
      expect(html).toContain('href="/career-labs"');
    }
  });
});
