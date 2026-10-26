import { ForbiddenException, PayloadTooLargeException, UnsupportedMediaTypeException } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { ATTACHMENT_DIR, AttachmentUploadService, MAX_ATTACHMENT_BYTES, SIGNED_URL_TTL_MS } from './attachment-upload.service';

const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(16)]);
const file = (over: Partial<{ originalname: string; mimetype: string; buffer: Buffer }> = {}) => {
  const buffer = over.buffer ?? PNG;
  return { originalname: 'bug.png', mimetype: 'image/png', size: buffer.length, buffer, ...over };
};
const service = new AttachmentUploadService({ get: () => 'test-secret-for-signing-0123456789' } as any);

describe('AttachmentUploadService', () => {
  it('nhận PNG hợp lệ', () => expect(service.validate(file())).toBe('png'));

  it('file thực thi/script -> 415', () => {
    for (const name of ['virus.exe', 'shell.php', 'run.sh', 'a.bat', 'x.js', 'x.py', 'x.svg', 'x.html']) {
      expect(() => service.validate(file({ originalname: name, mimetype: 'application/octet-stream' }))).toThrow(UnsupportedMediaTypeException);
    }
  });

  it('đuôi giả: shell.php.png và MIME không khớp -> 415', () => {
    expect(() => service.validate(file({ originalname: 'shell.php.png' }))).toThrow(UnsupportedMediaTypeException);
    expect(() => service.validate(file({ mimetype: 'text/html' }))).toThrow(UnsupportedMediaTypeException);
  });

  it('nội dung không phải ảnh thật (đổi đuôi) -> 415', () => {
    expect(() => service.validate(file({ buffer: Buffer.from('<?php system($_GET[1]); ?>') }))).toThrow(UnsupportedMediaTypeException);
  });

  it('quá 5MB -> 413', () => {
    const big = Buffer.concat([PNG, Buffer.alloc(MAX_ATTACHMENT_BYTES)]);
    expect(() => service.validate(file({ buffer: big }))).toThrow(PayloadTooLargeException);
  });

  it('tên chứa ../ không bao giờ thành đường dẫn: lưu dưới UUID', async () => {
    const stored = await service.store(file({ originalname: 'passwd.png' }));
    expect(stored.attachmentId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.png$/);
    await fs.unlink(path.join(ATTACHMENT_DIR, stored.attachmentId));
    // Tên có ../ không bị dùng làm đường dẫn: vẫn lưu dưới UUID trong thư mục riêng.
    const traversal = await service.store(file({ originalname: '../../etc/passwd.png' }));
    expect(traversal.attachmentId).toMatch(/^[0-9a-f-]{36}\.png$/);
    expect(traversal.attachmentId).not.toMatch(/passwd|\.\./);
    await fs.unlink(path.join(ATTACHMENT_DIR, traversal.attachmentId));
  });
});

describe('Signed URL 15 phút', () => {
  const id = '3f2a9c4e-1111-4222-8333-abcdefabcdef.png';

  it('chữ ký hợp lệ trong hạn thì mở được', () => {
    const now = 1_000_000;
    const { url } = service.signedUrl(id, now);
    const q = new URLSearchParams(url.split('?')[1]);
    expect(service.resolveSigned(id, q.get('exp')!, q.get('sig')!, now + 1000)).toContain(id);
  });

  it('quá 15 phút hoặc sai chữ ký -> 403', () => {
    const now = 1_000_000;
    const { url } = service.signedUrl(id, now);
    const q = new URLSearchParams(url.split('?')[1]);
    expect(() => service.resolveSigned(id, q.get('exp')!, q.get('sig')!, now + SIGNED_URL_TTL_MS + 1)).toThrow(ForbiddenException);
    expect(() => service.resolveSigned(id, q.get('exp')!, 'f'.repeat(64), now + 1000)).toThrow(ForbiddenException);
    expect(() => service.resolveSigned('other.png', q.get('exp')!, q.get('sig')!, now + 1000)).toThrow(ForbiddenException);
  });
});
