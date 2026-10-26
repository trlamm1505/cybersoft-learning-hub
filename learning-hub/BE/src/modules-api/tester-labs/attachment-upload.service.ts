import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';
import { jwtSecretFrom } from '../../common/auth/jwt-secret';

export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
/** Thư mục riêng tư: không được mount làm static, chỉ phục vụ qua Signed URL. */
export const ATTACHMENT_DIR = path.join(process.cwd(), 'uploads', 'tester-attachments');
export const SIGNED_URL_TTL_MS = 15 * 60 * 1000;

type AttachmentExt = 'png' | 'jpg' | 'webp' | 'txt';

/** Danh sách trắng đuôi + MIME; mọi thứ khác (exe, sh, php, bat, js, py, svg, html...) bị chặn 415. */
const WHITELIST: Record<AttachmentExt, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  webp: 'image/webp',
  txt: 'text/plain',
};
const EXT_ALIAS: Record<string, AttachmentExt> = { png: 'png', jpg: 'jpg', jpeg: 'jpg', webp: 'webp', txt: 'txt' };

/** Đuôi thực thi/script xuất hiện ở phần giữa tên (shell.php.png) cũng bị chặn. */
const DANGEROUS_INNER_EXT =
  /\.(php\d?|phtml|exe|dll|com|scr|msi|sh|bat|cmd|ps1|vbs|js|mjs|jar|py|rb|pl|asp|aspx|jsp|html?|svg|xml)(?=\.)/i;

export interface UploadedAttachment {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

/** Nội dung thật phải khớp loại khai báo (magic bytes), không tin MIME/đuôi client gửi. */
export function attachmentSignatureOk(ext: AttachmentExt, b: Buffer): boolean {
  switch (ext) {
    case 'png':
      return b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    case 'jpg':
      return b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
    case 'webp':
      return b.length > 12 && b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP';
    case 'txt':
      return !b.includes(0);
  }
}

@Injectable()
export class AttachmentUploadService {
  private readonly secret: string;

  constructor(config: ConfigService) {
    this.secret = jwtSecretFrom(config);
  }

  validate(file: UploadedAttachment | undefined): AttachmentExt {
    if (!file) throw new BadRequestException('Thiếu file đính kèm');
    if (file.size > MAX_ATTACHMENT_BYTES || file.buffer.length > MAX_ATTACHMENT_BYTES) {
      throw new PayloadTooLargeException('File vượt quá giới hạn 5MB');
    }
    const unsupported = (msg: string) =>
      new UnsupportedMediaTypeException({ code: 'E415_UNSUPPORTED_MEDIA_TYPE', message: msg });
    const name = file.originalname ?? '';
    // Tên gốc chỉ dùng để suy ra đuôi: phần thư mục (../../) bị bỏ và file luôn được lưu dưới tên UUID, nên không thể ghi ra ngoài thư mục lưu trữ.
    const baseName = path.basename(name.replace(/\\/g, '/').replace(/\u0000/g, ''));
    if (DANGEROUS_INNER_EXT.test(baseName)) throw unsupported('Tên file không hợp lệ');
    const ext = EXT_ALIAS[path.extname(baseName).slice(1).toLowerCase()];
    if (!ext) throw unsupported('Chỉ chấp nhận ảnh PNG, JPEG, WebP hoặc tệp văn bản .txt');
    if (WHITELIST[ext] !== file.mimetype) throw unsupported(`MIME-type ${file.mimetype} không khớp với đuôi .${ext}`);
    if (!attachmentSignatureOk(ext, file.buffer)) throw unsupported(`Nội dung file không phải định dạng .${ext} thật`);
    return ext;
  }

  /** Tên file lưu luôn là UUIDv4 + đuôi hợp lệ; tên gốc của client không bao giờ chạm tới đường dẫn ghi đĩa. */
  async store(file: UploadedAttachment | undefined): Promise<{ attachmentId: string; fileSize: number }> {
    const ext = this.validate(file);
    const attachmentId = `${randomUUID()}.${ext}`;
    await fs.mkdir(ATTACHMENT_DIR, { recursive: true });
    await fs.writeFile(path.join(ATTACHMENT_DIR, attachmentId), (file as UploadedAttachment).buffer);
    return { attachmentId, fileSize: (file as UploadedAttachment).buffer.length };
  }

  private sign(attachmentId: string, exp: number): string {
    return createHmac('sha256', this.secret).update(`${attachmentId}.${exp}`).digest('hex');
  }

  /** Signed URL có hạn 15 phút (đường dẫn tương đối dưới /api). */
  signedUrl(attachmentId: string, now = Date.now()): { url: string; expiresAt: number } {
    const exp = now + SIGNED_URL_TTL_MS;
    const id = path.basename(attachmentId);
    return { url: `/tester-labs/attachments/signed/${encodeURIComponent(id)}?exp=${exp}&sig=${this.sign(id, exp)}`, expiresAt: exp };
  }

  /** Kiểm tra chữ ký + hạn rồi trả đường dẫn file; sai/hết hạn thì 403. */
  resolveSigned(attachmentId: string, exp: string, sig: string, now = Date.now()): string {
    const id = path.basename(attachmentId);
    const expNum = Number(exp);
    const expected = Buffer.from(this.sign(id, expNum));
    const given = Buffer.from(String(sig ?? ''));
    const valid = Number.isFinite(expNum) && expNum > now && given.length === expected.length && timingSafeEqual(given, expected);
    if (!valid) throw new ForbiddenException({ code: 'E403_SIGNED_URL', message: 'Liên kết đã hết hạn hoặc không hợp lệ.' });
    if (!/^[0-9a-f-]{36}\.(png|jpg|webp|txt)$/.test(id)) throw new NotFoundException('Không tìm thấy file.');
    return path.join(ATTACHMENT_DIR, id);
  }
}
