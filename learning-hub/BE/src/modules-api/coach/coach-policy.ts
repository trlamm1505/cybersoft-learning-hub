import { CoachContext } from './coach-context.types';

export interface PolicyCheckResult {
  allowed: boolean;
  reason?: string;
  // Nội dung đã được "làm mờ" để trả về thay cho response gốc khi bị chặn.
  sanitizedContent?: string;
}

// Ngưỡng coi một khối code là "đủ dài để là lời giải trọn vẹn" thay vì một
// đoạn minh hoạ cú pháp ngắn. Đây là heuristic đơn giản cho v0.1, không thay
// thế được việc so khớp AST, nhưng đủ để chặn các trường hợp lộ liễu.
const FULL_SOLUTION_CODE_BLOCK_MIN_LINES = 6;

// Các cụm từ điển hình khi model "đầu hàng" và đưa thẳng đáp án đầy đủ.
const FULL_SOLUTION_PHRASES = [
  /đây là (lời giải|đáp án|code) (đầy đủ|hoàn chỉnh)/i,
  /full solution/i,
  /copy.{0,10}paste/i,
];

function countCodeBlockLines(content: string): number {
  const codeBlocks: string[] = content.match(/```[\s\S]*?```/g) ?? [];
  return codeBlocks.reduce((max: number, block: string) => {
    const lines = block.split('\n').filter((l) => l.trim().length > 0 && !l.trim().startsWith('```'));
    return Math.max(max, lines.length);
  }, 0);
}

/**
 * Kiểm tra response của AI trước khi trả về học viên.
 * Cấm đưa full solution khi context.policy.allowFullSolution === false.
 */
export function checkCoachResponsePolicy(content: string, context: CoachContext): PolicyCheckResult {
  if (context.policy.allowFullSolution) {
    return { allowed: true };
  }

  const longestCodeBlock = countCodeBlockLines(content);
  if (longestCodeBlock >= FULL_SOLUTION_CODE_BLOCK_MIN_LINES) {
    return {
      allowed: false,
      reason: `Response chứa khối code ${longestCodeBlock} dòng, vượt ngưỡng cho phép (${FULL_SOLUTION_CODE_BLOCK_MIN_LINES}) khi học viên chưa AC hoặc chưa mở hết tầng gợi ý.`,
      sanitizedContent: sanitizeToHintStyle(content),
    };
  }

  const matchedPhrase = FULL_SOLUTION_PHRASES.find((re) => re.test(content));
  if (matchedPhrase) {
    return {
      allowed: false,
      reason: `Response chứa cụm từ báo hiệu đưa nguyên đáp án: ${matchedPhrase}`,
      sanitizedContent: sanitizeToHintStyle(content),
    };
  }

  return { allowed: true };
}

function sanitizeToHintStyle(_original: string): string {
  return (
    'Mình chưa thể đưa lời giải đầy đủ cho bài này ngay bây giờ. ' +
    'Bạn hãy tự nộp bài để đạt AC, hoặc mở tiếp các tầng gợi ý để mình có thể ' +
    'hướng dẫn chi tiết hơn theo từng bước.'
  );
}

/**
 * Kiểm tra context builder có vô tình đưa dữ liệu bị cấm vào prompt hay không
 * (hidden test cases, solutionCode). Dùng ở lớp service trước khi gọi model,
 * như một lớp phòng thủ thứ hai độc lập với builder.
 */
export function assertContextHasNoForbiddenData(context: CoachContext): void {
  const serialized = JSON.stringify(context);
  if (/solutionCode/i.test(serialized)) {
    throw new Error('Policy violation: context chứa solutionCode, không được gửi cho model.');
  }
}
