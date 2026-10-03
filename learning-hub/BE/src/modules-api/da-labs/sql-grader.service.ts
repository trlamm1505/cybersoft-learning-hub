import {
  Inject,
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DatasetIntegrationService } from '../../integration/dataset-integration.service';
import { checkStudentSql } from './sql-guard';
import { compareResultSets, hasTopLevelOrderBy } from './result-set.comparator';
import {
  SANDBOX_SQL_EXECUTOR,
  SandboxQueryError,
  SandboxUnavailableError,
} from './sandbox-sql.executor';
import type { ResultSet, SandboxSqlExecutor } from './sandbox-sql.executor';

export const SQL_TIMEOUT_MS = 3_000;
/** Số dòng tối đa trả về trình duyệt để hiển thị bảng. */
export const PREVIEW_ROWS = 200;

export type SqlRunStatus = 'OK' | 'REJECTED' | 'SQL_ERROR';
export type SqlGradeStatus = 'ACCEPTED' | 'WRONG_ANSWER' | 'REJECTED' | 'SQL_ERROR';

export interface SqlPreview {
  columns: string[];
  rows: unknown[][];
  rowCount: number;
  truncated: boolean;
}

export interface SqlRunResult {
  status: SqlRunStatus;
  error?: string;
  result?: SqlPreview;
}

export interface SqlGradeResult {
  status: SqlGradeStatus;
  score: number;
  maxScore: number;
  feedback: string;
  result?: SqlPreview;
}

/** Phần của bài tập mà grader cần; lấy từ document Exercise. */
export interface GradableSqlExercise {
  resource_id: string;
  solutionCode: string;
  points: number;
}

const toPreview = (rs: ResultSet): SqlPreview => ({
  columns: rs.columns,
  rows: rs.rows.slice(0, PREVIEW_ROWS),
  rowCount: rs.rows.length,
  truncated: rs.truncated || rs.rows.length > PREVIEW_ROWS,
});

@Injectable()
export class SqlGraderService {
  constructor(
    private readonly datasets: DatasetIntegrationService,
    @Inject(SANDBOX_SQL_EXECUTOR)
    private readonly executor: SandboxSqlExecutor,
  ) {}

  /** Chạy thử, không chấm điểm. */
  async run(resourceId: string, studentSql: string): Promise<SqlRunResult> {
    const guard = checkStudentSql(studentSql);
    if (!guard.ok) return { status: 'REJECTED', error: guard.reason };

    const { sandbox_db_url } = await this.datasets.fetchDatasetInfo(resourceId);
    try {
      const rs = await this.execute(sandbox_db_url, guard.sql);
      return { status: 'OK', result: toPreview(rs) };
    } catch (err) {
      if (err instanceof SandboxQueryError) {
        return { status: 'SQL_ERROR', error: err.message };
      }
      throw err;
    }
  }

  async grade(
    exercise: GradableSqlExercise,
    studentSql: string,
  ): Promise<SqlGradeResult> {
    const maxScore = exercise.points;
    const guard = checkStudentSql(studentSql);
    if (!guard.ok) {
      return { status: 'REJECTED', score: 0, maxScore, feedback: guard.reason };
    }

    const { sandbox_db_url } = await this.datasets.fetchDatasetInfo(
      exercise.resource_id,
    );

    // Câu tham chiếu cũng đi qua cùng lớp kiểm tra, không có đường chạy riêng.
    const reference = checkStudentSql(exercise.solutionCode);
    if (!reference.ok) {
      throw new InternalServerErrorException(
        `Câu tham chiếu của bài không hợp lệ: ${reference.reason}`,
      );
    }

    let expected: ResultSet;
    try {
      expected = await this.execute(sandbox_db_url, reference.sql);
    } catch (err) {
      if (err instanceof SandboxQueryError) {
        // Câu tham chiếu lỗi là lỗi của đề (hoặc schema bên TTS 01 đã đổi), không phải của học viên.
        throw new InternalServerErrorException(
          `Câu tham chiếu của bài không chạy được trên sandbox: ${err.message}`,
        );
      }
      throw err;
    }

    let actual: ResultSet;
    try {
      actual = await this.execute(sandbox_db_url, guard.sql);
    } catch (err) {
      if (err instanceof SandboxQueryError) {
        return { status: 'SQL_ERROR', score: 0, maxScore, feedback: err.message };
      }
      throw err;
    }

    const cmp = compareResultSets(
      expected,
      actual,
      hasTopLevelOrderBy(exercise.solutionCode),
    );
    return {
      status: cmp.match ? 'ACCEPTED' : 'WRONG_ANSWER',
      score: cmp.match ? maxScore : 0,
      maxScore,
      feedback: cmp.feedback,
      result: toPreview(actual),
    };
  }

  private async execute(dbUrl: string, sql: string): Promise<ResultSet> {
    try {
      return await this.executor.run(dbUrl, sql, { timeoutMs: SQL_TIMEOUT_MS });
    } catch (err) {
      if (err instanceof SandboxUnavailableError) {
        throw new ServiceUnavailableException(
          'Sandbox DB của Data & AI Resource đang không kết nối được.',
        );
      }
      throw err;
    }
  }
}
