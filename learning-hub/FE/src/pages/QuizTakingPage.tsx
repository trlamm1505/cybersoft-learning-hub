import React, { useState } from 'react';
import quizApi from '../axios/quizApi';
import type { QuizStartResponse, QuizReviewResponse } from '../types/quiz';
import QuizTimer from '../components/QuizTimer';
import QuestionNavigator from '../components/QuestionNavigator';
import QuestionCard from '../components/QuestionCard';
import QuizResultView from '../components/QuizResultView';

export const QuizTakingPage: React.FC = () => {
  // State for user & test setup
  const [userId] = useState<string>('673f11111111111111111111');
  const [testId] = useState<string>('673f22222222222222222222');

  // Quiz Engine State
  const [stage, setStage] = useState<'IDLE' | 'LOADING' | 'TAKING' | 'SUBMITTING' | 'RESULT'>('IDLE');
  const [quizData, setQuizData] = useState<QuizStartResponse | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answersMap, setAnswersMap] = useState<Record<string, string>>({});
  const [reviewData, setReviewData] = useState<QuizReviewResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  // 1. Handle Start Quiz API
  const handleStartQuiz = async () => {
    setStage('LOADING');
    setErrorMsg(null);

    try {
      const response = await quizApi.startQuiz(userId, testId);
      setQuizData(response);
      setCurrentIndex(0);
      setAnswersMap({});
      setStage('TAKING');
    } catch (err: any) {
      console.error('❌ Failed to start quiz:', err);
      setErrorMsg(err.response?.data?.message || 'Không thể khởi tạo bài thi. Vui lòng kiểm tra kết nối Backend.');
      setStage('IDLE');
    }
  };

  // Select Option for Question
  const handleSelectOption = (questionId: string, optionKey: string) => {
    setAnswersMap((prev) => ({
      ...prev,
      [questionId]: optionKey,
    }));
  };

  // 2. Handle Submit Quiz API
  const handleSubmitQuiz = async () => {
    if (!quizData) return;

    setShowConfirmModal(false);
    setStage('SUBMITTING');
    setErrorMsg(null);

    try {
      const studentAnswers = Object.entries(answersMap).map(([questionId, selectedOptionKey]) => ({
        questionId,
        selectedOptionKey,
      }));

      // Submit answers to Backend
      await quizApi.submitQuiz(quizData.attemptId, {
        userId,
        answers: studentAnswers,
      });

      // Fetch full review & detailed explanations
      const reviewRes = await quizApi.reviewQuiz(quizData.attemptId, userId, 'AFTER_SUBMISSION');
      setReviewData(reviewRes);
      setStage('RESULT');
    } catch (err: any) {
      console.error('❌ Failed to submit quiz:', err);
      setErrorMsg(err.response?.data?.message || 'Lỗi khi nộp bài thi. Vui lòng thử lại.');
      setStage('TAKING');
    }
  };

  // Handle Time Expired Auto Submit
  const handleTimeExpired = () => {
    if (stage === 'TAKING') {
      alert('⏰ Đã hết thời gian 30 phút nộp bài! Hệ thống đang tự động gửi nộp bài thi của bạn.');
      handleSubmitQuiz();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-6xl mx-auto">
        {/* Error Alert Notification */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/50 dark:border-rose-900 dark:text-rose-300 flex items-center justify-between">
            <span className="text-sm font-semibold">{errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-700 font-bold text-lg">
              ×
            </button>
          </div>
        )}

        {/* STAGE 1: IDLE / PRE-START BANNER */}
        {stage === 'IDLE' && (
          <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-10 shadow-lg text-center my-12">
            <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-3xl flex items-center justify-center mx-auto mb-6 text-3xl shadow-xs">
              📝
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100 mb-3">
              Bài Trắc Nghiệm Lập Trình Web
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed max-w-md mx-auto mb-8">
              Kiểm tra toàn diện kiến thức Lập trình Web (HTML5, CSS3, JavaScript ES6+, React Hooks, NestJS & MongoDB).
            </p>

            <div className="grid grid-cols-2 gap-4 text-left mb-8 max-w-md mx-auto">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Số lượng câu hỏi</span>
                <span className="text-lg font-bold text-slate-800 dark:text-slate-100">20 Câu trắc nghiệm</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Thời gian làm bài</span>
                <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">30 Phút</span>
              </div>
            </div>

            <button
              onClick={handleStartQuiz}
              className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-extrabold rounded-2xl shadow-md transition-all text-base"
            >
              Bắt Đầu Làm Bài Trắc Nghiệm
            </button>
          </div>
        )}

        {/* LOADING STATE */}
        {(stage === 'LOADING' || stage === 'SUBMITTING') && (
          <div className="py-24 text-center">
            <div className="inline-block w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-slate-600 dark:text-slate-400 font-semibold">
              {stage === 'LOADING' ? 'Đang khởi tạo bài thi trắc nghiệm...' : 'Đang nộp bài thi & tự động chấm điểm...'}
            </p>
          </div>
        )}

        {/* STAGE 2: QUIZ TAKING SCREEN */}
        {stage === 'TAKING' && quizData && (
          <div className="space-y-6">
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
              <div>
                <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">Bài Thi Trắc Nghiệm Web</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">Mã lượt thi: {quizData.attemptId.slice(-8)}</p>
              </div>

              <QuizTimer initialSeconds={quizData.timeLimitSeconds} onTimeExpired={handleTimeExpired} />
            </div>

            {/* Main 2-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                {quizData.questions[currentIndex] && (
                  <QuestionCard
                    question={quizData.questions[currentIndex]}
                    questionNumber={currentIndex + 1}
                    totalQuestions={quizData.questions.length}
                    selectedOptionKey={answersMap[quizData.questions[currentIndex].questionId]}
                    onSelectOption={(key) => handleSelectOption(quizData.questions[currentIndex].questionId, key)}
                    onPrev={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                    onNext={() => setCurrentIndex((prev) => Math.min(quizData.questions.length - 1, prev + 1))}
                    isFirst={currentIndex === 0}
                    isLast={currentIndex === quizData.questions.length - 1}
                  />
                )}
              </div>

              <div>
                <QuestionNavigator
                  questions={quizData.questions}
                  currentIndex={currentIndex}
                  answersMap={answersMap}
                  onSelectQuestion={(idx) => setCurrentIndex(idx)}
                  onSubmitClick={() => setShowConfirmModal(true)}
                />
              </div>
            </div>
          </div>
        )}

        {/* STAGE 3: RESULT REVIEW SCREEN */}
        {stage === 'RESULT' && reviewData && (
          <QuizResultView reviewData={reviewData} onRetakeQuiz={handleStartQuiz} />
        )}

        {/* SUBMIT CONFIRMATION MODAL */}
        {showConfirmModal && quizData && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-fade-in text-center">
              <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                ⚠️
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Xác Nhận Nộp Bài Thi</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                Bạn đã hoàn thành{' '}
                <strong className="text-indigo-600 dark:text-indigo-400 font-bold">
                  {Object.keys(answersMap).length}/{quizData.questions.length}
                </strong>{' '}
                câu hỏi. Bạn có chắc chắn muốn gửi bài thi để chấm điểm không?
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-sm"
                >
                  Làm Tiếp
                </button>
                <button
                  onClick={handleSubmitQuiz}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all text-sm shadow-md"
                >
                  Nộp Bài Ngay
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizTakingPage;
