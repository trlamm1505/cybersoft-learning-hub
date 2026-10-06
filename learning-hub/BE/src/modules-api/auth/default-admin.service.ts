import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { INITIAL_USERS } from '../../data/initial-data';
import {
  User,
  UserDocument,
} from '../../modules-system/database/schemas/user.schema';

/** Tài khoản Admin mẫu (cùng nguồn với seed: INITIAL_USERS, admin@gmail.com / 123456). */
const DEFAULT_ADMIN = INITIAL_USERS.find((u) => u.role === 'ADMIN')!;

/**
 * Bảo đảm có sẵn một tài khoản ADMIN mẫu để đăng nhập thử ngay, kể cả khi CSDL đã có dữ liệu và không
 * chạy lại seed. Chỉ TẠO khi chưa có email đó: không bao giờ đổi mật khẩu hay vai trò của tài khoản đã
 * tồn tại. Tắt trên production (mật khẩu mẫu công khai) hoặc bằng SEED_DEFAULT_ADMIN=0.
 */
@Injectable()
export class DefaultAdminService implements OnModuleInit {
  private readonly logger = new Logger(DefaultAdminService.name);

  constructor(
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
    private readonly config: ConfigService,
  ) {}

  isEnabled(): boolean {
    const nodeEnv = this.config.get<string>('NODE_ENV') ?? process.env.NODE_ENV;
    const flag = this.config.get<string>('SEED_DEFAULT_ADMIN');
    if (flag === '0' || flag === 'false') return false;
    if (flag === '1' || flag === 'true') return true;
    return nodeEnv !== 'production';
  }

  async onModuleInit() {
    try {
      await this.ensureAdmin();
    } catch (err) {
      // Không làm hỏng khởi động backend vì tài khoản mẫu.
      this.logger.warn(
        `Không tạo được tài khoản Admin mẫu: ${(err as Error).message}`,
      );
    }
  }

  async ensureAdmin(): Promise<'created' | 'exists' | 'disabled'> {
    if (!this.isEnabled()) return 'disabled';
    const email = DEFAULT_ADMIN.email.toLowerCase();
    const existing = await this.users.exists({ email });
    if (existing) return 'exists';
    await this.users.create({
      email,
      password: await bcrypt.hash(DEFAULT_ADMIN.passwordRaw, 10),
      fullName: DEFAULT_ADMIN.fullName,
      role: 'ADMIN',
      avatar: DEFAULT_ADMIN.avatar,
    });
    this.logger.log(`Đã tạo tài khoản Admin mẫu ${email} (chỉ dùng cho dev).`);
    return 'created';
  }
}
