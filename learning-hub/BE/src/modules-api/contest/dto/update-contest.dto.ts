import { ContestProblemDto } from './create-contest.dto';

export class UpdateContestDto {
  title?: string;
  slug?: string;
  description?: string;
  startTime?: string | Date;
  endTime?: string | Date;
  durationMinutes?: number;
  problems?: ContestProblemDto[];
  /** 'ALL' | '6-9' | '10-12' */
  gradeBand?: string;
  status?: 'draft' | 'published';
  integrityEnabled?: boolean;
}
