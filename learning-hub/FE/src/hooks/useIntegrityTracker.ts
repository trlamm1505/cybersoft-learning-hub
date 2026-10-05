import { useEffect, useRef } from 'react';
import { IntegrityTracker } from '../common/integrityTracker';

/**
 * Ghi tín hiệu làm bài ở mức tối thiểu khi `active` (xem IntegrityNotice cho phần thông báo học viên):
 * chỉ thời điểm rời/quay lại màn hình thi, không ghi trang nào khác, không ghi phím bấm.
 *
 * Nghe cả `visibilitychange` (đổi tab, thu nhỏ) lẫn `blur`/`focus` của cửa sổ (chuyển sang ứng
 * dụng khác trong khi trình duyệt vẫn hiện). IntegrityTracker bỏ qua sự kiện kép, nên một lần
 * rời chỉ được tính một lần. `sessionKey` đổi (sang bài khác) thì bắt đầu một phiên mới.
 */
export function useIntegrityTracker(active: boolean, sessionKey: string = '') {
  const trackerRef = useRef(new IntegrityTracker());

  useEffect(() => {
    if (!active) return;
    const tracker = trackerRef.current;
    tracker.start(Date.now());
    const leave = () => tracker.onHidden(Date.now());
    const back = () => tracker.onVisible(Date.now());
    const onVisibility = () => (document.visibilityState === 'hidden' ? leave() : back());
    const onFocus = () => {
      if (document.visibilityState === 'visible') back();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', leave);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', leave);
      window.removeEventListener('focus', onFocus);
    };
  }, [active, sessionKey]);

  return trackerRef;
}

export default useIntegrityTracker;
