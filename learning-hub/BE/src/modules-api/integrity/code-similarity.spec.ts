import {
  compareCode,
  findBestMatch,
  normalizeCode,
  stripStarter,
} from './code-similarity';

const SOLUTION = `
def tong(a, b):
    # cộng hai số
    result = a + b
    return result

n = int(input())
m = int(input())
print(tong(n, m))
print("xong")
`;

const SOLUTION_REFORMATTED = `
def tong(a,   b):
    """Cộng hai số."""
    result = a + b   # kết quả
    return result


n = int(input())

m = int(input())
print(tong(n, m))
print('xong')
`;

const DIFFERENT = `
import math
values = [int(x) for x in input().split()]
best = max(values)
worst = min(values)
spread = best - worst
print(math.sqrt(spread) if spread > 0 else 0)
print(sum(values) / len(values))
`;

const STARTER = `
# Bài tập: đọc n số và in tổng
n = int(input())
nums = list(map(int, input().split()))
# TODO: viết code ở dưới
`;

describe('normalizeCode', () => {
  it('bỏ chú thích, docstring, dòng trống và khoảng trắng thừa', () => {
    const out = normalizeCode(SOLUTION_REFORMATTED);
    expect(out).not.toContain('kết quả');
    expect(out).not.toContain('Cộng hai số');
    expect(out).not.toMatch(/\n\n/);
    expect(out).toContain('def tong(a, b):');
  });

  it('không coi # bên trong chuỗi là chú thích', () => {
    expect(normalizeCode('print("a # b")')).toBe('print("S")');
  });
});

describe('compareCode', () => {
  it('cùng thuật toán chỉ khác định dạng/chú thích → điểm 1', () => {
    const r = compareCode(
      normalizeCode(SOLUTION),
      normalizeCode(SOLUTION_REFORMATTED),
    );
    expect(r.comparable).toBe(true);
    expect(r.score).toBe(1);
  });

  it('hai bài khác nhau → điểm thấp', () => {
    const r = compareCode(normalizeCode(SOLUTION), normalizeCode(DIFFERENT));
    expect(r.score).toBeLessThan(0.2);
  });

  it('bài quá ngắn không so khớp (comparable=false, điểm 0)', () => {
    const r = compareCode('print(1)', 'print(1)');
    expect(r).toEqual({ score: 0, comparable: false });
  });
});

describe('stripStarter / findBestMatch — không nhận diện nhầm mã khung', () => {
  it('loại dòng thuộc mã khung khỏi bài làm', () => {
    const stripped = stripStarter(`${STARTER}\nprint(sum(nums))`, STARTER);
    expect(stripped).toBe('print(sum(nums))');
  });

  it('[false-positive] hai bài chỉ giống nhau ở mã khung và phần tự viết ngắn → không so khớp, điểm 0', () => {
    const a = `${STARTER}\nprint(sum(nums))`;
    const b = `${STARTER}\nprint(nums[0] + nums[1])`;
    const m = findBestMatch(
      a,
      STARTER,
      [{ id: 's2', userId: 'u2', code: b }],
      'u1',
    );
    expect(m.score).toBe(0);
    expect(m.submissionId).toBeUndefined();
  });

  it('[false-positive] khung dài giống hệt + phần tự viết khác nhau → điểm thấp nhờ loại khung', () => {
    const longStarter = Array.from(
      { length: 12 },
      (_, i) => `value_${i} = int(input())`,
    ).join('\n');
    const a = `${longStarter}\n${DIFFERENT}`;
    const b = `${longStarter}\n${SOLUTION}`;
    // Không loại khung: điểm bị kéo lên bởi phần khung chung.
    expect(
      compareCode(normalizeCode(a), normalizeCode(b)).score,
    ).toBeGreaterThan(0.3);
    // Có loại khung: chỉ còn phần tự viết, vốn khác nhau.
    const m = findBestMatch(
      a,
      longStarter,
      [{ id: 's2', userId: 'u2', code: b }],
      'u1',
    );
    expect(m.score).toBeLessThan(0.2);
  });

  it('bài chép thật (khác định dạng) vẫn bị phát hiện ngoài mã khung', () => {
    const a = `${STARTER}\n${SOLUTION}`;
    const b = `${STARTER}\n${SOLUTION_REFORMATTED}`;
    const m = findBestMatch(
      a,
      STARTER,
      [{ id: 's2', userId: 'u2', code: b }],
      'u1',
    );
    expect(m.score).toBeGreaterThanOrEqual(0.8);
    expect(m.submissionId).toBe('s2');
    expect(m.userId).toBe('u2');
  });

  it('không bao giờ so khớp với chính bài của mình (nộp lại nhiều lần)', () => {
    const m = findBestMatch(
      SOLUTION,
      '',
      [{ id: 's0', userId: 'u1', code: SOLUTION }],
      'u1',
    );
    expect(m.score).toBe(0);
  });
});
