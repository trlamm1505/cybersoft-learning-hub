export class DebugLoopDto {
  exerciseSlug: string;
  // ID của submission vừa chạy xong mà học viên muốn AI Coach phân tích.
  // Bắt buộc phải là submission thật đã lưu trong DB — Debug Loop không nhận
  // kết quả test tự mô tả từ client để tránh AI phản hồi dựa trên dữ liệu bịa.
  submissionId: string;
}
