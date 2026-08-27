export class Scores {
  id: string;
  userId: string;
  exerciseId: string;
  score: number;
  maxScore: number;
  attemptsCount: number;
  isPassed: boolean;
  lastGradedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
