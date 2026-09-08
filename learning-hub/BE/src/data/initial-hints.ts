export interface InitialHintData {
  exerciseSlug: string;
  level: number;
  title: string;
  content: string;
  costPoints: number;
  cooldownSeconds: number;
}

export const INITIAL_HINTS: InitialHintData[] = [
  // 1. Tính tổng hai số nguyên
  {
    exerciseSlug: 'tinh-tong-hai-so-nguyen',
    level: 1,
    title: 'Khái niệm & Tư duy',
    content:
      'Bài toán yêu cầu thực hiện phép toán cộng đại số cơ bản giữa hai giá trị số nguyên được nhập vào từ dòng lệnh. Hãy chú ý đọc dữ liệu theo đúng thứ tự dòng.',
    costPoints: 5,
    cooldownSeconds: 30,
  },
  {
    exerciseSlug: 'tinh-tong-hai-so-nguyen',
    level: 2,
    title: 'Chiến lược giải quyết',
    content:
      '1. Đọc hai dòng đầu vào lần lượt tương ứng với hai giá trị.\n2. Chuyển đổi dữ liệu chuỗi nhận được thành kiểu số nguyên.\n3. Tính tổng hai số và in ra kết quả.',
    costPoints: 10,
    cooldownSeconds: 30,
  },
  {
    exerciseSlug: 'tinh-tong-hai-so-nguyen',
    level: 3,
    title: 'Code mẫu hoàn chỉnh (Python)',
    content: 'a = int(input())\nb = int(input())\nprint(a + b)',
    costPoints: 15,
    cooldownSeconds: 30,
  },

  // 2. Kiểm tra số chẵn lẻ
  {
    exerciseSlug: 'kiem-tra-so-chan-le',
    level: 1,
    title: 'Khái niệm & Tư duy',
    content:
      'Một số nguyên được coi là chẵn nếu nó chia hết cho 2 không dư, ngược lại nếu có dư 1 (hoặc số dư khác 0) thì đó là số lẻ.',
    costPoints: 5,
    cooldownSeconds: 30,
  },
  {
    exerciseSlug: 'kiem-tra-so-chan-le',
    level: 2,
    title: 'Chiến lược giải quyết',
    content:
      '1. Đọc số nguyên N từ đầu vào.\n2. Tính phần dư của N khi chia cho 2 (dùng phép toán chia lấy dư modulo).\n3. Nếu phần dư bằng 0 thì xuất "Chẵn", ngược lại xuất "Lẻ".',
    costPoints: 10,
    cooldownSeconds: 30,
  },
  {
    exerciseSlug: 'kiem-tra-so-chan-le',
    level: 3,
    title: 'Code mẫu hoàn chỉnh (Python)',
    content: 'n = int(input())\nprint("Chẵn" if n % 2 == 0 else "Lẻ")',
    costPoints: 15,
    cooldownSeconds: 30,
  },

  // 3. Tìm số lớn nhất trong danh sách
  {
    exerciseSlug: 'tim-so-lon-nhat',
    level: 1,
    title: 'Khái niệm & Tư duy',
    content:
      'Giá trị lớn nhất của một dãy số là phần tử có giá trị không nhỏ hơn bất kỳ phần tử nào khác trong dãy đó.',
    costPoints: 5,
    cooldownSeconds: 30,
  },
  {
    exerciseSlug: 'tim-so-lon-nhat',
    level: 2,
    title: 'Chiến lược giải quyết',
    content:
      '1. Đọc số lượng N và mảng các số nguyên từ dòng tiếp theo.\n2. Sử dụng hàm max() có sẵn trong Python để tìm số lớn nhất.',
    costPoints: 10,
    cooldownSeconds: 30,
  },
  {
    exerciseSlug: 'tim-so-lon-nhat',
    level: 3,
    title: 'Code mẫu hoàn chỉnh (Python)',
    content: 'n = int(input())\nnums = list(map(int, input().split()))\nprint(max(nums))',
    costPoints: 15,
    cooldownSeconds: 30,
  },

  // 4. Đảo ngược chuỗi
  {
    exerciseSlug: 'dao-nguoc-chuoi',
    level: 1,
    title: 'Khái niệm & Tư duy',
    content:
      'Đảo ngược chuỗi là việc sắp xếp lại các ký tự trong chuỗi ban đầu theo thứ tự từ ký tự cuối cùng tiến dần về ký tự đầu tiên.',
    costPoints: 5,
    cooldownSeconds: 30,
  },
  {
    exerciseSlug: 'dao-nguoc-chuoi',
    level: 2,
    title: 'Chiến lược giải quyết',
    content:
      '1. Đọc chuỗi S từ đầu vào.\n2. Sử dụng cú pháp cắt chuỗi (string slicing) s[::-1] trong Python để đảo ngược chuỗi.\n3. In chuỗi kết quả ra màn hình.',
    costPoints: 10,
    cooldownSeconds: 30,
  },
  {
    exerciseSlug: 'dao-nguoc-chuoi',
    level: 3,
    title: 'Code mẫu hoàn chỉnh (Python)',
    content: 's = input()\nprint(s[::-1])',
    costPoints: 15,
    cooldownSeconds: 30,
  },

  // 5. Kiểm tra số nguyên tố
  {
    exerciseSlug: 'kiem-tra-so-nguyen-to',
    level: 1,
    title: 'Khái niệm & Tư duy',
    content:
      'Số nguyên tố là số tự nhiên lớn hơn 1 và chỉ có hai ước số dương duy nhất là 1 và chính nó. Các số nhỏ hơn hoặc bằng 1 không phải là số nguyên tố.',
    costPoints: 5,
    cooldownSeconds: 30,
  },
  {
    exerciseSlug: 'kiem-tra-so-nguyen-to',
    level: 2,
    title: 'Chiến lược giải quyết',
    content:
      '1. Nếu N nhỏ hơn 2 thì kết luận ngay không phải số nguyên tố.\n2. Duyệt các số i từ 2 đến căn bậc hai của N. Nếu N chia hết cho i thì N không phải số nguyên tố.\n3. Nếu không tìm thấy ước nào trong khoảng đó thì N là số nguyên tố.',
    costPoints: 10,
    cooldownSeconds: 30,
  },
  {
    exerciseSlug: 'kiem-tra-so-nguyen-to',
    level: 3,
    title: 'Code mẫu hoàn chỉnh (Python)',
    content:
      'n = int(input())\n\ndef is_prime(x):\n    if x < 2:\n        return False\n    for i in range(2, int(x ** 0.5) + 1):\n        if x % i == 0:\n            return False\n    return True\n\nprint("YES" if is_prime(n) else "NO")',
    costPoints: 15,
    cooldownSeconds: 30,
  },

  // 6. Dãy số Fibonacci
  {
    exerciseSlug: 'fibonacci',
    level: 1,
    title: 'Khái niệm & Tư duy',
    content:
      'Dãy Fibonacci bắt đầu bằng hai số 1, 1. Mỗi số hạng tiếp theo được tạo thành bằng tổng của hai số hạng ngay trước nó.',
    costPoints: 5,
    cooldownSeconds: 30,
  },
  {
    exerciseSlug: 'fibonacci',
    level: 2,
    title: 'Chiến lược giải quyết',
    content:
      '1. Khởi tạo a, b = 1, 1.\n2. Dùng vòng lặp for _ in range(n - 1) để gán a, b = b, a + b.\n3. In giá trị a.',
    costPoints: 10,
    cooldownSeconds: 30,
  },
  {
    exerciseSlug: 'fibonacci',
    level: 3,
    title: 'Code mẫu hoàn chỉnh (Python)',
    content: 'n = int(input())\na, b = 1, 1\nfor _ in range(n - 1):\n    a, b = b, a + b\nprint(a)',
    costPoints: 15,
    cooldownSeconds: 30,
  },

  // 7. Ước chung lớn nhất
  {
    exerciseSlug: 'uoc-chung-lon-nhat',
    level: 1,
    title: 'Khái niệm & Tư duy',
    content:
      'Ước chung lớn nhất của hai số nguyên dương là số nguyên lớn nhất mà cả hai số đó đều chia hết.',
    costPoints: 5,
    cooldownSeconds: 30,
  },
  {
    exerciseSlug: 'uoc-chung-lon-nhat',
    level: 2,
    title: 'Chiến lược giải quyết',
    content:
      '1. Sử dụng thuật toán Euclid dựa trên phép chia lấy dư.\n2. Trong khi b còn khác 0, gán a, b = b, a % b.\n3. In giá trị a.',
    costPoints: 10,
    cooldownSeconds: 30,
  },
  {
    exerciseSlug: 'uoc-chung-lon-nhat',
    level: 3,
    title: 'Code mẫu hoàn chỉnh (Python)',
    content: 'a = int(input())\nb = int(input())\nwhile b:\n    a, b = b, a % b\nprint(a)',
    costPoints: 15,
    cooldownSeconds: 30,
  },

  // 8. Kiểm tra chuỗi Palindrome
  {
    exerciseSlug: 'kiem-tra-palindrome',
    level: 1,
    title: 'Khái niệm & Tư duy',
    content:
      'Chuỗi đối xứng (Palindrome) là chuỗi mà khi đọc từ trái sang phải hay từ phải sang trái đều cho chuỗi các ký tự giống hệt nhau.',
    costPoints: 5,
    cooldownSeconds: 30,
  },
  {
    exerciseSlug: 'kiem-tra-palindrome',
    level: 2,
    title: 'Chiến lược giải quyết',
    content:
      '1. Đọc chuỗi S từ đầu vào.\n2. So sánh s == s[::-1]. In "YES" nếu đúng, ngược lại in "NO".',
    costPoints: 10,
    cooldownSeconds: 30,
  },
  {
    exerciseSlug: 'kiem-tra-palindrome',
    level: 3,
    title: 'Code mẫu hoàn chỉnh (Python)',
    content: 's = input()\nprint("YES" if s == s[::-1] else "NO")',
    costPoints: 15,
    cooldownSeconds: 30,
  },

  // 9. Sắp xếp danh sách tăng dần
  {
    exerciseSlug: 'sap-xep-tang-dan',
    level: 1,
    title: 'Khái niệm & Tư duy',
    content:
      'Sắp xếp danh sách là việc tái bố trí các phần tử sao cho giá trị của phần tử đứng sau luôn lớn hơn hoặc bằng phần tử đứng trước nó.',
    costPoints: 5,
    cooldownSeconds: 30,
  },
  {
    exerciseSlug: 'sap-xep-tang-dan',
    level: 2,
    title: 'Chiến lược giải quyết',
    content:
      '1. Đọc N và danh sách số nguyên.\n2. Gọi phương thức nums.sort() trong Python.\n3. In ra danh sách phân cách bởi dấu cách qua " ".join(map(str, nums)).',
    costPoints: 10,
    cooldownSeconds: 30,
  },
  {
    exerciseSlug: 'sap-xep-tang-dan',
    level: 3,
    title: 'Code mẫu hoàn chỉnh (Python)',
    content:
      "n = int(input())\nnums = list(map(int, input().split()))\nnums.sort()\nprint(' '.join(map(str, nums)))",
    costPoints: 15,
    cooldownSeconds: 30,
  },

  // 10. Tổng đường chéo ma trận vuông
  {
    exerciseSlug: 'tong-duong-cheo-ma-tran',
    level: 1,
    title: 'Khái niệm & Tư duy',
    content:
      'Đường chéo chính của ma trận vuông N x N gồm các phần tử nằm trên đường nối từ góc trên bên trái xuống góc dưới bên phải. Chỉ số hàng và chỉ số cột của các phần tử này luôn bằng nhau.',
    costPoints: 5,
    cooldownSeconds: 30,
  },
  {
    exerciseSlug: 'tong-duong-cheo-ma-tran',
    level: 2,
    title: 'Chiến lược giải quyết',
    content:
      '1. Đọc kích thước N và N dòng ma trận.\n2. Dùng sum(matrix[i][i] for i in range(n)) để tính tổng đường chéo chính.',
    costPoints: 10,
    cooldownSeconds: 30,
  },
  {
    exerciseSlug: 'tong-duong-cheo-ma-tran',
    level: 3,
    title: 'Code mẫu hoàn chỉnh (Python)',
    content:
      'n = int(input())\nmatrix = [list(map(int, input().split())) for _ in range(n)]\nprint(sum(matrix[i][i] for i in range(n)))',
    costPoints: 15,
    cooldownSeconds: 30,
  },
];
