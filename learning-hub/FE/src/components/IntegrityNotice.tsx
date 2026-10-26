import React from 'react';
import { ShieldCheck } from 'lucide-react';

/**
 * Thông báo minh bạch hiển thị đầu trang làm bài: nói rõ ghi nhận gì, để làm
 * gì và KHÔNG làm gì, trước khi học viên bắt đầu.
 */
export const IntegrityNotice: React.FC<{ compact?: boolean }> = ({ compact = false }) =>
  compact ? (
    <div
      role="note"
      aria-label="Thông báo về dữ liệu giám sát làm bài"
      className="flex items-center gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-[11px] text-[var(--text-main)]"
    >
      <ShieldCheck size={14} className="shrink-0 text-sky-500" />
      <span>
        Hệ thống ghi nhận thời gian làm bài và số lần bạn rời màn hình thi để giảng viên xem xét khi cần. Không tự trừ điểm, không tự kết luận gian lận.
      </span>
    </div>
  ) : (
  <div
    role="note"
    aria-label="Thông báo về dữ liệu giám sát làm bài"
    className="flex items-start gap-3 rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4 text-xs text-[var(--text-main)]"
  >
    <ShieldCheck size={18} className="mt-0.5 shrink-0 text-sky-500" />
    <div className="space-y-1">
      <p className="font-bold">Thông báo về tính công bằng khi làm bài</p>
      <p>
        Hệ thống ghi nhận <strong>thời gian làm bài</strong> và <strong>số lần bạn chuyển sang cửa sổ/tab khác</strong>{' '}
        (chỉ thời điểm rời và quay lại, không ghi bạn xem trang nào, không ghi từng phím bấm), đồng thời so sánh mức giống
        nhau của mã nguồn giữa các bài nộp.
      </p>
      <p className="text-[var(--text-muted)]">
        Dữ liệu chỉ dùng để giảng viên xem xét khi cần. Hệ thống <strong>không tự trừ điểm, không hủy bài</strong> và không
        tự kết luận gian lận; quyết định cuối cùng do giảng viên đưa ra sau khi xem xét.
      </p>
    </div>
  </div>
);

export default IntegrityNotice;
