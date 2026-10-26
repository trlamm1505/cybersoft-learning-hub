import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { CourseCertificateModal } from './CourseCertificateModal';
import { EnrolledClassesList } from './EnrolledClassesSection';
import { formatCertificateDate, formatScore } from '../../common/enrollmentFormat';
import type { EnrollmentCertificate, MyEnrollment } from '../../types/studentClasses';

const text = (html: string) => html.replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

const cert: EnrollmentCertificate = {
  studentName: 'Nguyễn Văn An',
  className: 'Lớp Python 6-9 Sáng thứ 7',
  teacherName: 'Cô Lan',
  finalScore: 92.5,
  earned: 37,
  max: 40,
  grade: 'Xuất sắc',
  completedAt: '2026-09-25T17:30:00.000Z',
  code: 'CSH-2026-69PY01-3A9F12BC',
};

const done: MyEnrollment = {
  classId: 'c1',
  className: 'Lớp Python 6-9',
  classCode: 'CL-69PY01',
  teacherName: 'Cô Lan',
  status: 'COMPLETED',
  totalAssignments: 4,
  doneCount: 4,
  earned: 37,
  max: 40,
  percent: 92.5,
  certificate: cert,
};
const studying: MyEnrollment = { ...done, classId: 'c2', className: 'Lớp thuật toán', status: 'IN_PROGRESS', doneCount: 1, certificate: null };

describe('CourseCertificateModal', () => {
  it('hiện logo CyberSoft, họ tên, điểm tổng kết, xếp loại, ngày hoàn thành và mã chứng chỉ', () => {
    const html = renderToString(<CourseCertificateModal certificate={cert} onClose={() => undefined} />);
    const t = text(html);
    expect(t).toContain('CyberSoft');
    expect(t).toContain('Chứng nhận hoàn thành');
    expect(t).toContain('Nguyễn Văn An');
    expect(t).toContain('92,5 / 100');
    expect(t).toContain('Xuất sắc');
    expect(t).toContain('Lớp Python 6-9 Sáng thứ 7');
    expect(t).toContain('CSH-2026-69PY01-3A9F12BC');
    // 17:30 UTC ngày 25 = 00:30 ngày 26 giờ Việt Nam.
    expect(t).toContain('26/09/2026');
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
  });

  it('định dạng ngày/điểm', () => {
    expect(formatCertificateDate('2026-09-25T17:30:00.000Z')).toBe('26/09/2026');
    expect(formatCertificateDate('không phải ngày')).toBe('');
    expect(formatScore(95)).toBe('95');
    expect(formatScore(87.54)).toBe('87,5');
  });
});

describe('EnrolledClassesList', () => {
  it('hiện tên lớp, giảng viên, trạng thái; chỉ lớp đã hoàn thành mới có nút 👁️ xem chứng chỉ', () => {
    const html = renderToString(<EnrolledClassesList items={[done, studying]} onViewCertificate={() => undefined} />);
    const t = text(html);
    expect(t).toContain('Lớp Python 6-9');
    expect(t).toContain('Giảng viên: Cô Lan');
    expect(t).toContain('Đã hoàn thành');
    expect(t).toContain('Đang học');
    expect(html.match(/Xem chứng chỉ lớp/g)?.length).toBe(1);
    expect(html).toContain('Xem chứng chỉ lớp Lớp Python 6-9');
    expect(html).not.toContain('Xem chứng chỉ lớp Lớp thuật toán');
  });
});
