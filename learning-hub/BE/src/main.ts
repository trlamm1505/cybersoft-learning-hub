import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

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
  console.log(`🚀 NestJS Backend Application is running on: http://localhost:${port}/api`);
}
bootstrap();
