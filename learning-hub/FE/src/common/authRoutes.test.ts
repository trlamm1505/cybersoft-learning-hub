import { describe, expect, it } from 'vitest';
import { homeFor, isAuthPath } from './authRoutes';

describe('isAuthPath', () => {
  it('chỉ các trang xác thực', () => {
    for (const p of ['/login', '/register', '/forgot-password', '/reset-password']) expect(isAuthPath(p)).toBe(true);
    for (const p of ['/', '/catalog', '/playground', '/block-puzzle', '/loginx', '/admin/users']) expect(isAuthPath(p)).toBe(false);
  });
});

describe('homeFor (trang đích sau đăng nhập)', () => {
  it('học sinh 3-5 vào Kid Mode', () => expect(homeFor({ role: 'STUDENT', ageGroup: '3-5' })).toBe('/block-puzzle'));
  it('học sinh 6-9, 10-12 và chưa chọn nhóm tuổi vào Playground', () => {
    expect(homeFor({ role: 'STUDENT', ageGroup: '6-9' })).toBe('/playground');
    expect(homeFor({ role: 'STUDENT', ageGroup: '10-12' })).toBe('/playground');
    expect(homeFor({ role: 'STUDENT' })).toBe('/playground');
  });
  it('Người đi làm / Trái ngành vào Hub phòng thực hành chuyên ngành', () =>
    expect(homeFor({ role: 'STUDENT', ageGroup: 'CAREER_ADULT' })).toBe('/career-labs'));
  it('giảng viên vào soạn bài, admin vào trang quản trị', () => {
    expect(homeFor({ role: 'TEACHER' })).toBe('/teacher/dashboard');
    expect(homeFor({ role: 'ADMIN' })).toBe('/admin/dashboard');
  });
  it('chưa đăng nhập về /login', () => expect(homeFor(null)).toBe('/login'));
});
