import { ProblemSpec } from './problem-generator.types';

// Ghép learning outcome, level, constraints, tags thành một prompt văn bản
// thật gửi cho LLM — đúng yêu cầu đề bài ngày 19 "Tạo prompt từ learning
// outcome, level, constraints". Tách riêng khỏi client gọi model để cả
// GeminiProblemGeneratorClient lẫn báo cáo (report ghi lại prompt đã dùng)
// đều dùng chung một nguồn, không lệch nhau.
export function buildProblemPrompt(spec: ProblemSpec): string {
  return `Bạn là người ra đề bài tập lập trình Python cho học viên. Hãy sinh MỘT bài tập lập trình dựa trên thông tin sau:

Learning outcome (mục tiêu học): ${spec.learningOutcome}
Mức độ (level): ${spec.level}
Ràng buộc (constraints): ${spec.constraints.length > 0 ? spec.constraints.join('; ') : 'không có ràng buộc bổ sung'}
Tags: ${spec.tags.join(', ')}

Yêu cầu bắt buộc:
1. Bài tập nhận input qua stdin (hàm input() của Python) và in kết quả ra stdout (print()), không dùng tham số hàm hay return value làm giao diện chấm bài.
2. Đưa ra đúng 1 lời giải Python 3 chuẩn (solutionCode) chạy được ngay, không phụ thuộc thư viện ngoài chuẩn.
3. Đưa ra ít nhất 4 test case: ít nhất 2 test case ví dụ minh họa (isHidden=false) và ít nhất 2 test case ẩn dùng để chấm điểm thật (isHidden=true), bao gồm cả trường hợp biên phù hợp với ràng buộc đã cho.
4. Với MỖI test case, expectedOutput phải là kết quả CHÍNH XÁC khi chạy solutionCode với input đó — không được đoán hay tính nhẩm sai.
5. Trả lời DUY NHẤT một object JSON đúng theo schema đã cung cấp, không thêm markdown code fence, không thêm giải thích ngoài JSON.

Schema JSON bắt buộc:
{
  "title": string,
  "description": string (đề bài đầy đủ bằng tiếng Việt, ghi rõ định dạng input/output),
  "starterCode": string (code khung ban đầu cho học viên, có đọc input sẵn),
  "solutionCode": string (lời giải đầy đủ),
  "testCases": [ { "input": string, "expectedOutput": string, "isHidden": boolean } ]
}`;
}
