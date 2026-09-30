import {
  BadRequestException,
  Injectable,
  PayloadTooLargeException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';
import { matchesSignature } from './rubric-evaluation.engine';
import type { ArtifactFileType } from '../../modules-system/database/schemas/tester-lab.schema';

export const MAX_ARTIFACT_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME: Record<ArtifactFileType, string[]> = {
  csv: ['text/csv', 'application/vnd.ms-excel', 'text/plain'],
  xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  json: ['application/json'],
  pdf: ['application/pdf'],
};

/** Đuôi thực thi/script không được xuất hiện ở phần giữa tên (shell.php.csv). */
const DANGEROUS_INNER_EXT =
  /\.(php\d?|phtml|exe|dll|com|scr|msi|sh|bat|cmd|ps1|vbs|js|mjs|jar|py|rb|pl|asp|aspx|jsp|html?|svg|xml)(?=\.)/i;

/** Dấu phân tách thư mục, byte NUL hoặc ".." trong tên file gốc. */
const UNSAFE_NAME = /[\\/\u0000]|\.\./;

export interface UploadedArtifact {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface StoredArtifact {
  artifactUrl: string;
  fileType: ArtifactFileType;
  fileSize: number;
}

export const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'tester-labs');

@Injectable()
export class ArtifactUploadService {
  /**
   * Kiểm tra tên file, đuôi, MIME-type, dung lượng và nội dung thật (magic
   * bytes); ném lỗi HTTP nếu không hợp lệ. Tên file gốc không bao giờ được
   * dùng làm đường dẫn ghi đĩa (xem store()).
   */
  validate(file: UploadedArtifact | undefined): ArtifactFileType {
    if (!file) throw new BadRequestException('Thiếu file bài nộp');
    if (
      file.size > MAX_ARTIFACT_BYTES ||
      file.buffer.length > MAX_ARTIFACT_BYTES
    ) {
      throw new PayloadTooLargeException('File vượt quá giới hạn 5MB');
    }
    if (
      UNSAFE_NAME.test(file.originalname) ||
      DANGEROUS_INNER_EXT.test(file.originalname)
    ) {
      throw new BadRequestException('Tên file không hợp lệ');
    }
    const ext = path.extname(file.originalname).slice(1).toLowerCase();
    if (!(ext in ALLOWED_MIME)) {
      throw new BadRequestException('Chỉ chấp nhận .csv, .xlsx, .json, .pdf');
    }
    const fileType = ext as ArtifactFileType;
    if (!ALLOWED_MIME[fileType].includes(file.mimetype)) {
      throw new BadRequestException(
        `MIME-type ${file.mimetype} không khớp với đuôi .${ext}`,
      );
    }
    if (!matchesSignature(fileType, file.buffer)) {
      throw new BadRequestException(
        `Nội dung file không phải định dạng .${ext} thật`,
      );
    }
    return fileType;
  }

  async store(file: UploadedArtifact | undefined): Promise<StoredArtifact> {
    const fileType = this.validate(file);
    const stored = file as UploadedArtifact;
    const fileName = `${randomUUID()}.${fileType}`;
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.writeFile(path.join(UPLOAD_DIR, fileName), stored.buffer);
    return { artifactUrl: fileName, fileType, fileSize: stored.buffer.length };
  }
}
