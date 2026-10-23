import React, { useState } from 'react';
import { avatarInitial } from './profile/avatarImage';

interface UserAvatarProps {
  user: { fullName?: string; email: string; avatar?: string };
  /** Cạnh avatar tính bằng px. */
  size?: number;
  className?: string;
}

/**
 * Avatar tròn: dùng ảnh đã lưu nếu có và tải được, ngược lại là chữ cái đầu của tên
 * trên nền gradient mặc định (ảnh lỗi/đường dẫn hỏng không làm vỡ giao diện).
 */
export const UserAvatar: React.FC<UserAvatarProps> = ({ user, size = 36, className = '' }) => {
  // Nhớ URL nào đã lỗi (thay vì cờ bool) để đổi sang ảnh khác thì tự thử tải lại, không cần effect.
  const [failedSrc, setFailedSrc] = useState<string | undefined>(undefined);
  const broken = !!user.avatar && failedSrc === user.avatar;

  const style = { width: size, height: size, fontSize: Math.round(size * 0.42) };
  if (user.avatar && !broken) {
    return (
      <img
        src={user.avatar}
        alt=""
        style={style}
        onError={() => setFailedSrc(user.avatar)}
        className={`shrink-0 rounded-full border border-[var(--border-color)] object-cover ${className}`}
      />
    );
  }
  return (
    <span
      style={style}
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full border border-[var(--border-color)] bg-gradient-to-br from-indigo-600 to-cyan-500 font-bold text-white ${className}`}
    >
      {avatarInitial(user)}
    </span>
  );
};

export default UserAvatar;
