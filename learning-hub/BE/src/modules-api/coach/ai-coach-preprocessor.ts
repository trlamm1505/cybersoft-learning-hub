import { buildGreetingReply, detectGreeting } from './coach-canned-replies';
import {
  buildErrorTracebackReply,
  ERROR_PATTERNS,
} from './coach-llm.client';

export type PreprocessKind = 'greeting' | 'farewell' | 'thanks' | 'static_error';

export interface PreprocessResult {
  kind: PreprocessKind;
  reply: string;
}

// Chỉ khớp khi gần như toàn bộ message là lời tạm biệt/cảm ơn, giống cách
// detectGreeting làm, để không bắt nhầm câu hỏi dài có lồng các từ này.
const FAREWELL_PATTERN =
  /^(tạm biệt|bye|bye bye|goodbye|good bye|see you|hẹn gặp lại)( nhé| nha| coach| bạn)?[!.,\s]*$/i;
const THANKS_PATTERN =
  /^(cảm ơn|cám ơn|thank you|thanks|thank|tks|ty)( nhé| nha| bạn| coach| nhiều)*[!.,\s]*$/i;
const SHORT_MESSAGE_MAX = 40;

// Lỗi tĩnh cơ bản: sai cú pháp, sai thụt lề, dùng biến chưa khai báo. Câu trả
// lời mẫu đủ để học viên tự sửa. Lỗi runtime (TypeError, IndexError...) phụ
// thuộc logic bài nên vẫn gửi cho model.
const STATIC_ERROR_PATTERN = /\b(SyntaxError|IndentationError|TabError|NameError)\b/;

/**
 * Lọc các message không cần model trước khi gọi Gemini để không tốn quota:
 * chào hỏi, tạm biệt, cảm ơn và traceback lỗi tĩnh cơ bản. Trả null nghĩa là
 * message cần model trả lời.
 *
 * CoachService gọi lớp này SAU bộ chặn prompt injection, nên một message vừa
 * chứa lời chào vừa chứa lệnh tấn công vẫn bị từ chối như cũ.
 */
export class AiCoachPreprocessor {
  tryHandle(message: string, exerciseTitle: string): PreprocessResult | null {
    const trimmed = message.trim();

    if (detectGreeting(trimmed)) {
      return { kind: 'greeting', reply: buildGreetingReply(exerciseTitle).reply! };
    }

    if (trimmed.length <= SHORT_MESSAGE_MAX && FAREWELL_PATTERN.test(trimmed)) {
      return {
        kind: 'farewell',
        reply: `Tạm biệt bạn! Khi quay lại làm bài "${exerciseTitle}", cần gì cứ hỏi mình nhé.`,
      };
    }

    if (trimmed.length <= SHORT_MESSAGE_MAX && THANKS_PATTERN.test(trimmed)) {
      return {
        kind: 'thanks',
        reply: 'Không có gì! Cứ tiếp tục thử nhé, cần trao đổi thêm thì mình vẫn ở đây.',
      };
    }

    if (STATIC_ERROR_PATTERN.test(trimmed)) {
      const hit = ERROR_PATTERNS.find((p) => p.match.test(trimmed));
      if (hit) {
        return {
          kind: 'static_error',
          reply: buildErrorTracebackReply(exerciseTitle, hit),
        };
      }
    }

    return null;
  }
}
