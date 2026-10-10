import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { UsabilityTestingService } from './usability-testing.service';
import { AgeGroup } from './dto/submit-usability-feedback.dto';

describe('UsabilityTestingService (Day 28)', () => {
  let service: UsabilityTestingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsabilityTestingService],
    }).compile();

    service = module.get<UsabilityTestingService>(UsabilityTestingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return usability report with metrics grouped by 3 age groups', async () => {
    const report = await service.getUsabilityReport();
    expect(report).toBeDefined();
    expect(report.summary.criticalFlowPassRate).toBe(100);

    // Verify Age Group Breakdown
    const kids = report.metricsByAgeGroup[AgeGroup.KIDS_8_12];
    const teens = report.metricsByAgeGroup[AgeGroup.TEENS_13_17];
    const adults = report.metricsByAgeGroup[AgeGroup.ADULTS_18_PLUS];

    expect(kids).toBeDefined();
    expect(kids.label).toContain('Trẻ em');
    expect(teens).toBeDefined();
    expect(teens.label).toContain('Thiếu niên');
    expect(adults).toBeDefined();
    expect(adults.label).toContain('Người lớn');

    // Verify Child Safety Status
    expect(report.childSafetyStatus.coppaCompliant).toBe(true);
    expect(report.childSafetyStatus.parentalConsentRequiredForMinors).toBe(true);
  });

  it('should enforce Child Safety Guard: throw BadRequestException if parental consent missing for KIDS_8_12', async () => {
    await expect(
      service.recordUsabilitySession({
        ageGroup: AgeGroup.KIDS_8_12,
        scenarioId: 'test-scenario-kids',
        completionTimeSeconds: 60,
        errorCount: 0,
        confusionMarkersCount: 0,
        satisfactionRating: 5,
        feedbackText: 'Em rất thích học',
        parentalConsentVerified: false,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should record usability session and sanitize PII when parental consent is verified', async () => {
    const res = await service.recordUsabilitySession({
      ageGroup: AgeGroup.KIDS_8_12,
      scenarioId: 'test-scenario-kids-consent',
      completionTimeSeconds: 55,
      errorCount: 0,
      confusionMarkersCount: 0,
      satisfactionRating: 5,
      feedbackText: 'Liên hệ em qua test@gmail.com hoặc 0912345678',
      parentalConsentVerified: true,
    });

    expect(res.success).toBe(true);
    expect(res.session.feedbackText).toContain('[CHE_ANONYMOUS_EMAIL]');
    expect(res.session.feedbackText).toContain('[CHE_ANONYMOUS_PHONE]');
  });

  it('should return top 5 prioritized UX fixes', () => {
    const fixes = service.getTopPrioritizedFixes();
    expect(fixes.length).toBe(5);
    expect(fixes[0].priorityRank).toBe(1);
    expect(fixes[0].title).toContain('Trẻ Em');
  });
});
