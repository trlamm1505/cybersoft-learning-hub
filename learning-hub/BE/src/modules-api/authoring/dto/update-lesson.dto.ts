import { TestCaseDto, QuizQuestionDto, LessonHintsDto } from './create-lesson.dto';

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
  authorId?: string;
  testCases?: TestCaseDto[];
  quizQuestions?: QuizQuestionDto[];
  hints?: LessonHintsDto;
}
