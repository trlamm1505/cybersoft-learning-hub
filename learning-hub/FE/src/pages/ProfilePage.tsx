import React, { useEffect, useState } from 'react';
import { Camera } from 'lucide-react';
import type { AuthUser } from '../types/auth';
import { ROLE_LABEL } from '../types/auth';
import learnerApi from '../axios/learnerApi';
import authApi from '../axios/authApi';
import { changedFields, formFromUser, validateProfileForm, type ProfileFormValues } from './profileForm';
import { UserAvatar } from '../components/UserAvatar';
import { AvatarEditor } from '../components/profile/AvatarEditor';
import { ActivityHeatmap } from '../components/profile/ActivityHeatmap';

interface ProfilePageProps {
  authUser: AuthUser;
  /** Gọi khi đổi/xóa ảnh đại diện để cập nhật phiên đăng nhập (header, localStorage). */
  onAvatarChange?: (avatar: string | undefined) => void;
  /** Gọi khi lưu hồ sơ thành công để cập nhật phiên đăng nhập (tên ở header, localStorage). */
  onProfileChange?: (user: AuthUser) => void;
}

const AGE_GROUP_LABEL: Record<string, string> = {
  '3-5': 'Lớp 3-5',
  '6-9': 'Lớp 6-9',
  '10-12': 'Lớp 10-12',
};

/** Một dòng thông tin: nhãn mờ bên trái, giá trị rõ bên phải, ngăn cách bằng đường kẻ mảnh. */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-[var(--border-color)] py-3 last:border-b-0">
      <dt className="text-sm text-[var(--text-muted)]">{label}</dt>
      <dd className="m-0 min-w-0 break-words text-right text-sm font-medium text-[var(--text-main)]">{value}</dd>
    </div>
  );
}

const fieldInput =
  'w-full rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500';

/** Thông tin cá nhân: xem, hoặc sửa họ tên, số điện thoại, giới thiệu. Email luôn bị khóa. */
function ProfileInfoSection({ authUser, onUpdated }: { authUser: AuthUser; onUpdated?: (user: AuthUser) => void }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ProfileFormValues>(() => formFromUser(authUser));
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const errors = validateProfileForm(form);
  const changes = changedFields(authUser, form);
  const canSave = Object.keys(errors).length === 0 && Object.keys(changes).length > 0 && !saving;

  const startEdit = () => {
    setForm(formFromUser(authUser));
    setServerError(null);
    setSaved(false);
    setEditing(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    setServerError(null);
    try {
      const updated = await authApi.updateProfile(changes);
      onUpdated?.(updated);
      setEditing(false);
      setSaved(true);
    } catch (err) {
      setServerError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Không lưu được. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const set = (k: keyof ProfileFormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSaved(false);
    setForm((f) => ({ ...f, [k]: e.target.value }));
  };

  return (
    <section aria-label="Thông tin cá nhân" className="min-w-0">
      <div className="mb-1 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-[var(--text-main)]">Thông tin cá nhân</h2>
        {!editing && (
          <button type="button" onClick={startEdit} className="cursor-pointer text-xs text-indigo-600 underline dark:text-indigo-400">
            Chỉnh sửa
          </button>
        )}
      </div>

      {editing ? (
        <form onSubmit={save} className="space-y-3 border-t border-[var(--border-color)] pt-3">
          <label className="block">
            <span className="mb-1 block text-xs text-[var(--text-muted)]">Họ và tên</span>
            <input value={form.fullName} maxLength={100} onChange={set('fullName')} className={fieldInput} aria-invalid={!!errors.fullName} />
            {errors.fullName && <span className="text-xs text-rose-500">{errors.fullName}</span>}
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-[var(--text-muted)]">Email</span>
            <input value={authUser.email} disabled readOnly aria-readonly="true" className={`${fieldInput} cursor-not-allowed opacity-60`} />
            <span className="text-xs text-[var(--text-muted)]">Email gắn với danh tính tài khoản nên không thể thay đổi.</span>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-[var(--text-muted)]">Số điện thoại</span>
            <input value={form.phone} inputMode="tel" maxLength={21} onChange={set('phone')} placeholder="Không bắt buộc" className={fieldInput} aria-invalid={!!errors.phone} />
            {errors.phone && <span className="text-xs text-rose-500">{errors.phone}</span>}
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-[var(--text-muted)]">Giới thiệu bản thân</span>
            <textarea value={form.bio} rows={3} maxLength={300} onChange={set('bio')} placeholder="Vài dòng về bạn" className={`${fieldInput} resize-y`} aria-invalid={!!errors.bio} />
            <span className="block text-right text-[11px] text-[var(--text-muted)]">{form.bio.length}/300</span>
            {errors.bio && <span className="text-xs text-rose-500">{errors.bio}</span>}
          </label>
          {serverError && (
            <p role="alert" className="text-xs text-rose-500">
              {serverError}
            </p>
          )}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={!canSave}
              className="cursor-pointer rounded-md border border-neutral-300 px-3 py-1 text-sm text-[var(--text-main)] hover:bg-neutral-100 disabled:cursor-default disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
            <button type="button" onClick={() => setEditing(false)} className="cursor-pointer text-xs text-[var(--text-muted)] underline">
              Hủy
            </button>
          </div>
        </form>
      ) : (
        <>
          {saved && (
            <p role="status" className="mb-1 text-xs text-emerald-600 dark:text-emerald-400">
              Đã lưu thông tin.
            </p>
          )}
          <dl className="m-0 border-t border-[var(--border-color)]">
            <InfoRow label="Họ và tên" value={authUser.fullName || 'Chưa cập nhật'} />
            <InfoRow label="Email" value={authUser.email} />
            <InfoRow label="Số điện thoại" value={authUser.phone || 'Chưa cập nhật'} />
            <InfoRow label="Giới thiệu" value={authUser.bio || 'Chưa cập nhật'} />
            <InfoRow label="Vai trò" value={ROLE_LABEL[authUser.role] ?? authUser.role} />
            {authUser.studentCode && <InfoRow label="Mã học viên" value={authUser.studentCode} />}
            {authUser.ageGroup && <InfoRow label="Nhóm tuổi" value={AGE_GROUP_LABEL[authUser.ageGroup] || authUser.ageGroup} />}
          </dl>
        </>
      )}
    </section>
  );
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ authUser, onAvatarChange, onProfileChange }) => {
  const [editingAvatar, setEditingAvatar] = useState(false);
  const [activity, setActivity] = useState<Array<{ date: string; count: number }>>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);

  // Chỉ học viên có lượt nộp bài; giảng viên/quản trị viên không có biểu đồ này.
  const showActivity = authUser.role === 'STUDENT';

  useEffect(() => {
    if (!showActivity) return;
    let cancelled = false;
    setActivityLoading(true);
    setActivityError(null);
    learnerApi
      .getActivity()
      .then((res) => !cancelled && setActivity(res.days))
      .catch(() => !cancelled && setActivityError('Không tải được dữ liệu hoạt động.'))
      .finally(() => !cancelled && setActivityLoading(false));
    return () => {
      cancelled = true;
    };
  }, [showActivity]);

  return (
    <div className={`mx-auto ${showActivity ? 'max-w-6xl' : 'max-w-xl'}`}>
      {/* Header cá nhân */}
      <div className="mb-8 flex items-center gap-4">
        <div className="group relative shrink-0">
          <UserAvatar user={authUser} size={80} />
          <button
            type="button"
            onClick={() => setEditingAvatar(true)}
            aria-label="Cập nhật ảnh đại diện"
            title="Cập nhật ảnh đại diện"
            className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 border-[var(--bg-main)] bg-indigo-600 text-white shadow-md transition-transform hover:scale-110 focus-visible:scale-110"
          >
            <Camera size={13} />
          </button>
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold text-[var(--text-main)]">{authUser.fullName || authUser.email}</h1>
          <p className="truncate text-sm text-[var(--text-muted)]">{authUser.email}</p>
        </div>
      </div>

      <div className={`grid gap-10 ${showActivity ? 'lg:grid-cols-2' : ''}`}>
        {/* Cột trái: thông tin cá nhân */}
        <ProfileInfoSection authUser={authUser} onUpdated={onProfileChange} />

        {/* Cột phải: biểu đồ hoạt động */}
        {showActivity && <ActivityHeatmap days={activity} loading={activityLoading} error={activityError} />}
      </div>

      {editingAvatar && (
        <AvatarEditor user={authUser} onClose={() => setEditingAvatar(false)} onSaved={(avatar) => onAvatarChange?.(avatar)} />
      )}
    </div>
  );
};

export default ProfilePage;
