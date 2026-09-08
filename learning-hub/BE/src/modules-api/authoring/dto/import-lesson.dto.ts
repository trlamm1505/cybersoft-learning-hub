import { CreateLessonDto } from './create-lesson.dto';

export class ImportLessonDto {
  version?: string;
  lessonData: CreateLessonDto;
}
