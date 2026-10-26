/**
 * Danh mục model và kiểu đặc tả bài AI Lab (Day 23).
 *
 * Đơn giá và độ trễ là SỐ MÔ PHỎNG phục vụ chấm bài, không phải bảng giá
 * thật của nhà cung cấp. Mỗi lần chạy chụp lại đơn giá vào run manifest, nên
 * đổi bảng này về sau không làm sai lệch các bài nộp cũ.
 */

export interface LlmModelSpec {
  id: string;
  label: string;
  /** 0-1: khả năng bám đúng đáp án khi prompt tốt. */
  capability: number;
  inputUsdPerMTok: number;
  outputUsdPerMTok: number;
  baseLatencyMs: number;
  outputTokensPerSec: number;
}

export interface EmbeddingModelSpec {
  id: string;
  label: string;
  /** 0-1: xác suất một chunk đúng lọt vào top-1. */
  retrievalQuality: number;
  usdPerMTok: number;
  latencyMs: number;
}

export const LLM_MODELS: Record<string, LlmModelSpec> = {
  'gemini-2.5-flash-lite': {
    id: 'gemini-2.5-flash-lite',
    label: 'Gemini 2.5 Flash-Lite',
    capability: 0.8,
    inputUsdPerMTok: 0.1,
    outputUsdPerMTok: 0.4,
    baseLatencyMs: 250,
    outputTokensPerSec: 250,
  },
  'gemini-2.5-flash': {
    id: 'gemini-2.5-flash',
    label: 'Gemini 2.5 Flash',
    capability: 0.9,
    inputUsdPerMTok: 0.3,
    outputUsdPerMTok: 2.5,
    baseLatencyMs: 400,
    outputTokensPerSec: 180,
  },
  'gemini-2.5-pro': {
    id: 'gemini-2.5-pro',
    label: 'Gemini 2.5 Pro',
    capability: 0.97,
    inputUsdPerMTok: 1.25,
    outputUsdPerMTok: 10,
    baseLatencyMs: 900,
    outputTokensPerSec: 90,
  },
};

export const EMBEDDING_MODELS: Record<string, EmbeddingModelSpec> = {
  'text-embedding-004': {
    id: 'text-embedding-004',
    label: 'text-embedding-004 (nhẹ)',
    retrievalQuality: 0.55,
    usdPerMTok: 0.025,
    latencyMs: 30,
  },
  'gemini-embedding-001': {
    id: 'gemini-embedding-001',
    label: 'gemini-embedding-001 (chính xác)',
    retrievalQuality: 0.75,
    usdPerMTok: 0.15,
    latencyMs: 60,
  },
};

export const CONFIG_LIMITS = {
  temperature: { min: 0, max: 1 },
  maxTokens: { min: 32, max: 1024 },
  topK: { min: 1, max: 10 },
} as const;

export interface AiLabConfig {
  temperature: number;
  maxTokens: number;
  /** Chỉ có ở bài RAG. */
  topK?: number;
  embeddingModel?: string;
}

/** Một kỹ thuật prompt mà bài lab chấm, nhận diện bằng regex trên prompt. */
export interface PromptTechnique {
  id: string;
  label: string;
  hint: string;
  pattern: string;
  weight: number;
  /**
   * Loại câu hỏi (category của evaluation set) mà thiếu kỹ thuật này thì mô
   * hình trả lời sai hẳn (bịa / làm theo câu bẫy), không chỉ kém đi.
   */
  criticalFor?: string[];
}

export interface AiLabSpec {
  /** Bài RAG: có truy xuất ngữ cảnh, cấu hình thêm topK và embedding model. */
  rag: boolean;
  techniques: PromptTechnique[];
  /** Điểm chất lượng (0-100) tối thiểu để đạt. */
  passQuality: number;
  budget: {
    /** Tổng chi phí (USD) cho cả evaluation set. */
    maxCostUsd: number;
    /** Độ trễ trung bình mỗi câu (ms). */
    maxLatencyMs: number;
  };
}
