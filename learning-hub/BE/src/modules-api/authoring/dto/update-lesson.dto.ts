import {
  TestCaseDto,
  QuizQuestionDto,
  LessonHintsDto,
} from './create-lesson.dto';

// authorId KHÔNG có trong DTO — không cho client sửa lại chủ sở hữu qua
// update (cùng lý do với CreateLessonDto).
export class UpdateLessonDto {
  title?: string;
  slug?: string;
  description?: string;
  type?: 'coding' | 'quiz';
  status?: 'draft' | 'published';
  learningOutcome?: string;
  content?: string;
  starterCode?: string;
  solutionCode?: string;
  difficulty?: string;
  points?: number;
  testCases?: TestCaseDto[];
  quizQuestions?: QuizQuestionDto[];
  hints?: LessonHintsDto;
  resource_id?: string;
  resource_version?: string;
}

