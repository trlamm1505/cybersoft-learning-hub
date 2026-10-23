import React, { useRef, useState } from 'react';
import { Camera, Loader2, Trash2, Upload, X } from 'lucide-react';
import authApi from '../../axios/authApi';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { UserAvatar } from '../UserAvatar';
import { AVATAR_ACCEPT, resizeToAvatarDataUrl, validateAvatarFile, validateAvatarUrl } from './avatarImage';

interface AvatarEditorProps {
  user: { fullName?: string; email: string; avatar?: string };
  onClose: () => void;
  /** Gọi sau khi lưu thành công; `undefined` nghĩa là đã xóa ảnh. */
  onSaved: (avatar: string | undefined) => void;
}

type Mode = 'upload' | 'url';

const errorMessage = (err: unknown, fallback: string) =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
  (err instanceof Error ? err.message : '') ||
  fallback;

/** Hộp thoại đổi ảnh đại diện: tải ảnh lên (tự thu nhỏ) hoặc dán URL, có xem trước trước khi lưu. */
export const AvatarEditor: React.FC<AvatarEditorProps> = ({ user, onClose, onSaved }) => {
  const dialogRef = useFocusTrap(true, onClose);
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>('upload');
  const [preview, setPreview] = useState<string | undefined>(undefined);
  const [urlInput, setUrlInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shown = preview ?? user.avatar;

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    const problem = validateAvatarFile(file);
    if (problem) return setError(problem);
    setBusy(true);
    try {
      setPreview(await resizeToAvatarDataUrl(file));
    } catch (err) {
      setError(errorMessage(err, 'Không xử lý được ảnh.'));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const previewUrl = () => {
    const problem = validateAvatarUrl(urlInput);
    if (problem) return setError(problem);
    setError(null);
    setPreview(urlInput.trim());
  };

  const save = async (value: string | null) => {
    setBusy(true);
    setError(null);
    try {
      const res = await authApi.setAvatar(value);
      onSaved(res.avatar ?? undefined);
      onClose();
    } catch (err) {
      setError(errorMessage(err, 'Không lưu được ảnh đại diện.'));
    } finally {
      setBusy(false);
    }
  };

  const tabCls = (active: boolean) =>
    `cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-semibold ${
      active
        ? 'border-indigo-600 bg-indigo-600 text-white'
        : 'border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] hover:border-indigo-400'
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Cập nhật ảnh đại diện"
        tabIndex={-1}
        className="w-full max-w-md space-y-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[var(--text-main)]">Cập nhật ảnh đại diện</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="cursor-pointer border-none bg-transparent p-1 text-[var(--text-muted)] hover:text-[var(--text-main)]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex justify-center">
          <UserAvatar user={{ ...user, avatar: shown }} size={112} />
        </div>

        <div className="flex justify-center gap-2" role="tablist" aria-label="Cách chọn ảnh">
          <button type="button" role="tab" aria-selected={mode === 'upload'} onClick={() => setMode('upload')} className={tabCls(mode === 'upload')}>
            Tải ảnh lên
          </button>
          <button type="button" role="tab" aria-selected={mode === 'url'} onClick={() => setMode('url')} className={tabCls(mode === 'url')}>
            Dùng đường dẫn ảnh
          </button>
        </div>

        {mode === 'upload' ? (
          <div className="space-y-2 text-center">
            <input
              ref={fileRef}
              type="file"
              accept={AVATAR_ACCEPT}
              className="sr-only"
              aria-label="Chọn ảnh từ máy"
              onChange={(e) => void handleFile(e.target.files?.[0])}
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] px-4 py-2 text-sm font-semibold text-[var(--text-main)] hover:border-indigo-400 disabled:opacity-60"
            >
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />} Chọn ảnh từ máy
            </button>
            <p className="text-xs text-[var(--text-muted)]">PNG, JPEG hoặc WebP. Ảnh được cắt vuông và thu nhỏ tự động.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <label htmlFor="avatar-url" className="text-xs font-semibold text-[var(--text-muted)]">
              Đường dẫn ảnh
            </label>
            <div className="flex gap-2">
              <input
                id="avatar-url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://..."
                className="min-w-0 flex-1 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] px-3 py-2 text-sm text-[var(--text-main)] focus:border-indigo-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={previewUrl}
                className="cursor-pointer rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] px-3 py-2 text-sm font-semibold text-[var(--text-main)] hover:border-indigo-400"
              >
                Xem trước
              </button>
            </div>
          </div>
        )}

        {error && (
          <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-600 dark:text-rose-400">
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-color)] pt-4">
          {user.avatar ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void save(null)}
              className="inline-flex cursor-pointer items-center gap-1.5 border-none bg-transparent px-1 py-1 text-xs font-semibold text-rose-600 hover:underline disabled:opacity-60 dark:text-rose-400"
            >
              <Trash2 size={13} /> Xóa ảnh
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] px-4 py-2 text-sm font-semibold text-[var(--text-main)]"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={busy || !preview}
              onClick={() => void save(preview ?? null)}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border-none bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />} Lưu ảnh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvatarEditor;
