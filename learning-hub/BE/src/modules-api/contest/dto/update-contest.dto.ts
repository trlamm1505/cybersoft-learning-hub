import { ContestProblemDto } from './create-contest.dto';

export class UpdateContestDto {
  title?: string;
  slug?: string;
  description?: string;
  startTime?: string | Date;
  endTime?: string | Date;
  durationMinutes?: number;
  problems?: ContestProblemDto[];
  status?: 'draft' | 'published';
  authorId?: string;
}
