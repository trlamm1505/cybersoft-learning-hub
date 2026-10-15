import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
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
  Briefcase,
  Star,
} from 'lucide-react';
import { KidExerciseView } from '../components/KidExerciseView';
import { CareerLabHub } from '../components/CareerLabHub';
import { bandOfExercise, bandOfStudent, UNGRADED } from '../common/exerciseMatrix';
import { CodeEditor } from '../components/CodeEditor';
import { OutputPanel } from '../components/OutputPanel';
import { TestResultsPanel } from '../components/TestResultsPanel';
import { HintPanel } from '../components/HintPanel';
import { CoachPanel } from '../components/CoachPanel';
import { useToast } from '../components/Toast';
import { IntegrityNotice } from '../components/IntegrityNotice';
import { useIntegrityTracker } from '../hooks/useIntegrityTracker';
import exerciseApi from '../axios/exerciseApi';
import classAssignmentsApi from '../axios/classAssignmentsApi';
import type { MyAssignment } from '../types/classAssignments';
import { formatVnDateTime, scoreText } from '../common/classFormat';
import type { ExerciseDetail, ExerciseListItem, RunCodeResponse, SubmitCodeResponse } from '../types/exercise';
import type { LessonAuthoring } from '../types/authoring';
import type { AuthUser } from '../types/auth';
import { isStaff } from '../types/auth';
import { TERMINAL_SUBMISSION_STATUSES } from '../types/exercise';

/** Khách chưa đăng nhập bấm Chạy / Nộp bài (bước kiểm tra cú pháp chạy trong Nộp bài). */
const GUEST_RUN_MESSAGE = 'Vui lòng đăng nhập để thực thi code trên hệ thống';

const POLL_INTERVAL_MS = 700;
const POLL_TIMEOUT_MS = 15000;

interface CodePlaygroundPageProps {
  isDark?: boolean;
  teacherLessons?: LessonAuthoring[];
  authUser?: AuthUser | null;
  /** Kid Mode (Lớp 3-5): vào thẳng khối 3-5, không có lối sang khối khác. */
  kidMode?: boolean;
}

const DIFFICULTY_BADGE: Record<string, string> = {
  EASY: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  MEDIUM: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  HARD: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
};

export const CodePlaygroundPage: React.FC<CodePlaygroundPageProps> = ({ teacherLessons = [], authUser, kidMode = false }) => {
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
  const [activeResultTab, setActiveResultTab] = useState<'run' | 'submit' | 'hint' | 'coach'>('run');

  // Grade/topic filters — narrow the exercise dropdown by class level and by
  // game/topic pack within that level, instead of one flat list mixing everything.
  // Học viên được đổ thẳng danh sách bài của đúng khối mình (theo ageGroup), không phải chọn khối. Giảng viên/Admin vẫn chọn khối.
  const lockedBand: string | null = kidMode ? '3-5' : authUser?.role === 'STUDENT' ? bandOfStudent(authUser.ageGroup) : null;
  const [selectedGradeBand, setSelectedGradeBand] = useState<string | null>(lockedBand);
  const [selectedTopic, setSelectedTopic] = useState<string>('all');

  // Navigation: Code Playground opens on a grade-picker screen, then a card grid of
  // exercises for that grade/topic, and only opens the code editor once a specific
  // exercise card is clicked — instead of dropping straight into an editor.
  const [view, setView] = useState<'grade' | 'exercises' | 'editor'>(lockedBand ? 'exercises' : 'grade');

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
  //
  // Khi một teacher lesson trùng slug với một system exercise (ví dụ do đồng bộ dữ
  // liệu authoring <-> exercises), lesson đó KHÔNG được ghi đè sạch bản system —
  // teacherCodingItems build thủ công ở trên không có gradeBand/topic/orderInTopic/
  // tags, nên set thẳng sẽ làm bài đó rơi khỏi mọi nhóm lớp (về "Bài cũ chưa phân
  // lớp") dù backend vẫn trả gradeBand đúng. Giữ lại các field phân loại từ bản
  // system, chỉ để bản teacher ghi đè nội dung (title/description/starterCode...).
  const combinedExercises = useMemo(() => {
    const map = new Map<string, ExerciseListItem>();
    exercises.forEach((ex) => {
      const cleanedTitle = ex.title.replace(/^[🧑‍💻📝👨‍🏫\s]+/, '').trim();
      map.set(ex.slug, { ...ex, title: cleanedTitle });
    });
    teacherCodingItems.forEach((ex) => {
      const existing = map.get(ex.slug);
      map.set(
        ex.slug,
        existing
          ? {
              ...ex,
              gradeBand: existing.gradeBand,
              topic: existing.topic,
              orderInTopic: existing.orderInTopic,
              tags: existing.tags,
            }
          : ex,
      );
    });

    return Array.from(map.values());
  }, [exercises, teacherCodingItems]);

  // Grade bands actually present in the catalog, in a fixed pedagogical order
  // (ungraded/legacy first, then 3-5 -> 6-9 -> 9-12), not alphabetical.
  const GRADE_BAND_ORDER = [UNGRADED, '3-5', '6-9', '9-12', 'CAREER_ADULT'];
  const GRADE_BAND_LABEL: Record<string, string> = {
    [UNGRADED]: 'Bài cũ (chưa phân lớp)',
    '3-5': 'Lớp 3-5',
    '6-9': 'Lớp 6-9',
    '9-12': 'Lớp 10-12',
    CAREER_ADULT: 'Người lớn / Chuyên ngành',
  };
  // Icon + accent gradient per grade band — younger bands get warmer, more playful
  // color to match the age group; older bands read calmer/more "serious tool".
  const GRADE_BAND_ICON: Record<string, typeof BookOpen> = {
    [UNGRADED]: BookOpen,
    '3-5': Baby,
    '6-9': Gamepad2,
    '9-12': Rocket,
    CAREER_ADULT: Briefcase,
  };
  const GRADE_BAND_GRADIENT: Record<string, string> = {
    [UNGRADED]: 'from-slate-500 to-slate-600',
    '3-5': 'from-orange-400 to-pink-500',
    '6-9': 'from-indigo-600 to-cyan-500',
    '9-12': 'from-slate-700 to-slate-900',
    CAREER_ADULT: 'from-sky-600 to-indigo-700',
  };
  const availableGradeBands = useMemo(() => {
    const present = new Set(combinedExercises.map((ex) => bandOfExercise(ex)));
    const staff = isStaff(authUser?.role);
    return GRADE_BAND_ORDER.filter((band) => {
      // Khối 3-5 và Người lớn luôn có cổng vào riêng (không phụ thuộc có bài trong danh sách).
      if (band === '3-5' || band === 'CAREER_ADULT') return true;
      // Card "Bài cũ (chưa phân lớp)" chỉ để Giảng viên/Quản trị viên quản lý, học viên không thấy.
      if (band === UNGRADED) return staff && present.has(band);
      return present.has(band);
    });
  }, [combinedExercises, authUser?.role]);

  // Topics (game/chủ đề packs) available within the selected grade band.
  const availableTopics = useMemo(() => {
    if (selectedGradeBand === null) return [];
    const inBand = combinedExercises.filter((ex) => bandOfExercise(ex) === selectedGradeBand);
    const topics = new Set(inBand.map((ex) => ex.topic).filter((t): t is string => Boolean(t)));
    return Array.from(topics).sort();
  }, [combinedExercises, selectedGradeBand]);

  const filteredExercises = useMemo(() => {
    if (selectedGradeBand === null) return [];
    let list = combinedExercises.filter((ex) => bandOfExercise(ex) === selectedGradeBand);
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
    selectedGradeBand !== null && (selectedTopic !== 'all' || (availableTopics.length === 1 && !lockedBand));
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
      .then((list) => {
        setExercises(list);
        // Liên kết từ "Lớp học của tôi": /playground?slug=... mở thẳng bài được giao.
        const wanted = new URLSearchParams(window.location.search).get('slug');
        if (wanted && authUser && list.some((ex) => ex.slug === wanted)) {
          setSelectedSlug(wanted);
          setView('editor');
        }
      })
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
        // Học viên không bao giờ nhận test ẩn trong state UI.
        testCases: (tLesson.testCases || []).filter((tc) => !tc.isHidden).map((tc) => ({
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

  // Bắt đầu một phiên ghi nhận mỗi khi mở một bài tập trong trình soạn thảo.
  // Ghi tín hiệu làm bài ở mức tối thiểu (thời gian, lần rời màn hình); xem IntegrityNotice.
  const integrityTrackerRef = useIntegrityTracker(view === 'editor' && !!exercise, exercise?.slug ?? '');

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
            if (classMode) reloadAssignment(); // cập nhật điểm còn lại / trạng thái hoàn thành
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
            const count = combinedExercises.filter((ex) => bandOfExercise(ex) === band).length;
            const BandIcon = GRADE_BAND_ICON[band] ?? BookOpen;
            const isKid = band === '3-5';
            return (
              <button
                key={band}
                onClick={() => {
                  setSelectedGradeBand(band);
                  setView('exercises');
                }}
                className={
                  isKid
                    ? 'p-7 rounded-2xl border-4 border-amber-300 bg-gradient-to-br from-amber-50 to-pink-50 dark:from-amber-950/40 dark:to-pink-950/30 hover:border-pink-400 hover:shadow-lg hover:scale-[1.02] transition-all text-left cursor-pointer flex items-center gap-5 sm:col-span-2'
                    : 'p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-indigo-500 hover:shadow-md transition-all text-left cursor-pointer flex items-center gap-4'
                }
              >
                <div
                  className={`${isKid ? 'w-20 h-20' : 'w-14 h-14'} rounded-2xl bg-gradient-to-br ${GRADE_BAND_GRADIENT[band] ?? GRADE_BAND_GRADIENT[UNGRADED]} flex items-center justify-center text-white shadow-md shrink-0`}
                >
                  <BandIcon size={isKid ? 40 : 26} strokeWidth={isKid ? 2.5 : 2} />
                </div>
                <div>
                  <div className={isKid ? 'font-black text-3xl text-slate-800 dark:text-amber-50' : 'font-extrabold text-base text-[var(--text-main)]'}>
                    {GRADE_BAND_LABEL[band] ?? band}
                  </div>
                  <div className={isKid ? 'text-base font-bold text-pink-600 mt-1 flex items-center gap-1' : 'text-xs text-[var(--text-muted)] mt-0.5'}>
                    {isKid && <Star size={16} fill="currentColor" />}
                    {band === 'CAREER_ADULT' ? 'Data Lab · AI Lab · Tester Lab' : `${count} bài`}
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

  // ============ Screen 2: pick a topic (if more than one), then an exercise card ============
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
    const isKidBand = selectedGradeBand === '3-5';
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
              <h1 className={kidMode ? 'text-3xl font-black text-sky-700' : 'text-base font-extrabold text-[var(--text-main)] tracking-tight'}>
                {kidMode ? 'Góc Học Tập' : lockedBand ? `Luyện tập · ${GRADE_BAND_LABEL[selectedGradeBand ?? ''] ?? ''}` : (GRADE_BAND_LABEL[selectedGradeBand ?? ''] ?? '')}
              </h1>
              <p className={kidMode ? 'text-lg font-semibold text-slate-600' : 'text-xs text-[var(--text-muted)]'}>
                {kidMode ? 'Chọn một thử thách để bắt đầu nhé!' : lockedBand ? 'Khu luyện tập tự do, không tính điểm vào lớp học. Chọn 1 bài để bắt đầu làm.' : 'Chọn 1 bài để bắt đầu làm.'}
              </p>
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

        {isKidBand && filteredExercises.length === 0 && (
          <div className="rounded-2xl border-4 border-dashed border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-8 text-center">
            <Star size={40} className="mx-auto text-amber-500" fill="currentColor" />
            <p className="mt-3 text-xl font-black text-slate-800 dark:text-amber-50">Bài mới sắp đến rồi!</p>
            <p className="mt-1 text-base font-semibold text-slate-600 dark:text-amber-100">Trong lúc chờ, mình chơi xếp khối nhé.</p>
            <button
              onClick={() => navigate('/block-puzzle')}
              className="mt-4 cursor-pointer rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 px-6 py-3 text-lg font-black text-white shadow-md hover:scale-105 transition-transform"
            >
              Chơi xếp khối
            </button>
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
                className={`${isKidBand ? 'p-6 border-4 border-amber-300 bg-amber-50 dark:bg-amber-950/30' : 'p-4 border'} rounded-2xl text-left transition-all flex flex-col gap-2 ${
                  unlocked
                    ? isKidBand
                      ? 'hover:border-pink-400 hover:shadow-lg hover:scale-[1.02] cursor-pointer'
                      : 'border-[var(--border-color)] bg-[var(--bg-card)] hover:border-indigo-500 hover:shadow-md cursor-pointer'
                    : 'border-[var(--border-color)] bg-[var(--bg-card)] opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[var(--text-muted)]">
                    #{item.orderInTopic ?? idx + 1}
                  </span>
                  {completed ? (
                    <CheckCircle2 size={18} className="text-emerald-700 dark:text-emerald-400" strokeWidth={2} />
                  ) : unlocked ? (
                    <Unlock size={18} className="text-[var(--text-muted)]" strokeWidth={2} />
                  ) : (
                    <Lock size={18} className="text-[var(--text-muted)]" strokeWidth={2} />
                  )}
                </div>
                <div className={isKidBand ? 'font-black text-xl text-slate-800 dark:text-amber-50 leading-snug' : 'font-bold text-sm text-[var(--text-main)] leading-snug'}>{item.title}</div>
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

  // ============ Screen 3a: bài Lớp 3-5 (PUZZLE_BLOCK) — chỉ câu chuyện + ảnh + nút chơi, KHÔNG có editor/terminal ============
  if (exercise && (exercise.labType === 'PUZZLE_BLOCK' || exercise.targetGroup === 'K3_5')) {
    return (
      <KidExerciseView
        exercise={exercise}
        onBack={() => setView('exercises')}
        onOpenPuzzle={() => navigate('/block-puzzle')}
      />
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

      <IntegrityNotice />

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
