/**
 * Đề seed trỏ tới dữ liệu có thật: bài Code Playground (`exerciseSlug`) hoặc
 * phần trắc nghiệm ghép từ ngân hàng câu hỏi (`bankCategory` + `bankCount`,
 * được ContestService.seedSampleContests đổi thành `questionIds` lúc seed).
 */
export interface InitialContestProblem {
  title: string;
  slug: string;
  type: 'coding' | 'quiz';
  source: 'exercise' | 'bank';
  exerciseSlug?: string;
  bankCategory?: string;
  bankCount?: number;
  points: number;
  order: number;
}

export interface InitialContestRegistration {
  studentId: string;
  studentName?: string;
  registeredAt: Date;
}

export interface InitialContestData {
  title: string;
  slug: string;
  description: string;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  status: 'draft' | 'published';
  authorId: string;
  problems: InitialContestProblem[];
  registrations: InitialContestRegistration[];
  integrityEnabled?: boolean;
}

export function getInitialContests(): InitialContestData[] {
  const now = new Date();

  // 1. Ongoing 90-minute contest (started 15 mins ago, ends in 75 mins)
  const startTime1 = new Date(now.getTime() - 15 * 60 * 1000);
  const endTime1 = new Date(now.getTime() + 75 * 60 * 1000);

  // 2. Upcoming 120-minute contest (starts in 2 hours, ends in 4 hours)
  const startTime2 = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const endTime2 = new Date(startTime2.getTime() + 120 * 60 * 1000);

  // 3. Ended 150-minute contest (started 2 days ago, ended 2 days ago - 150m)
  const startTime3 = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const endTime3 = new Date(startTime3.getTime() + 150 * 60 * 1000);

  // 4. Draft contest (scheduled for next week)
  const startTime4 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const endTime4 = new Date(startTime4.getTime() + 60 * 60 * 1000);

  return [
    {
      title: 'Cybersoft Python Championship 2026',
      slug: 'cybersoft-python-championship-2026',
      description:
        'Cuộc thi lập trình Python tổng hợp dành cho học viên Cybersoft. Thử thách thuật toán, xử lý chuỗi và tư duy cấu trúc dữ liệu.',
      startTime: startTime1,
      endTime: endTime1,
      durationMinutes: 90,
      status: 'published',
      authorId: 'teacher-1',
      problems: [
        {
          title: 'Tính tổng hai số nguyên',
          slug: 'tinh-tong-hai-so-nguyen',
          type: 'coding',
          source: 'exercise',
          exerciseSlug: 'tinh-tong-hai-so-nguyen',
          points: 100,
          order: 1,
        },
        {
          title: 'Kiểm tra chuỗi Palindrome',
          slug: 'kiem-tra-palindrome',
          type: 'coding',
          source: 'exercise',
          exerciseSlug: 'kiem-tra-palindrome',
          points: 100,
          order: 2,
        },
        {
          title: 'Trắc nghiệm Kiến thức Python Core',
          slug: 'python-core-quiz',
          type: 'quiz',
          source: 'bank',
          bankCategory: 'Python',
          bankCount: 5,
          points: 50,
          order: 3,
        },
      ],
      registrations: [],
    },
    {
      title: 'Fullstack Speedrun Hackathon 2026',
      slug: 'fullstack-speedrun-hackathon-2026',
      description:
        'Kỳ thi thử thách thuật toán lập trình web và trắc nghiệm kiến thức Fullstack (React Hooks, Node.js API & MongoDB).',
      startTime: startTime2,
      endTime: endTime2,
      durationMinutes: 120,
      status: 'published',
      authorId: 'teacher-1',
      problems: [
        {
          title: 'Đảo ngược chuỗi',
          slug: 'dao-nguoc-chuoi',
          type: 'coding',
          source: 'exercise',
          exerciseSlug: 'dao-nguoc-chuoi',
          points: 100,
          order: 1,
        },
        {
          title: 'Trắc nghiệm HTML5 & CSS3',
          slug: 'trac-nghiem-web',
          type: 'quiz',
          source: 'bank',
          bankCategory: 'HTML5',
          bankCount: 5,
          points: 100,
          order: 2,
        },
      ],
      registrations: [],
    },
    {
      title: 'Thuật Toán & Cấu Trúc Dữ Liệu Nâng Cao',
      slug: 'thuat-toan-cau-truc-du-lieu-nang-cao',
      description:
        'Giải đấu thuật toán quy mô toàn trung tâm. Thử thách đệ quy, sắp xếp tối ưu và tư duy xử lý mảng hai chiều.',
      startTime: startTime3,
      endTime: endTime3,
      durationMinutes: 150,
      status: 'published',
      authorId: 'teacher-1',
      problems: [
        {
          title: 'Sắp xếp danh sách tăng dần',
          slug: 'sap-xep-tang-dan',
          type: 'coding',
          source: 'exercise',
          exerciseSlug: 'sap-xep-tang-dan',
          points: 100,
          order: 1,
        },
        {
          title: 'Ước chung lớn nhất (GCD)',
          slug: 'uoc-chung-lon-nhat',
          type: 'coding',
          source: 'exercise',
          exerciseSlug: 'uoc-chung-lon-nhat',
          points: 100,
          order: 2,
        },
      ],
      registrations: [],
    },
    {
      title: 'Kỳ Thi Thử Đánh Giá Năng Lực Lập Trình (Draft)',
      slug: 'ky-thi-thu-danh-gia-nang-luc-draft',
      description:
        'Bài thi mẫu nội bộ do Giảng viên thiết kế, dùng để thử nghiệm hệ thống chấm tự động (chưa công khai cho học viên).',
      startTime: startTime4,
      endTime: endTime4,
      durationMinutes: 60,
      status: 'draft',
      authorId: 'teacher-1',
      problems: [
        {
          title: 'Tổng đường chéo ma trận vuông',
          slug: 'tong-duong-cheo-ma-tran',
          type: 'coding',
          source: 'exercise',
          exerciseSlug: 'tong-duong-cheo-ma-tran',
          points: 100,
          order: 1,
        },
      ],
      registrations: [],
    },
  ];
}

/**
 * Đề seed phần trắc nghiệm chỉ khai báo chủ đề + số câu; lúc seed lấy câu hỏi
 * thật trong ngân hàng. Chủ đề chưa có câu hỏi thì bỏ đề đó (cuộc thi vẫn tạo
 * được với các đề còn lại).
 */
export async function resolveSeedProblems(
  contests: InitialContestData[],
  findQuestionIds: (category: string, limit: number) => Promise<string[]>,
): Promise<InitialContestData[]> {
  for (const c of contests) {
    const problems: Array<InitialContestProblem & { questionIds?: string[] }> = [];
    for (const p of c.problems) {
      if (p.source === 'bank') {
        const ids = await findQuestionIds(p.bankCategory ?? '', p.bankCount ?? 5);
        if (ids.length === 0) continue;
        const { bankCategory: _c, bankCount: _n, ...rest } = p;
        problems.push({ ...rest, questionIds: ids });
      } else {
        problems.push(p);
      }
    }
    c.problems = problems.map((p, i) => ({ ...p, order: i + 1 }));
  }
  return contests;
}
