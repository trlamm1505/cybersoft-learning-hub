import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Giống JwtAuthGuard nhưng KHÔNG bắt buộc phải có token — nếu có Bearer token
 * hợp lệ thì gắn req.user như bình thường, nếu thiếu/hết hạn/sai thì để
 * req.user = undefined và vẫn cho request đi tiếp (không throw 401).
 *
 * Dùng cho route công khai nhưng muốn trả nhiều dữ liệu hơn khi người gọi
 * đã đăng nhập đúng role — ví dụ GET /authoring/lessons: khách vãng lai xem
 * catalog (không có token) nhận bản đã lọc solutionCode/đáp án, còn giáo
 * viên đã đăng nhập (có token, dùng để load danh sách bài EDIT của mình)
 * vẫn nhận đủ dữ liệu qua cùng một endpoint.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(_err: any, user: any) {
    return user || undefined;
  }

  canActivate(context: ExecutionContext) {
    return super.canActivate(context) as Promise<boolean>;
  }
}
