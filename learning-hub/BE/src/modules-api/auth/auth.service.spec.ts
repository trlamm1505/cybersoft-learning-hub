import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from '../../modules-system/database/schemas/user.schema';
import { Counter } from '../../modules-system/database/schemas/counter.schema';
import { PasswordReset } from '../../modules-system/database/schemas/password-reset.schema';
import { MailService } from './mail.service';

// @nestjs/jwt kéo theo `jsonwebtoken` (ESM) mà ts-jest ở phiên bản hiện tại
// của repo không transform được (SyntaxError: Cannot use import statement
// outside a module) — không liên quan tới logic AuthService, nên mock hẳn
// token/class thay vì import thật, tránh phải đổi jest config toàn cục chỉ
// vì một spec file.
jest.mock('@nestjs/jwt', () => ({
  JwtService: jest.fn(),
}));
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
  let service: AuthService;

  const mockUserModel: any = {
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  };
  const mockCounterModel: any = {
    findOneAndUpdate: jest.fn(),
  };
  const mockPasswordResetModel: any = {
    deleteMany: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
  };
  const mockJwtService = {
    sign: jest.fn().mockReturnValue('signed.jwt.token'),
  };
  const mockConfigService = { get: jest.fn() };
  const mockMailService = {
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: getModelToken(Counter.name), useValue: mockCounterModel },
        {
          provide: getModelToken(PasswordReset.name),
          useValue: mockPasswordResetModel,
        },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register — luôn tạo STUDENT, không nhận role từ client', () => {
    it('tạo tài khoản STUDENT và sinh studentCode ngay khi đăng ký', async () => {
      mockUserModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });
      mockCounterModel.findOneAndUpdate.mockResolvedValue({ seq: 1 });
      mockUserModel.create.mockImplementation((data: any) =>
        Promise.resolve({ _id: 'u', ...data }),
      );

      const result = await service.register({
        email: 'a@b.com',
        password: '123456',
        fullName: 'A',
      });

      expect(mockUserModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'STUDENT', studentCode: 'C0001' }),
      );
      expect(result.user.role).toBe('STUDENT');
      expect(result.user.studentCode).toBe('C0001');
      // ageGroup KHÔNG bắt buộc lúc đăng ký nữa — set sau qua setAgeGroup()
      expect(result.user.ageGroup).toBeUndefined();
    });

    it('pad đúng 4 chữ số: seq=1 -> C0001, seq=23 -> C0023, seq=10000 -> C10000', async () => {
      mockUserModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });
      mockUserModel.create.mockImplementation((data: any) =>
        Promise.resolve({ _id: 'u', ...data }),
      );

      mockCounterModel.findOneAndUpdate.mockResolvedValueOnce({ seq: 1 });
      const r1 = await service.register({
        email: 'a@b.com',
        password: '123456',
        fullName: 'A',
      });
      expect(r1.user.studentCode).toBe('C0001');

      mockCounterModel.findOneAndUpdate.mockResolvedValueOnce({ seq: 23 });
      const r2 = await service.register({
        email: 'b@b.com',
        password: '123456',
        fullName: 'B',
      });
      expect(r2.user.studentCode).toBe('C0023');

      mockCounterModel.findOneAndUpdate.mockResolvedValueOnce({ seq: 10000 });
      const r3 = await service.register({
        email: 'c@b.com',
        password: '123456',
        fullName: 'C',
      });
      expect(r3.user.studentCode).toBe('C10000');
    });

    it('từ chối nếu email đã tồn tại', async () => {
      mockUserModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue({ email: 'a@b.com' }),
      });

      await expect(
        service.register({
          email: 'a@b.com',
          password: '123456',
          fullName: 'A',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('từ chối mật khẩu ngắn hơn 6 ký tự', async () => {
      mockUserModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.register({ email: 'a@b.com', password: '123', fullName: 'A' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('setAgeGroup — chỉ set được cho STUDENT, giá trị hợp lệ', () => {
    it('từ chối ageGroup không hợp lệ', async () => {
      await expect(service.setAgeGroup('user1', 'invalid')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('từ chối nếu không tìm thấy user', async () => {
      mockUserModel.findById.mockResolvedValue(null);

      await expect(service.setAgeGroup('user1', '6-9')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('từ chối nếu user không phải STUDENT', async () => {
      mockUserModel.findById.mockResolvedValue({
        role: 'TEACHER',
        save: jest.fn(),
      });

      await expect(service.setAgeGroup('user1', '6-9')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('set ageGroup thành công cho STUDENT', async () => {
      const mockUser: any = {
        role: 'STUDENT',
        ageGroup: undefined,
        save: jest.fn().mockResolvedValue(true),
      };
      mockUserModel.findById.mockResolvedValue(mockUser);

      const result = await service.setAgeGroup('user1', '10-12');

      expect(mockUser.ageGroup).toBe('10-12');
      expect(mockUser.save).toHaveBeenCalled();
      expect(result.ageGroup).toBe('10-12');
    });
  });

  describe('forgotPassword / resetPassword', () => {
    it('trả về thông báo chung chung kể cả khi email không tồn tại (chống user-enumeration)', async () => {
      mockUserModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      const result = await service.forgotPassword({
        email: 'khongtontai@b.com',
      });

      expect(result.message).toContain('Nếu email này đã đăng ký');
      expect(mockMailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('sinh token, xoá token cũ chưa dùng, và gửi email khi email tồn tại', async () => {
      mockUserModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: 'user1', email: 'a@b.com' }),
      });
      mockConfigService.get.mockImplementation((key: string) =>
        key === 'FRONTEND_URL' ? 'http://localhost:5173' : undefined,
      );

      await service.forgotPassword({ email: 'a@b.com' });

      expect(mockPasswordResetModel.deleteMany).toHaveBeenCalledWith({
        userId: 'user1',
        used: false,
      });
      expect(mockPasswordResetModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user1' }),
      );
      expect(mockMailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        'a@b.com',
        expect.stringContaining('http://localhost:5173/reset-password?token='),
      );
    });

    it('không lưu token gốc — chỉ lưu hash SHA-256 của nó', async () => {
      mockUserModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: 'user1', email: 'a@b.com' }),
      });
      mockConfigService.get.mockReturnValue('http://localhost:5173');

      await service.forgotPassword({ email: 'a@b.com' });

      const createCallArg = mockPasswordResetModel.create.mock.calls[0][0];
      const sentLink = mockMailService.sendPasswordResetEmail.mock
        .calls[0][1] as string;
      const rawToken = new URL(sentLink).searchParams.get('token');

      expect(createCallArg.tokenHash).not.toBe(rawToken);
      expect(createCallArg.tokenHash).toHaveLength(64); // SHA-256 hex length
    });

    it('từ chối reset với token không tồn tại/hết hạn', async () => {
      mockPasswordResetModel.findOne.mockResolvedValue(null);

      await expect(
        service.resetPassword({
          token: 'khong-hop-le',
          newPassword: 'newpass123',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('từ chối reset khi token đã hết hạn thời gian', async () => {
      mockPasswordResetModel.findOne.mockResolvedValue({
        userId: 'user1',
        expiresAt: new Date(Date.now() - 1000), // đã qua hạn 1s trước
        used: false,
      });

      await expect(
        service.resetPassword({
          token: 'valid-but-expired',
          newPassword: 'newpass123',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('đặt mật khẩu mới thành công và đánh dấu token đã dùng', async () => {
      const mockResetRecord = {
        userId: 'user1',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        used: false,
        save: jest.fn().mockResolvedValue(true),
      };
      mockPasswordResetModel.findOne.mockResolvedValue(mockResetRecord);

      const mockUser = {
        password: 'old-hash',
        save: jest.fn().mockResolvedValue(true),
      };
      mockUserModel.findById.mockResolvedValue(mockUser);

      const result = await service.resetPassword({
        token: 'valid-token',
        newPassword: 'newpass123',
      });

      expect(mockUser.password).not.toBe('old-hash');
      expect(mockUser.save).toHaveBeenCalled();
      expect(mockResetRecord.used).toBe(true);
      expect(mockResetRecord.save).toHaveBeenCalled();
      expect(result.message).toContain('thành công');
    });
  });
});
