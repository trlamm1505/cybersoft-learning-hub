import { describe, expect, it } from 'vitest';
import {
  describeAddResult,
  groupByType,
  MAX_IMPORT_BYTES,
  parseIdentifiers,
  sameSet,
  summarizeImport,
  toggleSlug,
  typeLabel,
  validateImportFile,
} from './classManagementModel';
import type { CatalogExercise } from '../types/teacherAnalytics';

const ex = (slug: string, type: string | null): CatalogExercise => ({ slug, title: slug, type, difficulty: null, tags: [] });

describe('parseIdentifiers', () => {
  it('tách theo dấu phẩy, chấm phẩy, khoảng trắng, xuống dòng', () => {
    expect(parseIdentifiers('a@x.com, b@x.com;C1002\nC1003   d@x.com')).toEqual([
      'a@x.com',
      'b@x.com',
      'C1002',
      'C1003',
      'd@x.com',
    ]);
  });

  it('bỏ trùng không phân biệt hoa thường, giữ dạng viết của lần đầu; chuỗi rỗng cho mảng rỗng', () => {
    expect(parseIdentifiers('A@x.com a@X.com c1001 C1001')).toEqual(['A@x.com', 'c1001']);
    expect(parseIdentifiers('  ,; \n ')).toEqual([]);
    expect(parseIdentifiers('')).toEqual([]);
  });
});

describe('chọn bài giao', () => {
  it('toggleSlug thêm vào cuối hoặc bỏ ra, không đổi mảng gốc', () => {
    const base = ['a', 'b'];
    expect(toggleSlug(base, 'c')).toEqual(['a', 'b', 'c']);
    expect(toggleSlug(base, 'a')).toEqual(['b']);
    expect(base).toEqual(['a', 'b']);
  });

  it('sameSet bỏ qua thứ tự và phát hiện khác biệt', () => {
    expect(sameSet(['a', 'b'], ['b', 'a'])).toBe(true);
    expect(sameSet(['a'], ['a', 'b'])).toBe(false);
    expect(sameSet([], [])).toBe(true);
    expect(sameSet(['a', 'b'], ['a', 'c'])).toBe(false);
  });

  it('groupByType gom theo loại đúng thứ tự, loại lạ hoặc null thành "Khác" ở cuối', () => {
    const groups = groupByType([ex('1', 'AI_LAB'), ex('2', 'SQL_LAB'), ex('3', null), ex('4', 'CODE_TEXT'), ex('5', 'SQL_LAB')]);
    expect(groups.map((g) => [g.label, g.items.map((i) => i.slug)])).toEqual([
      ['Code', ['4']],
      ['SQL', ['2', '5']],
      ['AI Lab', ['1']],
      ['Khác', ['3']],
    ]);
    expect(typeLabel('XYZ')).toBe('Khác');
  });
});

describe('describeAddResult', () => {
  it('tóm tắt đã thêm, đã có, không tìm thấy', () => {
    expect(describeAddResult({ added: [{ id: '1', name: 'A' }], already: ['x'], notFound: ['y@z', 'C9'] })).toBe(
      'Đã thêm 1; 1 đã trong lớp; không tìm thấy: y@z, C9.',
    );
    expect(describeAddResult({ added: [], already: [], notFound: [] })).toBe('Không có thay đổi.');
  });
});


describe('validateImportFile', () => {
  it('nhận .xlsx/.xls/.csv (không phân biệt hoa thường), từ chối đuôi khác, rỗng, quá 2MB, thiếu file', () => {
    expect(validateImportFile({ name: 'ds.xlsx', size: 100 })).toBeNull();
    expect(validateImportFile({ name: 'DS.XLS', size: 100 })).toBeNull();
    expect(validateImportFile({ name: 'ds.csv', size: MAX_IMPORT_BYTES })).toBeNull();
    expect(validateImportFile({ name: 'ds.csv', size: MAX_IMPORT_BYTES + 1 })).toBe('File vượt quá 2MB.');
    expect(validateImportFile({ name: 'ds.pdf', size: 100 })).toMatch(/\.xlsx/);
    expect(validateImportFile({ name: 'ds.csv.exe', size: 100 })).toMatch(/\.xlsx/);
    expect(validateImportFile({ name: 'ds.csv', size: 0 })).toBe('File rỗng.');
    expect(validateImportFile(null)).toBe('Chưa chọn file.');
  });
});

describe('summarizeImport', () => {
  it('chỉ nhắc các nhóm có phần tử', () => {
    expect(
      summarizeImport({ added: [1, 2], already: [1], notFound: [1, 2, 3], invalid: [1], duplicatesInFile: 2, totalRows: 9 }),
    ).toBe('9 dòng, thêm 2, 1 đã trong lớp, 3 không có trong hệ thống, 1 sai cú pháp, 2 trùng trong file.');
    expect(summarizeImport({ added: [], already: [], notFound: [], invalid: [], duplicatesInFile: 0, totalRows: 0 })).toBe(
      '0 dòng, thêm 0.',
    );
  });
});
