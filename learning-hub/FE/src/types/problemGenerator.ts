export type ProblemLevel = 'EASY' | 'MEDIUM' | 'HARD';

export interface ProblemSpecInput {
  learningOutcome: string;
  level: ProblemLevel;
  constraints: string[];
  tags: string[];
}

export interface GenerateProblemPayload {
  specs: ProblemSpecInput[];
}

export interface ProblemDraftTestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface ProblemDraft {
  specId: string;
  title: string;
  slug: string;
  description: string;
  difficulty: ProblemLevel;
  tags: string[];
  starterCode: string;
  solutionCode: string;
  testCases: ProblemDraftTestCase[];
}

export interface TestCaseResult {
  index: number;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  isHidden: boolean;
}

export interface DuplicateMatch {
  existingSlug: string;
  existingTitle: string;
  similarity: number;
}

export interface ValidationResult {
  specId: string;
  slug: string;
  title: string;
  syntaxOk: boolean;
  syntaxError?: string;
  testResults: TestCaseResult[];
  allTestsPassed: boolean;
  duplicateCandidates: DuplicateMatch[];
  readyForReview: boolean;
}

export interface GenerateProblemResultItem {
  generatorUsed: string;
  prompt: string;
  draft: ProblemDraft;
  validation: ValidationResult;
}

export interface GenerateProblemResponse {
  results: GenerateProblemResultItem[];
}

export interface SaveProblemResponse {
  slug: string;
}
