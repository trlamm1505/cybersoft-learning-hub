// Ngày 14 — Bộ 20 bài Python / game-logic cho lớp 6-9.
// 5 nhóm x 4 bài, độ khó tăng dần trong từng nhóm.
// prerequisiteSlug trỏ tới slug bài liền trước phải hoàn thành trước (bài đầu mỗi
// nhóm trỏ về bài cuối nhóm trước, tạo thành 1 chuỗi tiến trình duy nhất).
export const INITIAL_EXERCISES_DAY14 = [
  // ===================== NHÓM 1: INPUT / OUTPUT =====================
  {
    title: 'Chào hỏi theo tên',
    slug: 'day14-chao-hoi-theo-ten',
    gradeBand: '6-9',
    topic: 'python-fundamentals',
    orderInTopic: 1,
    description:
      'Nhập vào một tên (chuỗi không chứa khoảng trắng ở đầu/cuối). In ra câu "Xin chao, <ten>!".',
    type: 'CODE_TEXT',
    difficulty: 'EASY',
    points: 10,
    tags: ['input-output', 'string', 'lop6-9'],
    prerequisiteSlug: undefined,
    starterCode: 'ten = input()\n# Viết code của bạn ở đây\n',
    solutionCode: 'ten = input()\nprint(f"Xin chao, {ten}!")',
    timeLimitMs: 2000,
    testCases: [
      { input: 'An', expectedOutput: 'Xin chao, An!', isHidden: false },
      { input: 'Nguyen Van B', expectedOutput: 'Xin chao, Nguyen Van B!', isHidden: false },
      { input: 'A', expectedOutput: 'Xin chao, A!', isHidden: true },
      { input: 'Cybersoft Academy', expectedOutput: 'Xin chao, Cybersoft Academy!', isHidden: true },
    ],
    hints: {
      hint1: 'Đề bài chỉ cần nối chuỗi lại với nhau theo đúng khuôn mẫu "Xin chao, <ten>!". Không cần tính toán gì, chỉ cần đọc đúng 1 dòng dữ liệu và ghép chuỗi.',
      hint2:
        'Bước 1: đọc tên bằng input().\n\n' +
        'Bước 2: dùng f-string (f"...") hoặc phép nối chuỗi bằng dấu + để chèn tên vào đúng vị trí trong câu chào, nhớ giữ đúng dấu phẩy và dấu chấm than.',
      hint3:
        'ten = input()\n' +
        '# TODO: in ra đúng câu "Xin chao, <ten>!" (nhớ giữ đúng dấu phẩy và dấu chấm than)\n',
    },
  },
  {
    title: 'Tính tiền mua hàng có thuế',
    slug: 'day14-tinh-tien-co-thue',
    gradeBand: '6-9',
    topic: 'python-fundamentals',
    orderInTopic: 2,
    description:
      'Nhập giá tiền gốc (số thực, có thể có phần thập phân) trên một dòng. Thuế suất cố định là 10%. In ra tổng tiền phải trả, làm tròn đến 2 chữ số thập phân.',
    type: 'CODE_TEXT',
    difficulty: 'EASY',
    points: 10,
    tags: ['input-output', 'float', 'lop6-9'],
    prerequisiteSlug: 'day14-chao-hoi-theo-ten',
    starterCode: 'gia = float(input())\n# Viết code của bạn ở đây\n',
    solutionCode: 'gia = float(input())\ntong = gia * 1.1\nprint(f"{tong:.2f}")',
    timeLimitMs: 2000,
    testCases: [
      { input: '100', expectedOutput: '110.00', isHidden: false },
      { input: '50.5', expectedOutput: '55.55', isHidden: false },
      { input: '0', expectedOutput: '0.00', isHidden: true },
      { input: '19.99', expectedOutput: '21.99', isHidden: true },
      { input: '1000000', expectedOutput: '1100000.00', isHidden: true },
    ],
    hints: {
      hint1: 'Thuế 10% nghĩa là tổng tiền = giá gốc + 10% giá gốc = giá gốc x 1.1. Đề yêu cầu làm tròn đúng 2 chữ số thập phân khi in ra, không phải làm tròn giá trị số.',
      hint2:
        'Bước 1: đọc giá gốc bằng float(input()).\n\n' +
        'Bước 2: nhân với 1.1.\n\n' +
        'Bước 3: khi in ra, dùng định dạng chuỗi kiểu f"{gia_tri:.2f}" để luôn hiện đúng 2 chữ số sau dấu chấm, tránh dùng round() vì round() có thể không hiện đủ số 0 ở cuối.',
      hint3:
        'gia = float(input())\n' +
        '# TODO: tính tổng tiền = giá gốc + 10% thuế (nhân giá gốc với 1.1)\n' +
        '# TODO: in ra tổng tiền, dùng định dạng f"{...:.2f}" để luôn có đúng 2 chữ số thập phân\n',
    },
  },
  {
    title: 'Đổi phút thành giờ và phút',
    slug: 'day14-doi-phut-thanh-gio-phut',
    gradeBand: '6-9',
    topic: 'python-fundamentals',
    orderInTopic: 3,
    description:
      'Nhập một số nguyên không âm N là tổng số phút. In ra kết quả theo định dạng "Xh Ym" (X là số giờ, Y là số phút còn lại). Ví dụ 90 phút -> "1h 30m".',
    type: 'CODE_TEXT',
    difficulty: 'MEDIUM',
    points: 15,
    tags: ['input-output', 'so-hoc', 'lop6-9'],
    prerequisiteSlug: 'day14-tinh-tien-co-thue',
    starterCode: 'n = int(input())\n# Viết code của bạn ở đây\n',
    solutionCode: 'n = int(input())\ngio = n // 60\nphut = n % 60\nprint(f"{gio}h {phut}m")',
    timeLimitMs: 2000,
    testCases: [
      { input: '90', expectedOutput: '1h 30m', isHidden: false },
      { input: '45', expectedOutput: '0h 45m', isHidden: false },
      { input: '0', expectedOutput: '0h 0m', isHidden: true },
      { input: '60', expectedOutput: '1h 0m', isHidden: true },
      { input: '1439', expectedOutput: '23h 59m', isHidden: true },
    ],
    hints: {
      hint1: '1 giờ có 60 phút. Muốn biết N phút là bao nhiêu giờ, hãy nghĩ tới phép chia lấy phần nguyên; muốn biết còn dư mấy phút, hãy nghĩ tới phép chia lấy số dư.',
      hint2:
        'Bước 1: đọc N.\n\n' +
        'Bước 2: tính giờ = N // 60 (chia lấy nguyên).\n\n' +
        'Bước 3: tính phút còn lại = N % 60 (chia lấy dư).\n\n' +
        'Bước 4: in theo đúng khuôn "Xh Ym", nhớ in cả trường hợp giờ = 0 hoặc phút = 0 (không được bỏ qua).',
      hint3:
        'n = int(input())\n' +
        '# TODO: tính số giờ (chia lấy nguyên cho 60)\n' +
        '# TODO: tính số phút còn lại (chia lấy dư cho 60)\n' +
        '# TODO: in ra theo đúng khuôn "Xh Ym"\n',
    },
  },
  {
    title: 'Định dạng hóa đơn nhiều dòng',
    slug: 'day14-dinh-dang-hoa-don',
    gradeBand: '6-9',
    topic: 'python-fundamentals',
    orderInTopic: 4,
    description:
      'Dòng đầu là tên sản phẩm. Dòng hai là số lượng N (nguyên dương). Dòng ba là đơn giá P (số thực). In ra 3 dòng theo đúng thứ tự:\n"San pham: <ten>"\n"So luong: <N>"\n"Thanh tien: <N*P làm tròn 2 chữ số thập phân>"',
    type: 'CODE_TEXT',
    difficulty: 'MEDIUM',
    points: 15,
    tags: ['input-output', 'multi-line', 'lop6-9'],
    prerequisiteSlug: 'day14-doi-phut-thanh-gio-phut',
    starterCode: 'ten = input()\nn = int(input())\ngia = float(input())\n# Viết code của bạn ở đây\n',
    solutionCode:
      'ten = input()\n' +
      'n = int(input())\n' +
      'gia = float(input())\n' +
      'print(f"San pham: {ten}")\n' +
      'print(f"So luong: {n}")\n' +
      'print(f"Thanh tien: {n * gia:.2f}")',
    timeLimitMs: 2000,
    testCases: [
      {
        input: 'But chi\n3\n5000',
        expectedOutput: 'San pham: But chi\nSo luong: 3\nThanh tien: 15000.00',
        isHidden: false,
      },
      {
        input: 'Vo viet\n10\n7500.5',
        expectedOutput: 'San pham: Vo viet\nSo luong: 10\nThanh tien: 75005.00',
        isHidden: false,
      },
      {
        input: 'Tay xoa\n1\n0',
        expectedOutput: 'San pham: Tay xoa\nSo luong: 1\nThanh tien: 0.00',
        isHidden: true,
      },
      {
        input: 'Balo hoc sinh\n2\n199999.99',
        expectedOutput: 'San pham: Balo hoc sinh\nSo luong: 2\nThanh tien: 399999.98',
        isHidden: true,
      },
    ],
    hints: {
      hint1: 'Bài này không khó về thuật toán, chỉ cần đọc đúng thứ tự 3 dòng dữ liệu (tên là chuỗi, số lượng là số nguyên, đơn giá là số thực) và in ra đúng thứ tự 3 dòng theo khuôn mẫu cho trước.',
      hint2:
        'Bước 1: đọc tên bằng input() (giữ nguyên chuỗi, không ép kiểu số).\n\n' +
        'Bước 2: đọc số lượng bằng int(input()).\n\n' +
        'Bước 3: đọc đơn giá bằng float(input()) — dù input có thể là số nguyên như "5000", vẫn phải đọc bằng float() vì đơn giá về bản chất là số thực.\n\n' +
        'Bước 4: tính thành tiền = số lượng x đơn giá, in theo khuôn "Thanh tien: <gia_tri:.2f>".',
      hint3:
        'ten = input()\n' +
        'n = int(input())\n' +
        'gia = float(input())\n' +
        '# TODO: in 3 dòng theo đúng khuôn:\n' +
        '# "San pham: <ten>"\n' +
        '# "So luong: <n>"\n' +
        '# "Thanh tien: <n * gia, làm tròn 2 chữ số thập phân>"\n',
    },
  },

  // ===================== NHÓM 2: LIST =====================
  {
    title: 'Tổng và trung bình cộng danh sách',
    slug: 'day14-tong-trung-binh-danh-sach',
    gradeBand: '6-9',
    topic: 'python-fundamentals',
    orderInTopic: 5,
    description:
      'Dòng đầu là số lượng phần tử N (N >= 1). Dòng tiếp theo gồm N số nguyên cách nhau bởi dấu cách. In ra 2 dòng: tổng các phần tử, và trung bình cộng làm tròn 2 chữ số thập phân.',
    type: 'CODE_TEXT',
    difficulty: 'EASY',
    points: 10,
    tags: ['list', 'so-hoc', 'lop6-9'],
    prerequisiteSlug: 'day14-dinh-dang-hoa-don',
    starterCode: 'n = int(input())\nnums = list(map(int, input().split()))\n# Viết code của bạn ở đây\n',
    solutionCode:
      'n = int(input())\n' +
      'nums = list(map(int, input().split()))\n' +
      'tong = sum(nums)\n' +
      'print(tong)\n' +
      'print(f"{tong / n:.2f}")',
    timeLimitMs: 2000,
    testCases: [
      { input: '3\n1 2 3', expectedOutput: '6\n2.00', isHidden: false },
      { input: '4\n10 20 30 40', expectedOutput: '100\n25.00', isHidden: false },
      { input: '1\n7', expectedOutput: '7\n7.00', isHidden: true },
      { input: '3\n-5 5 0', expectedOutput: '0\n0.00', isHidden: true },
      { input: '5\n1 1 1 1 2', expectedOutput: '6\n1.20', isHidden: true },
    ],
    hints: {
      hint1: 'Python có sẵn hàm sum() để tính tổng cả danh sách, không cần tự viết vòng lặp cộng dồn. Trung bình cộng = tổng chia cho số lượng phần tử.',
      hint2:
        'Bước 1: đọc N và danh sách N số nguyên (dùng list(map(int, input().split()))).\n\n' +
        'Bước 2: tính tong = sum(nums).\n\n' +
        'Bước 3: in tong trên 1 dòng.\n\n' +
        'Bước 4: tính trung bình = tong / n (chia thực, không phải chia nguyên //), in ra với định dạng 2 chữ số thập phân.',
      hint3:
        'n = int(input())\n' +
        'nums = list(map(int, input().split()))\n' +
        '# TODO: tính tổng các phần tử (gợi ý: hàm có sẵn sum())\n' +
        '# TODO: in tổng, rồi in trung bình cộng (tổng / n) với 2 chữ số thập phân\n',
    },
  },
  {
    title: 'Đếm số lần xuất hiện của một giá trị',
    slug: 'day14-dem-so-lan-xuat-hien',
    gradeBand: '6-9',
    topic: 'python-fundamentals',
    orderInTopic: 6,
    description:
      'Dòng đầu là số lượng phần tử N. Dòng hai gồm N số nguyên cách nhau bởi dấu cách. Dòng ba là giá trị X cần đếm. In ra số lần X xuất hiện trong danh sách.',
    type: 'CODE_TEXT',
    difficulty: 'EASY',
    points: 10,
    tags: ['list', 'dem', 'lop6-9'],
    prerequisiteSlug: 'day14-tong-trung-binh-danh-sach',
    starterCode: 'n = int(input())\nnums = list(map(int, input().split()))\nx = int(input())\n# Viết code của bạn ở đây\n',
    solutionCode:
      'n = int(input())\n' +
      'nums = list(map(int, input().split()))\n' +
      'x = int(input())\n' +
      'print(nums.count(x))',
    timeLimitMs: 2000,
    testCases: [
      { input: '5\n1 2 2 3 2\n2', expectedOutput: '3', isHidden: false },
      { input: '4\n1 2 3 4\n5', expectedOutput: '0', isHidden: false },
      { input: '1\n9\n9', expectedOutput: '1', isHidden: true },
      { input: '6\n-1 -1 0 1 -1 2\n-1', expectedOutput: '3', isHidden: true },
    ],
    hints: {
      hint1: 'Python có sẵn phương thức .count() trên danh sách để đếm số lần 1 giá trị xuất hiện — không cần tự viết vòng lặp so sánh từng phần tử.',
      hint2:
        'Bước 1: đọc N, danh sách N số, và giá trị X cần đếm (đọc theo đúng 3 dòng, đúng thứ tự).\n\n' +
        'Bước 2: gọi nums.count(x) và in kết quả ra.',
      hint3:
        'n = int(input())\n' +
        'nums = list(map(int, input().split()))\n' +
        'x = int(input())\n' +
        '# TODO: đếm số lần x xuất hiện trong nums và in ra (gợi ý: phương thức .count())\n',
    },
  },
  {
    title: 'Loại bỏ phần tử trùng lặp, giữ thứ tự xuất hiện',
    slug: 'day14-loai-bo-trung-lap',
    gradeBand: '6-9',
    topic: 'python-fundamentals',
    orderInTopic: 7,
    description:
      'Dòng đầu là số lượng phần tử N. Dòng hai gồm N số nguyên cách nhau bởi dấu cách. In ra danh sách sau khi loại bỏ các phần tử trùng lặp (chỉ giữ lần xuất hiện đầu tiên), các số cách nhau bởi dấu cách, giữ nguyên thứ tự xuất hiện ban đầu.',
    type: 'CODE_TEXT',
    difficulty: 'MEDIUM',
    points: 15,
    tags: ['list', 'set', 'lop6-9'],
    prerequisiteSlug: 'day14-dem-so-lan-xuat-hien',
    starterCode: 'n = int(input())\nnums = list(map(int, input().split()))\n# Viết code của bạn ở đây\n',
    solutionCode:
      'n = int(input())\n' +
      'nums = list(map(int, input().split()))\n' +
      'da_thay = set()\n' +
      'ket_qua = []\n' +
      'for x in nums:\n' +
      '    if x not in da_thay:\n' +
      '        da_thay.add(x)\n' +
      '        ket_qua.append(x)\n' +
      "print(' '.join(map(str, ket_qua)))",
    timeLimitMs: 2000,
    testCases: [
      { input: '6\n1 2 2 3 1 4', expectedOutput: '1 2 3 4', isHidden: false },
      { input: '3\n5 5 5', expectedOutput: '5', isHidden: false },
      { input: '1\n7', expectedOutput: '7', isHidden: true },
      { input: '5\n4 3 2 1 4', expectedOutput: '4 3 2 1', isHidden: true },
    ],
    hints: {
      hint1: 'Không thể dùng set() trực tiếp để loại trùng lặp vì set() không giữ đúng thứ tự xuất hiện ban đầu — đề bài yêu cầu giữ nguyên thứ tự. Cần một cách khác để \'ghi nhớ\' đã gặp giá trị nào rồi.',
      hint2:
        'Bước 1: tạo 1 set rỗng để ghi nhớ các giá trị đã gặp, và 1 list rỗng để chứa kết quả.\n\n' +
        'Bước 2: duyệt từng số trong danh sách gốc theo đúng thứ tự ban đầu — nếu số đó CHƯA có trong set \'đã gặp\', thêm nó vào cả set và vào list kết quả; nếu đã có trong set rồi thì bỏ qua (không thêm lại vào kết quả).\n\n' +
        'Bước 3: in list kết quả, các số cách nhau bởi dấu cách.',
      hint3:
        'n = int(input())\n' +
        'nums = list(map(int, input().split()))\n' +
        'da_thay = set()\n' +
        'ket_qua = []\n' +
        'for x in nums:\n' +
        '    # TODO: nếu x CHƯA có trong da_thay -> thêm x vào da_thay VÀ vào ket_qua\n' +
        '    # (nếu x đã có trong da_thay rồi thì bỏ qua, không làm gì)\n' +
        '    pass\n' +
        "print(' '.join(map(str, ket_qua)))",
    },
  },
  {
    title: 'Trộn hai danh sách đã sắp xếp',
    slug: 'day14-tron-hai-danh-sach-sap-xep',
    gradeBand: '6-9',
    topic: 'python-fundamentals',
    orderInTopic: 8,
    description:
      'Dòng đầu là số lượng phần tử N của danh sách A. Dòng hai gồm N số nguyên. Dòng ba là số lượng phần tử M của danh sách B. Dòng bốn gồm M số nguyên. In ra danh sách hợp nhất của A và B theo thứ tự tăng dần (giữ cả phần tử trùng lặp), các số cách nhau bởi dấu cách. Nếu kết quả rỗng (N = 0 và M = 0), in ra dòng trống.',
    type: 'CODE_TEXT',
    difficulty: 'HARD',
    points: 20,
    tags: ['list', 'sort', 'lop6-9'],
    prerequisiteSlug: 'day14-loai-bo-trung-lap',
    starterCode:
      'n = int(input())\n' +
      'a = list(map(int, input().split()))\n' +
      'm = int(input())\n' +
      'b = list(map(int, input().split()))\n' +
      '# Viết code của bạn ở đây\n',
    solutionCode:
      'n = int(input())\n' +
      'a = list(map(int, input().split()))\n' +
      'm = int(input())\n' +
      'b = list(map(int, input().split()))\n' +
      'ket_qua = sorted(a + b)\n' +
      "print(' '.join(map(str, ket_qua)))",
    timeLimitMs: 2000,
    testCases: [
      { input: '3\n1 3 5\n3\n2 4 6', expectedOutput: '1 2 3 4 5 6', isHidden: false },
      { input: '2\n1 1\n1\n1', expectedOutput: '1 1 1', isHidden: false },
      { input: '0\n\n3\n1 2 3', expectedOutput: '1 2 3', isHidden: true },
      { input: '0\n\n0\n\n', expectedOutput: '', isHidden: true },
      { input: '4\n-3 -1 0 2\n2\n-2 1', expectedOutput: '-3 -2 -1 0 1 2', isHidden: true },
    ],
    hints: {
      hint1: 'Vì kết quả cuối cùng chỉ cần đúng thứ tự tăng dần (không yêu cầu tối ưu tốc độ), cách đơn giản nhất là: nối 2 danh sách A và B lại thành 1 danh sách lớn, rồi sắp xếp lại toàn bộ. Thử thách thật của bài này nằm ở việc đọc đúng input khi 1 trong 2 danh sách rỗng (N=0 hoặc M=0), không nằm ở thuật toán trộn.',
      hint2:
        'Bước 1: đọc N, danh sách A (N số, dùng input().split() dù N=0 vẫn phải đọc dòng đó — nó sẽ là chuỗi rỗng, split() trả về list rỗng, không gây lỗi).\n\n' +
        'Bước 2: đọc M, danh sách B tương tự.\n\n' +
        'Bước 3: nối a + b thành 1 list, dùng sorted() để sắp xếp tăng dần.\n\n' +
        'Bước 4: in ra, các số cách nhau bởi dấu cách (nếu list rỗng, join sẽ tự cho ra chuỗi rỗng, in ra đúng là 1 dòng trống).',
      hint3:
        'n = int(input())\n' +
        'a = list(map(int, input().split()))\n' +
        'm = int(input())\n' +
        'b = list(map(int, input().split()))\n' +
        '# TODO: nối 2 danh sách a và b lại, sắp xếp tăng dần (gợi ý: sorted())\n' +
        '# TODO: in kết quả, các số cách nhau bởi dấu cách\n',
    },
  },

  // ===================== NHÓM 3: LOOP =====================
  {
    title: 'In bảng cửu chương',
    slug: 'day14-bang-cuu-chuong',
    gradeBand: '6-9',
    topic: 'python-fundamentals',
    orderInTopic: 9,
    description:
      'Nhập một số nguyên N (2 <= N <= 9). In ra 10 dòng bảng cửu chương N, mỗi dòng theo định dạng "N x i = KetQua" với i chạy từ 1 đến 10.',
    type: 'CODE_TEXT',
    difficulty: 'EASY',
    points: 10,
    tags: ['loop', 'for', 'lop6-9'],
    prerequisiteSlug: 'day14-tron-hai-danh-sach-sap-xep',
    starterCode: 'n = int(input())\n# Viết code của bạn ở đây\n',
    solutionCode: 'n = int(input())\nfor i in range(1, 11):\n    print(f"{n} x {i} = {n * i}")',
    timeLimitMs: 2000,
    testCases: [
      {
        input: '2',
        expectedOutput: '2 x 1 = 2\n2 x 2 = 4\n2 x 3 = 6\n2 x 4 = 8\n2 x 5 = 10\n2 x 6 = 12\n2 x 7 = 14\n2 x 8 = 16\n2 x 9 = 18\n2 x 10 = 20',
        isHidden: false,
      },
      {
        input: '9',
        expectedOutput: '9 x 1 = 9\n9 x 2 = 18\n9 x 3 = 27\n9 x 4 = 36\n9 x 5 = 45\n9 x 6 = 54\n9 x 7 = 63\n9 x 8 = 72\n9 x 9 = 81\n9 x 10 = 90',
        isHidden: true,
      },
    ],
    hints: {
      hint1: 'Bảng cửu chương N có đúng 10 dòng, dòng thứ i có dạng "N x i = N*i" với i chạy từ 1 đến 10 (không phải từ 0).',
      hint2:
        'Bước 1: đọc N.\n\n' +
        'Bước 2: dùng vòng lặp for i in range(1, 11) để i lần lượt nhận giá trị 1, 2, ..., 10.\n\n' +
        'Bước 3: trong mỗi lần lặp, in ra đúng dòng theo khuôn f"{n} x {i} = {n * i}".',
      hint3:
        'n = int(input())\n' +
        'for i in range(1, 11):\n' +
        '    # TODO: in ra dòng "N x i = KetQua" (dùng f-string, nhớ tính đúng KetQua = n * i)\n' +
        '    pass\n',
    },
  },
  {
    title: 'Đếm số chữ số của một số nguyên',
    slug: 'day14-dem-so-chu-so',
    gradeBand: '6-9',
    topic: 'python-fundamentals',
    orderInTopic: 10,
    description:
      'Nhập một số nguyên N (có thể âm). In ra số lượng chữ số của N (không tính dấu âm).',
    type: 'CODE_TEXT',
    difficulty: 'EASY',
    points: 10,
    tags: ['loop', 'while', 'lop6-9'],
    prerequisiteSlug: 'day14-bang-cuu-chuong',
    starterCode: 'n = int(input())\n# Viết code của bạn ở đây\n',
    solutionCode:
      'n = abs(int(input()))\n' +
      'if n == 0:\n' +
      '    print(1)\n' +
      'else:\n' +
      '    dem = 0\n' +
      '    while n > 0:\n' +
      '        n //= 10\n' +
      '        dem += 1\n' +
      '    print(dem)',
    timeLimitMs: 2000,
    testCases: [
      { input: '12345', expectedOutput: '5', isHidden: false },
      { input: '0', expectedOutput: '1', isHidden: false },
      { input: '-987', expectedOutput: '3', isHidden: true },
      { input: '7', expectedOutput: '1', isHidden: true },
      { input: '1000000', expectedOutput: '7', isHidden: true },
    ],
    hints: {
      hint1: 'Có thể lấy từng chữ số cuối cùng của 1 số bằng phép chia lấy dư cho 10 (% 10), rồi \'bỏ\' chữ số đó đi bằng phép chia lấy nguyên cho 10 (// 10), lặp lại cho tới khi số về 0. Số 0 là trường hợp đặc biệt cần chú ý riêng — số 0 vẫn có đúng 1 chữ số.',
      hint2:
        'Bước 1: đọc N, lấy trị tuyệt đối bằng abs() để không bị ảnh hưởng bởi dấu âm.\n\n' +
        'Bước 2: nếu N sau khi lấy trị tuyệt đối bằng 0, in ra 1 ngay (không chạy vòng lặp vì vòng lặp \'while n > 0\' sẽ không chạy lần nào với n=0).\n\n' +
        'Bước 3: với N khác 0, dùng vòng lặp while n > 0: chia n cho 10 (n //= 10) và tăng biến đếm lên 1 mỗi lần, dừng khi n về 0.',
      hint3:
        'n = abs(int(input()))\n' +
        'if n == 0:\n' +
        '    # TODO: số 0 vẫn có đúng 1 chữ số\n' +
        '    pass\n' +
        'else:\n' +
        '    dem = 0\n' +
        '    # TODO: lặp while n > 0, mỗi lần chia n cho 10 (n //= 10) và tăng dem lên 1\n' +
        '    print(dem)',
    },
  },
  {
    title: 'Số hoàn thiện (Perfect Number)',
    slug: 'day14-so-hoan-thien',
    gradeBand: '6-9',
    topic: 'python-fundamentals',
    orderInTopic: 11,
    description:
      'Nhập một số nguyên dương N. Một số được gọi là "hoàn thiện" nếu nó bằng tổng các ước số dương của nó (không tính chính nó). In ra "YES" nếu N là số hoàn thiện, ngược lại in ra "NO". Ví dụ: 6 = 1 + 2 + 3 là số hoàn thiện.',
    type: 'CODE_TEXT',
    difficulty: 'MEDIUM',
    points: 15,
    tags: ['loop', 'for', 'so-hoc', 'lop6-9'],
    prerequisiteSlug: 'day14-dem-so-chu-so',
    starterCode: 'n = int(input())\n# Viết code của bạn ở đây\n',
    solutionCode:
      'n = int(input())\n' +
      'tong = 0\n' +
      'for i in range(1, n):\n' +
      '    if n % i == 0:\n' +
      '        tong += i\n' +
      'print("YES" if tong == n else "NO")',
    timeLimitMs: 2000,
    testCases: [
      { input: '6', expectedOutput: 'YES', isHidden: false },
      { input: '28', expectedOutput: 'YES', isHidden: false },
      { input: '1', expectedOutput: 'NO', isHidden: true },
      { input: '10', expectedOutput: 'NO', isHidden: true },
      { input: '496', expectedOutput: 'YES', isHidden: true },
    ],
    hints: {
      hint1: 'Ước số dương của N là những số từ 1 đến N-1 (không tính N) mà N chia hết cho nó. Chú ý kỹ: đề bài nói \'không tính chính nó\' — nghĩa là vòng lặp kiểm tra ước số CHỈ chạy tới N-1, không chạy tới N.',
      hint2:
        'Bước 1: đọc N.\n\n' +
        'Bước 2: dùng vòng lặp for i in range(1, n) (dừng ở n-1, không tính n) để kiểm tra từng số i có phải ước của N không (n % i == 0), nếu có thì cộng vào tổng.\n\n' +
        'Bước 3: so sánh tổng ước số với N — nếu bằng nhau, in "YES", ngược lại in "NO". Lưu ý: nếu lỡ viết range(1, n+1) (tính cả N), kết quả sẽ sai vì N luôn chia hết cho chính nó.',
      hint3:
        'n = int(input())\n' +
        'tong = 0\n' +
        'for i in range(1, n):\n' +
        '    # TODO: nếu i là ước của n (n % i == 0), cộng i vào tong\n' +
        '    pass\n' +
        '# TODO: in "YES" nếu tong == n, ngược lại in "NO"\n',
    },
  },
  {
    title: 'Kiểm tra ma trận đối xứng',
    slug: 'day14-ma-tran-doi-xung',
    gradeBand: '6-9',
    topic: 'python-fundamentals',
    orderInTopic: 12,
    description:
      'Nhập số nguyên dương N (kích thước ma trận vuông N x N, N <= 20). N dòng tiếp theo, mỗi dòng gồm N số nguyên cách nhau bởi dấu cách, biểu diễn ma trận. Ma trận được gọi là "đối xứng" nếu phần tử ở hàng i cột j luôn bằng phần tử ở hàng j cột i (đối xứng qua đường chéo chính), với mọi i, j. In ra "YES" nếu ma trận đối xứng, ngược lại in ra "NO".',
    type: 'CODE_TEXT',
    difficulty: 'HARD',
    points: 20,
    tags: ['loop', 'matrix', 'lop6-9'],
    prerequisiteSlug: 'day14-so-hoan-thien',
    starterCode:
      'n = int(input())\n' +
      'matrix = [list(map(int, input().split())) for _ in range(n)]\n' +
      '# Viết code của bạn ở đây\n',
    solutionCode:
      'n = int(input())\n' +
      'matrix = [list(map(int, input().split())) for _ in range(n)]\n' +
      'doi_xung = True\n' +
      'for i in range(n):\n' +
      '    for j in range(n):\n' +
      '        if matrix[i][j] != matrix[j][i]:\n' +
      '            doi_xung = False\n' +
      'print("YES" if doi_xung else "NO")',
    timeLimitMs: 2000,
    testCases: [
      { input: '2\n1 2\n2 1', expectedOutput: 'YES', isHidden: false },
      { input: '2\n1 2\n3 1', expectedOutput: 'NO', isHidden: false },
      { input: '1\n5', expectedOutput: 'YES', isHidden: true },
      { input: '3\n1 2 3\n2 5 6\n3 6 9', expectedOutput: 'YES', isHidden: true },
      { input: '3\n1 2 3\n2 5 6\n4 6 9', expectedOutput: 'NO', isHidden: true },
    ],
    hints: {
      hint1: 'Ma trận đối xứng nghĩa là nếu lật ma trận qua đường chéo chính (đổi hàng thành cột), ma trận không đổi. Nói cách khác: phần tử ở hàng i cột j phải luôn bằng phần tử ở hàng j cột i, với MỌI cặp i, j — không chỉ 1 vài cặp.',
      hint2:
        'Bước 1: đọc N và đọc N dòng, mỗi dòng là 1 hàng của ma trận (dùng list comprehension hoặc vòng lặp để tạo list-trong-list).\n\n' +
        'Bước 2: dùng 2 vòng lặp lồng nhau (i chạy 0..N-1, j chạy 0..N-1) để so sánh matrix[i][j] với matrix[j][i] cho MỌI cặp i, j.\n\n' +
        'Bước 3: nếu tìm thấy bất kỳ cặp nào khác nhau, đánh dấu \'không đối xứng\'.\n\n' +
        'Bước 4: in kết quả cuối cùng sau khi đã kiểm tra hết.',
      hint3:
        'n = int(input())\n' +
        'matrix = [list(map(int, input().split())) for _ in range(n)]\n' +
        'doi_xung = True\n' +
        'for i in range(n):\n' +
        '    for j in range(n):\n' +
        '        # TODO: nếu matrix[i][j] khác matrix[j][i], đánh dấu doi_xung = False\n' +
        '        pass\n' +
        'print("YES" if doi_xung else "NO")',
    },
  },

  // ===================== NHÓM 4: FUNCTION =====================
  {
    title: 'Viết hàm kiểm tra số nguyên tố',
    slug: 'day14-ham-kiem-tra-nguyen-to',
    gradeBand: '6-9',
    topic: 'python-fundamentals',
    orderInTopic: 13,
    description:
      'Viết hàm is_prime(n) trả về True nếu n là số nguyên tố, False nếu không. Chương trình đọc một số nguyên N, gọi hàm is_prime(N) và in "YES" nếu True, "NO" nếu False.',
    type: 'CODE_TEXT',
    difficulty: 'EASY',
    points: 10,
    tags: ['function', 'so-hoc', 'lop6-9'],
    prerequisiteSlug: 'day14-ma-tran-doi-xung',
    starterCode:
      'def is_prime(n):\n' +
      '    # Viết code của bạn ở đây\n' +
      '    pass\n\n' +
      'n = int(input())\n' +
      'print("YES" if is_prime(n) else "NO")\n',
    solutionCode:
      'def is_prime(n):\n' +
      '    if n < 2:\n' +
      '        return False\n' +
      '    for i in range(2, int(n ** 0.5) + 1):\n' +
      '        if n % i == 0:\n' +
      '            return False\n' +
      '    return True\n\n' +
      'n = int(input())\n' +
      'print("YES" if is_prime(n) else "NO")',
    timeLimitMs: 2000,
    testCases: [
      { input: '7', expectedOutput: 'YES', isHidden: false },
      { input: '8', expectedOutput: 'NO', isHidden: false },
      { input: '1', expectedOutput: 'NO', isHidden: true },
      { input: '2', expectedOutput: 'YES', isHidden: true },
      { input: '997', expectedOutput: 'YES', isHidden: true },
    ],
    hints: {
      hint1: 'Số nguyên tố là số lớn hơn 1 và chỉ chia hết cho 1 và chính nó. Vì vậy, số 0, số 1, và số âm KHÔNG phải số nguyên tố — cần loại trừ các trường hợp này trước khi kiểm tra ước số.',
      hint2:
        'Bước 1: trong hàm is_prime(n), nếu n nhỏ hơn 2 thì trả về False ngay.\n\n' +
        'Bước 2: dùng vòng lặp kiểm tra xem n có chia hết cho bất kỳ số nào từ 2 đến căn bậc hai của n không (chỉ cần kiểm tra tới căn bậc hai là đủ, không cần kiểm tra tới n).\n\n' +
        'Bước 3: nếu tìm thấy 1 ước số như vậy, trả về False; nếu không tìm thấy ước nào, trả về True.',
      hint3:
        'def is_prime(n):\n' +
        '    # TODO: nếu n < 2, trả về False ngay (0, 1, số âm không phải số nguyên tố)\n' +
        '    # TODO: kiểm tra n có chia hết cho số nào từ 2 đến căn bậc hai của n không\n' +
        '    # (gợi ý: range(2, int(n ** 0.5) + 1)) — nếu có, trả về False; nếu không, trả về True\n' +
        '    pass\n\n' +
        'n = int(input())\n' +
        'print("YES" if is_prime(n) else "NO")',
    },
  },
  {
    title: 'Hàm tính giai thừa có kiểm tra đầu vào',
    slug: 'day14-ham-tinh-giai-thua',
    gradeBand: '6-9',
    topic: 'python-fundamentals',
    orderInTopic: 14,
    description:
      'Viết hàm factorial(n) trả về giai thừa của n (n! = 1*2*...*n, quy ước 0! = 1). Nếu n âm, hàm trả về -1 (giá trị báo lỗi). Chương trình đọc một số nguyên N, gọi hàm và in kết quả trả về.',
    type: 'CODE_TEXT',
    difficulty: 'EASY',
    points: 10,
    tags: ['function', 'recursion-or-loop', 'lop6-9'],
    prerequisiteSlug: 'day14-ham-kiem-tra-nguyen-to',
    starterCode:
      'def factorial(n):\n' +
      '    # Viết code của bạn ở đây\n' +
      '    pass\n\n' +
      'n = int(input())\n' +
      'print(factorial(n))\n',
    solutionCode:
      'def factorial(n):\n' +
      '    if n < 0:\n' +
      '        return -1\n' +
      '    ket_qua = 1\n' +
      '    for i in range(2, n + 1):\n' +
      '        ket_qua *= i\n' +
      '    return ket_qua\n\n' +
      'n = int(input())\n' +
      'print(factorial(n))',
    timeLimitMs: 2000,
    testCases: [
      { input: '5', expectedOutput: '120', isHidden: false },
      { input: '0', expectedOutput: '1', isHidden: false },
      { input: '-3', expectedOutput: '-1', isHidden: true },
      { input: '1', expectedOutput: '1', isHidden: true },
      { input: '10', expectedOutput: '3628800', isHidden: true },
    ],
    hints: {
      hint1: 'Giai thừa của n (n!) là tích của tất cả số nguyên từ 1 đến n. Có 2 quy ước đặc biệt cần nhớ: 0! = 1 (không phải 0), và số âm không có giai thừa hợp lệ nên hàm phải trả về -1 để báo lỗi.',
      hint2:
        'Bước 1: trong hàm factorial(n), nếu n âm thì trả về -1 ngay.\n\n' +
        'Bước 2: nếu n không âm, khởi tạo kết quả = 1 (đúng cho cả trường hợp n=0).\n\n' +
        'Bước 3: dùng vòng lặp for i in range(2, n+1) để nhân dồn kết quả với từng số từ 2 đến n (nếu n=0 hoặc n=1, vòng lặp này sẽ không chạy lần nào — kết quả giữ đúng là 1).\n\n' +
        'Bước 4: trả về kết quả.',
      hint3:
        'def factorial(n):\n' +
        '    # TODO: nếu n âm, trả về -1 ngay\n' +
        '    ket_qua = 1\n' +
        '    # TODO: dùng vòng lặp for để nhân dồn ket_qua với từng số từ 2 đến n\n' +
        '    return ket_qua\n\n' +
        'n = int(input())\n' +
        'print(factorial(n))',
    },
  },
  {
    title: 'Hàm tái sử dụng: quy đổi điểm chữ',
    slug: 'day14-ham-quy-doi-diem-chu',
    gradeBand: '6-9',
    topic: 'python-fundamentals',
    orderInTopic: 15,
    description:
      'Viết hàm xep_loai(diem) trả về chuỗi xếp loại theo quy tắc: diem >= 9 -> "A"; 8 <= diem < 9 -> "B"; 6.5 <= diem < 8 -> "C"; 5 <= diem < 6.5 -> "D"; diem < 5 -> "F". Dòng đầu là số lượng N điểm số. Dòng hai gồm N số thực cách nhau bởi dấu cách. Với mỗi điểm, in ra kết quả xep_loai tương ứng, mỗi kết quả trên một dòng, theo đúng thứ tự đầu vào.',
    type: 'CODE_TEXT',
    difficulty: 'MEDIUM',
    points: 15,
    tags: ['function', 'conditional', 'lop6-9'],
    prerequisiteSlug: 'day14-ham-tinh-giai-thua',
    starterCode:
      'def xep_loai(diem):\n' +
      '    # Viết code của bạn ở đây\n' +
      '    pass\n\n' +
      'n = int(input())\n' +
      'diems = list(map(float, input().split()))\n' +
      'for d in diems:\n' +
      '    print(xep_loai(d))\n',
    solutionCode:
      'def xep_loai(diem):\n' +
      '    if diem >= 9:\n' +
      '        return "A"\n' +
      '    if diem >= 8:\n' +
      '        return "B"\n' +
      '    if diem >= 6.5:\n' +
      '        return "C"\n' +
      '    if diem >= 5:\n' +
      '        return "D"\n' +
      '    return "F"\n\n' +
      'n = int(input())\n' +
      'diems = list(map(float, input().split()))\n' +
      'for d in diems:\n' +
      '    print(xep_loai(d))',
    timeLimitMs: 2000,
    testCases: [
      { input: '3\n9.5 7 4', expectedOutput: 'A\nC\nF', isHidden: false },
      { input: '1\n5', expectedOutput: 'D', isHidden: false },
      { input: '4\n9 8.9 8 6.5', expectedOutput: 'A\nB\nB\nC', isHidden: true },
      { input: '2\n0 10', expectedOutput: 'F\nA', isHidden: true },
      { input: '1\n4.999', expectedOutput: 'F', isHidden: true },
    ],
    hints: {
      hint1: 'Khi có nhiều điều kiện xếp hạng theo mức (A, B, C, D, F), cách viết an toàn nhất là kiểm tra từ ngưỡng CAO NHẤT xuống THẤP NHẤT, dùng return ngay khi tìm thấy đúng mức — không cần lo lồng nhiều else-if phức tạp.',
      hint2:
        'Bước 1: trong hàm xep_loai(diem), kiểm tra lần lượt: nếu diem >= 9 trả về "A" ngay; nếu không, kiểm tra diem >= 8 trả về "B"; tiếp tục hạ dần ngưỡng (6.5 cho "C", 5 cho "D"); cuối cùng nếu không khớp ngưỡng nào, trả về "F". Chú ý dùng đúng dấu >= (không phải >) vì ngưỡng là bao gồm cả giá trị biên.\n\n' +
        'Bước 2: đọc N điểm, gọi hàm cho từng điểm và in kết quả từng dòng.',
      hint3:
        'def xep_loai(diem):\n' +
        '    # TODO: kiểm tra lần lượt từ ngưỡng CAO xuống THẤP (9, 8, 6.5, 5),\n' +
        '    # dùng dấu >= (không phải >), return ngay khi khớp ngưỡng nào đó\n' +
        '    # Nếu không khớp ngưỡng nào -> return "F"\n' +
        '    pass\n\n' +
        'n = int(input())\n' +
        'diems = list(map(float, input().split()))\n' +
        'for d in diems:\n' +
        '    print(xep_loai(d))',
    },
  },
  {
    title: 'Hàm đệ quy: đếm số lần xuất hiện trong danh sách',
    slug: 'day14-ham-de-quy-dem-xuat-hien',
    gradeBand: '6-9',
    topic: 'python-fundamentals',
    orderInTopic: 16,
    description:
      'Viết hàm đệ quy dem(nums, x) trả về số lần giá trị x xuất hiện trong danh sách nums (không dùng list.count(), không dùng vòng lặp for/while — chỉ dùng đệ quy: kiểm tra phần tử đầu danh sách, rồi gọi lại hàm cho phần còn lại). Dòng đầu là số lượng phần tử N. Dòng hai gồm N số nguyên. Dòng ba là giá trị X cần đếm. In ra kết quả dem(nums, X).',
    type: 'CODE_TEXT',
    difficulty: 'HARD',
    points: 20,
    tags: ['function', 'recursion', 'lop6-9'],
    prerequisiteSlug: 'day14-ham-quy-doi-diem-chu',
    starterCode:
      'def dem(nums, x):\n' +
      '    # Viết code của bạn ở đây (chỉ dùng đệ quy, không dùng for/while)\n' +
      '    pass\n\n' +
      'n = int(input())\n' +
      'nums = list(map(int, input().split()))\n' +
      'x = int(input())\n' +
      'print(dem(nums, x))\n',
    solutionCode:
      'def dem(nums, x):\n' +
      '    if len(nums) == 0:\n' +
      '        return 0\n' +
      '    dau = 1 if nums[0] == x else 0\n' +
      '    return dau + dem(nums[1:], x)\n\n' +
      'n = int(input())\n' +
      'nums = list(map(int, input().split()))\n' +
      'x = int(input())\n' +
      'print(dem(nums, x))',
    timeLimitMs: 2000,
    testCases: [
      { input: '5\n1 2 2 3 2\n2', expectedOutput: '3', isHidden: false },
      { input: '4\n1 2 3 4\n5', expectedOutput: '0', isHidden: false },
      { input: '1\n9\n9', expectedOutput: '1', isHidden: true },
      { input: '6\n-1 -1 0 1 -1 2\n-1', expectedOutput: '3', isHidden: true },
      { input: '0\n\n5', expectedOutput: '0', isHidden: true },
    ],
    hints: {
      hint1: 'Đệ quy là khi 1 hàm tự gọi lại chính nó với dữ liệu nhỏ hơn, cho tới khi gặp 1 trường hợp đơn giản nhất (gọi là \'trường hợp dừng\'/base case) thì trả về kết quả trực tiếp, không gọi lại nữa. Với danh sách, trường hợp dừng tự nhiên nhất là \'danh sách rỗng\'.',
      hint2:
        'Bước 1: trường hợp dừng — nếu danh sách rỗng (len(nums) == 0), trả về 0 ngay (không còn gì để đếm).\n\n' +
        'Bước 2: trường hợp còn phần tử — kiểm tra phần tử ĐẦU TIÊN (nums[0]) có bằng x không, được 1 điểm nếu đúng, 0 điểm nếu sai.\n\n' +
        'Bước 3: cộng điểm đó với kết quả của việc gọi lại chính hàm dem() nhưng cho PHẦN CÒN LẠI của danh sách (nums[1:], bỏ phần tử đầu). Đừng dùng for/while — chỉ dùng chính hàm tự gọi lại.',
      hint3:
        'def dem(nums, x):\n' +
        '    # TODO: trường hợp dừng — nếu danh sách rỗng, trả về 0\n' +
        '    # TODO: kiểm tra phần tử đầu tiên (nums[0]) có bằng x không (1 điểm nếu đúng, 0 nếu sai)\n' +
        '    # TODO: cộng điểm đó với dem(phần còn lại của danh sách, x) — gọi lại chính hàm dem\n' +
        '    pass\n\n' +
        'n = int(input())\n' +
        'nums = list(map(int, input().split()))\n' +
        'x = int(input())\n' +
        'print(dem(nums, x))',
    },
  },

  // ===================== NHÓM 5: SIMULATION (GAME LOGIC) =====================
  {
    title: 'Mô phỏng oẳn tù tì (Kéo Búa Bao)',
    slug: 'day14-oan-tu-ti',
    gradeBand: '6-9',
    topic: 'python-fundamentals',
    orderInTopic: 17,
    description:
      'Nhập vào 2 dòng, mỗi dòng là lựa chọn của người chơi 1 và người chơi 2 (một trong 3 giá trị: "keo", "bua", "bao"). In ra "P1" nếu người chơi 1 thắng, "P2" nếu người chơi 2 thắng, "HOA" nếu hòa. Quy tắc: keo thắng bao, bua thắng keo, bao thắng bua.',
    type: 'CODE_TEXT',
    difficulty: 'EASY',
    points: 10,
    tags: ['simulation', 'game-logic', 'lop6-9'],
    prerequisiteSlug: 'day14-ham-de-quy-dem-xuat-hien',
    starterCode: 'p1 = input()\np2 = input()\n# Viết code của bạn ở đây\n',
    solutionCode:
      'p1 = input()\n' +
      'p2 = input()\n' +
      'thang = {"keo": "bao", "bua": "keo", "bao": "bua"}\n' +
      'if p1 == p2:\n' +
      '    print("HOA")\n' +
      'elif thang[p1] == p2:\n' +
      '    print("P1")\n' +
      'else:\n' +
      '    print("P2")',
    timeLimitMs: 2000,
    testCases: [
      { input: 'keo\nbao', expectedOutput: 'P1', isHidden: false },
      { input: 'bua\nbua', expectedOutput: 'HOA', isHidden: false },
      { input: 'bao\nbua', expectedOutput: 'P1', isHidden: true },
      { input: 'keo\nbua', expectedOutput: 'P2', isHidden: true },
      { input: 'bao\nkeo', expectedOutput: 'P2', isHidden: true },
    ],
    hints: {
      hint1: 'Chỉ có 3 lựa chọn (keo, bua, bao) và 1 quy tắc thắng-thua cố định. Thay vì viết nhiều câu if/elif rắc rối cho từng cặp, hãy nghĩ tới việc dùng 1 \'bảng tra\' (dictionary trong Python) ghi rõ \'<lựa chọn này> thắng <lựa chọn nào>\'.',
      hint2:
        'Bước 1: đọc lựa chọn của cả 2 người chơi.\n\n' +
        'Bước 2: nếu 2 lựa chọn giống nhau, in "HOA" ngay.\n\n' +
        'Bước 3: tạo 1 dict tên là \'thang\' với 3 cặp key-value: "keo" thắng "bao", "bua" thắng "keo", "bao" thắng "bua".\n\n' +
        'Bước 4: kiểm tra xem thang[p1] có bằng p2 không — nếu đúng, người 1 thắng ("P1"); nếu không, người 2 thắng ("P2").',
      hint3:
        'p1 = input()\n' +
        'p2 = input()\n' +
        '# TODO: tạo dict "thang" ghi rõ lựa chọn nào thắng lựa chọn nào\n' +
        '# ("keo" thắng gì? "bua" thắng gì? "bao" thắng gì?)\n' +
        'if p1 == p2:\n' +
        '    print("HOA")\n' +
        '# TODO: nếu thang[p1] == p2 thì người 1 thắng ("P1"), ngược lại người 2 thắng ("P2")\n',
    },
  },
  {
    title: 'Mô phỏng thang máy đơn giản',
    slug: 'day14-mo-phong-thang-may',
    gradeBand: '6-9',
    topic: 'python-fundamentals',
    orderInTopic: 18,
    description:
      'Thang máy bắt đầu ở tầng 1 trong một tòa nhà có các tầng từ 1 đến 10. Dòng đầu là số lượng lệnh N. Dòng hai gồm N lệnh cách nhau bởi dấu cách, mỗi lệnh là "UP" (lên 1 tầng) hoặc "DOWN" (xuống 1 tầng). Nếu lệnh khiến thang máy vượt quá tầng 10 hoặc xuống dưới tầng 1 thì bỏ qua lệnh đó (thang máy đứng yên). Sau khi thực hiện hết N lệnh, in ra tầng hiện tại của thang máy.',
    type: 'CODE_TEXT',
    difficulty: 'MEDIUM',
    points: 15,
    tags: ['simulation', 'game-logic', 'edge-case', 'lop6-9'],
    prerequisiteSlug: 'day14-oan-tu-ti',
    starterCode:
      'n = int(input())\n' +
      'lenh = input().split() if n > 0 else []\n' +
      '# Viết code của bạn ở đây\n',
    solutionCode:
      'n = int(input())\n' +
      'lenh = input().split() if n > 0 else []\n' +
      'tang = 1\n' +
      'for l in lenh:\n' +
      '    if l == "UP" and tang < 10:\n' +
      '        tang += 1\n' +
      '    elif l == "DOWN" and tang > 1:\n' +
      '        tang -= 1\n' +
      'print(tang)',
    timeLimitMs: 2000,
    testCases: [
      { input: '3\nUP UP DOWN', expectedOutput: '2', isHidden: false },
      { input: '2\nDOWN DOWN', expectedOutput: '1', isHidden: false },
      { input: '0\n', expectedOutput: '1', isHidden: true },
      { input: '15\nUP UP UP UP UP UP UP UP UP UP UP UP DOWN DOWN DOWN', expectedOutput: '7', isHidden: true },
      { input: '4\nDOWN UP UP DOWN', expectedOutput: '2', isHidden: true },
    ],
    hints: {
      hint1: 'Đây là bài mô phỏng từng bước: xử lý lệnh này rồi mới xử lý lệnh tiếp theo, y hệt thang máy thật. Điểm khó nhất không phải là di chuyển, mà là nhớ \'chặn biên\' — không cho tầng vượt quá 10 hoặc xuống dưới 1.',
      hint2:
        'Bước 1: đọc N và danh sách N lệnh (nếu N=0, vẫn phải đọc dòng đó dù nó rỗng).\n\n' +
        'Bước 2: khởi tạo tầng = 1.\n\n' +
        'Bước 3: với mỗi lệnh trong danh sách: nếu lệnh là "UP" VÀ tầng hiện tại nhỏ hơn 10, tăng tầng lên 1; nếu lệnh là "DOWN" VÀ tầng hiện tại lớn hơn 1, giảm tầng đi 1 (các trường hợp khác — vượt biên — thì bỏ qua, không làm gì).\n\n' +
        'Bước 4: in tầng cuối cùng sau khi xử lý hết lệnh.',
      hint3:
        'n = int(input())\n' +
        'lenh = input().split() if n > 0 else []\n' +
        'tang = 1\n' +
        'for l in lenh:\n' +
        '    # TODO: nếu l == "UP" VÀ tang < 10 -> tang += 1\n' +
        '    # TODO: nếu l == "DOWN" VÀ tang > 1 -> tang -= 1\n' +
        '    # (các trường hợp vượt biên khác thì bỏ qua)\n' +
        '    pass\n' +
        'print(tang)',
    },
  },
  {
    title: 'Mô phỏng túi đồ trong game nhập vai',
    slug: 'day14-mo-phong-tui-do',
    gradeBand: '6-9',
    topic: 'python-fundamentals',
    orderInTopic: 19,
    description:
      'Một túi đồ có sức chứa tối đa C vật phẩm (C là số nguyên dương). Dòng đầu là C. Dòng hai là số lượng lệnh N. N dòng tiếp theo, mỗi dòng là một lệnh: "ADD <ten>" (thêm vật phẩm nếu túi chưa đầy, nếu đầy thì bỏ qua) hoặc "REMOVE <ten>" (xóa vật phẩm nếu có trong túi, nếu không có thì bỏ qua). Sau khi xử lý hết lệnh, in ra danh sách vật phẩm còn lại trong túi theo đúng thứ tự đã thêm vào, mỗi tên trên một dòng. Nếu túi rỗng, không in gì cả.',
    type: 'CODE_TEXT',
    difficulty: 'MEDIUM',
    points: 15,
    tags: ['simulation', 'game-logic', 'list', 'lop6-9'],
    prerequisiteSlug: 'day14-mo-phong-thang-may',
    starterCode:
      'c = int(input())\n' +
      'n = int(input())\n' +
      'tui = []\n' +
      'for _ in range(n):\n' +
      '    lenh = input().split()\n' +
      '    # Viết code của bạn ở đây\n' +
      '    pass\n',
    solutionCode:
      'c = int(input())\n' +
      'n = int(input())\n' +
      'tui = []\n' +
      'for _ in range(n):\n' +
      '    lenh = input().split()\n' +
      '    hanh_dong = lenh[0]\n' +
      '    ten = lenh[1]\n' +
      '    if hanh_dong == "ADD":\n' +
      '        if len(tui) < c:\n' +
      '            tui.append(ten)\n' +
      '    elif hanh_dong == "REMOVE":\n' +
      '        if ten in tui:\n' +
      '            tui.remove(ten)\n' +
      'for vat_pham in tui:\n' +
      '    print(vat_pham)',
    timeLimitMs: 2000,
    testCases: [
      {
        input: '3\n3\nADD kiem\nADD khien\nADD thuoc',
        expectedOutput: 'kiem\nkhien\nthuoc',
        isHidden: false,
      },
      {
        input: '2\n4\nADD kiem\nADD khien\nADD thuoc\nREMOVE khien',
        expectedOutput: 'kiem',
        isHidden: false,
      },
      { input: '1\n1\nREMOVE kiem', expectedOutput: '', isHidden: true },
      {
        input: '2\n5\nADD a\nADD b\nADD c\nREMOVE a\nADD c',
        expectedOutput: 'b\nc',
        isHidden: true,
      },
      { input: '5\n0', expectedOutput: '', isHidden: true },
    ],
    hints: {
      hint1: 'Túi đồ ở đây chính là 1 list Python bình thường, chỉ có thêm 1 quy tắc: không được thêm vào nếu túi đã đầy (số phần tử đạt tới sức chứa tối đa C). Lệnh REMOVE 1 vật không có trong túi thì chỉ cần bỏ qua, không báo lỗi.',
      hint2:
        'Bước 1: đọc C, N và khởi tạo túi = list rỗng.\n\n' +
        'Bước 2: với mỗi lệnh trong N lệnh, tách lệnh đó thành 2 phần bằng .split() (hành động và tên vật phẩm).\n\n' +
        'Bước 3: nếu hành động là "ADD", chỉ thêm vào túi nếu độ dài túi hiện tại còn nhỏ hơn C.\n\n' +
        'Bước 4: nếu hành động là "REMOVE", chỉ xóa nếu tên đó thật sự có trong túi (kiểm tra bằng \'if ten in tui\' trước khi gọi .remove()).\n\n' +
        'Bước 5: in từng vật phẩm còn lại trong túi, mỗi tên 1 dòng, theo đúng thứ tự đã thêm vào.',
      hint3:
        'c = int(input())\n' +
        'n = int(input())\n' +
        'tui = []\n' +
        'for _ in range(n):\n' +
        '    lenh = input().split()\n' +
        '    hanh_dong = lenh[0]\n' +
        '    ten = lenh[1]\n' +
        '    # TODO: nếu hanh_dong == "ADD" VÀ túi chưa đầy (len(tui) < c) -> thêm ten vào tui\n' +
        '    # TODO: nếu hanh_dong == "REMOVE" VÀ ten có trong tui -> xóa ten khỏi tui\n' +
        '    pass\n' +
        'for vat_pham in tui:\n' +
        '    print(vat_pham)',
    },
  },
  {
    title: 'Mô phỏng trận đấu theo lượt',
    slug: 'day14-mo-phong-tran-dau',
    gradeBand: '6-9',
    topic: 'python-fundamentals',
    orderInTopic: 20,
    description:
      'Hai nhân vật đánh nhau, thay phiên nhau ra đòn. Dòng đầu gồm 2 số: máu ban đầu và sát thương mỗi đòn của nhân vật 1 (cách nhau bởi dấu cách). Dòng hai tương tự cho nhân vật 2. Nhân vật 1 đánh trước, sau đó tới nhân vật 2, rồi lại nhân vật 1... cứ thế xen kẽ. Mỗi lượt, người đánh làm đối thủ mất máu đúng bằng sát thương của mình. Ai bị trừ máu xuống 0 hoặc thấp hơn thì thua ngay lúc đó (không cần chờ đối thủ đánh thêm). In ra "P1" nếu nhân vật 1 thắng, "P2" nếu nhân vật 2 thắng.',
    type: 'CODE_TEXT',
    difficulty: 'HARD',
    points: 20,
    tags: ['simulation', 'game-logic', 'turn-based', 'lop6-9'],
    prerequisiteSlug: 'day14-mo-phong-tui-do',
    starterCode:
      'hp1, atk1 = map(int, input().split())\n' +
      'hp2, atk2 = map(int, input().split())\n' +
      '# Viết code của bạn ở đây\n',
    solutionCode:
      'hp1, atk1 = map(int, input().split())\n' +
      'hp2, atk2 = map(int, input().split())\n' +
      'luot_p1 = True\n' +
      'while True:\n' +
      '    if luot_p1:\n' +
      '        hp2 -= atk1\n' +
      '        if hp2 <= 0:\n' +
      '            print("P1")\n' +
      '            break\n' +
      '    else:\n' +
      '        hp1 -= atk2\n' +
      '        if hp1 <= 0:\n' +
      '            print("P2")\n' +
      '            break\n' +
      '    luot_p1 = not luot_p1',
    timeLimitMs: 2000,
    testCases: [
      { input: '10 5\n10 3', expectedOutput: 'P1', isHidden: false },
      { input: '5 1\n100 50', expectedOutput: 'P2', isHidden: false },
      { input: '1 1\n1 1', expectedOutput: 'P1', isHidden: true },
      { input: '1 1\n100 1', expectedOutput: 'P2', isHidden: true },
      { input: '10 10\n10 1', expectedOutput: 'P1', isHidden: true },
    ],
    hints: {
      hint1: 'Đây là bài mô phỏng lượt đánh xen kẽ: người 1 đánh, rồi người 2 đánh, rồi lại người 1... Điểm quan trọng nhất: phải kiểm tra \'đối thủ đã thua chưa\' NGAY SAU mỗi đòn đánh, không phải chờ tới khi cả 2 người đã đánh xong 1 vòng.',
      hint2:
        'Bước 1: đọc máu và sát thương của cả 2 nhân vật.\n\n' +
        'Bước 2: dùng 1 biến boolean (ví dụ luot_p1 = True) để theo dõi ai đang đánh.\n\n' +
        'Bước 3: dùng vòng lặp while True — nếu đang là lượt người 1, trừ máu người 2 theo sát thương của người 1, rồi kiểm tra NGAY nếu máu người 2 <= 0 thì in "P1" và dừng vòng lặp (dùng break); ngược lại làm tương tự cho người 2.\n\n' +
        'Bước 4: sau mỗi lượt đánh (nếu chưa ai thua), đổi lượt bằng cách đảo giá trị luot_p1 (luot_p1 = not luot_p1).',
      hint3:
        'hp1, atk1 = map(int, input().split())\n' +
        'hp2, atk2 = map(int, input().split())\n' +
        'luot_p1 = True\n' +
        'while True:\n' +
        '    if luot_p1:\n' +
        '        # TODO: trừ máu người 2 theo atk1, kiểm tra NGAY nếu hp2 <= 0 -> in "P1", break\n' +
        '        pass\n' +
        '    else:\n' +
        '        # TODO: trừ máu người 1 theo atk2, kiểm tra NGAY nếu hp1 <= 0 -> in "P2", break\n' +
        '        pass\n' +
        '    # TODO: đổi lượt (đảo giá trị luot_p1) nếu chưa ai thua\n',
    },
  },
];
