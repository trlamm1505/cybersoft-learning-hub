import { describe, expect, it } from 'vitest';
import { isKidAllowedPath, isKidMode, KID_NAV } from './kidMode';
import type { AuthUser } from '../types/auth';

const user = (role: AuthUser['role'], ageGroup?: AuthUser['ageGroup']): AuthUser => ({
  id: '1',
  email: 'x@y.vn',
  fullName: 'X',
  role,
  ageGroup,
});

describe('kidMode', () => {
  it('học viên 3-5 luôn ở Kid Mode, nhóm khác và khách thì không', () => {
    expect(isKidMode(user('STUDENT', '3-5'))).toBe(true);
    expect(isKidMode(user('STUDENT', '6-9'))).toBe(false);
    expect(isKidMode(user('STUDENT', '10-12'))).toBe(false);
    expect(isKidMode(user('STUDENT'))).toBe(false);
    expect(isKidMode(null)).toBe(false);
  });

  it('?kid=1 chỉ có tác dụng với giảng viên/admin, học viên không tự bật được', () => {
    expect(isKidMode(user('TEACHER'), '?kid=1')).toBe(true);
    expect(isKidMode(user('TEACHER'), '')).toBe(false);
    expect(isKidMode(user('STUDENT', '10-12'), '?kid=1')).toBe(false);
    expect(isKidMode(null, '?kid=1')).toBe(false);
  });

  it('Kid Mode chỉ cho vào Góc Học Tập, Block Puzzle, Thành tích, Hồ sơ, Đăng nhập', () => {
    for (const p of ['/playground', '/block-puzzle', '/progress', '/kid-leaderboard', '/profile', '/login']) expect(isKidAllowedPath(p)).toBe(true);
    for (const p of ['/catalog', '/da-labs', '/authoring', '/teacher/exercises', '/admin/users', '/playgroundx']) {
      expect(isKidAllowedPath(p)).toBe(false);
    }
  });

  it('thanh điều hướng Kid có đúng 3 nút, Góc Học Tập trỏ vào Block Puzzle', () => {
    expect(KID_NAV.map((n) => n.label)).toEqual(['Góc Học Tập', 'Bảng Thành Tích', 'Bảng Vinh Danh']);
    expect(KID_NAV[0].path).toBe('/block-puzzle');
    expect(KID_NAV[1].path).toBe('/progress');
    expect(KID_NAV[2].path).toBe('/kid-leaderboard');
  });
});
