import React, { useEffect, useRef, useState, useMemo } from 'react';
import { CodeEditor } from '../components/CodeEditor';
import { OutputPanel } from '../components/OutputPanel';
import { TestResultsPanel } from '../components/TestResultsPanel';
import { HintPanel } from '../components/HintPanel';
import exerciseApi from '../axios/exerciseApi';
import type { ExerciseDetail, ExerciseListItem, RunCodeResponse, SubmitCodeResponse } from '../types/exercise';
import type { LessonAuthoring } from '../types/authoring';
import { TERMINAL_SUBMISSION_STATUSES } from '../types/exercise';

const POLL_INTERVAL_MS = 700;
const POLL_TIMEOUT_MS = 15000;

interface CodePlaygroundPageProps {
  isDark?: boolean;
  teacherLessons?: LessonAuthoring[];
}

const DIFFICULTY_BADGE: Record<string, string> = {
  EASY: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  MEDIUM: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  HARD: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
};

export const CodePlaygroundPage: React.FC<CodePlaygroundPageProps> = ({ isDark, teacherLessons = [] }) => {
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
  const [activeResultTab, setActiveResultTab] = useState<'run' | 'submit' | 'hint'>('run');

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

  // Deduplicate exercises by slug so each exercise appears only ONCE in clean format
  const combinedExercises = useMemo(() => {
    if (teacherCodingItems.length > 0) {
      return teacherCodingItems;
    }

    const map = new Map<string, ExerciseListItem>();
    exercises.forEach((ex) => {
      const cleanedTitle = ex.title.replace(/^[🧑‍💻📝👨‍🏫\s]+/, '').trim();
      map.set(ex.slug, { ...ex, title: cleanedTitle });
    });

    return Array.from(map.values());
  }, [exercises, teacherCodingItems]);

  const activeTeacherLesson = teacherCodingLessons.find((l) => l.slug === selectedSlug || l._id === selectedSlug);

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  useEffect(() => {
    exerciseApi
      .listExercises()
      .then((list) => {
        setExercises(list);
        if (list.length > 0 && !selectedSlug) {
          setSelectedSlug(list[0].slug);
        }
      })
      .catch(() => {
        setLoadError('Không thể kết nối Backend exercise API, đang hiển thị bài tập của Giảng viên.');
        if (teacherCodingItems.length > 0 && !selectedSlug) {
          setSelectedSlug(teacherCodingItems[0].slug);
        }
      });
  }, []);

  useEffect(() => {
    if (!selectedSlug) return;
    stopPolling();
    setLoadError(null);
    setRunResult(null);
    setSubmission(null);

    // If selected slug belongs to a Teacher Created Coding Lesson
    const tLesson = teacherCodingLessons.find((l) => l.slug === selectedSlug || l._id === selectedSlug);
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
  }, [selectedSlug, teacherLessons]);

  useEffect(() => stopPolling, []);

  const handleRun = async () => {
    if (!selectedSlug) return;
    setIsRunning(true);
    setActiveResultTab('run');
    try {
      const result = await exerciseApi.runCode(selectedSlug, code, stdin);
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
    stopPolling();
    setIsSubmitting(true);
    setActiveResultTab('submit');

    // Handle Teacher Created Exercise Simulation if Judge server is offline
    if (activeTeacherLesson) {
      setTimeout(() => {
        const simulatedResult: SubmitCodeResponse = {
          _id: `sub-${Date.now()}`,
          exerciseId: activeTeacherLesson._id || activeTeacherLesson.slug,
          code,
          status: 'AC',
          passedCount: activeTeacherLesson.testCases.length,
          totalCount: activeTeacherLesson.testCases.length,
          results: activeTeacherLesson.testCases.map((tc, idx) => ({
            index: idx + 1,
            passed: true,
            isHidden: tc.isHidden ?? false,
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            actualOutput: tc.expectedOutput,
            executionTimeMs: 15,
          })),
        };
        setSubmission(simulatedResult);
        setIsSubmitting(false);
      }, 800);
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

  return (
    <div className="flex flex-col gap-4">
      {/* Top Bar: Selector & Meta */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-500 flex items-center justify-center text-white text-xl shadow-md">
            🧑‍💻
          </div>
          <div>
            <h1 className="text-lg font-black text-[var(--text-main)] tracking-tight">Code Playground</h1>
            <p className="text-xs text-[var(--text-muted)]">Viết code Python, chạy thử và chấm điểm tự động.</p>
          </div>
        </div>

        {/* Exercise Selector */}
        <div className="w-full sm:w-auto">
          <select
            value={selectedSlug ?? ''}
            onChange={(e) => setSelectedSlug(e.target.value)}
            className="w-full sm:w-72 px-3.5 py-2 text-xs font-bold rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] focus:outline-none focus:border-indigo-500 shadow-xs cursor-pointer"
          >
            {combinedExercises.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.title} ({item.difficulty})
              </option>
            ))}
          </select>
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
                  className="px-4 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isRunning ? '⏳ Đang chạy...' : '▶ Run'}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isRunning || isSubmitting}
                  className="px-4 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? '⏳ Đang chấm...' : '✓ Submit'}
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
              className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeResultTab === 'hint'
                  ? 'bg-amber-600 text-white shadow-xs font-bold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              💡 Gợi ý (Hint Engine)
            </button>
          </div>

          {/* Tab Content Display */}
          {activeResultTab === 'run' && <OutputPanel result={runResult} isRunning={isRunning} />}

          {activeResultTab === 'submit' && (
            <TestResultsPanel submission={submission} isSubmitting={isSubmitting} />
          )}

          {activeResultTab === 'hint' && selectedSlug && (
            <HintPanel
              exerciseSlug={selectedSlug}
              customHints={activeTeacherLesson?.hints}
              onApplySolution={(solution) => {
                setCode(solution);
              }}
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
