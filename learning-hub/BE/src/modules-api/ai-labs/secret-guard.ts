import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import {
  API_KEY_LEAK_MESSAGE,
  containsSecret,
} from '../../common/security/secret-patterns';

// Danh sách mẫu nằm ở common/security/secret-patterns.ts, dùng chung với FE.
export { API_KEY_LEAK_MESSAGE, containsSecret };

/** Không lặp lại chuỗi bị chặn trong thông báo lỗi để khóa không đi tiếp vào log. */
export function assertNoSecrets(value: unknown): void {
  if (containsSecret(value)) {
    throw new BadRequestException(API_KEY_LEAK_MESSAGE);
  }
}

/** Chặn payload nộp bài chứa API key ngay ở tầng controller, trước khi lưu hay chấm. */
@Injectable()
export class NoSecretsPipe implements PipeTransform {
  transform(value: unknown) {
    assertNoSecrets(value);
    return value;
  }
}
