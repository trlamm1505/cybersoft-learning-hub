import React, { useState, useEffect } from 'react';
import { Users, Sparkles, CheckCircle2, Clock, AlertCircle, ThumbsUp, Eye, Lock, RefreshCw, Send, ShieldCheck, Heart } from 'lucide-react';
import { usabilityApi } from '../axios/usabilityApi';
import type { AgeGroup, SubmitUsabilitySessionPayload } from '../axios/usabilityApi';
import { useToast } from './Toast';

export const UsabilityDashboard: React.FC = () => {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Age-Adaptive High Contrast & Big Text Toggle State
  const [isBigTextMode, setIsBigTextMode] = useState<boolean>(false);

  // Session Submit State
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('KIDS_8_12');
  const [scenarioId, setScenarioId] = useState<string>('scen-kids-coding-interactive');
  const [completionTime, setCompletionTime] = useState<number>(65);
  const [errorCount, setErrorCount] = useState<number>(0);
  const [confusionCount, setConfusionCount] = useState<number>(0);
  const [rating, setRating] = useState<number>(5);
  const [feedbackText, setFeedbackText] = useState<string>('Em rất thích giao diện màu vàng chữ to này!');
  const [parentalConsent, setParentalConsent] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const { showToast } = useToast();

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await usabilityApi.getReport();
      setReportData(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không tải được báo cáo Usability Testing');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleSubmitSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    const payload: SubmitUsabilitySessionPayload = {
      ageGroup,
      scenarioId: scenarioId.trim() || 'scen-usability-test',
      completionTimeSeconds: Number(completionTime),
      errorCount: Number(errorCount),
      confusionMarkersCount: Number(confusionCount),
      satisfactionRating: Number(rating),
      feedbackText,
      parentalConsentVerified: parentalConsent,
    };

    try {
      const res = await usabilityApi.submitSession(payload);
      const msg = res?.message || res?.data?.message || 'Đã lưu thành công phiên kiểm thử!';
      setSuccessMsg(msg);
      showToast(msg);
      fetchReport();
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || 'Lỗi khi lưu kết quả kiểm thử Usability';
      setError(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs font-semibold text-[var(--text-muted)] flex items-center justify-center gap-2">
        <RefreshCw size={16} className="animate-spin text-indigo-600" /> Đang tải Usability Test Report theo nhóm tuổi (Day 28)...
      </div>
    );
  }

  const metrics = reportData?.metricsByAgeGroup;
  const fixes = reportData?.top5PrioritizedFixes || [];

  return (
    <div className={`space-y-6 transition-all duration-300 ${isBigTextMode ? 'kids-mode-active' : ''}`}>
      {/* Kids Mode Active Banner Indicator */}
      {isBigTextMode && (
        <div className="p-4 rounded-2xl bg-amber-400 text-amber-950 border-2 border-amber-500 font-extrabold text-sm md:text-base flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2">
            <Sparkles size={22} className="text-amber-900 shrink-0" />
            <span>✨ ĐANG BẬT CHẾ ĐỘ TRẺ EM (KIDS MODE - CHỮ TO 18PX + TƯƠNG PHẢN CAO RỰC RỠ) ✨</span>
          </div>
          <span className="text-xs px-3 py-1 bg-amber-950 text-amber-100 rounded-lg uppercase tracking-wider shrink-0 font-bold">
            Rank #1 Fix Active
          </span>
        </div>
      )}

      {/* Header Banner */}
      <div
        className={`bg-[var(--bg-card)] rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
          isBigTextMode
            ? 'border-2 border-amber-400 dark:border-amber-600 shadow-md bg-amber-50/20'
            : 'border border-[var(--border-color)]'
        }`}
      >
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span
              className={`px-3 py-1 rounded-full font-extrabold bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300 flex items-center gap-1.5 ${
                isBigTextMode ? 'text-sm' : 'text-xs'
              }`}
            >
              <Users size={isBigTextMode ? 16 : 13} /> Usability Testing theo Nhóm Tuổi (Day 28)
            </span>
            <span
              className={`px-3 py-1 rounded-full font-extrabold bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1.5 ${
                isBigTextMode ? 'text-sm' : 'text-xs'
              }`}
            >
              <ShieldCheck size={isBigTextMode ? 16 : 13} /> COPPA & Child Safety Guard ACTIVE
            </span>
          </div>
          <h1
            className={`font-black text-[var(--text-main)] tracking-tight ${
              isBigTextMode ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl'
            }`}
          >
            Giao Diện Thích Ứng Tuổi & Báo Cáo Usability
          </h1>
          <p className={`text-[var(--text-muted)] mt-1 ${isBigTextMode ? 'text-sm font-semibold' : 'text-xs'}`}>
            Đánh giá trải nghiệm người dùng tách biệt theo 3 nhóm tuổi: Trẻ em (8-12), Thiếu niên (13-17) và Người lớn (18+).
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setIsBigTextMode(!isBigTextMode)}
            className={`px-4 py-2.5 font-extrabold rounded-xl border transition-all cursor-pointer flex items-center gap-2 shadow-md ${
              isBigTextMode
                ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 text-sm ring-4 ring-amber-300 dark:ring-amber-900'
                : 'bg-[var(--bg-main)] text-[var(--text-main)] border-[var(--border-color)] hover:bg-slate-100 dark:hover:bg-slate-800 text-xs'
            }`}
            title="Bật/Tắt chế độ Chữ To & Tương Phản Cao thích ứng cho Trẻ Em"
          >
            <Eye size={isBigTextMode ? 18 : 14} />
            {isBigTextMode ? '❌ Tắt Chế Độ Chữ To' : '✨ Thử Chế Độ Chữ To (Kids Mode)'}
          </button>
          <button
            onClick={fetchReport}
            className={`px-3.5 py-2.5 font-bold rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-1.5 ${
              isBigTextMode ? 'text-sm' : 'text-xs'
            }`}
          >
            <RefreshCw size={isBigTextMode ? 16 : 14} /> Tải lại
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div
          className={`p-4 rounded-xl bg-red-500/10 border border-red-500/30 font-semibold text-red-700 dark:text-red-300 flex items-start gap-2 ${
            isBigTextMode ? 'text-sm' : 'text-xs'
          }`}
        >
          <AlertCircle size={isBigTextMode ? 20 : 16} className="shrink-0 mt-0.5 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div
          className={`p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 font-semibold text-emerald-800 dark:text-emerald-300 flex items-start gap-2 ${
            isBigTextMode ? 'text-sm' : 'text-xs'
          }`}
        >
          <CheckCircle2 size={isBigTextMode ? 20 : 16} className="shrink-0 mt-0.5 text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Section 1: Age Group Breakdown Metrics */}
      <div>
        <h2
          className={`font-black text-[var(--text-main)] mb-3 flex items-center gap-2 ${
            isBigTextMode ? 'text-lg md:text-xl' : 'text-sm'
          }`}
        >
          <Users size={isBigTextMode ? 20 : 16} className="text-indigo-600 dark:text-indigo-400" />
          Chỉ Số Thống Kê Usability Phân Loại Theo 3 Nhóm Tuổi
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {metrics &&
            Object.keys(metrics).map((key) => {
              const m = metrics[key];
              const isKids = key === 'KIDS_8_12';
              const isTeens = key === 'TEENS_13_17';

              return (
                <div
                  key={key}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                    isBigTextMode
                      ? 'border-2 p-6 shadow-md'
                      : ''
                  } ${
                    isKids
                      ? 'bg-amber-500/10 border-amber-500/40 hover:border-amber-500/80'
                      : isTeens
                      ? 'bg-purple-500/10 border-purple-500/40 hover:border-purple-500/80'
                      : 'bg-indigo-500/10 border-indigo-500/40 hover:border-indigo-500/80'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span
                        className={`px-3 py-1 rounded-lg font-black uppercase ${
                          isBigTextMode ? 'text-sm' : 'text-xs'
                        } ${
                          isKids
                            ? 'bg-amber-300 text-amber-950 border border-amber-500'
                            : isTeens
                            ? 'bg-purple-200 text-purple-950 border border-purple-400'
                            : 'bg-indigo-200 text-indigo-950 border border-indigo-400'
                        }`}
                      >
                        {m.label}
                      </span>
                      <span className={`font-bold text-[var(--text-muted)] ${isBigTextMode ? 'text-xs' : 'text-[11px]'}`}>
                        Mẫu: {m.sampleSize} phiên
                      </span>
                    </div>

                    <p className={`text-[var(--text-muted)] font-medium mb-3 ${isBigTextMode ? 'text-sm font-semibold' : 'text-xs line-clamp-2'}`}>
                      {m.targetUserPersona}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                        <span className={`text-[var(--text-muted)] uppercase block font-extrabold ${isBigTextMode ? 'text-xs' : 'text-[10px]'}`}>Thời gian TB</span>
                        <span className={`font-black text-[var(--text-main)] flex items-center justify-center gap-1 mt-0.5 ${isBigTextMode ? 'text-xl' : 'text-base'}`}>
                          <Clock size={isBigTextMode ? 18 : 13} className="text-indigo-500" /> {m.avgCompletionTimeSeconds}s
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                        <span className={`text-[var(--text-muted)] uppercase block font-extrabold ${isBigTextMode ? 'text-xs' : 'text-[10px]'}`}>Điểm hài lòng</span>
                        <span className={`font-black text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1 mt-0.5 ${isBigTextMode ? 'text-xl' : 'text-base'}`}>
                          <ThumbsUp size={isBigTextMode ? 18 : 13} /> ⭐ {m.avgSatisfactionRating}/5
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[var(--border-color)]">
                    <span className={`font-extrabold text-[var(--text-main)] block mb-1 ${isBigTextMode ? 'text-sm' : 'text-xs'}`}>Quan sát chính:</span>
                    <p className={`text-[var(--text-muted)] italic ${isBigTextMode ? 'text-sm font-medium' : 'text-[11px]'}`}>{m.keyObservation}</p>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Section 2: Top 5 Prioritized UX Improvements */}
      <div>
        <h2
          className={`font-black text-[var(--text-main)] mb-3 flex items-center gap-2 ${
            isBigTextMode ? 'text-lg md:text-xl' : 'text-sm'
          }`}
        >
          <Sparkles size={isBigTextMode ? 20 : 16} className="text-amber-500" />
          Bảng Bằng Chứng 5 Cải Tiến UX Ưu Tiên Hàng Đầu (Before vs After)
        </h2>
        <div className="space-y-4">
          {fixes.map((fix: any) => (
            <div
              key={fix.id}
              className={`p-5 rounded-2xl bg-[var(--bg-card)] transition-all space-y-3 shadow-2xs ${
                isBigTextMode
                  ? 'border-2 border-amber-300 dark:border-amber-700 p-6'
                  : 'border border-[var(--border-color)] hover:border-indigo-500/40'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-color)] pb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-md font-black bg-indigo-600 text-white shadow-2xs ${
                      isBigTextMode ? 'text-sm' : 'text-xs'
                    }`}
                  >
                    RANK #{fix.priorityRank}
                  </span>
                  <h3 className={`font-black text-[var(--text-main)] ${isBigTextMode ? 'text-base md:text-lg' : 'text-sm'}`}>{fix.title}</h3>
                </div>
                <span
                  className={`font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 w-fit ${
                    isBigTextMode ? 'text-xs' : 'text-xs'
                  }`}
                >
                  {fix.targetAgeGroup}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20">
                  <strong className={`text-red-700 dark:text-red-400 block mb-1 font-black ${isBigTextMode ? 'text-sm' : 'text-xs'}`}>🔴 TRƯỚC CẢI TIẾN (BEFORE):</strong>
                  <p className={`text-[var(--text-main)] ${isBigTextMode ? 'text-sm font-semibold' : 'text-xs'}`}>{fix.beforeState}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <strong className={`text-emerald-700 dark:text-emerald-400 block mb-1 font-black ${isBigTextMode ? 'text-sm' : 'text-xs'}`}>🟢 SAU CẢI TIẾN (AFTER):</strong>
                  <p className={`text-[var(--text-main)] ${isBigTextMode ? 'text-sm font-semibold' : 'text-xs'}`}>{fix.afterState}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 font-medium">
                <span className={`text-amber-950 dark:text-amber-100 ${isBigTextMode ? 'text-sm font-bold' : 'text-xs'}`}>
                  <strong>Hiệu quả đo lường:</strong> {fix.improvementMetric}
                </span>
                <span className="px-2.5 py-1 rounded text-[10px] font-black uppercase bg-emerald-700 text-white shrink-0">
                  {fix.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Interactive Usability Testing Session Recorder with Child Safety Guard */}
      <div
        className={`p-6 rounded-2xl bg-[var(--bg-card)] space-y-4 shadow-xs ${
          isBigTextMode
            ? 'border-2 border-amber-400 dark:border-amber-700 p-8'
            : 'border border-[var(--border-color)]'
        }`}
      >
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <div className="flex items-center gap-2">
            <Heart size={isBigTextMode ? 22 : 18} className="text-rose-500" />
            <h2 className={`font-black text-[var(--text-main)] ${isBigTextMode ? 'text-base md:text-lg' : 'text-sm'}`}>
              Thực Hành Thêm Phiên Usability Test Mới (Kiểm Tra Child Safety Guard)
            </h2>
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300">
            Child Safety Compliance
          </span>
        </div>

        <form onSubmit={handleSubmitSession} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={`font-bold text-[var(--text-main)] block mb-1 ${isBigTextMode ? 'text-sm' : 'text-xs'}`}>Nhóm tuổi kiểm thử:</label>
              <select
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value as AgeGroup)}
                className={`w-full px-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isBigTextMode ? 'text-sm font-semibold' : 'text-xs'
                }`}
              >
                <option value="KIDS_8_12">Trẻ em (8 - 12 tuổi)</option>
                <option value="TEENS_13_17">Thiếu niên (13 - 17 tuổi)</option>
                <option value="ADULTS_18_PLUS">Người lớn (18+ tuổi)</option>
              </select>
            </div>

            <div>
              <label className={`font-bold text-[var(--text-main)] block mb-1 ${isBigTextMode ? 'text-sm' : 'text-xs'}`}>Mã kịch bản (Scenario ID):</label>
              <input
                type="text"
                value={scenarioId}
                onChange={(e) => setScenarioId(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isBigTextMode ? 'text-sm' : 'text-xs'
                }`}
              />
            </div>

            <div>
              <label className={`font-bold text-[var(--text-main)] block mb-1 ${isBigTextMode ? 'text-sm' : 'text-xs'}`}>Thời gian hoàn thành (giây):</label>
              <input
                type="number"
                min={5}
                value={completionTime}
                onChange={(e) => setCompletionTime(Number(e.target.value))}
                className={`w-full px-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isBigTextMode ? 'text-sm font-bold' : 'text-xs'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className={`font-bold text-[var(--text-main)] block mb-1 ${isBigTextMode ? 'text-sm' : 'text-xs'}`}>Số lỗi (Errors):</label>
              <input
                type="number"
                min={0}
                value={errorCount}
                onChange={(e) => setErrorCount(Number(e.target.value))}
                className={`w-full px-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isBigTextMode ? 'text-sm font-bold' : 'text-xs'
                }`}
              />
            </div>

            <div>
              <label className={`font-bold text-[var(--text-main)] block mb-1 ${isBigTextMode ? 'text-sm' : 'text-xs'}`}>Số lần nhầm lẫn:</label>
              <input
                type="number"
                min={0}
                value={confusionCount}
                onChange={(e) => setConfusionCount(Number(e.target.value))}
                className={`w-full px-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isBigTextMode ? 'text-sm font-bold' : 'text-xs'
                }`}
              />
            </div>

            <div>
              <label className={`font-bold text-[var(--text-main)] block mb-1 ${isBigTextMode ? 'text-sm' : 'text-xs'}`}>Điểm (1-5 sao):</label>
              <input
                type="number"
                min={1}
                max={5}
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className={`w-full px-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isBigTextMode ? 'text-sm font-bold' : 'text-xs'
                }`}
              />
            </div>

            <div>
              <label className={`font-bold text-[var(--text-main)] block mb-1 ${isBigTextMode ? 'text-sm' : 'text-xs'}`}>Nhận xét cảm nhận:</label>
              <input
                type="text"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Nhập cảm nhận..."
                className={`w-full px-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isBigTextMode ? 'text-sm font-medium' : 'text-xs'
                }`}
              />
            </div>
          </div>

          {/* Child Safety Consent Checkbox */}
          {ageGroup === 'KIDS_8_12' && (
            <div className="p-4 rounded-xl bg-purple-500/15 border border-purple-500/40 space-y-1">
              <label className={`flex items-center gap-2 font-black text-purple-950 dark:text-purple-200 cursor-pointer ${isBigTextMode ? 'text-base' : 'text-xs'}`}>
                <input
                  type="checkbox"
                  checked={parentalConsent}
                  onChange={(e) => setParentalConsent(e.target.checked)}
                  className="w-5 h-5 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                />
                <span className="flex items-center gap-1.5">
                  <Lock size={isBigTextMode ? 18 : 14} /> Xác nhận đã có sự đồng ý của Phụ huynh (Parental Consent Verified)
                </span>
              </label>
              <p className={`text-[var(--text-muted)] pl-7 ${isBigTextMode ? 'text-sm font-medium' : 'text-[11px]'}`}>
                Quy tắc nghiệm thu Day 28: Nếu bỏ chọn ô này khi nhóm tuổi là Trẻ em (8-12 tuổi), hệ thống sẽ kích hoạt <strong>Child Safety Guard</strong> ngắt 400 Bad Request ngay lập tức!
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-6 py-3 font-extrabold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer shadow-md flex items-center gap-2 disabled:opacity-50 ${
              isBigTextMode ? 'text-base' : 'text-xs'
            }`}
          >
            <Send size={isBigTextMode ? 18 : 14} /> {isSubmitting ? 'Đang lưu...' : 'Gửi Phiên Kiểm Thử Usability'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UsabilityDashboard;
