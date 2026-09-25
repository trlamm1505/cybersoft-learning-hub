export interface ContestProblem {
  lessonId?: string;
  title: string;
  slug: string;
  type?: 'coding' | 'quiz';
  points?: number;
  order?: number;
}

export interface ContestRegistration {
  studentId: string;
  studentName?: string;
  registeredAt: string;
}

export interface ContestItem {
  _id?: string;
  title: string;
  slug: string;
  description?: string;
  startTime: string;
  endTime: string;
  durationMinutes?: number;
  problems: ContestProblem[];
  registrations?: ContestRegistration[];
  status?: 'draft' | 'published';
  authorId?: string;
  createdAt?: string;
  updatedAt?: string;

  // Computed fields from server response
  serverTime?: string;
  computedStatus?: 'UPCOMING' | 'ONGOING' | 'ENDED';
  statusText?: string;
  isRegistered?: boolean;
  registrationsCount?: number;
}

export interface ContestStatusResponse {
  contestId: string;
  slug: string;
  title: string;
  serverTime: string;
  startTime: string;
  endTime: string;
  computedStatus: 'UPCOMING' | 'ONGOING' | 'ENDED';
  statusText: string;
  isRegistered: boolean;
  isAllowedToJoin: boolean;
  isAllowedToSubmit: boolean;
  timeRemainingSeconds: number;
  countdownSeconds: number;
  message: string;
}
