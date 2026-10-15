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
    title: 'Hướng giải bằng giả mã (không phải code)',
    content:
      'Bước 1: Đọc số thứ nhất từ dòng nhập, đổi sang số nguyên.\nBước 2: Đọc số thứ hai tương tự.\nBước 3: Cộng hai số lại thành một kết quả.\nBước 4: In kết quả ra màn hình.',
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
    title: 'Hướng giải bằng giả mã (không phải code)',
    content:
      'Bước 1: Đọc số n và đổi sang số nguyên.\nBước 2: Lấy phần dư khi chia n cho 2.\nBước 3: Nếu phần dư bằng 0 thì in "Chẵn", ngược lại in "Lẻ".',
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
    title: 'Hướng giải bằng giả mã (không phải code)',
    content:
      'Bước 1: Đọc n, rồi đọc dãy số trên dòng kế tiếp và tách thành danh sách số nguyên.\nBước 2: Giữ một biến "lớn nhất" bắt đầu từ phần tử đầu tiên.\nBước 3: Duyệt các phần tử còn lại, gặp số lớn hơn thì cập nhật biến đó.\nBước 4: In giá trị lớn nhất tìm được.',
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
    title: 'Hướng giải bằng giả mã (không phải code)',
    content:
      'Bước 1: Đọc chuỗi đầu vào.\nBước 2: Duyệt từng ký tự từ cuối về đầu để ghép thành chuỗi mới (hoặc dùng phép cắt chuỗi với bước lùi).\nBước 3: In chuỗi đã đảo.',
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
    title: 'Hướng giải bằng giả mã (không phải code)',
    content:
      'Bước 1: Đọc n. Nếu n nhỏ hơn 2 thì kết luận "NO" ngay.\nBước 2: Thử chia n cho các số i từ 2 đến căn bậc hai của n.\nBước 3: Nếu có i nào chia hết n thì không phải số nguyên tố: in "NO".\nBước 4: Nếu không có số nào chia hết thì in "YES".',
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
    title: 'Hướng giải bằng giả mã (không phải code)',
    content:
      'Bước 1: Đọc n. Hai số đầu của dãy đều bằng 1.\nBước 2: Lặp n - 1 lần: mỗi lượt, số mới bằng tổng hai số liền trước; dời hai biến lên một vị trí.\nBước 3: Sau vòng lặp, in số hiện tại là số Fibonacci thứ n.',
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
    title: 'Hướng giải bằng giả mã (không phải code)',
    content:
      'Bước 1: Đọc hai số a và b.\nBước 2: Áp dụng thuật toán Euclid: khi b chưa bằng 0, thay (a, b) bằng (b, phần dư của a chia b).\nBước 3: Khi b bằng 0, a chính là ước chung lớn nhất; in a.',
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
    title: 'Hướng giải bằng giả mã (không phải code)',
    content:
      'Bước 1: Đọc chuỗi đầu vào.\nBước 2: Tạo bản đảo ngược của chuỗi (hoặc so sánh ký tự đầu với ký tự cuối, tiến dần vào giữa).\nBước 3: Nếu hai bản giống hệt nhau thì in "YES", ngược lại in "NO".',
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
    title: 'Hướng giải bằng giả mã (không phải code)',
    content:
      'Bước 1: Đọc n và dãy số, tách thành danh sách số nguyên.\nBước 2: Sắp xếp danh sách theo thứ tự tăng dần (có thể dùng hàm sắp xếp có sẵn của ngôn ngữ).\nBước 3: In các phần tử cách nhau bởi một dấu cách.',
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
    title: 'Hướng giải bằng giả mã (không phải code)',
    content:
      'Bước 1: Đọc n, sau đó đọc n dòng, mỗi dòng gồm n số, để thành ma trận.\nBước 2: Đường chéo chính gồm các ô có chỉ số dòng bằng chỉ số cột.\nBước 3: Cộng các ô ở vị trí (0,0), (1,1), ..., (n-1,n-1) và in tổng.',
    costPoints: 15,
    cooldownSeconds: 30,
  },
];
