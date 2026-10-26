import { buildIntegritySignals } from './integrity-signals';
import { INTEGRITY_CONFIG } from './integrity.config';

const NOW = new Date('2026-10-05T10:00:00.000Z');
const at = (secondsBeforeNow: number) =>
  new Date(NOW.getTime() - secondsBeforeNow * 1000).toISOString();

/** `n` lần rời tab, mỗi lần `awaySeconds` giây, rải trong 20 phút làm bài. */
const leaves = (n: number, awaySeconds: number) =>
  Array.from({ length: n }, (_, i) => ({
    leftAt: at(1200 - i * 100),
    returnedAt: at(1200 - i * 100 - awaySeconds),
  }));

const NO_SIMILARITY = { score: 0 };

describe('buildIntegritySignals — ghi nhận timeline', () => {
  it('thời điểm nộp luôn là của server, tính tổng và thời lượng thao tác thực tế', () => {
    const s = buildIntegritySignals(
      {
        startedAt: at(1200),
        focusEvents: [{ leftAt: at(900), returnedAt: at(840) }],
        editMarks: [{ at: at(1000), charCount: 120 }],
      },
      NO_SIMILARITY,
      NOW,
    );
    expect(s.timeline.submittedAt).toEqual(NOW);
    expect(s.timeline.totalSeconds).toBe(1200);
    expect(s.focusSummary).toEqual({ count: 1, totalAwaySeconds: 60 });
    expect(s.timeline.activeSeconds).toBe(1140);
    expect(s.timeline.editMarks).toHaveLength(1);
    expect(s.timeline.editMarks[0].charCount).toBe(120);
  });

  it('thiếu payload: chỉ ghi mốc nộp, không gắn cờ', () => {
    const s = buildIntegritySignals(undefined, NO_SIMILARITY, NOW);
    expect(s.timeline.totalSeconds).toBe(0);
    expect(s.flag).toBe('NONE');
    expect(s.reviewStatus).toBe('NORMAL');
    expect(s.reasons).toEqual([]);
  });

  it('không tin client: startedAt trong tương lai bị kéo về lúc nộp; sự kiện lỗi bị bỏ', () => {
    const s = buildIntegritySignals(
      {
        startedAt: new Date(NOW.getTime() + 3_600_000).toISOString(),
        focusEvents: [
          { leftAt: 'khong-phai-ngay', returnedAt: at(10) },
          { leftAt: at(10), returnedAt: at(100) }, // quay lại trước khi rời
        ],
        editMarks: [{ at: at(5), charCount: -3 }],
      },
      NO_SIMILARITY,
      NOW,
    );
    expect(s.timeline.totalSeconds).toBe(0);
    expect(s.focusEvents).toHaveLength(0);
    expect(s.timeline.editMarks).toHaveLength(0);
  });

  it('chặn payload phình to: tối đa số sự kiện cho phép', () => {
    const s = buildIntegritySignals(
      { startedAt: at(100000), focusEvents: leaves(500, 1) },
      NO_SIMILARITY,
      NOW,
    );
    expect(s.focusEvents.length).toBeLessThanOrEqual(
      INTEGRITY_CONFIG.maxFocusEvents,
    );
  });
});

describe('buildIntegritySignals — ca nhận diện nhầm (false-positive)', () => {
  it('chuyển tab ít lần/ngắn (dưới ngưỡng) → KHÔNG gắn cờ', () => {
    const s = buildIntegritySignals(
      { startedAt: at(1200), focusEvents: leaves(2, 20) },
      NO_SIMILARITY,
      NOW,
    );
    expect(s.focusSummary.count).toBe(2);
    expect(s.flag).toBe('NONE');
    expect(s.reviewStatus).toBe('NORMAL');
  });

  it('nhiều lần nhưng mỗi lần rất ngắn (tổng dưới ngưỡng) → KHÔNG gắn cờ', () => {
    const s = buildIntegritySignals(
      { startedAt: at(1200), focusEvents: leaves(8, 5) },
      NO_SIMILARITY,
      NOW,
    );
    expect(s.focusSummary.count).toBe(8);
    expect(s.focusSummary.totalAwaySeconds).toBe(40);
    expect(s.flag).toBe('NONE');
  });

  it('ít lần nhưng một lần rời rất lâu (ví dụ họp, mất mạng) → KHÔNG gắn cờ', () => {
    const s = buildIntegritySignals(
      { startedAt: at(1200), focusEvents: leaves(1, 600) },
      NO_SIMILARITY,
      NOW,
    );
    expect(s.flag).toBe('NONE');
  });

  it('nộp rất nhanh cho bài dễ → chỉ ghi mốc thời gian, không gắn cờ, không lý do', () => {
    const s = buildIntegritySignals({ startedAt: at(8) }, NO_SIMILARITY, NOW);
    expect(s.timeline.totalSeconds).toBe(8);
    expect(s.flag).toBe('NONE');
    expect(s.reviewStatus).toBe('NORMAL');
    expect(s.reasons).toEqual([]);
    expect(s.decision).toBeUndefined();
  });

  it('tương đồng dưới ngưỡng → không gắn cờ', () => {
    const s = buildIntegritySignals(
      { startedAt: at(600) },
      { score: INTEGRITY_CONFIG.similarityThreshold - 0.01 },
      NOW,
    );
    expect(s.similarity.flagged).toBe(false);
    expect(s.flag).toBe('NONE');
  });
});

describe('buildIntegritySignals — gắn cờ chỉ để xem xét', () => {
  it('tương đồng ≥ ngưỡng → cần xem xét, lý do nêu rõ chưa kết luận, chưa có quyết định', () => {
    const s = buildIntegritySignals(
      { startedAt: at(600) },
      { score: 0.93, submissionId: 'sub-x', userId: 'u2' },
      NOW,
    );
    expect(s.flag).toBe('REVIEW');
    expect(s.reviewStatus).toBe('NEEDS_REVIEW');
    expect(s.similarity).toMatchObject({
      flagged: true,
      score: 0.93,
      matchedSubmissionId: 'sub-x',
    });
    expect(s.reasons[0]).toMatch(/chưa kết luận/);
    expect(s.decision).toBeUndefined();
    expect(s.reviewedBy).toBeUndefined();
  });

  it('rời màn hình nhiều lần VÀ tổng thời gian lớn → cần xem xét', () => {
    const s = buildIntegritySignals(
      { startedAt: at(1200), focusEvents: leaves(6, 50) },
      NO_SIMILARITY,
      NOW,
    );
    expect(s.focusSummary).toEqual({ count: 6, totalAwaySeconds: 300 });
    expect(s.flag).toBe('REVIEW');
    expect(s.reasons[0]).toMatch(/lý do chính đáng/);
  });

  it('kết quả không chứa trường điểm/hủy bài nào', () => {
    const s = buildIntegritySignals(
      { startedAt: at(1200), focusEvents: leaves(6, 50) },
      { score: 0.99 },
      NOW,
    );
    for (const key of ['score', 'penalty', 'voided', 'cancelled', 'status']) {
      expect(Object.keys(s)).not.toContain(key);
    }
  });
});
