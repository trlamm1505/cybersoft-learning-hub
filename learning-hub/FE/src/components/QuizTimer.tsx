import React, { useEffect, useRef, useState } from 'react';
import { secondsLeft } from '../common/quizTimer';

interface QuizTimerProps {
  initialSeconds: number;
  onTimeExpired: () => void;
}

export const QuizTimer: React.FC<QuizTimerProps> = ({ initialSeconds, onTimeExpired }) => {
  const [timeLeft, setTimeLeft] = useState<number>(initialSeconds);
  // Mốc kết thúc cố định lúc đồng hồ xuất hiện; hàm hết giờ luôn là bản MỚI NHẤT (đã thấy đáp án vừa chọn) và chỉ gọi đúng một lần.
  const endAtRef = useRef<number>(Date.now() + initialSeconds * 1000);
  const onExpiredRef = useRef(onTimeExpired);
  const firedRef = useRef(false);
  onExpiredRef.current = onTimeExpired;

  useEffect(() => {
    const tick = () => {
      const left = secondsLeft(endAtRef.current, Date.now());
      setTimeLeft(left);
      if (left <= 0 && !firedRef.current) {
        firedRef.current = true;
        onExpiredRef.current();
      }
    };
    tick();
    const timerId = setInterval(tick, 250);
    return () => clearInterval(timerId);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(Math.max(0, seconds) / 60);
    const secs = Math.max(0, seconds) % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isWarning = timeLeft < 300; // Under 5 minutes

  return (
    <div
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold shadow-xs transition-all duration-300 ${
        isWarning
          ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 animate-pulse border border-rose-200 dark:border-rose-800'
          : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
      }`}
    >
      <svg
        className={`w-4 h-4 ${isWarning ? 'text-rose-500' : 'text-indigo-600 dark:text-indigo-400'}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span>Thời gian còn lại:</span>
      <span className="font-mono text-base font-bold tracking-wider">{formatTime(timeLeft)}</span>
    </div>
  );
};

export default QuizTimer;
