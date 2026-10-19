import { ProblemSpec } from './problem-generator.types';
import { canaryLine } from './problem-safety';

// Ghép learning outcome, level, constraints, tags thành một prompt văn bản
// thật gửi cho LLM — đúng yêu cầu đề bài ngày 19 "Tạo prompt từ learning
// outcome, level, constraints". Tách riêng khỏi client gọi model để cả
// GeminiProblemGeneratorClient lẫn báo cáo (report ghi lại prompt đã dùng)
// đều dùng chung một nguồn, không lệch nhau.
/** Chỉ thị sư phạm theo khối đối tượng, nối vào prompt gửi mô hình. */
export const BAND_INSTRUCTION: Record<'6-9' | '10-12', string> = {
  '6-9': 'KHỐI 6-9 (cơ bản): bài toán gắn với tư duy logic cơ bản, cấu trúc rẽ nhánh (if/else), vòng lặp đơn, cú pháp Python tường minh, dễ hiểu; đề bài ngắn gọn, ví dụ gần gũi với học sinh; KHÔNG yêu cầu tối ưu thuật toán hay cấu trúc dữ liệu phức tạp.',
  '10-12': 'KHỐI 10-12 (nâng cao/chuyên sâu): có ràng buộc thuật toán tối ưu và yêu cầu rõ độ phức tạp thời gian/bộ nhớ (ví dụ O(N log N)), có thể dùng mảng 2 chiều, cấu trúc dữ liệu (stack, queue, heap, dict/set), đệ quy hoặc quy hoạch động cơ bản; cần test lớn để phân biệt lời giải chậm.',
};

export function buildProblemPrompt(spec: ProblemSpec, canary?: string): string {
  const prompt = `Bạn là người ra đề bài tập lập trình Python cho học viên. Hãy sinh MỘT bài tập lập trình dựa trên thông tin sau:

Learning outcome (mục tiêu học): ${spec.learningOutcome}
Mức độ (level): ${spec.level}
Chỉ thị theo khối đối tượng: ${BAND_INSTRUCTION[spec.band ?? '6-9']}
Ràng buộc (constraints): ${spec.constraints.length > 0 ? spec.constraints.join('; ') : 'không có ràng buộc bổ sung'}
Tags: ${spec.tags.join(', ')}

Yêu cầu bắt buộc:
1. Bài tập nhận input qua stdin (hàm input() của Python) và in kết quả ra stdout (print()), không dùng tham số hàm hay return value làm giao diện chấm bài.
2. Đưa ra đúng 1 lời giải Python 3 chuẩn (solutionCode) chạy được ngay, không phụ thuộc thư viện ngoài chuẩn.
3. Đưa ra ít nhất 4 test case: ít nhất 2 test case ví dụ minh họa (isHidden=false) và ít nhất 2 test case ẩn dùng để chấm điểm thật (isHidden=true), bao gồm cả trường hợp biên phù hợp với ràng buộc đã cho.
4. Với MỖI test case, hãy đưa input đa dạng (có trường hợp biên). expectedOutput sẽ được hệ thống TỰ TÍNH LẠI bằng cách chạy solutionCode, nên tập trung viết solutionCode đúng và input hợp lệ theo đề; không cần tính nhẩm.
5. Trả lời DUY NHẤT một object JSON đúng theo schema đã cung cấp, không thêm markdown code fence, không thêm giải thích ngoài JSON.

Schema JSON bắt buộc:
{
  "title": string,
  "description": string (đề bài đầy đủ bằng tiếng Việt, ghi rõ định dạng input/output),
  "starterCode": string (code khung ban đầu cho học viên, có đọc input sẵn),
  "solutionCode": string (lời giải đầy đủ),
  "testCases": [ { "input": string, "expectedOutput": string, "isHidden": boolean } ]
}`;
  return canary ? prompt + canaryLine(canary) : prompt;
}
