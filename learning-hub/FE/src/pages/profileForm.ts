import type { AuthUser } from '../types/auth';

export const MAX_NAME = 100;
export const MAX_BIO = 300;
const PHONE = /^\+?[0-9][0-9 .\-()]{6,18}[0-9]$/;

export interface ProfileFormValues {
  fullName: string;
  phone: string;
  bio: string;
}

export const formFromUser = (u: Pick<AuthUser, 'fullName' | 'phone' | 'bio'>): ProfileFormValues => ({
  fullName: u.fullName ?? '',
  phone: u.phone ?? '',
  bio: u.bio ?? '',
});

/** Kiểm tra ở trình duyệt để báo lỗi tức thì; BE kiểm tra lại. Trả về lỗi theo từng trường. */
export function validateProfileForm(v: ProfileFormValues): Partial<Record<keyof ProfileFormValues, string>> {
  const errors: Partial<Record<keyof ProfileFormValues, string>> = {};
  const name = v.fullName.trim();
  if (!name) errors.fullName = 'Nhập họ và tên.';
  else if (name.length > MAX_NAME) errors.fullName = `Tối đa ${MAX_NAME} ký tự.`;
  const phone = v.phone.trim();
  if (phone && !PHONE.test(phone)) errors.phone = 'Số điện thoại không hợp lệ.';
  if (v.bio.trim().length > MAX_BIO) errors.bio = `Tối đa ${MAX_BIO} ký tự.`;
  return errors;
}

/** Chỉ gửi các trường đã đổi (không bao giờ gửi email). Rỗng nghĩa là không có gì để lưu. */
export function changedFields(user: Pick<AuthUser, 'fullName' | 'phone' | 'bio'>, v: ProfileFormValues): Partial<ProfileFormValues> {
  const before = formFromUser(user);
  const next: ProfileFormValues = { fullName: v.fullName.trim(), phone: v.phone.trim(), bio: v.bio.trim() };
  const out: Partial<ProfileFormValues> = {};
  for (const k of ['fullName', 'phone', 'bio'] as const) {
    if (next[k] !== before[k].trim()) out[k] = next[k];
  }
  return out;
}
