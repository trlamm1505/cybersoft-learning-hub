import { Controller, Get, Param, Post, Query, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { JwtPayload } from '../../common/auth/jwt.strategy';
import { RATE_LIMITS } from '../../common/security/app-throttler.guard';
import { AttachmentUploadService, MAX_ATTACHMENT_BYTES } from './attachment-upload.service';
import type { UploadedAttachment } from './attachment-upload.service';

/**
 * Ảnh/log đính kèm Bug Report. Lưu ở thư mục riêng tư dưới tên UUID; chỉ đọc được qua Signed URL (TTL 15 phút),
 * không có thư mục public nào trỏ vào đây.
 */
@Controller('tester-labs/attachments')
export class AttachmentsController {
  constructor(private readonly attachments: AttachmentUploadService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STUDENT', 'TEACHER', 'ADMIN')
  @Throttle(RATE_LIMITS.labReview)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_ATTACHMENT_BYTES } }))
  async upload(@CurrentUser() _user: JwtPayload, @UploadedFile() file?: UploadedAttachment) {
    const stored = await this.attachments.store(file);
    return { ...stored, ...this.attachments.signedUrl(stored.attachmentId) };
  }

  /** Cấp Signed URL mới cho một file đã có (cần đăng nhập). */
  @Get(':attachmentId/url')
  @UseGuards(JwtAuthGuard)
  url(@Param('attachmentId') attachmentId: string) {
    return this.attachments.signedUrl(attachmentId);
  }

  /** Tải file bằng Signed URL; chữ ký + hạn thay cho đăng nhập. */
  @Get('signed/:attachmentId')
  download(
    @Param('attachmentId') attachmentId: string,
    @Query('exp') exp: string,
    @Query('sig') sig: string,
    @Res() res: Response,
  ) {
    const file = this.attachments.resolveSigned(attachmentId, exp, sig);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Disposition', 'attachment');
    res.sendFile(file);
  }
}
