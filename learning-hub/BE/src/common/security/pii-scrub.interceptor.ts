import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map, Observable } from 'rxjs';

/**
 * Field-level READ: giảng viên chỉ đọc { _id, fullName, email, progress, submissions, score }. Mọi trường định danh nhạy cảm
 * dưới đây bị loại khỏi response trả cho vai trò TEACHER, kể cả khi một query sau này vô tình select thừa.
 */
export const TEACHER_FORBIDDEN_FIELDS: ReadonlySet<string> = new Set([
  'phone',
  'phoneNumber',
  'nationalId',
  'address',
  'guardianInfo',
  'guardian',
  'password',
  'passwordHash',
  'resetToken',
  'resetTokenHash',
]);

export function scrubPii(value: unknown, depth = 0): unknown {
  if (depth > 12 || value === null || typeof value !== 'object') return value;
  if (value instanceof Date || Buffer.isBuffer(value)) return value;
  const maybe = value as { toJSON?: () => unknown };
  if (typeof maybe.toJSON === 'function' && !Array.isArray(value)) {
    const json = maybe.toJSON();
    if (json !== value) return scrubPii(json, depth + 1);
  }
  if (Array.isArray(value)) return value.map((v) => scrubPii(v, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (TEACHER_FORBIDDEN_FIELDS.has(k)) continue;
    out[k] = scrubPii(v, depth + 1);
  }
  return out;
}

@Injectable()
export class TeacherPiiScrubInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<{ user?: { role?: string } }>();
    if (req.user?.role !== 'TEACHER') return next.handle();
    return next.handle().pipe(map((body) => scrubPii(body)));
  }
}
