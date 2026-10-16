import { NestFactory } from '@nestjs/core';
import * as path from 'path';
import { AppModule } from './app.module';
import { loadSharedEnvFiles } from './common/config/sandbox-env';

// learning-hub/.env là nguồn chung (Docker Compose đọc cùng file): nạp trước khi dựng app
// để sandbox_db_url của registry tích hợp sẵn luôn khớp mật khẩu lab_reader.
// Thư mục backend: cwd khi chạy bằng npm script/Docker; __dirname/.. khi chạy thẳng file đã build.
loadSharedEnvFiles(process.cwd());
loadSharedEnvFiles(path.resolve(__dirname, '..'));

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for Cross-Origin requests from Frontend (http://localhost:5173)
  app.enableCors({
    origin: true,
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
