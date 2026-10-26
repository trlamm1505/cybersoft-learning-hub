import { BadRequestException } from '@nestjs/common';
import { AgeGroup } from './dto/submit-usability-feedback.dto';
import { UsabilityTestingService } from './usability-testing.service';
import { runAuthoringIdorProbe } from '../qa-harness/idor-probe';

/** Day 29: SEC-22 / PRV-08 (Parental Consent) và mục QA security-idor-authoring chạy thật. */
const base = { scenarioId: 's1', completionTimeSeconds: 30, errorCount: 0, confusionMarkersCount: 0, satisfactionRating: 5 };

describe('Parental Consent cho mọi nhóm vị thành niên', () => {
  const service = new UsabilityTestingService();

  it.each(['3-5', '6-9', '10-12', AgeGroup.KIDS_8_12, AgeGroup.TEENS_13_17])('nhóm %s thiếu consent → 400', async (ageGroup) => {
    await expect(service.recordUsabilitySession({ ...base, ageGroup } as never)).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.recordUsabilitySession({ ...base, ageGroup, parentalConsentVerified: 'true' } as never)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('nhóm tuổi lạ (lách bằng chuỗi tự chế) → 400; người lớn không cần consent; trẻ có consent thì lưu được', async () => {
    await expect(service.recordUsabilitySession({ ...base, ageGroup: 'kids' } as never)).rejects.toThrow(/Nhóm tuổi không hợp lệ/);
    await expect(service.recordUsabilitySession({ ...base, ageGroup: AgeGroup.ADULTS_18_PLUS } as never)).resolves.toMatchObject({ success: true });
    await expect(service.recordUsabilitySession({ ...base, ageGroup: '3-5', parentalConsentVerified: true } as never)).resolves.toMatchObject({ success: true });
  });
});

describe('QA harness: security-idor-authoring chạy thật', () => {
  it('mọi kịch bản IDOR authoring đều bị chặn đúng', () => {
    const r = runAuthoringIdorProbe();
    expect(r).toMatchObject({ passed: true });
    expect(r.details).toMatch(/6\/6/);
  });
});
