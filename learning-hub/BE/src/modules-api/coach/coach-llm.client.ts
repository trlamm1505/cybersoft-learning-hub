import { Injectable, Logger } from '@nestjs/common';
import { CoachContext } from './coach-context.types';

export interface LlmChatResult {
  content: string;
  promptTokens: number;
  completionTokens: number;
}

export interface LlmClient {
  chat(
    systemPrompt: string,
    context: CoachContext,
    userMessage: string,
  ): Promise<LlmChatResult>;
}

// Ước lượng token thô (~4 ký tự/token cho tiếng Việt+code trộn lẫn), đủ dùng
// để enforce giới hạn mà không cần kéo thêm thư viện tokenizer bên ngoài.
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Các loại lỗi runtime/syntax Python phổ biến mà học viên hay dán nguyên
// traceback vào khung chat thay vì tự diễn đạt lại bằng lời. Nhận diện để
// trả lời đúng trọng tâm loại lỗi, thay vì echo nguyên văn traceback.
const ERROR_PATTERNS: Array<{ match: RegExp; kind: string; explain: string }> =
  [
    {
      match: /SyntaxError:.*was never closed|SyntaxError:.*unexpected EOF/i,
      kind: 'thiếu dấu đóng ngoặc/quote',
      explain:
        'Python báo một dấu ngoặc hoặc dấu nháy đã mở nhưng chưa được đóng lại đúng chỗ. Hãy đếm lại số dấu ( ) [ ] { } hoặc dấu " trên dòng lỗi và các dòng trước đó.',
    },
    {
      match: /SyntaxError/i,
      kind: 'lỗi cú pháp (SyntaxError)',
      explain:
        'Dòng được chỉ ra trong traceback có cú pháp Python không hợp lệ — kiểm tra lại dấu hai chấm `:`, thụt lề, hoặc dấu ngoặc ở đúng dòng đó.',
    },
    {
      match: /NameError:\s*name\s*'([^']+)'\s*is not defined/i,
      kind: 'dùng biến chưa được gán giá trị (NameError)',
      explain:
        'Biến được nhắc tới chưa được gán giá trị trước khi dùng, hoặc bị gõ sai tên so với chỗ đã khai báo. Kiểm tra lại chính tả và thứ tự các dòng lệnh.',
    },
    {
      match: /TypeError/i,
      kind: 'sai kiểu dữ liệu khi thao tác (TypeError)',
      explain:
        'Một phép toán hoặc hàm đang được áp dụng lên sai kiểu dữ liệu (ví dụ cộng chuỗi với số). Kiểm tra lại kiểu dữ liệu trả về của `input()` — mặc định luôn là chuỗi, cần `int()`/`float()` nếu muốn tính toán.',
    },
    {
      match: /IndexError/i,
      kind: 'truy cập vị trí không tồn tại trong danh sách (IndexError)',
      explain:
        'Đang truy cập một chỉ số (index) vượt quá độ dài thực tế của danh sách/chuỗi. Kiểm tra lại điều kiện vòng lặp hoặc độ dài dữ liệu đầu vào.',
    },
    {
      match: /IndentationError/i,
      kind: 'lỗi thụt lề (IndentationError)',
      explain:
        'Các dòng code trong cùng một khối (if/for/while/def) cần thụt lề đều nhau. Kiểm tra lại có dòng nào lẫn tab và space, hoặc thụt lề không khớp khối cha.',
    },
  ];

/**
 * Implementation mặc định khi chưa cấu hình API key của nhà cung cấp model
 * thật (repo hiện chưa có SDK Anthropic/OpenAI nào được cài). Trả lời theo
 * kiểu Socratic (gợi mở, không đưa thẳng đáp án) dựa trên dữ liệu context đã
 * được lọc sẵn, để AI Coach v0.1 chạy được end-to-end mà không phụ thuộc
 * mạng ngoài trong lúc test/CI.
 *
 * Đây KHÔNG phải một model AI thật — nó không "hiểu" ngôn ngữ tự nhiên, chỉ
 * nhận diện một số pattern cố định (traceback lỗi Python phổ biến, hỏi thẳng
 * đáp án, câu hỏi rỗng) rồi ghép câu trả lời template tương ứng. Khi có API
 * key thật, thay class này bằng implementation gọi Anthropic Messages API,
 * giữ nguyên interface LlmClient để không phải sửa CoachService.
 */
@Injectable()
export class StubLlmClient implements LlmClient {
  private readonly logger = new Logger(StubLlmClient.name);

  async chat(
    systemPrompt: string,
    context: CoachContext,
    userMessage: string,
  ): Promise<LlmChatResult> {
    const promptTokens =
      estimateTokens(systemPrompt) +
      estimateTokens(JSON.stringify(context)) +
      estimateTokens(userMessage);

    const content = this.buildReply(context, userMessage);
    const completionTokens = estimateTokens(content);

    this.logger.debug(
      `Stub LLM chat: prompt=${promptTokens} tokens, completion=${completionTokens} tokens`,
    );

    return { content, promptTokens, completionTokens };
  }

  private buildReply(context: CoachContext, userMessage: string): string {
    const trimmed = userMessage.trim();

    if (this.looksLikeThanks(trimmed)) {
      return this.buildThanksReply(context);
    }

    const errorHit = ERROR_PATTERNS.find((p) => p.match.test(trimmed));

    if (errorHit) {
      return this.buildErrorTracebackReply(context, errorHit);
    }

    if (this.looksLikeAskingForAnswer(trimmed)) {
      return this.buildAskingForAnswerReply(context);
    }

    return this.buildGeneralReply(context);
  }

  private looksLikeAskingForAnswer(message: string): boolean {
    return /(code đầy đủ|đáp án|lời giải|giải giúp|làm giúp|full solution)/i.test(
      message,
    );
  }

  // Kiểm tra lời cảm ơn trước các pattern khác (kể cả khi đi cùng một câu
  // hỏi ngắn, ví dụ "cảm ơn nha, mai mình hỏi tiếp") để không rơi nhầm vào
  // nhánh lỗi/xin đáp án. Chỉ khớp khi gần như toàn bộ message là lời cảm
  // ơn, tránh bắt nhầm câu dài có lồng từ "cảm ơn" ở giữa một câu hỏi khác.
  private looksLikeThanks(message: string): boolean {
    if (message.length > 60) return false;
    return /^(cảm ơn|cám ơn|thank|thanks|thank you|tks|ty)\b/i.test(message);
  }

  private buildThanksReply(context: CoachContext): string {
    const { attemptSummary, policy } = context;

    if (policy.allowFullSolution) {
      return `Không có gì! Chúc mừng bạn đã hoàn thành tốt bài này. Khi nào làm bài tiếp theo cứ quay lại hỏi mình nhé.`;
    }

    if (attemptSummary.totalAttempts > 0) {
      return `Không có gì, cứ tiếp tục thử lại nhé. Mình vẫn ở đây nếu bạn cần trao đổi thêm về bài này.`;
    }

    return `Không có gì cả. Chúc bạn làm bài thuận lợi, cần gì cứ quay lại hỏi mình.`;
  }

  private buildErrorTracebackReply(
    context: CoachContext,
    errorHit: { kind: string; explain: string },
  ): string {
    const { exercise } = context;
    return (
      `Mình thấy bạn đang gặp ${errorHit.kind} khi chạy bài "${exercise.title}". ` +
      `${errorHit.explain} ` +
      `Bạn thử soát lại đúng dòng được traceback chỉ ra trước, nếu vẫn bí thì mở thêm gợi ý theo tầng để có hướng cụ thể hơn.`
    );
  }

  private buildAskingForAnswerReply(context: CoachContext): string {
    const { exercise, attemptSummary, unlockedHints, policy } = context;

    if (policy.allowFullSolution) {
      return (
        `Bạn đã ${attemptSummary.hasEverPassed ? 'AC bài này' : 'mở hết các tầng gợi ý'}, ` +
        `nên mình có thể trao đổi sâu hơn về cách tối ưu và các trường hợp biên của "${exercise.title}". ` +
        `Bạn muốn mình phân tích độ phức tạp, hay so sánh với một hướng giải khác?`
      );
    }

    const lastHint = unlockedHints[unlockedHints.length - 1];
    const hintNote = lastHint
      ? `Bạn đã mở tới Tầng ${lastHint.level} ("${lastHint.title}") — hãy thử áp dụng gợi ý đó vào bài trước.`
      : `Bạn chưa mở gợi ý nào cho bài này — nếu bí, hãy thử mở Tầng 1 để có định hướng khái niệm.`;

    return (
      `Mình chưa thể đưa code đầy đủ cho bài "${exercise.title}" ngay bây giờ. ` +
      `${hintNote} Bạn hãy tự viết thử và nộp bài, mình sẽ nhận xét dựa trên kết quả chạy test tiếp theo của bạn.`
    );
  }

  private buildGeneralReply(context: CoachContext): string {
    const { exercise, attemptSummary, unlockedHints } = context;

    const lastHint = unlockedHints[unlockedHints.length - 1];
    const hintNote = lastHint
      ? `Bạn đã mở tới Tầng ${lastHint.level} ("${lastHint.title}") — hãy thử áp dụng gợi ý đó vào bài trước.`
      : `Bạn chưa mở gợi ý nào cho bài này — nếu bí, hãy thử mở Tầng 1 để có định hướng khái niệm.`;

    const attemptNote =
      attemptSummary.totalAttempts > 0
        ? `Lần nộp gần nhất bạn đạt ${attemptSummary.lastPassedCount}/${attemptSummary.lastTotalCount} test.`
        : `Bạn chưa nộp bài lần nào — hãy thử với các test case mẫu trước.`;

    return (
      `Về bài "${exercise.title}": ${attemptNote} ${hintNote} ` +
      `Mình chưa đưa lời giải đầy đủ ở đây — bạn hãy tự viết code và nộp thử, ` +
      `mình sẽ nhận xét dựa trên kết quả chạy test tiếp theo của bạn.`
    );
  }
}
