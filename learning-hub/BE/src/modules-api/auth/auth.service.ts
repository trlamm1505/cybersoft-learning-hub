import { Injectable, BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User, UserDocument } from '../../modules-system/database/schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const VALID_ROLES = ['STUDENT', 'TEACHER'];
const BCRYPT_SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,

    private readonly jwtService: JwtService,
  ) {}

  /**
   * Đăng ký tài khoản mới (Student hoặc Teacher) và tự động đăng nhập.
   */
  async register(dto: RegisterDto) {
    const { email, password, fullName, role } = dto;

    if (!email || !password || !fullName) {
      throw new BadRequestException('Vui lòng nhập đầy đủ email, mật khẩu và họ tên.');
    }

    if (password.length < 6) {
      throw new BadRequestException('Mật khẩu phải có ít nhất 6 ký tự.');
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await this.userModel.findOne({ email: normalizedEmail }).lean();
    if (existing) {
      throw new ConflictException('Email này đã được đăng ký. Vui lòng đăng nhập hoặc dùng email khác.');
    }

    const resolvedRole = role && VALID_ROLES.includes(role) ? role : 'STUDENT';
    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    const user = await this.userModel.create({
      email: normalizedEmail,
      password: hashedPassword,
      fullName: fullName.trim(),
      role: resolvedRole,
    });

    return this.buildAuthResponse(user);
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

  private buildAuthResponse(user: UserDocument) {
    const payload = { sub: String(user._id), email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: String(user._id),
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }
}
