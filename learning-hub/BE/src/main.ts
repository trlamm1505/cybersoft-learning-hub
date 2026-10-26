import type { Request, Response, NextFunction } from 'express';
import { NestFactory } from '@nestjs/core';
import * as path from 'path';
import { AppModule } from './app.module';
import { loadSharedEnvFiles } from './common/config/sandbox-env';
import { corsAllowlist, corsOriginChecker, securityHeadersMiddleware } from './common/security/http-hardening';

// BE/.env là file cấu hình duy nhất: nạp trước khi dựng app để mọi module (kể cả bộ chạy code) thấy cùng giá trị.
// Thư mục backend: cwd khi chạy bằng npm script; __dirname/.. khi chạy thẳng file đã build.
loadSharedEnvFiles(process.cwd());
loadSharedEnvFiles(path.resolve(__dirname, '..'));

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const isProduction = process.env.NODE_ENV === 'production';

  // Request logger middleware: in log từng request gọi tới kèm status và thời gian phản hồi
  app.use((req: Request, res: Response, next: NextFunction) => {
    const { method, originalUrl } = req;
    const start = Date.now();
    res.on('finish', () => {
      const { statusCode } = res;
      const duration = Date.now() - start;
      const icon = statusCode >= 400 ? '❌' : '✅';
      console.log(`${icon} [API] ${method} ${originalUrl} | Status: ${statusCode} | ${duration}ms`);
    });
    next();
  });

  // Header bảo mật trên mọi phản hồi (tương đương helmet): nosniff, chống nhúng khung, CSP, không lộ X-Powered-By.
  app.getHttpAdapter().getInstance().disable?.('x-powered-by');
  app.use(securityHeadersMiddleware(isProduction));

  // CORS theo danh sách cho phép (CORS_ORIGINS / FRONTEND_URL): origin lạ không được phản chiếu kèm credentials.
  app.enableCors({
    origin: corsOriginChecker(corsAllowlist()),
    credentials: true,
  });

  // Set global prefix 'api' for all endpoints: http://localhost:3000/api/...
  app.setGlobalPrefix('api');

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(
    `🚀 NestJS Backend Application is running on: http://localhost:${port}/api`,
  );
}
bootstrap();
