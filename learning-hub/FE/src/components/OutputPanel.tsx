import React from 'react';
import type { RunCodeResponse } from '../types/exercise';

interface OutputPanelProps {
  result: RunCodeResponse | null;
  isRunning: boolean;
}

function classifyResult(result: RunCodeResponse): {
  label: string;
  tone: 'success' | 'error' | 'warning';
  icon: string;
  hint: string;
} {
  if (result.blocked) {
    return {
      label: 'Bị chặn vì lý do bảo mật',
      tone: 'error',
      icon: '🚫',
      hint: 'Code của bạn dùng module/hàm không được phép (ví dụ: os, sys, subprocess, open...). Hãy chỉ dùng input()/print() và các thư viện tính toán thông thường.',
    };
  }
  if (result.timedOut) {
    return {
      label: 'Quá thời gian cho phép (Timeout)',
      tone: 'warning',
      icon: '⏱️',
      hint: 'Chương trình chạy quá lâu — có thể do vòng lặp vô hạn. Hãy kiểm tra lại điều kiện dừng vòng lặp.',
    };
  }
  if (result.exitCode !== 0) {
    return {
      label: 'Lỗi khi chạy chương trình (Runtime Error)',
      tone: 'error',
      icon: '❌',
      hint: 'Xem chi tiết lỗi ở phần Stderr bên dưới để biết dòng nào gây lỗi.',
    };
  }
  return {
    label: 'Chạy thành công',
    tone: 'success',
    icon: '✅',
    hint: 'Chương trình đã chạy xong không có lỗi.',
  };
}

const toneClasses: Record<string, string> = {
  success: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300',
  error: 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-700 dark:text-red-300',
  warning: 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300',
};

export const OutputPanel: React.FC<OutputPanelProps> = ({ result, isRunning }) => {
  if (isRunning) {
    return (
      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] p-4 text-sm text-[var(--text-muted)] flex items-center gap-2">
        <span className="animate-spin">⏳</span> Đang chạy code...
      </div>
    );
  }

  if (!result) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--border-color)] bg-[var(--bg-main)] p-4 text-sm text-[var(--text-muted)]">
        Nhấn "▶ Run" để chạy thử code của bạn.
      </div>
    );
  }

  const status = classifyResult(result);

  return (
    <div className="space-y-3">
      <div className={`rounded-xl border p-3 flex items-start gap-2 text-sm font-medium ${toneClasses[status.tone]}`}>
        <span className="text-lg leading-none">{status.icon}</span>
        <div>
          <div>{status.label}</div>
          <div className="text-xs font-normal opacity-80 mt-0.5">{status.hint}</div>
        </div>
        <span className="ml-auto text-xs font-normal opacity-70 whitespace-nowrap">
          {result.executionTimeMs}ms
        </span>
      </div>

      <div>
        <div className="text-xs font-semibold text-[var(--text-muted)] mb-1 uppercase tracking-wide">Stdout</div>
        <pre className="rounded-lg bg-slate-900 text-slate-100 text-sm p-3 overflow-x-auto min-h-[48px] whitespace-pre-wrap break-words">
          {result.stdout || <span className="text-slate-500 italic">(không có output)</span>}
        </pre>
      </div>

      {(result.stderr || result.blocked) && (
        <div>
          <div className="text-xs font-semibold text-[var(--text-muted)] mb-1 uppercase tracking-wide">Stderr</div>
          <pre className="rounded-lg bg-red-950/90 text-red-200 text-sm p-3 overflow-x-auto whitespace-pre-wrap break-words">
            {result.stderr}
          </pre>
        </div>
      )}
    </div>
  );
};
