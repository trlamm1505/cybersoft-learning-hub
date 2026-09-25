/**
 * Câu trả lời cứng (canned reply) cho các message KHÔNG cần "hiểu" ngữ nghĩa
 * bài tập — hiện tại chỉ có lời chào đơn giản ("xin chào", "hi", "chào bạn"…).
 *
 * Lý do tách riêng thay vì để StubLlmClient tự xử lý: StubLlmClient sẽ bị
 * thay bằng client gọi model thật (dự kiến Gemini/Anthropic — xem comment
 * trong coach-llm.client.ts). Nếu chỉ đặt logic "chào hỏi -> trả lời mặc
 * định" bên trong StubLlmClient, nó sẽ BIẾN MẤT ngay khi đổi client, và một
 * câu "xin chào" đơn giản sẽ lại tốn một lượt gọi API thật (tốn quota) chỉ để
 * nhận về một câu chào lại không cần cá nhân hoá gì thêm.
 *
 * Đặt ở đây (được gọi từ CoachService, TRƯỚC khi tới llmClient.chat) đảm bảo
 * hành vi "chào hỏi không tốn quota" đúng với MỌI implementation của
 * LlmClient, không phụ thuộc client nào đang được cắm vào.
 */

export interface CannedReplyResult {
  matched: boolean;
  reply?: string;
}

// Chỉ khớp khi gần như toàn bộ message là lời chào (không lồng trong một câu
// hỏi dài hơn), cùng cách tiếp cận với looksLikeThanks() ở coach-llm.client.ts
// — tránh bắt nhầm câu "Chào bạn, mình bị lỗi này..." vốn cần trả lời thật.
const GREETING_PATTERN =
  /^(xin )?chào( bạn| ai coach| coach)?[!.,\s]*$|^(hi|hello|hey)[!.,\s]*$/i;

export function detectGreeting(userMessage: string): boolean {
  const trimmed = userMessage.trim();
  if (trimmed.length === 0 || trimmed.length > 30) return false;
  return GREETING_PATTERN.test(trimmed);
}

export function buildGreetingReply(exerciseTitle: string): CannedReplyResult {
  return {
    matched: true,
    reply:
      `Chào bạn! Mình là AI Coach, sẵn sàng hỗ trợ bạn với bài "${exerciseTitle}". ` +
      'Mình có thể giúp gì cho bạn — giải thích đề bài, gỡ lỗi, hay gợi ý hướng làm?',
  };
}
