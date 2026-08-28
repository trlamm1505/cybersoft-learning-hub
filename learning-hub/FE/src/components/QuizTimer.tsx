import React, { useEffect, useState } from 'react';

interface QuizTimerProps {
  initialSeconds: number;
  onTimeExpired: () => void;
}

export const QuizTimer: React.FC<QuizTimerProps> = ({ initialSeconds, onTimeExpired }) => {
  const [timeLeft, setTimeLeft] = useState<number>(initialSeconds);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeExpired();
      return;
    }

    const timerId = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [timeLeft, onTimeExpired]);

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
