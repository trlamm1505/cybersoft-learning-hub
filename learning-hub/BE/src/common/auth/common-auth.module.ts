import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard';
import { RolesGuard } from './roles.guard';

/**
 * Module dùng chung cho mọi feature module cần bảo vệ route bằng
 * JwtAuthGuard/RolesGuard — tách khỏi AuthModule (vốn lo phần đăng ký/đăng
 * nhập) để tránh phụ thuộc vòng khi AuthoringModule/QuizModule/... chỉ cần
 * verify token, không cần AuthService.
 */
@Module({
  imports: [ConfigModule, PassportModule],
  providers: [JwtStrategy, JwtAuthGuard, OptionalJwtAuthGuard, RolesGuard],
  exports: [JwtAuthGuard, OptionalJwtAuthGuard, RolesGuard],
})
export class CommonAuthModule {}
