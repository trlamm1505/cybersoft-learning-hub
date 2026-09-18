import React from 'react';
import { CheckCircle2, AlertTriangle, Timer, XCircle, Ban, Construction, Loader2, type LucideIcon } from 'lucide-react';
import type { SubmitCodeResponse } from '../types/exercise';

interface TestResultsPanelProps {
  submission: SubmitCodeResponse | null;
  isSubmitting: boolean;
}

const STATUS_LABEL: Record<string, { label: string; Icon: LucideIcon; className: string; explanation: string }> = {
  AC: {
    label: 'Đạt (Accepted)',
    Icon: CheckCircle2,
    className: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300',
    explanation: 'Code chạy đúng và cho ra kết quả khớp với đáp án ở tất cả test case, kể cả test ẩn.',
  },
  WA: {
    label: 'Sai kết quả (Wrong Answer)',
    Icon: AlertTriangle,
    className: 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300',
    explanation: 'Code chạy được, không báo lỗi, nhưng output không khớp đáp án ở ít nhất 1 test case. Thường do sai logic hoặc chưa xử lý đúng 1 trường hợp đặc biệt (edge case).',
  },
  TLE: {
    label: 'Quá thời gian (Time Limit Exceeded)',
    Icon: Timer,
    className: 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300',
    explanation: 'Code chạy quá lâu so với thời gian cho phép của bài. Thường do vòng lặp vô hạn (thiếu điều kiện dừng) hoặc thuật toán chưa đủ hiệu quả với dữ liệu lớn.',
  },
  RE: {
    label: 'Lỗi khi chạy (Runtime Error)',
    Icon: XCircle,
    className: 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-700 dark:text-red-300',
    explanation: 'Code dừng đột ngột khi đang chạy vì gặp lỗi (ví dụ: chia cho 0, truy cập chỉ số ngoài phạm vi danh sách, sai kiểu dữ liệu). Xem chi tiết lỗi để biết dòng nào gây ra.',
  },
  CE: {
    label: 'Lỗi cú pháp (Compile Error)',
    Icon: Ban,
    className: 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-700 dark:text-red-300',
    explanation: 'Code chưa đúng cú pháp Python nên chưa thể chạy được (ví dụ: thiếu dấu hai chấm, sai lề thụt dòng, thiếu dấu đóng ngoặc). Sửa lỗi cú pháp trước khi chạy lại.',
  },
  FAILED: {
    label: 'Lỗi hệ thống khi chấm bài',
    Icon: Construction,
    className: 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-700 dark:text-red-300',
    explanation: 'Hệ thống chấm bài gặp sự cố, không liên quan tới code của bạn. Hãy thử nộp lại; nếu vẫn lỗi, báo cho giáo viên.',
  },
  QUEUED: {
    label: 'Đang chờ trong hàng đợi',
    Icon: Loader2,
    className: 'bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300',
    explanation: 'Bài nộp đang chờ tới lượt chấm.',
  },
  RUNNING: {
    label: 'Đang chấm bài',
    Icon: Loader2,
    className: 'bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300',
    explanation: 'Hệ thống đang chạy code qua từng test case.',
  },
};

export const TestResultsPanel: React.FC<TestResultsPanelProps> = ({ submission, isSubmitting }) => {
  if (isSubmitting) {
    return (
      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] p-4 text-sm text-[var(--text-muted)] flex items-center gap-2">
        <Loader2 size={16} className="animate-spin" /> Đang chấm bài trên các test mẫu...
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--border-color)] bg-[var(--bg-main)] p-4 text-sm text-[var(--text-muted)]">
        Nhấn "Submit" để chấm code với các test mẫu của bài tập.
      </div>
    );
  }

  const status = STATUS_LABEL[submission.status] ?? STATUS_LABEL.QUEUED;

  return (
    <div className="space-y-3">
      <div className={`rounded-xl border p-3 flex items-start gap-2.5 text-sm font-semibold ${status.className}`}>
        <status.Icon size={20} strokeWidth={2} className="shrink-0 mt-0.5" />
        <div>
          <div className="flex items-center gap-2">
            <span>{status.label}</span>
            <span className="text-xs font-normal opacity-80">
              ({submission.passedCount}/{submission.totalCount} test)
            </span>
          </div>
          <div className="text-xs font-normal opacity-80 mt-0.5">{status.explanation}</div>
        </div>
      </div>

      {submission.errorMessage && (
        <pre className="rounded-lg bg-red-950/90 text-red-200 text-xs p-3 overflow-x-auto whitespace-pre-wrap break-words">
          {submission.errorMessage}
        </pre>
      )}

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
              <span className="flex items-center gap-1.5">
                {r.passed ? (
                  <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <XCircle size={14} className="text-red-600 dark:text-red-400" />
                )}
                Test {r.index + 1} {r.isHidden ? '(ẩn)' : ''}
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
