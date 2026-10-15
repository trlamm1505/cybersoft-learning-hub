import { useEffect, useRef } from 'react';
import { LeaveDetector, type LeaveReport } from '../common/leaveDetector';
import { proctorApi, type ProctorScope } from '../axios/proctorApi';

interface Options {
  /** Chỉ đếm khi đang thực sự làm bài. */
  active: boolean;
  scope: ProctorScope;
  /** Id cuộc thi hoặc id bài được giao. */
  refId: string | null | undefined;
  /** Gọi sau mỗi lần rời đã được máy chủ ghi nhận (hoặc báo lỗi mạng: report = null, count cục bộ). */
  onReport?: (report: LeaveReport | null, localCount: number) => void;
}

/**
 * Đếm lần rời màn hình làm bài (đổi tab, thu nhỏ trình duyệt, sang cửa sổ khác) qua
 * `visibilitychange` và `window.blur`, rồi báo máy chủ. Máy chủ mới là nơi giữ bộ đếm
 * chính thức; số đếm cục bộ chỉ để hiển thị khi mất mạng.
 */
export function useLeaveReporter({ active, scope, refId, onReport }: Options) {
  const detectorRef = useRef(new LeaveDetector());
  const onReportRef = useRef(onReport);
  onReportRef.current = onReport;

  useEffect(() => {
    if (!active || !refId) return;
    const detector = detectorRef.current;
    detector.reset();

    const handleLeave = () => {
      if (!detector.onLeave()) return;
      const local = detector.count;
      proctorApi
        .reportLeave(scope, refId)
        .then((report) => onReportRef.current?.(report, local))
        .catch(() => onReportRef.current?.(null, local));
    };
    const handleReturn = () => detector.onReturn();
    const onVisibility = () => (document.visibilityState === 'hidden' ? handleLeave() : handleReturn());
    const onFocus = () => {
      if (document.visibilityState === 'visible') handleReturn();
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', handleLeave);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', handleLeave);
      window.removeEventListener('focus', onFocus);
    };
  }, [active, scope, refId]);

  return detectorRef;
}

export default useLeaveReporter;
