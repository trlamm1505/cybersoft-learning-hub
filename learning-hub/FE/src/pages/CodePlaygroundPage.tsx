import React, { useEffect, useState } from 'react';
import { CodeEditor } from '../components/CodeEditor';
import { OutputPanel } from '../components/OutputPanel';
import { TestResultsPanel } from '../components/TestResultsPanel';
import exerciseApi from '../axios/exerciseApi';
import type { ExerciseDetail, ExerciseListItem, RunCodeResponse, SubmitCodeResponse } from '../types/exercise';

interface CodePlaygroundPageProps {
  isDark: boolean;
}

const DIFFICULTY_BADGE: Record<string, string> = {
  EASY: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  MEDIUM: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  HARD: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
};

export const CodePlaygroundPage: React.FC<CodePlaygroundPageProps> = ({ isDark }) => {
  const [exercises, setExercises] = useState<ExerciseListItem[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [exercise, setExercise] = useState<ExerciseDetail | null>(null);
  const [code, setCode] = useState('');
  const [stdin, setStdin] = useState('');

  const [runResult, setRunResult] = useState<RunCodeResponse | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const [submission, setSubmission] = useState<SubmitCodeResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeResultTab, setActiveResultTab] = useState<'run' | 'submit'>('run');

  useEffect(() => {
    exerciseApi
      .listExercises()
      .then((list) => {
        setExercises(list);
        if (list.length > 0) setSelectedSlug(list[0].slug);
      })
      .catch(() => setLoadError('Không thể tải danh sách bài tập. Kiểm tra Backend đã chạy chưa?'));
  }, []);

  useEffect(() => {
    if (!selectedSlug) return;
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
        stderr: 'Không thể kết nối tới máy chủ chạy code. Vui lòng thử lại.',
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
    setIsSubmitting(true);
    setActiveResultTab('submit');
    try {
      const result = await exerciseApi.submitCode(selectedSlug, code);
      setSubmission(result);
    } catch {
      // Network / server error UX — keep it friendly, not a raw stack trace.
      setSubmission(null);
      setLoadError('Không thể nộp bài lúc này. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--text-main)]">🧑‍💻 Code Playground</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            Viết code Python, chạy thử và chấm điểm với bộ test mẫu.
          </p>
        </div>
        <select
          className="px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] text-sm text-[var(--text-main)]"
          value={selectedSlug ?? ''}
          onChange={(e) => setSelectedSlug(e.target.value)}
        >
          {exercises.map((ex) => (
            <option key={ex.slug} value={ex.slug}>
              {ex.title}
            </option>
          ))}
        </select>
      </div>

      {loadError && (
        <div className="rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 p-3 text-sm">
          ⚠️ {loadError}
        </div>
      )}

      {exercise && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Left: exercise description + editor */}
          <div className="space-y-3">
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="font-bold text-[var(--text-main)]">{exercise.title}</h2>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${DIFFICULTY_BADGE[exercise.difficulty]}`}>
                  {exercise.difficulty}
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">
                  ⏱ {exercise.timeLimitMs}ms · 🏆 {exercise.points}đ
                </span>
              </div>
              <p className="text-sm text-[var(--text-muted)] whitespace-pre-wrap">{exercise.description}</p>
            </div>

            <CodeEditor value={code} onChange={setCode} isDark={isDark} />

            <div className="flex items-center gap-2">
              <button
                onClick={handleRun}
                disabled={isRunning}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-xs disabled:opacity-50"
              >
                ▶ Run
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-xs disabled:opacity-50"
              >
                ✔ Submit
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                Stdin (dữ liệu đầu vào cho Run)
              </label>
              <textarea
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] p-2 text-sm font-mono text-[var(--text-main)]"
                placeholder="Nhập dữ liệu test thủ công..."
              />
            </div>
          </div>

          {/* Right: output / test results */}
          <div className="space-y-3">
            <div className="flex gap-1 border-b border-[var(--border-color)]">
              <button
                className={`px-3 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                  activeResultTab === 'run'
                    ? 'border-indigo-600 text-indigo-600 dark:text-cyan-400'
                    : 'border-transparent text-[var(--text-muted)]'
                }`}
                onClick={() => setActiveResultTab('run')}
              >
                Output
              </button>
              <button
                className={`px-3 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                  activeResultTab === 'submit'
                    ? 'border-indigo-600 text-indigo-600 dark:text-cyan-400'
                    : 'border-transparent text-[var(--text-muted)]'
                }`}
                onClick={() => setActiveResultTab('submit')}
              >
                Kết quả Test mẫu
              </button>
            </div>

            {activeResultTab === 'run' ? (
              <OutputPanel result={runResult} isRunning={isRunning} />
            ) : (
              <TestResultsPanel submission={submission} isSubmitting={isSubmitting} />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
