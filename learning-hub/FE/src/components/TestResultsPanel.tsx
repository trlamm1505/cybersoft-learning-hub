import React from 'react';
import type { SubmitCodeResponse } from '../types/exercise';

interface TestResultsPanelProps {
  submission: SubmitCodeResponse | null;
  isSubmitting: boolean;
}

const STATUS_LABEL: Record<string, { label: string; icon: string; className: string }> = {
  PASSED: {
    label: 'Đạt tất cả test',
    icon: '🎉',
    className: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300',
  },
  WRONG_ANSWER: {
    label: 'Kết quả sai (Wrong Answer)',
    icon: '⚠️',
    className: 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300',
  },
  TIME_LIMIT_EXCEEDED: {
    label: 'Quá thời gian (Time Limit Exceeded)',
    icon: '⏱️',
    className: 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300',
  },
  RUNTIME_ERROR: {
    label: 'Lỗi khi chạy (Runtime Error)',
    icon: '❌',
    className: 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-700 dark:text-red-300',
  },
  PENDING: {
    label: 'Đang chờ',
    icon: '⏳',
    className: 'bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300',
  },
};

export const TestResultsPanel: React.FC<TestResultsPanelProps> = ({ submission, isSubmitting }) => {
  if (isSubmitting) {
    return (
      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] p-4 text-sm text-[var(--text-muted)] flex items-center gap-2">
        <span className="animate-spin">⏳</span> Đang chấm bài trên các test mẫu...
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--border-color)] bg-[var(--bg-main)] p-4 text-sm text-[var(--text-muted)]">
        Nhấn "✔ Submit" để chấm code với các test mẫu của bài tập.
      </div>
    );
  }

  const status = STATUS_LABEL[submission.status] ?? STATUS_LABEL.PENDING;

  return (
    <div className="space-y-3">
      <div className={`rounded-xl border p-3 flex items-center gap-2 text-sm font-semibold ${status.className}`}>
        <span className="text-lg leading-none">{status.icon}</span>
        <span>{status.label}</span>
        <span className="ml-auto text-xs font-normal opacity-80">
          {submission.passedCount}/{submission.totalCount} test passed
        </span>
      </div>

      <div className="space-y-2">
        {submission.results.map((r) => (
          <div
            key={r.index}
            className={`rounded-lg border p-3 text-xs ${
              r.passed
                ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20'
                : 'border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20'
            }`}
          >
            <div className="flex items-center justify-between font-semibold mb-1">
              <span>
                {r.passed ? '✅' : '❌'} Test {r.index + 1} {r.isHidden ? '(ẩn)' : ''}
              </span>
              {typeof r.executionTimeMs === 'number' && (
                <span className="font-normal text-[var(--text-muted)]">{r.executionTimeMs}ms</span>
              )}
            </div>
            {!r.isHidden && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1 font-mono">
                <div>
                  <div className="text-[var(--text-muted)] font-sans mb-0.5">Input</div>
                  <pre className="whitespace-pre-wrap break-words">{r.input}</pre>
                </div>
                <div>
                  <div className="text-[var(--text-muted)] font-sans mb-0.5">Expected</div>
                  <pre className="whitespace-pre-wrap break-words">{r.expectedOutput}</pre>
                </div>
                <div>
                  <div className="text-[var(--text-muted)] font-sans mb-0.5">Actual</div>
                  <pre className="whitespace-pre-wrap break-words">{r.actualOutput}</pre>
                </div>
              </div>
            )}
            {r.stderr && (
              <pre className="mt-1 text-red-600 dark:text-red-400 whitespace-pre-wrap break-words">{r.stderr}</pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
