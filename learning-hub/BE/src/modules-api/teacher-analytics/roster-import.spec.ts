import { BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import {
  MAX_ROSTER_BYTES,
  MAX_ROSTER_ROWS,
  parseCsvRows,
  parseRosterFile,
  sanitizeCell,
} from './roster-import';

const csv = (text: string, name = 'a.csv') => ({
  originalname: name,
  size: Buffer.byteLength(text),
  buffer: Buffer.from(text),
});

describe('parseRosterFile: đọc email', () => {
  it('nhận cột theo tiêu đề (email/e-mail/Email Address, không phân biệt hoa thường) ở vị trí bất kỳ', () => {
    for (const header of [
      'email',
      'E-Mail',
      'EMAIL ADDRESS',
      'Mail',
      'Thư điện tử',
    ]) {
      const r = parseRosterFile(
        csv(`STT,Họ tên,${header}\n1,An,An@X.com\n2,Bình,binh@x.com\n`),
      );
      expect(r.emails).toEqual(['an@x.com', 'binh@x.com']);
    }
  });

  it('không có tiêu đề: chọn cột có nhiều email nhất và giữ cả dòng đầu', () => {
    const r = parseRosterFile(
      csv('An,a@x.com,10A\nBình,b@x.com,10B\nChi,c@x.com,10C\n'),
    );
    expect(r.emails).toEqual(['a@x.com', 'b@x.com', 'c@x.com']);
    expect(r.rowCount).toBe(3);
  });

  it('tự nhận dấu phân cách ; và tab, bỏ BOM, hỗ trợ CRLF và ô có nháy kép', () => {
    expect(
      parseRosterFile(csv('﻿email;ten\r\na@x.com;"An; Bình"\r\n')).emails,
    ).toEqual(['a@x.com']);
    expect(parseRosterFile(csv('ten\temail\nAn\ta@x.com\n')).emails).toEqual([
      'a@x.com',
    ]);
    expect(parseCsvRows('a,"b,""c"""\n1,2')).toEqual([
      ['a', 'b,"c"'],
      ['1', '2'],
    ]);
  });

  it('chuẩn hóa chữ thường, bỏ khoảng trắng, bỏ dòng trống, bỏ trùng và đếm số trùng', () => {
    const r = parseRosterFile(
      csv('email\n  A@X.com  \n\n a@x.com\nb@x.com\n,\n'),
    );
    expect(r.emails).toEqual(['a@x.com', 'b@x.com']);
    expect(r.duplicatesInFile).toBe(1);
    expect(r.rowCount).toBe(3);
  });

  it('email sai cú pháp được báo riêng, cắt ngắn để hiển thị, và không lọt vào danh sách thêm', () => {
    const r = parseRosterFile(
      csv(
        `email\nkhong-co-a-cong\na@b\n@x.com\na b@x.com\n<img src=x>@x.com\n${'x'.repeat(300)}@x.com\nok@x.com\n`,
      ),
    );
    expect(r.emails).toEqual(['ok@x.com']);
    expect(r.invalid).toHaveLength(6);
    expect(r.invalid.every((v) => v.length <= 80)).toBe(true);
  });

  it('ký tự điều khiển trong ô bị loại; sanitizeCell xử lý null, số và ngày', () => {
    expect(sanitizeCell('a@x.com\u0000\u0007')).toBe('a@x.com');
    expect(sanitizeCell(null)).toBe('');
    expect(sanitizeCell(undefined)).toBe('');
    expect(sanitizeCell(12)).toBe('12');
    expect(sanitizeCell('  a\nb  ')).toBe('a b');
  });

  it('Excel: chỉ đọc sheet đầu, công thức không được tính, ô số không làm vỡ', () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([
        ['email', 'ghi chú'],
        ['a@x.com', 123],
        ['b@x.com', '=1+1'],
      ]),
      'Dau',
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([['email'], ['khac@x.com']]),
      'Sau',
    );
    const buffer = XLSX.write(wb, {
      type: 'buffer',
      bookType: 'xlsx',
    }) as Buffer;
    const r = parseRosterFile({
      originalname: 'a.xlsx',
      size: buffer.length,
      buffer,
    });
    expect(r.emails).toEqual(['a@x.com', 'b@x.com']);
  });

  it('phần mở rộng viết hoa vẫn nhận', () => {
    expect(parseRosterFile(csv('email\na@x.com', 'DS.CSV')).emails).toEqual([
      'a@x.com',
    ]);
  });
});

describe('parseRosterFile: từ chối đầu vào xấu', () => {
  const reject = (file: any, message?: RegExp) => {
    let err: unknown;
    try {
      parseRosterFile(file);
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(BadRequestException);
    if (message) expect((err as Error).message).toMatch(message);
  };

  it('thiếu file, sai đuôi, không có đuôi', () => {
    reject(undefined, /Chưa chọn file/);
    reject(csv('email\na@x.com', 'a.pdf'), /\.xlsx, \.xls hoặc \.csv/);
    reject(csv('email\na@x.com', 'danhsach'), /\.xlsx/);
    reject(csv('email\na@x.com', 'a.csv.exe'), /\.xlsx/);
  });

  it('giới hạn đúng 2MB: vượt thì từ chối, bằng thì qua bước kiểm tra kích thước', () => {
    const over = Buffer.alloc(MAX_ROSTER_BYTES + 1, 'a');
    reject({ originalname: 'a.csv', size: over.length, buffer: over }, /2MB/);
    // size khai báo giả nhỏ nhưng buffer thật lớn vẫn bị chặn
    reject({ originalname: 'a.csv', size: 10, buffer: over }, /2MB/);
    const exactly = Buffer.from('email\n' + 'a@x.com\n'.repeat(10));
    expect(() =>
      parseRosterFile({
        originalname: 'a.csv',
        size: exactly.length,
        buffer: exactly,
      }),
    ).not.toThrow();
  });

  it('chữ ký nhị phân phải khớp đuôi', () => {
    reject(
      { originalname: 'a.xlsx', size: 8, buffer: Buffer.from('email\na@b') },
      /không khớp/,
    );
    reject(
      {
        originalname: 'a.xls',
        size: 8,
        buffer: Buffer.from([0x50, 0x4b, 3, 4, 0, 0, 0, 0]),
      },
      /không khớp/,
    );
    reject(
      {
        originalname: 'a.csv',
        size: 8,
        buffer: Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
      },
      /nhị phân/,
    );
  });

  it('giới hạn dòng: 500 qua, 501 bị từ chối (cả CSV lẫn Excel)', () => {
    const rows = (n: number) =>
      Array.from({ length: n }, (_, i) => `u${i}@x.com`);
    expect(
      parseRosterFile(csv('email\n' + rows(MAX_ROSTER_ROWS).join('\n')))
        .rowCount,
    ).toBe(MAX_ROSTER_ROWS);
    reject(csv('email\n' + rows(MAX_ROSTER_ROWS + 1).join('\n')), /500 dòng/);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([
        ['email'],
        ...rows(MAX_ROSTER_ROWS + 50).map((e) => [e]),
      ]),
      'S',
    );
    const buffer = XLSX.write(wb, {
      type: 'buffer',
      bookType: 'xlsx',
    }) as Buffer;
    reject({ originalname: 'a.xlsx', size: buffer.length, buffer }, /500 dòng/);
  });

  it('không có cột email, chỉ có tiêu đề, hoặc toàn dòng rỗng', () => {
    reject(csv('tên,lớp\nAn,10A\n'), /cột email/);
    reject(csv('email\n'), /không có dòng email/);
    reject(csv('email\n\n\n,\n'), /không có dòng email/);
  });
});
