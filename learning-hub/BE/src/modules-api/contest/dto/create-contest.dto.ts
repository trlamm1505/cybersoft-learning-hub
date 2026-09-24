export class ContestProblemDto {
  lessonId?: string;
  title: string;
  slug: string;
  type?: 'coding' | 'quiz';
  points?: number;
  order?: number;
}

// authorId không còn nhận từ client — lấy từ Bearer token (@CurrentUser(),
// yêu cầu role TEACHER) ở controller thay vì tin client tự khai ai là tác giả.
export class CreateContestDto {
  title: string;
  slug?: string;
  description?: string;
  startTime: string | Date;
  endTime: string | Date;
  durationMinutes?: number;
  problems?: ContestProblemDto[];
  status?: 'draft' | 'published';
}
