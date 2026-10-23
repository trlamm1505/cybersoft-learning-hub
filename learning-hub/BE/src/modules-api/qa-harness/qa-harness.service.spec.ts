import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException } from '@nestjs/common';
import { QaHarnessService } from './qa-harness.service';
import { Lesson } from '../../modules-system/database/schemas/lesson.schema';

describe('QaHarnessService (Day 27 - Quality Gate & Eval Harness)', () => {
  let service: QaHarnessService;
  let mockLessonModel: any;

  beforeEach(async () => {
    mockLessonModel = {
      find: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QaHarnessService,
        {
          provide: getModelToken(Lesson.name),
          useValue: mockLessonModel,
        },
      ],
    }).compile();

    service = module.get<QaHarnessService>(QaHarnessService);
  });

  it('getQualityDashboard trả về báo cáo chất lượng hệ thống đầy đủ', async () => {
    const report = await service.getQualityDashboard();
    expect(report.summary.qualityGateStatus).toBe('READY_TO_RELEASE');
    expect(report.summary.total).toBeGreaterThan(0);
    expect(report.releaseChecklist.length).toBeGreaterThan(0);
  });

  it('evaluateQualityGate vượt qua khi tất cả kiểm thử sẵn sàng', async () => {
    const report = await service.evaluateQualityGate({});
    expect(report.summary.qualityGateStatus).toBe('READY_TO_RELEASE');
    expect(report.summary.failed).toBe(0);
  });

  it('từ chối Bypass nếu không ghi rõ lý do (bypassReason) cho testId không critical', async () => {
    // Mock 1 test không critical thất bại bằng cách mock runAllChecks gián tiếp hoặc qua override
    const mockService = service as any;
    jest.spyOn(mockService, 'runAllChecks').mockResolvedValue([
      {
        testId: 'non-critical-perf-check',
        name: 'Performance Check',
        category: 'SMOKE',
        isCritical: false,
        status: 'FAILED',
      },
    ]);

    await expect(
      service.evaluateQualityGate({
        bypasses: [
          {
            testId: 'non-critical-perf-check',
            bypass: true,
            bypassReason: '', // Không ghi lý do
          },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('chấp nhận Bypass khi ghi đầy đủ lý do (bypassReason)', async () => {
    const mockService = service as any;
    jest.spyOn(mockService, 'runAllChecks').mockResolvedValue([
      {
        testId: 'non-critical-perf-check',
        name: 'Performance Check',
        category: 'SMOKE',
        isCritical: false,
        status: 'FAILED',
      },
    ]);

    const report = await service.evaluateQualityGate({
      bypasses: [
        {
          testId: 'non-critical-perf-check',
          bypass: true,
          bypassReason: 'Tạm hoãn do đang nâng cấp môi trường staging',
        },
      ],
    });

    expect(report.summary.bypassed).toBe(1);
    expect(report.summary.qualityGateStatus).toBe('READY_TO_RELEASE');
  });

  it('từ chối Bypass và chặn Release nếu test bị thất bại là Critical Test', async () => {
    const mockService = service as any;
    jest.spyOn(mockService, 'runAllChecks').mockResolvedValue([
      {
        testId: 'smoke-api-health',
        name: 'API System Health Check',
        category: 'SMOKE',
        isCritical: true, // Critical test
        status: 'FAILED',
      },
    ]);

    await expect(
      service.evaluateQualityGate({
        bypasses: [
          {
            testId: 'smoke-api-health',
            bypass: true,
            bypassReason: 'Muốn bypass critical test',
          },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
