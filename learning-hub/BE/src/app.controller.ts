import { Controller, Get, Optional } from '@nestjs/common';
import * as net from 'net';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { AppService } from './app.service';
import { DatasetIntegrationService } from './integration/dataset-integration.service';
import { buildSandboxDbUrl } from './common/config/sandbox-env';

/** Thử mở kết nối TCP (không gửi gì) để biết một dịch vụ có đang nghe cổng hay không. */
export function probeTcp(host: string, port: number, timeoutMs = 1_000): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port });
    const done = (ok: boolean) => {
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(timeoutMs, () => done(false));
    socket.once('connect', () => done(true));
    socket.once('error', () => done(false));
  });
}

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @InjectConnection() private readonly mongoConnection: Connection,
    @Optional() private readonly datasets?: DatasetIntegrationService,
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

  /**
   * Chẩn đoán các phụ thuộc ngoài backend để biết vì sao DA Lab / AI Lab lỗi mà
   * không phải đoán: nguồn dữ liệu đang dùng (tích hợp sẵn hay máy chủ TTS 01) và
   * Postgres sandbox có đang nghe cổng không. Chỉ để xem, không ảnh hưởng
   * `/health` (dùng cho liveness) nên sandbox tắt không làm backend bị coi là hỏng.
   * Route: GET /api/health/dependencies
   */
  @Get('health/dependencies')
  async getDependencies() {
    const sandboxUrl = new URL(buildSandboxDbUrl());
    const host = sandboxUrl.hostname;
    const port = Number(sandboxUrl.port || 5432);
    const reachable = await probeTcp(host, port);
    return {
      dataService: this.datasets?.describeSource() ?? { mode: 'unknown', baseUrl: null },
      sandboxDb: {
        host,
        port,
        reachable,
        hint: reachable
          ? null
          : 'Postgres sandbox chưa chạy: bật bằng `npm run sandbox` (hoặc `npm run docker:up`) ở thư mục learning-hub.',
      },
      pythonSandbox: process.env.PYTHON_SANDBOX === 'local' ? 'local' : 'docker',
    };
  }
}
