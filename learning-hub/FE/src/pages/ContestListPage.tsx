import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { ContestItem, ContestStatusResponse } from '../types/contest';
import { contestApi } from '../axios/contestApi';
import { ContestExamWorkspace, normalizeAttemptResult } from '../components/ContestExamWorkspace';

interface ContestListPageProps {
  userRole?: 'student' | 'teacher';
}

export const ContestListPage: React.FC<ContestListPageProps> = () => {
  const [contests, setContests] = useState<ContestItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'all' | 'ongoing' | 'upcoming' | 'ended'>('all');
  const [studentId] = useState<string>(() => localStorage.getItem('app_student_id') || 'student-demo');
  const [studentName, setStudentName] = useState<string>(() => localStorage.getItem('app_student_name') || 'Học viên Demo');

  // Active Contest Exam state (Embedded Exam Mode)
  const [activeExamContest, setActiveExamContest] = useState<ContestItem | null>(null);

  // Modal states for Server Time Guard check
  const [selectedContestGuard, setSelectedContestGuard] = useState<ContestStatusResponse | null>(null);
  const [isGuardModalOpen, setIsGuardModalOpen] = useState<boolean>(false);
  const [guardLoading, setGuardLoading] = useState<boolean>(false);
  const [targetContest, setTargetContest] = useState<ContestItem | null>(null);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Live timer tick state to update countdowns every 1s
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchContests = useCallback(async () => {
    try {
      setLoading(true);
      const list = await contestApi.getContests(studentId);
      setContests(list);
    } catch {
      showToast('Không thể kết nối Backend API. Đang sử dụng bộ nhớ đệm cục bộ.', 'error');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

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
    try {
      const res = await contestApi.registerContest(contestId, studentId, studentName);
      showToast(res.message || `Đăng ký cuộc thi '${contestTitle}' thành công!`, 'success');
      fetchContests();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Đăng ký tham gia thất bại!';
      showToast(msg, 'error');
    }
  };

  const handleCheckAndEnter = async (contest: ContestItem) => {
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
      const statusRes = await contestApi.checkContestStatus(contest._id || contest.slug, studentId);
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

  return (
    <div className="space-y-8 pb-16">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl border text-sm font-semibold flex items-center gap-2 animate-bounce ${
            toast.type === 'error'
              ? 'bg-red-600 text-white border-red-500'
              : 'bg-emerald-600 text-white border-emerald-500'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-cyan-900 text-white p-8 md:p-10 shadow-xl border border-indigo-700/40">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 backdrop-blur-sm">
            <span>🏆 Ngày 11 — Contest & Lịch Thi Server Time Guard</span>
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
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">👤 Học viên:</span>
              <input
                type="text"
                value={studentName}
                onChange={(e) => {
                  setStudentName(e.target.value);
                  localStorage.setItem('app_student_name', e.target.value);
                }}
                className="bg-indigo-950/70 text-white border border-indigo-500/40 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-cyan-400 font-semibold"
                placeholder="Nhập tên học viên"
              />
            </div>
            <div className="flex items-center gap-1.5 bg-indigo-950/60 px-3 py-1 rounded-lg border border-indigo-500/30">
              <span>🆔 Mã SV:</span>
              <span className="font-mono text-cyan-300 font-bold">{studentId}</span>
            </div>
            <div className="flex items-center gap-1 text-amber-300 font-semibold ml-auto">
              <span>🕒 Giờ máy chủ:</span>
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
            ⚡ Tất Cả ({counts.all})
          </button>
          <button
            onClick={() => setActiveTab('ongoing')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              activeTab === 'ongoing'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                : 'bg-[var(--bg-card)] text-[var(--text-main)] border-[var(--border-color)] hover:border-emerald-400'
            }`}
          >
            🔥 Đang Diễn Ra ({counts.ongoing})
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              activeTab === 'upcoming'
                ? 'bg-amber-600 text-white border-amber-600 shadow-md'
                : 'bg-[var(--bg-card)] text-[var(--text-main)] border-[var(--border-color)] hover:border-amber-400'
            }`}
          >
            ⏰ Sắp Diễn Ra ({counts.upcoming})
          </button>
          <button
            onClick={() => setActiveTab('ended')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              activeTab === 'ended'
                ? 'bg-slate-700 text-white border-slate-700 shadow-md'
                : 'bg-[var(--bg-card)] text-[var(--text-main)] border-[var(--border-color)] hover:border-slate-400'
            }`}
          >
            🏁 Đã Kết Thúc ({counts.ended})
          </button>
        </div>

        <button
          onClick={fetchContests}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-color)] hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-1.5"
          title="Làm mới danh sách cuộc thi"
        >
          🔄 Làm mới dữ liệu
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
          <span className="text-4xl block mb-2">🏆</span>
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
                          🟢 ĐANG DIỄN RA
                        </span>
                      )}
                      {isUpcoming && (
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1.5">
                          🟡 SẮP DIỄN RA
                        </span>
                      )}
                      {isEnded && (
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                          🔴 ĐÃ KẾT THÚC
                        </span>
                      )}
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        ⏱️ {c.durationMinutes || 90} phút
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
                        const norm = normalizeAttemptResult(parsed, c);
                        if (norm) {
                          return (
                            <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-emerald-600 text-white shadow-xs shrink-0">
                              🎯 Đã Hoàn Thành ({norm.totalScore}/{norm.maxScore}đ)
                            </span>
                          );
                        }
                      } catch {
                        /* ignore */
                      }
                    }
                    if (isRegistered) {
                      return (
                        <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800 shrink-0">
                          ✓ Đã Đăng Ký
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
                    <span className="text-[11px] block font-medium opacity-80">
                      📅 Mở đề: {formatDateTime(c.startTime)}
                    </span>
                    <span className="text-[11px] block font-medium opacity-80">
                      🏁 Đóng đề: {formatDateTime(c.endTime)}
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
                    <span>📚 Cấu trúc đề thi ({c.problems?.length || 0} bài thi)</span>
                    <span className="text-[var(--text-muted)] font-normal">
                      👥 {c.registrations?.length || 0} thí sinh
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      🏆 Tổng điểm: 100 điểm
                    </span>
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[var(--bg-main)] text-[var(--text-muted)] border border-[var(--border-color)] flex items-center gap-1">
                      🔒 Bảo mật thông tin đề thi cho đến khi vào phòng thi
                    </span>
                  </div>
                </div>

                {/* Action Buttons Footer */}
                <div className="pt-2 grid grid-cols-2 gap-3">
                  {!isRegistered && !isEnded ? (
                    <button
                      type="button"
                      onClick={() => handleRegister(c._id!, c.title)}
                      className="w-full px-3 py-2.5 text-xs font-bold rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white transition-all cursor-pointer shadow-xs border-none text-center"
                    >
                      📝 Đăng ký tham gia
                    </button>
                  ) : (
                    <div className="px-3 py-2.5 text-xs font-bold rounded-2xl bg-slate-200 dark:bg-slate-800 text-[var(--text-muted)] text-center flex items-center justify-center border border-[var(--border-color)]">
                      {isEnded ? '🏁 Đã đóng đăng ký' : '✅ Đã đăng ký thành công'}
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
                      if (hasResult) return '📊 Xem Bảng Điểm';
                      if (isOngoing) return isRegistered ? '🚀 Vào Thi Ngay' : '🔒 Đăng Ký Trước Để Vào Thi';
                      if (isUpcoming) return '🔒 Kiểm Tra Lịch Thi';
                      return '👁️ Xem Chi Tiết';
                    })()}
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
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-6 animate-scale-up">
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
                  🛡️ Server Time Guard Check: {selectedContestGuard.statusText}
                </span>
                <h3 className="text-xl font-black text-[var(--text-main)] tracking-tight">
                  {selectedContestGuard.title}
                </h3>
              </div>
              <button
                onClick={() => setIsGuardModalOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-main)] text-xl font-bold bg-transparent border-none cursor-pointer p-1"
              >
                ✕
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
                  {selectedContestGuard.isAllowedToJoin ? '✅ Cho phép truy cập bài thi' : '⛔ Quyền truy cập bị khóa'}
                </div>
                <p className="leading-relaxed">{selectedContestGuard.message}</p>
              </div>

              {/* Exact Server Timestamps */}
              <div className="bg-[var(--bg-main)] p-4 rounded-2xl border border-[var(--border-color)] space-y-2 font-mono">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">🕒 Giờ máy chủ Server:</span>
                  <span className="font-bold text-cyan-600 dark:text-cyan-400">
                    {new Date(selectedContestGuard.serverTime).toLocaleString('vi-VN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">📅 Thời gian khai mạc:</span>
                  <span className="font-bold">
                    {new Date(selectedContestGuard.startTime).toLocaleString('vi-VN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">🏁 Thời gian bế mạc:</span>
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
                  className="px-5 py-2.5 text-xs font-black rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer shadow-md border-none"
                >
                  🚀 Vào Làm Bài Thi Trực Tiếp
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="px-5 py-2.5 text-xs font-bold rounded-xl bg-slate-400 text-white cursor-not-allowed border-none opacity-60"
                >
                  🔒 Bị Khóa Truy Cập
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
