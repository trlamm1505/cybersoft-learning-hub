import type { Lesson } from '../types/course';

export const MOCK_LESSONS: Lesson[] = [
  {
    id: 'lesson-01',
    lessonNumber: 1,
    title: 'Tổng quan HTML5 & Structural Semantic Elements',
    slug: 'html5-semantic-elements',
    category: 'Frontend Fundamentals',
    summary: 'Nắm vững các thẻ Semantic trong HTML5, tối ưu SEO và Accessibility cho giao diện ứng dụng web.',
    difficulty: 'Beginner',
    durationMinutes: 30,
    durationText: '30 phút',
    objectives: [
      'Hiểu rõ sự khác biệt giữa Non-semantic (div, span) và Semantic tags (header, nav, article, section, footer).',
      'Xây dựng bố cục trang web đạt chuẩn Accessibility (a11y) và chuẩn cấu trúc SEO.',
      'Sử dụng các thuộc tính ARIA cơ bản như role, aria-label, aria-expanded.'
    ],
    prerequisites: [
      {
        id: 'pre-01-1',
        title: 'Kiến thức máy tính & Trình duyệt cơ bản',
        isCompleted: true,
        description: 'Biết thao tác cơ bản với Chrome DevTools và Code Editor (VS Code).'
      },
      {
        id: 'pre-01-2',
        title: 'Cấu trúc thư mục dự án Web',
        isCompleted: true,
        description: 'Hiểu cách liên kết file HTML, CSS và JavaScript.'
      }
    ],
    videoUrl: 'https://www.youtube-nocookie.com/embed/UB1O30fR-EE',
    contentMarkdown: `
### 1. Tại sao cần Semantic HTML?
HTML Semantic giúp trình duyệt, công cụ tìm kiếm (Search Engines) và công nghệ hỗ trợ đọc màn hình (Screen Readers) hiểu chính xác ý nghĩa của dữ liệu trên trang web.

\`\`\`html
<!-- Bad Structure -->
<div class="header">
  <div class="nav">...</div>
</div>

<!-- Good Semantic Structure -->
<header>
  <nav aria-label="Main Navigation">...</nav>
</header>
\`\`\`

### 2. Các thẻ Semantic phổ biến:
- \`<header>\`: Chứa logo, tiêu đề chính, thanh điều hướng.
- \`<nav>\`: Thanh điều hướng liên kết chính.
- \`<main>\`: Nội dung trung tâm duy nhất của trang.
- \`<article>\`: Nội dung độc lập có thể phân phối riêng lẻ.
- \`<aside>\`: Thanh bên bổ trợ cho nội dung chính.
- \`<footer>\`: Chân trang chứa thông tin bản quyền và liên kết phụ.
    `,
    instructor: {
      name: 'Đặng Thùy Dương',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DuongCyber',
      role: 'Senior Frontend Engineer @ CyberSoft'
    },
    tags: ['HTML5', 'Semantic', 'SEO', 'Accessibility']
  },
  {
    id: 'lesson-02',
    lessonNumber: 2,
    title: 'Bố cục Web hiện đại với CSS Grid & Flexbox Mastery',
    slug: 'css-grid-flexbox-mastery',
    category: 'CSS Architecture',
    summary: 'Làm chủ các kỹ thuật chia layout responsive linh hoạt từ mobile đến desktop với Flexbox và Grid.',
    difficulty: 'Intermediate',
    durationMinutes: 45,
    durationText: '45 phút',
    objectives: [
      'Phân biệt khi nào nên dùng Flexbox (1 chiều) và khi nào dùng CSS Grid (2 chiều).',
      'Tạo layout Responsive tự động co giãn không cần viết quá nhiều Media Queries.',
      'Sử dụng các thuộc tính nâng cao: grid-template-areas, auto-fit, minmax(), flex-grow, flex-shrink.'
    ],
    prerequisites: [
      {
        id: 'pre-02-1',
        title: 'HTML5 Semantic Structure (Bài 01)',
        isCompleted: true,
        description: 'Đã hoàn thành bài học HTML5 Semantic cơ bản.'
      },
      {
        id: 'pre-02-2',
        title: 'CSS Box Model & Selectors',
        isCompleted: true,
        description: 'Nắm vững Margin, Padding, Border, Content Box và CSS Selectors.'
      }
    ],
    videoUrl: 'https://www.youtube-nocookie.com/embed/jV8B24rSN5o',
    contentMarkdown: `
### 1. Flexbox vs CSS Grid
- **Flexbox**: Dành cho giao diện 1 chiều (hàng hoặc cột). Rất thích hợp cho Navbar, Card Header, Button Groups.
- **CSS Grid**: Dành cho bố cục 2 chiều (hàng & cột kết hợp). Thích hợp cho Dashboard, Card Grid System.

\`\`\`css
/* Responsive Grid không cần Breakpoints */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}
\`\`\`
    `,
    instructor: {
      name: 'Trần Minh Quân',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=QuanCyber',
      role: 'CSS & UI Specialist @ CyberSoft'
    },
    tags: ['CSS3', 'Flexbox', 'CSS Grid', 'Responsive']
  },
  {
    id: 'lesson-03',
    lessonNumber: 3,
    title: 'JavaScript ES6+ Deep Dive & Asynchronous Programming',
    slug: 'js-es6-async-await',
    category: 'JavaScript Core',
    summary: 'Chinh phục Destructuring, Arrow Functions, Promises và Async/Await trong lập trình web xử lý bất đồng bộ.',
    difficulty: 'Intermediate',
    durationMinutes: 50,
    durationText: '50 phút',
    objectives: [
      'Hiểu bản chất của Event Loop, Call Stack và Callback Queue trong JavaScript Engine.',
      'Sử dụng thành thạo Promise, Promise.all() và cú pháp Async/Await sạch sẽ.',
      'Áp dụng ES6+ Modules, Array Methods (map, filter, reduce) vào dữ liệu mảng.'
    ],
    prerequisites: [
      {
        id: 'pre-03-1',
        title: 'JavaScript Căn bản',
        isCompleted: true,
        description: 'Biết khai báo biến (let/const), câu điều kiện if/else và vòng lặp for.'
      },
      {
        id: 'pre-03-2',
        title: 'DOM Manipulation',
        isCompleted: true,
        description: 'Hiểu cách truy xuất phần tử DOM và bắt sự kiện (addEventListener).'
      }
    ],
    videoUrl: 'https://www.youtube-nocookie.com/embed/V_Kr9OSfDeU',
    contentMarkdown: `
### 1. Async / Await Cú pháp xử lý bất đồng bộ chuẩn:
\`\`\`javascript
async function fetchCourseData(courseId) {
  try {
    const response = await fetch(\`/api/courses/\${courseId}\`);
    if (!response.ok) throw new Error('Không thể tải bài học!');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Lỗi khi gọi API:', error);
  }
}
\`\`\`
    `,
    instructor: {
      name: 'Nguyễn Tiến Dũng',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DungCyber',
      role: 'Fullstack Lead @ CyberSoft'
    },
    tags: ['JavaScript', 'ES6+', 'Async Await', 'API Integration']
  },
  {
    id: 'lesson-04',
    lessonNumber: 4,
    title: 'React Architecture, Hooks & Component Lifecycle',
    slug: 'react-hooks-component-architecture',
    category: 'React Framework',
    summary: 'Xây dựng tư duy thiết kế Component linh hoạt, kiểm soát Side Effects với useEffect và Custom Hooks.',
    difficulty: 'Advanced',
    durationMinutes: 60,
    durationText: '60 phút',
    objectives: [
      'Tách biệt Presentation Component và Container Component.',
      'Sử dụng useState, useEffect, useMemo, useCallback đúng cách tránh re-render không cần thiết.',
      'Tự viết Custom Hooks để đóng gói logic tái sử dụng (useFetch, useDebounce).'
    ],
    prerequisites: [
      {
        id: 'pre-04-1',
        title: 'JavaScript ES6+ & Async/Await (Bài 03)',
        isCompleted: true,
        description: 'Phải thành thạo Arrow Function, Destructuring, Import/Export.'
      },
      {
        id: 'pre-04-2',
        title: 'Node.js & NPM / Vite Environment',
        isCompleted: true,
        description: 'Biết cách khởi tạo và chạy dự án Vite React.'
      }
    ],
    videoUrl: 'https://www.youtube-nocookie.com/embed/w7ejDZ8SWv8',
    contentMarkdown: `
### Custom Hook ví dụ: useWindowSize
\`\`\`tsx
import { useState, useEffect } from 'react';

export function useWindowSize() {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}
\`\`\`
    `,
    instructor: {
      name: 'Đặng Thùy Dương',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DuongCyber',
      role: 'Senior Frontend Engineer @ CyberSoft'
    },
    tags: ['React', 'Hooks', 'State Management', 'TypeScript']
  },
  {
    id: 'lesson-05',
    lessonNumber: 5,
    title: 'Quản lý Trạng thái Toàn cục & Tích hợp RESTful API',
    slug: 'state-management-rest-api',
    category: 'Frontend Engineering',
    summary: 'Kết nối ứng dụng Frontend React với Backend API, quản lý State toàn cục bằng Context API hoặc Redux Toolkit.',
    difficulty: 'Advanced',
    durationMinutes: 75,
    durationText: '75 phút',
    objectives: [
      'Tổ chức tầng API Service tách biệt với UI components.',
      'Xử lý trạng thái Loading, Error, Success và Pagination chuẩn UX.',
      'Xây dựng luồng Authentication với JWT Token và Axios Interceptors.'
    ],
    prerequisites: [
      {
        id: 'pre-05-1',
        title: 'React Hooks & Component Lifecycle (Bài 04)',
        isCompleted: true,
        description: 'Cần nắm vững useState, useEffect và Props drilling.'
      },
      {
        id: 'pre-05-2',
        title: 'RESTful API Specification',
        isCompleted: false,
        description: 'Khái niệm về HTTP Methods (GET, POST, PUT, DELETE) & Status Codes (200, 401, 404, 500).'
      }
    ],
    videoUrl: 'https://www.youtube-nocookie.com/embed/0riHps91AzE',
    contentMarkdown: `
### Kiến trúc Data Flow trong ứng dụng lớn:
1. **Service Layer**: Thực hiện HTTP Call thông qua Axios client instance.
2. **State Management**: Đẩy dữ liệu vào Redux Store / Context Provider.
3. **UI Layer**: Component đọc dữ liệu và render giao diện tương tác.
    `,
    instructor: {
      name: 'Nguyễn Tiến Dũng',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DungCyber',
      role: 'Fullstack Lead @ CyberSoft'
    },
    tags: ['Redux', 'Context API', 'REST API', 'Axios', 'JWT']
  }
];
