import { describe, expect, it } from 'vitest';
import { historyEntryToRun, newestFirst } from './aiLabHistory';
import type { AiLabHistoryEntry, AiLabRun } from '../types/aiLab';

const entry = (n: number): AiLabHistoryEntry => ({
  promptHash: `hash-${n}`,
  prompt: `prompt ${n}`,
  model: 'gemini-2.5-flash',
  config: { temperature: 0.2, maxTokens: 256 },
  score: n,
  qualityScore: n * 10,
  cost: 0.001 * n,
  latency: 100 * n,
  status: n >= 5 ? 'PASSED' : 'FAILED',
  runManifest: { seed: `seed-${n}` } as unknown as AiLabHistoryEntry['runManifest'],
  createdAt: `2026-10-03T10:0${n}:00Z`,
});

describe('Lịch sử thí nghiệm AI Lab', () => {
  it('hiển thị mới nhất trước, không đổi mảng gốc', () => {
    const history = [entry(1), entry(2), entry(3)];
    expect(newestFirst(history).map((h) => h.score)).toEqual([3, 2, 1]);
    expect(history.map((h) => h.score)).toEqual([1, 2, 3]);
    expect(newestFirst(undefined)).toEqual([]);
  });

  it('xem một lần cũ: dùng số liệu và manifest của lần đó, giữ thông tin tổng của bài', () => {
    const current = {
      submissionId: 'sub-1',
      submittedAt: '2026-10-03T11:00:00Z',
      status: 'PASSED',
      qualityScore: 90,
      cost: 0.01,
      latency: 900,
      score: 9,
      maxScore: 10,
      totalAttempts: 7,
      history: [entry(2), entry(9)],
      runManifest: { seed: 'latest' },
    } as unknown as AiLabRun;

    const viewed = historyEntryToRun(entry(2), current);

    expect(viewed).toMatchObject({
      score: 2,
      qualityScore: 20,
      status: 'FAILED',
      submittedAt: '2026-10-03T10:02:00Z',
      runManifest: { seed: 'seed-2' },
      prompt: 'prompt 2',
      maxScore: 10,
      totalAttempts: 7,
      submissionId: 'sub-1',
    });
  });
});
