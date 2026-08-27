export const INITIAL_USERS = [
  {
    email: 'admin@gmail.com',
    passwordRaw: '123456',
    fullName: 'Admin System',
    role: 'ADMIN',
    bio: 'System Administrator',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Admin',
  },
  {
    email: 'teacher@gmail.com',
    passwordRaw: '123456',
    fullName: 'Thầy Hoàng Nam',
    role: 'TEACHER',
    bio: 'Senior Teacher',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Teacher',
  },
  {
    email: 'student@gmail.com',
    passwordRaw: '123456',
    fullName: 'Bé Bo (Học sinh)',
    role: 'STUDENT',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Student',
  },
];

export const INITIAL_COURSES = [
  {
    title: 'Lập Trình Python Nhập Môn Cho Thiếu Niên (K6-9)',
    slug: 'lap-trinh-python-nhap-mon-k6-9',
    description: 'Khóa học chuyển giao từ Scratch sang Python thực chiến qua các minigame hấp dẫn.',
    thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600',
    level: 'TEEN',
    isPublished: true,
    authorEmail: 'teacher@gmail.com',
    lessons: [
      {
        title: 'Bài 1: Khái Niệm Biến Và Phép Toán Cơ Bản',
        slug: 'bai-1-bien-va-phep-toan',
        content: '# Bài 1: Biến và Phép Toán trong Python\nHọc cách khai báo biến và phép cộng, trừ...',
        videoUrl: 'https://www.youtube.com/embed/sample_video',
        orderIndex: 1,
        exercises: [
          {
            title: 'Tính tổng hai số nguyên A và B',
            slug: 'tinh-tong-hai-so-nguyen-a-b',
            description: 'Cho hai số nguyên A và B. In ra kết quả tổng A + B trên một dòng.',
            type: 'CODE_TEXT',
            difficulty: 'EASY',
            points: 10,
            starterCode: 'a = int(input())\nb = int(input())\n',
            solutionCode: 'a = int(input())\nb = int(input())\nprint(a + b)',
            testCases: [
              { input: '3\n5', expectedOutput: '8', isHidden: false },
              { input: '100\n250', expectedOutput: '350', isHidden: false },
              { input: '-15\n40', expectedOutput: '25', isHidden: true },
              { input: '999999\n1', expectedOutput: '1000000', isHidden: true },
            ],
          },
        ],
      },
    ],
  },
  {
    title: 'Truy Vấn Dữ Liệu Thực Chiến Với SQL (Data Analyst)',
    slug: 'truy-van-du-lieu-thuc-chien-sql',
    description: 'Thực hành các câu lệnh SQL SELECT, JOIN, GROUP BY trên Dataset thương mại điện tử.',
    thumbnail: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=600',
    level: 'ADULT',
    isPublished: true,
    authorEmail: 'teacher@gmail.com',
    lessons: [
      {
        title: 'Bài 1: Lọc Dữ Liệu Khách Hàng Với Câu Lệnh SELECT & WHERE',
        slug: 'bai-1-select-where-sql',
        content: '# Bài 1: Lọc dữ liệu trong SQL\nHướng dẫn lọc đơn hàng...',
        orderIndex: 1,
        exercises: [
          {
            title: 'Truy vấn danh sách đơn hàng có giá trị trên 500$',
            slug: 'truy-van-don-hang-tren-500-dollar',
            description: 'Viết câu lệnh SQL lọc tất cả đơn hàng có `total_amount > 500`.',
            type: 'SQL_LAB',
            difficulty: 'EASY',
            points: 15,
            starterCode: 'SELECT * FROM orders;\n',
            solutionCode: 'SELECT * FROM orders WHERE total_amount > 500;',
            testCases: [
              { input: 'CREATE TABLE orders (id INT, total_amount INT); INSERT INTO orders VALUES (1, 600);', expectedOutput: '1|600', isHidden: false },
              { input: 'CREATE TABLE orders (id INT, total_amount INT); INSERT INTO orders VALUES (1, 1000);', expectedOutput: '1|1000', isHidden: true },
            ],
          },
        ],
      },
    ],
  },
];
