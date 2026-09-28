import { Injectable, Logger } from '@nestjs/common';
import { ProblemDraft, ProblemSpec } from './problem-generator.types';

export interface ProblemGeneratorLlmClient {
  generate(spec: ProblemSpec): Promise<ProblemDraft>;
}

function slugify(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface Template {
  // Mẫu learning outcome mà template này áp dụng được, so khớp thô bằng từ
  // khóa tiếng Việt không dấu — đủ dùng cho stub v0.1, không cần NLP thật.
  match: RegExp;
  build: (spec: ProblemSpec) => Omit<ProblemDraft, 'specId' | 'slug'>;
}

const TEMPLATES: Template[] = [
  {
    match: /(vong lap|for|while|tong|sum)/i,
    build: (spec) => ({
      title: `Tính tổng dãy số theo điều kiện (${spec.level})`,
      description:
        `Cho một số nguyên dương N. Tính tổng các số nguyên từ 1 đến N ` +
        `thỏa điều kiện chia hết cho 3 hoặc 5. In ra kết quả trên một dòng. ` +
        `Ràng buộc: ${spec.constraints.join('; ') || 'không có ràng buộc bổ sung'}.`,
      difficulty: spec.level,
      tags: spec.tags,
      starterCode: 'n = int(input())\n# Viết code của bạn ở đây\n',
      solutionCode:
        'n = int(input())\n' +
        'total = 0\n' +
        'for i in range(1, n + 1):\n' +
        '    if i % 3 == 0 or i % 5 == 0:\n' +
        '        total += i\n' +
        'print(total)',
      testCases: [
        { input: '10', expectedOutput: '33', isHidden: false },
        { input: '1', expectedOutput: '0', isHidden: false },
        { input: '20', expectedOutput: '98', isHidden: true },
        { input: '100', expectedOutput: '2418', isHidden: true },
      ],
    }),
  },
  {
    match: /(chuoi|string|palindrome|doi xung|ky tu)/i,
    build: (spec) => ({
      title: `Kiểm tra chuỗi đối xứng (${spec.level})`,
      description:
        `Cho một chuỗi S chỉ gồm chữ cái thường không dấu. In ra "Yes" nếu S ` +
        `là chuỗi đối xứng (palindrome), ngược lại in ra "No". ` +
        `Ràng buộc: ${spec.constraints.join('; ') || 'không có ràng buộc bổ sung'}.`,
      difficulty: spec.level,
      tags: spec.tags,
      starterCode: 's = input()\n# Viết code của bạn ở đây\n',
      solutionCode: 's = input()\nprint("Yes" if s == s[::-1] else "No")',
      testCases: [
        { input: 'abcba', expectedOutput: 'Yes', isHidden: false },
        { input: 'abcd', expectedOutput: 'No', isHidden: false },
        { input: 'a', expectedOutput: 'Yes', isHidden: true },
        { input: 'abccba', expectedOutput: 'Yes', isHidden: true },
      ],
    }),
  },
  {
    match: /(list|mang|array|danh sach|max|min)/i,
    build: (spec) => ({
      title: `Tìm phần tử lớn thứ hai trong danh sách (${spec.level})`,
      description:
        `Cho số nguyên N và N số nguyên trên dòng tiếp theo, cách nhau bởi ` +
        `khoảng trắng. In ra giá trị lớn thứ hai trong danh sách (các phần ` +
        `tử trùng giá trị chỉ tính một lần). Ràng buộc: ` +
        `${spec.constraints.join('; ') || 'không có ràng buộc bổ sung'}.`,
      difficulty: spec.level,
      tags: spec.tags,
      starterCode:
        'n = int(input())\nnums = list(map(int, input().split()))\n# Viết code của bạn ở đây\n',
      solutionCode:
        'n = int(input())\n' +
        'nums = list(map(int, input().split()))\n' +
        'unique_sorted = sorted(set(nums), reverse=True)\n' +
        'print(unique_sorted[1])',
      testCases: [
        { input: '5\n3 1 4 1 5', expectedOutput: '4', isHidden: false },
        { input: '3\n10 10 5', expectedOutput: '5', isHidden: false },
        { input: '4\n7 7 7 2', expectedOutput: '2', isHidden: true },
        { input: '6\n9 8 7 6 5 4', expectedOutput: '8', isHidden: true },
      ],
    }),
  },
  {
    match: /.*/,
    build: (spec) => ({
      title: `So sánh hai số nguyên (${spec.level})`,
      description:
        `Cho hai số nguyên A và B, mỗi số trên một dòng. In ra "A" nếu A > B, ` +
        `"B" nếu B > A, hoặc "Equal" nếu bằng nhau. Ràng buộc: ` +
        `${spec.constraints.join('; ') || 'không có ràng buộc bổ sung'}.`,
      difficulty: spec.level,
      tags: spec.tags,
      starterCode: 'a = int(input())\nb = int(input())\n# Viết code của bạn ở đây\n',
      solutionCode:
        'a = int(input())\n' +
        'b = int(input())\n' +
        'print("A" if a > b else "B" if b > a else "Equal")',
      testCases: [
        { input: '5\n3', expectedOutput: 'A', isHidden: false },
        { input: '2\n8', expectedOutput: 'B', isHidden: false },
        { input: '4\n4', expectedOutput: 'Equal', isHidden: true },
        { input: '-1\n1', expectedOutput: 'B', isHidden: true },
      ],
    }),
  },
];

/**
 * Implementation mặc định khi chưa cấu hình LLM thật (repo hiện chưa cài SDK
 * Gemini/Anthropic/OpenAI nào — xem coach-llm.client.ts). Chọn template theo
 * từ khóa trong learningOutcome/tags rồi ghép statement + test case + solution
 * cố định, KHÔNG gọi mạng ngoài, để pipeline chạy được end-to-end trong CI.
 *
 * Khi có API key Gemini/Anthropic thật, thay class này bằng implementation
 * gọi model, giữ nguyên interface ProblemGeneratorLlmClient để không phải
 * sửa lại pipeline hay validator.
 */
@Injectable()
export class StubProblemGeneratorClient implements ProblemGeneratorLlmClient {
  private readonly logger = new Logger(StubProblemGeneratorClient.name);

  async generate(spec: ProblemSpec): Promise<ProblemDraft> {
    const haystack = `${spec.learningOutcome} ${spec.tags.join(' ')}`;
    const template = TEMPLATES.find((t) => t.match.test(haystack))!;
    const built = template.build(spec);

    this.logger.debug(`Generated draft for spec ${spec.id}: ${built.title}`);

    return {
      specId: spec.id,
      slug: `${slugify(built.title)}-${spec.id}`,
      ...built,
    };
  }
}
