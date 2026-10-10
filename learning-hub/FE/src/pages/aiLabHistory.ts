import type { AiLabHistoryEntry, AiLabRun } from '../types/aiLab';

/** Lịch sử mới nhất trước (BE lưu cũ trước, mới sau). */
export const newestFirst = (history: AiLabHistoryEntry[] = []): AiLabHistoryEntry[] => [...history].reverse();

/**
 * Dựng lại một lần chạy trong lịch sử thành dạng AiLabRun để dùng chung bảng
 * Run Manifest. Giữ submissionId / tổng số lần / điểm cao nhất của bài hiện tại.
 */
export function historyEntryToRun(entry: AiLabHistoryEntry, current: AiLabRun): AiLabRun {
  return {
    ...current,
    submittedAt: entry.createdAt,
    status: entry.status,
    qualityScore: entry.qualityScore,
    cost: entry.cost,
    latency: entry.latency,
    score: entry.score,
    runManifest: entry.runManifest,
    prompt: entry.prompt,
    model: entry.model,
    config: entry.config,
  };
}
