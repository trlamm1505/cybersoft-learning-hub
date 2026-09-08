export interface HintItem {
  id: string;
  exerciseSlug: string;
  level: 1 | 2 | 3;
  title: string;
  costPoints: number;
  cooldownSeconds: number;
  isUnlocked: boolean;
  content: string | null;
}

export interface GetHintsResponse {
  exerciseSlug: string;
  cooldownRemainingSeconds: number;
  hints: HintItem[];
}

export interface UnlockHintPayload {
  exerciseSlug: string;
  level: number;
  userId: string;
}

export interface UnlockHintResponse {
  message: string;
  alreadyUnlocked: boolean;
  hint: {
    id: string;
    exerciseSlug: string;
    level: number;
    title: string;
    content: string;
    costPoints?: number;
    costPointsDeducted?: number;
  };
  unlockedAt: string;
  cooldownRemainingSeconds: number;
}
