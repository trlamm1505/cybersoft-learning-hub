import type { BankBand, Difficulty } from './classDays';

export interface QuestionBankRow {
  slug: string;
  title: string;
  difficulty: Difficulty | null;
  tags: string[];
  points: number | null;
  band: BankBand | null;
  /** BANK: bài do giảng viên/AI tạo (sửa/xóa được). PLAYGROUND: bài của Code Playground cố định (chỉ xem). */
  source: 'BANK' | 'PLAYGROUND';
  editable: boolean;
  usage: { classes: number; contests: number };
  inUse: boolean;
}

export interface BankTestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface QuestionBankDetail extends QuestionBankRow {
  description: string;
  testCases: BankTestCase[];
}

export interface QuestionBankQuery {
  q?: string;
  band?: BankBand | '';
  difficulty?: Difficulty | '';
  page?: number;
}

export interface QuestionBankUpdate {
  title?: string;
  description?: string;
  band?: BankBand;
  difficulty?: Difficulty;
  testCases?: BankTestCase[];
}

// ------------------------------- Ngân hàng đề trắc nghiệm (Day 30) -------------------------------

export interface QuizOptionInput {
  text: string;
  isCorrect: boolean;
}

export interface QuizBankRow {
  id: string;
  content: string;
  difficulty: Difficulty;
  band: BankBand | null;
  category: string | null;
  tags: string[];
  points: number;
  optionCount: number;
  usage: { classes: number; contests: number };
  inUse: boolean;
  /** Câu do chính người đang xem soạn. */
  mine: boolean;
  createdAt: string | null;
}

export interface QuizBankDetail extends QuizBankRow {
  codeSnippet: string;
  explanation: string;
  options: Array<{ key: string; text: string; isCorrect: boolean }>;
}

export interface QuizQuestionPayload {
  content: string;
  codeSnippet?: string;
  options: QuizOptionInput[];
  explanation: string;
  difficulty: Difficulty;
  band: BankBand;
  category?: string;
  tags?: string[];
  points?: number;
}
