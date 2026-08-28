import React from 'react';
import type { QuestionItem } from '../types/quiz';

interface QuestionCardProps {
  question: QuestionItem;
  questionNumber: number;
  totalQuestions: number;
  selectedOptionKey?: string;
  onSelectOption: (optionKey: string) => void;
  onPrev: () => void;
  onNext: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  questionNumber,
  totalQuestions,
  selectedOptionKey,
  onSelectOption,
  onPrev,
  onNext,
  isFirst,
  isLast,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm transition-all duration-300">
      {/* Question Header Metadata */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 mb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 rounded-full text-xs font-bold">
            Câu {questionNumber} / {totalQuestions}
          </span>
          {question.category && (
            <span className="px-3 py-1 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-full text-xs font-medium">
              {question.category}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {question.difficulty && (
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                question.difficulty === 'EASY'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                  : question.difficulty === 'MEDIUM'
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                  : 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
              }`}
            >
              {question.difficulty}
            </span>
          )}
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            {question.points || 10} điểm
          </span>
        </div>
      </div>

      {/* Question Content */}
      <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 leading-relaxed mb-4">
        {question.content}
      </h2>

      {/* Code Snippet Box (if present) */}
      {question.codeSnippet && (
        <div className="mb-6 rounded-2xl bg-slate-900 text-slate-100 p-4 text-sm font-mono overflow-x-auto shadow-inner border border-slate-800">
          <pre className="whitespace-pre-wrap">{question.codeSnippet}</pre>
        </div>
      )}

      {/* Options List */}
      <div className="space-y-3 mb-8">
        {question.options.map((opt) => {
          const isSelected = selectedOptionKey === opt.key;

          return (
            <button
              key={opt.key}
              onClick={() => onSelectOption(opt.key)}
              className={`w-full text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex items-center gap-4 ${
                isSelected
                  ? 'bg-indigo-50/90 dark:bg-indigo-950/40 border-indigo-500 dark:border-indigo-500 shadow-sm ring-1 ring-indigo-500'
                  : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 hover:bg-slate-100/80 dark:hover:bg-slate-800'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm transition-colors ${
                  isSelected
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600'
                }`}
              >
                {opt.key}
              </div>
              <span
                className={`text-sm sm:text-base font-medium flex-1 ${
                  isSelected
                    ? 'text-indigo-900 dark:text-indigo-200 font-semibold'
                    : 'text-slate-700 dark:text-slate-200'
                }`}
              >
                {opt.text}
              </span>
            </button>
          );
        })}
      </div>

      {/* Prev / Next Navigation Controls */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={onPrev}
          disabled={isFirst}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
            isFirst
              ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          <span>Câu Trước</span>
        </button>

        <button
          onClick={onNext}
          disabled={isLast}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
            isLast
              ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
          }`}
        >
          <span>Câu Tiếp</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default QuestionCard;
