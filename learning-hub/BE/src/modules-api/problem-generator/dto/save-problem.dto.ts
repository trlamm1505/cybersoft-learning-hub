import { ProblemDraft } from '../problem-generator.types';

// Không dùng class-validator (không có trong package.json). draft phải
// nguyên vẹn từ response của /generate — service tự chạy lại validator,
// không tin field pass/fail nào do client tự gửi kèm.
export class SaveProblemDto {
  draft: ProblemDraft;
}
