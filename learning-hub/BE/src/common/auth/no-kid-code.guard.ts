import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { JwtPayload } from './jwt.strategy';

export const KID_AGE_GROUP = '3-5';

/**
 * Học sinh Lớp 3-5 chỉ học bằng game Blockly (Góc Học Tập), không làm bài code, trắc nghiệm hay hỏi AI Coach về bài code
 * (Day 30, RISK-02 / TC_K35_03). Phải chạy SAU JwtAuthGuard: `req.user.ageGroup` được JwtStrategy đọc lại từ CSDL ở mỗi
 * request nên không giả mạo được qua token.
 */
@Injectable()
export class NoKidCodeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest<{ user?: JwtPayload }>().user;
    if (user?.role === 'STUDENT' && user.ageGroup === KID_AGE_GROUP) {
      throw new ForbiddenException({
        code: 'E403_KID_NO_CODE_QUIZ',
        message: 'Học sinh Lớp 3-5 học qua trò chơi Blockly ở Góc Học Tập, không làm bài code hay trắc nghiệm.',
      });
    }
    return true;
  }
}
