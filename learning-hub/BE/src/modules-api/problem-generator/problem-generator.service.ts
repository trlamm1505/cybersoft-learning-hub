import {
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomUUID } from 'crypto';
import {
  Exercise,
  ExerciseDocument,
} from '../../modules-system/database/schemas/exercise.schema';
import { GeminiProblemGeneratorClient } from './problem-generator-gemini.client';
import {
  ProblemGeneratorLlmClient,
  StubProblemGeneratorClient,
} from './problem-generator-llm.client';
import { buildProblemPrompt } from './problem-prompt-builder';
import { validateProblemDraft, ValidationResult } from './problem-validator';
import { ProblemDraft, ProblemSpec } from './problem-generator.types';

export interface GenerateProblemResult {
  generatorUsed: string;
  prompt: string;
  draft: ProblemDraft;
  validation: ValidationResult;
}

export interface GenerateProblemInput {
  learningOutcome: string;
  level: 'EASY' | 'MEDIUM' | 'HARD';
  constraints: string[];
  tags: string[];
}

/**
 * Wrap cùng logic sinh + validate mà run-pipeline.ts dùng cho 10 spec mẫu,
 * nhưng cho spec do người gọi cung cấp trực tiếp (route HTTP cho giáo viên
 * tự nhập learning outcome/level/constraints, thay vì phải sửa file
 * problem-generator-specs.ts rồi chạy CLI). generateMany() KHÔNG ghi gì vào
 * MongoDB — giữ đúng điều kiện nghiệm thu "không publish tự động" của đề
 * bài ngày 19, kết quả chỉ trả về cho người review đọc. saveDraft() là
 * hành động RIÊNG, chỉ chạy khi giáo viên chủ động bấm lưu sau khi đã tự
 * đọc kết quả — đây là "publish do người quyết định", khác với "publish tự
 * động" mà đề bài cấm.
 */
@Injectable()
export class ProblemGeneratorService {
  private readonly logger = new Logger(ProblemGeneratorService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(Exercise.name)
    private readonly exerciseModel: Model<ExerciseDocument>,
  ) {}

  private buildClient(): { client: ProblemGeneratorLlmClient; label: string } {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      return {
        client: new GeminiProblemGeneratorClient(apiKey),
        label: 'GeminiProblemGeneratorClient (gemini-flash-lite-latest, gọi API thật)',
      };
    }
    return {
      client: new StubProblemGeneratorClient(),
      label:
        'StubProblemGeneratorClient (template cố định — GEMINI_API_KEY chưa được cấu hình)',
    };
  }

  /**
   * Sinh nhiều bài cùng lúc (giáo viên soạn nhiều câu cho một đề). Chạy
   * tuần tự — không Promise.all — để không vượt rate limit Gemini free tier,
   * cùng lý do run-pipeline.ts đã áp dụng cho 10 spec mẫu.
   */
  async generateMany(inputs: GenerateProblemInput[]): Promise<GenerateProblemResult[]> {
    const { client, label } = this.buildClient();
    const results: GenerateProblemResult[] = [];

    for (const input of inputs) {
      const spec: ProblemSpec = {
        id: `manual-${randomUUID().slice(0, 8)}`,
        learningOutcome: input.learningOutcome,
        level: input.level,
        constraints: input.constraints,
        tags: input.tags,
      };

      this.logger.debug(`Generating problem for spec ${spec.id} using ${label}`);

      const draft = await client.generate(spec);
      const validation = await validateProblemDraft(draft);

      results.push({
        generatorUsed: label,
        prompt: buildProblemPrompt(spec),
        draft,
        validation,
      });
    }

    return results;
  }

  /**
   * Lưu MỘT draft đã được giáo viên xem qua vào collection `exercises` thật
   * — cùng collection mà học viên thấy trong Code Playground. Không nhận
   * lại validation từ client (không tin dữ liệu FE tự gửi lên) mà chạy lại
   * validateProblemDraft() ngay tại đây, để không ai bypass được điều kiện
   * "reference solution pass mọi test" bằng cách sửa response trên trình
   * duyệt trước khi gọi lưu.
   */
  async saveDraft(draft: ProblemDraft): Promise<{ slug: string }> {
    const existing = await this.exerciseModel.findOne({ slug: draft.slug }).lean();
    if (existing) {
      throw new ConflictException(
        `Đã tồn tại bài tập với slug "${draft.slug}" — không lưu trùng.`,
      );
    }

    const validation = await validateProblemDraft(draft);
    if (!validation.readyForReview) {
      throw new ConflictException(
        'Bài này chưa đạt điều kiện lưu (reference solution chưa pass hết test, hoặc có nghi vấn trùng lặp chưa xử lý).',
      );
    }

    await this.exerciseModel.create({
      title: draft.title,
      slug: draft.slug,
      description: draft.description,
      type: 'CODE_TEXT',
      difficulty: draft.difficulty,
      starterCode: draft.starterCode,
      solutionCode: draft.solutionCode,
      testCases: draft.testCases,
      tags: draft.tags,
    });

    this.logger.debug(`Saved AI-generated exercise: ${draft.slug}`);
    return { slug: draft.slug };
  }
}
