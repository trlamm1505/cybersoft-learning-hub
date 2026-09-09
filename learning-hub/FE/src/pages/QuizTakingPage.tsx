import React, { useState, useMemo, useEffect } from 'react';
import quizApi from '../axios/quizApi';
import type { QuizStartResponse, QuizReviewResponse, QuestionItem } from '../types/quiz';
import type { LessonAuthoring } from '../types/authoring';
import QuizTimer from '../components/QuizTimer';
import QuestionNavigator from '../components/QuestionNavigator';
import QuestionCard from '../components/QuestionCard';
import QuizResultView from '../components/QuizResultView';

interface QuizTakingPageProps {
  teacherLessons?: LessonAuthoring[];
}

export interface QuizTopic {
  id: string;
  title: string;
  description: string;
  questionCount: number;
  timeLimitMinutes: number;
  category: string;
  source: 'SYSTEM' | 'TEACHER';
  teacherData?: LessonAuthoring;
}

const SYSTEM_QUIZZES: QuizTopic[] = [
  {
    id: 'standard-web',
    title: 'Bài Trắc Nghiệm Lập Trình Web Tổng Hợp',
    description: 'Kiểm tra toàn diện kiến thức Lập trình Web (HTML5, CSS3, JavaScript ES6+, React Hooks, NestJS & MongoDB).',
    questionCount: 20,
    timeLimitMinutes: 30,
    category: 'Fullstack Web',
    source: 'SYSTEM',
  },
  {
    id: 'python-basic',
    title: 'Bài Trắc Nghiệm Python Căn Bản',
    description: 'Kiểm tra kiến thức cốt lõi Python: Biến, kiểu dữ liệu, hàm input(), cấu trúc lặp và xử lý chuỗi.',
    questionCount: 10,
    timeLimitMinutes: 15,
    category: 'Python',
    source: 'SYSTEM',
  },
];

export const QuizTakingPage: React.FC<QuizTakingPageProps> = ({ teacherLessons = [] }) => {
  // Combine System Quizzes with Teacher Created Quizzes (Only Published)
  const teacherQuizzes: QuizTopic[] = teacherLessons
    .filter(
      (l) =>
        (l.status === 'published' || !l.status) &&
        l.type === 'quiz' &&
        l.quizQuestions &&
        l.quizQuestions.length > 0,
    )
    .map((l) => ({
      id: l.slug || l._id || '',
      title: l.title.replace(/^[🧑‍💻📝👨‍🏫\s]+/, '').trim(),
      description: l.description || l.learningOutcome || 'Bài trắc nghiệm tạo bởi Giảng viên',
      questionCount: l.quizQuestions.length,
      timeLimitMinutes: 20,
      category: l.slug === 'python-basic' ? 'Python' : l.slug === 'standard-web' ? 'Fullstack Web' : 'Trắc nghiệm',
      source: 'TEACHER',
      teacherData: l,
    }));

  const availableQuizzes = useMemo(() => {
    if (teacherQuizzes.length > 0) {
      return teacherQuizzes;
    }
    return SYSTEM_QUIZZES;
  }, [teacherQuizzes]);

  const [selectedQuizId, setSelectedQuizId] = useState<string>(() => availableQuizzes[0]?.id || 'standard-web');

  // Keep selectedQuizId valid if availableQuizzes changes
  useEffect(() => {
    if (availableQuizzes.length > 0 && !availableQuizzes.some((q) => q.id === selectedQuizId)) {
      setSelectedQuizId(availableQuizzes[0].id);
    }
  }, [availableQuizzes, selectedQuizId]);

  // Active quiz topic details
  const activeTopic = availableQuizzes.find((q) => q.id === selectedQuizId) || availableQuizzes[0];

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

    // If student selected a Teacher Created Quiz
    if (activeTopic.source === 'TEACHER' && activeTopic.teacherData) {
      const tData = activeTopic.teacherData;
      const customQuizData: QuizStartResponse = {
        attemptId: `attempt-teacher-${Date.now()}`,
        testId: activeTopic.id,
        startedAt: new Date().toISOString(),
        timeLimitSeconds: activeTopic.timeLimitMinutes * 60,
        status: 'IN_PROGRESS',
        questions: tData.quizQuestions.map((q, idx) => ({
          questionId: `teacher-q-${idx}`,
          content: q.content,
          codeSnippet: q.codeSnippet,
          options: q.options.map((opt) => ({ key: opt.key, text: opt.text })),
          points: q.points || 10,
        })),
      };

      setQuizData(customQuizData);
      setCurrentIndex(0);
      setAnswersMap({});
      setStage('TAKING');
      return;
    }

    // Otherwise start Backend System Quiz
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

    // If submitting Teacher Quiz
    if (activeTopic.source === 'TEACHER' && activeTopic.teacherData) {
      const tData = activeTopic.teacherData;
      let totalEarned = 0;
      let maxScore = 0;

      const questionReviews: QuestionItem[] = tData.quizQuestions.map((q, idx) => {
        const qId = `teacher-q-${idx}`;
        const selectedOpt = answersMap[qId] || '';
        const correctOpt = q.options.find((opt) => opt.isCorrect)?.key || 'A';
        const isCorrect = selectedOpt === correctOpt;
        const qPoints = q.points || 10;
        maxScore += qPoints;

        if (isCorrect) {
          totalEarned += qPoints;
        }

        return {
          questionId: qId,
          content: q.content,
          codeSnippet: q.codeSnippet,
          options: q.options.map((opt) => ({
            key: opt.key,
            text: opt.text,
            isCorrect: opt.isCorrect,
          })),
          explanation: q.explanation || 'Không có giải thích',
          points: qPoints,
          selectedOptionKey: selectedOpt,
          correctOptionKey: correctOpt,
          isCorrect,
          scoreEarned: isCorrect ? qPoints : 0,
        };
      });

      const teacherReview: QuizReviewResponse = {
        attemptId: quizData.attemptId,
        userId,
        testId: activeTopic.id,
        status: 'GRADED',
        score: totalEarned,
        maxScore,
        startedAt: new Date().toISOString(),
        submittedAt: new Date().toISOString(),
        reviewPolicyApplied: 'AFTER_SUBMISSION',
        questions: questionReviews,
      };

      setReviewData(teacherReview);
      setStage('RESULT');
      return;
    }

    // Submit Backend System Quiz
    try {
      const studentAnswers = Object.entries(answersMap).map(([questionId, selectedOptionKey]) => ({
        questionId,
        selectedOptionKey,
      }));

      await quizApi.submitQuiz(quizData.attemptId, {
        userId,
        answers: studentAnswers,
      });

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
      alert('⏰ Đã hết thời gian nộp bài! Hệ thống đang tự động gửi nộp bài thi của bạn.');
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

        {/* STAGE 1: IDLE / PRE-START BANNER & QUIZ SELECTION */}
        {stage === 'IDLE' && (
          <div className="space-y-8 my-6">
            {/* Header Title Banner */}
            <div className="text-center max-w-3xl mx-auto space-y-2">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 uppercase">
                📝 Thi Trắc Nghiệm Trực Tuyến
              </span>
              <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                Chọn Bài Thi Trắc Nghiệm Để Bắt Đầu
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Lựa chọn từ các bộ đề kiểm tra trắc nghiệm để thử sức và đánh giá kiến thức.
              </p>
            </div>

            {/* Quiz Topic Selector Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableQuizzes.map((quiz) => {
                const isSelected = quiz.id === selectedQuizId;
                return (
                  <div
                    key={quiz.id}
                    onClick={() => setSelectedQuizId(quiz.id)}
                    className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-600 dark:border-indigo-500 shadow-md scale-[1.02]'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          {quiz.category === 'Giảng viên' ? 'Trắc nghiệm' : quiz.category || 'Trắc nghiệm'}
                        </span>
                        {isSelected && (
                          <span className="text-xs font-bold text-indigo-600 dark:text-cyan-400">✓ Đang chọn</span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1 leading-snug">
                        {quiz.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
                        {quiz.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <span>❓ {quiz.questionCount} câu hỏi</span>
                      <span>⏱️ {quiz.timeLimitMinutes} phút</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Quiz Confirmation Banner */}
            <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-lg text-center">
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl shadow-xs">
                📝
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                {activeTopic.title}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed max-w-md mx-auto mb-6">
                {activeTopic.description}
              </p>

              <div className="grid grid-cols-2 gap-4 text-left mb-6 max-w-md mx-auto">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Số lượng câu hỏi</span>
                  <span className="text-base font-bold text-slate-800 dark:text-slate-100">
                    {activeTopic.questionCount} Câu trắc nghiệm
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Thời gian làm bài</span>
                  <span className="text-base font-bold text-indigo-600 dark:text-indigo-400">
                    {activeTopic.timeLimitMinutes} Phút
                  </span>
                </div>
              </div>

              <button
                onClick={handleStartQuiz}
                className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-extrabold rounded-2xl shadow-md transition-all text-sm cursor-pointer"
              >
                Bắt Đầu Làm Bài Trắc Nghiệm ({activeTopic.title.slice(0, 25)}...)
              </button>
            </div>
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
                <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">{activeTopic.title}</h1>
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
          <QuizResultView
            reviewData={reviewData}
            onRetakeQuiz={() => {
              setStage('IDLE');
              setQuizData(null);
              setReviewData(null);
              setAnswersMap({});
            }}
          />
        )}
      </div>

      {/* Confirmation Modal before Submit */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl">
            <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
              📥
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Xác nhận nộp bài thi?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Bạn đã hoàn thành{' '}
              <strong className="text-indigo-600 dark:text-cyan-400 font-bold">
                {Object.keys(answersMap).length}/{quizData?.questions.length || 0}
              </strong>{' '}
              câu hỏi. Bạn có chắc chắn muốn kết thúc bài thi và nộp bài để xem điểm số?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
              >
                Tiếp tục làm bài
              </button>
              <button
                onClick={handleSubmitQuiz}
                className="flex-1 py-3 text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all cursor-pointer"
              >
                Nộp bài ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
