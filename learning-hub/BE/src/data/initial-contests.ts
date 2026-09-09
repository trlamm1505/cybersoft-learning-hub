export interface InitialContestProblem {
  title: string;
  slug: string;
  type: 'coding' | 'quiz';
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
          title: 'Tính tổng N số nguyên đầu tiên',
          slug: 'sum-first-n-numbers',
          type: 'coding',
          points: 100,
          order: 1,
        },
        {
          title: 'Kiểm tra chuỗi Palindrome chuẩn',
          slug: 'check-palindrome-string',
          type: 'coding',
          points: 100,
          order: 2,
        },
        {
          title: 'Trắc nghiệm Kiến thức Python Core',
          slug: 'python-core-quiz',
          type: 'quiz',
          points: 50,
          order: 3,
        },
      ],
      registrations: [
        {
          studentId: 'student-demo',
          studentName: 'Học viên Demo',
          registeredAt: new Date(now.getTime() - 30 * 60 * 1000),
        },
      ],
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
          title: 'Đảo ngược mảng số nguyên',
          slug: 'reverse-integer-array',
          type: 'coding',
          points: 100,
          order: 1,
        },
        {
          title: 'Trắc nghiệm Lập trình Web ES6 & React',
          slug: 'standard-web',
          type: 'quiz',
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
          points: 100,
          order: 1,
        },
        {
          title: 'Ước chung lớn nhất (GCD)',
          slug: 'uoc-chung-lon-nhat',
          type: 'coding',
          points: 100,
          order: 2,
        },
      ],
      registrations: [
        {
          studentId: 'student-demo',
          studentName: 'Học viên Demo',
          registeredAt: new Date(startTime3.getTime() - 60 * 60 * 1000),
        },
      ],
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
          points: 100,
          order: 1,
        },
      ],
      registrations: [],
    },
  ];
}
