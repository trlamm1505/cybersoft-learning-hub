import {
  Injectable,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  User,
  UserDocument,
} from '../../modules-system/database/schemas/user.schema';
import {
  Counter,
  CounterDocument,
} from '../../modules-system/database/schemas/counter.schema';
import {
  PasswordReset,
  PasswordResetDocument,
} from '../../modules-system/database/schemas/password-reset.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { MailService } from './mail.service';

type AgeGroup = '3-5' | '6-9' | '10-12';

const VALID_AGE_GROUPS: AgeGroup[] = ['3-5', '6-9', '10-12'];
const BCRYPT_SALT_ROUNDS = 10;
const RESET_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 phút
const STUDENT_CODE_COUNTER_KEY = 'studentCode';
const STUDENT_CODE_DIGITS = 4; // C0001, C0002, ...

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,

    @InjectModel(Counter.name)
    private readonly counterModel: Model<CounterDocument>,

    @InjectModel(PasswordReset.name)
    private readonly passwordResetModel: Model<PasswordResetDocument>,

    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  /**
   * Đăng ký tài khoản mới. Đăng ký công khai LUÔN tạo role STUDENT — Teacher/
   * Admin không tự chọn role qua form này nữa (client gửi role gì cũng bị bỏ
   * qua), tài khoản Teacher chỉ được cấp quyền bằng tay qua Admin sau này.
   * ageGroup KHÔNG bắt buộc lúc đăng ký — học viên chọn ở modal ngay sau lần
   * đăng nhập đầu tiên (xem setAgeGroup() bên dưới, gọi từ FE khi
   * user.ageGroup còn rỗng). studentCode Cxxxx được cấp ngay từ lúc đăng ký.
   */
  async register(dto: RegisterDto) {
    const { email, password, fullName } = dto;

    if (!email || !password || !fullName) {
      throw new BadRequestException(
        'Vui lòng nhập đầy đủ email, mật khẩu và họ tên.',
      );
    }

    if (password.length < 6) {
      throw new BadRequestException('Mật khẩu phải có ít nhất 6 ký tự.');
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await this.userModel
      .findOne({ email: normalizedEmail })
      .lean();
    if (existing) {
      throw new ConflictException(
        'Email này đã được đăng ký. Vui lòng đăng nhập hoặc dùng email khác.',
      );
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    const studentCode = await this.generateNextStudentCode();

    const user = await this.userModel.create({
      email: normalizedEmail,
      password: hashedPassword,
      fullName: fullName.trim(),
      role: 'STUDENT',
      studentCode,
    });

    return this.buildAuthResponse(user);
  }

  /**
   * Đặt nhóm tuổi cho tài khoản STUDENT hiện tại — gọi từ modal bắt buộc
   * chọn nhóm tuổi ngay sau lần đăng nhập đầu tiên (khi ageGroup còn rỗng).
   * Chỉ set được một lần theo hướng "chưa có thì set" ở phía FE (modal không
   * hiện lại sau khi đã có); Backend không chặn set lại vì đổi lớp cho học
   * viên là thao tác hợp lệ (ví dụ lên lớp), chỉ ràng buộc giá trị hợp lệ.
   */
  async setAgeGroup(
    userId: string,
    ageGroup: string,
  ): Promise<{ ageGroup: AgeGroup }> {
    if (!VALID_AGE_GROUPS.includes(ageGroup as AgeGroup)) {
      throw new BadRequestException(
        'Nhóm tuổi không hợp lệ (chỉ nhận 3-5, 6-9 hoặc 10-12).',
      );
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản.');
    }
    if (user.role !== 'STUDENT') {
      throw new BadRequestException('Chỉ tài khoản học viên mới có nhóm tuổi.');
    }

    user.ageGroup = ageGroup as AgeGroup;
    await user.save();

    return { ageGroup: user.ageGroup };
  }

  /**
   * Đăng nhập bằng email + mật khẩu, trả về JWT access token.
   */
  async login(dto: LoginDto) {
    const { email, password } = dto;

    if (!email || !password) {
      throw new BadRequestException('Vui lòng nhập email và mật khẩu.');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.userModel.findOne({ email: normalizedEmail });

    // Cùng một thông báo lỗi cho "không tìm thấy email" và "sai mật khẩu"
    // để tránh lộ thông tin email nào đã đăng ký trong hệ thống.
    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác.');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác.');
    }

    return this.buildAuthResponse(user);
  }

  /**
   * Sinh yêu cầu đặt lại mật khẩu: tạo token ngẫu nhiên, lưu HASH của token
   * (không lưu token gốc) kèm hạn 15 phút, rồi gửi email thật chứa link reset.
   *
   * Luôn trả về cùng một thông báo thành công bất kể email có tồn tại hay
   * không — tránh lộ danh sách email đã đăng ký qua phản hồi khác nhau
   * (cùng nguyên tắc chống user-enumeration như login()).
   */
  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const { email } = dto;
    if (!email) {
      throw new BadRequestException('Vui lòng nhập email.');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.userModel
      .findOne({ email: normalizedEmail })
      .lean();

    const genericResponse = {
      message:
        'Nếu email này đã đăng ký, một liên kết đặt lại mật khẩu đã được gửi tới hộp thư của bạn.',
    };

    if (!user) {
      return genericResponse;
    }

    // Vô hiệu hóa mọi yêu cầu reset cũ chưa dùng của user này — chỉ token mới
    // nhất có hiệu lực, tránh một link reset cũ rò rỉ vẫn còn dùng được.
    await this.passwordResetModel.deleteMany({
      userId: String(user._id),
      used: false,
    });

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);

    await this.passwordResetModel.create({
      userId: String(user._id),
      tokenHash,
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    });

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${rawToken}`;

    await this.mailService.sendPasswordResetEmail(user.email, resetLink);

    return genericResponse;
  }

  /**
   * Đặt mật khẩu mới bằng token nhận qua email. Token chỉ dùng được một lần
   * và trong 15 phút kể từ lúc yêu cầu.
   */
  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const { token, newPassword } = dto;

    if (!token || !newPassword) {
      throw new BadRequestException('Vui lòng cung cấp token và mật khẩu mới.');
    }
    if (newPassword.length < 6) {
      throw new BadRequestException('Mật khẩu mới phải có ít nhất 6 ký tự.');
    }

    const tokenHash = this.hashToken(token);
    const resetRecord = await this.passwordResetModel.findOne({
      tokenHash,
      used: false,
    });

    if (!resetRecord || resetRecord.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException(
        'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.',
      );
    }

    const user = await this.userModel.findById(resetRecord.userId);
    if (!user) {
      throw new NotFoundException(
        'Không tìm thấy tài khoản tương ứng với liên kết này.',
      );
    }

    user.password = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
    await user.save();

    resetRecord.used = true;
    await resetRecord.save();

    return {
      message:
        'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.',
    };
  }

  private hashToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }

  /**
   * Sinh mã học viên Cxxxx tuần tự (C0001, C0002, ...) bằng $inc atomic trên
   * Counter collection — an toàn khi nhiều lượt đăng ký STUDENT xảy ra cùng
   * lúc, khác với đếm `countDocuments` rồi +1 (có khoảng hở giữa đọc và ghi
   * mà hai request có thể cùng đọc được cùng một số).
   */
  private async generateNextStudentCode(): Promise<string> {
    const counter = await this.counterModel.findOneAndUpdate(
      { key: STUDENT_CODE_COUNTER_KEY },
      { $inc: { seq: 1 } },
      { new: true, upsert: true },
    );

    return `C${String(counter.seq).padStart(STUDENT_CODE_DIGITS, '0')}`;
  }

  private buildAuthResponse(user: UserDocument) {
    const payload = {
      sub: String(user._id),
      email: user.email,
      role: user.role,
    };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: String(user._id),
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        ageGroup: user.ageGroup,
        studentCode: user.studentCode,
      },
    };
  }
}
