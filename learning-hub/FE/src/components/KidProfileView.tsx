import React, { useEffect, useMemo, useState } from 'react';
import { Eye, Pencil } from 'lucide-react';
import { authApi } from '../axios/authApi';
import { blockPuzzleApi } from '../axios/blockPuzzleApi';
import { BUILTIN_GAMES } from '../games/registry';
import {
  allKidGames,
  buildKidRecords,
  formatKidDate,
  lessonGamesFromLessons,
  summarizeKidProgress,
  topTitle,
  type ServerRecord,
} from '../common/kidProgress';
import { KID_AVATARS, renderKidAvatar } from '../common/kidAvatars';
import type { LessonAuthoring } from '../types/authoring';
import type { AuthUser } from '../types/auth';
import { UserAvatar } from './UserAvatar';
import { KidCertificateModal } from './KidCertificateModal';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useToast } from './Toast';

interface KidProfileViewProps {
  authUser: AuthUser;
  teacherLessons?: LessonAuthoring[];
  onAvatarChange?: (avatar: string | undefined) => void;
  onProfileChange?: (user: AuthUser) => void;
}

const readCache = (key: string): Set<string> => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? new Set(JSON.parse(saved) as string[]) : new Set();
  } catch {
    return new Set();
  }
};

const errMsg = (e: unknown): string =>
  (e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Chưa lưu được, bé thử lại nhé!';

/** Trang cá nhân Kid Mode: thông tin bé, huy hiệu, bảng kỷ lục kèm Giấy Khen, và chỉnh sửa tên + avatar hoạt hình. */
export const KidProfileView: React.FC<KidProfileViewProps> = ({ authUser, teacherLessons = [], onAvatarChange, onProfileChange }) => {
  const cacheKey = `app_block_puzzle_completed_${authUser.id}`;
  const [done, setDone] = useState<Set<string>>(() => readCache(cacheKey));
  const [serverRecords, setServerRecords] = useState<ServerRecord[]>([]);
  const [certId, setCertId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(authUser.fullName ?? '');
  const [avatarId, setAvatarId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    let cancelled = false;
    blockPuzzleApi
      .getProgress()
      .then((r) => !cancelled && (setDone(new Set(r.completedSlugs)), setOffline(false)))
      .catch(() => !cancelled && (setDone(readCache(cacheKey)), setOffline(true)));
    blockPuzzleApi
      .getRecords()
      .then((r) => !cancelled && setServerRecords(r.records))
      .catch(() => !cancelled && (setServerRecords([]), setOffline(true)));
    return () => {
      cancelled = true;
    };
  }, [cacheKey]);

  const games = useMemo(() => allKidGames(BUILTIN_GAMES, lessonGamesFromLessons(teacherLessons)), [teacherLessons]);
  const summary = useMemo(() => summarizeKidProgress(done, games), [done, games]);
  const title = topTitle(summary.badges);
  const records = useMemo(() => buildKidRecords(serverRecords, games), [serverRecords, games]);
  const kidName = authUser.fullName?.trim().split(/\s+/).pop() || 'Bé';
  const cert = records.find((r) => r.id === certId);
  const editRef = useFocusTrap(editing, () => setEditing(false));

  const openEdit = () => {
    setNameInput(authUser.fullName ?? '');
    setAvatarId(null);
    setMessage(null);
    setEditing(true);
  };

  const save = async () => {
    const name = nameInput.trim();
    if (!name) return setMessage('Bé nhớ nhập tên nhé!');
    setSaving(true);
    setMessage(null);
    try {
      if (name !== authUser.fullName) {
        const updated = await authApi.updateProfile({ fullName: name });
        onProfileChange?.(updated);
      }
      const option = KID_AVATARS.find((a) => a.id === avatarId);
      if (option) {
        const dataUrl = renderKidAvatar(option);
        if (!dataUrl) throw new Error('avatar');
        const res = await authApi.setAvatar(dataUrl);
        onAvatarChange?.(res.avatar ?? undefined);
      }
      setEditing(false);
      showToast('Đã lưu thông tin của bé!', 'success');
    } catch (e) {
      setMessage(errMsg(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-10" data-testid="kid-profile-view">
      {offline && (
        <p role="status" className="rounded-2xl border-4 border-amber-200 bg-amber-50 p-4 text-lg font-bold text-amber-800">
          Chưa kết nối được máy chủ nên chưa lấy được đủ thành tích. Bé thử tải lại trang sau nhé!
        </p>
      )}
      <div className="flex flex-col items-center gap-4 rounded-3xl bg-gradient-to-r from-sky-200 via-white to-amber-200 p-6 text-center shadow-lg sm:flex-row sm:text-left">
        <div className="rounded-full border-8 border-white shadow-lg">
          <UserAvatar user={authUser} size={104} />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="break-words text-3xl font-black text-slate-800 sm:text-4xl">{authUser.fullName || 'Bé'}</h1>
          <p className="mt-1 inline-block rounded-full bg-amber-200 px-4 py-1 text-lg font-black text-amber-800">Lớp 3–5</p>
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 text-base font-semibold text-slate-600">
            {authUser.studentCode && (
              <>
                <dt>Mã học sinh:</dt>
                <dd className="font-black text-slate-800">{authUser.studentCode}</dd>
              </>
            )}
            <dt>Tên đăng nhập:</dt>
            <dd className="break-all font-black text-slate-800">{authUser.email}</dd>
          </dl>
          <p className="mt-2 text-xl font-black text-pink-600">
            <span aria-hidden="true">{title.emoji}</span> Danh hiệu: {title.title}
          </p>
          <p className="text-lg font-bold text-slate-600">⭐ {summary.stars} sao · 🎮 {summary.levelsDone}/{summary.levelsTotal} màn</p>
        </div>
        <button
          onClick={openEdit}
          className="flex cursor-pointer items-center gap-2 rounded-2xl border-none bg-gradient-to-r from-sky-400 to-blue-500 px-5 py-3 text-lg font-black text-white shadow-md hover:scale-105 active:scale-95"
        >
          <Pencil size={20} strokeWidth={2.5} /> Chỉnh sửa thông tin
        </button>
      </div>

      <section aria-label="Huy hiệu">
        <h2 className="mb-3 text-2xl font-black text-slate-800">Huy hiệu của bé 🏆</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {summary.badges.map((b) => (
            <div
              key={b.id}
              className={`rounded-2xl border-4 p-4 text-center shadow-sm ${b.earned ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-slate-100 opacity-70'}`}
            >
              <div className="text-4xl" aria-hidden="true">{b.earned ? b.emoji : '🔒'}</div>
              <div className="mt-1 text-base font-black text-slate-800">{b.title}</div>
            </div>
          ))}
        </div>
      </section>

      <section aria-label="Bảng thành tích cao nhất">
        <h2 className="mb-3 text-2xl font-black text-slate-800">Bảng Thành Tích Cao Nhất 🏅</h2>
        {records.length === 0 ? (
          <div className="rounded-3xl border-4 border-dashed border-sky-200 bg-sky-50 p-8 text-center">
            <div className="text-5xl" aria-hidden="true">🌱</div>
            <p className="mt-2 text-xl font-black text-slate-700">Phá đảo một trò chơi để có kỷ lục đầu tiên nhé!</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {records.map((r) => (
              <li key={r.id} className="flex items-center gap-3 rounded-2xl border-4 border-amber-200 bg-white p-4 shadow-sm">
                <span className="text-4xl" aria-hidden="true">{r.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-lg font-black text-slate-800">{r.title}</div>
                  <div className="text-base font-semibold text-slate-500">Ngày {formatKidDate(r.date)}</div>
                </div>
                <button
                  onClick={() => setCertId(r.id)}
                  aria-label={`Xem giấy khen: ${r.title}`}
                  title="Xem Giấy Khen"
                  className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-2xl border-none bg-sky-100 text-sky-700 hover:bg-sky-200"
                >
                  <Eye size={26} strokeWidth={2.5} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {cert && (
        <KidCertificateModal
          kidName={kidName}
          recordTitle={cert.title}
          dateText={formatKidDate(cert.date)}
          emoji={cert.emoji}
          onClose={() => setCertId(null)}
        />
      )}

      {editing && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4"
          onMouseDown={(e) => e.target === e.currentTarget && setEditing(false)}
        >
          <div
            ref={editRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label="Chỉnh sửa thông tin"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[2rem] border-8 border-sky-300 bg-white p-6 shadow-2xl"
          >
            <h2 className="text-2xl font-black text-slate-800">Chỉnh sửa thông tin ✏️</h2>
            <label htmlFor="kid-name" className="mt-4 block text-lg font-black text-slate-700">Họ và tên của bé</label>
            <input
              id="kid-name"
              value={nameInput}
              maxLength={100}
              onChange={(e) => setNameInput(e.target.value)}
              className="mt-1 w-full rounded-2xl border-4 border-sky-200 px-4 py-3 text-xl font-bold text-slate-800 focus:border-pink-300 focus:outline-none"
            />

            <p className="mt-4 text-lg font-black text-slate-700">Chọn hình đại diện</p>
            <div className="mt-2 grid grid-cols-4 gap-3" role="radiogroup" aria-label="Hình đại diện">
              {KID_AVATARS.map((a) => (
                <button
                  key={a.id}
                  role="radio"
                  aria-checked={avatarId === a.id}
                  aria-label={a.label}
                  title={a.label}
                  onClick={() => setAvatarId(a.id)}
                  style={{ backgroundColor: a.bg }}
                  className={`flex aspect-square cursor-pointer items-center justify-center rounded-full border-4 text-4xl transition-transform hover:scale-110 ${
                    avatarId === a.id ? 'border-pink-500 ring-4 ring-pink-200' : 'border-white'
                  }`}
                >
                  <span aria-hidden="true">{a.emoji}</span>
                </button>
              ))}
            </div>
            {avatarId && (
              <p className="mt-2 text-center text-base font-bold text-slate-600">
                {KID_AVATARS.find((a) => a.id === avatarId)?.label}
              </p>
            )}

            {message && <p role="alert" className="mt-3 rounded-2xl bg-rose-50 p-3 text-base font-bold text-rose-600">{message}</p>}

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setEditing(false)}
                disabled={saving}
                className="cursor-pointer rounded-2xl border-none bg-slate-100 px-6 py-3 text-lg font-black text-slate-700"
              >
                Hủy
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="cursor-pointer rounded-2xl border-none bg-gradient-to-r from-emerald-400 to-teal-500 px-6 py-3 text-lg font-black text-white shadow-md disabled:opacity-60"
              >
                {saving ? 'Đang lưu...' : 'Lưu lại'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
