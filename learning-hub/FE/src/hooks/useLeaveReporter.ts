import { useEffect, useRef } from 'react';
import { LeaveDetector, type LeaveReport } from '../common/leaveDetector';
import { proctorApi, type ProctorScope } from '../axios/proctorApi';

/** Chỉ tính vi phạm khi rời màn hình liên tục từ 5 giây trở lên (đổi tab thoáng qua không bị phạt). */
export const LEAVE_THRESHOLD_MS = 5000;
/** Nhịp heartbeat trong phòng thi: 5 giây/lần. Mất liên tục 2 nhịp (không do offline cục bộ) thì BE ghi nhận gián đoạn nghi vấn. */
export const HEARTBEAT_INTERVAL_MS = 5000;

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
 * Giám sát phòng thi bằng hai tín hiệu độc lập:
 *  1) `visibilitychange` + `window.blur`: chỉ tính một lần rời khi vắng mặt kéo dài >= 5 giây rồi báo máy chủ
 *     (máy chủ giữ bộ đếm chính thức; số đếm cục bộ chỉ để hiển thị khi mất mạng).
 *  2) Heartbeat 5 giây/lần kèm cờ `wasOffline` để máy chủ phân biệt mất mạng cục bộ với gián đoạn đáng ngờ.
 */
export function useLeaveReporter({ active, scope, refId, onReport }: Options) {
  const detectorRef = useRef(new LeaveDetector());
  const onReportRef = useRef(onReport);
  onReportRef.current = onReport;

  useEffect(() => {
    if (!active || !refId) return;
    const detector = detectorRef.current;
    detector.reset();

    let awaySince: number | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const confirmLeave = () => {
      timer = null;
      if (!detector.onLeave()) return;
      const local = detector.count;
      proctorApi
        .reportLeave(scope, refId)
        .then((report) => onReportRef.current?.(report, local))
        .catch(() => onReportRef.current?.(null, local));
    };
    const handleLeave = () => {
      if (awaySince !== null) return; // visibilitychange và blur cùng bắn cho một lần rời
      awaySince = Date.now();
      timer = setTimeout(confirmLeave, LEAVE_THRESHOLD_MS);
    };
    const handleReturn = () => {
      awaySince = null;
      if (timer) clearTimeout(timer);
      timer = null;
      detector.onReturn();
    };
    const onVisibility = () => (document.visibilityState === 'hidden' ? handleLeave() : handleReturn());
    const onFocus = () => {
      if (document.visibilityState === 'visible') handleReturn();
    };

    let wasOffline = !navigator.onLine;
    const onOffline = () => {
      wasOffline = true;
    };
    const beat = () => {
      const offline = wasOffline || !navigator.onLine;
      proctorApi
        .heartbeat(scope, refId, offline)
        .then(() => {
          if (navigator.onLine) wasOffline = false;
        })
        .catch(() => {
          wasOffline = true; // không gửi được nhịp: coi là lỗi mạng cục bộ, không đổ cho học viên
        });
    };
    const heartbeat = setInterval(beat, HEARTBEAT_INTERVAL_MS);
    beat();

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', handleLeave);
    window.addEventListener('focus', onFocus);
    window.addEventListener('offline', onOffline);
    return () => {
      if (timer) clearTimeout(timer);
      clearInterval(heartbeat);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', handleLeave);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('offline', onOffline);
    };
  }, [active, scope, refId]);

  return detectorRef;
}

export default useLeaveReporter;
