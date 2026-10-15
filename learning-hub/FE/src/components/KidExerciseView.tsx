import React from 'react';
import { ArrowLeft, Puzzle, Sparkles, Star } from 'lucide-react';
import type { ExerciseDetail } from '../types/exercise';

interface KidExerciseViewProps {
  exercise: ExerciseDetail;
  onBack: () => void;
  onOpenPuzzle: () => void;
}

/**
 * Giao diện bài Lớp 3–5 (PUZZLE_BLOCK): không có trình soạn code hay terminal, chỉ có
 * câu chuyện dẫn dắt, ảnh minh họa và nút vào trò chơi xếp khối. Chữ lớn, bo góc lớn,
 * màu tươi sáng để trẻ nhỏ dễ đọc và bấm.
 */
export const KidExerciseView: React.FC<KidExerciseViewProps> = ({ exercise, onBack, onOpenPuzzle }) => {
  const story = exercise.storyContext?.trim() || exercise.description;
  return (
    <div className="flex flex-col gap-5" data-testid="kid-exercise-view">
      <div className="flex items-center gap-4 rounded-3xl bg-gradient-to-r from-orange-400 via-pink-500 to-fuchsia-500 p-5 text-white shadow-lg">
        <button
          onClick={onBack}
          aria-label="Quay lại danh sách bài"
          className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-2xl bg-white/25 hover:bg-white/40"
        >
          <ArrowLeft size={24} strokeWidth={2.5} />
        </button>
        <div className="min-w-0">
          <p className="flex items-center gap-1 text-sm font-bold uppercase tracking-wide opacity-90">
            <Sparkles size={16} /> Thử thách của bé
          </p>
          <h1 className="truncate text-2xl font-black sm:text-3xl">{exercise.title}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <section className="rounded-2xl border-4 border-amber-300 bg-amber-50 p-6 text-slate-800 shadow-md dark:bg-amber-950/40 dark:text-amber-50">
          <h2 className="mb-3 flex items-center gap-2 text-xl font-black">
            <Star className="text-amber-500" fill="currentColor" /> Câu chuyện
          </h2>
          <p className="whitespace-pre-wrap text-lg font-semibold leading-relaxed">{story}</p>
        </section>

        <section className="flex items-center justify-center rounded-2xl border-4 border-sky-300 bg-sky-50 p-4 shadow-md dark:bg-sky-950/40">
          {exercise.illustrationUrl ? (
            <img
              src={exercise.illustrationUrl}
              alt={`Hình minh họa: ${exercise.title}`}
              className="max-h-72 w-full rounded-xl object-contain"
            />
          ) : (
            <div className="flex h-48 w-full flex-col items-center justify-center gap-2 text-sky-600">
              <Puzzle size={64} strokeWidth={1.75} />
              <span className="text-base font-bold">Hình minh họa sắp có</span>
            </div>
          )}
        </section>
      </div>

      <button
        onClick={onOpenPuzzle}
        className="flex cursor-pointer items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 px-6 py-5 text-2xl font-black text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-95"
      >
        <Puzzle size={32} strokeWidth={2.5} /> Chơi xếp khối ngay!
      </button>
    </div>
  );
};
