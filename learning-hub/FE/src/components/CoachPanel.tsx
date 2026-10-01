import React, { useEffect, useRef, useState } from 'react';
import { Bot, Send, Loader2, AlertTriangle, ShieldAlert, Gauge, Bug, RotateCcw, X } from 'lucide-react';
import coachApi from '../axios/coachApi';
import type { CoachHistoryMessage, DebugLoopResponse } from '../types/coach';

interface CoachPanelProps {
  exerciseSlug: string;
  userId: string;
  // ID submission gần nhất đã lưu thật ở Backend (không phải kết quả chấm giả
  // lập ở FE cho bài Teacher Authoring) — Debug Loop chỉ phân tích được
  // submission đã tồn tại trong DB, để feedback bám vào test result thật.
  lastSubmissionId?: string | null;
}

const ERROR_CATEGORY_LABEL: Record<DebugLoopResponse['errorCategory'], string> = {
  COMPILE_SYNTAX: 'Lỗi biên dịch / cú pháp',
  RUNTIME_EXCEPTION: 'Lỗi khi chạy (runtime)',
  TIMEOUT: 'Quá thời gian chạy',
  WRONG_OUTPUT: 'Sai kết quả',
  PASSED: 'Đã pass',
};

export const CoachPanel: React.FC<CoachPanelProps> = ({ exerciseSlug, userId, lastSubmissionId = null }) => {
  const [messages, setMessages] = useState<CoachHistoryMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastUsage, setLastUsage] = useState<{ promptTokens: number; completionTokens: number; maxPromptTokens: number; maxCompletionTokens: number } | null>(null);
  const [debugResult, setDebugResult] = useState<DebugLoopResponse | null>(null);
  const [isDebugging, setIsDebugging] = useState(false);
  const [debugError, setDebugError] = useState<string | null>(null);
  // Khác với debugResult (xoá được bằng nút X), cờ này khoá vĩnh viễn nút
  // "Phân tích lỗi" cho TỚI KHI có submission mới — vì backend đã từ chối
  // cứng (403) khi chạm giới hạn vòng lặp, không phải chỉ một cảnh báo có
  // thể bấm đè qua.
  const [loopBlocked, setLoopBlocked] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([]);
    setErrorMsg(null);
    setLastUsage(null);
    setDebugResult(null);
    setDebugError(null);
    setLoopBlocked(false);
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exerciseSlug]);

  // Lần nộp bài thay đổi -> kết quả phân tích cũ (nếu có) không còn khớp,
  // xoá để tránh học viên đọc nhầm feedback của lần nộp trước. Submission
  // mới cũng đồng nghĩa với một chuỗi thử mới, nên mở khoá lại nút.
  useEffect(() => {
    setDebugResult(null);
    setDebugError(null);
    setLoopBlocked(false);
  }, [lastSubmissionId]);

  useEffect(() => {
    // Cuộn trực tiếp container tin nhắn (scrollTop), KHÔNG dùng
    // scrollIntoView trên phần tử cuối — scrollIntoView có thể kéo theo cả
    // trang cha cuộn lên/xuống ngoài ý muốn, chỉ set scrollTop mới chỉ ảnh
    // hưởng đúng khung chat này.
    const el = messagesContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const loadHistory = async () => {
    if (!exerciseSlug) return;
    setIsLoadingHistory(true);
    try {
      const res = await coachApi.getHistory(userId, exerciseSlug);
      setMessages(res.history || []);
    } catch {
      // Lịch sử trống hoặc lỗi tải không nghiêm trọng — bắt đầu cuộc trò chuyện mới bình thường.
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSend = async () => {
    const message = draft.trim();
    if (!message || isSending) return;

    setDraft('');
    setErrorMsg(null);
    setIsSending(true);

    // Optimistic append của câu hỏi để giao diện phản hồi ngay
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: message, tokenCount: 0, policyBlocked: false, createdAt: new Date().toISOString() },
    ]);

    try {
      const res = await coachApi.chat({ exerciseSlug, message });
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.reply,
          tokenCount: res.usage.completionTokens,
          policyBlocked: res.policy.blocked,
          policyReason: res.policy.reason,
          createdAt: new Date().toISOString(),
        },
      ]);
      setLastUsage(res.usage);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'AI Coach hiện không phản hồi được. Vui lòng thử lại.');
    } finally {
      setIsSending(false);
    }
  };

  const handleDebugLoop = async () => {
    if (!lastSubmissionId || isDebugging || loopBlocked) return;
    setIsDebugging(true);
    setDebugError(null);
    try {
      const res = await coachApi.debugLoop({ exerciseSlug, submissionId: lastSubmissionId });
      setDebugResult(res);
      if (res.loopLimitReached) setLoopBlocked(true);
    } catch (err: any) {
      // Backend từ chối cứng (403) khi đã chạm giới hạn vòng lặp cho chuỗi
      // submission chưa AC này — khoá luôn nút, không chỉ hiện lỗi rồi cho
      // bấm lại như một lỗi mạng thông thường.
      if (err?.response?.status === 403) setLoopBlocked(true);
      setDebugError(err?.response?.data?.message || 'Không phân tích được lần nộp này. Vui lòng thử lại.');
    } finally {
      setIsDebugging(false);
    }
  };

  return (
    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-main)] p-4 sm:p-5 shadow-xs transition-colors duration-200 flex flex-col h-[520px]">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-3 mb-3 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2">
          <Bot size={20} className="text-indigo-500" />
          <div>
            <h3 className="font-extrabold text-base text-[var(--text-main)]">AI Coach</h3>
            <p className="text-[11px] text-[var(--text-muted)]">Hỏi đáp bám sát bài tập, không lộ đáp án khi chưa đủ điều kiện.</p>
          </div>
        </div>
        {lastUsage && (
          <div className="hidden sm:flex items-center gap-1 text-[10px] font-semibold text-[var(--text-muted)] shrink-0" title="Ước lượng token đã dùng / giới hạn">
            <Gauge size={12} />
            {lastUsage.completionTokens}/{lastUsage.maxCompletionTokens} tok
          </div>
        )}
      </div>

      {/* Debug Loop trigger */}
      {lastSubmissionId && (
        <div className="mb-3">
          <button
            onClick={handleDebugLoop}
            disabled={isDebugging || loopBlocked}
            title={loopBlocked ? 'Đã chạm giới hạn vòng lặp đồng hành — nộp bài mới để tiếp tục phân tích' : undefined}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDebugging ? <Loader2 size={13} className="animate-spin" /> : <Bug size={13} />}
            {isDebugging ? 'Đang phân tích...' : loopBlocked ? 'Đã chạm giới hạn vòng lặp' : 'Phân tích lỗi lần nộp gần nhất'}
          </button>

          {debugError && (
            <div className="mt-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 p-2 text-[11px] flex items-center gap-1.5">
              <AlertTriangle size={12} className="shrink-0" /> {debugError}
            </div>
          )}

          {debugResult && (
            <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5 text-xs space-y-1.5 max-h-64 overflow-y-auto relative">
              <button
                onClick={() => setDebugResult(null)}
                aria-label="Đóng kết quả phân tích"
                className="absolute top-2 right-2 p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={13} />
              </button>
              <div className="flex items-center justify-between gap-2 pr-6">
                <span className="font-bold text-amber-700 dark:text-amber-300">
                  {ERROR_CATEGORY_LABEL[debugResult.errorCategory]}
                </span>
                <span
                  className="flex items-center gap-1 text-[10px] font-semibold text-[var(--text-muted)]"
                  title="Số lần thử liên tiếp chưa AC / giới hạn tối đa"
                >
                  <RotateCcw size={11} /> {debugResult.loopCount}/{debugResult.maxLoops}
                </span>
              </div>
              <p className="text-[var(--text-main)] leading-relaxed whitespace-pre-wrap">{debugResult.feedback}</p>
              <p className="text-[var(--text-muted)] leading-relaxed whitespace-pre-wrap">
                <span className="font-semibold">Bước tiếp theo: </span>
                {debugResult.nextStep}
              </p>
              {debugResult.loopLimitReached && (
                <div className="pt-1.5 mt-1.5 border-t border-amber-500/30 text-[10px] text-amber-700 dark:text-amber-300 flex items-center gap-1">
                  <ShieldAlert size={11} /> Đã chạm giới hạn vòng lặp đồng hành
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto space-y-3 pr-1">
        {isLoadingHistory ? (
          <div className="py-10 text-center text-sm text-[var(--text-muted)] flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" /> Đang tải lịch sử hội thoại...
          </div>
        ) : messages.length === 0 ? (
          <div className="py-10 text-center text-sm text-[var(--text-muted)]">
            Chưa có cuộc trò chuyện nào. Hãy hỏi AI Coach về bài tập này!
          </div>
        ) : (
          messages.map((m, idx) => (
            <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-sm'
                    : 'bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] rounded-bl-sm'
                }`}
              >
                {m.content}
                {m.role === 'assistant' && m.policyBlocked && (
                  <div className="mt-2 pt-2 border-t border-amber-500/30 text-[10px] text-amber-600 dark:text-amber-300 flex items-center gap-1">
                    <ShieldAlert size={11} /> Đã bị chặn đưa lời giải đầy đủ theo policy
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Error */}
      {errorMsg && (
        <div className="mt-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 p-2.5 text-xs flex items-center gap-1.5">
          <AlertTriangle size={13} className="shrink-0" /> {errorMsg}
        </div>
      )}

      {/* Input */}
      <div className="mt-3 pt-3 border-t border-[var(--border-color)] flex items-end gap-2">
        <textarea
          rows={2}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Hỏi AI Coach về bài tập này..."
          className="flex-1 resize-none px-3 py-2 text-sm rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] focus:outline-none focus:border-indigo-500"
        />
        <button
          onClick={handleSend}
          disabled={isSending || !draft.trim()}
          className="px-3.5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
        >
          {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>
    </div>
  );
};

export default CoachPanel;
