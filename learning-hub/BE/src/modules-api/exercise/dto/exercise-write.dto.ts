import type { ExerciseTestCase } from '../../../modules-system/database/schemas/exercise.schema';

/**
 * Payload tạo/sửa bài tập (POST/PATCH /exercises). Cố ý KHÔNG có authorId, _id,
 * createdAt...: service chỉ lấy các trường trong WRITABLE_FIELDS nên client không
 * thể ghi đè chủ sở hữu hay các trường nội bộ (mass assignment).
 */
export class ExerciseWriteDto {
  title?: string;
  slug?: string;
  description?: string;
  type?: string;
  difficulty?: string;
  points?: number;
  starterCode?: string;
  solutionCode?: string;
  timeLimitMs?: number;
  memoryLimitMb?: number;
  testCases?: ExerciseTestCase[];
  hiddenTestCases?: ExerciseTestCase[];
  officialSolution?: string;
  tags?: string[];
  gradeBand?: string;
  topic?: string;
  targetGroup?: string;
  labType?: string;
  storyContext?: string;
  illustrationUrl?: string;
  datasetId?: string;
}

export const WRITABLE_FIELDS: ReadonlyArray<keyof ExerciseWriteDto> = [
  'title',
  'slug',
  'description',
  'type',
  'difficulty',
  'points',
  'starterCode',
  'solutionCode',
  'timeLimitMs',
  'memoryLimitMb',
  'testCases',
  'hiddenTestCases',
  'officialSolution',
  'tags',
  'gradeBand',
  'topic',
  'targetGroup',
  'labType',
  'storyContext',
  'illustrationUrl',
  'datasetId',
];
