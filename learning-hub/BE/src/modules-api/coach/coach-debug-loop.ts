import { scrubServerPaths } from '../../common/utils/server-path.util';
import {
  DebugErrorCategory,
  DebugLoopResult,
  DebugLoopState,
  DebugLoopTestInput,
} from './coach-debug-loop.types';

// Giới hạn tối đa số vòng lặp thử-sai được AI đồng hành chủ động cho MỘT bài.
// Sau ngưỡng này, loop ép chuyển hướng (xem lại hint/hỏi người hướng dẫn) thay
// vì tiếp tục đoán — điều kiện nghiệm thu "giới hạn tối đa vòng lặp".
export const MAX_DEBUG_LOOPS = 5;

// Nhận diện traceback lỗi Python phổ biến để phân loại + giải thích đúng
// trọng tâm, tái dùng đúng bộ pattern đã kiểm chứng ở coach-llm.client.ts để
// hai nơi không lệch nhau về cách hiểu lỗi.
const ERROR_PATTERNS: Array<{ match: RegExp; kind: string; explain: string }> =
  [
    {
      match: /SyntaxError:.*was never closed|SyntaxError:.*unexpected EOF/i,
      kind: 'thiếu dấu đóng ngoặc/quote',
      explain:
        'Python báo một dấu ngoặc hoặc dấu nháy đã mở nhưng chưa được đóng lại đúng chỗ. Đếm lại số dấu ( ) [ ] { } hoặc dấu " trên dòng lỗi và các dòng trước đó.',
    },
    {
      match: /SyntaxError/i,
      kind: 'lỗi cú pháp (SyntaxError)',
      explain:
        'Dòng được chỉ ra trong traceback có cú pháp không hợp lệ — kiểm tra dấu hai chấm `:`, thụt lề, hoặc dấu ngoặc ở đúng dòng đó.',
    },
    {
      match: /NameError:\s*name\s*'([^']+)'\s*is not defined/i,
      kind: 'dùng biến chưa được gán giá trị (NameError)',
      explain:
        'Biến được nhắc tới chưa được gán giá trị trước khi dùng, hoặc bị gõ sai tên. Kiểm tra chính tả và thứ tự các dòng lệnh.',
    },
    {
      match: /TypeError/i,
      kind: 'sai kiểu dữ liệu khi thao tác (TypeError)',
      explain:
        'Một phép toán/hàm đang áp dụng lên sai kiểu dữ liệu. Kiểm tra kiểu trả về của `input()` (luôn là chuỗi) — cần `int()`/`float()` nếu muốn tính toán.',
    },
    {
      match: /IndexError/i,
      kind: 'truy cập vị trí không tồn tại trong danh sách (IndexError)',
      explain:
        'Đang truy cập chỉ số vượt quá độ dài thực tế của danh sách/chuỗi. Kiểm tra điều kiện vòng lặp hoặc độ dài dữ liệu đầu vào.',
    },
    {
      match: /IndentationError/i,
      kind: 'lỗi thụt lề (IndentationError)',
      explain:
        'Các dòng trong cùng khối (if/for/while/def) cần thụt lề đều nhau. Kiểm tra có lẫn tab và space, hoặc thụt lề không khớp khối cha.',
    },
    {
      match: /ZeroDivisionError/i,
      kind: 'chia cho 0 (ZeroDivisionError)',
      explain:
        'Mẫu số của một phép chia đang bằng 0 tại thời điểm chạy. Kiểm tra điều kiện chặn trước khi chia hoặc dữ liệu đầu vào.',
    },
    {
      match: /KeyError/i,
      kind: 'truy cập key không tồn tại trong dict (KeyError)',
      explain:
        'Đang truy cập một key chưa tồn tại trong dictionary. Kiểm tra lại tên key hoặc dùng `.get()` để kiểm tra trước.',
    },
    {
      match: /AttributeError/i,
      kind: 'gọi thuộc tính/phương thức không tồn tại (AttributeError)',
      explain:
        'Đối tượng không có thuộc tính/phương thức được gọi — có thể sai kiểu dữ liệu hoặc gõ nhầm tên phương thức.',
    },
    {
      match: /ValueError/i,
      kind: 'giá trị không hợp lệ cho thao tác (ValueError)',
      explain:
        'Giá trị truyền vào đúng kiểu nhưng không hợp lệ cho thao tác (ví dụ `int("abc")`). Kiểm tra định dạng dữ liệu đầu vào trước khi convert.',
    },
  ];

function classifyByStatus(status: string): DebugErrorCategory {
  switch (status) {
    case 'AC':
      return 'PASSED';
    case 'CE':
      return 'COMPILE_SYNTAX';
    case 'RE':
      return 'RUNTIME_EXCEPTION';
    case 'TLE':
      return 'TIMEOUT';
    case 'WA':
    case 'FAILED':
    default:
      return 'WRONG_OUTPUT';
  }
}

function findKnownPattern(
  text: string | undefined,
): { kind: string; explain: string } | undefined {
  if (!text) return undefined;
  return ERROR_PATTERNS.find((p) => p.match.test(text));
}

function truncate(text: string | undefined, maxLen = 300): string | undefined {
  if (!text) return text;
  return text.length > maxLen ? `${text.slice(0, maxLen)}…` : text;
}

/** Giá trị để in vào câu feedback: không bao giờ ra chữ "undefined"/"null" (Day 30, DEF-058). */
function shown(text: string | undefined | null, maxLen: number, empty = '(trống)'): string {
  if (text === undefined || text === null || text === '') return empty;
  return truncate(text, maxLen) as string;
}

/**
 * Tóm tắt lỗi cho học viên (Day 30, DEF-035): che đường dẫn máy chủ rồi chỉ giữ DÒNG LỖI CUỐI của traceback (tên lỗi +
 * thông điệp) kèm số dòng trong bài làm — không lặp lại cả traceback hay đường dẫn thư mục tạm.
 */
export function summarizeError(text: string | undefined): string | undefined {
  if (!text) return undefined;
  const clean = scrubServerPaths(text);
  const lines = clean.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return undefined;
  const last = lines[lines.length - 1];
  const lineNo = [...clean.matchAll(/line (\d+)/g)].pop()?.[1];
  return truncate(lineNo && !/^Dòng \d+/.test(last) ? `Dòng ${lineNo}: ${last}` : last, 300);
}

function buildFeedbackAndNextStep(
  category: DebugErrorCategory,
  input: DebugLoopTestInput,
): { feedback: string; nextStep: string } {
  const test = input.firstFailingTest;

  if (category === 'PASSED') {
    return {
      feedback: `Tất cả ${input.passedCount}/${input.totalCount} test đã pass.`,
      nextStep:
        'Bài đã đạt AC. Có thể thử tối ưu độ phức tạp hoặc thử thêm test case biên tự nghĩ ra.',
    };
  }

  if (category === 'COMPILE_SYNTAX' || category === 'RUNTIME_EXCEPTION') {
    const pattern = findKnownPattern(test?.stderr ?? input.errorMessage);
    const stderrExcerpt = summarizeError(test?.stderr ?? input.errorMessage);
    if (pattern) {
      return {
        feedback: `Chương trình dừng vì ${pattern.kind}. Trích lỗi thật: "${stderrExcerpt}". ${pattern.explain}`,
        nextStep:
          'Sửa đúng dòng được traceback chỉ ra rồi nộp lại. Không đoán mò các dòng khác khi chưa sửa xong dòng này.',
      };
    }
    return {
      feedback: `Chương trình dừng với lỗi: "${stderrExcerpt ?? '(không có thông tin lỗi)'}".`,
      nextStep:
        'Đọc kỹ dòng cuối của traceback (thường chứa tên lỗi và vị trí) rồi sửa đúng chỗ đó trước.',
    };
  }

  if (category === 'TIMEOUT') {
    return {
      feedback: test
        ? `Bài chạy quá thời gian cho phép ở test ${test.index ?? '?'} (input: "${shown(test.input, 120)}").`
        : 'Bài chạy quá thời gian cho phép.',
      nextStep:
        'Kiểm tra có vòng lặp không thoát được (điều kiện dừng sai) hoặc thuật toán có độ phức tạp quá cao so với kích thước input.',
    };
  }

  // WRONG_OUTPUT
  if (!test) {
    // Bài chưa có test case (hoặc không xác định được test sai): nói rõ thay vì in "undefined" (DEF-058).
    return {
      feedback: 'Bài tập này chưa có test case hiển thị để so sánh kết quả, nên mình chưa chỉ ra được test nào sai.',
      nextStep: 'Tự chạy thử với vài input ví dụ trong đề bài (nút Run) và so với kết quả mong đợi; nếu bài thiếu test, hãy báo giảng viên.',
    };
  }
  return {
    feedback:
      `Sai ở test ${test?.index ?? '?'}${test?.isHidden ? ' (ẩn — chỉ biết là sai, không biết input/expected cụ thể)' : ''}. ` +
      (test?.isHidden
        ? 'Không thể tiết lộ chi tiết test ẩn.'
        : `Input: "${shown(test.input, 200)}" — Kỳ vọng: "${shown(test.expectedOutput, 200)}" — Thực tế: "${shown(test.actualOutput, 200)}".`),
    nextStep: test?.isHidden
      ? 'Rà lại các trường hợp biên (rỗng, âm, trùng lặp, giới hạn lớn) mà các test công khai chưa cover.'
      : 'So sánh từng bước giữa output thực tế và kỳ vọng để xác định logic sai ở đâu (ví dụ: sai điều kiện, lệch chỉ số, thiếu xử lý trường hợp biên).',
  };
}

/**
 * Phân tích một lượt submit thất bại/thành công và trả về feedback có căn cứ
 * từ kết quả test thật, kèm trạng thái vòng lặp.
 *
 * KHÔNG bịa số liệu: mọi câu feedback về lỗi phải bắt nguồn từ `input` (status
 * thật, stderr thật, expected/actual thật của DebugLoopTestInput).
 */
export function analyzeDebugLoop(
  input: DebugLoopTestInput,
  state: DebugLoopState,
  maxLoops: number = MAX_DEBUG_LOOPS,
): DebugLoopResult {
  const category = classifyByStatus(input.status);
  const loopCount = state.attemptsSoFar + 1;
  const loopLimitReached = category !== 'PASSED' && loopCount >= maxLoops;

  const { feedback, nextStep } = buildFeedbackAndNextStep(category, input);

  const test = input.firstFailingTest;
  const evidence =
    category === 'PASSED'
      ? null
      : {
          testIndex: test?.index,
          isHiddenTest: test?.isHidden,
          input: test?.isHidden ? undefined : test?.input,
          expectedOutput: test?.isHidden ? undefined : test?.expectedOutput,
          actualOutput: test?.isHidden ? undefined : test?.actualOutput,
          stderrExcerpt: summarizeError(test?.stderr ?? input.errorMessage),
        };

  const finalNextStep = loopLimitReached
    ? `Bạn đã thử ${loopCount} lần liên tiếp chưa qua được bài này (giới hạn ${maxLoops} lần/lượt đồng hành liên tục). ` +
      'Hãy dừng đoán mò: đọc lại kỹ đề bài + gợi ý đã mở, hoặc nhờ người hướng dẫn xem trực tiếp code trước khi thử tiếp.'
    : nextStep;

  return {
    errorCategory: category,
    evidence,
    feedback,
    nextStep: finalNextStep,
    loopCount,
    loopLimitReached,
    maxLoops,
  };
}
