import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

/** PASSED: đạt ngưỡng chất lượng VÀ nằm trong ngân sách cost/latency của bài. */
export type AiLabSubmissionStatus = 'PASSED' | 'FAILED';

/**
 * Bài AI Lab của một học viên (Day 23): lần chạy mới nhất, lần điểm cao nhất
 * và lịch sử 5 lần chạy gần nhất (experiment tracking).
 * Collection riêng, giống DA
 * Lab và Tester Lab, để Judge/Mastery/Recommendation của luồng Python không
 * đọc nhầm. Lưu đủ prompt + model + config + run manifest để chạy lại cùng
 * cấu hình ra cùng kết quả. Payload chứa API key bị chặn trước khi tới đây.
 */
@Schema({ timestamps: true, collection: 'ai_lab_submissions' })
export class AiLabSubmission {
  @Prop({ required: true, type: String, index: true })
  userId: string;

  @Prop({ required: true, type: String, index: true })
  exerciseId: string;

  @Prop({ required: true, type: String })
  exerciseSlug: string;

  @Prop({ required: true, type: String })
  prompt: string;

  @Prop({ required: true, type: String })
  model: string;

  /** Cấu hình đã chuẩn hóa: temperature, maxTokens, (RAG) topK, embeddingModel. */
  @Prop({ required: true, type: Object })
  config: object;

  /** Log chạy: phiên bản grader, evaluation set + checksum, đơn giá, seed, kết quả từng câu. */
  @Prop({ required: true, type: Object })
  runManifest: object;

  /** 0-100: độ khớp trung bình giữa câu trả lời sinh ra và ground truths. */
  @Prop({ required: true, type: Number })
  qualityScore: number;

  /** Tổng chi phí (USD) cho cả evaluation set. */
  @Prop({ required: true, type: Number })
  cost: number;

  /** Độ trễ trung bình mỗi câu (ms). */
  @Prop({ required: true, type: Number })
  latency: number;

  @Prop({ required: true, type: Number })
  score: number;

  @Prop({ required: true, type: Number })
  maxScore: number;

  @Prop({ required: true, type: String, enum: ['PASSED', 'FAILED'] })
  status: AiLabSubmissionStatus;

  /** Tổng số lần "Chạy & Đánh giá". Mỗi học viên chỉ có một bản ghi cho mỗi bài. */
  @Prop({ type: Number, default: 1 })
  totalAttempts: number;

  /** Điểm chất lượng cao nhất qua mọi lần chạy (truy vấn nhanh, không cần đọc lịch sử). */
  @Prop({ type: Number })
  bestQualityScore?: number;

  /** Tóm tắt lần chạy mới nhất (chi tiết đầy đủ nằm ở các trường cấp gốc). */
  @Prop({ type: Object })
  latestSubmission?: {
    submittedAt: Date;
    promptHash: string;
    score: number;
    qualityScore: number;
    status: AiLabSubmissionStatus;
  };

  /**
   * Lịch sử thí nghiệm: tối đa 5 lần chạy gần nhất (cũ trước, mới sau), cắt
   * bằng $push + $slice nên không phình vô hạn.
   */
  @Prop({ type: [Object], default: [] })
  history: Array<{
    promptHash: string;
    prompt: string;
    model: string;
    config: object;
    score: number;
    qualityScore: number;
    cost: number;
    latency: number;
    status: AiLabSubmissionStatus;
    runManifest: object;
    createdAt: Date;
  }>;

  /** Lần chạy điểm cao nhất (đủ prompt/model/config để chạy lại). */
  @Prop({ type: Object })
  best?: {
    score: number;
    qualityScore: number;
    cost: number;
    latency: number;
    status: AiLabSubmissionStatus;
    prompt: string;
    model: string;
    config: object;
    runAt: Date;
  };
}

export const AiLabSubmissionSchema =
  SchemaFactory.createForClass(AiLabSubmission);
AiLabSubmissionSchema.index({ userId: 1, exerciseId: 1, createdAt: -1 });
