export class QualityGateBypassItemDto {
  testId: string;
  bypass: boolean;
  bypassReason?: string;
}

export class EvaluateGateDto {
  bypasses?: QualityGateBypassItemDto[];
}
