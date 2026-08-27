export enum ExerciseType {
  QUIZ = 'QUIZ',
  CODE_BLOCK = 'CODE_BLOCK',
  CODE_TEXT = 'CODE_TEXT',
  SQL_LAB = 'SQL_LAB',
}

export enum DifficultyLevel {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export class Exercises {
  id: string;
  lessonId?: string;
  title: string;
  slug: string;
  description: string;
  type: ExerciseType;
  difficulty: DifficultyLevel;
  points: number;
  starterCode?: string;
  solutionCode?: string;
  createdAt: Date;
  updatedAt: Date;
}
