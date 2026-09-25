import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Code2,
  ArrowLeft,
  Lock,
  Unlock,
  CheckCircle2,
  Lightbulb,
  BookOpen,
  Baby,
  Gamepad2,
  Rocket,
  Loader2,
  ArrowRight,
  PartyPopper,
  Bot,
} from 'lucide-react';
import { CodeEditor } from '../components/CodeEditor';
import { OutputPanel } from '../components/OutputPanel';
import { TestResultsPanel } from '../components/TestResultsPanel';
import { HintPanel } from '../components/HintPanel';
import { CoachPanel } from '../components/CoachPanel';
import { useToast } from '../components/Toast';
import exerciseApi from '../axios/exerciseApi';
import type { ExerciseDetail, ExerciseListItem, RunCodeResponse, SubmitCodeResponse } from '../types/exercise';
import type { LessonAuthoring } from '../types/authoring';
import type { AuthUser } from '../types/auth';
import { TERMINAL_SUBMISSION_STATUSES } from '../types/exercise';

const POLL_INTERVAL_MS = 700;
const POLL_TIMEOUT_MS = 15000;

interface CodePlaygroundPageProps {
  isDark?: boolean;
  teacherLessons?: LessonAuthoring[];
  authUser?: AuthUser | null;
}

const DIFFICULTY_BADGE: Record<string, string> = {
  EASY: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  MEDIUM: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  HARD: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
};

export const CodePlaygroundPage: React.FC<CodePlaygroundPageProps> = ({ isDark, teacherLessons = [], authUser }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [exercises, setExercises] = useState<ExerciseListItem[]>([]);
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
  const [activeResultTab, setActiveResultTab] = useState<'run' | 'submit' | 'hint' | 'coach'>('run');

  // Grade/topic filters — narrow the exercise dropdown by class level and by
  // game/topic pack within that level, instead of one flat list mixing everything.
  const UNGRADED = '__ungraded__';
  const [selectedGradeBand, setSelectedGradeBand] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string>('all');

  // Navigation: Code Playground opens on a grade-picker screen, then a card grid of
  // exercises for that grade/topic, and only opens the code editor once a specific
  // exercise card is clicked — instead of dropping straight into an editor.
  const [view, setView] = useState<'grade' | 'exercises' | 'editor'>('grade');

  // Sequential unlock within a topic: exercise N+1 only opens once exercise N has
  // been solved correctly (AC), same rule and localStorage-based persistence as the
  // Block Puzzle track (Day 13) — no server-side account tracking yet.
  //
  // Namespaced theo authUser.id (hoặc 'guest' khi chưa đăng nhập) — trước đây
  // dùng chung một key cố định cho mọi tài khoản trên cùng trình duyệt, nên
  // logout rồi đăng nhập tài khoản khác vẫn thấy tiến độ mở khóa của người
  // dùng trước đó.
  const completedExercisesKey = `app_code_playground_completed_${authUser?.id || 'guest'}`;
  const [completedSlugs, setCompletedSlugs] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(completedExercisesKey);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Tài khoản đăng nhập có thể đổi mà không reload trang (login/logout trong
  // cùng phiên SPA) — nạp lại đúng tiến độ của tài khoản hiện tại mỗi khi
  // authUser?.id thay đổi, thay vì giữ nguyên state của tài khoản trước đó.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(completedExercisesKey);
      setCompletedSlugs(saved ? new Set(JSON.parse(saved)) : new Set());
    } catch {
      setCompletedSlugs(new Set());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completedExercisesKey]);

  const markCompleted = (slug: string) => {
    setCompletedSlugs((prev) => {
      if (prev.has(slug)) return prev;
      const next = new Set(prev).add(slug);
      try {
        localStorage.setItem(completedExercisesKey, JSON.stringify(Array.from(next)));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  // Celebration modal + auto-redirect countdown, shown exactly once, right when
  // the LAST exercise of a sequential-unlock topic just turned AC — not on every
  // later visit to an already-finished topic. "Already celebrated" is tracked
  // per topic in its own localStorage key so re-opening a finished topic later
  // stays quiet.
  const celebratedTopicsKey = `app_code_playground_celebrated_topics_${authUser?.id || 'guest'}`;
  const [celebrationTopicKey, setCelebrationTopicKey] = useState<string | null>(null);
  const [celebrationCountdown, setCelebrationCountdown] = useState(10);

  // Teacher coding lessons (Only Published)
  const teacherCodingLessons = teacherLessons.filter(
    (l) => (l.status === 'published' || !l.status) && l.type === 'coding',
  );

  const teacherCodingItems: ExerciseListItem[] = teacherCodingLessons.map((l, index) => ({
    _id: l._id || `teacher-ex-${index}`,
    slug: l.slug,
    title: l.title.replace(/^[🧑‍💻📝👨‍🏫\s]+/, '').trim(),
    description: l.content || l.description || 'Bài tập lập trình',
    type: 'CODE_TEXT',
    difficulty: (l.difficulty as any) || 'EASY',
    points: l.points,
    starterCode: l.starterCode || '# Viết mã nguồn Python tại đây\n',
    timeLimitMs: 2000,
  }));

  // Deduplicate exercises by slug so each exercise appears only ONCE in clean format.
  // Combine both sources (system Exercise API + Teacher Authoring lessons) instead of
  // letting one fully replace the other — otherwise any teacher-created coding lesson
  // would hide the entire system exercise catalog from the dropdown.
  const combinedExercises = useMemo(() => {
    const map = new Map<string, ExerciseListItem>();
    exercises.forEach((ex) => {
      const cleanedTitle = ex.title.replace(/^[🧑‍💻📝👨‍🏫\s]+/, '').trim();
      map.set(ex.slug, { ...ex, title: cleanedTitle });
    });
    teacherCodingItems.forEach((ex) => {
      map.set(ex.slug, ex);
    });

    return Array.from(map.values());
  }, [exercises, teacherCodingItems]);

  // Grade bands actually present in the catalog, in a fixed pedagogical order
  // (ungraded/legacy first, then 3-5 -> 6-9 -> 9-12), not alphabetical.
  const GRADE_BAND_ORDER = [UNGRADED, '3-5', '6-9', '9-12'];
  const GRADE_BAND_LABEL: Record<string, string> = {
    [UNGRADED]: 'Bài cũ (chưa phân lớp)',
    '3-5': 'Lớp 3-5',
    '6-9': 'Lớp 6-9',
    '9-12': 'Lớp 10-12',
  };
  // Icon + accent gradient per grade band — younger bands get warmer, more playful
  // color to match the age group; older bands read calmer/more "serious tool".
  const GRADE_BAND_ICON: Record<string, typeof BookOpen> = {
    [UNGRADED]: BookOpen,
    '3-5': Baby,
    '6-9': Gamepad2,
    '9-12': Rocket,
  };
  const GRADE_BAND_GRADIENT: Record<string, string> = {
    [UNGRADED]: 'from-slate-500 to-slate-600',
    '3-5': 'from-orange-400 to-pink-500',
    '6-9': 'from-indigo-600 to-cyan-500',
    '9-12': 'from-slate-700 to-slate-900',
  };
  const availableGradeBands = useMemo(() => {
    const present = new Set(combinedExercises.map((ex) => ex.gradeBand || UNGRADED));
    return GRADE_BAND_ORDER.filter((band) => present.has(band));
  }, [combinedExercises]);

  // Topics (game/chủ đề packs) available within the selected grade band.
  const availableTopics = useMemo(() => {
    if (selectedGradeBand === null) return [];
    const inBand = combinedExercises.filter((ex) => (ex.gradeBand || UNGRADED) === selectedGradeBand);
    const topics = new Set(inBand.map((ex) => ex.topic).filter((t): t is string => Boolean(t)));
    return Array.from(topics).sort();
  }, [combinedExercises, selectedGradeBand]);

  const filteredExercises = useMemo(() => {
    if (selectedGradeBand === null) return [];
    let list = combinedExercises.filter((ex) => (ex.gradeBand || UNGRADED) === selectedGradeBand);
    if (selectedTopic !== 'all') {
      list = list.filter((ex) => ex.topic === selectedTopic);
    }
    return list.sort((a, b) => (a.orderInTopic ?? 0) - (b.orderInTopic ?? 0));
  }, [combinedExercises, selectedGradeBand, selectedTopic]);

  // Sequential unlock only applies when the visible list is a single, specific
  // topic's progression — either because the person picked one topic explicitly,
  // or because the grade band only has one topic to begin with (no topic picker
  // shown, but the list is still exactly that one progression). Mixing several
  // topics together, or a grade band with none at all, would make "position in
  // the list" meaningless as a lock gate.
  const isSequentialUnlockActive =
    selectedGradeBand !== null && (selectedTopic !== 'all' || availableTopics.length === 1);
  const isExerciseUnlocked = (idx: number) => {
    if (!isSequentialUnlockActive) return true;
    if (idx === 0) return true;
    const prevExercise = filteredExercises[idx - 1];
    return !!prevExercise && completedSlugs.has(prevExercise.slug);
  };

  // Detect "just finished the whole topic": every exercise in the current
  // sequential-unlock list is completed, and this topic hasn't been celebrated
  // before (tracked in its own localStorage set, keyed by gradeBand+topic so it
  // survives reloads without re-firing on a topic already finished earlier).
  useEffect(() => {
    if (!isSequentialUnlockActive || filteredExercises.length === 0) return;
    const allCompleted = filteredExercises.every((ex) => completedSlugs.has(ex.slug));
    if (!allCompleted) return;

    const topicKey = `${selectedGradeBand}::${selectedTopic !== 'all' ? selectedTopic : (filteredExercises[0].topic ?? 'default')}`;
    let alreadyCelebrated: string[] = [];
    try {
      const saved = localStorage.getItem(celebratedTopicsKey);
      alreadyCelebrated = saved ? JSON.parse(saved) : [];
    } catch {
      /* ignore */
    }
    if (alreadyCelebrated.includes(topicKey)) return;

    try {
      localStorage.setItem(celebratedTopicsKey, JSON.stringify([...alreadyCelebrated, topicKey]));
    } catch {
      /* ignore */
    }
    setCelebrationCountdown(10);
    setCelebrationTopicKey(topicKey);
  }, [completedSlugs, filteredExercises, isSequentialUnlockActive, selectedGradeBand, selectedTopic, celebratedTopicsKey]);

  // Countdown that auto-redirects to the home route once it reaches 0.
  useEffect(() => {
    if (!celebrationTopicKey) return;
    if (celebrationCountdown <= 0) {
      navigate('/');
      return;
    }
    const timer = setTimeout(() => setCelebrationCountdown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [celebrationTopicKey, celebrationCountdown, navigate]);

  // Reset the topic filter whenever the grade band changes — a topic picked
  // under one grade band has no meaning under another.
  useEffect(() => {
    setSelectedTopic('all');
  }, [selectedGradeBand]);

  // The exercise right after the current one in the same filtered/ordered list —
  // used to offer a "Next exercise" shortcut once the current one is solved (AC),
  // instead of forcing a trip back to the grid every time.
  const nextExercise = useMemo(() => {
    if (!selectedSlug) return null;
    const idx = filteredExercises.findIndex((ex) => ex.slug === selectedSlug);
    if (idx === -1) return null;
    return filteredExercises[idx + 1] ?? null;
  }, [filteredExercises, selectedSlug]);

  // Hệ thống Exercise thật (có backend judge lưu submission vào DB) luôn được ưu
  // tiên khi trùng slug với một Teacher Authoring lesson — nếu không, mọi bài
  // trùng slug sẽ luôn bị chấm giả lập ở FE (không lưu submission), khiến các
  // tính năng cần submission thật (như AI Coach Debug Loop) không hoạt động
  // được trên đúng bài mà học viên đang làm.
  const hasSystemExercise = exercises.some((ex) => ex.slug === selectedSlug);
  const activeTeacherLesson = hasSystemExercise
    ? undefined
    : teacherCodingLessons.find((l) => l.slug === selectedSlug || l._id === selectedSlug);

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  // Clicking an exercise card is the only way into the editor screen.
  const openExercise = (slug: string) => {
    if (!authUser) {
      showToast('Vui lòng đăng nhập để làm bài này.', 'info');
      navigate('/login');
      return;
    }
    setSelectedSlug(slug);
    setView('editor');
  };

  useEffect(() => {
    // Just load the catalog for the grade/exercise picker screens — no auto-selecting
    // a slug or jumping into the editor. The editor only opens once the person clicks
    // a specific exercise card.
    exerciseApi
      .listExercises()
      .then((list) => setExercises(list))
      .catch(() => {
        setLoadError('Không thể kết nối Backend exercise API, đang hiển thị bài tập của Giảng viên.');
      });
  }, []);

  useEffect(() => {
    if (!selectedSlug) return;
    stopPolling();
    setLoadError(null);
    setRunResult(null);
    setSubmission(null);

    // If selected slug belongs to a Teacher Created Coding Lesson (and has no
    // colliding system Exercise — see activeTeacherLesson above for why).
    const tLesson = hasSystemExercise
      ? undefined
      : teacherCodingLessons.find((l) => l.slug === selectedSlug || l._id === selectedSlug);
    if (tLesson) {
      const detail: ExerciseDetail = {
        _id: tLesson._id || `t-id-${tLesson.slug}`,
        title: tLesson.title,
        slug: tLesson.slug,
        description: tLesson.content || tLesson.description || 'Bài tập lập trình thiết kế bởi Giảng viên',
        type: 'CODE_TEXT',
        difficulty: (tLesson.difficulty as any) || 'EASY',
        points: tLesson.points,
        starterCode: tLesson.starterCode || '# Viết mã nguồn Python tại đây\n',
        timeLimitMs: 2000,
        hiddenTestCount: (tLesson.testCases || []).filter((tc) => tc.isHidden).length,
        testCases: (tLesson.testCases || []).map((tc) => ({
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          isHidden: tc.isHidden ?? false,
        })),
      };
      setExercise(detail);
      setCode(detail.starterCode || '# Viết mã nguồn Python tại đây\n');
      setStdin(detail.testCases[0]?.input ?? '');
      return;
    }

    // Otherwise load system exercise
    exerciseApi
      .getExercise(selectedSlug)
      .then((detail) => {
        setExercise(detail);
        setCode(detail.starterCode || '');
        setStdin(detail.testCases[0]?.input ?? '');
      })
      .catch(() => setLoadError(`Không thể tải bài tập "${selectedSlug}".`));
  }, [selectedSlug, teacherLessons, exercises]);

  useEffect(() => stopPolling, []);

  const handleRun = async () => {
    if (!selectedSlug) return;
    if (!authUser) {
      showToast('Vui lòng đăng nhập để chạy thử code.', 'info');
      navigate('/login');
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
      showToast('Vui lòng đăng nhập để nộp bài.', 'info');
      navigate('/login');
      return;
    }
    stopPolling();
    setIsSubmitting(true);
    setActiveResultTab('submit');

    // Teacher Authoring lessons have no matching row in the backend Exercise
    // collection, so the queued judge pipeline (/exercises/:slug/submit) can't
    // resolve them. Grade for real here instead: actually run the student's code
    // against each test case via the sandboxed /run endpoint and compare output.
    if (activeTeacherLesson) {
      try {
        const testCases = activeTeacherLesson.testCases;

        const syntaxCheck = await exerciseApi.checkSyntax(code);
        if (!syntaxCheck.ok) {
          setSubmission({
            _id: `sub-${Date.now()}`,
            exerciseId: activeTeacherLesson._id || activeTeacherLesson.slug,
            code,
            status: 'CE',
            passedCount: 0,
            totalCount: testCases.length,
            results: [],
            errorMessage: syntaxCheck.errorMessage,
          });
          return;
        }

        // Mirrors judge-queue.service.ts's gradeOne(): status is overwritten by whichever
        // test case failed LAST in test-case order (not a fixed severity ranking), so a
        // teacher-authored lesson reports the same AC/WA/RE/TLE granularity system
        // exercises get, instead of a flat AC/WA.
        const outcomes = await Promise.all(
          testCases.map(async (tc, idx) => {
            try {
              const run = await exerciseApi.runCode(selectedSlug, code, tc.input ?? '');
              const actualOutput = (run.stdout ?? '').trim();
              const expectedOutput = (tc.expectedOutput ?? '').trim();
              const passed = !run.timedOut && run.exitCode === 0 && actualOutput === expectedOutput;

              let failureKind: 'TLE' | 'RE' | 'WA' | null = null;
              if (!passed) {
                failureKind = run.timedOut ? 'TLE' : run.exitCode !== 0 ? 'RE' : 'WA';
              }

              return {
                failureKind,
                result: {
                  index: idx,
                  passed,
                  isHidden: tc.isHidden ?? false,
                  input: tc.input,
                  expectedOutput: tc.expectedOutput,
                  actualOutput,
                  stderr: run.stderr || undefined,
                  executionTimeMs: run.executionTimeMs ?? 0,
                },
              };
            } catch {
              return {
                failureKind: 'RE' as const,
                result: {
                  index: idx,
                  passed: false,
                  isHidden: tc.isHidden ?? false,
                  input: tc.input,
                  expectedOutput: tc.expectedOutput,
                  actualOutput: 'Không thể kết nối tới máy chủ chạy code.',
                  executionTimeMs: 0,
                },
              };
            }
          }),
        );

        const results = outcomes.map((o) => o.result);
        const passedCount = results.filter((r) => r.passed).length;

        let status: SubmitCodeResponse['status'] = 'AC';
        for (const o of outcomes) {
          if (o.failureKind) status = o.failureKind;
        }

        const realResult: SubmitCodeResponse = {
          _id: `sub-${Date.now()}`,
          exerciseId: activeTeacherLesson._id || activeTeacherLesson.slug,
          code,
          status,
          passedCount,
          totalCount: testCases.length,
          results,
        };
        setSubmission(realResult);
        if (status === 'AC') markCompleted(activeTeacherLesson.slug);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    try {
      const initialAck = await exerciseApi.submitCode(selectedSlug, code);

      const startTime = Date.now();
      pollIntervalRef.current = setInterval(async () => {
        if (Date.now() - startTime > POLL_TIMEOUT_MS) {
          stopPolling();
          setIsSubmitting(false);
          setLoadError('Hết thời gian chờ kết quả chấm điểm (Timeout).');
          return;
        }

        try {
          const pollRes = await exerciseApi.getSubmission(initialAck.submissionId);
          setSubmission(pollRes);

          if (TERMINAL_SUBMISSION_STATUSES.includes(pollRes.status)) {
            stopPolling();
            setIsSubmitting(false);
            if (pollRes.status === 'AC') markCompleted(selectedSlug);
          }
        } catch {
          stopPolling();
          setIsSubmitting(false);
        }
      }, POLL_INTERVAL_MS);
    } catch {
      setIsSubmitting(false);
      setLoadError('Không thể gửi bài nộp. Vui lòng kiểm tra lại kết nối.');
    }
  };

  // ============ Celebration overlay: shown once, right after finishing the last exercise of a topic ============
  if (celebrationTopicKey) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="w-full max-w-md rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl p-8 text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-pink-500 flex items-center justify-center text-white shadow-lg">
            <PartyPopper size={32} strokeWidth={2} />
          </div>
          <h2 className="text-xl font-extrabold text-[var(--text-main)]">Chúc mừng bạn đã hoàn thành khóa!</h2>
          <p className="text-sm text-[var(--text-muted)]">
            Bạn đã giải đúng toàn bộ {filteredExercises.length} bài trong{' '}
            {selectedTopic !== 'all' ? `chủ đề "${selectedTopic}"` : (GRADE_BAND_LABEL[selectedGradeBand ?? ''] ?? 'khóa học này')}. Làm tốt lắm!
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
          {availableGradeBands.map((band) => {
            const count = combinedExercises.filter((ex) => (ex.gradeBand || UNGRADED) === band).length;
            const BandIcon = GRADE_BAND_ICON[band] ?? BookOpen;
            return (
              <button
                key={band}
                onClick={() => {
                  setSelectedGradeBand(band);
                  setView('exercises');
                }}
                className="p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-indigo-500 hover:shadow-md transition-all text-left cursor-pointer flex items-center gap-4"
              >
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${GRADE_BAND_GRADIENT[band] ?? GRADE_BAND_GRADIENT[UNGRADED]} flex items-center justify-center text-white shadow-md shrink-0`}
                >
                  <BandIcon size={26} strokeWidth={2} />
                </div>
                <div>
                  <div className="font-extrabold text-base text-[var(--text-main)]">{GRADE_BAND_LABEL[band] ?? band}</div>
                  <div className="text-xs text-[var(--text-muted)] mt-0.5">{count} bài</div>
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

  // ============ Screen 2: pick a topic (if more than one), then an exercise card ============
  if (view === 'exercises') {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center gap-3">
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
            <div>
              <h1 className="text-base font-extrabold text-[var(--text-main)] tracking-tight">
                {GRADE_BAND_LABEL[selectedGradeBand ?? ''] ?? ''}
              </h1>
              <p className="text-xs text-[var(--text-muted)]">Chọn 1 bài để bắt đầu làm.</p>
            </div>
          </div>

          {availableTopics.length > 1 && (
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="px-3 py-2 text-xs font-bold rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] focus:outline-none focus:border-indigo-500 shadow-xs cursor-pointer"
            >
              <option value="all">Tất cả chủ đề</option>
              {availableTopics.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
          )}
        </div>

        {isSequentialUnlockActive && completedSlugs.size > 0 && (
          <div className="text-xs font-semibold text-[var(--text-muted)] px-1">
            Tiến độ: {filteredExercises.filter((e) => completedSlugs.has(e.slug)).length}/{filteredExercises.length} bài đã hoàn thành
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExercises.map((item, idx) => {
            const unlocked = isExerciseUnlocked(idx);
            const completed = completedSlugs.has(item.slug);
            return (
              <button
                key={item.slug}
                disabled={!unlocked}
                onClick={() => unlocked && openExercise(item.slug)}
                className={`p-4 rounded-2xl border text-left transition-all flex flex-col gap-2 ${
                  unlocked
                    ? 'border-[var(--border-color)] bg-[var(--bg-card)] hover:border-indigo-500 hover:shadow-md cursor-pointer'
                    : 'border-[var(--border-color)] bg-[var(--bg-card)] opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[var(--text-muted)]">
                    #{item.orderInTopic ?? idx + 1}
                  </span>
                  {completed ? (
                    <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
                  ) : unlocked ? (
                    <Unlock size={18} className="text-[var(--text-muted)]" strokeWidth={2} />
                  ) : (
                    <Lock size={18} className="text-[var(--text-muted)]" strokeWidth={2} />
                  )}
                </div>
                <div className="font-bold text-sm text-[var(--text-main)] leading-snug">{item.title}</div>
                <span className={`self-start text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${DIFFICULTY_BADGE[item.difficulty] || ''}`}>
                  {item.difficulty}
                </span>
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
                  disabled={isRunning || isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  {isSubmitting ? 'Đang chấm...' : 'Submit'}
                </button>
              </div>
            </div>

            <CodeEditor
              value={code}
              onChange={setCode}
              isDark={isDark ?? false}
              height="350px"
            />

            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">
                STDIN (Dữ liệu đầu vào cho Run)
              </label>
              <textarea
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
                  ? 'bg-amber-600 text-white shadow-xs font-bold'
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
              {submission?.status === 'AC' && nextExercise && (
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
              customHints={activeTeacherLesson?.hints ?? exercise?.hints}
              onApplySolution={(solution) => {
                setCode(solution);
              }}
            />
          )}

          {activeResultTab === 'coach' && selectedSlug && authUser && (
            <CoachPanel
              exerciseSlug={selectedSlug}
              userId={authUser.id}
              lastSubmissionId={!activeTeacherLesson ? (submission?._id ?? null) : null}
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
