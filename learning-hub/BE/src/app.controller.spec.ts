import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken } from '@nestjs/mongoose';
import { AppController } from './app.controller';
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
});
