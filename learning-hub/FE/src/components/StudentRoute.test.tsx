import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { StudentRoute } from './StudentRoute';
import { ROLE_LABEL, isStaff } from '../types/auth';
import type { AuthUser } from '../types/auth';

const user = (role: AuthUser['role']): AuthUser => ({ id: '1', email: 'x@y.vn', fullName: 'X', role });

const render = (authUser: AuthUser | null) =>
  renderToString(
    <MemoryRouter>
      <StudentRoute authUser={authUser}>
        <div>GIAO_DIEN_LAM_BAI</div>
      </StudentRoute>
    </MemoryRouter>,
  );

describe('StudentRoute', () => {
  it('học viên thấy giao diện làm bài', () => {
    expect(render(user('STUDENT'))).toContain('GIAO_DIEN_LAM_BAI');
  });

  it.each(['TEACHER', 'ADMIN'] as const)('[M6] %s không render giao diện làm bài', (role) => {
    expect(render(user(role))).not.toContain('GIAO_DIEN_LAM_BAI');
  });

  it('chưa đăng nhập không render giao diện làm bài', () => {
    expect(render(null)).not.toContain('GIAO_DIEN_LAM_BAI');
  });
});

describe('[M6] ma trận quyền FE', () => {
  it('ADMIN và TEACHER là staff; có nhãn tiếng Việt cho cả 3 vai trò', () => {
    expect(isStaff('ADMIN')).toBe(true);
    expect(isStaff('TEACHER')).toBe(true);
    expect(isStaff('STUDENT')).toBe(false);
    expect(ROLE_LABEL.ADMIN).toBe('Quản trị viên');
  });
});
