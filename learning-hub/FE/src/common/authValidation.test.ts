import { describe, expect, it } from 'vitest';
import { emailError, fullNameError, normalizeEmail, passwordError, unmetPasswordRules } from './authValidation';

describe('emailError', () => {
  it('trim rồi kiểm tra định dạng', () => {
    expect(normalizeEmail('  ban@example.com ')).toBe('ban@example.com');
    expect(emailError('  ban@example.com ')).toBeUndefined();
    expect(emailError('a.b+c@sub.domain.vn')).toBeUndefined();
  });
  it.each(['', '   ', 'ban', 'ban@', '@x.com', 'ban@example', 'ba n@example.com', 'ban@example.c', 'ban@@example.com'])('từ chối "%s"', (e) =>
    expect(emailError(e)).toBeDefined(),
  );
});

describe('passwordError', () => {
  it.each(['Abcdef1!', 'Mat-Khau#2026', 'Aa1!' + 'x'.repeat(28)])('"%s" hợp lệ', (p) => expect(passwordError(p)).toBeUndefined());

  it.each([
    ['', /Vui lòng nhập/],
    ['Ab1!', /8 đến 32/],
    ['Aa1!' + 'x'.repeat(29), /8 đến 32/],
    ['abcdefg1!', /chữ hoa/],
    ['ABCDEFG1!', /chữ thường/],
    ['Abcdefgh!', /chữ số/],
    ['Abcdefg12', /ký tự đặc biệt/],
  ])('"%s" bị báo lỗi', (p, re) => expect(passwordError(p)).toMatch(re));

  it('liệt kê đúng các điều kiện chưa đạt', () => {
    expect(unmetPasswordRules('abc').map((r) => r.id)).toEqual(['length', 'upper', 'digit', 'special']);
    expect(unmetPasswordRules('Abcdef1!')).toEqual([]);
  });
});

describe('fullNameError', () => {
  it('bắt buộc và tối đa 100 ký tự', () => {
    expect(fullNameError('  ')).toBeDefined();
    expect(fullNameError('x'.repeat(101))).toBeDefined();
    expect(fullNameError('Nguyễn Văn A')).toBeUndefined();
  });
});
