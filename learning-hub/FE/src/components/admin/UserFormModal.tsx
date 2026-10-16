import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import adminPortalApi from '../../axios/adminPortalApi';
import adminUsersApi from '../../axios/adminUsersApi';
import type { AgeGroupKey, PortalUserRow } from '../../types/adminPortal';
import type { UserRole } from '../../types/teacherAnalytics';
import { ASSIGNABLE_ROLES, ROLE_VI, validateNewUser } from '../../pages/adminModel';
import { AGE_GROUP_LABEL, AGE_GROUP_ORDER } from '../../pages/adminPortalModel';
import { btnPrimary, btnSecondary, errorMessage, Field, inputCls, Modal, selectCls } from './AdminUi';

const AGE_OPTIONS = (
  <>
    {AGE_GROUP_ORDER.map((g) => (
      <option key={g} value={g}>
        {AGE_GROUP_LABEL[g]}
      </option>
    ))}
  </>
);

/** Thêm người dùng mới (học viên hoặc giảng viên; Admin không bao giờ tạo/nâng quyền Admin). */
export const CreateUserModal: React.FC<{ onClose: () => void; onDone: (msg: string) => void }> = ({ onClose, onDone }) => {
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'STUDENT' as UserRole, ageGroup: '' as '' | AgeGroupKey });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = validateNewUser(form) ?? (form.role === 'STUDENT' && !form.ageGroup ? 'Chọn khối học cho học viên.' : null);
    if (problem) return setError(problem);
    setBusy(true);
    setError(null);
    try {
      await adminPortalApi.createUser({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        ...(form.ageGroup ? { ageGroup: form.ageGroup } : {}),
      });
      onDone('Đã tạo người dùng mới.');
    } catch (err) {
      setError(errorMessage(err, 'Không tạo được người dùng.'));
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Thêm người dùng mới"
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={btnSecondary}>
            Hủy
          </button>
          <button type="submit" form="create-user-form" disabled={busy} className={btnPrimary}>
            {busy && <Loader2 size={14} className="animate-spin" />} Tạo người dùng
          </button>
        </>
      }
    >
      <form id="create-user-form" onSubmit={submit} className="space-y-3.5">
        <Field label="Họ tên">
          <input autoFocus value={form.fullName} maxLength={100} onChange={set('fullName')} className={inputCls} />
        </Field>
        <Field label="Email">
          <input type="email" value={form.email} onChange={set('email')} className={inputCls} />
        </Field>
        <Field label="Mật khẩu ban đầu" hint="Từ 6 ký tự. Người dùng nên đổi sau lần đăng nhập đầu.">
          <input type="password" autoComplete="new-password" value={form.password} onChange={set('password')} className={inputCls} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Vai trò">
            <select value={form.role} onChange={set('role')} className={selectCls}>
              {ASSIGNABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_VI[r]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Khối học">
            <select value={form.ageGroup} onChange={set('ageGroup')} className={selectCls}>
              <option value="">{form.role === 'STUDENT' ? 'Chọn khối...' : 'Không áp dụng'}</option>
              {AGE_OPTIONS}
            </select>
          </Field>
        </div>
        {error && (
          <p role="alert" className="text-sm text-rose-600 dark:text-rose-300">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
};

/** Sửa thông tin cơ bản, đặt lại mật khẩu và (với học viên) nâng lên giảng viên. */
export const EditUserModal: React.FC<{
  user: PortalUserRow;
  onClose: () => void;
  onDone: (msg: string) => void;
  onRevoke: (u: PortalUserRow) => void;
}> = ({ user, onClose, onDone, onRevoke }) => {
  const [fullName, setFullName] = useState(user.fullName);
  const [ageGroup, setAgeGroup] = useState<'' | AgeGroupKey>(user.ageGroup ?? '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(user.role);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return setError('Nhập họ tên.');
    if (password && password.length < 6) return setError('Mật khẩu mới từ 6 ký tự.');
    const patch: { fullName?: string; ageGroup?: AgeGroupKey; password?: string } = {};
    if (fullName.trim() !== user.fullName) patch.fullName = fullName.trim();
    if (ageGroup && ageGroup !== user.ageGroup) patch.ageGroup = ageGroup;
    if (password) patch.password = password;
    const roleChanged = user.role === 'STUDENT' && role === 'TEACHER';
    if (Object.keys(patch).length === 0 && !roleChanged) return setError('Chưa có thay đổi nào.');
    setBusy(true);
    setError(null);
    try {
      if (Object.keys(patch).length) await adminPortalApi.updateUser(user.id, patch);
      if (roleChanged) await adminUsersApi.setRole(user.id, 'TEACHER');
      onDone(password ? 'Đã lưu và đặt lại mật khẩu (các phiên cũ bị hủy).' : 'Đã lưu thay đổi.');
    } catch (err) {
      setError(errorMessage(err, 'Không lưu được thay đổi.'));
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Sửa người dùng"
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={btnSecondary}>
            Hủy
          </button>
          <button type="submit" form="edit-user-form" disabled={busy} className={btnPrimary}>
            {busy && <Loader2 size={14} className="animate-spin" />} Lưu thay đổi
          </button>
        </>
      }
    >
      <form id="edit-user-form" onSubmit={submit} className="space-y-3.5">
        <Field label="Email" hint="Email là định danh đăng nhập nên không sửa được.">
          <input value={user.email} disabled className={inputCls} readOnly />
        </Field>
        <Field label="Họ tên">
          <input autoFocus value={fullName} maxLength={100} onChange={(e) => setFullName(e.target.value)} className={inputCls} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Khối học">
            <select value={ageGroup} onChange={(e) => setAgeGroup(e.target.value as '' | AgeGroupKey)} className={selectCls}>
              <option value="">{user.ageGroup ? 'Giữ nguyên' : 'Chưa chọn'}</option>
              {AGE_OPTIONS}
            </select>
          </Field>
          <Field label="Vai trò">
            {user.role === 'STUDENT' ? (
              <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} className={selectCls}>
                {ASSIGNABLE_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_VI[r]}
                  </option>
                ))}
              </select>
            ) : user.role === 'TEACHER' ? (
              <button type="button" onClick={() => onRevoke(user)} className={`${btnSecondary} w-full`}>
                Thu hồi quyền giảng viên...
              </button>
            ) : (
              <input value={ROLE_VI.ADMIN} disabled readOnly className={inputCls} />
            )}
          </Field>
        </div>
        <Field label="Đặt lại mật khẩu" hint="Để trống nếu không đổi. Đặt lại sẽ đăng xuất người dùng khỏi mọi thiết bị.">
          <input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
        </Field>
        {error && (
          <p role="alert" className="text-sm text-rose-600 dark:text-rose-300">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
};
