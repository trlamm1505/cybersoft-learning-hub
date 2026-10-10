import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken } from '@nestjs/mongoose';
import { AppController, probeTcp } from './app.controller';
import * as net from 'net';
import { DatasetIntegrationService } from './integration/dataset-integration.service';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  const mockConnection = { readyState: 1 };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: getConnectionToken(), useValue: mockConnection },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('health', () => {
    it('trả về status ok khi Mongo đang connected (readyState 1)', () => {
      const result = appController.getHealth();
      expect(result.status).toBe('ok');
      expect(result.mongo).toBe('connected');
      expect(result.timestamp).toBeDefined();
    });

    it('trả về status degraded khi Mongo không connected', async () => {
      const app: TestingModule = await Test.createTestingModule({
        controllers: [AppController],
        providers: [
          AppService,
          { provide: getConnectionToken(), useValue: { readyState: 0 } },
        ],
      }).compile();
      const controllerWithDisconnectedMongo = app.get<AppController>(AppController);

      const result = controllerWithDisconnectedMongo.getHealth();
      expect(result.status).toBe('degraded');
      expect(result.mongo).toBe('disconnected');
    });
  });

  describe('health/dependencies', () => {
    const build = async (source: unknown) => {
      const app: TestingModule = await Test.createTestingModule({
        controllers: [AppController],
        providers: [
          AppService,
          { provide: getConnectionToken(), useValue: mockConnection },
          { provide: DatasetIntegrationService, useValue: { describeSource: () => source } },
        ],
      }).compile();
      return app.get<AppController>(AppController);
    };

    it('báo nguồn dữ liệu đang dùng và trạng thái Postgres sandbox', async () => {
      const server = net.createServer().listen(0, '127.0.0.1');
      await new Promise((r) => server.once('listening', r));
      const { port } = server.address() as net.AddressInfo;
      const old = { ...process.env };
      process.env.SANDBOX_DB_HOST = '127.0.0.1';
      process.env.SANDBOX_DB_PORT = String(port);
      delete process.env.MOCK_SANDBOX_DB_URL;
      try {
        const controller = await build({ mode: 'embedded', baseUrl: null });
        const up = await controller.getDependencies();
        expect(up.dataService).toEqual({ mode: 'embedded', baseUrl: null });
        expect(up.sandboxDb).toMatchObject({ port, reachable: true, hint: null });

        server.close();
        await new Promise((r) => server.once('close', r));
        const down = await controller.getDependencies();
        expect(down.sandboxDb.reachable).toBe(false);
        expect(down.sandboxDb.hint).toContain('npm run sandbox');
      } finally {
        process.env = old;
        server.close();
      }
    });

    it('probeTcp: cổng không ai nghe thì false nhanh, không treo', async () => {
      await expect(probeTcp('127.0.0.1', 1, 500)).resolves.toBe(false);
    });
  });
});
