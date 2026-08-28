export type ReviewPolicyType = 'IMMEDIATE' | 'AFTER_SUBMISSION' | 'AFTER_DEADLINE' | 'NEVER';

export class ReviewAttemptDto {
  userId: string;
  policy?: ReviewPolicyType;
}
