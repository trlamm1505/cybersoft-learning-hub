import { Test, TestingModule } from '@nestjs/testing';
import { ResilienceSecurityService } from './resilience-security.service';

describe('ResilienceSecurityService (Day 29)', () => {
  let service: ResilienceSecurityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ResilienceSecurityService],
    }).compile();

    service = module.get<ResilienceSecurityService>(ResilienceSecurityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return operational dashboard with security health SECURE', async () => {
    const report = await service.getOperationalDashboard();
    expect(report).toBeDefined();
    expect(report.securityHealthStatus).toBe('SECURE');
    expect(report.securityChecks.length).toBeGreaterThanOrEqual(4);
  });

  it('should verify IDOR, Auth, Rate Limit and File Upload security checks pass', () => {
    const checks = service.getSecurityChecks();
    const categories = checks.map((c) => c.category);

    expect(categories).toContain('AUTH');
    expect(categories).toContain('IDOR');
    expect(categories).toContain('RATE_LIMIT');
    expect(categories).toContain('FILE_UPLOAD');

    expect(checks.every((c) => c.status === 'PASSED')).toBe(true);
  });

  it('should execute load test simulation on judge queue and return metrics', async () => {
    const metrics = await service.runLoadTest(50);
    expect(metrics).toBeDefined();
    expect(metrics.totalSubmissionsTested).toBe(50);
    expect(metrics.successRatePercentage).toBe(100);
    expect(metrics.workerRestartResilienceStatus).toBe('ZERO_LOSS_VERIFIED');
  });

  it('should enforce zero submission loss when worker crashes/restarts', async () => {
    const result = await service.simulateWorkerRestart();
    expect(result.success).toBe(true);
    expect(result.recoveredSubmissionsCount).toBeGreaterThan(0);
    expect(result.message).toContain('Khôi phục thành công 100%');
  });

  it('should document system known limits', () => {
    const limits = service.getKnownLimits();
    expect(limits.rateLimitPerMinute).toBe(500);
    expect(limits.maxFileUploadSizeFormatted).toBe('10 MB');
    expect(limits.maxConcurrentJudgeExecutions).toBe(50);
  });
});
