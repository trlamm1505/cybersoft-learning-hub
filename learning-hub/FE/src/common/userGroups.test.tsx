import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { careerBlockedPath, isCareerAdult, USER_GROUP_OPTIONS } from './userGroups';
import { CAREER_ADULT_NAV } from '../components/Header';
import { CAREER_LAB_CARDS, CareerLabsPage } from '../pages/CareerLabsPage';

describe('Người đi làm / Trái ngành', () => {
  it('đăng ký có lựa chọn thứ 4 CAREER_ADULT', () => {
    expect(USER_GROUP_OPTIONS.map((o) => o.value)).toEqual(['3-5', '6-9', '10-12', 'CAREER_ADULT']);
    expect(USER_GROUP_OPTIONS[3].label).toBe('Người đi làm / Trái ngành');
  });

  it('chỉ STUDENT có ageGroup CAREER_ADULT mới là người đi làm', () => {
    expect(isCareerAdult({ role: 'STUDENT', ageGroup: 'CAREER_ADULT' })).toBe(true);
    expect(isCareerAdult({ role: 'STUDENT', ageGroup: '6-9' })).toBe(false);
    expect(isCareerAdult({ role: 'TEACHER', ageGroup: 'CAREER_ADULT' })).toBe(false);
    expect(isCareerAdult(null)).toBe(false);
  });

  it('navbar CAREER_ADULT_NAV có đúng 3 mục theo thứ tự', () => {
    expect(CAREER_ADULT_NAV.map((i) => i.label)).toEqual(['Phòng thực hành chuyên ngành', 'Lớp học của tôi', 'Danh mục khóa học']);
    expect(CAREER_ADULT_NAV.map((i) => i.path)).toEqual(['/career-labs', '/my-class', '/catalog']);
  });

  it('chặn Playground, Quiz phổ thông, Cuộc thi; vẫn mở bài giao của lớp (?assignment=)', () => {
    for (const p of ['/playground', '/quiz', '/contests', '/contests/abc', '/block-puzzle', '/progress']) expect(careerBlockedPath(p)).toBe(true);
    expect(careerBlockedPath('/playground', '?slug=x&assignment=123')).toBe(false);
    expect(careerBlockedPath('/quiz', '?assignment=123')).toBe(false);
    for (const p of ['/career-labs', '/my-class', '/catalog', '/da-labs/x', '/ai-labs', '/tester-labs/LAB-01', '/profile', '/detail']) expect(careerBlockedPath(p)).toBe(false);
  });

  it('Hub /career-labs dẫn vào 3 phòng lab', () => {
    expect(CAREER_LAB_CARDS.map((c) => c.path)).toEqual(['/da-labs', '/ai-labs', '/tester-labs']);
    const html = renderToString(
      <MemoryRouter>
        <CareerLabsPage />
      </MemoryRouter>,
    );
    for (const p of ['/da-labs', '/ai-labs', '/tester-labs']) expect(html).toContain(`href="${p}"`);
    expect(html).toContain('Phòng thực hành chuyên ngành');
  });
});
