import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

/** Độ sâu tối đa khi duyệt payload (chặn object lồng quá sâu làm treo máy chủ). */
const MAX_DEPTH = 20;

/** Đường dẫn của key đầu tiên bắt đầu bằng `$` (toán tử MongoDB) hoặc chứa `.`-lồng `$`, null nếu sạch. */
export function findOperatorKey(value: unknown, path = '', depth = 0): string | null {
  if (depth > MAX_DEPTH) return path || '(gốc)';
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const hit = findOperatorKey(value[i], `${path}[${i}]`, depth + 1);
      if (hit) return hit;
    }
    return null;
  }
  if (value && typeof value === 'object' && !(value instanceof Date) && !Buffer.isBuffer(value)) {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const here = path ? `${path}.${k}` : k;
      if (k.startsWith('$')) return here;
      const hit = findOperatorKey(v, here, depth + 1);
      if (hit) return hit;
    }
  }
  return null;
}

/**
 * Pipe toàn cục (Day 30, DEF-050 / TC_SEC_01): body, query và tham số route không bao giờ được chứa key dạng toán tử
 * MongoDB (`{ "$ne": null }`, `{ "$gt": "" }`…). Payload như vậy bị từ chối 400 với thông báo rõ, thay vì lọt vào câu
 * truy vấn (NoSQL injection) hoặc làm service ném lỗi 500. Kiểu dữ liệu từng trường do service kiểm tra tiếp
 * (xem common/utils/input.util.ts).
 */
@Injectable()
export class RejectOperatorKeysPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    if (metadata.type !== 'body' && metadata.type !== 'query' && metadata.type !== 'param') return value;
    const hit = findOperatorKey(value);
    if (hit) {
      throw new BadRequestException({
        code: 'E400_INVALID_PAYLOAD',
        message: `Dữ liệu gửi lên không hợp lệ: trường "${hit}" không được bắt đầu bằng ký tự "$".`,
      });
    }
    return value;
  }
}
