export enum AttemptStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export class Attempts {
  id: string;
  userId: string;
  exerciseId: string;
  code: string;
  status: AttemptStatus;
  createdAt: Date;
  updatedAt: Date;
}
