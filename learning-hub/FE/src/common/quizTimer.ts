/** Số giây còn lại tính theo MỐC GIỜ KẾT THÚC thật (không đếm từng tick), nên tab bị trình duyệt làm chậm hay máy ngủ đông vẫn về 0 đúng lúc. */
export function secondsLeft(endAtMs: number, nowMs: number): number {
  return Math.max(0, Math.ceil((endAtMs - nowMs) / 1000));
}
