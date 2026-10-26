export type ReviewPolicyType =
  'IMMEDIATE' | 'AFTER_SUBMISSION' | 'AFTER_DEADLINE' | 'NEVER';

/**
 * Chính sách mặc định cho bài thi hệ thống. Ghi vào QuizAttempt.reviewPolicy
 * lúc bắt đầu làm bài; review chỉ đọc giá trị đã lưu, không nhận từ client.
 */
export const DEFAULT_REVIEW_POLICY: ReviewPolicyType = 'AFTER_SUBMISSION';
