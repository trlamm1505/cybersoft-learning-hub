// Ngày 15 — Bộ 15 bài luyện thi thuật toán cho lớp 10-12 (gradeBand: '9-12',
// đồng bộ với giá trị FE CodePlaygroundPage.tsx đã dùng cho nhóm lớp lớn nhất).
// 5 nhóm x 3 bài: Complexity, Sorting, Binary Search, Greedy, Graph/DP cơ bản.
// Mỗi bài có ít nhất 1 test case với N đủ lớn để buộc độ phức tạp: lời giải
// O(N^2) hoặc tệ hơn sẽ vượt timeLimitMs, chỉ lời giải đúng độ phức tạp mục
// tiêu (ghi trong "complexity" bên dưới mỗi bài, tương ứng complexity-rubric.md)
// mới chạy kịp. prerequisiteSlug nối 15 bài thành 1 chuỗi tiến trình duy nhất.
export const INITIAL_EXERCISES_DAY15 = [
  // ===================== NHÓM 1: COMPLEXITY =====================
  {
    title: 'Đếm cặp có tổng bằng target',
    slug: 'day15-dem-cap-tong-bang-target',
    gradeBand: '9-12',
    topic: 'algorithm-contest-prep',
    orderInTopic: 1,
    description:
      'Cho mảng N số nguyên (N <= 200000, các phần tử trong khoảng [-10^9, 10^9]) và một số nguyên target. Đếm số cặp chỉ số (i, j) với i < j sao cho a[i] + a[j] = target. ' +
      'Ràng buộc N lớn buộc thuật toán phải chạy O(N log N) trở xuống (dùng sắp xếp + 2 con trỏ, hoặc bảng băm đếm tần suất) — thuật toán duyệt cặp O(N^2) sẽ vượt quá thời gian cho phép.',
    type: 'CODE_TEXT',
    difficulty: 'MEDIUM',
    points: 15,
    tags: ['complexity', 'hashmap', 'two-pointer', 'lop10-12'],
    prerequisiteSlug: undefined,
    starterCode:
      'from collections import defaultdict\n\n' +
      'n = int(input())\n' +
      'a = list(map(int, input().split()))\n' +
      'target = int(input())\n' +
      '# Viết code của bạn ở đây (yêu cầu O(N log N) hoặc O(N), tránh O(N^2))\n',
    solutionCode:
      'from collections import defaultdict\n\n' +
      'n = int(input())\n' +
      'a = list(map(int, input().split()))\n' +
      'target = int(input())\n' +
      'cnt = defaultdict(int)\n' +
      'pairs = 0\n' +
      'for x in a:\n' +
      '    pairs += cnt[target - x]\n' +
      '    cnt[x] += 1\n' +
      'print(pairs)',
    timeLimitMs: 2000,
    testCases: [
      { input: '5\n1 2 3 4 5\n6', expectedOutput: '2', isHidden: false },
      { input: '4\n1 1 1 1\n2', expectedOutput: '6', isHidden: false },
      { input: '3\n5 5 5\n100', expectedOutput: '0', isHidden: true },
      { input: '1\n10\n20', expectedOutput: '0', isHidden: true },
      {
        input: '200000\n' + Array.from({ length: 200000 }, (_, i) => (i % 2 === 0 ? 1000000000 : -1000000000)).join(' ') + '\n0',
        expectedOutput: '10000000000',
        isHidden: true,
      },
    ],
    hints: {
      hint1: 'Duyệt cặp bằng 2 vòng lặp lồng nhau sẽ đúng nhưng chạy O(N^2) — với N = 200000, đó là 4*10^10 phép tính, chắc chắn quá thời gian cho phép. Cần cách đếm cặp mà chỉ duyệt mảng đúng 1 lần.',
      hint2:
        'Bước 1: dùng 1 dict (hoặc Counter) để đếm tần suất từng giá trị đã gặp.\n\n' +
        'Bước 2: duyệt mảng từ trái sang phải, với mỗi phần tử x, cộng vào kết quả số lần giá trị (target - x) đã xuất hiện TRƯỚC ĐÓ (đã lưu trong dict), rồi mới cập nhật dict thêm x vào — thứ tự này đảm bảo mỗi cặp (i, j) với i < j chỉ được đếm đúng 1 lần.',
      hint3:
        'from collections import defaultdict\n\n' +
        'n = int(input())\n' +
        'a = list(map(int, input().split()))\n' +
        'target = int(input())\n' +
        'cnt = defaultdict(int)\n' +
        'pairs = 0\n' +
        'for x in a:\n' +
        '    # TODO: cộng vào pairs số lần giá trị (target - x) đã xuất hiện TRƯỚC ĐÓ\n' +
        '    # (tra cứu trong cnt bằng đúng khóa target - x)\n\n' +
        '    # TODO: cập nhật cnt để ghi nhận vừa gặp thêm giá trị x\n' +
        '    # (nhớ làm sau bước cộng ở trên, không làm trước)\n' +
        '    pass\n' +
        'print(pairs)',
    },
  },
  {
    title: 'Đếm nghịch thế trong dãy số',
    slug: 'day15-dem-nghich-the',
    gradeBand: '9-12',
    topic: 'algorithm-contest-prep',
    orderInTopic: 2,
    description:
      'Cho dãy N số nguyên (N <= 100000). Một cặp chỉ số (i, j) với i < j được gọi là "nghịch thế" nếu a[i] > a[j]. Đếm tổng số cặp nghịch thế trong dãy. ' +
      'Ràng buộc N lớn buộc dùng thuật toán O(N log N) (merge sort đếm nghịch thế, hoặc Binary Indexed Tree) — duyệt cặp trực tiếp O(N^2) sẽ vượt thời gian.',
    type: 'CODE_TEXT',
    difficulty: 'HARD',
    points: 20,
    tags: ['complexity', 'divide-and-conquer', 'merge-sort', 'lop10-12'],
    prerequisiteSlug: 'day15-dem-cap-tong-bang-target',
    starterCode:
      'n = int(input())\n' +
      'a = list(map(int, input().split()))\n' +
      '# Viết code của bạn ở đây (yêu cầu O(N log N), tránh O(N^2))\n',
    solutionCode:
      'n = int(input())\n' +
      'a = list(map(int, input().split()))\n' +
      'buf = [0] * n\n' +
      'width = 1\n' +
      'total = 0\n' +
      'while width < n:\n' +
      '    lo = 0\n' +
      '    while lo < n:\n' +
      '        mid = min(lo + width, n)\n' +
      '        hi = min(lo + 2 * width, n)\n' +
      '        i, j, k = lo, mid, lo\n' +
      '        while i < mid and j < hi:\n' +
      '            if a[i] <= a[j]:\n' +
      '                buf[k] = a[i]; i += 1\n' +
      '            else:\n' +
      '                buf[k] = a[j]; j += 1\n' +
      '                total += mid - i\n' +
      '            k += 1\n' +
      '        while i < mid:\n' +
      '            buf[k] = a[i]; i += 1; k += 1\n' +
      '        while j < hi:\n' +
      '            buf[k] = a[j]; j += 1; k += 1\n' +
      '        lo += 2 * width\n' +
      '    a, buf = buf, a\n' +
      '    width *= 2\n' +
      'print(total)',
    timeLimitMs: 3000,
    testCases: [
      { input: '5\n2 4 1 3 5', expectedOutput: '3', isHidden: false },
      { input: '4\n4 3 2 1', expectedOutput: '6', isHidden: false },
      { input: '3\n1 2 3', expectedOutput: '0', isHidden: true },
      { input: '1\n7', expectedOutput: '0', isHidden: true },
      {
        input: '100000\n' + Array.from({ length: 100000 }, (_, i) => 100000 - i).join(' '),
        expectedOutput: '4999950000',
        isHidden: true,
      },
    ],
    hints: {
      hint1: 'Đếm nghịch thế bằng cách so sánh mọi cặp (i, j) là O(N^2), không kịp với N = 100000. Ý tưởng cải tiến: nghịch thế có thể đếm được ngay trong quá trình "trộn" (merge) của thuật toán sắp xếp trộn (merge sort). Lưu ý: import module "sys" (kể cả để tăng giới hạn đệ quy) không được phép trong hệ thống chấm bài — nên cài đặt merge sort theo kiểu KHÔNG đệ quy (dùng vòng lặp, "trộn" các đoạn có độ dài tăng dần: 1, 2, 4, 8, ...) thay vì tự gọi lại hàm.',
      hint2:
        'Bước 1: bắt đầu với "độ rộng đoạn" (width) bằng 1 — coi mỗi phần tử là 1 đoạn đã "sắp xếp xong" (đoạn 1 phần tử luôn tự sắp xếp đúng).\n\n' +
        'Bước 2: mỗi vòng lặp lớn, trộn từng cặp đoạn liền kề có độ dài "width" lại thành 1 đoạn dài gấp đôi — trong lúc trộn, nếu phần tử bên trái LỚN HƠN phần tử bên phải đang xét, thì phần tử đó cùng với TẤT CẢ các phần tử còn lại của đoạn trái đều tạo thành nghịch thế với phần tử bên phải — cộng thêm số phần tử còn lại đó vào tổng nghịch thế.\n\n' +
        'Bước 3: sau khi trộn hết 1 vòng, nhân đôi "width" (1 -> 2 -> 4 -> ...) và lặp lại, cho tới khi width >= độ dài mảng — lúc đó cả mảng đã thành 1 đoạn duy nhất, đã sắp xếp xong.',
      hint3:
        'n = int(input())\n' +
        'a = list(map(int, input().split()))\n' +
        'buf = [0] * n\n' +
        'width = 1\n' +
        'total = 0\n' +
        'while width < n:\n' +
        '    lo = 0\n' +
        '    while lo < n:\n' +
        '        mid = min(lo + width, n)\n' +
        '        hi = min(lo + 2 * width, n)\n' +
        '        i, j, k = lo, mid, lo\n' +
        '        # TODO: trộn 2 đoạn a[lo:mid] và a[mid:hi] (cả 2 đã sắp xếp) vào buf,\n' +
        '        # dùng 2 con trỏ i (chạy trong đoạn trái) và j (chạy trong đoạn phải).\n' +
        '        # Nếu a[i] > a[j]: đây là nghịch thế — cộng (mid - i) vào total,\n' +
        '        # vì TOÀN BỘ phần còn lại của đoạn trái cũng đều > a[j].\n' +
        '        # Đừng quên copy nốt phần còn thừa của bên nào chưa duyệt hết.\n' +
        '        pass\n' +
        '        lo += 2 * width\n' +
        '    a, buf = buf, a\n' +
        '    width *= 2\n' +
        'print(total)',
    },
  },
  {
    title: 'Giá trị xuất hiện nhiều nhất trong dãy lớn',
    slug: 'day15-gia-tri-xuat-hien-nhieu-nhat',
    gradeBand: '9-12',
    topic: 'algorithm-contest-prep',
    orderInTopic: 3,
    description:
      'Cho dãy N số nguyên (N <= 500000, giá trị trong khoảng [0, 10^6]). In ra số lần xuất hiện nhiều nhất của một giá trị bất kỳ trong dãy (không cần biết giá trị đó là gì, chỉ cần số lần xuất hiện lớn nhất). ' +
      'Ràng buộc N rất lớn buộc thuật toán O(N) (dùng mảng đếm tần suất hoặc hashmap) — cách kiểm tra từng phần tử bằng cách duyệt lại toàn mảng (O(N^2)) sẽ vượt thời gian.',
    type: 'CODE_TEXT',
    difficulty: 'EASY',
    points: 10,
    tags: ['complexity', 'counting', 'hashmap', 'lop10-12'],
    prerequisiteSlug: 'day15-dem-nghich-the',
    starterCode:
      'from collections import Counter\n\n' +
      'n = int(input())\n' +
      'a = list(map(int, input().split()))\n' +
      '# Viết code của bạn ở đây (yêu cầu O(N), tránh O(N^2))\n',
    solutionCode:
      'from collections import Counter\n\n' +
      'n = int(input())\n' +
      'a = list(map(int, input().split()))\n' +
      'cnt = Counter(a)\n' +
      'print(max(cnt.values()) if cnt else 0)',
    timeLimitMs: 2000,
    testCases: [
      { input: '5\n1 2 2 3 2', expectedOutput: '3', isHidden: false },
      { input: '4\n1 2 3 4', expectedOutput: '1', isHidden: false },
      { input: '1\n0', expectedOutput: '1', isHidden: true },
      {
        input: '500000\n' + Array.from({ length: 500000 }, (_, i) => i % 3).join(' '),
        expectedOutput: '166667',
        isHidden: true,
      },
    ],
    hints: {
      hint1: 'Với mỗi phần tử, đếm số lần xuất hiện của nó bằng cách duyệt lại toàn bộ mảng là O(N^2) — với N nửa triệu, sẽ chậm rất nhiều. Cần đếm tần suất chỉ bằng 1 lượt duyệt.',
      hint2:
        'Bước 1: dùng Counter (hoặc dict) để đếm tần suất từng giá trị, chỉ cần duyệt mảng đúng 1 lần.\n\n' +
        'Bước 2: lấy giá trị lớn nhất trong các tần suất đã đếm được (dùng max() trên .values()).',
      hint3:
        'from collections import Counter\n\n' +
        'n = int(input())\n' +
        'a = list(map(int, input().split()))\n' +
        '# TODO: dùng Counter để đếm tần suất từng giá trị trong a (chỉ 1 dòng)\n' +
        'cnt = None\n\n' +
        '# TODO: in ra tần suất LỚN NHẤT trong số các giá trị đã đếm được\n' +
        '# (gợi ý: cnt có phương thức .values() để lấy toàn bộ số lần xuất hiện)\n',
    },
  },

  // ===================== NHÓM 2: SORTING =====================
  {
    title: 'Gộp các khoảng thời gian chồng lấn',
    slug: 'day15-gop-khoang-thoi-gian',
    gradeBand: '9-12',
    topic: 'algorithm-contest-prep',
    orderInTopic: 4,
    description:
      'Cho N khoảng thời gian [s, e] (N <= 100000, s <= e). Hai khoảng được coi là chồng lấn nếu chúng có điểm chung (kể cả chạm nhau ở đầu mút, ví dụ [1,4] và [4,5] được gộp thành [1,5]). ' +
      'Gộp tất cả các khoảng chồng lấn lại, in ra các khoảng kết quả theo thứ tự tăng dần của điểm bắt đầu, mỗi khoảng trên 1 dòng theo định dạng "s e".',
    type: 'CODE_TEXT',
    difficulty: 'MEDIUM',
    points: 15,
    tags: ['sorting', 'intervals', 'lop10-12'],
    prerequisiteSlug: 'day15-gia-tri-xuat-hien-nhieu-nhat',
    starterCode:
      'n = int(input())\n' +
      'intervals = [tuple(map(int, input().split())) for _ in range(n)]\n' +
      '# Viết code của bạn ở đây (yêu cầu O(N log N))\n',
    solutionCode:
      'n = int(input())\n' +
      'intervals = [list(map(int, input().split())) for _ in range(n)]\n' +
      'intervals.sort()\n' +
      'result = []\n' +
      'for s, e in intervals:\n' +
      '    if result and s <= result[-1][1]:\n' +
      '        result[-1][1] = max(result[-1][1], e)\n' +
      '    else:\n' +
      '        result.append([s, e])\n' +
      'for s, e in result:\n' +
      '    print(s, e)',
    timeLimitMs: 2000,
    testCases: [
      {
        input: '4\n1 3\n2 6\n8 10\n15 18',
        expectedOutput: '1 6\n8 10\n15 18',
        isHidden: false,
      },
      { input: '2\n1 4\n4 5', expectedOutput: '1 5', isHidden: false },
      { input: '1\n5 10', expectedOutput: '5 10', isHidden: true },
      {
        input: '3\n1 4\n0 4\n3 5',
        expectedOutput: '0 5',
        isHidden: true,
      },
      {
        // N chỉ 3000 (không phải mức trần constraint 100000 của đề) vì hệ thống chấm bài
        // giới hạn stdout tối đa 64KB (MAX_OUTPUT_BYTES trong code-runner.helper.ts) —
        // in đủ 100000 dòng sẽ tạo ra ~1.29MB output, vượt giới hạn và bị cắt cụt, khiến
        // bài ĐÚNG thuật toán vẫn bị chấm sai (WA) do lỗi hạ tầng, không phải lỗi logic.
        // N=3000 vẫn đủ lớn để không thể vét cạn thủ công, và output ~29KB an toàn dưới
        // giới hạn 64KB.
        input:
          '3000\n' +
          Array.from({ length: 3000 }, (_, i) => `${i * 2} ${i * 2 + 1}`).join('\n'),
        expectedOutput: Array.from({ length: 3000 }, (_, i) => `${i * 2} ${i * 2 + 1}`).join('\n'),
        isHidden: true,
      },
    ],
    hints: {
      hint1: 'Nếu không sắp xếp trước, phải so sánh mỗi khoảng với mọi khoảng khác để tìm chồng lấn — dẫn tới O(N^2). Sắp xếp theo điểm bắt đầu trước sẽ giúp các khoảng có thể chồng lấn luôn đứng CẠNH NHAU, chỉ cần so 1 lượt.',
      hint2:
        'Bước 1: sắp xếp các khoảng theo điểm bắt đầu tăng dần.\n\n' +
        'Bước 2: duyệt qua từng khoảng theo thứ tự đã sắp — nếu khoảng hiện tại có điểm bắt đầu <= điểm kết thúc của khoảng CUỐI CÙNG đã gộp trong kết quả, thì gộp 2 khoảng lại (lấy max điểm kết thúc); nếu không, thêm khoảng hiện tại như 1 khoảng mới trong kết quả.',
      hint3:
        'n = int(input())\n' +
        'intervals = [list(map(int, input().split())) for _ in range(n)]\n' +
        'intervals.sort()\n' +
        'result = []\n' +
        'for s, e in intervals:\n' +
        '    # TODO: nếu result đang có khoảng, VÀ s <= điểm kết thúc của khoảng\n' +
        '    # CUỐI CÙNG trong result -> gộp lại (cập nhật điểm kết thúc bằng max)\n' +
        '    # Ngược lại -> thêm (s, e) như 1 khoảng MỚI vào result\n' +
        '    pass\n' +
        'for s, e in result:\n' +
        '    print(s, e)',
    },
  },
  {
    title: 'K giá trị lớn nhất trong dòng dữ liệu',
    slug: 'day15-k-gia-tri-lon-nhat',
    gradeBand: '9-12',
    topic: 'algorithm-contest-prep',
    orderInTopic: 5,
    description:
      'Cho N số nguyên (N <= 300000) và số K (1 <= K <= N). In ra K giá trị lớn nhất trong dãy, theo thứ tự TĂNG DẦN, cách nhau bởi dấu cách. ' +
      'Ràng buộc N lớn buộc tránh sắp xếp toàn bộ mảng rồi lấy K phần tử cuối một cách kém hiệu quả về bộ nhớ/thời gian khi K nhỏ hơn nhiều so với N — nên ưu tiên heap kích thước K (O(N log K)).',
    type: 'CODE_TEXT',
    difficulty: 'MEDIUM',
    points: 15,
    tags: ['sorting', 'heap', 'lop10-12'],
    prerequisiteSlug: 'day15-gop-khoang-thoi-gian',
    starterCode:
      'import heapq\n\n' +
      'n, k = map(int, input().split())\n' +
      'a = list(map(int, input().split()))\n' +
      '# Viết code của bạn ở đây\n',
    solutionCode:
      'import heapq\n\n' +
      'n, k = map(int, input().split())\n' +
      'a = list(map(int, input().split()))\n' +
      'top_k = heapq.nlargest(k, a)\n' +
      'top_k.sort()\n' +
      "print(' '.join(map(str, top_k)))",
    timeLimitMs: 2000,
    testCases: [
      { input: '6 3\n5 1 9 3 7 2', expectedOutput: '5 7 9', isHidden: false },
      { input: '4 1\n4 4 4 4', expectedOutput: '4', isHidden: false },
      { input: '3 3\n1 2 3', expectedOutput: '1 2 3', isHidden: true },
      { input: '5 2\n-1 -5 -3 0 2', expectedOutput: '0 2', isHidden: true },
      {
        input: '300000 5\n' + Array.from({ length: 300000 }, (_, i) => i).join(' '),
        expectedOutput: '299995 299996 299997 299998 299999',
        isHidden: true,
      },
    ],
    hints: {
      hint1: 'Sắp xếp toàn bộ N phần tử rồi lấy K phần tử cuối vẫn ĐÚNG và đủ nhanh cho bài này, nhưng cách tối ưu hơn khi K << N là dùng heap chỉ giữ K phần tử lớn nhất, tránh sắp toàn bộ mảng.',
      hint2:
        'Bước 1: dùng heapq.nlargest(k, a) để lấy K phần tử lớn nhất — hàm này nội bộ dùng min-heap kích thước K, chạy O(N log K), hiệu quả hơn sort toàn mảng O(N log N) khi K nhỏ.\n\n' +
        'Bước 2: sắp xếp lại K phần tử đó theo thứ tự TĂNG DẦN (heapq.nlargest trả về theo thứ tự giảm dần) trước khi in.',
      hint3:
        'import heapq\n\n' +
        'n, k = map(int, input().split())\n' +
        'a = list(map(int, input().split()))\n' +
        '# TODO: lấy k phần tử LỚN NHẤT của a (dùng heapq.nlargest, không cần sort cả mảng)\n' +
        'top_k = None\n\n' +
        '# TODO: sắp xếp lại top_k theo thứ tự TĂNG DẦN trước khi in\n' +
        '# (heapq.nlargest trả về theo thứ tự GIẢM DẦN, phải tự sort lại)\n' +
        "print(' '.join(map(str, top_k)))",
    },
  },
  {
    title: 'Ghép số lớn nhất từ danh sách số',
    slug: 'day15-ghep-so-lon-nhat',
    gradeBand: '9-12',
    topic: 'algorithm-contest-prep',
    orderInTopic: 6,
    description:
      'Cho N số nguyên không âm (1 <= N <= 100000, mỗi số biểu diễn dưới dạng chuỗi khi ghép). Sắp xếp lại thứ tự các số và ghép (nối chuỗi) chúng lại để tạo thành số lớn nhất có thể. In ra kết quả dưới dạng chuỗi (loại bỏ số 0 ở đầu nếu kết quả toàn số 0, in ra "0").',
    type: 'CODE_TEXT',
    difficulty: 'HARD',
    points: 20,
    tags: ['sorting', 'custom-comparator', 'greedy', 'lop10-12'],
    prerequisiteSlug: 'day15-k-gia-tri-lon-nhat',
    starterCode:
      'from functools import cmp_to_key\n\n' +
      'n = int(input())\n' +
      'a = input().split()\n' +
      '# Viết code của bạn ở đây\n',
    solutionCode:
      'from functools import cmp_to_key\n\n' +
      'n = int(input())\n' +
      'a = input().split()\n' +
      'a.sort(key=cmp_to_key(lambda x, y: -1 if x + y > y + x else (1 if x + y < y + x else 0)))\n' +
      'result = "".join(a)\n' +
      'print("0" if result[0] == "0" else result)',
    timeLimitMs: 2000,
    testCases: [
      { input: '5\n3 30 34 5 9', expectedOutput: '9534330', isHidden: false },
      { input: '2\n10 2', expectedOutput: '210', isHidden: false },
      { input: '2\n0 0', expectedOutput: '0', isHidden: true },
      { input: '1\n0', expectedOutput: '0', isHidden: true },
      { input: '3\n1 1 1', expectedOutput: '111', isHidden: true },
    ],
    hints: {
      hint1: 'So sánh 2 số theo giá trị số học thông thường (ví dụ 9 > 30 nên 9 đứng trước) KHÔNG cho kết quả đúng — ví dụ "30" đứng trước "3" theo giá trị số nhưng "330" < "303"... thực ra cần so sánh 2 cách GHÉP CHUỖI khác nhau giữa 2 số để biết cách ghép nào tạo số lớn hơn.',
      hint2:
        'Bước 1: coi mỗi số là 1 chuỗi.\n\n' +
        'Bước 2: để so sánh 2 chuỗi số a và b, ghép thử "a nối b" và "b nối a", so sánh 2 chuỗi ghép đó — chuỗi ghép nào lớn hơn (so sánh từ điển) thì thứ tự đó (a trước b, hoặc b trước a) tốt hơn.\n\n' +
        'Bước 3: dùng hàm so sánh tùy chỉnh (cmp_to_key) để sắp toàn bộ danh sách theo quy tắc này, rồi nối tất cả lại.\n\n' +
        'Bước 4: xử lý trường hợp đặc biệt: nếu số đầu tiên sau khi ghép là "0" (nghĩa là mọi số đều là 0), in ra "0" thay vì nhiều số 0 liền nhau.',
      hint3:
        'from functools import cmp_to_key\n\n' +
        'n = int(input())\n' +
        'a = input().split()\n\n' +
        'def so_sanh(x, y):\n' +
        '    # TODO: so sánh 2 cách ghép "x nối y" và "y nối x" (dạng chuỗi).\n' +
        '    # Trả về -1 nếu x nên đứng TRƯỚC y, 1 nếu y nên đứng trước x, 0 nếu bằng nhau.\n' +
        '    pass\n\n' +
        'a.sort(key=cmp_to_key(so_sanh))\n' +
        'result = "".join(a)\n' +
        '# TODO: xử lý trường hợp đặc biệt khi mọi số đều là 0\n' +
        '# (result sẽ có dạng "000...0" — phải in ra đúng "0")\n' +
        'print(result)',
    },
  },

  // ===================== NHÓM 3: BINARY SEARCH =====================
  {
    title: 'Tìm kiếm trong mảng đã xoay',
    slug: 'day15-tim-kiem-mang-da-xoay',
    gradeBand: '9-12',
    topic: 'algorithm-contest-prep',
    orderInTopic: 7,
    description:
      'Cho mảng N số nguyên phân biệt (N <= 200000), ban đầu đã sắp xếp tăng dần rồi bị "xoay" tại một điểm chưa biết (ví dụ [1,2,3,4,5] xoay thành [4,5,1,2,3]). Cho số target, tìm chỉ số (0-based) của target trong mảng, in -1 nếu không tồn tại. ' +
      'Ràng buộc N lớn buộc dùng binary search O(log N) — duyệt tuyến tính O(N) sẽ không đạt điểm tối ưu dù vẫn có thể pass nếu giới hạn thời gian rộng, nhưng đề yêu cầu cài đặt đúng kỹ thuật binary search trên mảng xoay.',
    type: 'CODE_TEXT',
    difficulty: 'MEDIUM',
    points: 15,
    tags: ['binary-search', 'rotated-array', 'lop10-12'],
    prerequisiteSlug: 'day15-ghep-so-lon-nhat',
    starterCode:
      'n = int(input())\n' +
      'a = list(map(int, input().split()))\n' +
      'target = int(input())\n' +
      '# Viết code của bạn ở đây (yêu cầu O(log N))\n',
    solutionCode:
      'n = int(input())\n' +
      'a = list(map(int, input().split()))\n' +
      'target = int(input())\n' +
      'lo, hi = 0, n - 1\n' +
      'ans = -1\n' +
      'while lo <= hi:\n' +
      '    mid = (lo + hi) // 2\n' +
      '    if a[mid] == target:\n' +
      '        ans = mid\n' +
      '        break\n' +
      '    if a[lo] <= a[mid]:\n' +
      '        if a[lo] <= target < a[mid]:\n' +
      '            hi = mid - 1\n' +
      '        else:\n' +
      '            lo = mid + 1\n' +
      '    else:\n' +
      '        if a[mid] < target <= a[hi]:\n' +
      '            lo = mid + 1\n' +
      '        else:\n' +
      '            hi = mid - 1\n' +
      'print(ans)',
    timeLimitMs: 1000,
    testCases: [
      { input: '7\n4 5 6 7 0 1 2\n0', expectedOutput: '4', isHidden: false },
      { input: '7\n4 5 6 7 0 1 2\n3', expectedOutput: '-1', isHidden: false },
      { input: '1\n1\n1', expectedOutput: '0', isHidden: true },
      { input: '1\n1\n0', expectedOutput: '-1', isHidden: true },
      { input: '3\n5 1 3\n5', expectedOutput: '0', isHidden: true },
    ],
    hints: {
      hint1: 'Mảng đã xoay có 1 tính chất quan trọng: mọi lúc, ÍT NHẤT 1 trong 2 nửa [lo, mid] hoặc [mid, hi] vẫn còn sắp xếp tăng dần bình thường (không bị xoay). Nhận diện được nửa nào "sạch" (còn sắp xếp) là chìa khóa để quyết định thu hẹp về phía nào.',
      hint2:
        'Bước 1: tính mid như binary search thường.\n\n' +
        'Bước 2: kiểm tra a[lo] <= a[mid] — nếu đúng, nửa TRÁI [lo, mid] đang sắp xếp bình thường: nếu target nằm trong khoảng [a[lo], a[mid]), thu hẹp về nửa trái (hi = mid-1), ngược lại thu hẹp về nửa phải (lo = mid+1).\n\n' +
        'Bước 3: nếu nửa trái không sắp xếp bình thường, thì nửa PHẢI [mid, hi] chắc chắn sắp xếp bình thường — áp dụng logic tương tự nhưng theo chiều ngược lại.',
      hint3:
        'n = int(input())\n' +
        'a = list(map(int, input().split()))\n' +
        'target = int(input())\n' +
        'lo, hi = 0, n - 1\n' +
        'ans = -1\n' +
        'while lo <= hi:\n' +
        '    mid = (lo + hi) // 2\n' +
        '    if a[mid] == target:\n' +
        '        ans = mid\n' +
        '        break\n' +
        '    if a[lo] <= a[mid]:\n' +
        '        # TODO: nửa TRÁI [lo, mid] đang sắp xếp bình thường.\n' +
        '        # Nếu target nằm trong [a[lo], a[mid]) -> thu hẹp về nửa trái (hi = mid - 1)\n' +
        '        # Ngược lại -> thu hẹp về nửa phải (lo = mid + 1)\n' +
        '        pass\n' +
        '    else:\n' +
        '        # TODO: nửa PHẢI [mid, hi] đang sắp xếp bình thường.\n' +
        '        # Nếu target nằm trong (a[mid], a[hi]] -> thu hẹp về nửa phải (lo = mid + 1)\n' +
        '        # Ngược lại -> thu hẹp về nửa trái (hi = mid - 1)\n' +
        '        pass\n' +
        'print(ans)',
    },
  },
  {
    title: 'Chia sách thành K phần, tối thiểu hóa phần lớn nhất',
    slug: 'day15-chia-sach-toi-thieu-hoa',
    gradeBand: '9-12',
    topic: 'algorithm-contest-prep',
    orderInTopic: 8,
    description:
      'Có N cuốn sách xếp theo thứ tự cố định, cuốn thứ i có số trang a[i] (N <= 100000, 1 <= a[i] <= 10^9). Cần chia N cuốn sách (theo đúng thứ tự, không đảo vị trí) cho K người, mỗi người nhận một đoạn liên tiếp các cuốn sách liền nhau (có thể một người nhận 0 cuốn không được phép — mỗi người phải nhận ít nhất... thực ra bài toán chuẩn cho phép một số người nhận 0 cuốn nếu K > N, nhưng ở đây giả định K <= N). ' +
      'Tìm cách chia sao cho số trang NHIỀU NHẤT mà một người phải đọc là NHỎ NHẤT có thể. In ra giá trị nhỏ nhất đó. ' +
      'Ràng buộc N lớn buộc dùng "binary search trên đáp án" O(N log(sum(a))) — thử mọi cách chia bằng quy hoạch động đầy đủ hoặc duyệt toàn bộ cách chia sẽ không kịp.',
    type: 'CODE_TEXT',
    difficulty: 'HARD',
    points: 20,
    tags: ['binary-search', 'binary-search-on-answer', 'greedy-check', 'lop10-12'],
    prerequisiteSlug: 'day15-tim-kiem-mang-da-xoay',
    starterCode:
      'n, k = map(int, input().split())\n' +
      'a = list(map(int, input().split()))\n' +
      '# Viết code của bạn ở đây (yêu cầu binary search trên đáp án)\n',
    solutionCode:
      'def can_split(a, k, cap):\n' +
      '    parts = 1\n' +
      '    cur = 0\n' +
      '    for x in a:\n' +
      '        if x > cap:\n' +
      '            return False\n' +
      '        if cur + x > cap:\n' +
      '            parts += 1\n' +
      '            cur = x\n' +
      '        else:\n' +
      '            cur += x\n' +
      '    return parts <= k\n\n' +
      'n, k = map(int, input().split())\n' +
      'a = list(map(int, input().split()))\n' +
      'lo, hi = max(a), sum(a)\n' +
      'while lo < hi:\n' +
      '    mid = (lo + hi) // 2\n' +
      '    if can_split(a, k, mid):\n' +
      '        hi = mid\n' +
      '    else:\n' +
      '        lo = mid + 1\n' +
      'print(lo)',
    timeLimitMs: 2000,
    testCases: [
      { input: '5 3\n7 2 5 10 8', expectedOutput: '14', isHidden: false },
      { input: '4 2\n1 2 3 4', expectedOutput: '6', isHidden: false },
      { input: '3 3\n5 5 5', expectedOutput: '5', isHidden: true },
      { input: '1 1\n1000000000', expectedOutput: '1000000000', isHidden: true },
      {
        input: '100000 100\n' + Array.from({ length: 100000 }, () => 1000000000).join(' '),
        expectedOutput: '1000000000000',
        isHidden: true,
      },
    ],
    hints: {
      hint1: 'Không thể thử tất cả cách chia (quá nhiều tổ hợp). Nhưng có thể "đoán" giá trị đáp án (số trang lớn nhất 1 người phải đọc) rồi KIỂM TRA xem với giá trị đó, có chia được cho <= K người không — đây là kỹ thuật "binary search trên đáp án".',
      hint2:
        'Bước 1: khoảng tìm kiếm đáp án nằm từ max(a) (ít nhất phải đủ chứa cuốn sách dày nhất) đến sum(a) (trường hợp xấu nhất, 1 người đọc hết).\n\n' +
        'Bước 2: viết hàm kiểm tra can_split(cap) — với một "trần" cap cho trước, duyệt qua sách theo thứ tự, gom nhóm liên tiếp sao cho tổng mỗi nhóm không vượt cap, đếm xem cần bao nhiêu người (nhóm); nếu số người cần <= K, cap này khả thi.\n\n' +
        'Bước 3: dùng binary search để tìm cap NHỎ NHẤT mà can_split(cap) vẫn đúng — đó chính là đáp án.',
      hint3:
        'def can_split(a, k, cap):\n' +
        '    parts = 1\n' +
        '    cur = 0\n' +
        '    for x in a:\n' +
        '        # TODO: nếu x > cap, không thể chia được với trần này -> return False ngay\n' +
        '        # TODO: nếu cur + x > cap, phải bắt đầu người mới (parts += 1, cur = x)\n' +
        '        # Ngược lại, dồn thêm x vào người hiện tại (cur += x)\n' +
        '        pass\n' +
        '    return parts <= k\n\n' +
        'n, k = map(int, input().split())\n' +
        'a = list(map(int, input().split()))\n' +
        'lo, hi = max(a), sum(a)\n' +
        'while lo < hi:\n' +
        '    mid = (lo + hi) // 2\n' +
        '    # TODO: nếu can_split(a, k, mid) khả thi, có thể còn giảm cap -> hi = mid\n' +
        '    # Ngược lại phải tăng cap -> lo = mid + 1\n' +
        '    pass\n' +
        'print(lo)',
    },
  },
  {
    title: 'Đếm số lượng phần tử trong khoảng giá trị',
    slug: 'day15-dem-phan-tu-trong-khoang',
    gradeBand: '9-12',
    topic: 'algorithm-contest-prep',
    orderInTopic: 9,
    description:
      'Cho dãy N số nguyên ĐÃ SẮP XẾP TĂNG DẦN (N <= 200000, có thể có phần tử trùng lặp) và Q truy vấn (Q <= 100000), mỗi truy vấn gồm 2 số L, R. Với mỗi truy vấn, đếm số lượng phần tử trong dãy có giá trị nằm trong đoạn [L, R] (bao gồm cả L và R). In kết quả mỗi truy vấn trên 1 dòng. ' +
      'Ràng buộc N và Q đều lớn buộc mỗi truy vấn phải xử lý O(log N) bằng lower_bound/upper_bound — duyệt tuyến tính từng truy vấn O(N) sẽ dẫn tới tổng O(N*Q) quá chậm.',
    type: 'CODE_TEXT',
    difficulty: 'MEDIUM',
    points: 15,
    tags: ['binary-search', 'lower-bound', 'upper-bound', 'lop10-12'],
    prerequisiteSlug: 'day15-chia-sach-toi-thieu-hoa',
    starterCode:
      'import bisect\n\n' +
      'n = int(input())\n' +
      'a = list(map(int, input().split()))\n' +
      'q = int(input())\n' +
      '# Viết code của bạn ở đây (yêu cầu O(log N) mỗi truy vấn)\n',
    solutionCode:
      'import bisect\n\n' +
      'n = int(input())\n' +
      'a = list(map(int, input().split()))\n' +
      'q = int(input())\n' +
      'out = []\n' +
      'for _ in range(q):\n' +
      '    l, r = map(int, input().split())\n' +
      '    left = bisect.bisect_left(a, l)\n' +
      '    right = bisect.bisect_right(a, r)\n' +
      '    out.append(str(right - left))\n' +
      "print('\\n'.join(out))",
    timeLimitMs: 2000,
    testCases: [
      {
        input: '6\n1 2 2 3 5 8\n2\n2 5\n10 20',
        expectedOutput: '4\n0',
        isHidden: false,
      },
      { input: '3\n1 1 1\n1\n1 1', expectedOutput: '3', isHidden: false },
      { input: '1\n5\n2\n5 5\n6 10', expectedOutput: '1\n0', isHidden: true },
      {
        input:
          '200000\n' +
          Array.from({ length: 200000 }, (_, i) => i).join(' ') +
          '\n1\n0 199999',
        expectedOutput: '200000',
        isHidden: true,
      },
    ],
    hints: {
      hint1: 'Vì dãy đã sắp xếp sẵn, không cần duyệt toàn bộ để đếm phần tử trong đoạn [L, R] — có thể tìm vị trí "biên trái" (phần tử đầu tiên >= L) và "biên phải" (phần tử đầu tiên > R) bằng binary search, rồi lấy hiệu 2 vị trí đó.',
      hint2:
        'Bước 1: dùng bisect.bisect_left(a, L) để tìm vị trí đầu tiên mà phần tử >= L (đây là lower_bound).\n\n' +
        'Bước 2: dùng bisect.bisect_right(a, R) để tìm vị trí đầu tiên mà phần tử > R (đây là upper_bound).\n\n' +
        'Bước 3: số lượng phần tử trong [L, R] = bisect_right(R) - bisect_left(L).\n\n' +
        'Bước 4: lặp lại cho từng truy vấn, mỗi truy vấn chỉ tốn O(log N).',
      hint3:
        'import bisect\n\n' +
        'n = int(input())\n' +
        'a = list(map(int, input().split()))\n' +
        'q = int(input())\n' +
        'out = []\n' +
        'for _ in range(q):\n' +
        '    l, r = map(int, input().split())\n' +
        '    # TODO: tìm vị trí đầu tiên mà phần tử >= l (lower bound)\n' +
        '    left = None\n' +
        '    # TODO: tìm vị trí đầu tiên mà phần tử > r (upper bound)\n' +
        '    right = None\n' +
        '    out.append(str(right - left))\n' +
        "print('\\n'.join(out))",
    },
  },

  // ===================== NHÓM 4: GREEDY =====================
  {
    title: 'Chọn tối đa hoạt động không giao nhau',
    slug: 'day15-chon-hoat-dong-khong-giao-nhau',
    gradeBand: '9-12',
    topic: 'algorithm-contest-prep',
    orderInTopic: 10,
    description:
      'Cho N hoạt động (N <= 100000), hoạt động thứ i diễn ra trong khoảng [s[i], e[i]) (bắt đầu s, kết thúc e, s < e). Hai hoạt động được coi là "giao nhau" nếu chúng có thời gian chung (kể cả chạm mốc, ví dụ [1,3) và [3,5) KHÔNG giao nhau vì 3 chỉ là điểm kết thúc/bắt đầu, không phải khoảng chung). ' +
      'Chọn số lượng TỐI ĐA các hoạt động sao cho không có 2 hoạt động nào giao nhau. In ra số lượng hoạt động tối đa chọn được.',
    type: 'CODE_TEXT',
    difficulty: 'MEDIUM',
    points: 15,
    tags: ['greedy', 'interval-scheduling', 'lop10-12'],
    prerequisiteSlug: 'day15-dem-phan-tu-trong-khoang',
    starterCode:
      'n = int(input())\n' +
      'activities = [tuple(map(int, input().split())) for _ in range(n)]\n' +
      '# Viết code của bạn ở đây\n',
    solutionCode:
      'n = int(input())\n' +
      'activities = [tuple(map(int, input().split())) for _ in range(n)]\n' +
      'activities.sort(key=lambda x: x[1])\n' +
      'count = 0\n' +
      'last_end = float("-inf")\n' +
      'for s, e in activities:\n' +
      '    if s >= last_end:\n' +
      '        count += 1\n' +
      '        last_end = e\n' +
      'print(count)',
    timeLimitMs: 2000,
    testCases: [
      {
        input: '4\n1 3\n2 5\n4 7\n6 9',
        expectedOutput: '2',
        isHidden: false,
      },
      { input: '3\n1 2\n2 3\n3 4', expectedOutput: '3', isHidden: false },
      { input: '1\n5 10', expectedOutput: '1', isHidden: true },
      {
        input: '5\n1 10\n2 3\n3 4\n4 5\n5 6',
        expectedOutput: '4',
        isHidden: true,
      },
      {
        input: '100000\n' + Array.from({ length: 100000 }, (_, i) => `${i} ${i + 1}`).join('\n'),
        expectedOutput: '100000',
        isHidden: true,
      },
    ],
    hints: {
      hint1: 'Đây là bài toán "chọn lịch tối đa" kinh điển. Trực giác sai thường gặp: chọn hoạt động có thời lượng NGẮN NHẤT trước — cách này SAI vì có thể bỏ lỡ cơ hội chọn được nhiều hoạt động hơn về sau. Ý tưởng đúng: luôn ưu tiên hoạt động kết thúc SỚM NHẤT.',
      hint2:
        'Bước 1: sắp xếp các hoạt động theo thời điểm KẾT THÚC tăng dần (không phải theo thời điểm bắt đầu).\n\n' +
        'Bước 2: duyệt qua các hoạt động theo thứ tự đã sắp, luôn chọn hoạt động nếu thời điểm bắt đầu của nó >= thời điểm kết thúc của hoạt động ĐÃ CHỌN gần nhất — cập nhật lại "kết thúc gần nhất" mỗi khi chọn thêm.',
      hint3:
        'n = int(input())\n' +
        'activities = [tuple(map(int, input().split())) for _ in range(n)]\n' +
        '# TODO: sắp xếp activities theo thời điểm KẾT THÚC tăng dần (không phải bắt đầu)\n' +
        'count = 0\n' +
        'last_end = float("-inf")\n' +
        'for s, e in activities:\n' +
        '    # TODO: nếu s >= last_end (không giao với hoạt động đã chọn gần nhất)\n' +
        '    # -> chọn hoạt động này (count += 1, cập nhật last_end = e)\n' +
        '    pass\n' +
        'print(count)',
    },
  },
  {
    title: 'Số bước nhảy ít nhất để tới đích',
    slug: 'day15-so-buoc-nhay-it-nhat',
    gradeBand: '9-12',
    topic: 'algorithm-contest-prep',
    orderInTopic: 11,
    description:
      'Cho mảng N số nguyên không âm (N <= 100000), a[i] là bước nhảy XA NHẤT có thể thực hiện từ vị trí i. Bắt đầu tại vị trí 0, đích là vị trí N-1. Đề bảo đảm luôn tới được đích. Tìm số bước nhảy ÍT NHẤT để tới được vị trí N-1.',
    type: 'CODE_TEXT',
    difficulty: 'HARD',
    points: 20,
    tags: ['greedy', 'jump-game', 'lop10-12'],
    prerequisiteSlug: 'day15-chon-hoat-dong-khong-giao-nhau',
    starterCode:
      'n = int(input())\n' +
      'a = list(map(int, input().split()))\n' +
      '# Viết code của bạn ở đây\n',
    solutionCode:
      'n = int(input())\n' +
      'a = list(map(int, input().split()))\n' +
      'if n <= 1:\n' +
      '    print(0)\n' +
      'else:\n' +
      '    jumps = 0\n' +
      '    cur_end = 0\n' +
      '    farthest = 0\n' +
      '    for i in range(n - 1):\n' +
      '        farthest = max(farthest, i + a[i])\n' +
      '        if i == cur_end:\n' +
      '            jumps += 1\n' +
      '            cur_end = farthest\n' +
      '            if cur_end >= n - 1:\n' +
      '                break\n' +
      '    print(jumps)',
    timeLimitMs: 2000,
    testCases: [
      { input: '5\n2 3 1 1 4', expectedOutput: '2', isHidden: false },
      { input: '1\n0', expectedOutput: '0', isHidden: false },
      { input: '2\n1 0', expectedOutput: '1', isHidden: true },
      { input: '4\n1 1 1 1', expectedOutput: '3', isHidden: true },
      {
        input: '100000\n' + Array.from({ length: 100000 }, () => 1).join(' '),
        expectedOutput: '99999',
        isHidden: true,
      },
    ],
    hints: {
      hint1: 'Đây là bài toán BFS trên đồ thị ẩn (mỗi vị trí là 1 đỉnh, có cạnh tới mọi vị trí trong tầm nhảy), nhưng có thể giải bằng greedy nhanh hơn nhiều mà không cần dựng đồ thị tường minh: nghĩ theo "từng lượt nhảy", mỗi lượt đi được XA NHẤT có thể trong phạm vi hiện tại.',
      hint2:
        'Bước 1: duy trì 2 biến — cur_end (vị trí xa nhất có thể đạt được với SỐ LƯỢT NHẢY hiện tại) và farthest (vị trí xa nhất có thể đạt được nếu dùng thêm 1 lượt nhảy nữa từ bất kỳ vị trí nào đã duyệt qua).\n\n' +
        'Bước 2: duyệt từng vị trí i từ 0 đến N-2, cập nhật farthest = max(farthest, i + a[i]).\n\n' +
        'Bước 3: khi i chạm đúng cur_end (nghĩa là đã "dùng hết" phạm vi của lượt nhảy hiện tại), bắt buộc phải nhảy thêm 1 lượt — tăng jumps lên 1 và cập nhật cur_end = farthest.',
      hint3:
        'n = int(input())\n' +
        'a = list(map(int, input().split()))\n' +
        'if n <= 1:\n' +
        '    print(0)\n' +
        'else:\n' +
        '    jumps = 0\n' +
        '    cur_end = 0\n' +
        '    farthest = 0\n' +
        '    for i in range(n - 1):\n' +
        '        # TODO: cập nhật farthest = xa nhất có thể đạt nếu nhảy từ vị trí i\n' +
        '        # TODO: nếu i == cur_end (đã dùng hết phạm vi lượt nhảy hiện tại):\n' +
        '        # bắt buộc nhảy thêm 1 lượt -> jumps += 1, cur_end = farthest\n' +
        '        pass\n' +
        '    print(jumps)',
    },
  },
  {
    title: 'Đổi tiền tối thiểu và cái bẫy của greedy',
    slug: 'day15-doi-tien-toi-thieu',
    gradeBand: '9-12',
    topic: 'algorithm-contest-prep',
    orderInTopic: 12,
    description:
      'Cho danh sách M loại mệnh giá tiền (M <= 20, các mệnh giá phân biệt, mỗi mệnh giá có số lượng KHÔNG GIỚI HẠN) và số tiền cần đổi S (0 <= S <= 10^7). Tìm số lượng tờ tiền ÍT NHẤT để đổi đủ đúng số tiền S (dùng quy hoạch động, KHÔNG dùng greedy đơn thuần — vì hệ mệnh giá đầu vào CÓ THỂ không phải hệ "chuẩn tắc" khiến greedy cho kết quả sai). Nếu không có cách đổi đủ đúng S, in ra -1.',
    type: 'CODE_TEXT',
    difficulty: 'HARD',
    points: 20,
    tags: ['dp', 'greedy-trap', 'coin-change', 'lop10-12'],
    prerequisiteSlug: 'day15-so-buoc-nhay-it-nhat',
    starterCode:
      'm, s = map(int, input().split())\n' +
      'coins = list(map(int, input().split()))\n' +
      '# Viết code của bạn ở đây (dùng DP, KHÔNG dùng greedy vì hệ mệnh giá có thể không chuẩn tắc)\n',
    solutionCode:
      'm, s = map(int, input().split())\n' +
      'coins = list(map(int, input().split()))\n' +
      'INF = float("inf")\n' +
      'dp = [0] + [INF] * s\n' +
      'for i in range(1, s + 1):\n' +
      '    for c in coins:\n' +
      '        if c <= i and dp[i - c] + 1 < dp[i]:\n' +
      '            dp[i] = dp[i - c] + 1\n' +
      'print(dp[s] if dp[s] != INF else -1)',
    timeLimitMs: 2000,
    testCases: [
      { input: '3 6\n1 3 4', expectedOutput: '2', isHidden: false },
      { input: '3 11\n1 2 5', expectedOutput: '3', isHidden: false },
      { input: '2 3\n2 4', expectedOutput: '-1', isHidden: true },
      { input: '1 0\n5', expectedOutput: '0', isHidden: true },
      { input: '6 999999\n1 2 5 10 20 50', expectedOutput: '20004', isHidden: true },
    ],
    hints: {
      hint1: 'Đây là bài "bẫy kinh điển": với hệ mệnh giá VNĐ/USD thông thường (1, 2, 5, 10, 20, 50...), thuật toán tham lam (luôn lấy tờ mệnh giá lớn nhất có thể trước) cho kết quả ĐÚNG — nhưng đề bài này dùng hệ mệnh giá BẤT KỲ, ví dụ [1, 3, 4] với S=6: greedy chọn 4 trước (còn 2), rồi 2 tờ 1đ → tổng 3 tờ; nhưng cách tối ưu thật là 3+3 → chỉ 2 tờ. Vì vậy đề bài yêu cầu BẮT BUỘC dùng quy hoạch động, không được giả định hệ mệnh giá "đẹp".',
      hint2:
        'Bước 1: định nghĩa dp[i] = số tờ tiền ít nhất để đổi đúng số tiền i, dp[0] = 0, các dp[i] khác khởi tạo vô cực (chưa tính được).\n\n' +
        'Bước 2: với mỗi số tiền i từ 1 đến S, thử lần lượt từng mệnh giá c trong danh sách — nếu c <= i, có thể cập nhật dp[i] = min(dp[i], dp[i-c] + 1) (dùng 1 tờ mệnh giá c, cộng với cách tối ưu đổi số tiền còn lại i-c).\n\n' +
        'Bước 3: đáp án là dp[S], nếu vẫn là vô cực nghĩa là không thể đổi đủ đúng S, in -1.',
      hint3:
        'm, s = map(int, input().split())\n' +
        'coins = list(map(int, input().split()))\n' +
        'INF = float("inf")\n' +
        'dp = [0] + [INF] * s\n' +
        'for i in range(1, s + 1):\n' +
        '    for c in coins:\n' +
        '        # TODO: nếu c <= i, thử dùng 1 tờ mệnh giá c và cập nhật dp[i]\n' +
        '        # bằng min(dp[i], dp[i - c] + 1) nếu cách này tốt hơn\n' +
        '        pass\n' +
        'print(dp[s] if dp[s] != INF else -1)',
    },
  },

  // ===================== NHÓM 5: GRAPH / DP CƠ BẢN =====================
  {
    title: 'Đường đi ngắn nhất trên lưới ô vuông',
    slug: 'day15-duong-di-ngan-nhat-luoi',
    gradeBand: '9-12',
    topic: 'algorithm-contest-prep',
    orderInTopic: 13,
    description:
      'Cho lưới ô vuông kích thước R hàng x C cột (R, C <= 500), mỗi ô là 0 (đi được) hoặc 1 (vật cản). Bắt đầu từ ô (0, 0), cần tới ô (R-1, C-1), mỗi bước chỉ được di chuyển sang ô liền kề theo 4 hướng (trên/dưới/trái/phải), không đi vào ô vật cản, không ra ngoài lưới. ' +
      'Tìm số bước di chuyển ÍT NHẤT để tới đích. Nếu không thể tới được, in ra -1. (Đề đảm bảo ô (0,0) và ô (R-1, C-1) luôn là 0.)',
    type: 'CODE_TEXT',
    difficulty: 'MEDIUM',
    points: 15,
    tags: ['graph', 'bfs', 'shortest-path', 'lop10-12'],
    prerequisiteSlug: 'day15-doi-tien-toi-thieu',
    starterCode:
      'from collections import deque\n\n' +
      'r, c = map(int, input().split())\n' +
      'grid = [list(map(int, input().split())) for _ in range(r)]\n' +
      '# Viết code của bạn ở đây (yêu cầu BFS, O(R*C))\n',
    solutionCode:
      'from collections import deque\n\n' +
      'r, c = map(int, input().split())\n' +
      'grid = [list(map(int, input().split())) for _ in range(r)]\n' +
      'dist = [[-1] * c for _ in range(r)]\n' +
      'dist[0][0] = 0\n' +
      'q = deque([(0, 0)])\n' +
      'while q:\n' +
      '    x, y = q.popleft()\n' +
      '    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):\n' +
      '        nx, ny = x + dx, y + dy\n' +
      '        if 0 <= nx < r and 0 <= ny < c and grid[nx][ny] == 0 and dist[nx][ny] == -1:\n' +
      '            dist[nx][ny] = dist[x][y] + 1\n' +
      '            q.append((nx, ny))\n' +
      'print(dist[r - 1][c - 1])',
    timeLimitMs: 2000,
    testCases: [
      {
        input: '4 4\n0 0 1 0\n0 1 0 0\n0 0 0 1\n1 0 0 0',
        expectedOutput: '6',
        isHidden: false,
      },
      { input: '2 2\n0 1\n1 0', expectedOutput: '-1', isHidden: false },
      { input: '1 1\n0', expectedOutput: '0', isHidden: true },
      {
        input: '3 3\n0 0 0\n0 0 0\n0 0 0',
        expectedOutput: '4',
        isHidden: true,
      },
      {
        input:
          '500 500\n' +
          Array.from({ length: 500 }, () => Array.from({ length: 500 }, () => 0).join(' ')).join('\n'),
        expectedOutput: '998',
        isHidden: true,
      },
    ],
    hints: {
      hint1: 'Tìm đường đi NGẮN NHẤT (ít bước nhất) trên lưới không trọng số — đây là ứng dụng kinh điển của BFS (duyệt theo chiều rộng), KHÔNG phải DFS. DFS có thể tìm ra MỘT đường đi nhưng không đảm bảo đó là đường ngắn nhất.',
      hint2:
        'Bước 1: dùng 1 mảng dist[R][C] để lưu khoảng cách ngắn nhất từ (0,0) tới từng ô, khởi tạo -1 (chưa thăm), riêng dist[0][0] = 0.\n\n' +
        'Bước 2: dùng hàng đợi (deque), bắt đầu với (0,0).\n\n' +
        'Bước 3: mỗi lần lấy 1 ô ra khỏi hàng đợi, xét 4 ô liền kề — nếu ô đó hợp lệ (trong lưới, không phải vật cản, chưa thăm), gán dist = dist[ô hiện tại] + 1, rồi đẩy vào hàng đợi.\n\n' +
        'Bước 4: kết quả là dist[R-1][C-1] (giữ nguyên -1 nếu không tới được).',
      hint3:
        'from collections import deque\n\n' +
        'r, c = map(int, input().split())\n' +
        'grid = [list(map(int, input().split())) for _ in range(r)]\n' +
        'dist = [[-1] * c for _ in range(r)]\n' +
        'dist[0][0] = 0\n' +
        'q = deque([(0, 0)])\n' +
        'while q:\n' +
        '    x, y = q.popleft()\n' +
        '    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):\n' +
        '        nx, ny = x + dx, y + dy\n' +
        '        # TODO: nếu (nx, ny) hợp lệ (trong lưới, không phải vật cản,\n' +
        '        # chưa thăm) -> gán dist[nx][ny] = dist[x][y] + 1, đẩy vào hàng đợi\n' +
        '        pass\n' +
        'print(dist[r - 1][c - 1])',
    },
  },
  {
    title: 'Đếm số vùng liên thông trong đồ thị',
    slug: 'day15-dem-thanh-phan-lien-thong',
    gradeBand: '9-12',
    topic: 'algorithm-contest-prep',
    orderInTopic: 14,
    description:
      'Cho đồ thị vô hướng gồm N đỉnh (đánh số 0 đến N-1, N <= 200000) và M cạnh (M <= 200000). Đếm số lượng THÀNH PHẦN LIÊN THÔNG của đồ thị (một thành phần liên thông là tập đỉnh mà giữa 2 đỉnh bất kỳ trong tập luôn có đường đi qua các cạnh của đồ thị, đỉnh cô lập cũng tính là 1 thành phần liên thông riêng).',
    type: 'CODE_TEXT',
    difficulty: 'MEDIUM',
    points: 15,
    tags: ['graph', 'dfs', 'union-find', 'lop10-12'],
    prerequisiteSlug: 'day15-duong-di-ngan-nhat-luoi',
    starterCode:
      'n, m = map(int, input().split())\n' +
      'edges = [tuple(map(int, input().split())) for _ in range(m)]\n' +
      '# Viết code của bạn ở đây (yêu cầu O((N+M) log N) hoặc O(N+M))\n',
    solutionCode:
      'n, m = map(int, input().split())\n' +
      'edges = [tuple(map(int, input().split())) for _ in range(m)]\n' +
      'parent = list(range(n))\n\n' +
      'def find(x):\n' +
      '    while parent[x] != x:\n' +
      '        parent[x] = parent[parent[x]]\n' +
      '        x = parent[x]\n' +
      '    return x\n\n' +
      'def union(a, b):\n' +
      '    ra, rb = find(a), find(b)\n' +
      '    if ra != rb:\n' +
      '        parent[ra] = rb\n\n' +
      'for a, b in edges:\n' +
      '    union(a, b)\n\n' +
      'roots = set(find(i) for i in range(n))\n' +
      'print(len(roots))',
    timeLimitMs: 2000,
    testCases: [
      { input: '5 2\n0 1\n2 3', expectedOutput: '3', isHidden: false },
      { input: '4 0', expectedOutput: '4', isHidden: false },
      { input: '1 0', expectedOutput: '1', isHidden: true },
      { input: '6 5\n0 1\n1 2\n2 3\n3 4\n4 5', expectedOutput: '1', isHidden: true },
      {
        input:
          '200000 199999\n' +
          Array.from({ length: 199999 }, (_, i) => `${i} ${i + 1}`).join('\n'),
        expectedOutput: '1',
        isHidden: true,
      },
    ],
    hints: {
      hint1: 'Có 2 cách chuẩn để giải: DFS/BFS từ từng đỉnh chưa thăm (mỗi lần duyệt hết 1 thành phần liên thông), hoặc Union-Find (nối các đỉnh có cạnh vào cùng 1 nhóm, đếm số nhóm khác nhau ở cuối). Với N, M lớn tới 200000, cả 2 cách đều cần cài đặt đúng để tránh vượt thời gian (DFS đệ quy thuần có thể tràn ngăn xếp với đồ thị dạng chuỗi dài).',
      hint2:
        'Cách Union-Find:\n\n' +
        'Bước 1: khởi tạo mỗi đỉnh là cha của chính nó (parent[i] = i).\n\n' +
        'Bước 2: với mỗi cạnh (a, b), gộp 2 nhóm chứa a và b lại làm một (hàm union).\n\n' +
        'Bước 3: dùng "nén đường" (path compression) trong hàm find để tránh cây bị lệch quá sâu, giữ độ phức tạp gần O(1) mỗi thao tác.\n\n' +
        'Bước 4: đếm số nhóm gốc (root) khác nhau trong toàn bộ N đỉnh — đó chính là số thành phần liên thông.',
      hint3:
        'n, m = map(int, input().split())\n' +
        'edges = [tuple(map(int, input().split())) for _ in range(m)]\n' +
        'parent = list(range(n))\n\n' +
        'def find(x):\n' +
        '    # TODO: đi ngược theo parent cho tới khi gặp gốc (parent[đỉnh] == chính nó)\n' +
        '    # Nhớ áp dụng "nén đường" (parent[x] = parent[parent[x]]) trong lúc đi\n' +
        '    # để các lần tìm sau nhanh hơn\n' +
        '    pass\n\n' +
        'def union(a, b):\n' +
        '    # TODO: tìm gốc của a và b, nếu khác nhau thì gộp 2 cụm lại làm một\n' +
        '    pass\n\n' +
        'for a, b in edges:\n' +
        '    union(a, b)\n\n' +
        'roots = set(find(i) for i in range(n))\n' +
        'print(len(roots))',
    },
  },
  {
    title: 'Dãy con tăng dài nhất',
    slug: 'day15-day-con-tang-dai-nhat',
    gradeBand: '9-12',
    topic: 'algorithm-contest-prep',
    orderInTopic: 15,
    description:
      'Cho dãy N số nguyên (N <= 100000). Tìm độ dài của dãy con tăng dần dài nhất (Longest Increasing Subsequence — các phần tử không cần liền kề trong dãy gốc, nhưng phải giữ đúng thứ tự xuất hiện, và giá trị sau phải LỚN HƠN giá trị trước, tăng nghiêm ngặt). In ra độ dài đó. ' +
      'Ràng buộc N lớn buộc dùng thuật toán O(N log N) (patience sorting với tìm kiếm nhị phân) — quy hoạch động cơ bản O(N^2) sẽ vượt thời gian cho phép.',
    type: 'CODE_TEXT',
    difficulty: 'HARD',
    points: 20,
    tags: ['dp', 'binary-search', 'lis', 'lop10-12'],
    prerequisiteSlug: 'day15-dem-thanh-phan-lien-thong',
    starterCode:
      'import bisect\n\n' +
      'n = int(input())\n' +
      'a = list(map(int, input().split()))\n' +
      '# Viết code của bạn ở đây (yêu cầu O(N log N), tránh DP O(N^2))\n',
    solutionCode:
      'import bisect\n\n' +
      'n = int(input())\n' +
      'a = list(map(int, input().split()))\n' +
      'tails = []\n' +
      'for x in a:\n' +
      '    i = bisect.bisect_left(tails, x)\n' +
      '    if i == len(tails):\n' +
      '        tails.append(x)\n' +
      '    else:\n' +
      '        tails[i] = x\n' +
      'print(len(tails))',
    timeLimitMs: 2000,
    testCases: [
      { input: '8\n10 9 2 5 3 7 101 18', expectedOutput: '4', isHidden: false },
      { input: '1\n5', expectedOutput: '1', isHidden: false },
      { input: '4\n5 4 3 2', expectedOutput: '1', isHidden: true },
      { input: '4\n1 2 3 4', expectedOutput: '4', isHidden: true },
      {
        input: '100000\n' + Array.from({ length: 100000 }, (_, i) => i).join(' '),
        expectedOutput: '100000',
        isHidden: true,
      },
    ],
    hints: {
      hint1: 'DP cơ bản (dp[i] = độ dài LIS kết thúc tại i, xét mọi j < i để cập nhật) đúng nhưng là O(N^2), không kịp với N = 100000. Cần một cấu trúc dữ liệu giúp tìm nhanh vị trí cần cập nhật thay vì duyệt lại toàn bộ.',
      hint2:
        'Bước 1: duy trì mảng "tails" — tails[k] là giá trị NHỎ NHẤT có thể làm phần tử cuối của 1 dãy con tăng có độ dài k+1, tính đến thời điểm hiện tại (mảng tails LUÔN được giữ ở trạng thái sắp xếp tăng dần).\n\n' +
        'Bước 2: với mỗi phần tử x trong dãy gốc, tìm vị trí đầu tiên trong tails mà giá trị >= x (dùng bisect_left, vì yêu cầu tăng NGHIÊM NGẶT).\n\n' +
        'Bước 3: nếu vị trí đó nằm ngoài cuối mảng tails, nghĩa là x nối dài được dãy tăng — thêm x vào cuối tails. Nếu không, thay thế phần tử tại vị trí đó bằng x (giúp giữ "tiềm năng mở rộng" tốt hơn cho các phần tử sau).\n\n' +
        'Bước 4: độ dài LIS chính là độ dài cuối cùng của mảng tails.',
      hint3:
        'import bisect\n\n' +
        'n = int(input())\n' +
        'a = list(map(int, input().split()))\n' +
        'tails = []\n' +
        'for x in a:\n' +
        '    # TODO: tìm vị trí đầu tiên trong tails mà giá trị >= x (dùng bisect_left)\n' +
        '    # Nếu vị trí đó nằm ngoài cuối tails -> thêm x vào cuối tails\n' +
        '    # Ngược lại -> thay thế phần tử tại vị trí đó bằng x\n' +
        '    pass\n' +
        'print(len(tails))',
    },
  },
];
