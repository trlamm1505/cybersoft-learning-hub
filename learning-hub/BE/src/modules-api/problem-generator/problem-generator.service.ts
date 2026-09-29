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
import { ExistingExerciseForDuplicateCheck } from './problem-duplicate-check';
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

// Lỗi của MỘT spec trong lô sinh hàng loạt — specIndex để FE khớp lại đúng
// form đã nhập, topic là learningOutcome rút gọn để người đọc log không cần
// tra ngược, reason là message lỗi đã làm sạch (không rò rỉ stack trace/nội
// bộ ra client, xem sanitizeErrorReason()).
export interface GenerateProblemError {
  specIndex: number;
  topic: string;
  reason: string;
}

export interface GenerateProblemBatchResult {
  results: GenerateProblemResult[];
  errors: GenerateProblemError[];
}

// Cắt ngắn + loại bỏ chi tiết nội bộ (đường dẫn file, stack, raw response dài)
// trước khi đưa lỗi ra client — tránh lộ HTTP 500/internal error thật của
// Gemini SDK hoặc nội dung response thô ra giao diện giáo viên.
const MAX_ERROR_REASON_LENGTH = 300;

function sanitizeErrorReason(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  return message.length > MAX_ERROR_REASON_LENGTH
    ? `${message.slice(0, MAX_ERROR_REASON_LENGTH)}…`
    : message;
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

  /**
   * Query toàn bộ exercise ĐANG CÓ THẬT trong collection `exercises` (không
   * phải 3 file fixture tĩnh nạp lúc build) để đối chiếu trùng lặp — đảm bảo
   * bài vừa được giáo viên khác lưu (kể cả qua AI Tạo Đề hoặc Authoring) một
   * phút trước cũng nằm trong tập so khớp, không chỉ những bài đã seed sẵn.
   * Chỉ select 3 field cần cho Jaccard (slug/title/description), không kéo
   * theo testCases/solutionCode nặng — bảng có thể có hàng trăm bài.
   */
  private async loadExistingExercisesForDuplicateCheck(): Promise<
    ExistingExerciseForDuplicateCheck[]
  > {
    const exercises = await this.exerciseModel
      .find()
      .select('slug title description')
      .lean();
    return exercises.map((ex) => ({
      slug: ex.slug,
      title: ex.title,
      description: ex.description,
    }));
  }

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
   *
   * PARTIAL SUCCESS: mỗi spec được bọc try/catch RIÊNG — một spec lỗi (hết
   * quota Gemini, JSON không parse được sau khi đã hết lượt retry, v.v.)
   * không còn làm mất các bài đã sinh thành công trước đó trong cùng lô.
   * Trả về đồng thời results (thành công) và errors (thất bại kèm lý do đã
   * sanitize) để FE tự quyết định hiển thị/cho phép "thử lại bài lỗi".
   */
  async generateMany(
    inputs: GenerateProblemInput[],
  ): Promise<GenerateProblemBatchResult> {
    const { client, label } = this.buildClient();
    const results: GenerateProblemResult[] = [];
    const errors: GenerateProblemError[] = [];
    // Query MỘT LẦN trước vòng lặp — đủ mới cho cả lô (sinh hàng loạt diễn ra
    // trong vài phút), tránh N lần query giống hệt nhau cho N spec.
    const existingExercises = await this.loadExistingExercisesForDuplicateCheck();

    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const spec: ProblemSpec = {
        id: `manual-${randomUUID().slice(0, 8)}`,
        learningOutcome: input.learningOutcome,
        level: input.level,
        constraints: input.constraints,
        tags: input.tags,
      };

      try {
        this.logger.debug(`Generating problem for spec ${spec.id} using ${label}`);

        const draft = await client.generate(spec);
        const validation = await validateProblemDraft(draft, existingExercises);

        results.push({
          generatorUsed: label,
          prompt: buildProblemPrompt(spec),
          draft,
          validation,
        });
      } catch (err) {
        this.logger.warn(
          `Sinh bài thất bại cho specs[${i}] (${input.learningOutcome}): ${sanitizeErrorReason(err)}`,
        );
        errors.push({
          specIndex: i,
          topic: input.learningOutcome,
          reason: sanitizeErrorReason(err),
        });
      }
    }

    return { results, errors };
  }

  /**
   * Lưu MỘT draft đã được giáo viên xem qua vào collection `exercises` thật
   * — cùng collection mà học viên thấy trong Code Playground. Không nhận
   * lại validation từ client (không tin dữ liệu FE tự gửi lên) mà chạy lại
   * validateProblemDraft() ngay tại đây, để không ai bypass được điều kiện
   * "reference solution pass mọi test" bằng cách sửa response trên trình
   * duyệt trước khi gọi lưu.
   *
   * Human-in-the-loop cho cảnh báo trùng lặp MỀM: nếu draft có
   * duplicateCandidates nhưng KHÔNG có cái nào isHardBlock, và caller gửi
   * forceSave=true (giáo viên đã tự đọc và xác nhận bỏ qua), vẫn cho lưu —
   * đồng thời ghi audit trail (hasDuplicateWarning/approvedBy/approvedAt/
   * overrideReason) vào chính document Exercise. reference solution vẫn
   * BẮT BUỘC pass mọi test dù forceSave=true — override chỉ áp dụng cho
   * điều kiện trùng lặp, không bao giờ cho phép lưu solution sai.
   */
  /**
   * Chạy lại validator (syntax + test thật + duplicate check) cho MỘT draft
   * mà giáo viên vừa tự sửa trực tiếp trên UI (title/description/
   * solutionCode/testCases) — KHÔNG gọi lại Gemini, không tốn quota, và cho
   * phản hồi ngay lập tức sau khi sửa. Đây là hành động "Chạy lại test",
   * tách biệt khỏi saveDraft() (vẫn phải tự chạy lại validator riêng trước
   * khi ghi DB, không tin kết quả revalidate này để lưu thẳng).
   */
  async revalidateDraft(draft: ProblemDraft): Promise<ValidationResult> {
    const existingExercises = await this.loadExistingExercisesForDuplicateCheck();
    return validateProblemDraft(draft, existingExercises);
  }

  async saveDraft(
    draft: ProblemDraft,
    options: { forceSave?: boolean; overrideReason?: string; approvedBy?: string } = {},
  ): Promise<{ slug: string }> {
    const existing = await this.exerciseModel.findOne({ slug: draft.slug }).lean();
    if (existing) {
      throw new ConflictException(
        `Đã tồn tại bài tập với slug "${draft.slug}" — không lưu trùng.`,
      );
    }

    const existingExercises = await this.loadExistingExercisesForDuplicateCheck();
    const validation = await validateProblemDraft(draft, existingExercises);

    if (validation.hasHardBlockDuplicate) {
      throw new ConflictException(
        'Bài này trùng gần như tuyệt đối với một bài đã có (cùng slug/tiêu đề, hoặc nội dung giống hệt) — ' +
          'không thể lưu kể cả khi xác nhận bỏ qua. Hãy sửa lại nội dung hoặc sinh bài khác.',
      );
    }

    const hasSoftDuplicateWarning = validation.duplicateCandidates.length > 0;
    if (!validation.allTestsPassed) {
      throw new ConflictException(
        'Bài này chưa đạt điều kiện lưu: reference solution chưa pass hết test.',
      );
    }
    if (hasSoftDuplicateWarning && !options.forceSave) {
      throw new ConflictException(
        'Bài này chưa đạt điều kiện lưu do có nghi vấn trùng lặp chưa xử lý — ' +
          'hãy tick xác nhận bỏ qua cảnh báo (forceSave) sau khi tự đối chiếu, hoặc sửa lại nội dung.',
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
      ...(hasSoftDuplicateWarning && options.forceSave
        ? {
            hasDuplicateWarning: true,
            approvedBy: options.approvedBy,
            approvedAt: new Date(),
            overrideReason: options.overrideReason,
          }
        : {}),
    });

    this.logger.debug(
      hasSoftDuplicateWarning && options.forceSave
        ? `Saved AI-generated exercise with duplicate override: ${draft.slug} (approved by ${options.approvedBy})`
        : `Saved AI-generated exercise: ${draft.slug}`,
    );
    return { slug: draft.slug };
  }
}
