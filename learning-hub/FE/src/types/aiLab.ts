/** Kiểu dữ liệu AI Lab (Ngày 23) — khớp response của NestJS /ai-labs/*. */

export interface AiLabSummary {
  _id: string;
  slug: string;
  title: string;
  description: string;
  type: 'AI_LAB';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  points: number;
  orderInTopic: number;
  resource_id: string;
}

export interface LlmModelOption {
  id: string;
  label: string;
  capability: number;
  inputUsdPerMTok: number;
  outputUsdPerMTok: number;
  baseLatencyMs: number;
  outputTokensPerSec: number;
}

export interface EmbeddingModelOption {
  id: string;
  label: string;
  retrievalQuality: number;
  usdPerMTok: number;
  latencyMs: number;
}

export interface Range {
  min: number;
  max: number;
}

export interface AiLabDetail extends AiLabSummary {
  starterCode: string;
  spec: {
    rag: boolean;
    passQuality: number;
    budget: { maxCostUsd: number; maxLatencyMs: number };
    techniques: Array<{ id: string; label: string; hint: string }>;
  };
  catalog: {
    models: LlmModelOption[];
    embeddingModels: EmbeddingModelOption[];
    configLimits: { temperature: Range; maxTokens: Range; topK: Range };
  };
}

export interface EvaluationSetPreview {
  resource_id: string;
  name: string;
  version: string;
  corpus_id: string;
  total: number;
  categories: Record<string, number>;
  preview: Array<{
    question_id: string;
    query: string;
    category: string;
    expected_behavior: 'ANSWER' | 'ABSTAIN';
  }>;
}

export interface AiLabConfig {
  temperature: number;
  maxTokens: number;
  topK?: number;
  embeddingModel?: string;
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
  failedByMissingTechnique: boolean;
  truncated: boolean;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  latencyMs: number;
}

export interface TechniqueCheck {
  id: string;
  label: string;
  hint: string;
  matched: boolean;
}

export interface RunManifest {
  graderVersion: string;
  evaluationSet: {
    resource_id: string;
    name: string;
    version: string;
    corpus_id: string;
    checksum: string;
    size: number;
  };
  model: LlmModelOption;
  embeddingModel: EmbeddingModelOption | null;
  config: AiLabConfig;
  promptSha256: string;
  promptTokens: number;
  seed: string;
  techniqueCoverage: number;
  /** Prompt bị coi là nhồi từ khóa: không kỹ thuật nào được tính. */
  structureWarning: string | null;
  techniques: TechniqueCheck[];
  budget: { maxCostUsd: number; maxLatencyMs: number };
  penalties: BudgetPenalty[];
  passQuality: number;
  items: ItemRunResult[];
  totals: { inputTokens: number; outputTokens: number };
}

/** Một lần chạy trong lịch sử thí nghiệm (BE giữ tối đa 5 lần gần nhất). */
export interface AiLabHistoryEntry {
  promptHash: string;
  prompt: string;
  model: string;
  config: AiLabConfig;
  score: number;
  qualityScore: number;
  cost: number;
  latency: number;
  status: 'PASSED' | 'FAILED';
  runManifest: RunManifest;
  createdAt: string;
}

/** Kết quả một lần "Chạy & Đánh giá" (response submit hoặc bản đã lưu). */
export interface AiLabRun {
  submissionId: string;
  submittedAt: string;
  status: 'PASSED' | 'FAILED';
  qualityScore: number;
  cost: number;
  latency: number;
  score: number;
  maxScore: number;
  runManifest: RunManifest;
  /** Tổng số lần chạy của học viên cho bài này. */
  totalAttempts?: number;
  /** Điểm chất lượng cao nhất qua mọi lần chạy. */
  bestQualityScore?: number;
  /** Lần chạy điểm cao nhất. */
  best?: { score: number; qualityScore: number; status: 'PASSED' | 'FAILED'; runAt: string } | null;
  /** Tối đa 5 lần chạy gần nhất (cũ trước, mới sau). */
  history?: AiLabHistoryEntry[];
  /** Chỉ có ở bản đã lưu (GET my-submission). */
  prompt?: string;
  model?: string;
  config?: AiLabConfig;
}
