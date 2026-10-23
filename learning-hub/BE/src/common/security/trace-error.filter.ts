import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { isProduction } from './cookies';

export interface ErrorEnvelope {
  success: false;
  code: string;
  message: string;
  traceId: string;
  [extra: string]: unknown;
}

const DEFAULT_CODE: Record<number, string> = {
  400: 'E400_BAD_REQUEST',
  401: 'E401_UNAUTHORIZED',
  403: 'E403_FORBIDDEN',
  404: 'E404_NOT_FOUND',
  409: 'E409_CONFLICT',
  413: 'E413_PAYLOAD_TOO_LARGE',
  415: 'E415_UNSUPPORTED_MEDIA_TYPE',
  429: 'E429_RATE_LIMIT',
};

/** Dựng phản hồi lỗi chuẩn từ một exception bất kỳ. Giữ các trường mở rộng cũ (vd `code: 'ACCOUNT_LOCKED'` là mã nghiệp vụ). */
export function buildErrorEnvelope(exception: unknown, traceId: string): { status: number; body: ErrorEnvelope } {
  if (exception instanceof HttpException) {
    const status = exception.getStatus();
    const res = exception.getResponse();
    const obj = typeof res === 'object' && res !== null ? (res as Record<string, unknown>) : {};
    const raw = typeof res === 'string' ? res : obj.message;
    const message = Array.isArray(raw) ? raw.join('; ') : typeof raw === 'string' && raw ? raw : exception.message;
    const { statusCode: _s, error: _e, message: _m, code, ...extra } = obj;
    void _s;
    void _e;
    void _m;
    return {
      status,
      body: {
        ...extra,
        success: false,
        code: typeof code === 'string' && code ? code : (DEFAULT_CODE[status] ?? `E${status}`),
        message,
        traceId,
      },
    };
  }
  return {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    body: { success: false, code: 'E500_INTERNAL', message: 'Hệ thống gặp lỗi nội bộ. Vui lòng thử lại sau.', traceId },
  };
}

/** Mọi lỗi trả về cùng một dạng `{ success:false, code, message, traceId }`; không bao giờ lộ stack trace ra client. */
@Catch()
export class TraceErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger('Http');

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const res = http.getResponse<{
      status: (n: number) => { json: (b: unknown) => void };
      setHeader: (k: string, v: string) => void;
    }>();
    const req = http.getRequest<{ method?: string; originalUrl?: string }>();
    const traceId = randomUUID();
    const { status, body } = buildErrorEnvelope(exception, traceId);
    if (status >= 500) {
      const err = exception as Error;
      this.logger.error(`[${traceId}] ${req.method} ${req.originalUrl}: ${err?.message}`, isProduction() ? undefined : err?.stack);
    }
    res.setHeader('x-trace-id', traceId);
    res.status(status).json(body);
  }
}
