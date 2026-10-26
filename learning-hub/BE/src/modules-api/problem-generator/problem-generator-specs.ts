import { ProblemSpec } from './problem-generator.types';

// 10 bộ input viết tay (learning outcome, level, constraints, tags), đa dạng
// chủ đề để phủ các nhánh template của StubProblemGeneratorClient — không
// suy ra từ exercise đã seed sẵn, vì mục tiêu ngày 19 là sinh đề MỚI, không
// phải tái tạo lại đề cũ.
export const PROBLEM_SPECS: ProblemSpec[] = [
  {
    id: 'spec-01',
    learningOutcome: 'Vận dụng vòng lặp for để tính tổng có điều kiện',
    level: 'EASY',
    constraints: ['1 <= N <= 10^6', 'Chỉ dùng vòng lặp, không dùng công thức đóng'],
    tags: ['loop', 'sum', 'python-fundamentals'],
  },
  {
    id: 'spec-02',
    learningOutcome: 'Xử lý chuỗi: kiểm tra tính đối xứng (palindrome)',
    level: 'EASY',
    constraints: ['Chuỗi chỉ gồm chữ cái thường không dấu', 'Độ dài tối đa 1000 ký tự'],
    tags: ['string', 'palindrome'],
  },
  {
    id: 'spec-03',
    learningOutcome: 'Thao tác danh sách: tìm phần tử lớn thứ hai',
    level: 'MEDIUM',
    constraints: ['2 <= N <= 10^5', 'Có thể có phần tử trùng giá trị'],
    tags: ['list', 'array'],
  },
  {
    id: 'spec-04',
    learningOutcome: 'Vòng lặp while kết hợp điều kiện dừng sớm',
    level: 'MEDIUM',
    constraints: ['1 <= N <= 10^9', 'Yêu cầu độ phức tạp tốt hơn O(N)'],
    tags: ['loop', 'while'],
  },
  {
    id: 'spec-05',
    learningOutcome: 'So sánh và rẽ nhánh điều kiện cơ bản',
    level: 'EASY',
    constraints: ['-10^9 <= A, B <= 10^9'],
    tags: ['condition', 'basics'],
  },
  {
    id: 'spec-06',
    learningOutcome: 'Xử lý chuỗi: đếm ký tự xuất hiện nhiều nhất',
    level: 'MEDIUM',
    constraints: ['Chuỗi không rỗng, tối đa 5000 ký tự'],
    tags: ['string', 'ky tu'],
  },
  {
    id: 'spec-07',
    learningOutcome: 'Danh sách: sắp xếp và truy vấn theo ngưỡng',
    level: 'HARD',
    constraints: ['1 <= N <= 10^5', 'Không dùng thư viện sort có sẵn cho phần lõi thuật toán'],
    tags: ['list', 'array', 'sort'],
  },
  {
    id: 'spec-08',
    learningOutcome: 'Vòng lặp lồng nhau để tính tổng ma trận điều kiện',
    level: 'HARD',
    constraints: ['1 <= N, M <= 1000'],
    tags: ['loop', 'for', 'tong'],
  },
  {
    id: 'spec-09',
    learningOutcome: 'Kiểm tra chuỗi con và thao tác cắt chuỗi',
    level: 'MEDIUM',
    constraints: ['Độ dài chuỗi tối đa 2000 ký tự'],
    tags: ['string', 'chuoi'],
  },
  {
    id: 'spec-10',
    learningOutcome: 'So sánh số nguyên với ràng buộc biên âm/dương',
    level: 'EASY',
    constraints: ['-100 <= A, B <= 100'],
    tags: ['condition', 'so sanh'],
  },
];
