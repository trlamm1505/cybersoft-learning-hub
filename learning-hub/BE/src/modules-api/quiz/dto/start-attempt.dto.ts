export class StartAttemptDto {
  testId: string;
  category?: string;
  /** Làm bài trắc nghiệm được giao cho lớp (câu hỏi do giảng viên chọn, một lượt, có hạn chót). */
  assignmentId?: string;
}
