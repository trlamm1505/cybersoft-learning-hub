import type { ClientIntegrityPayload } from '../../integrity/integrity-signals';

export class SubmitCodeDto {
  code: string;
  /** Tín hiệu liêm chính tối thiểu từ client (tùy chọn; thiếu thì chỉ ghi mốc nộp). */
  integrity?: ClientIntegrityPayload;
}
