/**
 * Ngưỡng của tín hiệu liêm chính. Cố ý rộng rãi để ưu tiên tránh nhận diện
 * nhầm: chỉ bài vượt ngưỡng mới vào hàng chờ, và vào hàng chờ chỉ có nghĩa là
 * "giảng viên nên xem", không có nghĩa là vi phạm.
 */
export const INTEGRITY_CONFIG = {
  /** Tương đồng từ ngưỡng này mới gắn cờ (0-1), sau khi đã loại mã khung. */
  similarityThreshold: 0.8,
  /** Mã (đã loại khung + chú thích) ngắn hơn số token này thì không so khớp: bài quá ngắn thì giống nhau là bình thường. */
  minTokensForSimilarity: 20,
  /** Độ dài n-gram token khi so khớp. */
  shingleSize: 3,
  /** Chỉ so với tối đa N bài nộp gần nhất của cùng bài tập, chặn chi phí O(n). */
  maxComparisons: 200,
  /** Số lần rời màn hình tối thiểu để được tính (ít hơn: coi như bình thường). */
  focusLeaveCountThreshold: 5,
  /** Tổng thời gian rời màn hình tối thiểu (giây) để được tính. */
  focusAwaySecondsThreshold: 180,
  /** Giới hạn payload từ client, chặn dữ liệu rác hoặc phình DB. */
  maxFocusEvents: 50,
  maxEditMarks: 50,
  /** Một lần rời không thể dài hơn thời lượng hợp lý này (giây); client gửi lớn hơn thì cắt. */
  maxSingleAwaySeconds: 6 * 60 * 60,
} as const;
