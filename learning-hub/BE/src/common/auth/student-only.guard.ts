import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { JwtPayload } from './jwt.strategy';

export const STUDENT_ONLY_MESSAGE =
  'Tài khoản giảng viên không được phép làm bài thực hành';

/**
 * Chỉ học viên (STUDENT) được nộp bài thực hành; TEACHER và ADMIN bị chặn 403
 * trước khi tới pipe hay service. Đặt ở cấp method, sau JwtAuthGuard cấp class
 * (guard cấp class chạy trước), để dùng req.user đã được xác thực.
 */
@Injectable()
export class StudentOnlyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest().user as
      JwtPayload | undefined;
    if (user?.role !== 'STUDENT') {
      throw new ForbiddenException(STUDENT_ONLY_MESSAGE);
    }
    return true;
  }
}
