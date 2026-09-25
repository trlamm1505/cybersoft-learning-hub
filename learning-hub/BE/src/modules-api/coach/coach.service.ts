import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CoachMessage,
  CoachMessageDocument,
} from '../../modules-system/database/schemas/coach-message.schema';
import {
  Exercise,
  ExerciseDocument,
} from '../../modules-system/database/schemas/exercise.schema';
import {
  Submission,
  SubmissionDocument,
} from '../../modules-system/database/schemas/submission.schema';
import { CoachContextBuilder } from './coach-context.builder';
import {
  assertContextHasNoForbiddenData,
  checkCoachResponsePolicy,
} from './coach-policy';
import {
  buildInjectionRefusalReply,
  detectPromptInjection,
} from './coach-injection-guard';
import { buildGreetingReply, detectGreeting } from './coach-canned-replies';
import { estimateTokens } from './coach-llm.client';
import type { LlmClient } from './coach-llm.client';
import { COACH_LLM_CLIENT } from './coach.constants';
import { CoachChatDto } from './dto/coach-chat.dto';
import { analyzeDebugLoop, MAX_DEBUG_LOOPS } from './coach-debug-loop';
import { DebugLoopTestInput } from './coach-debug-loop.types';
import { DebugLoopDto } from './dto/debug-loop.dto';

// Giới hạn token theo lượt gọi (input context + output) — điều kiện nghiệm
// thu yêu cầu "có logging và giới hạn token". Ngưỡng này chặn context phình
// to (ví dụ lịch sử hội thoại dài hoặc mô tả đề quá dài) trước khi gọi model,
// và chặn completion quá dài trước khi lưu/trả về học viên.
const MAX_PROMPT_TOKENS = 4000;
const MAX_COMPLETION_TOKENS = 800;

// Export để coach-eval-runner.ts import lại đúng nguyên văn thay vì copy
// riêng một bản khác — tránh trường hợp sửa prompt ở đây mà quên sửa bên
// harness, khiến eval chạy với prompt cũ mà không ai biết (eval/README.md
// mục "đồng bộ SYSTEM_PROMPT" giải thích thêm).
export const SYSTEM_PROMPT = [
  'Bạn là AI Coach hỗ trợ học viên lập trình.',
  'Chỉ trả lời bám sát bài tập được cung cấp trong context, không lạc đề.',
  'Không được tiết lộ test case ẩn (hidden test) dưới bất kỳ hình thức nào.',
  'Không đưa lời giải đầy đủ (full solution) trừ khi context.policy.allowFullSolution = true.',
  'Ưu tiên gợi mở theo hướng Socratic: đặt câu hỏi dẫn dắt, chỉ ra hướng đi, không viết hộ toàn bộ code.',
].join(' ');

@Injectable()
export class CoachService {
  private readonly logger = new Logger(CoachService.name);

  constructor(
    private readonly contextBuilder: CoachContextBuilder,
    @Inject(COACH_LLM_CLIENT) private readonly llmClient: LlmClient,
    @InjectModel(CoachMessage.name)
    private readonly coachMessageModel: Model<CoachMessageDocument>,
    @InjectModel(Exercise.name)
    private readonly exerciseModel: Model<ExerciseDocument>,
    @InjectModel(Submission.name)
    private readonly submissionModel: Model<SubmissionDocument>,
  ) {}

  async chat(dto: CoachChatDto, userId: string) {
    const { exerciseSlug, message } = dto;

    if (!exerciseSlug || !message?.trim()) {
      throw new BadRequestException('Thiếu exerciseSlug hoặc message.');
    }

    const context = await this.contextBuilder.build(userId, exerciseSlug);

    // Lớp phòng thủ thứ hai: đảm bảo context không vô tình chứa solutionCode
    // trước khi nó rời khỏi backend để tới model.
    assertContextHasNoForbiddenData(context);

    const promptTokenEstimate =
      estimateTokens(SYSTEM_PROMPT) +
      estimateTokens(JSON.stringify(context)) +
      estimateTokens(message);

    if (promptTokenEstimate > MAX_PROMPT_TOKENS) {
      throw new BadRequestException(
        `Ngữ cảnh cuộc trò chuyện quá dài (~${promptTokenEstimate} tokens, giới hạn ${MAX_PROMPT_TOKENS}). Hãy bắt đầu một câu hỏi ngắn gọn hơn.`,
      );
    }

    await this.logMessage(
      userId,
      exerciseSlug,
      'user',
      message,
      estimateTokens(message),
    );

    // Lời chào đơn giản không cần "hiểu" gì cả — trả lời cứng, KHÔNG gọi
    // llmClient.chat(). Đặt ở CoachService (không phải trong StubLlmClient)
    // để hành vi này giữ nguyên dù ngày mai đổi sang client gọi model thật
    // (Gemini/Anthropic...) — câu chào không bao giờ tốn quota gọi API.
    if (detectGreeting(message)) {
      const greeting = buildGreetingReply(context.exercise.title);
      const greetingTokens = estimateTokens(greeting.reply!);

      await this.logMessage(
        userId,
        exerciseSlug,
        'assistant',
        greeting.reply!,
        greetingTokens,
      );

      return {
        exerciseSlug,
        reply: greeting.reply!,
        policy: {
          allowFullSolution: context.policy.allowFullSolution,
          maxHintLevelUnlocked: context.policy.maxHintLevelUnlocked,
          blocked: false,
          reason: undefined,
        },
        usage: {
          promptTokens: promptTokenEstimate,
          completionTokens: greetingTokens,
          maxPromptTokens: MAX_PROMPT_TOKENS,
          maxCompletionTokens: MAX_COMPLETION_TOKENS,
        },
      };
    }

    // Chặn ở tầng input trước khi user message được đưa vào prompt gửi model:
    // không phụ thuộc hoàn toàn vào việc model tự chống injection (xem
    // coach-injection-guard.ts). Nếu nghi ngờ, không gọi llmClient nữa —
    // trả thẳng câu từ chối và vẫn log lại để có dấu vết.
    const injectionCheck = detectPromptInjection(message);
    if (injectionCheck.suspicious) {
      this.logger.warn(
        `Coach message bị chặn do nghi ngờ prompt injection: ${injectionCheck.reason}`,
      );
      const refusal = buildInjectionRefusalReply();
      const refusalTokens = estimateTokens(refusal);
      const policyReason = `prompt_injection: ${injectionCheck.reason}`;

      await this.logMessage(
        userId,
        exerciseSlug,
        'assistant',
        refusal,
        refusalTokens,
        true,
        policyReason,
      );

      return {
        exerciseSlug,
        reply: refusal,
        policy: {
          allowFullSolution: context.policy.allowFullSolution,
          maxHintLevelUnlocked: context.policy.maxHintLevelUnlocked,
          blocked: true,
          reason: policyReason,
        },
        usage: {
          promptTokens: promptTokenEstimate,
          completionTokens: refusalTokens,
          maxPromptTokens: MAX_PROMPT_TOKENS,
          maxCompletionTokens: MAX_COMPLETION_TOKENS,
        },
      };
    }

    const llmResult = await this.llmClient.chat(
      SYSTEM_PROMPT,
      context,
      message,
    );

    let finalContent = llmResult.content;
    let completionTokens = llmResult.completionTokens;
    let policyBlocked = false;
    let policyReason: string | undefined;

    if (completionTokens > MAX_COMPLETION_TOKENS) {
      this.logger.warn(
        `Coach response vượt giới hạn token (${completionTokens} > ${MAX_COMPLETION_TOKENS}), sẽ bị cắt.`,
      );
      finalContent = finalContent.slice(0, MAX_COMPLETION_TOKENS * 4);
      completionTokens = estimateTokens(finalContent);
    }

    const policyCheck = checkCoachResponsePolicy(finalContent, context);
    if (!policyCheck.allowed) {
      this.logger.warn(
        `Coach response bị chặn bởi policy: ${policyCheck.reason}`,
      );
      finalContent = policyCheck.sanitizedContent ?? finalContent;
      completionTokens = estimateTokens(finalContent);
      policyBlocked = true;
      policyReason = policyCheck.reason;
    }

    await this.logMessage(
      userId,
      exerciseSlug,
      'assistant',
      finalContent,
      completionTokens,
      policyBlocked,
      policyReason,
    );

    return {
      exerciseSlug,
      reply: finalContent,
      policy: {
        allowFullSolution: context.policy.allowFullSolution,
        maxHintLevelUnlocked: context.policy.maxHintLevelUnlocked,
        blocked: policyBlocked,
        reason: policyReason,
      },
      usage: {
        promptTokens: llmResult.promptTokens,
        completionTokens,
        maxPromptTokens: MAX_PROMPT_TOKENS,
        maxCompletionTokens: MAX_COMPLETION_TOKENS,
      },
    };
  }

  /**
   * Debug Loop v0.1 — phân tích kết quả test THẬT của một submission đã lưu
   * (không nhận mô tả lỗi tự do từ client) để tránh AI bịa nguyên nhân.
   *
   * "Vòng lặp" ở đây là chuỗi các submission liên tiếp CHƯA đạt AC cho cùng
   * một bài — mỗi lần học viên sửa và nộp lại mà vẫn sai, loop count tăng.
   * Chuỗi bị "ngắt" (reset) ngay khi có một lần AC xen giữa.
   */
  async debugLoop(dto: DebugLoopDto, userId: string) {
    const { exerciseSlug, submissionId } = dto;

    if (!exerciseSlug || !submissionId) {
      throw new BadRequestException('Thiếu exerciseSlug hoặc submissionId.');
    }

    const exercise = await this.exerciseModel
      .findOne({ slug: exerciseSlug })
      .select('_id title')
      .lean();
    if (!exercise) {
      throw new NotFoundException(`Không tìm thấy bài tập "${exerciseSlug}"`);
    }

    const submission = await this.submissionModel
      .findOne({
        _id: submissionId,
        userId,
        exerciseId: String((exercise as any)._id),
      })
      .lean();
    if (!submission) {
      throw new NotFoundException(
        'Không tìm thấy submission thuộc đúng học viên/bài tập.',
      );
    }

    // Đếm số submission liên tiếp NGAY TRƯỚC submission hiện tại (theo thời
    // gian) mà vẫn chưa AC, để suy ra học viên đã "loop" bao nhiêu lần rồi.
    const priorSubmissions = await this.submissionModel
      .find({
        userId,
        exerciseId: String((exercise as any)._id),
        createdAt: { $lt: (submission as any).createdAt },
      })
      .sort({ createdAt: -1 })
      .select('status')
      .lean();

    let attemptsSoFar = 0;
    for (const prior of priorSubmissions) {
      if (prior.status === 'AC') break;
      attemptsSoFar += 1;
    }

    // Chặn CỨNG ở backend khi đã chạm giới hạn vòng lặp cho chuỗi submission
    // chưa AC này — không chỉ đổi lời khuyên như analyzeDebugLoop() làm.
    // attemptsSoFar được tính lại từ Submission thật mỗi lần gọi (không phải
    // state phía client), nên không thể bị vượt qua bằng cách F5/gọi lại API
    // nhiều lần hay bỏ qua trạng thái disable ở UI.
    if (submission.status !== 'AC' && attemptsSoFar >= MAX_DEBUG_LOOPS) {
      throw new ForbiddenException(
        `Đã chạm giới hạn ${MAX_DEBUG_LOOPS} lần phân tích liên tục chưa qua được bài này. ` +
          'Hãy đọc lại đề bài + gợi ý đã mở, hoặc nhờ người hướng dẫn xem trực tiếp code trước khi nộp lại và phân tích tiếp.',
      );
    }

    const firstFailingResult = (submission.results ?? []).find(
      (r) => !r.passed,
    );

    const debugInput: DebugLoopTestInput = {
      status: submission.status,
      passedCount: submission.passedCount,
      totalCount: submission.totalCount,
      errorMessage: submission.errorMessage,
      firstFailingTest: firstFailingResult
        ? {
            index: firstFailingResult.index,
            input: firstFailingResult.input,
            expectedOutput: firstFailingResult.expectedOutput,
            actualOutput: firstFailingResult.actualOutput,
            stderr: firstFailingResult.stderr,
            isHidden: firstFailingResult.isHidden,
          }
        : undefined,
    };

    const result = analyzeDebugLoop(debugInput, { attemptsSoFar });

    const summaryForLog =
      `[debug-loop] category=${result.errorCategory} loop=${result.loopCount}/${result.maxLoops} ` +
      `feedback=${result.feedback}`;
    await this.logMessage(
      userId,
      exerciseSlug,
      'assistant',
      summaryForLog,
      estimateTokens(summaryForLog),
    );

    return {
      exerciseSlug,
      submissionId,
      ...result,
    };
  }

  async getHistory(userId: string, exerciseSlug: string) {
    const history = await this.coachMessageModel
      .find({ userId, exerciseSlug })
      .sort({ createdAt: 1 })
      .select('role content tokenCount policyBlocked policyReason createdAt')
      .lean();

    return { userId, exerciseSlug, totalMessages: history.length, history };
  }

  private async logMessage(
    userId: string,
    exerciseSlug: string,
    role: 'user' | 'assistant',
    content: string,
    tokenCount: number,
    policyBlocked = false,
    policyReason?: string,
  ) {
    await this.coachMessageModel.create({
      userId,
      exerciseSlug,
      role,
      content,
      tokenCount,
      policyBlocked,
      policyReason,
    });
  }
}
