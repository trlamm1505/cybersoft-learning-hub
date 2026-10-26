import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Code2, ArrowLeft, CheckCircle2, Lightbulb, Gamepad2, Rocket, Loader2, ArrowRight, PartyPopper, Bot, Briefcase } from 'lucide-react';
import { CareerLabHub } from '../components/CareerLabHub';
import { PlaygroundGrid, PlaygroundProgress } from '../components/PlaygroundList';
import { apiBandOfKey, BAND_LABEL, DIFFICULTY_BADGE, justFinishedTrack, lockedHint, nextItem, type PlaygroundBandKey } from './playgroundModel';
import { bandOfStudent } from '../common/exerciseMatrix';
import { CodeEditor } from '../components/CodeEditor';
import { OutputPanel } from '../components/OutputPanel';
import { TestResultsPanel } from '../components/TestResultsPanel';
import { HintPanel } from '../components/HintPanel';
import { CoachPanel } from '../components/CoachPanel';
import { useToast } from '../components/Toast';
import { useIntegrityTracker } from '../hooks/useIntegrityTracker';
import { useLeaveReporter } from '../hooks/useLeaveReporter';
import { playAlertBeep } from '../common/alertSound';
import { LeaveWarningBanner } from '../components/ProctorOverlays';
import { BackToClassButton, ClassResultModal } from '../components/ClassResultModal';
import exerciseApi from '../axios/exerciseApi';
import classAssignmentsApi from '../axios/classAssignmentsApi';
import type { MyAssignment } from '../types/classAssignments';
import { formatVnDateTime, scoreText } from '../common/classFormat';
import type { ExerciseDetail, PlaygroundResponse, RunCodeResponse, SubmitCodeResponse } from '../types/exercise';
import type { AuthUser } from '../types/auth';
import { TERMINAL_SUBMISSION_STATUSES } from '../types/exercise';

/** Khách chưa đăng nhập bấm Chạy / Nộp bài (bước kiểm tra cú pháp chạy trong Nộp bài). */
const GUEST_RUN_MESSAGE = 'Vui lòng đăng nhập để thực thi code trên hệ thống';

const POLL_INTERVAL_MS = 700;
// Bài thuật toán nặng (bộ test ẩn hàng MB) có thể mất vài chục giây để chấm khi CSDL ở xa: chờ tới 2 phút trước khi báo hết giờ.
const POLL_TIMEOUT_MS = 120000;

interface CodePlaygroundPageProps {
  isDark?: boolean;
  authUser?: AuthUser | null;
}

/** Khóa nhóm ở Playground (khớp bandOfStudent): hai khối phổ thông có lộ trình Python và cổng riêng của Người lớn. */
const GRADE_BAND_LABEL: Record<string, string> = { '6-9': BAND_LABEL['6-9'], '9-12': BAND_LABEL['10-12'], CAREER_ADULT: 'Người lớn / Chuyên ngành' };
const GRADE_CARDS = [
  { key: '6-9', Icon: Gamepad2, gradient: 'from-indigo-600 to-cyan-500' },
  { key: '9-12', Icon: Rocket, gradient: 'from-slate-700 to-slate-900' },
  { key: 'CAREER_ADULT', Icon: Briefcase, gradient: 'from-sky-600 to-indigo-700' },
] as const;

export const CodePlaygroundPage: React.FC<CodePlaygroundPageProps> = ({ authUser }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [exercise, setExercise] = useState<ExerciseDetail | null>(null);
  const [code, setCode] = useState('');
  const [stdin, setStdin] = useState('');

  const [runResult, setRunResult] = useState<RunCodeResponse | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const [submission, setSubmission] = useState<SubmitCodeResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [loadError, setLoadError] = useState<string | null>(null);

  // Chế độ bài của lớp: mở từ trang "Lớp học của tôi" qua ?assignment=<id>. Chỉ khi đó Submit mới tính điểm lớp
  // (mỗi lần sai trừ 1 điểm) và bị khóa khi hết hạn; Run thử và luyện tập tự do ở Playground không tính điểm.
  const assignmentId = useMemo(() => new URLSearchParams(window.location.search).get('assignment'), []);
  const [assignment, setAssignment] = useState<MyAssignment | null>(null);
  const reloadAssignment = useCallback(() => {
    if (!assignmentId || authUser?.role !== 'STUDENT') return;
    classAssignmentsApi
      .getAssignment(assignmentId)
      .then(setAssignment)
      .catch(() => setAssignment(null));
  }, [assignmentId, authUser?.role]);
  useEffect(reloadAssignment, [reloadAssignment]);
  // Chỉ áp dụng khi bài đang mở ĐÚNG là bài được giao (tránh banner sai nếu đổi sang bài khác trong cùng phiên).
  const classMode = !!assignment && assignment.exerciseSlug === selectedSlug;
  const classLocked = classMode && (assignment.locked || assignment.done);
  // Pop-up điểm sau khi nộp AC bài của lớp, kèm nút quay lại /my-class.
  const [showClassResult, setShowClassResult] = useState(false);
  const [activeResultTab, setActiveResultTab] = useState<'run' | 'submit' | 'hint' | 'coach'>('run');

  // Khối của học viên lấy từ TÀI KHOẢN (không chọn). Giảng viên/Admin chọn 6-9 hoặc 10-12 để xem lộ trình, người dùng Người lớn vào cổng Lab riêng.
  const isStudent = authUser?.role === 'STUDENT';
  const lockedBand: string | null = isStudent ? bandOfStudent(authUser?.ageGroup) : null;
  const [selectedGradeBand, setSelectedGradeBand] = useState<string | null>(lockedBand);
  const [view, setView] = useState<'grade' | 'exercises' | 'editor'>(lockedBand ? 'exercises' : 'grade');

  // Lộ trình chuẩn #1..#N của từng khối, trạng thái hoàn thành / mở khóa và tổng số bài đều do MÁY CHỦ tính (GET /exercises/playground)
  // từ bài nộp AC: không còn localStorage theo trình duyệt, nên không thể lệch với trang Tiến độ học tập hay giữa các thiết bị.
  const [tracks, setTracks] = useState<Partial<Record<PlaygroundBandKey, PlaygroundResponse>>>({});
  const tracksRef = useRef(tracks);
  tracksRef.current = tracks;
  const [tracksLoading, setTracksLoading] = useState(false);
  const loadTrack = useCallback(async (band: PlaygroundBandKey) => {
    const data = await exerciseApi.listPlayground(band);
    setTracks((prev) => ({ ...prev, [band]: data }));
    return data;
  }, []);

  const activeApiBand = apiBandOfKey(selectedGradeBand);
  const studentBand = isStudent ? apiBandOfKey(lockedBand) : null;
  const track = activeApiBand ? tracks[activeApiBand] : undefined;
  const items = useMemo(() => track?.exercises ?? [], [track]);
  const nextExercise = useMemo(() => nextItem(items, selectedSlug), [items, selectedSlug]);

  // Chúc mừng đúng một lần, ngay khi vừa hoàn thành bài cuối của lộ trình (so sánh trước/sau khi nộp, không cần ghi nhớ ở trình duyệt).
  const [celebrating, setCelebrating] = useState(false);
  const [celebrationCountdown, setCelebrationCountdown] = useState(10);
  useEffect(() => {
    if (!celebrating) return;
    if (celebrationCountdown <= 0) {
      navigate('/');
      return;
    }
    const timer = setTimeout(() => setCelebrationCountdown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [celebrating, celebrationCountdown, navigate]);

  /** Sau mỗi bài nộp AC: nạp lại tiến độ từ máy chủ (mở khóa bài kế tiếp, cập nhật X/N) và chúc mừng nếu vừa xong cả lộ trình. */
  const refreshTrackAfterAc = async () => {
    if (!studentBand) return;
    const before = tracksRef.current[studentBand];
    try {
      const after = await loadTrack(studentBand);
      if (justFinishedTrack(before, after)) {
        setCelebrationCountdown(10);
        setCelebrating(true);
      }
    } catch {
      /* giữ nguyên danh sách hiện tại; lần mở lại sẽ nạp mới */
    }
  };

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  // Bấm một thẻ bài là cách duy nhất vào trình soạn thảo. Bài còn khóa không mở được (đã chặn cả ở máy chủ khi nộp bài).
  const openExercise = (slug: string) => {
    if (!authUser) {
      showToast('Vui lòng đăng nhập để làm bài này.', 'info');
      navigate('/login');
      return;
    }
    const item = items.find((x) => x.slug === slug);
    if (isStudent && item?.status === 'locked') {
      showToast(lockedHint(items, item), 'info');
      return;
    }
    setSelectedSlug(slug);
    setView('editor');
  };

  useEffect(() => {
    if (!authUser) return;
    const bands: PlaygroundBandKey[] = isStudent ? (studentBand ? [studentBand] : []) : ['6-9', '10-12'];
    if (bands.length === 0) return; // Lớp 3-5 và Người lớn không có lộ trình Python ở đây.
    let cancelled = false;
    setTracksLoading(true);
    Promise.all(bands.map((b) => loadTrack(b)))
      .then((loaded) => {
        if (cancelled) return;
        // Liên kết từ "Lớp học của tôi" / gợi ý bài: /playground?slug=... (kèm &assignment=... với bài giao của lớp).
        const params = new URLSearchParams(window.location.search);
        const wanted = params.get('slug');
        if (!wanted) return;
        const all = loaded.flatMap((r) => r.exercises);
        const found = all.find((e) => e.slug === wanted);
        const forClass = !!params.get('assignment');
        if (found && found.status === 'locked' && !forClass) {
          showToast(lockedHint(all, found), 'info');
          return;
        }
        // Bài giao của lớp có thể nằm ngoài lộ trình chuẩn: máy chủ vẫn kiểm tra quyền khi tải/nộp bài.
        if (found || forClass || !isStudent) {
          if (found) setSelectedGradeBand(found.gradeBand === '6-9' ? '6-9' : '9-12');
          setSelectedSlug(wanted);
          setView('editor');
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError('Không thể tải lộ trình bài tập từ Backend. Vui lòng thử lại sau.');
      })
      .finally(() => {
        if (!cancelled) setTracksLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser?.id, authUser?.role, studentBand]);

  useEffect(() => {
    if (!selectedSlug) return;
    stopPolling();
    setLoadError(null);
    setRunResult(null);
    setSubmission(null);

    exerciseApi
      .getExercise(selectedSlug)
      .then((detail) => {
        setExercise(detail);
        setCode(detail.starterCode || '');
        setStdin(detail.testCases[0]?.input ?? '');
      })
      .catch(() => setLoadError(`Không thể tải bài tập "${selectedSlug}".`));
  }, [selectedSlug]);

  useEffect(() => stopPolling, []);

  // Bắt đầu một phiên ghi nhận mỗi khi mở một bài tập trong trình soạn thảo.
  // Ghi tín hiệu làm bài ở mức tối thiểu (thời gian, lần rời màn hình); xem IntegrityNotice.
  const integrityTrackerRef = useIntegrityTracker(view === 'editor' && !!exercise, exercise?.slug ?? '');
  // Giám sát bài lớp: rời màn hình quá 2 lần thì giảng viên được thông báo (máy chủ đếm).
  const [leaveInfo, setLeaveInfo] = useState<{ count: number; notified: boolean } | null>(null);
  useLeaveReporter({
    active: view === 'editor' && !!exercise && classMode && !classLocked && authUser?.role === 'STUDENT',
    scope: 'CLASS_ASSIGNMENT',
    refId: assignmentId,
    onReport: (report, localCount) => {
      playAlertBeep();
      setLeaveInfo({ count: report?.count ?? localCount, notified: !!report?.teacherNotified });
    },
  });

  const handleCodeChange = (value: string) => {
    setCode(value);
    integrityTrackerRef.current.markEdit(Date.now(), value.length);
  };

  // Chạy code và kiểm tra cú pháp đều cần đăng nhập (BE trả 401 cho khách):
  // báo trước bằng toast vàng rồi mới chuyển sang trang đăng nhập.
  const redirectGuestToLogin = () => {
    showToast(GUEST_RUN_MESSAGE, 'warning');
    navigate('/login');
  };

  const handleRun = async () => {
    if (!selectedSlug) return;
    if (!authUser) {
      redirectGuestToLogin();
      return;
    }
    setIsRunning(true);
    setActiveResultTab('run');
    try {
      const result = await exerciseApi.runCode(selectedSlug, code, stdin);

      // If STDIN matches a known sample test case's input, show a real pass/fail
      // hint here too — instead of only "ran without error" (Run has no grading
      // authority of its own; Submit remains the source of truth).
      const matchingTestCase = exercise?.testCases.find((tc) => !tc.isHidden && (tc.input ?? '') === stdin);
      if (matchingTestCase?.expectedOutput !== undefined) {
        const actualOutput = (result.stdout ?? '').trim();
        const expectedOutput = matchingTestCase.expectedOutput.trim();
        const passed = !result.timedOut && result.exitCode === 0 && actualOutput === expectedOutput;
        result.matchedTestCase = { expectedOutput: matchingTestCase.expectedOutput, passed };
      }

      setRunResult(result);
    } catch {
      setRunResult({
        stdout: '',
        stderr: 'Không thể kết nối tới máy chủ chạy code. Vui lòng kiểm tra lại Backend.',
        exitCode: null,
        timedOut: false,
        executionTimeMs: 0,
        blocked: false,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedSlug) return;
    if (!authUser) {
      redirectGuestToLogin();
      return;
    }
    stopPolling();
    setIsSubmitting(true);
    setActiveResultTab('submit');

    try {
      const initialAck = await exerciseApi.submitCode(
        selectedSlug,
        code,
        integrityTrackerRef.current.snapshot(Date.now()),
        classMode ? assignmentId : null,
      );

      const startTime = Date.now();
      pollIntervalRef.current = setInterval(async () => {
        if (Date.now() - startTime > POLL_TIMEOUT_MS) {
          stopPolling();
          setIsSubmitting(false);
          setLoadError('Máy chấm đang bận nên chưa có kết quả sau 2 phút. Bài nộp vẫn được chấm: hãy quay lại danh sách bài và tải lại trang để xem kết quả.');
          return;
        }

        try {
          const pollRes = await exerciseApi.getSubmission(initialAck.submissionId);
          setSubmission(pollRes);

          if (TERMINAL_SUBMISSION_STATUSES.includes(pollRes.status)) {
            stopPolling();
            setIsSubmitting(false);
            if (pollRes.status === 'AC') await refreshTrackAfterAc();
            if (classMode) {
              reloadAssignment(); // cập nhật điểm còn lại / trạng thái hoàn thành
              if (pollRes.status === 'AC') setShowClassResult(true);
            }
          }
        } catch {
          stopPolling();
          setIsSubmitting(false);
        }
      }, POLL_INTERVAL_MS);
    } catch (err) {
      setIsSubmitting(false);
      // Bài của lớp bị máy chủ từ chối (hết hạn - đã khóa, chưa mở, đã hoàn thành...): hiện đúng lý do.
      const serverMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setLoadError(serverMsg || 'Không thể gửi bài nộp. Vui lòng kiểm tra lại kết nối.');
      if (classMode) reloadAssignment();
      if (studentBand) void loadTrack(studentBand).catch(() => undefined); // bài vừa bị khóa/mở: đồng bộ lại trạng thái từ máy chủ
    }
  };

  // ============ Celebration overlay: shown once, right after finishing the last exercise of a topic ============
  if (celebrating) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="w-full max-w-md rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl p-8 text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-pink-500 flex items-center justify-center text-white shadow-lg">
            <PartyPopper size={32} strokeWidth={2} />
          </div>
          <h2 className="text-xl font-extrabold text-[var(--text-main)]">Chúc mừng bạn đã hoàn thành khóa!</h2>
          <p className="text-sm text-[var(--text-muted)]">
            Bạn đã giải đúng toàn bộ {track?.total ?? items.length} bài của lộ trình {GRADE_BAND_LABEL[selectedGradeBand ?? ''] ?? 'khóa học này'}. Làm tốt lắm!
          </p>
          <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400 tabular-nums">
            {celebrationCountdown}
          </div>
          <p className="text-xs text-[var(--text-muted)]">Tự động chuyển về trang chính sau {celebrationCountdown} giây...</p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-xs cursor-pointer transition-colors"
          >
            Về trang chính ngay
          </button>
        </div>
      </div>
    );
  }

  // ============ Screen 1: pick a grade band ============
  if (view === 'grade') {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md">
            <Code2 size={20} strokeWidth={2.25} />
          </div>
          <div>
            <h1 className="text-lg font-black text-[var(--text-main)] tracking-tight">Code Playground</h1>
            <p className="text-xs text-[var(--text-muted)]">Chọn khối lớp để bắt đầu.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {GRADE_CARDS.map(({ key: band, Icon: BandIcon, gradient }) => {
            const apiBand = apiBandOfKey(band);
            const count = apiBand ? tracks[apiBand]?.total : undefined;
            return (
              <button
                key={band}
                onClick={() => {
                  if (!authUser) {
                    showToast('Vui lòng đăng nhập để xem bài tập.', 'info');
                    navigate('/login');
                    return;
                  }
                  setSelectedGradeBand(band);
                  setView('exercises');
                }}
                className="p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-indigo-500 hover:shadow-md transition-all text-left cursor-pointer flex items-center gap-4"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-md shrink-0`}>
                  <BandIcon size={26} strokeWidth={2} />
                </div>
                <div>
                  <div className="font-extrabold text-base text-[var(--text-main)]">{GRADE_BAND_LABEL[band] ?? band}</div>
                  <div className="text-xs text-[var(--text-muted)] mt-0.5">
                    {band === 'CAREER_ADULT' ? 'Data Lab · AI Lab · Tester Lab' : count !== undefined ? `Lộ trình chuẩn ${count} bài` : 'Lộ trình chuẩn'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {loadError && (
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300">
            {loadError}
          </div>
        )}
      </div>
    );
  }

  // ============ Screen 2: lộ trình #1..#N của khối (không còn lọc theo chủ đề) ============
  if (view === 'exercises' && selectedGradeBand === 'CAREER_ADULT') {
    return (
      <CareerLabHub
        onBack={
          lockedBand
            ? undefined
            : () => {
                setView('grade');
                setSelectedGradeBand(null);
              }
        }
        onOpen={(path) => navigate(path)}
      />
    );
  }

  if (view === 'exercises') {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center gap-3">
            {!lockedBand && (
              <button
                onClick={() => {
                  setView('grade');
                  setSelectedGradeBand(null);
                }}
                aria-label="Quay lại chọn lớp"
                className="w-9 h-9 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] hover:bg-[var(--bg-card-hover)] flex items-center justify-center text-[var(--text-main)] cursor-pointer shrink-0"
              >
                <ArrowLeft size={16} strokeWidth={2} />
              </button>
            )}
            <div>
              <h1 className="text-base font-extrabold text-[var(--text-main)] tracking-tight">
                {lockedBand ? `Luyện tập · ${GRADE_BAND_LABEL[selectedGradeBand ?? ''] ?? ''}` : (GRADE_BAND_LABEL[selectedGradeBand ?? ''] ?? '')}
              </h1>
              <p className="text-xs text-[var(--text-muted)]">
                {lockedBand ? 'Khu luyện tập tự do, không tính điểm vào lớp học. Chọn 1 bài để bắt đầu làm.' : 'Chọn 1 bài để bắt đầu làm.'}
              </p>
            </div>
          </div>
        </div>

        {isStudent && track && <PlaygroundProgress data={track} />}

        {tracksLoading && !track ? (
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] px-1">
            <Loader2 size={14} className="animate-spin" /> Đang tải lộ trình bài tập...
          </div>
        ) : track && items.length > 0 ? (
          <PlaygroundGrid items={items} showStatus={isStudent} onOpen={openExercise} />
        ) : (
          !loadError && <div className="text-sm text-[var(--text-muted)] px-1">Khối này chưa có bài trong lộ trình.</div>
        )}

        {loadError && (
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300">
            {loadError}
          </div>
        )}
      </div>
    );
  }

  // ============ Screen 3: the actual code editor for the chosen exercise ============
  return (
    <div className="flex flex-col gap-4">
      {/* Top Bar: Back button & Meta */}
      <div className="flex items-center gap-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 shadow-xs">
        <button
          onClick={() => setView('exercises')}
          aria-label="Quay lại danh sách bài"
          className="w-9 h-9 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] hover:bg-[var(--bg-card-hover)] flex items-center justify-center text-[var(--text-main)] cursor-pointer shrink-0"
        >
          <ArrowLeft size={16} strokeWidth={2} />
        </button>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shrink-0">
          <Code2 size={18} strokeWidth={2.25} />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-black text-[var(--text-main)] tracking-tight truncate">Code Playground</h1>
          <p className="text-xs text-[var(--text-muted)]">Viết code Python, chạy thử và chấm điểm tự động.</p>
        </div>
      </div>

      {classMode && assignment && (
        <section
          aria-label="Bài tập của lớp"
          data-testid="class-assignment-banner"
          className={`rounded-2xl border p-4 text-sm ${assignment.state === 'EXPIRED' ? 'border-rose-300 bg-rose-50 dark:bg-rose-950/30' : assignment.done ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30' : 'border-indigo-300 bg-indigo-50 dark:bg-indigo-950/30'}`}
        >
          <div className="font-bold text-[var(--text-main)]">
            Bài tập của lớp {assignment.className}: {assignment.title}
          </div>
          <div className="mt-1 text-xs text-[var(--text-muted)]">
            Hạn chót: <strong>{formatVnDateTime(assignment.dueAt)}</strong> · Tối đa {assignment.maxPoints} điểm. Bấm <strong>Run</strong> thử thoải mái, không trừ điểm;
            mỗi lần <strong>Submit</strong> sai (WA/TLE/RE) bị trừ 1 điểm.
          </div>
          <BackToClassButton onClick={() => navigate('/my-class')} className="mt-3 !px-4 !py-2 !text-sm" />
          {assignment.done ? (
            <div className="mt-2 font-bold text-emerald-700 dark:text-emerald-400">✅ Đã hoàn thành: {scoreText(assignment)}</div>
          ) : assignment.state === 'EXPIRED' ? (
            <div className="mt-2 font-bold text-rose-700 dark:text-rose-400">Đã hết hạn - Đã khóa: không thể nộp bài nữa (vẫn có thể bấm Run để thử).</div>
          ) : (
            <div className="mt-2 font-semibold text-[var(--text-main)]">
              Đã nộp sai {assignment.wrongCount} lần · nếu AC bây giờ bạn được <strong>{assignment.potentialScore}/{assignment.maxPoints}</strong> điểm.
            </div>
          )}
        </section>
      )}

      {classMode && assignment && showClassResult && (
        <ClassResultModal
          title={assignment.title}
          scoreText={assignment.done ? `Điểm: ${scoreText(assignment)}` : 'Đang cập nhật điểm...'}
          onBack={() => navigate('/my-class')}
          onClose={() => setShowClassResult(false)}
        />
      )}

      {classMode && leaveInfo && (
        <LeaveWarningBanner count={leaveInfo.count} notifyAfter={2} teacherNotified={leaveInfo.notified} />
      )}

      {/* Main Grid: Code Editor Left vs Output/Hints Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Problem & Code Editor */}
        <div className="lg:col-span-7 space-y-4">
          {exercise && (
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-extrabold text-[var(--text-main)]">{exercise.title}</h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${DIFFICULTY_BADGE[exercise.difficulty] || ''}`}>
                  {exercise.difficulty}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed whitespace-pre-wrap">{exercise.description}</p>
            </div>
          )}

          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">Trình soạn thảo Python</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRun}
                  disabled={isRunning || isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isRunning ? <Loader2 size={14} className="animate-spin" /> : <Code2 size={14} />}
                  {isRunning ? 'Đang chạy...' : 'Run'}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isRunning || isSubmitting || classLocked}
                  title={classLocked ? (assignment?.done ? 'Bạn đã hoàn thành bài này' : 'Bài đã hết hạn - đã khóa') : undefined}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  {isSubmitting ? 'Đang chấm...' : 'Submit'}
                </button>
              </div>
            </div>

            <CodeEditor
              value={code}
              onChange={handleCodeChange}
              height="350px"
            />

            <div>
              <label htmlFor="playground-stdin" className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">
                STDIN (Dữ liệu đầu vào cho Run)
              </label>
              <textarea
                id="playground-stdin"
                rows={2}
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-mono rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] focus:outline-none focus:border-indigo-500"
                placeholder="Nhập dữ liệu vào..."
              />
            </div>
          </div>
        </div>

        {/* Right Column: Output / Test Results / Hint Engine */}
        <div className="lg:col-span-5 space-y-4">
          {/* Result Tabs */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-1.5 flex gap-1 shadow-xs text-xs font-semibold">
            <button
              onClick={() => setActiveResultTab('run')}
              className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeResultTab === 'run'
                  ? 'bg-indigo-600 text-white shadow-xs font-bold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              Output
            </button>
            <button
              onClick={() => setActiveResultTab('submit')}
              className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeResultTab === 'submit'
                  ? 'bg-indigo-600 text-white shadow-xs font-bold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              Kết quả Test mẫu
            </button>
            <button
              onClick={() => setActiveResultTab('hint')}
              className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeResultTab === 'hint'
                  ? 'bg-amber-700 text-white shadow-xs font-bold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <Lightbulb size={14} /> Gợi ý
            </button>
            <button
              onClick={() => setActiveResultTab('coach')}
              className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeResultTab === 'coach'
                  ? 'bg-indigo-600 text-white shadow-xs font-bold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <Bot size={14} /> AI Coach
            </button>
          </div>

          {/* Tab Content Display */}
          {activeResultTab === 'run' && <OutputPanel result={runResult} isRunning={isRunning} />}

          {activeResultTab === 'submit' && (
            <>
              <TestResultsPanel submission={submission} isSubmitting={isSubmitting} />
              {submission?.status === 'AC' && nextExercise && nextExercise.status !== 'locked' && (
                <button
                  onClick={() => openExercise(nextExercise.slug)}
                  className="w-full mt-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-xs cursor-pointer flex items-center justify-center gap-2 transition-colors"
                >
                  Bài tiếp theo: {nextExercise.title}
                  <ArrowRight size={16} />
                </button>
              )}
            </>
          )}

          {activeResultTab === 'hint' && selectedSlug && authUser && (
            <HintPanel
              exerciseSlug={selectedSlug}
              userId={authUser.id}
              customHints={exercise?.hints}
              onApplySolution={(solution) => {
                setCode(solution);
              }}
            />
          )}

          {activeResultTab === 'coach' && selectedSlug && authUser && (
            <CoachPanel
              exerciseSlug={selectedSlug}
              userId={authUser.id}
              lastSubmissionId={submission?._id ?? null}
            />
          )}

          {loadError && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300">
              {loadError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
