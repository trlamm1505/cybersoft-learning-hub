import React from 'react';
import type { QuizReviewResponse } from '../types/quiz';

interface QuizResultViewProps {
  reviewData: QuizReviewResponse;
  onRetakeQuiz: () => void;
}

export const QuizResultView: React.FC<QuizResultViewProps> = ({ reviewData, onRetakeQuiz }) => {
  const percentage = Math.round((reviewData.score / reviewData.maxScore) * 100) || 0;
  const isPassed = percentage >= 70;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Score Summary Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center shadow-md relative overflow-hidden">
        <div
          className={`absolute inset-x-0 top-0 h-3 ${
            isPassed ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-gradient-to-r from-amber-400 to-rose-500'
          }`}
        />

        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 bg-slate-50 dark:bg-slate-800 shadow-inner">
          <span className="text-4xl">{isPassed ? '🏆' : '📚'}</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100 mb-2">
          {isPassed ? 'Chúc Mừng! Bạn Đã Hoàn Thành Bài Thi' : 'Kết Quả Bài Trắc Nghiệm'}
        </h2>
        <p className="text-slate-600 dark:text-slate-400 text-sm max-w-md mx-auto mb-6">
          {isPassed
            ? 'Bạn đã thể hiện xuất sắc kiến thức của mình. Hãy xem lại các lời giải thích dưới đây để củng cố thêm.'
            : 'Đừng nản lòng! Hãy đọc kỹ phần giải thích đáp án bên dưới để ôn tập lại kiến thức.'}
        </p>

        {/* Score Numbers Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto mb-8">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Điểm Số</span>
            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
              {reviewData.score} / {reviewData.maxScore}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Tỷ Lệ Đạt</span>
            <span className={`text-2xl font-black ${isPassed ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {percentage}%
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Số Câu Đúng</span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {reviewData.questions.filter((q) => q.isCorrect).length} / {reviewData.questions.length}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Trạng Thái</span>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 block mt-1">
              {reviewData.status}
            </span>
          </div>
        </div>

        <button
          onClick={onRetakeQuiz}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition-all"
        >
          Làm Lại Bài Thi Mới
        </button>
      </div>

      {/* Review Questions List with Pedagogical Explanations */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <span>💡 Xem Lại Đáp Án & Giải Thích Chi Tiết</span>
        </h3>

        {reviewData.questions.map((q, idx) => {
          return (
            <div
              key={q.questionId || idx}
              className={`bg-white dark:bg-slate-900 border rounded-3xl p-6 shadow-xs transition-colors ${
                q.isCorrect
                  ? 'border-emerald-200 dark:border-emerald-900/60'
                  : 'border-rose-200 dark:border-rose-900/60'
              }`}
            >
              {/* Question Header */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-full">
                  Câu {idx + 1}
                </span>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full ${
                    q.isCorrect
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                  }`}
                >
                  {q.isCorrect ? '✓ Đúng (+10 điểm)' : '✗ Sai (0 điểm)'}
                </span>
              </div>

              {/* Question Content */}
              <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-4">{q.content}</h4>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {q.options.map((opt) => {
                  const isUserChoice = q.selectedOptionKey === opt.key;
                  const isCorrectAnswer = opt.isCorrect;

                  let optBg = 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700';

                  if (isCorrectAnswer) {
                    optBg = 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 font-semibold text-emerald-900 dark:text-emerald-200';
                  } else if (isUserChoice && !isCorrectAnswer) {
                    optBg = 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 font-semibold text-rose-900 dark:text-rose-200';
                  }

                  return (
                    <div key={opt.key} className={`p-3.5 rounded-2xl border flex items-center justify-between text-sm ${optBg}`}>
                      <div className="flex items-center gap-2">
                        <span className="font-bold w-6">{opt.key}.</span>
                        <span>{opt.text}</span>
                      </div>
                      {isCorrectAnswer && <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Đáp án đúng</span>}
                      {isUserChoice && !isCorrectAnswer && <span className="text-xs font-bold text-rose-600 dark:text-rose-400">Bạn đã chọn</span>}
                    </div>
                  );
                })}
              </div>

              {/* Pedagogical Explanation Box */}
              {q.explanation && (
                <div className="mt-4 p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-sm text-indigo-950 dark:text-indigo-200">
                  <div className="font-bold text-indigo-700 dark:text-indigo-300 mb-1 flex items-center gap-1.5">
                    <span>📘 Giải thích từ Giảng viên:</span>
                  </div>
                  <p className="leading-relaxed">{q.explanation}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QuizResultView;
