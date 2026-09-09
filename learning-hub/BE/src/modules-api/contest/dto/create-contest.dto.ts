export class ContestProblemDto {
  lessonId?: string;
  title: string;
  slug: string;
  type?: 'coding' | 'quiz';
  points?: number;
  order?: number;
}

export class CreateContestDto {
  title: string;
  slug?: string;
  description?: string;
  startTime: string | Date;
  endTime: string | Date;
  durationMinutes?: number;
  problems?: ContestProblemDto[];
  status?: 'draft' | 'published';
  authorId?: string;
}
