import { BadRequestException } from '@nestjs/common';

/**
 * Kiểm tra kiểu dữ liệu đầu vào dùng chung (Day 30, DEF-050): repo không dùng ValidationPipe/class-validator nên mỗi
 * endpoint tự kiểm tra. Các helper này trả 400 với thông báo rõ ràng thay vì để `.trim()` trên object ném TypeError (500).
 */
export function requireString(value: unknown, field: string, opts: { max?: number; allowEmpty?: boolean } = {}): string {
  if (typeof value !== 'string') throw new BadRequestException(`Trường "${field}" phải là chuỗi ký tự.`);
  if (!opts.allowEmpty && !value.trim()) throw new BadRequestException(`Trường "${field}" không được để trống.`);
  if (opts.max !== undefined && value.length > opts.max) throw new BadRequestException(`Trường "${field}" tối đa ${opts.max} ký tự.`);
  return value;
}

/** Trường tùy chọn: undefined/null thì bỏ qua, có giá trị thì phải là chuỗi. */
export function optionalString(value: unknown, field: string, opts: { max?: number } = {}): string | undefined {
  if (value === undefined || value === null) return undefined;
  return requireString(value, field, { ...opts, allowEmpty: true });
}
