/**
 * Dữ liệu chuẩn cho Tester (Day 30), dùng bởi scripts/seed-all.js:
 *  - Tài khoản chuẩn theo vai trò/khối và lớp mà mỗi tài khoản phụ trách/học.
 *  - Ngân hàng đề (bankOnly) theo khối 6-9 / 10-12: bài code có test case + câu trắc nghiệm có đúng một đáp án đúng.
 *  - Nội dung cho 5 bài demo-dash-ex-* (bài mẫu của Teacher Dashboard trước đây không có test case nên Playground chạy "trống").
 * Mọi lời giải (solution) được scripts/lib/seed-standard-data.test.js chạy thật trên test case để bảo đảm đề không sai.
 */

/** [email, họ tên, vai trò, khối học, mã lớp] — lớp: giảng viên PHỤ TRÁCH chính / học viên được GHI DANH. */
const STANDARD_ACCOUNTS = [
  { email: 'admin@gmail.com', fullName: 'Nguyễn Kim Thượng', role: 'ADMIN' },
  { email: 'teacher@gmail.com', fullName: 'Thầy Hoàng Nam', role: 'TEACHER' },
  { email: 'teacher3-5@gmail.com', fullName: 'Cô Phạm Thu Hương', role: 'TEACHER', classCode: 'CL-35KID01' },
  { email: 'teacher6-9@gmail.com', fullName: 'Cô Nguyễn Thị Lan', role: 'TEACHER', classCode: 'CL-69PY01' },
  { email: 'teacher10-12@gmail.com', fullName: 'Thầy Trần Minh Khoa', role: 'TEACHER', classCode: 'CL-1012A1' },
  { email: 'student@gmail.com', fullName: 'Học viên Demo', role: 'STUDENT', ageGroup: '10-12' },
  { email: 'lop3-5@gmail.com', fullName: 'Bé Lớp Ba Năm', role: 'STUDENT', ageGroup: '3-5', classCode: 'CL-35KID01' },
  // playgroundDone: số bài ĐẦU lộ trình Playground đã hoàn thành (liên tục #1..#k, không nhảy cóc) để Tester thấy bài #(k+1) vừa mở khóa.
  { email: 'lop6-9@gmail.com', fullName: 'Học sinh Khối 6-9', role: 'STUDENT', ageGroup: '6-9', classCode: 'CL-69PY01', playgroundDone: 2 },
  { email: 'lop10-12@gmail.com', fullName: 'Học sinh Khối 10-12', role: 'STUDENT', ageGroup: '10-12', classCode: 'CL-1012A1', playgroundDone: 1 },
  { email: 'duongchiviet2004@gmail.com', fullName: 'Dương Chí Việt', role: 'STUDENT', ageGroup: '3-5', classCode: 'CL-35KID01' },
];

const tc = (input, expectedOutput, isHidden = false) => ({ input, expectedOutput, isHidden });
const PY_STARTER = '# Đọc dữ liệu bằng input() và in kết quả bằng print()\n';

/** Bài code của Ngân hàng đề. band → giảng viên khối đó là tác giả (sửa/xóa được trong Ngân hàng đề). */
const BANK_CODE = [
  {
    band: '6-9',
    slug: 'seed-bank-69-trung-binh-cong',
    title: 'Trung bình cộng ba số',
    difficulty: 'EASY',
    description: 'Nhập ba số nguyên, mỗi số trên một dòng. In trung bình cộng của chúng, làm tròn 2 chữ số thập phân.\n\nVí dụ: 1, 2, 3 → 2.00',
    tags: ['input-output', 'so-hoc'],
    solution: 'a = int(input())\nb = int(input())\nc = int(input())\nprint(f"{(a + b + c) / 3:.2f}")\n',
    testCases: [tc('1\n2\n3', '2.00'), tc('10\n0\n5', '5.00'), tc('1\n2\n2', '1.67', true), tc('-3\n-3\n0', '-2.00', true)],
  },
  {
    band: '6-9',
    slug: 'seed-bank-69-dem-nguyen-am',
    title: 'Đếm nguyên âm',
    difficulty: 'EASY',
    description: 'Nhập một chuỗi chữ thường. In số nguyên âm (a, e, i, o, u) có trong chuỗi.\n\nVí dụ: hello → 2',
    tags: ['chuoi', 'vong-lap'],
    solution: 's = input()\nprint(sum(1 for ch in s if ch in "aeiou"))\n',
    testCases: [tc('hello', '2'), tc('python', '1'), tc('aeiou', '5', true), tc('xyz', '0', true)],
  },
  {
    band: '6-9',
    slug: 'seed-bank-69-so-hoan-hao',
    title: 'Số hoàn hảo',
    difficulty: 'MEDIUM',
    description: 'Số hoàn hảo là số bằng tổng các ước dương nhỏ hơn nó (vd 6 = 1 + 2 + 3). Nhập n (1 ≤ n ≤ 10^6), in YES nếu n là số hoàn hảo, ngược lại in NO.',
    tags: ['so-hoc', 'vong-lap'],
    solution: 'n = int(input())\ns = 1\nd = 2\nwhile d * d <= n:\n    if n % d == 0:\n        s += d\n        if d != n // d:\n            s += n // d\n    d += 1\nprint("YES" if n > 1 and s == n else "NO")\n',
    testCases: [tc('6', 'YES'), tc('8', 'NO'), tc('28', 'YES', true), tc('1', 'NO', true), tc('8128', 'YES', true)],
  },
  {
    band: '10-12',
    slug: 'seed-bank-1012-day-con-tong-lon-nhat',
    title: 'Dãy con liên tiếp có tổng lớn nhất',
    difficulty: 'MEDIUM',
    description: 'Dòng 1: n (1 ≤ n ≤ 10^5). Dòng 2: n số nguyên. In tổng lớn nhất của một dãy con liên tiếp khác rỗng (thuật toán Kadane, O(n)).',
    tags: ['quy-hoach-dong', 'mang'],
    solution: 'n = int(input())\na = list(map(int, input().split()))\nbest = cur = a[0]\nfor x in a[1:]:\n    cur = max(x, cur + x)\n    best = max(best, cur)\nprint(best)\n',
    testCases: [tc('5\n-2 1 -3 4 -1', '4'), tc('3\n-1 -2 -3', '-1'), tc('8\n-2 1 -3 4 -1 2 1 -5', '6', true), tc('1\n7', '7', true)],
  },
  {
    band: '10-12',
    slug: 'seed-bank-1012-ucln-cua-day',
    title: 'Ước chung lớn nhất của dãy',
    difficulty: 'EASY',
    description: 'Dòng 1: n (1 ≤ n ≤ 10^5). Dòng 2: n số nguyên dương. In ước chung lớn nhất của cả dãy.',
    tags: ['so-hoc', 'euclid'],
    solution: 'from math import gcd\nfrom functools import reduce\nn = int(input())\nprint(reduce(gcd, map(int, input().split())))\n',
    testCases: [tc('3\n12 18 24', '6'), tc('2\n7 13', '1'), tc('4\n100 75 50 25', '25', true), tc('1\n42', '42', true)],
  },
  {
    band: '10-12',
    slug: 'seed-bank-1012-ngoac-hop-le',
    title: 'Dãy ngoặc hợp lệ',
    difficulty: 'MEDIUM',
    description: 'Nhập một chuỗi chỉ gồm các ký tự ()[]{}. In YES nếu mọi ngoặc được đóng đúng loại và đúng thứ tự, ngược lại in NO (gợi ý: dùng ngăn xếp).',
    tags: ['ngan-xep', 'chuoi'],
    solution: 's = input().strip()\npair = {")": "(", "]": "[", "}": "{"}\nst = []\nok = True\nfor ch in s:\n    if ch in "([{":\n        st.append(ch)\n    elif not st or st.pop() != pair[ch]:\n        ok = False\n        break\nprint("YES" if ok and not st else "NO")\n',
    testCases: [tc('()[]{}', 'YES'), tc('(]', 'NO'), tc('([{}])', 'YES', true), tc('((', 'NO', true), tc('}{', 'NO', true)],
  },
];

const opts = (correct, ...texts) => texts.map((text, i) => ({ key: 'ABCDEF'[i], text, isCorrect: i === correct }));

/** Câu trắc nghiệm của Ngân hàng đề (đúng MỘT đáp án đúng, có giải thích). seedKey giúp chạy lại không nhân bản. */
const BANK_QUIZ = [
  { band: '6-9', seedKey: 'seed-bank-quiz-69-print', category: 'Python', difficulty: 'EASY', content: 'Lệnh nào in ra màn hình dòng chữ Xin chào trong Python?', options: opts(1, 'echo("Xin chào")', 'print("Xin chào")', 'console.log("Xin chào")', 'printf Xin chào'), explanation: 'Python dùng hàm print() để in ra màn hình.' },
  { band: '6-9', seedKey: 'seed-bank-quiz-69-int-input', category: 'Python', difficulty: 'EASY', content: 'Muốn đọc một số nguyên từ bàn phím, ta viết?', options: opts(2, 'input()', 'str(input())', 'int(input())', 'read(int)'), explanation: 'input() trả về chuỗi; int(...) đổi chuỗi đó sang số nguyên.' },
  { band: '6-9', seedKey: 'seed-bank-quiz-69-range', category: 'Python', difficulty: 'MEDIUM', content: 'Đoạn code sau in ra bao nhiêu số?', codeSnippet: 'for i in range(2, 10, 3):\n    print(i)', options: opts(1, '2', '3', '4', '8'), explanation: 'range(2, 10, 3) sinh 2, 5, 8 nên in 3 số.' },
  { band: '6-9', seedKey: 'seed-bank-quiz-69-mod', category: 'Python', difficulty: 'EASY', content: 'Kết quả của biểu thức 17 % 5 là?', options: opts(0, '2', '3', '3.4', '12'), explanation: '% là phép chia lấy dư: 17 = 5 × 3 + 2.' },
  { band: '10-12', seedKey: 'seed-bank-quiz-1012-binary-search', category: 'Thuật toán', difficulty: 'EASY', content: 'Độ phức tạp thời gian của tìm kiếm nhị phân trên mảng đã sắp xếp n phần tử là?', options: opts(2, 'O(n)', 'O(n log n)', 'O(log n)', 'O(1)'), explanation: 'Mỗi bước loại bỏ một nửa khoảng tìm kiếm nên cần khoảng log2(n) bước.' },
  { band: '10-12', seedKey: 'seed-bank-quiz-1012-stack', category: 'Thuật toán', difficulty: 'EASY', content: 'Cấu trúc dữ liệu nào hoạt động theo nguyên tắc LIFO (vào sau ra trước)?', options: opts(0, 'Ngăn xếp (stack)', 'Hàng đợi (queue)', 'Bảng băm (hash table)', 'Cây nhị phân tìm kiếm'), explanation: 'Stack lấy ra phần tử được đưa vào sau cùng.' },
  { band: '10-12', seedKey: 'seed-bank-quiz-1012-bfs', category: 'Thuật toán', difficulty: 'MEDIUM', content: 'Thuật toán nào tìm đường đi ít cạnh nhất trên đồ thị không trọng số?', options: opts(1, 'DFS', 'BFS', 'Sắp xếp topo', 'Kruskal'), explanation: 'BFS duyệt theo từng lớp khoảng cách nên đỉnh được thăm lần đầu có số cạnh nhỏ nhất.' },
  { band: '10-12', seedKey: 'seed-bank-quiz-1012-sort', category: 'Thuật toán', difficulty: 'HARD', content: 'Thuật toán sắp xếp nào có độ phức tạp O(n log n) trong MỌI trường hợp?', options: opts(3, 'Quick sort', 'Bubble sort', 'Insertion sort', 'Merge sort'), explanation: 'Merge sort luôn chia đôi và trộn O(n) nên là O(n log n); quick sort xấu nhất là O(n^2).' },
];

/** Nội dung cho bài demo-dash-ex-* (chỉ ghi khi bài chưa có test case nào: không đè chỉnh sửa của giảng viên). */
const DEMO_DASH_CONTENT = {
  'demo-dash-ex-arrays': {
    description: 'Dòng 1: n. Dòng 2: n số nguyên. In tổng các phần tử của mảng.',
    solution: 'n = int(input())\nprint(sum(map(int, input().split())))\n',
    testCases: [tc('3\n1 2 3', '6'), tc('5\n-1 4 0 7 2', '12'), tc('1\n100', '100', true)],
  },
  'demo-dash-ex-loops': {
    description: 'Nhập n (1 ≤ n ≤ 10^6). In tổng 1 + 2 + … + n (dùng vòng lặp).',
    solution: 'n = int(input())\ntotal = 0\nfor i in range(1, n + 1):\n    total += i\nprint(total)\n',
    testCases: [tc('5', '15'), tc('1', '1'), tc('100', '5050', true)],
  },
  'demo-dash-ex-other': {
    description: 'Nhập một số nguyên dương n. In số chữ số của n.',
    solution: 'print(len(input().strip()))\n',
    testCases: [tc('12345', '5'), tc('7', '1'), tc('1000000', '7', true)],
  },
  'demo-dash-ex-recursion': {
    description: 'Nhập n (0 ≤ n ≤ 20). In n! tính bằng hàm đệ quy.',
    solution: 'def fact(n):\n    return 1 if n == 0 else n * fact(n - 1)\nprint(fact(int(input())))\n',
    testCases: [tc('5', '120'), tc('0', '1'), tc('10', '3628800', true)],
  },
  'demo-dash-ex-sql': {
    description: 'Mô phỏng câu lệnh SQL "SELECT COUNT(*) FROM diem WHERE diem >= 5" bằng Python. Dòng 1: n. Dòng 2: n điểm. In số điểm ≥ 5.',
    solution: 'n = int(input())\nprint(sum(1 for x in map(int, input().split()) if x >= 5))\n',
    testCases: [tc('5\n3 7 5 9 2', '3'), tc('3\n1 2 3', '0'), tc('4\n10 5 5 4', '3', true)],
  },
};

module.exports = { STANDARD_ACCOUNTS, BANK_CODE, BANK_QUIZ, DEMO_DASH_CONTENT, PY_STARTER };
