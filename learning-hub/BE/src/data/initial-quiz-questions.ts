export interface InitialQuestion {
  content: string;
  codeSnippet?: string;
  category: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  points: number;
  options: {
    key: string;
    text: string;
    isCorrect: boolean;
  }[];
  explanation: string;
  tags: string[];
}

// 20 câu Python cơ bản + 20 câu HTML5 cơ bản + 20 câu CSS3 cơ bản = 60 câu.
// Mỗi câu có đúng 4 lựa chọn (A/B/C/D) và đúng 1 đáp án isCorrect: true —
// ràng buộc này được kiểm tra tự động trong seed-quiz.ts trước khi ghi vào DB.
export const INITIAL_QUIZ_QUESTIONS: InitialQuestion[] = [
  // ==================== PYTHON CƠ BẢN (20 câu) ====================
  {
    content:
      'Trong Python, từ khóa/ký hiệu nào được dùng để gán giá trị cho một biến?',
    category: 'Python',
    difficulty: 'EASY',
    points: 10,
    options: [
      { key: 'A', text: 'let', isCorrect: false },
      { key: 'B', text: 'var', isCorrect: false },
      { key: 'C', text: '=', isCorrect: true },
      { key: 'D', text: 'const', isCorrect: false },
    ],
    explanation:
      'Python không cần từ khóa khai báo biến — chỉ cần dùng dấu `=` để gán giá trị, ví dụ `x = 5`.',
    tags: ['Python', 'Variables'],
  },
  {
    content:
      'Hàm nào được dùng để đọc dữ liệu người dùng nhập từ bàn phím trong Python?',
    category: 'Python',
    difficulty: 'EASY',
    points: 10,
    options: [
      { key: 'A', text: 'input()', isCorrect: true },
      { key: 'B', text: 'read()', isCorrect: false },
      { key: 'C', text: 'scan()', isCorrect: false },
      { key: 'D', text: 'get()', isCorrect: false },
    ],
    explanation:
      'Hàm `input()` đọc một dòng dữ liệu từ STDIN và luôn trả về kiểu chuỗi (`str`).',
    tags: ['Python', 'IO'],
  },
  {
    content:
      'Kiểu dữ liệu nào trong Python là danh sách có thể thay đổi được (mutable)?',
    category: 'Python',
    difficulty: 'EASY',
    points: 10,
    options: [
      { key: 'A', text: 'tuple', isCorrect: false },
      { key: 'B', text: 'str', isCorrect: false },
      { key: 'C', text: 'list', isCorrect: true },
      { key: 'D', text: 'frozenset', isCorrect: false },
    ],
    explanation:
      '`list` cho phép thêm/xóa/sửa phần tử sau khi tạo, trong khi `tuple`, `str`, `frozenset` là các kiểu bất biến (immutable).',
    tags: ['Python', 'Data Types'],
  },
  {
    content:
      'Vòng lặp nào trong Python thích hợp nhất khi biết trước số lần lặp cần thực hiện?',
    category: 'Python',
    difficulty: 'EASY',
    points: 10,
    options: [
      { key: 'A', text: 'for i in range(n):', isCorrect: true },
      { key: 'B', text: 'while True:', isCorrect: false },
      { key: 'C', text: 'do...while', isCorrect: false },
      { key: 'D', text: 'loop(n):', isCorrect: false },
    ],
    explanation:
      '`for i in range(n)` lặp đúng `n` lần theo chỉ số biết trước; `while` phù hợp hơn khi điều kiện dừng không biết trước số lần lặp.',
    tags: ['Python', 'Loops'],
  },
  {
    content: 'Toán tử nào trong Python dùng để lấy phần dư của phép chia?',
    category: 'Python',
    difficulty: 'EASY',
    points: 10,
    options: [
      { key: 'A', text: '//', isCorrect: false },
      { key: 'B', text: '%', isCorrect: true },
      { key: 'C', text: '**', isCorrect: false },
      { key: 'D', text: 'mod', isCorrect: false },
    ],
    explanation:
      'Toán tử `%` trả về phần dư (ví dụ `7 % 2` bằng `1`); `//` là chia lấy phần nguyên.',
    tags: ['Python', 'Operators'],
  },
  {
    content:
      'Hàm nào dùng để chuyển một chuỗi số (ví dụ từ `input()`) thành kiểu số nguyên trong Python?',
    category: 'Python',
    difficulty: 'EASY',
    points: 10,
    options: [
      { key: 'A', text: 'str()', isCorrect: false },
      { key: 'B', text: 'int()', isCorrect: true },
      { key: 'C', text: 'float()', isCorrect: false },
      { key: 'D', text: 'num()', isCorrect: false },
    ],
    explanation:
      '`int()` chuyển chuỗi hoặc số thực thành số nguyên, ví dụ `int("5")` trả về `5`.',
    tags: ['Python', 'Type Conversion'],
  },
  {
    content:
      'Phương thức nào của chuỗi (string) trong Python dùng để tách chuỗi thành danh sách các từ dựa theo khoảng trắng?',
    category: 'Python',
    difficulty: 'MEDIUM',
    points: 10,
    options: [
      { key: 'A', text: '.join()', isCorrect: false },
      { key: 'B', text: '.split()', isCorrect: true },
      { key: 'C', text: '.strip()', isCorrect: false },
      { key: 'D', text: '.format()', isCorrect: false },
    ],
    explanation:
      "`\"a b c\".split()` trả về `['a', 'b', 'c']`, mặc định tách theo khoảng trắng.",
    tags: ['Python', 'Strings'],
  },
  {
    content:
      'Cấu trúc dữ liệu nào trong Python lưu các cặp khóa-giá trị (key-value)?',
    category: 'Python',
    difficulty: 'MEDIUM',
    points: 10,
    options: [
      { key: 'A', text: 'list', isCorrect: false },
      { key: 'B', text: 'set', isCorrect: false },
      { key: 'C', text: 'dict', isCorrect: true },
      { key: 'D', text: 'tuple', isCorrect: false },
    ],
    explanation:
      '`dict` (dictionary) lưu trữ dữ liệu dưới dạng `{key: value}`, cho phép truy xuất giá trị nhanh theo khóa.',
    tags: ['Python', 'Data Types'],
  },
  {
    content: 'Đoạn code `for i in range(3): print(i)` in ra các giá trị nào?',
    category: 'Python',
    difficulty: 'MEDIUM',
    points: 10,
    options: [
      { key: 'A', text: '1 2 3', isCorrect: false },
      { key: 'B', text: '0 1 2', isCorrect: true },
      { key: 'C', text: '0 1 2 3', isCorrect: false },
      { key: 'D', text: '1 2', isCorrect: false },
    ],
    explanation:
      '`range(3)` sinh dãy số bắt đầu từ 0 đến 2 (không bao gồm 3), nên vòng lặp in ra `0`, `1`, `2`.',
    tags: ['Python', 'Loops'],
  },
  {
    content: 'Từ khóa nào dùng để định nghĩa một hàm (function) trong Python?',
    category: 'Python',
    difficulty: 'EASY',
    points: 10,
    options: [
      { key: 'A', text: 'function', isCorrect: false },
      { key: 'B', text: 'def', isCorrect: true },
      { key: 'C', text: 'func', isCorrect: false },
      { key: 'D', text: 'define', isCorrect: false },
    ],
    explanation:
      'Python dùng từ khóa `def` để định nghĩa hàm, ví dụ `def greet(): ...`.',
    tags: ['Python', 'Functions'],
  },
  {
    content: 'Kết quả của biểu thức `bool(0)` trong Python là gì?',
    category: 'Python',
    difficulty: 'MEDIUM',
    points: 10,
    options: [
      { key: 'A', text: 'True', isCorrect: false },
      { key: 'B', text: 'False', isCorrect: true },
      { key: 'C', text: '0', isCorrect: false },
      { key: 'D', text: 'None', isCorrect: false },
    ],
    explanation:
      'Trong Python, số `0` được coi là "falsy" nên `bool(0)` trả về `False`.',
    tags: ['Python', 'Booleans'],
  },
  {
    content:
      'Câu lệnh nào dùng để kiểm tra một phần tử có tồn tại trong danh sách (list) không?',
    category: 'Python',
    difficulty: 'EASY',
    points: 10,
    options: [
      { key: 'A', text: 'x in my_list', isCorrect: true },
      { key: 'B', text: 'x.has(my_list)', isCorrect: false },
      { key: 'C', text: 'my_list.contains(x)', isCorrect: false },
      { key: 'D', text: 'exists(x, my_list)', isCorrect: false },
    ],
    explanation:
      'Toán tử `in` kiểm tra một phần tử có nằm trong một chuỗi/danh sách hay không, ví dụ `3 in [1,2,3]` trả về `True`.',
    tags: ['Python', 'Lists'],
  },
  {
    content: 'Hàm nào trả về số lượng phần tử của một danh sách trong Python?',
    category: 'Python',
    difficulty: 'EASY',
    points: 10,
    options: [
      { key: 'A', text: 'count(my_list)', isCorrect: false },
      { key: 'B', text: 'size(my_list)', isCorrect: false },
      { key: 'C', text: 'len(my_list)', isCorrect: true },
      { key: 'D', text: 'my_list.length', isCorrect: false },
    ],
    explanation:
      '`len()` là hàm built-in trả về số phần tử của list, chuỗi, tuple, dict...',
    tags: ['Python', 'Built-in Functions'],
  },
  {
    content:
      'Comment (chú thích) một dòng trong Python được viết bằng ký tự nào?',
    category: 'Python',
    difficulty: 'EASY',
    points: 10,
    options: [
      { key: 'A', text: '//', isCorrect: false },
      { key: 'B', text: '#', isCorrect: true },
      { key: 'C', text: '--', isCorrect: false },
      { key: 'D', text: '/* */', isCorrect: false },
    ],
    explanation:
      'Python dùng dấu `#` để viết comment một dòng; mọi nội dung sau `#` trên dòng đó bị bỏ qua khi chạy.',
    tags: ['Python', 'Syntax'],
  },
  {
    content:
      'Trong Python, khối lệnh thuộc cùng một `if`/`for`/`def` được xác định bằng gì?',
    category: 'Python',
    difficulty: 'EASY',
    points: 10,
    options: [
      { key: 'A', text: 'Dấu ngoặc nhọn { }', isCorrect: false },
      { key: 'B', text: 'Từ khóa "begin/end"', isCorrect: false },
      { key: 'C', text: 'Thụt lề (indentation)', isCorrect: true },
      { key: 'D', text: 'Dấu chấm phẩy ;', isCorrect: false },
    ],
    explanation:
      'Python dùng thụt lề (thường 4 dấu cách) để xác định khối lệnh, thay vì dấu ngoặc nhọn như nhiều ngôn ngữ khác.',
    tags: ['Python', 'Syntax'],
  },
  {
    content:
      'Toán tử nào dùng để kiểm tra hai giá trị có BẰNG NHAU trong Python?',
    category: 'Python',
    difficulty: 'EASY',
    points: 10,
    options: [
      { key: 'A', text: '=', isCorrect: false },
      { key: 'B', text: '==', isCorrect: true },
      { key: 'C', text: '===', isCorrect: false },
      { key: 'D', text: 'equals()', isCorrect: false },
    ],
    explanation:
      '`=` dùng để gán giá trị, còn `==` dùng để so sánh bằng nhau giữa hai giá trị.',
    tags: ['Python', 'Operators'],
  },
  {
    content:
      'Phương thức nào thêm một phần tử vào cuối danh sách (list) trong Python?',
    category: 'Python',
    difficulty: 'EASY',
    points: 10,
    options: [
      { key: 'A', text: '.push()', isCorrect: false },
      { key: 'B', text: '.append()', isCorrect: true },
      { key: 'C', text: '.add()', isCorrect: false },
      { key: 'D', text: '.insertLast()', isCorrect: false },
    ],
    explanation:
      '`list.append(x)` thêm phần tử `x` vào cuối danh sách; `.push()` không tồn tại trong Python (đó là JavaScript).',
    tags: ['Python', 'Lists'],
  },
  {
    content: 'Khối lệnh nào dùng để bắt và xử lý lỗi (exception) trong Python?',
    category: 'Python',
    difficulty: 'MEDIUM',
    points: 10,
    options: [
      { key: 'A', text: 'try / except', isCorrect: true },
      { key: 'B', text: 'try / catch', isCorrect: false },
      { key: 'C', text: 'do / rescue', isCorrect: false },
      { key: 'D', text: 'begin / error', isCorrect: false },
    ],
    explanation:
      'Python dùng cú pháp `try / except` để bắt lỗi runtime, khác với `try / catch` của JavaScript/Java.',
    tags: ['Python', 'Exceptions'],
  },
  {
    content:
      'Kiểu dữ liệu nào trong Python đại diện cho giá trị "không có gì" (rỗng/không xác định)?',
    category: 'Python',
    difficulty: 'EASY',
    points: 10,
    options: [
      { key: 'A', text: 'null', isCorrect: false },
      { key: 'B', text: 'undefined', isCorrect: false },
      { key: 'C', text: 'None', isCorrect: true },
      { key: 'D', text: 'NaN', isCorrect: false },
    ],
    explanation:
      'Python dùng `None` (viết hoa chữ N) để biểu diễn giá trị rỗng, khác với `null`/`undefined` của JavaScript.',
    tags: ['Python', 'Data Types'],
  },
  {
    content:
      'Đoạn code sau in ra kết quả gì?\n```python\na = 5\nb = 2\nprint(a // b)\n```',
    category: 'Python',
    difficulty: 'MEDIUM',
    points: 10,
    options: [
      { key: 'A', text: '2.5', isCorrect: false },
      { key: 'B', text: '2', isCorrect: true },
      { key: 'C', text: '3', isCorrect: false },
      { key: 'D', text: '1', isCorrect: false },
    ],
    explanation:
      'Toán tử `//` là phép chia lấy phần nguyên (floor division), `5 // 2` bằng `2`.',
    tags: ['Python', 'Operators'],
  },

  // ==================== HTML5 CƠ BẢN (20 câu) ====================
  {
    content: 'Thẻ nào được dùng để khai báo tiêu đề lớn nhất trên trang HTML?',
    category: 'HTML5',
    difficulty: 'EASY',
    points: 10,
    options: [
      { key: 'A', text: '<h6>', isCorrect: false },
      { key: 'B', text: '<title>', isCorrect: false },
      { key: 'C', text: '<h1>', isCorrect: true },
      { key: 'D', text: '<head>', isCorrect: false },
    ],
    explanation:
      '`<h1>` là thẻ tiêu đề cấp lớn nhất (quan trọng nhất) trong 6 cấp `<h1>`-`<h6>` của HTML.',
    tags: ['HTML5', 'Basics'],
  },
  {
    content:
      'Thẻ HTML5 Semantic nào dưới đây thích hợp nhất để bọc thanh điều hướng liên kết chính của trang web?',
    category: 'HTML5',
    difficulty: 'EASY',
    points: 10,
    options: [
      { key: 'A', text: '<section>', isCorrect: false },
      { key: 'B', text: '<nav>', isCorrect: true },
      { key: 'C', text: '<aside>', isCorrect: false },
      { key: 'D', text: '<header>', isCorrect: false },
    ],
    explanation:
      'Thẻ `<nav>` trong HTML5 được thiết kế chuyên biệt để chứa các liên kết điều hướng (Navigation links), giúp Screen Readers và công cụ tìm kiếm hiểu rõ cấu trúc menu trang.',
    tags: ['HTML5', 'Semantic'],
  },
  {
    content:
      'Thuộc tính nào của thẻ `<img>` dùng để mô tả nội dung ảnh cho người dùng khiếm thị/screen reader?',
    category: 'HTML5',
    difficulty: 'EASY',
    points: 10,
    options: [
      { key: 'A', text: 'title', isCorrect: false },
      { key: 'B', text: 'src', isCorrect: false },
      { key: 'C', text: 'alt', isCorrect: true },
      { key: 'D', text: 'description', isCorrect: false },
    ],
    explanation:
      'Thuộc tính `alt` cung cấp văn bản thay thế cho hình ảnh, quan trọng cho Accessibility và SEO.',
    tags: ['HTML5', 'Accessibility'],
  },
  {
    content:
      'Thẻ nào dùng để tạo một liên kết (hyperlink) đến trang khác trong HTML?',
    category: 'HTML5',
    difficulty: 'EASY',
    points: 10,
    options: [
      { key: 'A', text: '<link>', isCorrect: false },
      { key: 'B', text: '<a>', isCorrect: true },
      { key: 'C', text: '<href>', isCorrect: false },
      { key: 'D', text: '<url>', isCorrect: false },
    ],
    explanation:
      'Thẻ `<a href="...">` tạo siêu liên kết; `<link>` chỉ dùng để liên kết tài nguyên như CSS trong `<head>`.',
    tags: ['HTML5', 'Links'],
  },
  {
    content:
      'Thuộc tính ARIA nào được dùng để thông báo cho công nghệ đọc màn hình biết một phần tử Menu/Dropdown đang ở trạng thái mở hay đóng?',
    category: 'HTML5',
    difficulty: 'MEDIUM',
    points: 10,
    options: [
      { key: 'A', text: 'aria-hidden', isCorrect: false },
      { key: 'B', text: 'aria-expanded', isCorrect: true },
      { key: 'C', text: 'aria-controls', isCorrect: false },
      { key: 'D', text: 'aria-selected', isCorrect: false },
    ],
    explanation:
      '`aria-expanded="true"` hoặc `false` biểu thị trạng thái mở hoặc thu gọn của một phần tử điều khiển (như accordion, dropdown menu) chuẩn WAI-ARIA.',
    tags: ['HTML5', 'Accessibility', 'WAI-ARIA'],
  },
  {
    content:
      'Thẻ nào dùng để chèn một danh sách không có thứ tự (bullet list) trong HTML?',
    category: 'HTML5',
    difficulty: 'EASY',
    points: 10,
    options: [
      { key: 'A', text: '<ol>', isCorrect: false },
      { key: 'B', text: '<list>', isCorrect: false },
      { key: 'C', text: '<ul>', isCorrect: true },
      { key: 'D', text: '<dl>', isCorrect: false },
    ],
    explanation:
      '`<ul>` (unordered list) tạo danh sách dấu chấm; `<ol>` (ordered list) tạo danh sách đánh số.',
    tags: ['HTML5', 'Lists'],
  },
  {
    content:
      'Thẻ nào trong HTML5 dùng để chứa nội dung độc lập, có thể phân phối riêng lẻ (ví dụ một bài báo)?',
    category: 'HTML5',
    difficulty: 'MEDIUM',
    points: 10,
    options: [
      { key: 'A', text: '<div>', isCorrect: false },
      { key: 'B', text: '<section>', isCorrect: false },
      { key: 'C', text: '<article>', isCorrect: true },
      { key: 'D', text: '<span>', isCorrect: false },
    ],
    explanation:
      '`<article>` biểu diễn nội dung độc lập, tự thân có ý nghĩa (bài viết, bình luận, tin tức...), có thể tái sử dụng riêng lẻ.',
    tags: ['HTML5', 'Semantic'],
  },
  {
    content:
      'Thuộc tính nào của thẻ `<input>` dùng để hiển thị chữ gợi ý mờ khi ô nhập còn trống?',
    category: 'HTML5',
    difficulty: 'EASY',
    points: 10,
    options: [
      { key: 'A', text: 'value', isCorrect: false },
      { key: 'B', text: 'placeholder', isCorrect: true },
      { key: 'C', text: 'hint', isCorrect: false },
      { key: 'D', text: 'label', isCorrect: false },
    ],
    explanation:
      '`placeholder` hiển thị văn bản gợi ý bên trong ô input khi chưa có giá trị, và biến mất khi người dùng gõ.',
    tags: ['HTML5', 'Forms'],
  },
  {
    content:
      'Thẻ nào dùng để nhúng một video trực tiếp vào trang HTML5 (không qua Flash/plugin ngoài)?',
    category: 'HTML5',
    difficulty: 'EASY',
    points: 10,
    options: [
      { key: 'A', text: '<media>', isCorrect: false },
      { key: 'B', text: '<video>', isCorrect: true },
      { key: 'C', text: '<embed>', isCorrect: false },
      { key: 'D', text: '<film>', isCorrect: false },
    ],
    explanation:
      'HTML5 giới thiệu thẻ `<video>` để nhúng video trực tiếp, hỗ trợ điều khiển play/pause qua thuộc tính `controls`.',
    tags: ['HTML5', 'Media'],
  },
  {
    content:
      'Loại thuộc tính `type` nào của `<input>` giới hạn người dùng chỉ nhập được địa chỉ email hợp lệ (có validate cơ bản của trình duyệt)?',
    category: 'HTML5',
    difficulty: 'MEDIUM',
    points: 10,
    options: [
      { key: 'A', text: 'type="text"', isCorrect: false },
      { key: 'B', text: 'type="mail"', isCorrect: false },
      { key: 'C', text: 'type="email"', isCorrect: true },
      { key: 'D', text: 'type="address"', isCorrect: false },
    ],
    explanation:
      '`<input type="email">` được HTML5 hỗ trợ validate định dạng email cơ bản ngay trên trình duyệt trước khi submit form.',
    tags: ['HTML5', 'Forms'],
  },
  {
    content:
      'Thẻ nào chứa metadata (tiêu đề trang, liên kết CSS, charset...) không hiển thị trực tiếp trên trang?',
    category: 'HTML5',
    difficulty: 'EASY',
    points: 10,
    options: [
      { key: 'A', text: '<body>', isCorrect: false },
      { key: 'B', text: '<head>', isCorrect: true },
      { key: 'C', text: '<meta>', isCorrect: false },
      { key: 'D', text: '<info>', isCorrect: false },
    ],
    explanation:
      '`<head>` chứa các thẻ metadata như `<title>`, `<meta>`, `<link>` — không hiển thị nội dung trực tiếp trên trang.',
    tags: ['HTML5', 'Document Structure'],
  },
  {
    content:
      'Thuộc tính nào bắt buộc trên thẻ `<html>` để khai báo ngôn ngữ chính của trang (hỗ trợ Accessibility/SEO)?',
    category: 'HTML5',
    difficulty: 'MEDIUM',
    points: 10,
    options: [
      { key: 'A', text: 'lang', isCorrect: true },
      { key: 'B', text: 'language', isCorrect: false },
      { key: 'C', text: 'locale', isCorrect: false },
      { key: 'D', text: 'charset', isCorrect: false },
    ],
    explanation:
      '`<html lang="vi">` khai báo ngôn ngữ trang, giúp screen reader phát âm đúng và cải thiện SEO.',
    tags: ['HTML5', 'Accessibility'],
  },
  {
    content: 'Thẻ nào dùng để tạo form nhập liệu trong HTML?',
    category: 'HTML5',
    difficulty: 'EASY',
    points: 10,
    options: [
      { key: 'A', text: '<input>', isCorrect: false },
      { key: 'B', text: '<form>', isCorrect: true },
      { key: 'C', text: '<fieldset>', isCorrect: false },
      { key: 'D', text: '<data>', isCorrect: false },
    ],
    explanation:
      '`<form>` là thẻ bao bọc toàn bộ các trường nhập liệu (`<input>`, `<select>`...) và định nghĩa cách gửi dữ liệu.',
    tags: ['HTML5', 'Forms'],
  },
  {
    content:
      'Thẻ nào trong HTML5 dùng làm vùng nội dung chính, duy nhất của trang (chỉ nên xuất hiện một lần)?',
    category: 'HTML5',
    difficulty: 'MEDIUM',
    points: 10,
    options: [
      { key: 'A', text: '<content>', isCorrect: false },
      { key: 'B', text: '<main>', isCorrect: true },
      { key: 'C', text: '<center>', isCorrect: false },
      { key: 'D', text: '<primary>', isCorrect: false },
    ],
    explanation:
      '`<main>` biểu diễn nội dung trung tâm, duy nhất của tài liệu, không lặp lại trong header/footer/sidebar.',
    tags: ['HTML5', 'Semantic'],
  },
  {
    content:
      'Thuộc tính nào của thẻ `<a>` khi gán giá trị `_blank` sẽ mở liên kết ở tab/cửa sổ mới?',
    category: 'HTML5',
    difficulty: 'EASY',
    points: 10,
    options: [
      { key: 'A', text: 'href', isCorrect: false },
      { key: 'B', text: 'rel', isCorrect: false },
      { key: 'C', text: 'target', isCorrect: true },
      { key: 'D', text: 'open', isCorrect: false },
    ],
    explanation:
      '`target="_blank"` mở liên kết trong tab/cửa sổ mới; nên kết hợp thêm `rel="noopener"` vì lý do bảo mật.',
    tags: ['HTML5', 'Links'],
  },
  {
    content:
      'Thẻ nào dùng để nhóm các dòng dữ liệu trong phần thân của bảng (`<table>`)?',
    category: 'HTML5',
    difficulty: 'MEDIUM',
    points: 10,
    options: [
      { key: 'A', text: '<thead>', isCorrect: false },
      { key: 'B', text: '<tbody>', isCorrect: true },
      { key: 'C', text: '<tfoot>', isCorrect: false },
      { key: 'D', text: '<tr>', isCorrect: false },
    ],
    explanation:
      '`<tbody>` nhóm các hàng dữ liệu chính của bảng, tách biệt với `<thead>` (tiêu đề) và `<tfoot>` (chân bảng).',
    tags: ['HTML5', 'Tables'],
  },
  {
    content:
      'Trong HTML5, thẻ `<button>` mặc định (không khai báo `type`) khi đặt trong `<form>` sẽ hoạt động như loại nào?',
    category: 'HTML5',
    difficulty: 'HARD',
    points: 10,
    options: [
      { key: 'A', text: 'type="button"', isCorrect: false },
      { key: 'B', text: 'type="reset"', isCorrect: false },
      { key: 'C', text: 'type="submit"', isCorrect: true },
      { key: 'D', text: 'Không có hành vi mặc định', isCorrect: false },
    ],
    explanation:
      'Nếu không khai báo `type`, `<button>` bên trong `<form>` mặc định là `type="submit"` và sẽ submit form khi bấm.',
    tags: ['HTML5', 'Forms'],
  },
  {
    content:
      'Thẻ nào dùng để hiển thị nội dung dự phòng khi trình duyệt không hỗ trợ `<canvas>` hoặc `<video>`?',
    category: 'HTML5',
    difficulty: 'HARD',
    points: 10,
    options: [
      {
        key: 'A',
        text: 'Nội dung đặt bên trong cặp thẻ đó (fallback content)',
        isCorrect: true,
      },
      { key: 'B', text: '<noscript>', isCorrect: false },
      { key: 'C', text: '<fallback>', isCorrect: false },
      { key: 'D', text: '<alt-content>', isCorrect: false },
    ],
    explanation:
      'HTML5 cho phép đặt nội dung fallback ngay bên trong thẻ `<video>`/`<canvas>`; trình duyệt không hỗ trợ sẽ hiển thị nội dung đó thay vì bỏ qua.',
    tags: ['HTML5', 'Media'],
  },
  {
    content:
      'Ký tự đặc biệt `&amp;` trong HTML dùng để hiển thị ký tự nào trên trang?',
    category: 'HTML5',
    difficulty: 'MEDIUM',
    points: 10,
    options: [
      { key: 'A', text: '@', isCorrect: false },
      { key: 'B', text: '&', isCorrect: true },
      { key: 'C', text: '#', isCorrect: false },
      { key: 'D', text: '%', isCorrect: false },
    ],
    explanation:
      '`&amp;` là HTML entity đại diện cho ký tự `&`, cần thiết vì `&` là ký tự đặc biệt trong cú pháp HTML.',
    tags: ['HTML5', 'Entities'],
  },
  {
    content: 'Khai báo `<!DOCTYPE html>` ở đầu file HTML5 có mục đích gì?',
    category: 'HTML5',
    difficulty: 'EASY',
    points: 10,
    options: [
      { key: 'A', text: 'Nhập một thư viện CSS mặc định', isCorrect: false },
      {
        key: 'B',
        text: 'Báo cho trình duyệt render theo chuẩn HTML5',
        isCorrect: true,
      },
      { key: 'C', text: 'Khai báo múi giờ của trang', isCorrect: false },
      { key: 'D', text: 'Bắt buộc phải có JavaScript', isCorrect: false },
    ],
    explanation:
      '`<!DOCTYPE html>` báo cho trình duyệt biết dùng chế độ chuẩn (standards mode) để render trang theo đặc tả HTML5.',
    tags: ['HTML5', 'Document Structure'],
  },

  // ==================== CSS3 CƠ BẢN (20 câu) ====================
  {
    content: 'Thuộc tính CSS nào dùng để thay đổi màu chữ của văn bản?',
    category: 'CSS3',
    difficulty: 'EASY',
    points: 10,
    options: [
      { key: 'A', text: 'background-color', isCorrect: false },
      { key: 'B', text: 'font-color', isCorrect: false },
      { key: 'C', text: 'color', isCorrect: true },
      { key: 'D', text: 'text-style', isCorrect: false },
    ],
    explanation:
      '`color` là thuộc tính CSS chuẩn để đặt màu cho văn bản; `font-color` không tồn tại.',
    tags: ['CSS3', 'Basics'],
  },
  {
    content:
      'Trong CSS Flexbox, thuộc tính nào được sử dụng để căn chỉnh các phần tử con theo trục phụ (Cross Axis)?',
    category: 'CSS3',
    difficulty: 'EASY',
    points: 10,
    options: [
      { key: 'A', text: 'justify-content', isCorrect: false },
      { key: 'B', text: 'align-items', isCorrect: true },
      { key: 'C', text: 'flex-direction', isCorrect: false },
      { key: 'D', text: 'place-content', isCorrect: false },
    ],
    explanation:
      '`justify-content` căn chỉnh phần tử theo trục chính (Main Axis), còn `align-items` căn chỉnh các phần tử theo trục phụ (Cross Axis).',
    tags: ['CSS3', 'Flexbox'],
  },
  {
    content:
      'Giá trị nào của thuộc tính `grid-template-columns` giúp tự động chia các cột responsive mà không cần viết quá nhiều Media Queries?',
    category: 'CSS3',
    difficulty: 'MEDIUM',
    points: 10,
    options: [
      { key: 'A', text: 'auto-fit kết hợp minmax()', isCorrect: true },
      { key: 'B', text: 'flex-wrap: wrap', isCorrect: false },
      { key: 'C', text: 'grid-auto-flow: dense', isCorrect: false },
      { key: 'D', text: 'repeat(12, 1fr)', isCorrect: false },
    ],
    explanation:
      'Cú pháp `repeat(auto-fit, minmax(280px, 1fr))` trong CSS Grid cho phép các cột tự động co giãn và xuống hàng linh hoạt dựa trên kích thước khung nhìn.',
    tags: ['CSS3', 'Grid', 'Responsive'],
  },
  {
    content:
      'Thuộc tính CSS nào dùng để đặt khoảng cách bên trong một phần tử, giữa nội dung và viền (border)?',
    category: 'CSS3',
    difficulty: 'EASY',
    points: 10,
    options: [
      { key: 'A', text: 'margin', isCorrect: false },
      { key: 'B', text: 'padding', isCorrect: true },
      { key: 'C', text: 'border-spacing', isCorrect: false },
      { key: 'D', text: 'gap', isCorrect: false },
    ],
    explanation:
      '`padding` tạo khoảng đệm bên trong phần tử (giữa nội dung và border); `margin` tạo khoảng cách bên ngoài phần tử.',
    tags: ['CSS3', 'Box Model'],
  },
  {
    content: 'Selector CSS nào dùng để chọn tất cả phần tử có class là "card"?',
    category: 'CSS3',
    difficulty: 'EASY',
    points: 10,
    options: [
      { key: 'A', text: '#card', isCorrect: false },
      { key: 'B', text: 'card', isCorrect: false },
      { key: 'C', text: '.card', isCorrect: true },
      { key: 'D', text: '*card', isCorrect: false },
    ],
    explanation:
      'Dấu chấm `.` đứng trước tên chọn class (`.card`); dấu `#` dùng để chọn theo `id`.',
    tags: ['CSS3', 'Selectors'],
  },
  {
    content:
      'Thuộc tính `display: flex` khi đặt trên một phần tử cha sẽ ảnh hưởng đến gì?',
    category: 'CSS3',
    difficulty: 'EASY',
    points: 10,
    options: [
      { key: 'A', text: 'Ẩn phần tử cha đi', isCorrect: false },
      {
        key: 'B',
        text: 'Biến các phần tử con trực tiếp thành flex item',
        isCorrect: true,
      },
      { key: 'C', text: 'Chỉ ảnh hưởng đến font chữ', isCorrect: false },
      { key: 'D', text: 'Xóa toàn bộ margin của trang', isCorrect: false },
    ],
    explanation:
      '`display: flex` biến phần tử đó thành flex container, và các phần tử con trực tiếp trở thành flex item được sắp theo trục chính/phụ.',
    tags: ['CSS3', 'Flexbox'],
  },
  {
    content: 'Trong CSS Box Model, thứ tự các lớp từ trong ra ngoài là gì?',
    category: 'CSS3',
    difficulty: 'MEDIUM',
    points: 10,
    options: [
      {
        key: 'A',
        text: 'Margin → Border → Padding → Content',
        isCorrect: false,
      },
      {
        key: 'B',
        text: 'Content → Padding → Border → Margin',
        isCorrect: true,
      },
      {
        key: 'C',
        text: 'Border → Content → Margin → Padding',
        isCorrect: false,
      },
      {
        key: 'D',
        text: 'Padding → Content → Margin → Border',
        isCorrect: false,
      },
    ],
    explanation:
      'Box Model chuẩn CSS đi từ trong ra ngoài: Content (nội dung) → Padding (đệm) → Border (viền) → Margin (khoảng cách ngoài).',
    tags: ['CSS3', 'Box Model'],
  },
  {
    content:
      'Đơn vị CSS nào có giá trị TƯƠNG ĐỐI theo kích thước font-size của phần tử gốc (`<html>`)?',
    category: 'CSS3',
    difficulty: 'MEDIUM',
    points: 10,
    options: [
      { key: 'A', text: 'px', isCorrect: false },
      { key: 'B', text: 'rem', isCorrect: true },
      { key: 'C', text: 'cm', isCorrect: false },
      { key: 'D', text: 'pt', isCorrect: false },
    ],
    explanation:
      '`rem` (root em) tính theo font-size của thẻ `<html>` gốc, trong khi `em` tính theo font-size của phần tử cha gần nhất.',
    tags: ['CSS3', 'Units'],
  },
  {
    content: 'Thuộc tính nào dùng để bo góc cho một phần tử trong CSS?',
    category: 'CSS3',
    difficulty: 'EASY',
    points: 10,
    options: [
      { key: 'A', text: 'corner-radius', isCorrect: false },
      { key: 'B', text: 'border-radius', isCorrect: true },
      { key: 'C', text: 'border-round', isCorrect: false },
      { key: 'D', text: 'round-corner', isCorrect: false },
    ],
    explanation:
      '`border-radius` bo tròn góc của phần tử, ví dụ `border-radius: 8px` hoặc `50%` để tạo hình tròn.',
    tags: ['CSS3', 'Styling'],
  },
  {
    content:
      'Giá trị `position` nào giúp một phần tử được định vị dựa trên phần tử cha gần nhất có `position` khác `static`?',
    category: 'CSS3',
    difficulty: 'MEDIUM',
    points: 10,
    options: [
      { key: 'A', text: 'static', isCorrect: false },
      { key: 'B', text: 'absolute', isCorrect: true },
      { key: 'C', text: 'inherit', isCorrect: false },
      { key: 'D', text: 'initial', isCorrect: false },
    ],
    explanation:
      '`position: absolute` định vị phần tử tương đối theo phần tử tổ tiên gần nhất có `position` là `relative`/`absolute`/`fixed`, nếu không có thì theo `<html>`.',
    tags: ['CSS3', 'Positioning'],
  },
  {
    content:
      'Media Query nào dùng để áp dụng CSS khi màn hình có chiều rộng tối đa 768px?',
    category: 'CSS3',
    difficulty: 'MEDIUM',
    points: 10,
    options: [
      { key: 'A', text: '@media (min-width: 768px)', isCorrect: false },
      { key: 'B', text: '@media (max-width: 768px)', isCorrect: true },
      { key: 'C', text: '@media screen and 768px', isCorrect: false },
      { key: 'D', text: '@responsive (width: 768px)', isCorrect: false },
    ],
    explanation:
      '`@media (max-width: 768px)` áp dụng style khi chiều rộng khung nhìn nhỏ hơn hoặc bằng 768px — thường dùng cho responsive mobile-first.',
    tags: ['CSS3', 'Responsive'],
  },
  {
    content:
      'Thuộc tính nào dùng để ẩn hoàn toàn một phần tử khỏi luồng bố cục (không chiếm chỗ)?',
    category: 'CSS3',
    difficulty: 'EASY',
    points: 10,
    options: [
      { key: 'A', text: 'visibility: hidden', isCorrect: false },
      { key: 'B', text: 'display: none', isCorrect: true },
      { key: 'C', text: 'opacity: 0', isCorrect: false },
      { key: 'D', text: 'color: transparent', isCorrect: false },
    ],
    explanation:
      '`display: none` loại phần tử khỏi luồng render (không chiếm không gian); `visibility: hidden` vẫn giữ chỗ nhưng ẩn hình ảnh.',
    tags: ['CSS3', 'Display'],
  },
  {
    content:
      'Thuộc tính CSS nào thiết lập khoảng cách đều nhau giữa các flex/grid item mà không cần dùng margin?',
    category: 'CSS3',
    difficulty: 'MEDIUM',
    points: 10,
    options: [
      { key: 'A', text: 'gap', isCorrect: true },
      { key: 'B', text: 'spacing', isCorrect: false },
      { key: 'C', text: 'space-between', isCorrect: false },
      { key: 'D', text: 'divider', isCorrect: false },
    ],
    explanation:
      '`gap` (trước đây là `grid-gap`) tạo khoảng cách đều giữa các item trong Flexbox/Grid mà không ảnh hưởng đến viền ngoài container.',
    tags: ['CSS3', 'Flexbox', 'Grid'],
  },
  {
    content:
      'Pseudo-class CSS nào áp dụng style khi con trỏ chuột di (hover) qua phần tử?',
    category: 'CSS3',
    difficulty: 'EASY',
    points: 10,
    options: [
      { key: 'A', text: ':active', isCorrect: false },
      { key: 'B', text: ':focus', isCorrect: false },
      { key: 'C', text: ':hover', isCorrect: true },
      { key: 'D', text: ':visited', isCorrect: false },
    ],
    explanation:
      '`:hover` áp dụng style khi chuột đang di trên phần tử; `:active` áp dụng khi đang được nhấn giữ.',
    tags: ['CSS3', 'Pseudo-classes'],
  },
  {
    content: 'Thuộc tính `font-weight: bold` tương đương với giá trị số nào?',
    category: 'CSS3',
    difficulty: 'MEDIUM',
    points: 10,
    options: [
      { key: 'A', text: '400', isCorrect: false },
      { key: 'B', text: '700', isCorrect: true },
      { key: 'C', text: '900', isCorrect: false },
      { key: 'D', text: '100', isCorrect: false },
    ],
    explanation:
      '`bold` tương đương giá trị số `700` trong thang đo độ đậm chữ CSS (100 mảnh nhất - 900 đậm nhất, 400 là normal).',
    tags: ['CSS3', 'Typography'],
  },
  {
    content: 'Thuộc tính nào dùng để đặt hình nền cho một phần tử trong CSS?',
    category: 'CSS3',
    difficulty: 'EASY',
    points: 10,
    options: [
      { key: 'A', text: 'background-image', isCorrect: true },
      { key: 'B', text: 'background-src', isCorrect: false },
      { key: 'C', text: 'image-background', isCorrect: false },
      { key: 'D', text: 'bg-picture', isCorrect: false },
    ],
    explanation:
      '`background-image: url(...)` đặt hình nền cho phần tử; có thể kết hợp `background-size`, `background-position` để điều chỉnh cách hiển thị.',
    tags: ['CSS3', 'Backgrounds'],
  },
  {
    content: 'Đơn vị `vh` trong CSS đại diện cho điều gì?',
    category: 'CSS3',
    difficulty: 'MEDIUM',
    points: 10,
    options: [
      { key: 'A', text: '1% chiều rộng phần tử cha', isCorrect: false },
      { key: 'B', text: '1% chiều cao khung nhìn (viewport)', isCorrect: true },
      { key: 'C', text: '1 pixel vật lý', isCorrect: false },
      { key: 'D', text: '1% font-size gốc', isCorrect: false },
    ],
    explanation:
      '`vh` (viewport height) là đơn vị tương đối theo chiều cao khung nhìn trình duyệt; `100vh` bằng toàn bộ chiều cao màn hình hiển thị.',
    tags: ['CSS3', 'Units'],
  },
  {
    content:
      'Thuộc tính CSS nào kiểm soát thứ tự chồng lớp (lớp nào nằm trên/dưới) của các phần tử có `position` khác `static`?',
    category: 'CSS3',
    difficulty: 'HARD',
    points: 10,
    options: [
      { key: 'A', text: 'z-index', isCorrect: true },
      { key: 'B', text: 'layer-order', isCorrect: false },
      { key: 'C', text: 'stack-order', isCorrect: false },
      { key: 'D', text: 'depth', isCorrect: false },
    ],
    explanation:
      '`z-index` quyết định thứ tự chồng lớp trên trục Z; giá trị lớn hơn sẽ nằm trên các phần tử có giá trị nhỏ hơn (chỉ có tác dụng khi `position` khác `static`).',
    tags: ['CSS3', 'Positioning'],
  },
  {
    content:
      'Cú pháp nào đúng để chọn phần tử `<p>` là con trực tiếp (direct child) của `<div>` trong CSS?',
    category: 'CSS3',
    difficulty: 'HARD',
    points: 10,
    options: [
      { key: 'A', text: 'div p', isCorrect: false },
      { key: 'B', text: 'div > p', isCorrect: true },
      { key: 'C', text: 'div + p', isCorrect: false },
      { key: 'D', text: 'div ~ p', isCorrect: false },
    ],
    explanation:
      '`div > p` chỉ chọn `<p>` là con TRỰC TIẾP của `<div>`; `div p` (không dấu `>`) chọn mọi `<p>` là hậu duệ (con, cháu...) bất kể cấp độ.',
    tags: ['CSS3', 'Selectors'],
  },
  {
    content: 'Thuộc tính `transition` trong CSS dùng để làm gì?',
    category: 'CSS3',
    difficulty: 'MEDIUM',
    points: 10,
    options: [
      {
        key: 'A',
        text: 'Tạo hiệu ứng chuyển đổi mượt khi một giá trị CSS thay đổi',
        isCorrect: true,
      },
      { key: 'B', text: 'Chuyển trang không cần reload', isCorrect: false },
      { key: 'C', text: 'Đổi ngôn ngữ trang tự động', isCorrect: false },
      { key: 'D', text: 'Nén file CSS lại', isCorrect: false },
    ],
    explanation:
      '`transition` (ví dụ `transition: background-color 0.3s ease`) tạo hiệu ứng chuyển đổi mượt mà giữa hai giá trị của một thuộc tính CSS theo thời gian.',
    tags: ['CSS3', 'Animations'],
  },
];
