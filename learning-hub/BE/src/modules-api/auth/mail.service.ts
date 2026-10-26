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
  private readonly transporter: nodemailer.Transporter | null;
  private readonly fromAddress: string;

  constructor(private readonly configService: ConfigService) {
    const get = (k: string) => this.configService.get<string>(k)?.trim() || undefined;
    const smtpHost = get('SMTP_HOST');
    // Gmail App Password (GMAIL_USER/GMAIL_APP_PASSWORD) hoặc cặp MAIL_USER/MAIL_PASS; SMTP_HOST để dùng máy chủ SMTP riêng.
    const user = get('SMTP_USER') || get('MAIL_USER') || get('GMAIL_USER');
    const pass = get('SMTP_PASS') || get('MAIL_PASS') || get('GMAIL_APP_PASSWORD');
    this.fromAddress = get('MAIL_FROM') || user || 'no-reply@cybersoft-hub.local';

    // Có SMTP_HOST hoặc đủ cặp tài khoản/mật khẩu mới coi là đã cấu hình; ngược lại chạy Development Mock Mode (không gửi thư).
    const timeouts = { connectionTimeout: 5000, greetingTimeout: 5000, socketTimeout: 8000 };
    if (smtpHost) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(get('SMTP_PORT')) || 587,
        secure: get('SMTP_SECURE') === 'true',
        auth: user && pass ? { user, pass } : undefined,
        ...timeouts,
      });
    } else if (user && pass) {
      this.transporter = nodemailer.createTransport({ service: 'gmail', auth: { user, pass }, ...timeouts });
    } else {
      this.transporter = null;
    }
  }

  /** Đã cấu hình gửi thư thật chưa; false = Development Mock Mode. */
  isConfigured(): boolean {
    return this.transporter !== null;
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

    if (!this.transporter) throw new Error('Chưa cấu hình gửi thư (SMTP_HOST hoặc MAIL_USER/MAIL_PASS).');
    await this.transporter.sendMail({
      from: `"CyberSoft Hub" <${this.fromAddress}>`,
      to: toEmail,
      subject: 'Đặt lại mật khẩu CyberSoft Hub',
      html,
    });

    // Không ghi địa chỉ email vào log (PRV-06).
    this.logger.log('Đã gửi một email đặt lại mật khẩu.');
  }
}
