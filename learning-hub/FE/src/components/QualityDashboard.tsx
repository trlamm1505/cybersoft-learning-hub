import React, { useState, useEffect } from 'react';
import { CheckCircle2, ShieldCheck, FileText, Lock, RefreshCw, Play, Bot, AlertTriangle, Check, Loader2 } from 'lucide-react';
import { qaApi } from '../axios/qaApi';
import type { QualityGateBypassItem } from '../axios/qaApi';
import { useToast } from './Toast';

export const QualityDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [runningSmoke, setRunningSmoke] = useState(false);
  const [runningAi, setRunningAi] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Quality Gate Guard Testing State
  const [testBypassId, setTestBypassId] = useState<string>('non-critical-perf-check');
  const [bypassReasonInput, setBypassReasonInput] = useState<string>('');
  
  const { showToast } = useToast();

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await qaApi.getQualityDashboard();
      setData(res);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể nạp Quality Dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // Action Handlers
  const handleRunSmokeTests = async () => {
    setRunningSmoke(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await qaApi.runSmokeTests();
      setData(res);
      const msg = 'Đã thực thi thành công E2E Smoke Tests & Content Checks suite!';
      setSuccessMsg(msg);
      showToast(msg);
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || 'Lỗi khi chạy E2E Smoke Tests';
      setError(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setRunningSmoke(false);
    }
  };

  const handleRunAiRegression = async () => {
    setRunningAi(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await qaApi.runAiRegression();
      setData(res);
      const msg = 'Đã thực thi thành công AI Coach Regression Evaluation suite!';
      setSuccessMsg(msg);
      showToast(msg);
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || 'Lỗi khi chạy AI Coach Regression Evaluation';
      setError(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setRunningAi(false);
    }
  };

  const handleEvaluateGateTest = async (withReason: boolean) => {
    setEvaluating(true);
    setError(null);
    setSuccessMsg(null);

    const actualReason = withReason
      ? (bypassReasonInput.trim() || 'Cần phát hành phiên bản hotfix demo')
      : '';

    // Cập nhật ô input trên giao diện để khớp chính xác với lý do được gửi đi
    setBypassReasonInput(actualReason);

    const bypasses: QualityGateBypassItem[] = [
      {
        testId: testBypassId.trim() || 'non-critical-perf-check',
        bypass: true,
        bypassReason: actualReason,
      },
    ];

    try {
      const res = await qaApi.evaluateGate(bypasses);
      setData(res);
      const msg = actualReason
        ? `✅ Quality Gate DUYỆT thành công (Bypass hợp lệ với lý do "${actualReason}")!`
        : '✅ Quality Gate DUYỆT!';
      setSuccessMsg(msg);
      showToast(msg);
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || 'Lỗi đánh giá Quality Gate';
      setError(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setEvaluating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs font-semibold text-[var(--text-muted)] flex items-center justify-center gap-2">
        <RefreshCw size={16} className="animate-spin text-indigo-600" /> Đang nạp Báo cáo Quality Gate (Day 27)...
      </div>
    );
  }

  const summary = data?.summary;
  const isReady = summary?.qualityGateStatus === 'READY_TO_RELEASE';

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-sm space-y-6">
      {/* Header Title & Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 flex items-center gap-1">
              <ShieldCheck size={13} /> QA / Eval Harness Integration (Day 27)
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase inline-flex items-center gap-1 ${
                isReady
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
              }`}
            >
              {isReady ? 'READY TO RELEASE' : 'BLOCKED'}
            </span>
          </div>
          <h2 className="text-xl font-black text-[var(--text-main)] tracking-tight">
            Quality Dashboard & Release Checklist
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Kiểm thử tự động E2E, AI Coach Regression và Guard đè lỗi không ghi rõ lý do.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRunSmokeTests}
            disabled={runningSmoke}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer shadow-xs flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Kích hoạt suite kiểm thử tự động E2E Smoke & Content Checks"
          >
            {runningSmoke ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            {runningSmoke ? 'Đang chạy Smoke...' : 'Chạy E2E Smoke Tests'}
          </button>

          <button
            onClick={handleRunAiRegression}
            disabled={runningAi}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition-all cursor-pointer shadow-xs flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Đánh giá quy chuẩn AI Coach Regression (Accuracy, Safety, Fallback)"
          >
            {runningAi ? <Loader2 size={14} className="animate-spin" /> : <Bot size={14} />}
            {runningAi ? 'Đang chạy Regression...' : 'Chạy AI Coach Regression'}
          </button>

          <button
            onClick={fetchDashboard}
            className="px-3 py-2 text-xs font-bold rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCw size={14} /> Tải lại
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-semibold text-red-700 dark:text-red-300 flex items-start gap-2">
          <AlertTriangle size={16} className="shrink-0 mt-0.5 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
          <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-center">
          <span className="text-xs font-bold text-[var(--text-muted)] block uppercase">Tổng Bài Test</span>
          <span className="text-2xl font-black text-[var(--text-main)] mt-1 block">{summary?.total || 0}</span>
        </div>
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
          <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block uppercase">Đã Vượt Qua</span>
          <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1 block">{summary?.passed || 0}</span>
        </div>
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-center">
          <span className="text-xs font-bold text-red-800 dark:text-red-300 block uppercase">Thất Bại</span>
          <span className="text-2xl font-black text-red-700 dark:text-red-400 mt-1 block">{summary?.failed || 0}</span>
        </div>
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center">
          <span className="text-xs font-bold text-amber-800 dark:text-amber-300 block uppercase">Bypassed (Có Lý Do)</span>
          <span className="text-2xl font-black text-amber-700 dark:text-amber-400 mt-1 block">{summary?.bypassed || 0}</span>
        </div>
      </div>

      {/* Interactive Quality Gate Bypass Tester Box */}
      <div className="p-5 rounded-2xl bg-indigo-50/70 dark:bg-slate-900/80 border border-indigo-200 dark:border-slate-800 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-indigo-200/80 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-indigo-600 dark:text-cyan-400" />
            <h3 className="text-sm font-black text-indigo-950 dark:text-white">
              Thử Nghiệm Trực Tiếp: Quality Gate Bypass Guard
            </h3>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-indigo-100 dark:bg-cyan-950 text-indigo-800 dark:text-cyan-300 border border-indigo-300 dark:border-cyan-800">
            Acceptance Criteria Day 27
          </span>
        </div>

        <p className="text-xs text-indigo-950/80 dark:text-slate-300 font-medium">
          Quy tắc nghiệm thu Day 27: <strong className="text-indigo-900 dark:text-white font-bold">Không cho bypass lỗi nếu không ghi rõ lý do (bypassReason)</strong>. Thử nhấn 2 nút phía dưới để kiểm tra tính năng bảo vệ này:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-bold text-indigo-900 dark:text-slate-400 block mb-1">Target Test ID:</label>
            <input
              type="text"
              value={testBypassId}
              onChange={(e) => setTestBypassId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-indigo-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-indigo-900 dark:text-slate-400 block mb-1">Lý do Bypass (Bypass Reason):</label>
            <input
              type="text"
              value={bypassReasonInput}
              onChange={(e) => setBypassReasonInput(e.target.value)}
              placeholder="VD: Cần phát hành phiên bản hotfix demo..."
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-indigo-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={() => handleEvaluateGateTest(false)}
            disabled={evaluating}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-amber-100 hover:bg-amber-200 dark:bg-amber-600/20 dark:hover:bg-amber-600 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            {evaluating ? <Loader2 size={13} className="animate-spin" /> : <AlertTriangle size={13} />}
            Thử Bypass KHÔNG Điền Lý Do (Bị Chặn 400 Error)
          </button>

          <button
            onClick={() => handleEvaluateGateTest(true)}
            disabled={evaluating}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
          >
            {evaluating ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
            Thử Bypass KÈM Lý Do Hợp Lệ (Được Duyệt)
          </button>
        </div>
      </div>

      {/* Test Results Table */}
      <div>
        <h3 className="text-sm font-bold text-[var(--text-main)] mb-3 flex items-center gap-2">
          <FileText size={15} /> Kết Quả Kiểm Thử E2E Smoke & Content Checks
        </h3>
        <div className="border border-[var(--border-color)] rounded-xl overflow-hidden divide-y divide-[var(--border-color)]">
          {(data?.testResults || []).map((item: any) => (
            <div key={item.testId} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-[var(--bg-main)]">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[var(--text-main)]">{item.name}</span>
                  {item.isCritical && (
                    <span className="px-1.5 py-0.5 text-[10px] font-black rounded bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/30">
                      CRITICAL
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-mono text-[var(--text-muted)]">
                  {item.testId} • {item.details || 'Check OK'}
                  {item.bypassReason && (
                    <span className="block text-amber-600 dark:text-amber-400 font-sans mt-0.5 font-medium">
                      Lý do bypass: {item.bypassReason}
                    </span>
                  )}
                </p>
              </div>

              <span className={`px-2.5 py-1 rounded-lg font-bold text-[11px] shrink-0 ${
                item.status === 'PASSED'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : item.status === 'BYPASSED'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
              }`}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Release Checklist */}
      <div>
        <h3 className="text-sm font-bold text-[var(--text-main)] mb-3 flex items-center gap-2">
          <Lock size={15} /> Release Checklist & Quality Gate Rules
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          {(data?.releaseChecklist || []).map((chk: any, idx: number) => (
            <div key={idx} className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              <span className="font-medium text-[var(--text-main)]">{chk.item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QualityDashboard;
