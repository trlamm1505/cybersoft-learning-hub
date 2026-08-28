import React from 'react';
import type { QuestionItem } from '../types/quiz';

interface QuestionNavigatorProps {
  questions: QuestionItem[];
  currentIndex: number;
  answersMap: Record<string, string>;
  onSelectQuestion: (index: number) => void;
  onSubmitClick: () => void;
}

export const QuestionNavigator: React.FC<QuestionNavigatorProps> = ({
  questions,
  currentIndex,
  answersMap,
  onSelectQuestion,
  onSubmitClick,
}) => {
  const totalCount = questions.length;
  const answeredCount = Object.keys(answersMap).length;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-colors">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <span>📋 Danh Sách Câu Hỏi</span>
        </h3>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          Đã chọn {answeredCount}/{totalCount}
        </span>
      </div>

      {/* Grid of Question Number Buttons */}
      <div className="grid grid-cols-5 gap-2 mb-6">
        {questions.map((q, idx) => {
          const isCurrent = idx === currentIndex;
          const isAnswered = !!answersMap[q.questionId];

          let btnStyle = 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700';

          if (isAnswered) {
            btnStyle = 'bg-emerald-500 text-white hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 font-bold';
          }

          if (isCurrent) {
            btnStyle += ' ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900 scale-105 shadow-sm';
          }

          return (
            <button
              key={q.questionId || idx}
              onClick={() => onSelectQuestion(idx)}
              className={`h-10 rounded-xl text-xs font-medium transition-all duration-200 flex items-center justify-center ${btnStyle}`}
              title={`Câu ${idx + 1}: ${isAnswered ? 'Đã chọn đáp án' : 'Chưa chọn'}`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* Submit Button */}
      <button
        onClick={onSubmitClick}
        className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
        <span>Nộp Bài Thi Trắc Nghiệm</span>
      </button>
    </div>
  );
};

export default QuestionNavigator;
