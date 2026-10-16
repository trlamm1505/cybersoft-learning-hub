import { describe, expect, it } from 'vitest';
import { changedFields, formFromUser, MAX_BIO, MAX_NAME, validateProfileForm } from './profileForm';

const user = { fullName: 'An', phone: '0912345678', bio: 'Xin chào' };

describe('validateProfileForm', () => {
  const ok = { fullName: 'Nguyễn Văn An', phone: '+84 912-345-678', bio: 'Giới thiệu' };

  it('hợp lệ thì không có lỗi; điện thoại và giới thiệu được để trống', () => {
    expect(validateProfileForm(ok)).toEqual({});
    expect(validateProfileForm({ fullName: 'An', phone: '', bio: '' })).toEqual({});
  });

  it('báo lỗi theo từng trường', () => {
    expect(validateProfileForm({ ...ok, fullName: '  ' }).fullName).toBe('Nhập họ và tên.');
    expect(validateProfileForm({ ...ok, fullName: 'x'.repeat(MAX_NAME + 1) }).fullName).toMatch(/Tối đa/);
    expect(validateProfileForm({ ...ok, phone: 'abc' }).phone).toBe('Số điện thoại không hợp lệ.');
    expect(validateProfileForm({ ...ok, phone: '12' }).phone).toBeDefined();
    expect(validateProfileForm({ ...ok, bio: 'x'.repeat(MAX_BIO + 1) }).bio).toMatch(/Tối đa/);
  });
});

describe('changedFields', () => {
  it('chỉ gồm trường đã đổi, đã cắt khoảng trắng; không đổi gì thì rỗng', () => {
    expect(changedFields(user, formFromUser(user))).toEqual({});
    expect(changedFields(user, { fullName: ' An Mới ', phone: '0912345678', bio: 'Xin chào' })).toEqual({ fullName: 'An Mới' });
    expect(changedFields(user, { fullName: 'An', phone: '', bio: 'Khác' })).toEqual({ phone: '', bio: 'Khác' });
  });

  it('không bao giờ có trường email, kể cả khi form có thêm trường lạ', () => {
    const form = { fullName: 'B', phone: '', bio: '', email: 'x@y.com' } as never;
    expect(Object.keys(changedFields(user, form))).not.toContain('email');
  });

  it('người dùng chưa có phone/bio (undefined) coi như rỗng', () => {
    expect(changedFields({ fullName: 'An' }, { fullName: 'An', phone: '', bio: '' })).toEqual({});
    expect(formFromUser({ fullName: 'An' })).toEqual({ fullName: 'An', phone: '', bio: '' });
  });
});
