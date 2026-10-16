import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const statusCode = response.statusCode;
          const duration = Date.now() - startTime;
          this.logger.log(`[${method}] ${url} ${statusCode} - ${duration}ms`);
        },
        error: (err) => {
          const statusCode = err?.status || err?.statusCode || 500;
          const duration = Date.now() - startTime;
          this.logger.error(
            `[${method}] ${url} ${statusCode} - ${duration}ms - ${err?.message || err}`,
          );
        },
      }),
    );
  }
}
