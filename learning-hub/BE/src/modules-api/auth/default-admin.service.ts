import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { INITIAL_USERS } from '../../data/initial-data';
import { seedPassword } from '../../data/seed-password';
import {
  User,
  UserDocument,
} from '../../modules-system/database/schemas/user.schema';



/**
 * Bảo đảm có sẵn các tài khoản mẫu (ADMIN, TEACHER, STUDENT) để đăng nhập thử ngay khi deploy,
 * kể cả khi CSDL mới hoàn toàn và chưa chạy lại seed. Chỉ TẠO khi chưa có email đó.
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
        `Không tạo được tài khoản mẫu: ${(err as Error).message}`,
      );
    }
  }

  async ensureAdmin(): Promise<'created' | 'exists' | 'disabled'> {
    if (!this.isEnabled()) return 'disabled';
    // Mật khẩu khởi tạo lấy từ biến môi trường, không hard-code (Day 29 SEC-15). Chưa đặt thì không tạo tài khoản mẫu nào.
    const password = seedPassword(this.config.get<string>('DEFAULT_SEED_PASSWORD') ?? process.env.DEFAULT_SEED_PASSWORD);
    if (!password) {
      this.logger.warn('Bỏ qua tạo tài khoản mẫu: chưa đặt DEFAULT_SEED_PASSWORD (≥ 6 ký tự) trong BE/.env.');
      return 'disabled';
    }
    let createdCount = 0;

    for (const userData of INITIAL_USERS) {
      const email = userData.email.toLowerCase();
      const existing = await this.users.exists({ email });
      if (!existing) {
        await this.users.create({
          email,
          password: await bcrypt.hash(password, 10),
          fullName: userData.fullName,
          role: userData.role,
          ...(userData.ageGroup ? { ageGroup: userData.ageGroup } : {}),
          avatar: userData.avatar,
          bio: userData.bio,
        });
        this.logger.log(`Đã tạo tài khoản mẫu ${userData.role}: ${email}`);
        createdCount++;
      }
    }

    return createdCount > 0 ? 'created' : 'exists';
  }
}
