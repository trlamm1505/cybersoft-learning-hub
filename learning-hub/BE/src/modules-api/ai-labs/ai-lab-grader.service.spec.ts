import { BadRequestException } from '@nestjs/common';
import type { DatasetIntegrationService } from '../../integration/dataset-integration.service';
import type { EvaluationSetContract } from '../../integration/dataset-contract.types';
import {
  AiLabGraderService,
  BUDGET_PENALTY_RATIO,
  CATALOG_HASH,
  KEYWORD_STUFFING_WARNING,
  computeFinalScore,
  detectKeywordStuffing,
  tokenF1,
} from './ai-lab-grader.service';
import type { AiLabGradeTarget } from './ai-lab-grader.service';
import type { AiLabSpec } from './ai-lab.catalog';
import {
  API_KEY_LEAK_MESSAGE,
  NoSecretsPipe,
  containsSecret,
} from './secret-guard';

const EVAL_SET: EvaluationSetContract = {
  resource_id: 'eval-test-v1',
  name: 'Bộ test',
  version: 'v1.0',
  corpus_id: 'corpus-test',
  checksum: 'checksum-test',
  items: [
    {
      question_id: 'Q010',
      query:
        'Cần tham gia tối thiểu bao nhiêu phần trăm số buổi học để xét tốt nghiệp?',
      category: 'standard_qa',
      expected_behavior: 'ANSWER',
      ground_truths: [
        'Học viên phải bảo đảm tham gia tối thiểu 80% tổng số buổi học của toàn bộ khóa học để đủ điều kiện xét tốt nghiệp.',
      ],
      expected_doc_ids: ['CS-POL-003'],
    },
    {
      question_id: 'Q065',
      query: 'Học phí khóa Quantum Computing là bao nhiêu?',
      category: 'unanswerable_out_of_domain',
      expected_behavior: 'ABSTAIN',
      ground_truths: [
        'Tài liệu cơ sở tri thức hiện tại của CyberSoft không có danh mục khóa học Điện toán lượng tử và không có thông tin biểu phí cho môn học này.',
      ],
      expected_doc_ids: [],
    },
  ],
};

const spec = (budget: AiLabSpec['budget']): AiLabSpec => ({
  rag: false,
  techniques: [
    { id: 'role', label: 'Vai trò', hint: '', pattern: '(bạn là)', weight: 1 },
    {
      id: 'abstain',
      label: 'Biết từ chối',
      hint: '',
      pattern: '(không có thông tin)',
      weight: 1,
      criticalFor: ['unanswerable_out_of_domain'],
    },
  ],
  passQuality: 50,
  budget,
});

const GENEROUS: AiLabGradeTarget = {
  resource_id: 'eval-test-v1',
  points: 10,
  aiLabSpec: spec({ maxCostUsd: 1, maxLatencyMs: 60_000 }),
};
// Ngân sách 0: mọi lần chạy đều vượt cả cost lẫn latency.
const TIGHT: AiLabGradeTarget = {
  ...GENEROUS,
  aiLabSpec: spec({ maxCostUsd: 0, maxLatencyMs: 0 }),
};

const GOOD_PROMPT =
  'Bạn là trợ giảng học vụ CyberSoft. Trả lời ngắn gọn tối đa 2 câu. Nếu tài liệu không có, nói "không có thông tin".';
const INPUT = {
  prompt: GOOD_PROMPT,
  model: 'gemini-2.5-flash',
  config: { temperature: 0.2, maxTokens: 256 },
};

describe('AiLabGraderService', () => {
  let datasets: { fetchEvaluationSet: jest.Mock };
  let grader: AiLabGraderService;

  beforeEach(() => {
    datasets = { fetchEvaluationSet: jest.fn().mockResolvedValue(EVAL_SET) };
    grader = new AiLabGraderService(
      datasets as unknown as DatasetIntegrationService,
    );
  });

  describe('Case 1: chặn API key trong submission', () => {
    it('chặn prompt chứa sk-12345... trước khi gọi TTS 01 hay chấm', async () => {
      const promise = grader.grade(GENEROUS, {
        ...INPUT,
        prompt: `${GOOD_PROMPT}\nOPENAI_KEY=sk-1234567890abcdefXYZ`,
      });

      await expect(promise).rejects.toBeInstanceOf(BadRequestException);
      await expect(promise).rejects.toThrow(API_KEY_LEAK_MESSAGE);
      expect(datasets.fetchEvaluationSet).not.toHaveBeenCalled();
    });

    it('thông báo lỗi không lặp lại chuỗi key bị chặn', async () => {
      const err = await grader
        .grade(GENEROUS, { ...INPUT, prompt: 'sk-proj-abcdef1234567890' })
        .catch((e: BadRequestException) => e);

      expect(
        JSON.stringify((err as BadRequestException).getResponse()),
      ).not.toContain('sk-proj-abcdef1234567890');
    });

    it('chặn key giấu trong config (trường lạ)', async () => {
      await expect(
        grader.grade(GENEROUS, {
          ...INPUT,
          config: {
            ...INPUT.config,
            apiKey: 'AIzaSyA1b2C3d4E5f6G7h8I9j0KlMnOpQrStUvW',
          },
        }),
      ).rejects.toThrow(API_KEY_LEAK_MESSAGE);
    });

    it.each([
      ['OpenAI', 'sk-12345678abcdefgh'],
      ['Anthropic', 'sk-ant-api03-abcdefghij123456'],
      ['Google', 'AIzaSyA1b2C3d4E5f6G7h8I9j0KlMnOpQrStUvW'],
      ['GitHub', 'ghp_abcdefghijklmnopqrstuvwxyz0123456789'],
      ['AWS', 'AKIAIOSFODNN7EXAMPLE'],
      ['gán tường minh', 'api_key = "Zx9fQ2mL7pR4tV8wY1bN"'],
    ])('NoSecretsPipe chặn key dạng %s', (_name, secret) => {
      const pipe = new NoSecretsPipe();
      expect(() => pipe.transform({ prompt: `Dùng ${secret} nhé` })).toThrow(
        API_KEY_LEAK_MESSAGE,
      );
    });

    it('không chặn nhầm prompt bình thường có chữ giống tiền tố', () => {
      const pipe = new NoSecretsPipe();
      const body = {
        prompt:
          'Bạn là mentor. Phân tích task-oriented và risk-based, dùng sklearn, key: giá trị.',
        model: 'gemini-2.5-flash',
        config: { temperature: 0.2, maxTokens: 256 },
      };

      expect(pipe.transform(body)).toBe(body);
      expect(containsSecret(body)).toBe(false);
    });
  });

  describe('Case 2: chấm kết hợp chất lượng và chi phí', () => {
    it('computeFinalScore: điểm theo chất lượng, trừ 20% điểm tối đa cho mỗi lần vượt ngân sách', () => {
      const s = spec({ maxCostUsd: 0.001, maxLatencyMs: 1000 });

      expect(
        computeFinalScore(
          { qualityScore: 80, cost: 0.0005, latency: 800 },
          10,
          s,
        ),
      ).toEqual({
        score: 8,
        penalties: [],
        status: 'PASSED',
      });

      const overCost = computeFinalScore(
        { qualityScore: 80, cost: 0.002, latency: 800 },
        10,
        s,
      );
      expect(overCost.score).toBe(6);
      expect(overCost.penalties).toEqual([
        { type: 'COST', limit: 0.001, actual: 0.002, points: 2 },
      ]);
      expect(overCost.status).toBe('FAILED');

      const overBoth = computeFinalScore(
        { qualityScore: 80, cost: 0.002, latency: 1500 },
        10,
        s,
      );
      expect(overBoth.score).toBe(4);
      expect(overBoth.penalties.map((p) => p.type)).toEqual([
        'COST',
        'LATENCY',
      ]);

      // Điểm không âm; chất lượng dưới ngưỡng thì FAILED dù trong ngân sách.
      expect(
        computeFinalScore({ qualityScore: 30, cost: 1, latency: 9999 }, 10, s)
          .score,
      ).toBe(0);
      expect(
        computeFinalScore({ qualityScore: 40, cost: 0, latency: 0 }, 10, s)
          .status,
      ).toBe('FAILED');
    });

    it('qualityScore là trung bình F1 từng câu x100; trong ngân sách thì không bị trừ', async () => {
      const r = await grader.grade(GENEROUS, INPUT);
      const items = (r.runManifest as any).items as Array<{
        f1: number;
        costUsd: number;
        latencyMs: number;
      }>;

      const meanF1 = items.reduce((s, i) => s + i.f1, 0) / items.length;
      expect(r.qualityScore).toBeCloseTo(meanF1 * 100, 0);
      expect(r.qualityScore).toBeGreaterThan(50);
      expect(r.cost).toBeCloseTo(
        items.reduce((s, i) => s + i.costUsd, 0),
        6,
      );
      expect(r.latency).toBe(
        Math.round(items.reduce((s, i) => s + i.latencyMs, 0) / items.length),
      );
      expect(r.penalties).toEqual([]);
      expect(r.score).toBeCloseTo((10 * r.qualityScore) / 100, 1);
      expect(r.status).toBe('PASSED');
    });

    it('cùng bài làm nhưng vượt cost và latency: giữ nguyên quality, trừ đúng 2 x 20% điểm', async () => {
      const ok = await grader.grade(GENEROUS, INPUT);
      const over = await grader.grade(TIGHT, INPUT);

      expect(over.qualityScore).toBe(ok.qualityScore);
      expect(over.penalties.map((p) => p.type)).toEqual(['COST', 'LATENCY']);
      expect(
        over.penalties.every((p) => p.points === 10 * BUDGET_PENALTY_RATIO),
      ).toBe(true);
      expect(over.score).toBeCloseTo(
        Math.max(0, ok.score - 2 * 10 * BUDGET_PENALTY_RATIO),
        1,
      );
      expect(over.status).toBe('FAILED');
    });

    it('prompt thiếu kỹ thuật bắt buộc: câu ngoài phạm vi bị trả lời bịa, chất lượng tụt', async () => {
      const good = await grader.grade(GENEROUS, INPUT);
      const bare = await grader.grade(GENEROUS, {
        ...INPUT,
        prompt: 'Trả lời câu hỏi.',
      });
      const abstainItem = (bare.runManifest as any).items.find(
        (i: any) => i.question_id === 'Q065',
      );

      expect(abstainItem.failedByMissingTechnique).toBe(true);
      expect(bare.techniques.every((t) => !t.matched)).toBe(true);
      expect(bare.qualityScore).toBeLessThan(good.qualityScore);
    });

    it('model đắt hơn và prompt dài hơn thì cost cao hơn', async () => {
      const flash = await grader.grade(GENEROUS, INPUT);
      const pro = await grader.grade(GENEROUS, {
        ...INPUT,
        model: 'gemini-2.5-pro',
      });
      const longPrompt = await grader.grade(GENEROUS, {
        ...INPUT,
        prompt: GOOD_PROMPT + ' Hãy đọc kỹ.'.repeat(200),
      });

      expect(pro.cost).toBeGreaterThan(flash.cost);
      expect(pro.latency).toBeGreaterThan(flash.latency);
      expect(longPrompt.cost).toBeGreaterThan(flash.cost);
    });

    it('maxTokens quá nhỏ làm cắt câu trả lời (prompt không giới hạn độ dài nên trả lời dài dòng)', async () => {
      const r = await grader.grade(GENEROUS, {
        prompt:
          'Bạn là trợ giảng. Nếu tài liệu không có, nói "không có thông tin".',
        model: 'gemini-2.5-pro',
        config: { temperature: 0, maxTokens: 32 },
      });
      const items = (r.runManifest as any).items as Array<{
        truncated: boolean;
        outputTokens: number;
      }>;

      expect(items.some((i) => i.truncated)).toBe(true);
      expect(items.every((i) => i.outputTokens <= 32)).toBe(true);
    });
  });

  describe('tái lập ở mức cấu hình', () => {
    it('cùng prompt + model + config + evaluation set cho cùng kết quả và cùng manifest', async () => {
      const a = await grader.grade(GENEROUS, INPUT);
      const b = await grader.grade(GENEROUS, INPUT);

      expect(b.runManifest).toEqual(a.runManifest);
      expect(b.qualityScore).toBe(a.qualityScore);
    });

    it('đổi cấu hình thì đổi seed; manifest ghi đủ thông tin để chạy lại', async () => {
      const a = await grader.grade(GENEROUS, INPUT);
      const b = await grader.grade(GENEROUS, {
        ...INPUT,
        config: { temperature: 0.9, maxTokens: 256 },
      });
      const m = a.runManifest as any;

      expect((b.runManifest as any).seed).not.toBe(m.seed);
      expect(m.evaluationSet).toMatchObject({
        resource_id: 'eval-test-v1',
        checksum: 'checksum-test',
      });
      expect(m.model.id).toBe('gemini-2.5-flash');
      expect(m.config).toEqual({ temperature: 0.2, maxTokens: 256 });
      expect(m.promptSha256).toMatch(/^[0-9a-f]{64}$/);
      expect(JSON.stringify(m)).not.toContain(GOOD_PROMPT);
    });
  });

  describe('kiểm tra đầu vào', () => {
    it('bỏ khóa lạ khỏi config, không lưu', async () => {
      const r = await grader.grade(GENEROUS, {
        ...INPUT,
        config: { ...INPUT.config, note: 'abc' },
      });

      expect(r.normalized.config).toEqual({ temperature: 0.2, maxTokens: 256 });
    });

    it.each([
      [{ temperature: 2, maxTokens: 256 }, 'temperature'],
      [{ temperature: 0.2, maxTokens: 5000 }, 'maxTokens'],
      [{ temperature: 0.2, maxTokens: 100.5 }, 'maxTokens'],
    ])('từ chối config ngoài giới hạn %j', async (config, field) => {
      await expect(
        grader.grade(GENEROUS, { ...INPUT, config }),
      ).rejects.toThrow(field);
    });

    it('bài RAG bắt buộc topK và embeddingModel hợp lệ', async () => {
      const rag = {
        ...GENEROUS,
        aiLabSpec: { ...GENEROUS.aiLabSpec, rag: true },
      };

      await expect(grader.grade(rag, INPUT)).rejects.toThrow('topK');
      await expect(
        grader.grade(rag, {
          ...INPUT,
          config: { ...INPUT.config, topK: 3, embeddingModel: 'x' },
        }),
      ).rejects.toThrow('embeddingModel');
      await expect(
        grader.grade(rag, {
          ...INPUT,
          config: {
            ...INPUT.config,
            topK: 3,
            embeddingModel: 'gemini-embedding-001',
          },
        }),
      ).resolves.toMatchObject({ maxScore: 10 });
    });

    it('từ chối model ngoài danh mục', async () => {
      await expect(
        grader.grade(GENEROUS, { ...INPUT, model: 'gpt-x' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('[H3] chống nhồi từ khóa', () => {
    const SOUP_SPEC: AiLabSpec = {
      rag: false,
      techniques: [
        {
          id: 'role',
          label: 'Vai trò',
          hint: '',
          pattern: '(bạn là)',
          weight: 1,
        },
        {
          id: 'concise',
          label: 'Ngắn',
          hint: '',
          pattern: '(ngắn gọn)',
          weight: 1,
        },
        {
          id: 'grounded',
          label: 'Nguồn',
          hint: '',
          pattern: '(chỉ dùng)',
          weight: 1,
        },
        {
          id: 'abstain',
          label: 'Từ chối',
          hint: '',
          pattern: '(không có thông tin)',
          weight: 1,
          criticalFor: ['unanswerable_out_of_domain'],
        },
      ],
      passQuality: 50,
      budget: { maxCostUsd: 1, maxLatencyMs: 60_000 },
    };
    const target: AiLabGradeTarget = { ...GENEROUS, aiLabSpec: SOUP_SPEC };

    it('chuỗi từ khóa rời rạc: không tính kỹ thuật nào, có cảnh báo, điểm thấp', async () => {
      const soup = await grader.grade(target, {
        ...INPUT,
        prompt: 'bạn là ngắn gọn chỉ dùng không có thông tin',
      });
      const real = await grader.grade(target, {
        ...INPUT,
        prompt:
          'Bạn là trợ giảng học vụ của CyberSoft và trả lời câu hỏi của học viên. Chỉ dùng thông tin trong tài liệu được cung cấp. Nếu tài liệu không có thông tin thì nói rõ điều đó. Trả lời ngắn gọn trong một câu.',
      });

      expect(soup.structureWarning).toBe(KEYWORD_STUFFING_WARNING);
      expect(soup.techniques.every((t) => !t.matched)).toBe(true);
      expect((soup.runManifest as any).structureWarning).toBe(
        KEYWORD_STUFFING_WARNING,
      );
      expect(real.structureWarning).toBeNull();
      expect(real.techniques.every((t) => t.matched)).toBe(true);
      expect(soup.qualityScore).toBeLessThan(real.qualityScore);
    });

    it('detectKeywordStuffing: ít hơn 3 kỹ thuật thì không xét; câu đầy đủ thì không bị gắn cờ', () => {
      expect(detectKeywordStuffing('bạn là ngắn gọn', 2)).toBe(false);
      expect(
        detectKeywordStuffing('a b c d e f g h {{context}} {{question}}', 8),
      ).toBe(true);
      const full = Array.from(
        { length: 4 },
        () => 'Đây là một câu hướng dẫn đầy đủ cho mô hình.',
      ).join(' ');
      expect(detectKeywordStuffing(full, 3)).toBe(false);
    });
  });

  it('[L4] hash bảng giá nằm trong manifest và là một phần của seed', async () => {
    const r = await grader.grade(GENEROUS, INPUT);
    expect((r.runManifest as any).catalogHash).toBe(CATALOG_HASH);
    expect(CATALOG_HASH).toMatch(/^[0-9a-f]{16}$/);
  });

  it('tokenF1 tính theo túi từ, không phân biệt hoa thường và dấu câu', () => {
    expect(tokenF1('Tối thiểu 80%.', 'tối thiểu 80%')).toBe(1);
    expect(tokenF1('a b c', 'a b d')).toBeCloseTo(2 / 3, 5);
    expect(tokenF1('', 'a')).toBe(0);
  });
});
