import React, { useEffect, useRef, useState } from 'react';
import { Bot, Send, Loader2, AlertTriangle, ShieldAlert, Gauge } from 'lucide-react';
import coachApi from '../axios/coachApi';
import type { CoachHistoryMessage } from '../types/coach';

interface CoachPanelProps {
  exerciseSlug: string;
  userId?: string;
}

export const CoachPanel: React.FC<CoachPanelProps> = ({ exerciseSlug, userId = 'student-demo' }) => {
  const [messages, setMessages] = useState<CoachHistoryMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastUsage, setLastUsage] = useState<{ promptTokens: number; completionTokens: number; maxPromptTokens: number; maxCompletionTokens: number } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([]);
    setErrorMsg(null);
    setLastUsage(null);
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exerciseSlug]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
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
      const res = await coachApi.chat({ userId, exerciseSlug, message });
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
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
        <div ref={bottomRef} />
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
