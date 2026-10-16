export type AssignmentStatus = 'NOT_STARTED' | 'ATTEMPTED' | 'PASSED';

export interface MyClassExercise {
  slug: string;
  title: string;
  type: string | null;
  difficulty: string | null;
  tags: string[];
  status: AssignmentStatus;
  attempts: number;
  lastAt: string | null;
}

export interface MyClass {
  id: string;
  name: string;
  description: string;
  teacher: { name: string } | null;
  progress: { total: number; passed: number; attempted: number };
  exercises: MyClassExercise[];
}
