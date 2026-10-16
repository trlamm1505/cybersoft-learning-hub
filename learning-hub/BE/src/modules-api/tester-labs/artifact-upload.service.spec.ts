import { BadRequestException, PayloadTooLargeException } from '@nestjs/common';
import { promises as fs } from 'fs';
import {
  ArtifactUploadService,
  MAX_ARTIFACT_BYTES,
  UploadedArtifact,
} from './artifact-upload.service';

jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn().mockResolvedValue(undefined),
    writeFile: jest.fn().mockResolvedValue(undefined),
  },
}));

const makeFile = (over: Partial<UploadedArtifact> = {}): UploadedArtifact => ({
  originalname: 'Bug_Report_LAB01.csv',
  mimetype: 'text/csv',
  size: 100,
  buffer: Buffer.from('a,b'),
  ...over,
});

describe('ArtifactUploadService', () => {
  let service: ArtifactUploadService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ArtifactUploadService();
  });

  it('lưu file hợp lệ và trả về tên file ngẫu nhiên cùng đuôi', async () => {
    const result = await service.store(makeFile());

    expect(result.fileType).toBe('csv');
    expect(result.fileSize).toBe(3);
    expect(result.artifactUrl).toMatch(/^[0-9a-f-]{36}\.csv$/);
    expect(fs.writeFile).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['report.json', 'application/json', 'json'],
    ['report.pdf', 'application/pdf', 'pdf'],
    [
      'report.xlsx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'xlsx',
    ],
  ])('chấp nhận %s', (originalname, mimetype, expected) => {
    const buffer = Buffer.from(
      expected === 'pdf' ? '%PDF-1.7' : expected === 'xlsx' ? 'PK' : '{}',
    );
    expect(service.validate(makeFile({ originalname, mimetype, buffer }))).toBe(
      expected,
    );
  });

  it.each(['shell.php.csv', 'evil.exe.pdf', 'a.SH.json', 'x.html.csv'])(
    'từ chối double extension %s',
    (originalname) => {
      expect(() => service.validate(makeFile({ originalname }))).toThrow(
        BadRequestException,
      );
    },
  );

  it.each(['../../etc/passwd.csv', 'a/b.csv', 'a\\b.csv', 'a\u0000.csv'])(
    'từ chối tên file có ký tự đường dẫn %j',
    (originalname) => {
      expect(() => service.validate(makeFile({ originalname }))).toThrow(
        BadRequestException,
      );
    },
  );

  it('từ chối file giả đuôi: nội dung không khớp magic bytes', () => {
    const fakePdf = makeFile({
      originalname: 'a.pdf',
      mimetype: 'application/pdf',
      buffer: Buffer.from('MZ not a pdf'),
    });
    const binaryCsv = makeFile({ buffer: Buffer.from([0x4d, 0x5a, 0x00, 0x01]) });

    expect(() => service.validate(fakePdf)).toThrow(BadRequestException);
    expect(() => service.validate(binaryCsv)).toThrow(BadRequestException);
  });

  it('không dùng tên file gốc để ghi đĩa', async () => {
    const result = await service.store(makeFile({ originalname: 'ten goc.csv' }));

    expect(result.artifactUrl).not.toContain('ten goc');
  });

  it('từ chối file sai MIME-type so với đuôi', async () => {
    await expect(
      service.store(makeFile({ mimetype: 'application/pdf' })),
    ).rejects.toThrow(BadRequestException);
    expect(fs.writeFile).not.toHaveBeenCalled();
  });

  it('từ chối đuôi file không nằm trong danh mục', async () => {
    await expect(
      service.store(
        makeFile({ originalname: 'run.exe', mimetype: 'application/x-msdownload' }),
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('từ chối file vượt 5MB', async () => {
    await expect(
      service.store(makeFile({ size: MAX_ARTIFACT_BYTES + 1 })),
    ).rejects.toThrow(PayloadTooLargeException);
    expect(fs.writeFile).not.toHaveBeenCalled();
  });

  it('chấp nhận file đúng 5MB', () => {
    expect(service.validate(makeFile({ size: MAX_ARTIFACT_BYTES }))).toBe('csv');
  });

  it('từ chối khi buffer thực tế vượt 5MB dù size khai báo nhỏ', () => {
    const file = makeFile({ size: 1, buffer: Buffer.alloc(MAX_ARTIFACT_BYTES + 1, 97) });

    expect(() => service.validate(file)).toThrow(PayloadTooLargeException);
  });

  it('từ chối khi không có file', async () => {
    await expect(service.store(undefined)).rejects.toThrow(BadRequestException);
  });
});
