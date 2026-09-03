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
];
