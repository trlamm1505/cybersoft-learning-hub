export type TesterLabCategory = 'BUG_REPORT' | 'TEST_CASE_DESIGN' | 'API_TESTING';

export interface RubricCriterion {
  key: string;
  label: string;
  maxScore: number;
  kind: 'severity' | 'quality';
}

export interface TesterLab {
  _id: string;
  labCode: string;
  title: string;
  description: string;
  category: TesterLabCategory;
  environmentUrl: string;
  fixtureUrls: string[];
  templateArtifact: string;
  allowedFileTypes: string[];
  requiredColumns: string[];
  rubricCriteria: RubricCriterion[];
}

export interface AutoCheckResult {
  check: string;
  passed: boolean;
  message: string;
}

export interface RubricGrade {
  key: string;
  score: number;
  note?: string;
}

export interface TesterLabSubmission {
  _id: string;
  fileType: string;
  fileSize: number;
  autoCheckResults: AutoCheckResult[];
  rubricGrades: RubricGrade[];
  reviewerNotes: string;
  /** 'FORM': nộp bằng biểu mẫu test case + bug report; 'FILE' (hoặc thiếu ở bản cũ): nộp file. */
  kind?: 'FILE' | 'FORM';
  formData?: {
    testCases: Array<{ code: string; description: string; input: string; expected: string }>;
    bugReports: Array<{ title: string; steps: string; expected: string; actual: string; severity: string }>;
  };
  status: 'SUBMITTED' | 'REVIEWED';
  createdAt: string;
}

export interface ReviewableSubmission extends TesterLabSubmission {
  userId: string;
}
