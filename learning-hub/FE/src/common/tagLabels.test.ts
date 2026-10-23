import { describe, expect, it } from 'vitest';
import { isMetaTag, tagLabel } from './tagLabels';

describe('tagLabel', () => {
  it('đổi mã tag viết tắt sang tên tiếng Việt rõ ràng', () => {
    expect(tagLabel('loop')).toBe('Vòng lặp');
    expect(tagLabel('dp')).toBe('Quy hoạch động');
    expect(tagLabel('hashmap')).toBe('Bảng băm');
    expect(tagLabel('binary-search')).toBe('Tìm kiếm nhị phân');
    expect(tagLabel('LIST')).toBe('Danh sách');
  });
  it('tag lạ được đọc thành chữ dễ nhìn, không hiện mã thô có gạch nối', () => {
    expect(tagLabel('some-new-tag')).toBe('Some new tag');
    expect(tagLabel('')).toBe('');
  });
  it('nhận diện tag khối lớp', () => {
    expect(isMetaTag('lop6-9')).toBe(true);
    expect(isMetaTag('lop10-12')).toBe(true);
    expect(isMetaTag('loop')).toBe(false);
  });
});
