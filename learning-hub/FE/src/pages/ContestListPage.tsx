import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy,
  User,
  Hash,
  Clock,
  Zap,
  Flame,
  Timer,
  FlagTriangleRight,
  RefreshCw,
  CalendarDays,
  Users,
  Lock,
  FileEdit,
  CheckCircle2,
  Rocket,
  Eye,
  Target,
  BarChart3,
  ShieldCheck,
  X,
  Ban,
} from 'lucide-react';
import type { ContestItem, ContestStatusResponse } from '../types/contest';
import type { AuthUser } from '../types/auth';
import { contestApi } from '../axios/contestApi';
import { ContestExamWorkspace } from '../components/ContestExamWorkspace';
import { ContestLeaderboard } from '../components/ContestLeaderboard';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useToast } from '../components/Toast';

interface ContestListPageProps {
  userRole?: 'student' | 'teacher';
  authUser?: AuthUser | null;
}

export const ContestListPage: React.FC<ContestListPageProps> = ({ authUser }) => {
  const navigate = useNavigate();
  const [contests, setContests] = useState<ContestItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'all' | 'ongoing' | 'upcoming' | 'ended'>('all');
  // Danh sách cuộc thi xem được không cần đăng nhập, nhưng đăng ký/vào thi thật
  // (handleRegister/handleCheckAndEnter) bắt buộc login — không còn chế độ
  // khách với tên tự nhập, luôn dùng đúng tài khoản thật khi đã đăng nhập.
  const studentId = authUser?.id || '';
  const studentName = authUser?.fullName || '';

  // Active Contest Exam state (Embedded Exam Mode)
  const [activeExamContest, setActiveExamContest] = useState<ContestItem | null>(null);
  const [activeLeaderboardContest, setActiveLeaderboardContest] = useState<ContestItem | null>(null);

  // Modal states for Server Time Guard check
  const [selectedContestGuard, setSelectedContestGuard] = useState<ContestStatusResponse | null>(null);
  const [isGuardModalOpen, setIsGuardModalOpen] = useState<boolean>(false);
  const guardModalRef = useFocusTrap(isGuardModalOpen, () => setIsGuardModalOpen(false));
  const [guardLoading, setGuardLoading] = useState<boolean>(false);
  const [targetContest, setTargetContest] = useState<ContestItem | null>(null);

  const { showToast } = useToast();

  // Live timer tick state to update countdowns every 1s
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchContests = useCallback(async () => {
    try {
      setLoading(true);
      const list = await contestApi.getContests();
      setContests(list);
    } catch {
      showToast('Không thể kết nối tới máy chủ. Vui lòng thử lại sau.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContests();
  }, [fetchContests]);

  // Restore active exam session on page refresh
  useEffect(() => {
    const activeContestId = localStorage.getItem(`app_active_exam_contest_id_${studentId}`);
    if (activeContestId && contests.length > 0 && !activeExamContest) {
      const found = contests.find((c) => (c._id || c.slug) === activeContestId);
      if (found) {
        setActiveExamContest(found);
      }
    }
  }, [contests, studentId, activeExamContest]);

  const startExamSession = (contest: ContestItem) => {
    const cId = contest._id || contest.slug;
    if (cId) {
      localStorage.setItem(`app_active_exam_contest_id_${studentId}`, cId);
    }
    setActiveExamContest(contest);
  };

  const exitExamSession = () => {
    localStorage.removeItem(`app_active_exam_contest_id_${studentId}`);
    setActiveExamContest(null);
    fetchContests();
  };

  const handleRegister = async (contestId: string, contestTitle: string) => {
    if (!authUser) {
      showToast('Vui lòng đăng nhập để đăng ký tham gia cuộc thi.', 'info');
      navigate('/login');
      return;
    }
    try {
      const res = await contestApi.registerContest(contestId);
      showToast(res.message || `Đăng ký cuộc thi '${contestTitle}' thành công!`, 'success');
      fetchContests();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Đăng ký tham gia thất bại!';
      showToast(msg, 'error');
    }
  };

  const handleCheckAndEnter = async (contest: ContestItem) => {
    if (!authUser) {
      showToast('Vui lòng đăng nhập để vào thi.', 'info');
      navigate('/login');
      return;
    }
    if (!contest._id && !contest.slug) return;
    const contestId = contest._id || contest.slug;
    const attemptKey = `app_contest_results_${studentId}_${contestId}`;
    const hasAttempted = localStorage.getItem(attemptKey);

    if (hasAttempted) {
      startExamSession(contest);
      return;
    }

    try {
      setGuardLoading(true);
      setTargetContest(contest);
      const statusRes = await contestApi.checkContestStatus(contest._id || contest.slug);
      setSelectedContestGuard(statusRes);
      setIsGuardModalOpen(true);
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Không thể kiểm tra trạng thái máy chủ', 'error');
    } finally {
      setGuardLoading(false);
    }
  };

  const formatDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Compute live countdown text and state for each contest card (Only Published Contests for Students)
  const processedContests = useMemo(() => {
    const publishedOnly = contests.filter((c) => !c.status || c.status === 'published');
    return publishedOnly.map((c) => {
      const start = new Date(c.startTime).getTime();
      const end = new Date(c.endTime).getTime();
      const currentTime = now.getTime();

      let computedStatus: 'UPCOMING' | 'ONGOING' | 'ENDED' = 'ONGOING';
      let countdownText = '';

      if (currentTime < start) {
        computedStatus = 'UPCOMING';
        const diffSec = Math.floor((start - currentTime) / 1000);
        const hours = Math.floor(diffSec / 3600);
        const mins = Math.floor((diffSec % 3600) / 60);
        const secs = diffSec % 60;
        countdownText = `Khai mạc sau: ${hours > 0 ? `${hours}h ` : ''}${mins}m ${secs}s`;
      } else if (currentTime > end) {
        computedStatus = 'ENDED';
        countdownText = 'Đã kết thúc cuộc thi';
      } else {
        computedStatus = 'ONGOING';
        const diffSec = Math.floor((end - currentTime) / 1000);
        const hours = Math.floor(diffSec / 3600);
        const mins = Math.floor((diffSec % 3600) / 60);
        const secs = diffSec % 60;
        countdownText = `Còn lại: ${hours > 0 ? `${hours}h ` : ''}${mins}m ${secs}s`;
      }

      return {
        ...c,
        computedStatus,
        countdownText,
      };
    });
  }, [contests, now]);

  const filteredContests = useMemo(() => {
    if (activeTab === 'all') return processedContests;
    if (activeTab === 'ongoing') return processedContests.filter((c) => c.computedStatus === 'ONGOING');
    if (activeTab === 'upcoming') return processedContests.filter((c) => c.computedStatus === 'UPCOMING');
    if (activeTab === 'ended') return processedContests.filter((c) => c.computedStatus === 'ENDED');
    return processedContests;
  }, [processedContests, activeTab]);

  const counts = {
    all: processedContests.length,
    ongoing: processedContests.filter((c) => c.computedStatus === 'ONGOING').length,
    upcoming: processedContests.filter((c) => c.computedStatus === 'UPCOMING').length,
    ended: processedContests.filter((c) => c.computedStatus === 'ENDED').length,
  };

  if (activeExamContest) {
    return (
      <ContestExamWorkspace
        contest={activeExamContest}
        studentId={studentId}
        studentName={studentName}
        onExit={exitExamSession}
      />
    );
  }

  if (activeLeaderboardContest) {
    return (
      <ContestLeaderboard
        contestId={activeLeaderboardContest._id || activeLeaderboardContest.slug || ''}
        contestTitle={activeLeaderboardContest.title}
        onExit={() => setActiveLeaderboardContest(null)}
      />
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-cyan-900 text-white p-8 md:p-10 shadow-xl border border-indigo-700/40">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 backdrop-blur-sm">
            <Trophy size={14} />
            <span>Ngày 11 — Contest & Lịch Thi Server Time Guard</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Đấu Trường Lập Trình & Kỳ Thi Cuộc Thi CyberSoft
          </h1>
          <p className="text-sm md:text-base text-indigo-200 leading-relaxed">
            Tham gia các kỳ thi lập trình thực chiến, trắc nghiệm tính điểm và thử thách thuật toán chuẩn máy chủ.
            Thời gian bắt đầu và nộp bài được đồng bộ và kiểm soát nghiêm ngặt theo giờ máy chủ (Server Time).
          </p>

          {/* Student Info Bar */}
          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-indigo-200 border-t border-indigo-700/50">
            {authUser ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white flex items-center gap-1"><User size={13} /> Học viên:</span>
                  <span className="bg-indigo-950/70 text-white border border-indigo-500/40 rounded-lg px-2.5 py-1 text-xs font-semibold">
                    {studentName}
                  </span>
                </div>
                {authUser.studentCode && (
                  <div className="flex items-center gap-1.5 bg-indigo-950/60 px-3 py-1 rounded-lg border border-indigo-500/30">
                    <span className="flex items-center gap-1"><Hash size={12} /> Mã SV:</span>
                    <span className="font-mono text-cyan-300 font-bold">{authUser.studentCode}</span>
                  </div>
                )}
              </>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="bg-indigo-950/70 hover:bg-indigo-900 text-white border border-indigo-500/40 rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer transition-colors"
              >
                Đăng nhập để đăng ký & vào thi
              </button>
            )}
            <div className="flex items-center gap-1 text-amber-300 font-semibold ml-auto">
              <span className="flex items-center gap-1"><Clock size={13} /> Giờ máy chủ:</span>
              <span className="font-mono bg-black/40 px-2 py-0.5 rounded text-cyan-300">
                {now.toLocaleTimeString('vi-VN')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              activeTab === 'all'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                : 'bg-[var(--bg-card)] text-[var(--text-main)] border-[var(--border-color)] hover:border-indigo-400'
            }`}
          >
            <Zap size={13} className="inline mr-1" /> Tất Cả ({counts.all})
          </button>
          <button
            onClick={() => setActiveTab('ongoing')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              activeTab === 'ongoing'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                : 'bg-[var(--bg-card)] text-[var(--text-main)] border-[var(--border-color)] hover:border-emerald-400'
            }`}
          >
            <Flame size={13} className="inline mr-1" /> Đang Diễn Ra ({counts.ongoing})
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              activeTab === 'upcoming'
                ? 'bg-amber-600 text-white border-amber-600 shadow-md'
                : 'bg-[var(--bg-card)] text-[var(--text-main)] border-[var(--border-color)] hover:border-amber-400'
            }`}
          >
            <Timer size={13} className="inline mr-1" /> Sắp Diễn Ra ({counts.upcoming})
          </button>
          <button
            onClick={() => setActiveTab('ended')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              activeTab === 'ended'
                ? 'bg-slate-700 text-white border-slate-700 shadow-md'
                : 'bg-[var(--bg-card)] text-[var(--text-main)] border-[var(--border-color)] hover:border-slate-400'
            }`}
          >
            <FlagTriangleRight size={13} className="inline mr-1" /> Đã Kết Thúc ({counts.ended})
          </button>
        </div>

        <button
          onClick={fetchContests}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-color)] hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-1.5"
          title="Làm mới danh sách cuộc thi"
        >
          <RefreshCw size={13} /> Làm mới dữ liệu
        </button>
      </div>

      {/* Contest List Grid */}
      {loading ? (
        <div className="text-center py-16 space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-[var(--text-muted)]">Đang tải danh sách cuộc thi từ Server...</p>
        </div>
      ) : filteredContests.length === 0 ? (
        <div className="text-center py-16 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-8">
          <Trophy size={40} className="mx-auto mb-2 text-[var(--text-muted)]" />
          <h3 className="text-lg font-bold text-[var(--text-main)]">Chưa có cuộc thi nào phù hợp</h3>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Không tìm thấy cuộc thi trong mục này. Vui lòng chuyển tab lọc khác hoặc liên hệ Giảng viên.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredContests.map((c) => {
            const isRegistered = c.registrations?.some((r) => r.studentId === studentId);
            const isOngoing = c.computedStatus === 'ONGOING';
            const isUpcoming = c.computedStatus === 'UPCOMING';
            const isEnded = c.computedStatus === 'ENDED';

            return (
              <div
                key={c._id || c.slug}
                className={`bg-[var(--bg-card)] border rounded-3xl p-6 shadow-md transition-all flex flex-col justify-between space-y-5 relative overflow-hidden ${
                  isOngoing
                    ? 'border-emerald-500/60 shadow-emerald-500/10'
                    : isUpcoming
                    ? 'border-amber-500/60 shadow-amber-500/10'
                    : 'border-[var(--border-color)] opacity-80 hover:opacity-100'
                }`}
              >
                {/* Header Status Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {isOngoing && (
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1.5 animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                          ĐANG DIỄN RA
                        </span>
                      )}
                      {isUpcoming && (
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                          SẮP DIỄN RA
                        </span>
                      )}
                      {isEnded && (
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                          ĐÃ KẾT THÚC
                        </span>
                      )}
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                        <Clock size={11} /> {c.durationMinutes || 90} phút
                      </span>
                    </div>

                    <h3 className="text-xl font-black text-[var(--text-main)] tracking-tight leading-snug">
                      {c.title}
                    </h3>
                  </div>

                  {/* Registered or Completed Badge */}
                  {(() => {
                    const cId = c._id || c.slug;
                    const saved = localStorage.getItem(`app_contest_results_${studentId}_${cId}`);
                    if (saved) {
                      try {
                        const parsed = JSON.parse(saved);
                        return (
                          <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-emerald-600 text-white shadow-xs shrink-0 flex items-center gap-1">
                            <Target size={13} /> Đã Hoàn Thành ({parsed.totalScore}/{parsed.maxScore}đ)
                          </span>
                        );
                      } catch {
                        /* ignore */
                      }
                    }
                    if (isRegistered) {
                      return (
                        <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800 shrink-0 flex items-center gap-1">
                          <CheckCircle2 size={13} /> Đã Đăng Ký
                        </span>
                      );
                    }
                    return null;
                  })()}
                </div>

                {/* Description */}
                <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                  {c.description || 'Cuộc thi thực chiến rèn luyện kỹ năng thuật toán và trắc nghiệm kiến thức.'}
                </p>

                {/* Live Countdown & Server Time Box */}
                <div
                  className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-between gap-3 ${
                    isOngoing
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
                      : isUpcoming
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-800'
                      : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className="text-[11px] block font-medium opacity-80 flex items-center gap-1">
                      <CalendarDays size={12} /> Mở đề: {formatDateTime(c.startTime)}
                    </span>
                    <span className="text-[11px] block font-medium opacity-80 flex items-center gap-1">
                      <FlagTriangleRight size={12} /> Đóng đề: {formatDateTime(c.endTime)}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold opacity-75 block">
                      Đếm ngược máy chủ
                    </span>
                    <span className="font-mono font-black text-sm tracking-tight">{c.countdownText}</span>
                  </div>
                </div>

                {/* Contest Structure Summary (Secured: No problem title leak) */}
                <div className="space-y-2 pt-2 border-t border-[var(--border-color)]">
                  <div className="flex items-center justify-between text-xs font-bold text-[var(--text-main)]">
                    <span className="flex items-center gap-1"><FileEdit size={13} /> Cấu trúc đề thi ({c.problems?.length || 0} bài thi)</span>
                    <span className="text-[var(--text-muted)] font-normal flex items-center gap-1">
                      <Users size={13} /> {c.registrations?.length || 0} thí sinh
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                      <Trophy size={12} /> Tổng điểm: 100 điểm
                    </span>
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[var(--bg-main)] text-[var(--text-muted)] border border-[var(--border-color)] flex items-center gap-1">
                      <Lock size={12} /> Bảo mật thông tin đề thi cho đến khi vào phòng thi
                    </span>
                  </div>
                </div>

                {/* Action Buttons Footer */}
                <div className="pt-2 grid grid-cols-3 gap-3">
                  {!isRegistered && !isEnded ? (
                    <button
                      type="button"
                      onClick={() => handleRegister(c._id!, c.title)}
                      className="w-full px-3 py-2.5 text-xs font-bold rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white transition-all cursor-pointer shadow-xs border-none text-center flex items-center justify-center gap-1.5"
                    >
                      <FileEdit size={13} /> Đăng ký tham gia
                    </button>
                  ) : (
                    <div className="px-3 py-2.5 text-xs font-bold rounded-2xl bg-slate-200 dark:bg-slate-800 text-[var(--text-muted)] text-center flex items-center justify-center gap-1.5 border border-[var(--border-color)]">
                      {isEnded ? (
                        <>
                          <FlagTriangleRight size={13} /> Đã đóng đăng ký
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={13} /> Đã đăng ký thành công
                        </>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleCheckAndEnter(c)}
                    disabled={guardLoading}
                    className={`w-full px-3 py-2.5 text-xs font-black rounded-2xl transition-all cursor-pointer shadow-xs border-none text-center flex items-center justify-center gap-1.5 ${
                      isOngoing
                        ? isRegistered
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
                          : 'bg-amber-600 hover:bg-amber-700 text-white'
                        : isUpcoming
                        ? 'bg-amber-600 hover:bg-amber-700 text-white'
                        : 'bg-slate-600 hover:bg-slate-700 text-white'
                    }`}
                  >
                    {(() => {
                      const cId = c._id || c.slug;
                      const hasResult = localStorage.getItem(`app_contest_results_${studentId}_${cId}`);
                      if (hasResult) return <><BarChart3 size={14} /> Xem Bảng Điểm</>;
                      if (isOngoing) return isRegistered ? <><Rocket size={14} /> Vào Thi Ngay</> : <><Lock size={14} /> Đăng Ký Trước Để Vào Thi</>;
                      if (isUpcoming) return <><Lock size={14} /> Kiểm Tra Lịch Thi</>;
                      return <><Eye size={14} /> Xem Chi Tiết</>;
                    })()}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveLeaderboardContest(c)}
                    className="w-full px-3 py-2.5 text-xs font-bold rounded-2xl bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-800 dark:text-indigo-300 transition-all cursor-pointer shadow-xs border-none text-center flex items-center justify-center gap-1.5"
                  >
                    <Trophy size={13} /> Xem Bảng Xếp Hạng
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Server Time Guard Status Modal */}
      {isGuardModalOpen && selectedContestGuard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div
            ref={guardModalRef}
            role="dialog"
            aria-modal="true"
            aria-label="Trạng thái cuộc thi"
            tabIndex={-1}
            className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-6 animate-scale-up"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-[var(--border-color)] pb-4">
              <div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black uppercase inline-block mb-1.5 ${
                    selectedContestGuard.computedStatus === 'ONGOING'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                      : selectedContestGuard.computedStatus === 'UPCOMING'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border border-red-300'
                  }`}
                >
                  <ShieldCheck size={13} className="inline mr-1" /> Server Time Guard Check: {selectedContestGuard.statusText}
                </span>
                <h3 className="text-xl font-black text-[var(--text-main)] tracking-tight">
                  {selectedContestGuard.title}
                </h3>
              </div>
              <button
                onClick={() => setIsGuardModalOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-main)] text-xl font-bold bg-transparent border-none cursor-pointer p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* Server Response Body */}
            <div className="space-y-4 text-xs">
              <div
                className={`p-4 rounded-2xl border ${
                  selectedContestGuard.isAllowedToJoin
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 border-emerald-300'
                    : 'bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 border-amber-300'
                }`}
              >
                <div className="font-bold text-sm mb-1 flex items-center gap-1.5">
                  {selectedContestGuard.isAllowedToJoin ? (
                    <>
                      <CheckCircle2 size={15} /> Cho phép truy cập bài thi
                    </>
                  ) : (
                    <>
                      <Ban size={15} /> Quyền truy cập bị khóa
                    </>
                  )}
                </div>
                <p className="leading-relaxed">{selectedContestGuard.message}</p>
              </div>

              {/* Exact Server Timestamps */}
              <div className="bg-[var(--bg-main)] p-4 rounded-2xl border border-[var(--border-color)] space-y-2 font-mono">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)] flex items-center gap-1"><Clock size={12} /> Giờ máy chủ Server:</span>
                  <span className="font-bold text-cyan-600 dark:text-cyan-400">
                    {new Date(selectedContestGuard.serverTime).toLocaleString('vi-VN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)] flex items-center gap-1"><CalendarDays size={12} /> Thời gian khai mạc:</span>
                  <span className="font-bold">
                    {new Date(selectedContestGuard.startTime).toLocaleString('vi-VN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)] flex items-center gap-1"><FlagTriangleRight size={12} /> Thời gian bế mạc:</span>
                  <span className="font-bold">
                    {new Date(selectedContestGuard.endTime).toLocaleString('vi-VN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsGuardModalOpen(false)}
                className="px-4 py-2.5 text-xs font-semibold rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                Đóng
              </button>

              {selectedContestGuard.isAllowedToJoin ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsGuardModalOpen(false);
                    if (targetContest) {
                      startExamSession(targetContest);
                    }
                  }}
                  className="px-5 py-2.5 text-xs font-black rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer shadow-md border-none flex items-center gap-1.5"
                >
                  <Rocket size={14} /> Vào Làm Bài Thi Trực Tiếp
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="px-5 py-2.5 text-xs font-bold rounded-xl bg-slate-400 text-white cursor-not-allowed border-none opacity-60 flex items-center gap-1.5"
                >
                  <Lock size={14} /> Bị Khóa Truy Cập
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
