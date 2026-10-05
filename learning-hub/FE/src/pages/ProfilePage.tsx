import React, { useEffect, useState } from 'react';
import { Camera } from 'lucide-react';
import type { AuthUser } from '../types/auth';
import { ROLE_LABEL } from '../types/auth';
import learnerApi from '../axios/learnerApi';
import { UserAvatar } from '../components/UserAvatar';
import { AvatarEditor } from '../components/profile/AvatarEditor';
import { ActivityHeatmap } from '../components/profile/ActivityHeatmap';

interface ProfilePageProps {
  authUser: AuthUser;
  /** Gọi khi đổi/xóa ảnh đại diện để cập nhật phiên đăng nhập (header, localStorage). */
  onAvatarChange?: (avatar: string | undefined) => void;
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

export const ProfilePage: React.FC<ProfilePageProps> = ({ authUser, onAvatarChange }) => {
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
        <section aria-label="Thông tin cá nhân" className="min-w-0">
          <h2 className="mb-1 text-sm font-semibold text-[var(--text-main)]">Thông tin cá nhân</h2>
          <dl className="m-0 border-t border-[var(--border-color)]">
            <InfoRow label="Họ và tên" value={authUser.fullName || 'Chưa cập nhật'} />
            <InfoRow label="Email" value={authUser.email} />
            <InfoRow label="Vai trò" value={ROLE_LABEL[authUser.role] ?? authUser.role} />
            {authUser.studentCode && <InfoRow label="Mã học viên" value={authUser.studentCode} />}
            {authUser.ageGroup && (
              <InfoRow label="Nhóm tuổi" value={AGE_GROUP_LABEL[authUser.ageGroup] || authUser.ageGroup} />
            )}
          </dl>
        </section>

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
