import React from 'react';
import { User, Mail, IdCard, GraduationCap, Users } from 'lucide-react';
import type { AuthUser } from '../types/auth';

interface ProfilePageProps {
  authUser: AuthUser;
}

const AGE_GROUP_LABEL: Record<string, string> = {
  '3-5': 'Lớp 3-5',
  '6-9': 'Lớp 6-9',
  '10-12': 'Lớp 10-12',
};

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-[var(--border-color)] last:border-b-0">
      <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-[var(--bg-main)] text-[var(--text-muted)] shrink-0">
        {icon}
      </span>
      <div>
        <p className="text-xs text-[var(--text-muted)]">{label}</p>
        <p className="text-sm font-medium text-[var(--text-main)]">{value}</p>
      </div>
    </div>
  );
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ authUser }) => {
  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <span className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-600 to-cyan-500 text-white text-2xl font-bold shrink-0">
          {(authUser.fullName || authUser.email).trim().charAt(0).toUpperCase()}
        </span>
        <div>
          <h1 className="text-xl font-bold text-[var(--text-main)]">
            {authUser.fullName || authUser.email}
          </h1>
          <p className="text-sm text-[var(--text-muted)]">{authUser.email}</p>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] px-4">
        <InfoRow
          icon={<User size={16} />}
          label="Họ và tên"
          value={authUser.fullName || 'Chưa cập nhật'}
        />
        <InfoRow icon={<Mail size={16} />} label="Email" value={authUser.email} />
        <InfoRow
          icon={<Users size={16} />}
          label="Vai trò"
          value={authUser.role === 'TEACHER' ? 'Giảng viên' : 'Học viên'}
        />
        {authUser.studentCode && (
          <InfoRow icon={<IdCard size={16} />} label="Mã học viên" value={authUser.studentCode} />
        )}
        {authUser.ageGroup && (
          <InfoRow
            icon={<GraduationCap size={16} />}
            label="Nhóm tuổi"
            value={AGE_GROUP_LABEL[authUser.ageGroup] || authUser.ageGroup}
          />
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
