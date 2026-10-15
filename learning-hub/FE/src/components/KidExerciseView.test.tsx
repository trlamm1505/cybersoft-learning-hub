import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { KidExerciseView } from './KidExerciseView';
import type { ExerciseDetail } from '../types/exercise';

const ex = {
  _id: '1',
  slug: 'k3-5-x',
  title: 'Thu thập ngôi sao',
  description: 'mô tả',
  storyContext: 'Chú robot lạc trong rừng sao.',
  illustrationUrl: 'https://example.com/a.png',
  type: 'CODE_BLOCK',
  difficulty: 'EASY',
  points: 10,
  starterCode: '',
  timeLimitMs: 2000,
  testCases: [],
  hiddenTestCount: 0,
} as ExerciseDetail;

describe('KidExerciseView', () => {
  it('hiện câu chuyện + ảnh + nút chơi, không có trình soạn code/terminal', () => {
    const html = renderToString(<KidExerciseView exercise={ex} onBack={vi.fn()} onOpenPuzzle={vi.fn()} />);
    expect(html).toContain('Chú robot lạc trong rừng sao.');
    expect(html).toContain('https://example.com/a.png');
    expect(html).toContain('Chơi xếp khối ngay!');
    expect(html).not.toMatch(/<textarea|<pre|monaco|Submit|Run</);
  });

  it('thiếu storyContext thì dùng mô tả, thiếu ảnh thì hiện chỗ giữ chỗ', () => {
    const html = renderToString(
      <KidExerciseView exercise={{ ...ex, storyContext: '', illustrationUrl: '' }} onBack={vi.fn()} onOpenPuzzle={vi.fn()} />,
    );
    expect(html).toContain('mô tả');
    expect(html).toContain('Hình minh họa sắp có');
  });
});
