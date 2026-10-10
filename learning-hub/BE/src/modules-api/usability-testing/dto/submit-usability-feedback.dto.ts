export enum AgeGroup {
  KIDS_8_12 = 'KIDS_8_12',
  TEENS_13_17 = 'TEENS_13_17',
  ADULTS_18_PLUS = 'ADULTS_18_PLUS',
}

export class SubmitUsabilityFeedbackDto {
  ageGroup: AgeGroup;
  scenarioId: string;
  completionTimeSeconds: number;
  errorCount: number;
  confusionMarkersCount: number;
  satisfactionRating: number;
  feedbackText?: string;
  parentalConsentVerified?: boolean;
}
