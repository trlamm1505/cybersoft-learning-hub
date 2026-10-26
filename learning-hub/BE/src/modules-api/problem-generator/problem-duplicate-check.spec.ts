import { findDuplicateCandidates } from './problem-duplicate-check';
import { ProblemDraft } from './problem-generator.types';

function makeDraft(overrides: Partial<ProblemDraft> = {}): ProblemDraft {
  return {
    specId: 'spec-test',
    title: 'Bài kiểm thử',
    slug: 'bai-kiem-thu-spec-test',
    description: 'Mô tả bài kiểm thử.',
    difficulty: 'EASY',
    tags: ['test'],
    starterCode: '',
    solutionCode: 'print(1)',
    testCases: [],
    ...overrides,
  };
}

describe('findDuplicateCandidates', () => {
  // Đối chiếu với DB thật KHÔNG còn nghĩa là 3 file fixture tĩnh nữa — hàm
  // giờ nhận existingExercises làm tham số, caller (ProblemGeneratorService)
  // chịu trách nhiệm query Mongoose thật. Test này mô phỏng đúng việc đó:
  // một bài "vừa được giáo viên khác lưu một phút trước" xuất hiện trong
  // existingExercises dù KHÔNG có trong bất kỳ file fixture nào.
  it('phát hiện trùng lặp với một exercise vừa được lưu vào DB (không nằm trong fixture tĩnh)', () => {
    const draft = makeDraft({
      title: 'Tính chu vi hình chữ nhật',
      description: 'Cho chiều dài và chiều rộng, tính chu vi hình chữ nhật.',
    });

    const justSavedByAnotherTeacher = [
      {
        slug: 'chu-vi-hcn-vua-luu',
        title: 'Tính chu vi hình chữ nhật',
        description: 'Cho chiều dài và chiều rộng, tính chu vi hình chữ nhật.',
      },
    ];

    const matches = findDuplicateCandidates(draft, justSavedByAnotherTeacher);

    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].existingSlug).toBe('chu-vi-hcn-vua-luu');
  });

  it('không báo trùng khi existingExercises rỗng (DB chưa có bài nào)', () => {
    const draft = makeDraft();
    expect(findDuplicateCandidates(draft, [])).toEqual([]);
  });

  it('không báo trùng khi nội dung thật sự khác nhau', () => {
    const draft = makeDraft({
      title: 'Kiểm tra số nguyên tố',
      description: 'Cho một số nguyên dương, kiểm tra xem có phải số nguyên tố hay không.',
    });
    const existing = [
      {
        slug: 'doi-tien-te',
        title: 'Đổi đơn vị tiền tệ',
        description: 'Chuyển đổi giá trị tiền từ VND sang USD theo tỷ giá cho trước.',
      },
    ];

    expect(findDuplicateCandidates(draft, existing)).toEqual([]);
  });

  it('sắp xếp nhiều kết quả trùng theo độ tương đồng giảm dần', () => {
    const draft = makeDraft({
      title: 'Tính tổng hai số nguyên',
      description: 'Cho hai số nguyên A và B, in ra tổng A cộng B.',
    });
    const existing = [
      {
        slug: 'gan-giong',
        title: 'Tính tổng ba số nguyên',
        description: 'Cho ba số nguyên, in ra tổng của chúng.',
      },
      {
        slug: 'giong-het',
        title: 'Tính tổng hai số nguyên',
        description: 'Cho hai số nguyên A và B, in ra tổng A cộng B.',
      },
    ];

    const matches = findDuplicateCandidates(draft, existing);
    expect(matches[0].existingSlug).toBe('giong-het');
    expect(matches[0].similarity).toBeGreaterThanOrEqual(
      matches[matches.length - 1].similarity,
    );
  });

  describe('isHardBlock — phân biệt cảnh báo mềm (override được) và chặn cứng (không override được)', () => {
    it('đánh dấu isHardBlock=true khi slug trùng tuyệt đối với một bài đã có', () => {
      const draft = makeDraft({ slug: 'da-ton-tai', title: 'Bai moi', description: 'Mo ta hoan toan khac' });
      const existing = [
        { slug: 'da-ton-tai', title: 'Bai cu khac han', description: 'Noi dung khac biet ro rang' },
      ];

      const matches = findDuplicateCandidates(draft, existing);
      expect(matches.length).toBe(1);
      expect(matches[0].isHardBlock).toBe(true);
    });

    it('đánh dấu isHardBlock=true khi title trùng tuyệt đối (không phân biệt hoa/thường, dấu, khoảng trắng thừa)', () => {
      const draft = makeDraft({
        slug: 'bai-moi-slug',
        title: '  TÍNH  TỔNG hai SỐ nguyên  ',
        description: 'Mo ta khac',
      });
      const existing = [
        { slug: 'bai-cu-slug', title: 'tính tổng hai số nguyên', description: 'Mo ta hoan toan khac ban dau' },
      ];

      const matches = findDuplicateCandidates(draft, existing);
      expect(matches.length).toBe(1);
      expect(matches[0].isHardBlock).toBe(true);
    });

    it('đánh dấu isHardBlock=false khi chỉ là cảnh báo mềm (similarity vừa qua ngưỡng cảnh báo, slug/title khác nhau)', () => {
      const draft = makeDraft({
        slug: 'bai-a',
        title: 'Tính tổng dãy số từ 1 đến N',
        description: 'Cho số nguyên N, tính tổng các số từ 1 đến N và in ra kết quả.',
      });
      const existing = [
        {
          slug: 'bai-b-khac-slug',
          title: 'Tính tổng các số từ 1 đến N cho trước',
          description: 'Cho một số nguyên N, tính tổng dãy số nguyên liên tiếp từ 1 đến N.',
        },
      ];

      const matches = findDuplicateCandidates(draft, existing);
      expect(matches.length).toBe(1);
      expect(matches[0].similarity).toBeGreaterThanOrEqual(0.5);
      expect(matches[0].similarity).toBeLessThan(0.95);
      expect(matches[0].isHardBlock).toBe(false);
    });

    it('đánh dấu isHardBlock=true khi similarity nội dung >= 95% dù slug/title không trùng tuyệt đối', () => {
      // Description dài và giống hệt nhau (union rất lớn, không khác biệt),
      // chỉ đổi đúng 1 từ trong title ngắn — tổng thể similarity vượt xa 0.95
      // trong khi title/slug vẫn không trùng tuyệt đối (đúng nhánh
      // similarity-only, không rơi vào exactTitleMatch/exactSlugMatch).
      const longDescription =
        'Cho hai so nguyen duong a va b nhap tu ban phim moi so tren mot dong ' +
        'rieng biet hay tinh tong cua hai so nay va in ket qua ra man hinh ' +
        'theo dung dinh dang yeu cau cua de bai kem theo rang buoc gia tri';

      const draft = makeDraft({
        slug: 'bai-slug-rieng',
        title: 'Tinh tong hai so nguyen',
        description: longDescription,
      });
      const existing = [
        {
          slug: 'bai-slug-khac',
          title: 'Tinh tong ba so nguyen',
          description: longDescription,
        },
      ];

      const matches = findDuplicateCandidates(draft, existing);
      expect(matches.length).toBe(1);
      expect(matches[0].similarity).toBeGreaterThanOrEqual(0.95);
      expect(matches[0].isHardBlock).toBe(true);
    });
  });
});
