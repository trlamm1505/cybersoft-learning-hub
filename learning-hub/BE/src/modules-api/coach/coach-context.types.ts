/**
 * Context schema tối thiểu mà AI Coach được phép nhìn thấy cho một lượt chat.
 *
 * Nguyên tắc bắt buộc (điều kiện nghiệm thu):
 * - KHÔNG được chứa test case ẩn (isHidden === true) hay expectedOutput của chúng.
 * - KHÔNG được chứa solutionCode của bài tập.
 * - Chỉ chứa nội dung hint mà học viên ĐÃ mở (unlock), không phải toàn bộ hint có sẵn.
 * - Chỉ chứa tóm tắt kết quả attempt gần nhất (status/passed/total), không chứa code
 *   nộp bài đầy đủ của học viên trong các attempt cũ để giữ context gọn và không rò rỉ
 *   dữ liệu không liên quan tới câu hỏi hiện tại.
 */

export interface CoachExerciseContext {
  slug: string;
  title: string;
  description: string;
  difficulty: string;
  visibleTestCases: Array<{ input: string; expectedOutput: string }>;
  hiddenTestCount: number;
}

export interface CoachAttemptSummary {
  totalAttempts: number;
  lastStatus: string | null;
  lastPassedCount: number;
  lastTotalCount: number;
  hasEverPassed: boolean;
}

export interface CoachUnlockedHint {
  level: number;
  title: string;
  content: string;
}

export interface CoachHistoryTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface CoachContext {
  userId: string;
  exercise: CoachExerciseContext;
  attemptSummary: CoachAttemptSummary;
  unlockedHints: CoachUnlockedHint[];
  recentHistory: CoachHistoryTurn[];
  // true khi học viên đã AC (hasEverPassed) hoặc đã mở hết các tầng hint —
  // policy dùng cờ này để quyết định mức độ chi tiết tối đa được phép trả lời.
  policy: {
    allowFullSolution: boolean;
    maxHintLevelUnlocked: number;
  };
}
