import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map } from 'rxjs/operators';
import type { Observable } from 'rxjs';

/** Trường chỉ staff được thấy; phản hồi công khai cho học viên không bao giờ chứa chúng. */
const SECRET_KEYS = new Set(['hiddenTestCases', 'officialSolution', 'solutionCode']);

/** Xóa đệ quy các trường bí mật khỏi mọi object/mảng trong dữ liệu trả về. */
export function stripExerciseSecrets<T>(value: T): T {
  if (Array.isArray(value)) return value.map(stripExerciseSecrets) as unknown as T;
  // Chỉ đi sâu vào object thuần: ObjectId/Date giữ nguyên để JSON hóa đúng.
  if (value && Object.getPrototypeOf(value) === Object.prototype) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (!SECRET_KEYS.has(k)) out[k] = stripExerciseSecrets(v);
    }
    return out as T;
  }
  return value;
}

/** Interceptor áp lên các endpoint công khai của học viên: lớp lọc cuối cùng, kể cả khi service lỡ select dư. */
@Injectable()
export class StripExerciseSecretsInterceptor implements NestInterceptor {
  intercept(_ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((data) => stripExerciseSecrets(data)));
  }
}
