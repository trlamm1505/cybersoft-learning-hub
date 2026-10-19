import type { ClientIntegrityPayload } from '../../integrity/integrity-signals';

export class SubmitCodeDto {
  code: string;
  /** Nộp cho bài được giao của lớp (tính điểm, có hạn chót). Bỏ trống = luyện tập tự do, không tính điểm lớp. */
  assignmentId?: string;
  /** Tín hiệu liêm chính tối thiểu từ client (tùy chọn; thiếu thì chỉ ghi mốc nộp). */
  integrity?: ClientIntegrityPayload;
}
