export interface QASharedFixture {
  testId: string;
  name: string;
  category: 'SMOKE' | 'CONTENT' | 'AI_COACH_REGRESSION' | 'SECURITY';
  isCritical: boolean;
  expectedResult: string;
}

export const QA_SHARED_FIXTURES: QASharedFixture[] = [
  {
    testId: 'smoke-api-health',
    name: 'API System Health Check (/api/health)',
    category: 'SMOKE',
    isCritical: true,
    expectedResult: 'HTTP 200 status ok',
  },
  {
    testId: 'smoke-dataset-catalog',
    name: 'Dataset & AI Lab Catalog API Contract Check',
    category: 'SMOKE',
    isCritical: true,
    expectedResult: 'Catalog returns valid datasets with available_versions',
  },
  {
    testId: 'content-lesson-testcases',
    name: 'Published Coding Lessons TestCase Integrity Check',
    category: 'CONTENT',
    isCritical: true,
    expectedResult: 'All published coding lessons have non-empty input and expectedOutput',
  },
  {
    testId: 'content-quiz-options',
    name: 'Published Quiz Lessons Correct Answer Check',
    category: 'CONTENT',
    isCritical: true,
    expectedResult: 'All quiz questions have at least 1 correct option',
  },
  {
    testId: 'ai-coach-regression-baseline',
    name: 'AI Coach Response Safety & Canned Fallback Regression Check',
    category: 'AI_COACH_REGRESSION',
    isCritical: true,
    expectedResult: 'No prompt injection leaks, canned replies fallback when LLM offline',
  },
  {
    testId: 'security-idor-authoring',
    name: 'Authoring Ownership IDOR Protection Check',
    category: 'SECURITY',
    isCritical: true,
    expectedResult: 'ForbiddenException (403) when Teacher B attempts to edit Teacher A lesson',
  },
  {
    testId: 'non-critical-perf-check',
    name: 'Non-Critical Latency Performance Threshold Check',
    category: 'SMOKE',
    isCritical: false,
    expectedResult: 'API response latency under 100ms',
  },
];
