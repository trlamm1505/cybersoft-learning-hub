import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { STUDENT_NAV } from './Header';
import { KidHeader } from './KidHeader';
import { KID_NAV } from '../common/kidMode';

describe('điều hướng học viên', () => {
  it('menu học viên thường có Thi Trắc Nghiệm trỏ /quiz', () => {
    const quiz = STUDENT_NAV.find((i) => i.key === 'quiz');
    expect(quiz).toMatchObject({ label: 'Thi Trắc Nghiệm', path: '/quiz' });
    expect(STUDENT_NAV.map((i) => i.path)).toEqual(['/catalog', '/playground', '/quiz', '/contests']);
  });

  it('Kid Mode không có lối vào Quiz hay mục kỹ thuật nào', () => {
    expect((KID_NAV.map((n) => n.path) as string[]).includes('/quiz')).toBe(false);
    const html = renderToString(
      <MemoryRouter>
        <KidHeader authUser={null} onLogout={() => undefined} />
      </MemoryRouter>,
    );
    for (const n of KID_NAV) expect(html).toContain(n.label);
    expect(html).not.toMatch(/Trắc Nghiệm|Playground|Code/);
  });

  it('KidHeader co giãn trên điện thoại: 3 nút chia đều hàng riêng, logo thu gọn', () => {
    const html = renderToString(
      <MemoryRouter>
        <KidHeader authUser={null} onLogout={() => undefined} />
      </MemoryRouter>,
    );
    expect(html).toContain('grid-cols-3');
    expect(html).toContain('order-last');
    expect(html).toContain('hidden sm:inline');
    expect(html).toContain('flex-wrap');
  });
});
