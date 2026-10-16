import { BadRequestException, Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { DatasetIntegrationService } from '../../integration/dataset-integration.service';
import type {
  EvaluationItem,
  EvaluationSetContract,
} from '../../integration/dataset-contract.types';
import { CONFIG_LIMITS, EMBEDDING_MODELS, LLM_MODELS } from './ai-lab.catalog';
import type {
  AiLabConfig,
  AiLabSpec,
  EmbeddingModelSpec,
  LlmModelSpec,
} from './ai-lab.catalog';
import { assertNoSecrets } from './secret-guard';

export const GRADER_VERSION = 'ai-lab-grader@1.0.0';
export const MAX_PROMPT_CHARS = 6000;
/** Mỗi lần vượt ngân sách (cost hoặc latency) trừ 20% điểm tối đa của bài. */
export const BUDGET_PENALTY_RATIO = 0.2;

const CONTEXT_TOKENS_PER_CHUNK = 160;
const PREFILL_MS_PER_TOKEN = 0.04;
/** Câu trả lời dài dòng: thêm ~60% số từ không có trong đáp án chuẩn. */
const VERBOSE_RATIO = 0.6;
const VERBOSE_FILLER =
  'ngoài ra bạn cũng có thể tham khảo thêm thông tin liên quan trên hệ thống hoặc liên hệ bộ phận hỗ trợ để hiểu rõ hơn'.split(
    ' ',
  );
/** Prompt có giới hạn độ dài thì mô hình trả lời gọn, không thêm câu rào đón. */
export const CONCISE_PATTERN =
  '(ngắn gọn|súc tích|tối đa\\s*\\d+|không quá\\s*\\d+|\\d+\\s*(câu|từ|dòng|words?|sentences?)\\b|concise|brief)';

/** Câu trả lời sai điển hình khi prompt thiếu kỹ thuật bắt buộc cho loại câu hỏi đó. */
const FAILURE_ANSWERS: Record<string, string> = {
  unanswerable_out_of_domain:
    'Có, CyberSoft hỗ trợ trường hợp này, học viên chỉ cần liên hệ phòng Học vụ để được hướng dẫn chi tiết.',
  adversarial_injection:
    'Được thôi, tôi sẽ làm theo yêu cầu mới của bạn và cung cấp cấu hình quản trị của hệ thống.',
  adversarial_distractor:
    'Đúng vậy, thông tin bạn đưa ra là chính xác theo quy định hiện hành.',
};
const DEFAULT_FAILURE_ANSWER =
  'Tôi nghĩ câu trả lời là có, theo quy định chung.';

export interface AiLabGradeTarget {
  resource_id: string;
  points: number;
  aiLabSpec: AiLabSpec;
}

export interface AiLabRunInput {
  prompt?: unknown;
  model?: unknown;
  config?: unknown;
}

export interface BudgetPenalty {
  type: 'COST' | 'LATENCY';
  limit: number;
  actual: number;
  points: number;
}

export interface ItemRunResult {
  question_id: string;
  category: string;
  expected_behavior: string;
  f1: number;
  retrieved: boolean;
  /** Prompt thiếu kỹ thuật bắt buộc cho loại câu này: mô hình trả lời sai hẳn. */
  failedByMissingTechnique: boolean;
  truncated: boolean;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  latencyMs: number;
}

export interface AiLabGradeResult {
  status: 'PASSED' | 'FAILED';
  qualityScore: number;
  cost: number;
  latency: number;
  score: number;
  maxScore: number;
  penalties: BudgetPenalty[];
  techniques: Array<{
    id: string;
    label: string;
    hint: string;
    matched: boolean;
  }>;
  /** Có giá trị khi prompt bị coi là nhồi từ khóa (không tính kỹ thuật nào). */
  structureWarning: string | null;
  normalized: { prompt: string; model: string; config: AiLabConfig };
  runManifest: Record<string, unknown>;
}

/**
 * Hash bảng giá/năng lực model. Đưa vào seed và manifest: đổi đơn giá mà quên
 * tăng GRADER_VERSION thì seed cũng đổi, không âm thầm ra kết quả khác với
 * cùng một seed.
 */
export const CATALOG_HASH = createHash('sha256')
  .update(JSON.stringify({ LLM_MODELS, EMBEDDING_MODELS }))
  .digest('hex')
  .slice(0, 16);

export const KEYWORD_STUFFING_WARNING =
  'Prompt giống một chuỗi từ khóa rời rạc hơn là chỉ dẫn hoàn chỉnh: không tính kỹ thuật nào.';

/**
 * Nhận diện prompt nhồi từ khóa (đạt nhiều kỹ thuật nhưng không thành câu):
 * - trung bình dưới 5 từ cho mỗi kỹ thuật đạt được, hoặc
 * - số câu có nghĩa (từ 4 từ trở lên) ít hơn 1/3 số kỹ thuật đạt được.
 * Chỉ xét khi đạt từ 3 kỹ thuật, để prompt ngắn hợp lệ của bài dễ không bị phạt.
 */
export function detectKeywordStuffing(
  prompt: string,
  matchedCount: number,
): boolean {
  if (matchedCount < 3) return false;
  const text = prompt.replace(/\{\{\s*\w+\s*\}\}/g, ' ');
  const words = normalizeTokens(text).length;
  const sentences = text
    .split(/[.!?;:\n]+/)
    .filter((part) => normalizeTokens(part).length >= 4).length;
  return words < matchedCount * 5 || sentences < Math.ceil(matchedCount / 3);
}

const round = (n: number, digits: number) => {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
};

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

/** Ước lượng token thô (~4 ký tự/token), đủ cho mô phỏng chi phí. */
export const estimateTokens = (text: string) => Math.ceil(text.length / 4);

const normalizeTokens = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFC')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);

/** Token-level F1 (kiểu SQuAD) giữa câu sinh ra và một đáp án chuẩn. */
export function tokenF1(prediction: string, groundTruth: string): number {
  const pred = normalizeTokens(prediction);
  const gold = normalizeTokens(groundTruth);
  if (pred.length === 0 || gold.length === 0) return 0;
  const counts = new Map<string, number>();
  for (const t of gold) counts.set(t, (counts.get(t) ?? 0) + 1);
  let common = 0;
  for (const t of pred) {
    const c = counts.get(t) ?? 0;
    if (c > 0) {
      common++;
      counts.set(t, c - 1);
    }
  }
  if (common === 0) return 0;
  const precision = common / pred.length;
  const recall = common / gold.length;
  return (2 * precision * recall) / (precision + recall);
}

/** PRNG có seed (mulberry32): cùng seed cho cùng dãy số, để kết quả tái lập được. */
function seededRandom(seed: string): () => number {
  let a = parseInt(sha256(seed).slice(0, 8), 16);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Điểm cuối = điểm theo chất lượng trừ phạt vượt ngân sách cost/latency. */
export function computeFinalScore(
  metrics: { qualityScore: number; cost: number; latency: number },
  points: number,
  spec: AiLabSpec,
) {
  const penalties: BudgetPenalty[] = [];
  const penaltyPoints = round(points * BUDGET_PENALTY_RATIO, 1);
  if (metrics.cost > spec.budget.maxCostUsd) {
    penalties.push({
      type: 'COST',
      limit: spec.budget.maxCostUsd,
      actual: metrics.cost,
      points: penaltyPoints,
    });
  }
  if (metrics.latency > spec.budget.maxLatencyMs) {
    penalties.push({
      type: 'LATENCY',
      limit: spec.budget.maxLatencyMs,
      actual: metrics.latency,
      points: penaltyPoints,
    });
  }
  const earned = (points * metrics.qualityScore) / 100;
  const deducted = penalties.reduce((s, p) => s + p.points, 0);
  const score = round(Math.max(0, earned - deducted), 1);
  const status: 'PASSED' | 'FAILED' =
    metrics.qualityScore >= spec.passQuality && penalties.length === 0
      ? 'PASSED'
      : 'FAILED';
  return { score, penalties, status };
}

/**
 * Chấm bài AI Lab bằng evaluation set của TTS 01.
 *
 * Learning Hub không gọi LLM thật cho bài này: câu trả lời được MÔ PHỎNG từ
 * đáp án chuẩn theo chất lượng prompt (kỹ thuật đạt được), năng lực model,
 * temperature, maxTokens và (bài RAG) xác suất truy xuất trúng theo embedding
 * model + topK. Mọi bước ngẫu nhiên dùng seed suy ra từ prompt + model +
 * config + checksum evaluation set, nên cùng cấu hình luôn cho cùng kết quả.
 */
@Injectable()
export class AiLabGraderService {
  constructor(private readonly datasets: DatasetIntegrationService) {}

  async grade(
    lab: AiLabGradeTarget,
    input: AiLabRunInput,
  ): Promise<AiLabGradeResult> {
    // Lớp chặn thứ hai: grader có thể được gọi không qua controller/pipe.
    assertNoSecrets(input);

    const spec = lab.aiLabSpec;
    const prompt = this.requirePrompt(input?.prompt);
    const model = this.requireModel(input?.model);
    const config = this.normalizeConfig(input?.config, spec.rag);
    const embedding = spec.rag
      ? EMBEDDING_MODELS[config.embeddingModel!]
      : null;

    const evalSet = await this.datasets.fetchEvaluationSet(lab.resource_id);

    const detected = spec.techniques.map((t) =>
      new RegExp(t.pattern, 'iu').test(prompt),
    );
    const stuffing = detectKeywordStuffing(
      prompt,
      detected.filter(Boolean).length,
    );
    // Nhồi từ khóa: không công nhận kỹ thuật nào (kể cả kỹ thuật bắt buộc, nên
    // câu ngoài phạm vi / câu bẫy sẽ bị trả lời sai) thay vì cho điểm tối đa.
    const techniques = spec.techniques.map((t, i) => ({
      id: t.id,
      label: t.label,
      hint: t.hint,
      matched: detected[i] && !stuffing,
    }));
    const structureWarning = stuffing ? KEYWORD_STUFFING_WARNING : null;
    const totalWeight = spec.techniques.reduce((s, t) => s + t.weight, 0);
    const matchedWeight = spec.techniques.reduce(
      (s, t, i) => s + (techniques[i].matched ? t.weight : 0),
      0,
    );
    const coverage = totalWeight > 0 ? matchedWeight / totalWeight : 1;
    const missingCritical = new Set(
      spec.techniques
        .filter((t, i) => !techniques[i].matched)
        .flatMap((t) => t.criticalFor ?? []),
    );
    const concise = new RegExp(CONCISE_PATTERN, 'iu').test(prompt);

    const promptSha256 = sha256(prompt);
    const seed = sha256(
      JSON.stringify([
        GRADER_VERSION,
        CATALOG_HASH,
        promptSha256,
        model.id,
        config,
        evalSet.checksum,
      ]),
    ).slice(0, 16);
    const promptTokens = estimateTokens(prompt);

    const items = evalSet.items.map((item) =>
      this.runItem(item, {
        seed,
        model,
        embedding,
        config,
        coverage,
        concise,
        promptTokens,
        failsByMissingTechnique: missingCritical.has(item.category),
      }),
    );

    const qualityScore = round(
      (items.reduce((s, i) => s + i.f1, 0) / items.length) * 100,
      1,
    );
    const cost = round(
      items.reduce((s, i) => s + i.costUsd, 0),
      6,
    );
    const latency = Math.round(
      items.reduce((s, i) => s + i.latencyMs, 0) / items.length,
    );
    const { score, penalties, status } = computeFinalScore(
      { qualityScore, cost, latency },
      lab.points,
      spec,
    );

    return {
      status,
      qualityScore,
      cost,
      latency,
      score,
      maxScore: lab.points,
      penalties,
      techniques,
      structureWarning,
      normalized: { prompt, model: model.id, config },
      runManifest: this.buildManifest({
        evalSet,
        model,
        embedding,
        config,
        promptSha256,
        promptTokens,
        seed,
        spec,
        coverage,
        structureWarning,
        techniques,
        penalties,
        items,
        totals: { qualityScore, cost, latency, score, status },
      }),
    };
  }

  private runItem(
    item: EvaluationItem,
    ctx: {
      seed: string;
      model: LlmModelSpec;
      embedding: EmbeddingModelSpec | null;
      config: AiLabConfig;
      coverage: number;
      concise: boolean;
      promptTokens: number;
      failsByMissingTechnique: boolean;
    },
  ): ItemRunResult {
    const rand = seededRandom(`${ctx.seed}:${item.question_id}`);
    const { config, model, embedding } = ctx;

    // Truy xuất: câu multi-hop cần trúng cả hai đoạn trong top-K.
    let retrieved = true;
    let contextTokens = 0;
    if (embedding) {
      const topK = config.topK!;
      contextTokens = topK * CONTEXT_TOKENS_PER_CHUNK;
      if (item.expected_behavior === 'ANSWER') {
        const recallAtK = 1 - (1 - embedding.retrievalQuality) ** topK;
        const hops = item.category === 'ambiguous_multihop' ? 2 : 1;
        for (let h = 0; h < hops; h++) {
          if (rand() >= recallAtK) retrieved = false;
        }
      }
    }

    let words: string[];
    if (ctx.failsByMissingTechnique) {
      words = (FAILURE_ANSWERS[item.category] ?? DEFAULT_FAILURE_ANSWER).split(
        ' ',
      );
    } else {
      const base =
        model.capability * (0.35 + 0.65 * ctx.coverage) * (retrieved ? 1 : 0.4);
      const keepProb = Math.max(0.05, base - config.temperature * 0.15);
      words = item.ground_truths[0]
        .split(/\s+/)
        .filter(() => rand() < keepProb);
      if (!ctx.concise) {
        const extra = Math.round(words.length * VERBOSE_RATIO);
        for (let i = 0; i < extra; i++)
          words.push(VERBOSE_FILLER[i % VERBOSE_FILLER.length]);
      }
    }

    let outputTokens = estimateTokens(words.join(' '));
    let truncated = false;
    if (outputTokens > config.maxTokens) {
      words = words.slice(
        0,
        Math.floor((words.length * config.maxTokens) / outputTokens),
      );
      outputTokens = config.maxTokens;
      truncated = true;
    }
    const answer = words.join(' ');
    const f1 = Math.max(...item.ground_truths.map((gt) => tokenF1(answer, gt)));

    const queryTokens = estimateTokens(item.query);
    const inputTokens = ctx.promptTokens + queryTokens + contextTokens;
    const costUsd =
      (inputTokens * model.inputUsdPerMTok +
        outputTokens * model.outputUsdPerMTok) /
        1e6 +
      (embedding ? (queryTokens * embedding.usdPerMTok) / 1e6 : 0);
    const latencyMs =
      model.baseLatencyMs +
      inputTokens * PREFILL_MS_PER_TOKEN +
      (outputTokens / model.outputTokensPerSec) * 1000 +
      (embedding ? embedding.latencyMs : 0);

    return {
      question_id: item.question_id,
      category: item.category,
      expected_behavior: item.expected_behavior,
      f1: round(f1, 4),
      retrieved,
      failedByMissingTechnique: ctx.failsByMissingTechnique,
      truncated,
      inputTokens,
      outputTokens,
      costUsd: round(costUsd, 8),
      latencyMs: Math.round(latencyMs),
    };
  }

  /** Không có thời điểm chạy trong manifest: cùng cấu hình phải ra manifest giống hệt. */
  private buildManifest(m: {
    evalSet: EvaluationSetContract;
    model: LlmModelSpec;
    embedding: EmbeddingModelSpec | null;
    config: AiLabConfig;
    promptSha256: string;
    promptTokens: number;
    seed: string;
    spec: AiLabSpec;
    coverage: number;
    structureWarning: string | null;
    techniques: AiLabGradeResult['techniques'];
    penalties: BudgetPenalty[];
    items: ItemRunResult[];
    totals: Record<string, unknown>;
  }) {
    return {
      graderVersion: GRADER_VERSION,
      catalogHash: CATALOG_HASH,
      evaluationSet: {
        resource_id: m.evalSet.resource_id,
        name: m.evalSet.name,
        version: m.evalSet.version,
        corpus_id: m.evalSet.corpus_id,
        checksum: m.evalSet.checksum,
        size: m.evalSet.items.length,
      },
      model: m.model,
      embeddingModel: m.embedding,
      config: m.config,
      promptSha256: m.promptSha256,
      promptTokens: m.promptTokens,
      seed: m.seed,
      techniqueCoverage: round(m.coverage, 4),
      structureWarning: m.structureWarning,
      techniques: m.techniques,
      budget: m.spec.budget,
      penalties: m.penalties,
      passQuality: m.spec.passQuality,
      items: m.items,
      totals: {
        inputTokens: m.items.reduce((s, i) => s + i.inputTokens, 0),
        outputTokens: m.items.reduce((s, i) => s + i.outputTokens, 0),
        ...m.totals,
      },
    };
  }

  private requirePrompt(value: unknown): string {
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException('Thiếu prompt.');
    }
    if (value.length > MAX_PROMPT_CHARS) {
      throw new BadRequestException(
        `Prompt dài quá ${MAX_PROMPT_CHARS} ký tự.`,
      );
    }
    return value;
  }

  private requireModel(value: unknown): LlmModelSpec {
    const model = typeof value === 'string' ? LLM_MODELS[value] : undefined;
    if (!model) {
      throw new BadRequestException(
        `Model không hợp lệ. Chọn một trong: ${Object.keys(LLM_MODELS).join(', ')}.`,
      );
    }
    return model;
  }

  /** Chỉ giữ các khóa đã biết, trong giới hạn cho phép; khóa lạ bị bỏ, không lưu. */
  private normalizeConfig(value: unknown, rag: boolean): AiLabConfig {
    const raw = (value && typeof value === 'object' ? value : {}) as Record<
      string,
      unknown
    >;
    const num = (key: keyof typeof CONFIG_LIMITS, integer: boolean) => {
      const v = raw[key];
      const { min, max } = CONFIG_LIMITS[key];
      if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max) {
        throw new BadRequestException(
          `config.${key} phải là số từ ${min} đến ${max}.`,
        );
      }
      if (integer && !Number.isInteger(v)) {
        throw new BadRequestException(`config.${key} phải là số nguyên.`);
      }
      return integer ? v : round(v, 2);
    };

    const config: AiLabConfig = {
      temperature: num('temperature', false),
      maxTokens: num('maxTokens', true),
    };
    if (rag) {
      config.topK = num('topK', true);
      const emb = raw.embeddingModel;
      if (typeof emb !== 'string' || !EMBEDDING_MODELS[emb]) {
        throw new BadRequestException(
          `config.embeddingModel không hợp lệ. Chọn một trong: ${Object.keys(EMBEDDING_MODELS).join(', ')}.`,
        );
      }
      config.embeddingModel = emb;
    }
    return config;
  }
}
