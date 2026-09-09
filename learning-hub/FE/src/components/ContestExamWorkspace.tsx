import React, { useState, useEffect, useMemo } from 'react';
import type { ContestItem, ContestProblem } from '../types/contest';
import type { LessonAuthoring, TestCase, QuizQuestion } from '../types/authoring';
import { CodeEditor } from './CodeEditor';
import { exerciseApi } from '../axios/exerciseApi';
import { authoringApi } from '../axios/authoringApi';

export interface ContestProblemResult {
  problemId: string;
  slug?: string;
  title: string;
  type: 'coding' | 'quiz';
  score: number;
  maxPoints: number;
  details: string;
  submittedAt: string;
  userCode?: string;
  quizAnswers?: Record<number, string>;
}

export interface ContestAttemptResult {
  contestId: string;
  contestTitle: string;
  studentId: string;
  studentName: string;
  completedAt: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  problemResults: ContestProblemResult[];
}

interface ContestExamWorkspaceProps {
  contest: ContestItem;
  studentId: string;
  studentName: string;
  onExit: () => void;
}

export const getProblemMaxPoints = (idx: number, totalCount: number): number => {
  const n = Math.max(1, totalCount);
  const base = Math.floor(100 / n);
  const remainder = 100 - base * n;
  return base + (idx < remainder ? 1 : 0);
};

export function normalizeAttemptResult(
  result: ContestAttemptResult | null | undefined,
  contest: ContestItem
): ContestAttemptResult | null {
  if (!result) return null;

  const problems = contest.problems || [];
  const totalCount = Math.max(1, problems.length || result.problemResults?.length || 1);

  const normalizedProblemResults: ContestProblemResult[] = (result.problemResults || []).map((pr, idx) => {
    const targetMaxPts = getProblemMaxPoints(idx, totalCount);
    const origMaxPts = pr.maxPoints || 100;
    const origScore = pr.score || 0;

    let newScore = origScore;
    if (origMaxPts !== targetMaxPts) {
      newScore = Math.min(targetMaxPts, Math.round((origScore / origMaxPts) * targetMaxPts));
    }

    let updatedDetails = pr.details || '';
    if (updatedDetails.includes('đ)')) {
      updatedDetails = updatedDetails.replace(/\(\d+\/\d+đ\)/g, `(${newScore}/${targetMaxPts}đ)`);
      updatedDetails = updatedDetails.replace(/\(\d+đ\)/g, `(${newScore}/${targetMaxPts}đ)`);
    }

    return {
      ...pr,
      score: newScore,
      maxPoints: targetMaxPts,
      details: updatedDetails,
    };
  });

  const newTotalScore = normalizedProblemResults.reduce((sum, r) => sum + r.score, 0);
  const newMaxScore = 100;
  const newPercentage = Math.min(100, Math.round((newTotalScore / newMaxScore) * 100));

  return {
    ...result,
    totalScore: newTotalScore,
    maxScore: newMaxScore,
    percentage: newPercentage,
    problemResults: normalizedProblemResults,
  };
}

export const ContestExamWorkspace: React.FC<ContestExamWorkspaceProps> = ({
  contest,
  studentId,
  studentName,
  onExit,
}) => {
  const contestId = contest._id || contest.slug;
  const storageKey = `app_contest_results_${studentId}_${contestId}`;

  // Check existing result for single attempt rule
  const existingResult: ContestAttemptResult | null = useMemo(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      const normalized = normalizeAttemptResult(parsed, contest);
      if (normalized && (parsed.maxScore !== 100 || JSON.stringify(parsed) !== JSON.stringify(normalized))) {
        try {
          localStorage.setItem(storageKey, JSON.stringify(normalized));
        } catch {
          /* ignore */
        }
      }
      return normalized;
    } catch {
      return null;
    }
  }, [storageKey, contest]);

  // LocalStorage keys for ongoing exam state persistence
  const viewModeKey = `app_contest_viewmode_${studentId}_${contestId}`;
  const probIdxKey = `app_contest_active_prob_${studentId}_${contestId}`;
  const probResultsKey = `app_contest_prob_results_${studentId}_${contestId}`;
  const userCodesKey = `app_contest_user_codes_${studentId}_${contestId}`;
  const quizAnswersKey = `app_contest_quiz_ans_${studentId}_${contestId}`;

  // Exam session state (persisted)
  const [viewMode, setViewModeState] = useState<'select' | 'exam'>(() => {
    try {
      const saved = localStorage.getItem(viewModeKey);
      return (saved === 'exam' || saved === 'select') ? saved : 'select';
    } catch {
      return 'select';
    }
  });
  const setViewMode = (mode: 'select' | 'exam') => {
    setViewModeState(mode);
    try {
      localStorage.setItem(viewModeKey, mode);
    } catch {
      /* ignore */
    }
  };

  const [activeProblemIdx, setActiveProblemIdxState] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(probIdxKey);
      return saved ? parseInt(saved) : 0;
    } catch {
      return 0;
    }
  });
  const setActiveProblemIdx = (idx: number) => {
    setActiveProblemIdxState(idx);
    try {
      localStorage.setItem(probIdxKey, idx.toString());
    } catch {
      /* ignore */
    }
  };

  const [detailedLessons, setDetailedLessons] = useState<Record<string, LessonAuthoring>>({});

  // States per problem (persisted)
  const [userCodes, setUserCodesState] = useState<Record<number, string>>(() => {
    try {
      const saved = localStorage.getItem(userCodesKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const setUserCodes = (updater: any) => {
    setUserCodesState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try {
        localStorage.setItem(userCodesKey, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const [stdins, setStdins] = useState<Record<number, string>>({});

  const [quizAnswers, setQuizAnswersState] = useState<Record<number, Record<number, string>>>(() => {
    try {
      const saved = localStorage.getItem(quizAnswersKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const setQuizAnswers = (updater: any) => {
    setQuizAnswersState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try {
        localStorage.setItem(quizAnswersKey, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const [runOutputs, setRunOutputs] = useState<Record<number, { stdout: string; stderr: string; isError?: boolean } | null>>({});

  const [problemResults, setProblemResultsState] = useState<Record<number, ContestProblemResult>>(() => {
    try {
      const saved = localStorage.getItem(probResultsKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const setProblemResults = (updater: any) => {
    setProblemResultsState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try {
        localStorage.setItem(probResultsKey, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [isRunningCode, setIsRunningCode] = useState<boolean>(false);

  // Clear session storage on completion/exit
  const clearSessionStorage = () => {
    try {
      localStorage.removeItem(`app_active_exam_contest_id_${studentId}`);
      localStorage.removeItem(viewModeKey);
      localStorage.removeItem(probIdxKey);
      localStorage.removeItem(probResultsKey);
      localStorage.removeItem(userCodesKey);
      localStorage.removeItem(quizAnswersKey);
    } catch {
      /* ignore */
    }
  };

  // Live timer tick
  const [now, setNow] = useState<Date>(new Date());
  const [finalResult, setFinalResult] = useState<ContestAttemptResult | null>(existingResult);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch full lesson data for problem testcases & quiz questions
  useEffect(() => {
    const fetchLessonDetails = async () => {
      try {
        const allLessons = await authoringApi.getLessons();
        const map: Record<string, LessonAuthoring> = {};
        allLessons.forEach((l) => {
          if (l._id) map[l._id] = l;
          if (l.slug) map[l.slug] = l;
        });

        // Also check localStorage fallbacks
        try {
          const localSaved = localStorage.getItem('app_saved_lessons');
          if (localSaved) {
            const list: LessonAuthoring[] = JSON.parse(localSaved);
            list.forEach((l) => {
              if (l._id && !map[l._id]) map[l._id] = l;
              if (l.slug && !map[l.slug]) map[l.slug] = l;
            });
          }
        } catch {
          /* ignore */
        }

        setDetailedLessons(map);
      } catch (err) {
        console.warn('Cannot fetch remote lessons, using local cache', err);
      }
    };

    fetchLessonDetails();
  }, []);

  const problems: ContestProblem[] = useMemo(() => contest.problems || [], [contest]);
  const currentProblem: ContestProblem | undefined = problems[activeProblemIdx];

  // Resolve detailed lesson info for current problem
  const currentLessonDetail: Partial<LessonAuthoring> = useMemo(() => {
    if (!currentProblem) return {};
    const found =
      (currentProblem.lessonId && detailedLessons[currentProblem.lessonId]) ||
      (currentProblem.slug && detailedLessons[currentProblem.slug]) ||
      Object.values(detailedLessons).find(
        (l) => l.title?.toLowerCase() === currentProblem.title?.toLowerCase(),
      );

    if (found) return found;

    const fallbackPoints = getProblemMaxPoints(activeProblemIdx, problems.length);

    // Default fallback templates
    if (currentProblem.type === 'coding') {
      return {
        title: currentProblem.title,
        type: 'coding',
        starterCode: `# Write Python code for contest problem here\nimport sys\n\nline = sys.stdin.read().strip()\nif line:\n    # Process input\n    values = list(map(int, line.split()))\n    print(sum(values))\nelse:\n    print(0)\n`,
        testCases: [
          { input: '3\n5\n', expectedOutput: '8' },
          { input: '10\n20\n30\n', expectedOutput: '60' },
        ],
        content: `### Đề Bài: ${currentProblem.title}\n\nViết chương trình Python nhận dữ liệu từ STDIN và in ra kết quả tương ứng.`,
      };
    } else {
      return {
        title: currentProblem.title,
        type: 'quiz',
        quizQuestions: [
          {
            content: `Câu 1 (${currentProblem.title}): Từ khóa nào trong Python được dùng để định nghĩa hàm?`,
            options: [
              { key: 'A', text: 'function', isCorrect: false },
              { key: 'B', text: 'def', isCorrect: true },
              { key: 'C', text: 'define', isCorrect: false },
              { key: 'D', text: 'func', isCorrect: false },
            ],
            points: Math.round(fallbackPoints / 2),
          },
          {
            content: `Câu 2 (${currentProblem.title}): Kiểu dữ liệu nào trong Python là danh sách có thể thay đổi (mutable)?`,
            options: [
              { key: 'A', text: 'tuple', isCorrect: false },
              { key: 'B', text: 'str', isCorrect: false },
              { key: 'C', text: 'list', isCorrect: true },
              { key: 'D', text: 'int', isCorrect: false },
            ],
            points: Math.round(fallbackPoints / 2),
          },
        ],
      };
    }
  }, [currentProblem, detailedLessons, activeProblemIdx, problems.length]);

  // Initial code & stdin populate for current active problem
  useEffect(() => {
    if (activeProblemIdx !== undefined && currentProblem) {
      if (userCodes[activeProblemIdx] === undefined) {
        setUserCodes((prev: Record<number, string>) => ({
          ...prev,
          [activeProblemIdx]:
            currentLessonDetail.starterCode ||
            '# Viết code Python cho bài thi tại đây\na = int(input())\nb = int(input())\nprint(a + b)\n',
        }));
      }
      if (stdins[activeProblemIdx] === undefined) {
        const defaultStdin = currentLessonDetail.testCases?.[0]?.input || '3\n5\n';
        setStdins((prev) => ({
          ...prev,
          [activeProblemIdx]: defaultStdin,
        }));
      }
    }
  }, [activeProblemIdx, currentProblem, currentLessonDetail, userCodes, stdins]);

  // Track exact timestamp when student started this exam session (for individual duration countdown)
  const startKey = `app_contest_start_${studentId}_${contestId}`;
  const [attemptStartTime] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(startKey);
      if (saved) return parseInt(saved);
      const nowTs = Date.now();
      localStorage.setItem(startKey, nowTs.toString());
      return nowTs;
    } catch {
      return Date.now();
    }
  });

  // Student individual timer logic: durationMinutes countdown starting when user enters exam, capped by contest endTime
  const timeRemainingText = useMemo(() => {
    const durationMs = (contest.durationMinutes || 90) * 60 * 1000;
    const studentDeadline = attemptStartTime + durationMs;
    const contestEndTime = new Date(contest.endTime).getTime();
    const effectiveDeadline = Math.min(studentDeadline, contestEndTime);

    const diffSec = Math.floor((effectiveDeadline - now.getTime()) / 1000);
    if (diffSec <= 0) return '00:00 (Đã Hết Giờ Làm Bài)';
    const hours = Math.floor(diffSec / 3600);
    const mins = Math.floor((diffSec % 3600) / 60);
    const secs = diffSec % 60;
    return `${hours > 0 ? `${hours}h ` : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [attemptStartTime, contest.durationMinutes, contest.endTime, now]);

  // Auto-submit when time expires
  useEffect(() => {
    if (finalResult) return;
    const durationMs = (contest.durationMinutes || 90) * 60 * 1000;
    const studentDeadline = attemptStartTime + durationMs;
    const contestEndTime = new Date(contest.endTime).getTime();
    const effectiveDeadline = Math.min(studentDeadline, contestEndTime);

    if (now.getTime() >= effectiveDeadline) {
      handleFinalSubmitContest();
    }
  }, [now, attemptStartTime, contest.durationMinutes, contest.endTime, finalResult]);

  // Handle ad-hoc code run (STDIN input -> Stdout)
  const handleRunCode = async () => {
    if (!currentProblem || currentProblem.type !== 'coding') return;
    const code = userCodes[activeProblemIdx] || '';
    const stdin = stdins[activeProblemIdx] || '';
    const slug = currentProblem.slug || 'contest-code-run';

    setIsRunningCode(true);
    setRunOutputs((prev) => ({ ...prev, [activeProblemIdx]: null }));

    try {
      const res = await exerciseApi.runCode(slug, code, stdin);
      setRunOutputs((prev) => ({
        ...prev,
        [activeProblemIdx]: {
          stdout: res.stdout || '',
          stderr: res.stderr || '',
          isError: !!res.stderr && res.stderr.length > 0,
        },
      }));
      showToast('Chạy thử code thành công!', 'info');
    } catch (err: any) {
      setRunOutputs((prev) => ({
        ...prev,
        [activeProblemIdx]: {
          stdout: '',
          stderr: err?.response?.data?.message || err?.message || 'Lỗi kết nối máy chủ chạy code',
          isError: true,
        },
      }));
      showToast('Chạy code thất bại. Kiểm tra cú pháp.', 'error');
    } finally {
      setIsRunningCode(false);
    }
  };

  // Grade current Coding problem against Test Cases (NO HINTS!)
  const handleSubmitCodingProblem = async () => {
    if (!currentProblem || currentProblem.type !== 'coding') return;
    const code = userCodes[activeProblemIdx] || '';
    const testCases: TestCase[] = currentLessonDetail.testCases || [
      { input: '3\n5\n', expectedOutput: '8' },
    ];
    const maxPoints = getProblemMaxPoints(activeProblemIdx, problems.length);
    const slug = currentProblem.slug || 'contest-problem';

    setIsEvaluating(true);
    let passedCount = 0;
    const testResultsDetails: string[] = [];

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      try {
        const res = await exerciseApi.runCode(slug, code, tc.input);
        const actual = (res.stdout || '').trim();
        const expected = (tc.expectedOutput || '').trim();
        if (actual === expected) {
          passedCount++;
          testResultsDetails.push(`Test #${i + 1}: Passed ✅`);
        } else {
          testResultsDetails.push(
            `Test #${i + 1}: Failed ❌ (Nhận '${actual}', mong đợi '${expected}')`,
          );
        }
      } catch {
        testResultsDetails.push(`Test #${i + 1}: Lỗi thực thi ❌`);
      }
    }

    const pointsPerTestCase = testCases.length > 0 ? maxPoints / testCases.length : maxPoints;
    const earnedScore = testCases.length > 0 ? Math.round(passedCount * pointsPerTestCase) : 0;
    const resObj: ContestProblemResult = {
      problemId: currentProblem.lessonId || currentProblem.slug || `prob-${activeProblemIdx}`,
      slug: currentProblem.slug,
      title: currentProblem.title,
      type: 'coding',
      score: earnedScore,
      maxPoints,
      details: `Đạt ${passedCount}/${testCases.length} Test cases (${earnedScore}/${maxPoints}đ)`,
      submittedAt: new Date().toISOString(),
      userCode: code,
    };

    const updatedResults = { ...problemResults, [activeProblemIdx]: resObj };
    setProblemResults(updatedResults);
    setIsEvaluating(false);

    const completedCount = Object.keys(updatedResults).length;
    if (completedCount >= problems.length) {
      showToast('🎉 Bạn đã hoàn thành bài thi cuối cùng! Đang hiển thị Bảng Điểm...', 'success');
      setTimeout(() => {
        handleFinalSubmitContestWithResults(updatedResults);
      }, 1000);
    } else {
      showToast(`✅ Đã nộp Bài ${activeProblemIdx + 1}! Đang quay lại danh sách chọn bài tiếp theo...`, 'success');
      setTimeout(() => {
        setViewMode('select');
      }, 900);
    }
  };

  // Grade Quiz problem
  const handleSubmitQuizProblem = () => {
    if (!currentProblem || currentProblem.type !== 'quiz') return;
    const questions: QuizQuestion[] = currentLessonDetail.quizQuestions || [];
    const userAns = quizAnswers[activeProblemIdx] || {};
    const maxPoints = getProblemMaxPoints(activeProblemIdx, problems.length);

    let correctCount = 0;
    questions.forEach((q, qIdx) => {
      const selectedKey = userAns[qIdx];
      const correctOpt = q.options.find((o) => o.isCorrect);
      if (selectedKey && correctOpt && selectedKey === correctOpt.key) {
        correctCount++;
      }
    });

    const pointsPerQuestion = questions.length > 0 ? maxPoints / questions.length : maxPoints;
    const earnedScore = questions.length > 0 ? Math.round(correctCount * pointsPerQuestion) : 0;
    const resObj: ContestProblemResult = {
      problemId: currentProblem.lessonId || currentProblem.slug || `prob-${activeProblemIdx}`,
      slug: currentProblem.slug,
      title: currentProblem.title,
      type: 'quiz',
      score: earnedScore,
      maxPoints,
      details: `Đúng ${correctCount}/${questions.length} câu trắc nghiệm (${earnedScore}/${maxPoints}đ)`,
      submittedAt: new Date().toISOString(),
      quizAnswers: userAns,
    };

    const updatedResults = { ...problemResults, [activeProblemIdx]: resObj };
    setProblemResults(updatedResults);

    const completedCount = Object.keys(updatedResults).length;
    if (completedCount >= problems.length) {
      showToast('🎉 Bạn đã hoàn thành bài thi cuối cùng! Đang hiển thị Bảng Điểm...', 'success');
      setTimeout(() => {
        handleFinalSubmitContestWithResults(updatedResults);
      }, 1000);
    } else {
      showToast(`✅ Đã nộp Bài ${activeProblemIdx + 1}! Đang quay lại danh sách chọn bài tiếp theo...`, 'success');
      setTimeout(() => {
        setViewMode('select');
      }, 900);
    }
  };

  // Final Contest Submission: calculate total score & record single attempt result
  const handleFinalSubmitContestWithResults = (overrideResults?: Record<number, ContestProblemResult>) => {
    const activeDict = overrideResults || problemResults;
    const resultsList: ContestProblemResult[] = problems.map((p, idx) => {
      const maxPts = getProblemMaxPoints(idx, problems.length);
      if (activeDict[idx]) {
        return {
          ...activeDict[idx],
          maxPoints: maxPts,
        };
      }
      return {
        problemId: p.lessonId || p.slug || `prob-${idx}`,
        slug: p.slug,
        title: p.title,
        type: (p.type || 'coding') as 'coding' | 'quiz',
        score: 0,
        maxPoints: maxPts,
        details: 'Chưa nộp bài thi',
        submittedAt: new Date().toISOString(),
      };
    });

    const totalScore = resultsList.reduce((sum, r) => sum + r.score, 0);
    const maxScore = 100;
    const percentage = Math.min(100, Math.round((totalScore / maxScore) * 100));

    const attemptResult: ContestAttemptResult = {
      contestId,
      contestTitle: contest.title,
      studentId,
      studentName,
      completedAt: new Date().toISOString(),
      totalScore,
      maxScore,
      percentage,
      problemResults: resultsList,
    };

    // Save to LocalStorage for single attempt lock
    try {
      localStorage.setItem(storageKey, JSON.stringify(attemptResult));
      clearSessionStorage();
    } catch {
      /* ignore */
    }

    setFinalResult(attemptResult);
    showToast('Đã nộp bài thi thành công! Đang hiển thị bảng điểm.', 'success');
  };

  const handleFinalSubmitContest = () => {
    handleFinalSubmitContestWithResults();
  };

  // RENDER: Final Scorecard View (If already submitted)
  if (finalResult) {
    return (
      <div className="space-y-8 animate-fade-in max-w-5xl mx-auto pb-16">
        {/* Banner header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-8 md:p-10 shadow-2xl border border-indigo-500/30">
          <div className="absolute -right-12 -top-12 w-56 h-56 bg-emerald-500/20 rounded-full blur-3xl" />

          <div className="relative z-10 space-y-4 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 backdrop-blur-sm">
              <span>🔒 KẾT QUẢ CHÍNH THỨC — MỖI SINH VIÊN CHỈ LÀM 1 LẦN</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Bảng Điểm Kỳ Thi: {finalResult.contestTitle}
            </h1>

            <p className="text-xs md:text-sm text-indigo-200 leading-relaxed max-w-2xl">
              Bài thi của học viên <strong className="text-white">{finalResult.studentName}</strong> (Mã SV:{' '}
              <span className="font-mono text-cyan-300">{finalResult.studentId}</span>) đã được hệ thống tự động ghi
              nhận và tính điểm hoàn tất.
            </p>
          </div>
        </div>

        {/* Score overview cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main score pill */}
          <div className="bg-[var(--bg-card)] border border-emerald-500/40 rounded-3xl p-6 shadow-xl text-center flex flex-col justify-center space-y-2 relative overflow-hidden">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              🏆 Tổng Điểm Đạt Được
            </span>
            <div className="text-5xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              {finalResult.totalScore} <span className="text-xl font-bold text-[var(--text-muted)]">/ {finalResult.maxScore}</span>
            </div>
            <div className="inline-block self-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300">
              Tỷ lệ chính xác: {finalResult.percentage}%
            </div>
          </div>

          {/* Time completed */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 shadow-md flex flex-col justify-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              🕒 Thời Gian Hoàn Thành
            </span>
            <div className="text-lg font-bold text-[var(--text-main)] font-mono">
              {new Date(finalResult.completedAt).toLocaleString('vi-VN')}
            </div>
            <p className="text-xs text-[var(--text-muted)]">Trạng thái: Đã khóa nộp bài (Finished)</p>
          </div>

          {/* Rank / Grade */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 shadow-md flex flex-col justify-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              🎖️ Xếp Loại Kết Quả
            </span>
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
              {finalResult.percentage >= 90
                ? '🌟 XUẤT SẮC'
                : finalResult.percentage >= 75
                ? '🥇 GIỎI'
                : finalResult.percentage >= 50
                ? '🥈 ĐẠT'
                : '🥉 CẦN CỐ GẮNG'}
            </div>
            <p className="text-xs text-[var(--text-muted)]">Tự động chấm bởi Server Auto-Judge</p>
          </div>
        </div>

        {/* Detailed problem score breakdown table */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 md:p-8 shadow-xl space-y-4">
          <h3 className="text-lg font-extrabold text-[var(--text-main)] flex items-center gap-2">
            <span>📊 Danh Sách Bài Thi & Chi Tiết Chấm Điểm</span>
          </h3>

          <div className="overflow-x-auto border border-[var(--border-color)] rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--bg-main)] text-[var(--text-muted)] border-b border-[var(--border-color)] font-bold uppercase">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Tên Bài Tập</th>
                  <th className="px-4 py-3">Loại Bài Thi</th>
                  <th className="px-4 py-3">Chi Tiết Kết Quả</th>
                  <th className="px-4 py-3 text-right">Điểm Đạt Được</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {finalResult.problemResults.map((pr, idx) => (
                  <tr key={pr.problemId || idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="px-4 py-3.5 font-bold font-mono text-[var(--text-muted)]">{idx + 1}</td>
                    <td className="px-4 py-3.5 font-bold text-[var(--text-main)]">{pr.title}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                          pr.type === 'coding'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                            : 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300'
                        }`}
                      >
                        {pr.type === 'coding' ? '💻 Lập Trình' : '📝 Trắc Nghiệm'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[var(--text-muted)] font-medium">{pr.details}</td>
                    <td className="px-4 py-3.5 text-right font-black text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                      {pr.score} / {pr.maxPoints}đ
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Back button */}
        <div className="flex justify-center pt-4">
          <button
            type="button"
            onClick={onExit}
            className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-xl transition-all cursor-pointer border-none flex items-center gap-2"
          >
            ⬅️ Quay Lại Danh Sách Cuộc Thi
          </button>
        </div>
      </div>
    );
  }

  // RENDER: Problem Selection Overview Screen (hển thị danh sách các bài để chọn làm trước)
  if (viewMode === 'select') {
    return (
      <div className="space-y-8 animate-fade-in max-w-5xl mx-auto pb-16">
        {/* Toast notification */}
        {toast && (
          <div
            className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl border text-sm font-semibold flex items-center gap-2 animate-bounce ${
              toast.type === 'error'
                ? 'bg-red-600 text-white border-red-500'
                : toast.type === 'info'
                ? 'bg-cyan-600 text-white border-cyan-500'
                : 'bg-emerald-600 text-white border-emerald-500'
            }`}
          >
            {toast.message}
          </div>
        )}

        {/* Header Banner */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 md:p-8 shadow-xl space-y-4 relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-0.5 rounded-full text-xs font-black bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300">
                  🏆 PHÒNG THI CHÍNH THỨC
                </span>
                <span className="text-xs text-[var(--text-muted)] font-semibold">
                  Thí sinh: <strong>{studentName}</strong> ({studentId})
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-[var(--text-main)] tracking-tight mt-1">
                {contest.title}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-slate-900 text-cyan-400 px-4 py-2 rounded-2xl border border-indigo-500/40 font-mono text-sm font-black shadow-inner flex items-center gap-2">
                <span>⏱️</span>
                <span>{timeRemainingText}</span>
              </div>
              <button
                type="button"
                onClick={onExit}
                className="px-4 py-2 rounded-2xl bg-[var(--bg-main)] hover:bg-slate-200 dark:hover:bg-slate-800 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all cursor-pointer border border-[var(--border-color)] text-xs font-bold"
              >
                ⬅️ Thoát Phòng Thi
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 text-xs flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="font-extrabold text-sm block">📌 Hướng dẫn chọn bài thi:</span>
              <p className="leading-relaxed">
                Kỳ thi gồm <strong>{problems.length} bài thi/chủ đề</strong>. Vui lòng chọn bài thi bạn muốn làm trước từ danh sách bên dưới. Bạn có thể tự do chỉnh sửa và nộp lại từng bài trước khi chốt nộp toàn bộ kỳ thi.
              </p>
            </div>
          </div>
        </div>

        {/* Problem Selection Grid Title */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-[var(--text-main)] flex items-center gap-2">
            <span>📋 Danh Sách Bài Thi — Chọn Bài Làm Trước:</span>
          </h3>
          <span className="text-xs text-[var(--text-muted)] font-semibold">
            Đã hoàn thành {Object.keys(problemResults).length} / {problems.length} bài
          </span>
        </div>

        {/* Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {problems.map((p, idx) => {
            const result = problemResults[idx];
            const isSubmitted = !!result;

            return (
              <div
                key={p.slug || idx}
                className={`bg-[var(--bg-card)] border rounded-3xl p-6 shadow-md transition-all flex flex-col justify-between space-y-4 hover:shadow-xl ${
                  isSubmitted
                    ? 'border-emerald-500/60 shadow-emerald-500/10'
                    : 'border-[var(--border-color)] hover:border-indigo-400'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200">
                      Bài {p.order || idx + 1}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
                        p.type === 'quiz'
                          ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border border-cyan-300'
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300'
                      }`}
                    >
                      {p.type === 'quiz' ? '📝 Trắc Nghiệm' : '💻 Lập Trình Python'} ({getProblemMaxPoints(idx, problems.length)}đ)
                    </span>
                  </div>

                  <h4 className="text-xl font-black text-[var(--text-main)] tracking-tight">
                    {p.title}
                  </h4>

                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    {p.type === 'quiz'
                      ? 'Bài thi trắc nghiệm lý thuyết kiểm tra kiến thức tổng hợp.'
                      : 'Bài thi lập trình Python thực hành thuật toán, nhập từ STDIN (Chế độ thi - Không gợi ý).'}
                  </p>
                </div>

                {/* Status & Entry Button */}
                <div className="pt-2 border-t border-[var(--border-color)] space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--text-muted)] font-semibold">Trạng thái bài làm:</span>
                    {isSubmitted ? (
                      <span className="font-black text-emerald-600 dark:text-emerald-400">
                        🟢 Đã nộp ({result.score} / {result.maxPoints}đ)
                      </span>
                    ) : (
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        🔴 Chưa làm
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={isSubmitted}
                    onClick={() => {
                      if (!isSubmitted) {
                        setActiveProblemIdx(idx);
                        setViewMode('exam');
                      }
                    }}
                    className={`w-full py-3 px-4 rounded-2xl text-xs font-black transition-all border-none flex items-center justify-center gap-2 ${
                      isSubmitted
                        ? 'bg-slate-200 dark:bg-slate-800 text-[var(--text-muted)] cursor-not-allowed shadow-none border border-[var(--border-color)]'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-md'
                    }`}
                  >
                    {isSubmitted ? '✅ Đã Nộp Bài Thi Này' : '🚀 Chọn Bài Này Để Làm'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Global Submit Banner */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-black text-[var(--text-main)]">Nộp Bài Toàn Bộ Kỳ Thi</h4>
            <p className="text-xs text-[var(--text-muted)]">
              Sau khi làm các bài thi, bấm nút bên dưới để tổng kết điểm và xem kết quả bảng điểm chính thức.
            </p>
          </div>

          <button
            type="button"
            onClick={handleFinalSubmitContest}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs shadow-xl transition-all cursor-pointer border-none flex items-center gap-2 animate-pulse"
          >
            🏁 Nộp Bài & Kết Thúc Kỳ Thi
          </button>
        </div>
      </div>
    );
  }

  // RENDER: Active Contest Exam Workspace (Specific Problem View - Focused mode)
  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl border text-sm font-semibold flex items-center gap-2 animate-bounce ${
            toast.type === 'error'
              ? 'bg-red-600 text-white border-red-500'
              : toast.type === 'info'
              ? 'bg-cyan-600 text-white border-cyan-500'
              : 'bg-emerald-600 text-white border-emerald-500'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Top Header & Exam Timer Bar */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4 sticky top-4 z-30 backdrop-blur-md bg-opacity-95">
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="p-2 rounded-xl bg-[var(--bg-main)] hover:bg-slate-200 dark:hover:bg-slate-800 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all cursor-pointer border border-[var(--border-color)] text-xs font-bold"
            title="Thoát khỏi phòng thi"
          >
            ⬅️ Thoát
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                🔴 ĐANG THI THỰC CHIẾN
              </span>
              <span className="text-xs text-[var(--text-muted)] font-semibold">
                Thí sinh: <strong>{studentName}</strong> ({studentId})
              </span>
            </div>
            <h2 className="text-lg md:text-xl font-black text-[var(--text-main)] tracking-tight">
              {contest.title}
            </h2>
          </div>
        </div>

        {/* Live Countdown Timer & Final Submit Button */}
        <div className="flex items-center gap-4 ml-auto">
          <div className="bg-slate-900 text-cyan-400 px-4 py-2 rounded-2xl border border-indigo-500/40 font-mono text-sm font-black shadow-inner flex items-center gap-2">
            <span>⏱️</span>
            <span>{timeRemainingText}</span>
          </div>

          <button
            type="button"
            onClick={handleFinalSubmitContest}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs shadow-lg transition-all cursor-pointer border-none flex items-center gap-1.5 animate-pulse"
          >
            🏁 Nộp Bài & Kết Thúc Kỳ Thi
          </button>
        </div>
      </div>

      {/* Active Problem Content Area */}
      {!currentProblem ? (
        <div className="text-center py-16 bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)]">
          <p className="text-sm font-semibold text-[var(--text-muted)]">Không tìm thấy bài thi được chọn.</p>
        </div>
      ) : currentProblem.type === 'coding' ? (
        /* CODING PROBLEM WORKSPACE (NO HINTS!) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Problem Statement & Instructions (No Hint Engine) */}
          <div className="lg:col-span-5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 shadow-lg space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <span className="px-3 py-1 rounded-full text-xs font-black bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300">
                  💻 BÀI THI LẬP TRÌNH PYTHON ({getProblemMaxPoints(activeProblemIdx, problems.length)} ĐIỂM)
                </span>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                  🚫 Không gợi ý trong bài thi
                </span>
              </div>

              <h3 className="text-xl font-extrabold text-[var(--text-main)] tracking-tight">
                {currentProblem.title}
              </h3>

              {/* Description Content */}
              <div className="prose dark:prose-invert text-xs text-[var(--text-muted)] leading-relaxed space-y-2 max-h-96 overflow-y-auto pr-2">
                <p>
                  {currentLessonDetail.content ||
                    currentLessonDetail.description ||
                    `Viết mã nguồn Python nhận dữ liệu từ STDIN, xử lý bài toán và in kết quả ra STDOUT.`}
                </p>

                {currentLessonDetail.testCases && currentLessonDetail.testCases.length > 0 && (
                  <div className="pt-3 space-y-2">
                    <span className="font-bold text-[var(--text-main)] block">Ví dụ Test Cases mẫu:</span>
                    {currentLessonDetail.testCases.slice(0, 2).map((tc, idx) => (
                      <div
                        key={idx}
                        className="bg-[var(--bg-main)] p-2.5 rounded-xl border border-[var(--border-color)] font-mono text-[11px]"
                      >
                        <div className="text-slate-500">Input: <span className="text-[var(--text-main)] font-bold">{tc.input}</span></div>
                        <div className="text-slate-500">Output: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{tc.expectedOutput}</span></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Submission Status Box for current problem */}
            {problemResults[activeProblemIdx] && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-xs space-y-1">
                <div className="font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  ✅ Đã nộp bài tập này!
                </div>
                <div className="text-emerald-700 dark:text-emerald-400 font-semibold">
                  {problemResults[activeProblemIdx].details}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Code Editor + STDIN + Run + Submit */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <span className="text-xs font-bold text-[var(--text-main)] flex items-center gap-1.5">
                  <span>💻 Trình Soạn Thảo Python (Python 3.x)</span>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRunCode}
                    disabled={isRunningCode}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer border-none shadow-sm flex items-center gap-1"
                  >
                    {isRunningCode ? '⏳ Đang chạy...' : '▶️ Chạy Thử Code'}
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmitCodingProblem}
                    disabled={isEvaluating}
                    className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer border-none shadow-md flex items-center gap-1"
                  >
                    {isEvaluating ? '⏳ Đang chấm...' : '🚀 Nộp Bài Code Này'}
                  </button>
                </div>
              </div>

              {/* Code Mirror Editor */}
              <CodeEditor
                value={userCodes[activeProblemIdx] || ''}
                onChange={(newVal) => setUserCodes((prev: Record<number, string>) => ({ ...prev, [activeProblemIdx]: newVal }))}
                isDark={document.documentElement.classList.contains('dark')}
                height="340px"
              />

              {/* Custom STDIN Box */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[var(--text-muted)] block">
                  📥 STDIN (Dữ liệu đầu vào cho lệnh 'Chạy Thử'):
                </label>
                <textarea
                  rows={2}
                  value={stdins[activeProblemIdx] || ''}
                  onChange={(e) => setStdins((prev) => ({ ...prev, [activeProblemIdx]: e.target.value }))}
                  className="w-full p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-xs font-mono text-[var(--text-main)] focus:outline-none focus:border-indigo-500"
                  placeholder="Nhập stdin..."
                />
              </div>

              {/* Execution Console Output Box */}
              {runOutputs[activeProblemIdx] && (
                <div className="space-y-1.5 pt-2 border-t border-[var(--border-color)]">
                  <span className="text-[11px] font-bold text-[var(--text-muted)] block">
                    💻 Kết quả chạy thử (Console Output):
                  </span>
                  <div
                    className={`p-3 rounded-2xl font-mono text-xs max-h-40 overflow-y-auto border ${
                      runOutputs[activeProblemIdx]?.isError
                        ? 'bg-red-950/40 text-red-300 border-red-800'
                        : 'bg-slate-900 text-emerald-400 border-slate-800'
                    }`}
                  >
                    {runOutputs[activeProblemIdx]?.stderr ? (
                      <pre className="whitespace-pre-wrap">{runOutputs[activeProblemIdx]?.stderr}</pre>
                    ) : (
                      <pre className="whitespace-pre-wrap">
                        {runOutputs[activeProblemIdx]?.stdout || '(Chương trình không in gì ra màn hình)'}
                      </pre>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* QUIZ PROBLEM WORKSPACE */
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 md:p-8 shadow-lg space-y-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
            <div>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border border-cyan-300">
                📝 BÀI THI TRẮC NGHIỆM ({getProblemMaxPoints(activeProblemIdx, problems.length)} ĐIỂM)
              </span>
              <h3 className="text-xl font-black text-[var(--text-main)] mt-2">{currentProblem.title}</h3>
            </div>

            <button
              type="button"
              onClick={handleSubmitQuizProblem}
              className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition-all shadow-md cursor-pointer border-none"
            >
              🚀 Nộp Bài Trắc Nghiệm Này
            </button>
          </div>

          {/* Quiz Questions List */}
          <div className="space-y-6">
            {(currentLessonDetail.quizQuestions || []).map((q, qIdx) => (
              <div
                key={qIdx}
                className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl p-5 space-y-3"
              >
                <div className="font-bold text-sm text-[var(--text-main)]">
                  {qIdx + 1}. {q.content}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  {q.options.map((opt) => {
                    const isSelected = quizAnswers[activeProblemIdx]?.[qIdx] === opt.key;

                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() =>
                          setQuizAnswers((prev: Record<number, Record<number, string>>) => ({
                            ...prev,
                            [activeProblemIdx]: {
                              ...(prev[activeProblemIdx] || {}),
                              [qIdx]: opt.key,
                            },
                          }))
                        }
                        className={`p-3 rounded-xl border text-left text-xs font-medium transition-all cursor-pointer flex items-center gap-3 ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm font-bold'
                            : 'bg-[var(--bg-card)] text-[var(--text-main)] border-[var(--border-color)] hover:border-indigo-400'
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected ? 'bg-white text-indigo-700' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {opt.key}
                        </span>
                        <span>{opt.text}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContestExamWorkspace;
