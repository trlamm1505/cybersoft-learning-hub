import { emailError, passwordError, passwordProblems } from './auth-validation';

describe('emailError', () => {
  it.each(['ban@example.com', 'a.b+c@sub.domain.vn', ' ban@example.com '])('%s hợp lệ (có trim)', (e) =>
    expect(emailError(e)).toBeUndefined(),
  );
  it.each(['', '   ', 'ban', 'ban@', '@example.com', 'ban@example', 'ban@exa mple.com', 'ba n@example.com', 'ban@example.c', 'ban@@example.com'])(
    '"%s" bị từ chối',
    (e) => expect(emailError(e)).toBeDefined(),
  );
  it('không phải chuỗi thì từ chối', () => {
    expect(emailError(undefined)).toBeDefined();
    expect(emailError(123)).toBeDefined();
  });
});

describe('passwordError (8–32 ký tự, hoa, thường, số, ký tự đặc biệt)', () => {
  it.each(['Abcdef1!', 'Mat-Khau#2026', 'A1b2c3d4"', 'Aa1!' + 'x'.repeat(28)])('"%s" hợp lệ', (p) =>
    expect(passwordError(p)).toBeUndefined(),
  );

  it.each([
    ['Ab1!', /dài từ 8 đến 32/],
    ['Aa1!' + 'x'.repeat(29), /dài từ 8 đến 32/],
    ['abcdefg1!', /chữ hoa/],
    ['ABCDEFG1!', /chữ thường/],
    ['Abcdefgh!', /chữ số/],
    ['Abcdefg12', /ký tự đặc biệt/],
  ])('"%s" thiếu điều kiện', (p, re) => expect(passwordError(p)).toMatch(re));

  it('liệt kê đủ mọi điều kiện còn thiếu', () => {
    expect(passwordProblems('abc')).toHaveLength(4);
    expect(passwordProblems('')).toHaveLength(5);
  });
});
