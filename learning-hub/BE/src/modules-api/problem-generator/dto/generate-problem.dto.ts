// Không dùng class-validator (không có trong package.json, không có
// ValidationPipe toàn cục — xem coach-chat.dto.ts cùng convention). Validate
// thủ công trong controller/service, giống các DTO khác trong repo.
export class ProblemSpecInputDto {
  learningOutcome: string;
  level: 'EASY' | 'MEDIUM' | 'HARD';
  constraints: string[];
  tags: string[];
}

// specs: cho phép sinh nhiều bài trong một lần gọi (giáo viên soạn nhiều
// câu cho một đề) — luôn là mảng, kể cả khi chỉ sinh một bài.
export class GenerateProblemDto {
  specs: ProblemSpecInputDto[];
}
