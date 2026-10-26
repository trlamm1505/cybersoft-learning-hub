import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from './LoginPage';
import { RegisterPage } from './RegisterPage';
import { Header } from '../components/Header';

const wrap = (el: React.ReactElement, path = '/') => renderToString(<MemoryRouter initialEntries={[path]}>{el}</MemoryRouter>);
const TERMS = 'Tôi đồng ý với Điều khoản dịch vụ và Chính sách bảo vệ dữ liệu học tập của CyberSoft';
const submitButton = (html: string, label: string) => new RegExp(`<button[^>]*type="submit"[^>]*>[^]*?${label}`).exec(html)?.[0] ?? '';

describe('Form Đăng nhập', () => {
  const html = wrap(<LoginPage onAuthSuccess={() => undefined} />, '/login');
  it('không có ô đồng ý điều khoản, nút Đăng nhập luôn bật (khi không đang gửi)', () => {
    expect(html).not.toContain(TERMS);
    expect(html).not.toContain('type="checkbox"');
    expect(submitButton(html, 'Đăng nhập')).not.toContain('disabled=""');
  });
  it('chưa nhập gì thì chưa hiện lỗi đỏ', () => {
    expect(html).not.toContain('role="alert"');
  });
});

describe('Form Đăng ký', () => {
  const html = wrap(<RegisterPage onAuthSuccess={() => undefined} />, '/register');
  it('có ô đồng ý điều khoản và nút Đăng ký bị khóa cho tới khi tick', () => {
    expect(html).toContain(TERMS);
    expect(submitButton(html, 'Đăng ký')).toContain('disabled=""');
  });
  it('gợi ý chính sách mật khẩu 8–32 ký tự ở ô mật khẩu; chưa gõ thì chưa hiện danh sách điều kiện', () => {
    expect(html).toContain('8–32 ký tự');
    expect(html).not.toContain('Điều kiện mật khẩu');
  });
});

describe('Header trang xác thực', () => {
  const props = { isLightTheme: true, onToggleTheme: () => undefined, userRole: 'student' as const, authUser: null, onLogout: () => undefined };

  it.each(['/login', '/register', '/forgot-password', '/reset-password'])('%s: chỉ có Logo và nút Sáng/Tối', (p) => {
    const html = wrap(<Header {...props} />, p);
    expect(html).toContain('data-testid="auth-header"');
    expect(html).toContain('CyberSoft');
    expect(html).toContain('Chuyển sang Giao diện Tối');
    for (const label of ['Danh mục khóa học', 'Playground', 'Cuộc thi', 'Thi Trắc Nghiệm', 'Đăng nhập', 'Đăng ký']) {
      expect(html).not.toContain(label);
    }
    expect(html.match(/<button/g)).toHaveLength(2);
  });

  it('trang thường vẫn có đầy đủ menu', () => {
    const html = wrap(<Header {...props} authUser={{ id: '1', email: 'a@b.com', fullName: 'A', role: 'STUDENT' }} />, '/catalog');
    expect(html).not.toContain('auth-header');
    expect(html).toContain('Danh mục khóa học');
  });
});
