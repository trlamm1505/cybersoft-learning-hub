export const INITIAL_EXERCISES = [
  {
    title: 'Tính tổng hai số nguyên',
    slug: 'tinh-tong-hai-so-nguyen',
    description:
      'Cho hai số nguyên A và B, mỗi số trên một dòng. In ra kết quả tổng A + B trên một dòng.',
    type: 'CODE_TEXT',
    difficulty: 'EASY',
    points: 10,
    starterCode: 'a = int(input())\nb = int(input())\n# Viết code của bạn ở đây\n',
    solutionCode: 'a = int(input())\nb = int(input())\nprint(a + b)',
    timeLimitMs: 2000,
    testCases: [
      { input: '3\n5', expectedOutput: '8', isHidden: false },
      { input: '100\n250', expectedOutput: '350', isHidden: false },
      { input: '-15\n40', expectedOutput: '25', isHidden: true },
      { input: '999999\n1', expectedOutput: '1000000', isHidden: true },
    ],
  },
  {
    title: 'Kiểm tra số chẵn lẻ',
    slug: 'kiem-tra-so-chan-le',
    description:
      'Cho một số nguyên N. In ra "Chẵn" nếu N là số chẵn, ngược lại in ra "Lẻ".',
    type: 'CODE_TEXT',
    difficulty: 'EASY',
    points: 10,
    starterCode: 'n = int(input())\n# Viết code của bạn ở đây\n',
    solutionCode: 'n = int(input())\nprint("Chẵn" if n % 2 == 0 else "Lẻ")',
    timeLimitMs: 2000,
    testCases: [
      { input: '4', expectedOutput: 'Chẵn', isHidden: false },
      { input: '7', expectedOutput: 'Lẻ', isHidden: false },
      { input: '0', expectedOutput: 'Chẵn', isHidden: true },
      { input: '-3', expectedOutput: 'Lẻ', isHidden: true },
    ],
  },
  {
    title: 'Tìm số lớn nhất trong danh sách',
    slug: 'tim-so-lon-nhat',
    description:
      'Dòng đầu là số lượng phần tử N. Dòng tiếp theo gồm N số nguyên cách nhau bởi dấu cách. In ra giá trị lớn nhất.',
    type: 'CODE_TEXT',
    difficulty: 'MEDIUM',
    points: 15,
    starterCode: 'n = int(input())\nnums = list(map(int, input().split()))\n# Viết code của bạn ở đây\n',
    solutionCode: 'n = int(input())\nnums = list(map(int, input().split()))\nprint(max(nums))',
    timeLimitMs: 2000,
    testCases: [
      { input: '5\n3 7 2 9 4', expectedOutput: '9', isHidden: false },
      { input: '3\n-1 -5 -2', expectedOutput: '-1', isHidden: false },
      { input: '1\n42', expectedOutput: '42', isHidden: true },
    ],
  },
  {
    title: 'Đảo ngược chuỗi',
    slug: 'dao-nguoc-chuoi',
    description: 'Cho một chuỗi S. In ra chuỗi S theo thứ tự ngược lại.',
    type: 'CODE_TEXT',
    difficulty: 'EASY',
    points: 10,
    starterCode: 's = input()\n# Viết code của bạn ở đây\n',
    solutionCode: 's = input()\nprint(s[::-1])',
    timeLimitMs: 2000,
    testCases: [
      { input: 'hello', expectedOutput: 'olleh', isHidden: false },
      { input: 'CyberSoft', expectedOutput: 'tfoSrebyC', isHidden: false },
      { input: 'a', expectedOutput: 'a', isHidden: true },
    ],
  },
  {
    title: 'Kiểm tra số nguyên tố',
    slug: 'kiem-tra-so-nguyen-to',
    description: 'Cho một số nguyên dương N. In ra "YES" nếu N là số nguyên tố, ngược lại in ra "NO".',
    type: 'CODE_TEXT',
    difficulty: 'MEDIUM',
    points: 15,
    starterCode: 'n = int(input())\n# Viết code của bạn ở đây\n',
    solutionCode:
      'n = int(input())\n' +
      'def is_prime(x):\n' +
      '    if x < 2:\n' +
      '        return False\n' +
      '    for i in range(2, int(x ** 0.5) + 1):\n' +
      '        if x % i == 0:\n' +
      '            return False\n' +
      '    return True\n' +
      'print("YES" if is_prime(n) else "NO")',
    timeLimitMs: 2000,
    testCases: [
      { input: '7', expectedOutput: 'YES', isHidden: false },
      { input: '10', expectedOutput: 'NO', isHidden: false },
      { input: '1', expectedOutput: 'NO', isHidden: true },
      { input: '97', expectedOutput: 'YES', isHidden: true },
    ],
  },
  {
    title: 'Dãy số Fibonacci',
    slug: 'fibonacci',
    description:
      'Cho một số nguyên dương N. In ra số Fibonacci thứ N, biết F(1) = 1, F(2) = 1, F(n) = F(n-1) + F(n-2).',
    type: 'CODE_TEXT',
    difficulty: 'EASY',
    points: 10,
    starterCode: 'n = int(input())\n# Viết code của bạn ở đây\n',
    solutionCode:
      'n = int(input())\n' +
      'a, b = 1, 1\n' +
      'for _ in range(n - 1):\n' +
      '    a, b = b, a + b\n' +
      'print(a)',
    timeLimitMs: 2000,
    testCases: [
      { input: '1', expectedOutput: '1', isHidden: false },
      { input: '5', expectedOutput: '5', isHidden: false },
      { input: '10', expectedOutput: '55', isHidden: true },
      { input: '20', expectedOutput: '6765', isHidden: true },
    ],
  },
  {
    title: 'Ước chung lớn nhất',
    slug: 'uoc-chung-lon-nhat',
    description:
      'Cho hai số nguyên dương A và B, mỗi số trên một dòng. In ra ước chung lớn nhất (GCD) của A và B.',
    type: 'CODE_TEXT',
    difficulty: 'EASY',
    points: 10,
    starterCode: 'a = int(input())\nb = int(input())\n# Viết code của bạn ở đây\n',
    solutionCode:
      'a = int(input())\n' +
      'b = int(input())\n' +
      'while b:\n' +
      '    a, b = b, a % b\n' +
      'print(a)',
    timeLimitMs: 2000,
    testCases: [
      { input: '12\n18', expectedOutput: '6', isHidden: false },
      { input: '7\n13', expectedOutput: '1', isHidden: false },
      { input: '100\n75', expectedOutput: '25', isHidden: true },
      { input: '1\n999', expectedOutput: '1', isHidden: true },
    ],
  },
  {
    title: 'Kiểm tra chuỗi Palindrome',
    slug: 'kiem-tra-palindrome',
    description:
      'Cho một chuỗi S chỉ gồm chữ cái thường. In ra "YES" nếu S là chuỗi đối xứng (palindrome), ngược lại in ra "NO".',
    type: 'CODE_TEXT',
    difficulty: 'MEDIUM',
    points: 15,
    starterCode: 's = input()\n# Viết code của bạn ở đây\n',
    solutionCode: 's = input()\nprint("YES" if s == s[::-1] else "NO")',
    timeLimitMs: 2000,
    testCases: [
      { input: 'level', expectedOutput: 'YES', isHidden: false },
      { input: 'hello', expectedOutput: 'NO', isHidden: false },
      { input: 'a', expectedOutput: 'YES', isHidden: true },
      { input: 'abcba', expectedOutput: 'YES', isHidden: true },
    ],
  },
  {
    title: 'Sắp xếp danh sách tăng dần',
    slug: 'sap-xep-tang-dan',
    description:
      'Dòng đầu là số lượng phần tử N. Dòng tiếp theo gồm N số nguyên cách nhau bởi dấu cách. In ra danh sách đã sắp xếp tăng dần, các số cách nhau bởi dấu cách.',
    type: 'CODE_TEXT',
    difficulty: 'MEDIUM',
    points: 15,
    starterCode: 'n = int(input())\nnums = list(map(int, input().split()))\n# Viết code của bạn ở đây\n',
    solutionCode:
      'n = int(input())\n' +
      'nums = list(map(int, input().split()))\n' +
      'nums.sort()\n' +
      "print(' '.join(map(str, nums)))",
    timeLimitMs: 2000,
    testCases: [
      { input: '5\n5 3 1 4 2', expectedOutput: '1 2 3 4 5', isHidden: false },
      { input: '3\n-1 -5 2', expectedOutput: '-5 -1 2', isHidden: false },
      { input: '1\n7', expectedOutput: '7', isHidden: true },
      { input: '4\n0 0 -2 3', expectedOutput: '-2 0 0 3', isHidden: true },
    ],
  },
  {
    title: 'Tổng đường chéo ma trận vuông',
    slug: 'tong-duong-cheo-ma-tran',
    description:
      'Dòng đầu là số nguyên N (kích thước ma trận vuông N x N). N dòng tiếp theo, mỗi dòng gồm N số nguyên cách nhau bởi dấu cách, biểu diễn ma trận. In ra tổng các phần tử trên đường chéo chính (từ góc trên-trái đến góc dưới-phải).',
    type: 'CODE_TEXT',
    difficulty: 'HARD',
    points: 20,
    starterCode:
      'n = int(input())\n' +
      'matrix = [list(map(int, input().split())) for _ in range(n)]\n' +
      '# Viết code của bạn ở đây\n',
    solutionCode:
      'n = int(input())\n' +
      'matrix = [list(map(int, input().split())) for _ in range(n)]\n' +
      'print(sum(matrix[i][i] for i in range(n)))',
    timeLimitMs: 2000,
    testCases: [
      { input: '2\n1 2\n3 4', expectedOutput: '5', isHidden: false },
      { input: '3\n1 0 0\n0 1 0\n0 0 1', expectedOutput: '3', isHidden: false },
      { input: '1\n9', expectedOutput: '9', isHidden: true },
      { input: '3\n1 2 3\n4 5 6\n7 8 9', expectedOutput: '15', isHidden: true },
    ],
  },
];
