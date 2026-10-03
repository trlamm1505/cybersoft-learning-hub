import { ProblemDraft } from '../problem-generator.types';

// Không dùng class-validator (không có trong package.json). draft phải
// nguyên vẹn từ response của /generate — service tự chạy lại validator,
// không tin field pass/fail nào do client tự gửi kèm.
//
// forceSave/overrideReason: cơ chế human-in-the-loop cho cảnh báo trùng lặp
// MỀM (isHardBlock=false trên mọi duplicateCandidates) — giáo viên đã tự đọc
// và xác nhận bài KHÔNG thực sự trùng thì có thể lưu đè cảnh báo. Service
// vẫn tự chạy lại validator (không tin forceSave miễn nhiễm mọi điều kiện
// khác) và CHẶN CỨNG nếu có bất kỳ hasHardBlockDuplicate nào, bất kể
// forceSave — không có "bỏ qua" cho trường hợp gần như chắc chắn là bản sao.
export class SaveProblemDto {
  draft: ProblemDraft;
  forceSave?: boolean;
  overrideReason?: string;
}
