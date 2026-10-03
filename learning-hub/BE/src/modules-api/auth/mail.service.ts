import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

/**
 * Gửi email thật qua Gmail SMTP (Nodemailer + App Password — KHÔNG phải mật
 * khẩu Gmail thường, tạo tại myaccount.google.com/apppasswords, yêu cầu bật
 * 2FA trước). Hiện chỉ dùng cho email quên mật khẩu.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly fromAddress: string;

  constructor(private readonly configService: ConfigService) {
    const user = this.configService.get<string>('GMAIL_USER');
    const pass = this.configService.get<string>('GMAIL_APP_PASSWORD');
    this.fromAddress = user || 'no-reply@cybersoft-hub.local';

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
  }

  async sendPasswordResetEmail(
    toEmail: string,
    resetLink: string,
  ): Promise<void> {
    const html = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Đặt lại mật khẩu CyberSoft Hub</h2>
        <p>Bạn (hoặc ai đó) vừa yêu cầu đặt lại mật khẩu cho tài khoản này.</p>
        <p>Bấm vào nút bên dưới để đặt mật khẩu mới. Liên kết có hiệu lực trong 15 phút.</p>
        <p style="text-align: center; margin: 24px 0;">
          <a href="${resetLink}" style="background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
            Đặt lại mật khẩu
          </a>
        </p>
        <p style="color:#666;font-size:12px;">Nếu bạn không yêu cầu việc này, hãy bỏ qua email này — mật khẩu hiện tại vẫn an toàn.</p>
      </div>
    `;

    await this.transporter.sendMail({
      from: `"CyberSoft Hub" <${this.fromAddress}>`,
      to: toEmail,
      subject: 'Đặt lại mật khẩu CyberSoft Hub',
      html,
    });

    this.logger.log(`Đã gửi email đặt lại mật khẩu tới ${toEmail}`);
  }
}
