import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @InjectConnection() private readonly mongoConnection: Connection,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /**
   * Health check tối thiểu cho CI/monitoring: xác nhận process còn sống VÀ
   * kết nối MongoDB đang ở trạng thái connected (readyState === 1) — một
   * process "sống" nhưng mất kết nối DB vẫn không phục vụ được request thật,
   * nên chỉ trả 200 khi cả hai đều ổn.
   * Route: GET /api/health
   */
  @Get('health')
  getHealth() {
    const mongoReadyState = this.mongoConnection.readyState;
    const mongoStatusMap: Record<number, string> = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    return {
      status: mongoReadyState === 1 ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      mongo: mongoStatusMap[mongoReadyState] || 'unknown',
    };
  }
}
