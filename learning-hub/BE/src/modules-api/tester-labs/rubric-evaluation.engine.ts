import { BadRequestException } from '@nestjs/common';
import type {
  ArtifactFileType,
  RubricCriterion,
} from '../../modules-system/database/schemas/tester-lab.schema';
import type {
  AutoCheckResult,
  RubricGrade,
} from '../../modules-system/database/schemas/tester-lab-submission.schema';

export interface AutoCheckSpec {
  allowedFileTypes: ArtifactFileType[];
  requiredColumns: string[];
}

export interface RubricSummary {
  grades: RubricGrade[];
  severityScore: number;
  severityMax: number;
  qualityScore: number;
  qualityMax: number;
  total: number;
  max: number;
}

function parseCsvHeader(text: string): string[] {
  const firstLine = text.replace(/^\uFEFF/, '').split(/\r?\n/, 1)[0];
  return firstLine.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
}

function parseJsonKeys(text: string): string[] | null {
  try {
    const data: unknown = JSON.parse(text);
    const target = Array.isArray(data) ? data[0] : data;
    return target && typeof target === 'object' ? Object.keys(target) : [];
  } catch {
    return null;
  }
}

/**
 * Đối chiếu nội dung thật với loại file (không tin MIME/đuôi do client gửi):
 * PDF/XLSX theo magic bytes, CSV/JSON phải là văn bản (không có byte NUL).
 */
export function matchesSignature(
  fileType: ArtifactFileType,
  buffer: Buffer,
): boolean {
  if (fileType === 'pdf' || fileType === 'xlsx') {
    const magic = fileType === 'pdf' ? '%PDF' : 'PK';
    return buffer.subarray(0, magic.length).toString('latin1') === magic;
  }
  return !buffer.includes(0);
}

/** Check cứng: chỉ trả pass/fail + cảnh báo, không chấm điểm. */
export function runAutoChecks(
  spec: AutoCheckSpec,
  fileType: ArtifactFileType,
  buffer: Buffer,
): AutoCheckResult[] {
  const results: AutoCheckResult[] = [];
  const add = (check: string, passed: boolean, message: string) =>
    results.push({ check, passed, message });

  const typeOk = spec.allowedFileTypes.includes(fileType);
  add(
    'file-type',
    typeOk,
    typeOk
      ? `Định dạng .${fileType} hợp lệ`
      : `Bài này chỉ nhận: ${spec.allowedFileTypes.join(', ')}`,
  );

  if (fileType === 'pdf' || fileType === 'xlsx') {
    const ok = matchesSignature(fileType, buffer);
    add(
      'file-signature',
      ok,
      ok ? 'Nội dung khớp định dạng' : `Nội dung không phải file .${fileType}`,
    );
    return results;
  }

  const text = buffer.toString('utf8');
  const columns =
    fileType === 'csv' ? parseCsvHeader(text) : parseJsonKeys(text);
  if (columns === null) {
    add('json-syntax', false, 'JSON không hợp lệ');
    return results;
  }
  if (fileType === 'json') add('json-syntax', true, 'JSON hợp lệ');

  if (spec.requiredColumns.length > 0) {
    const missing = spec.requiredColumns.filter((c) => !columns.includes(c));
    add(
      'required-columns',
      missing.length === 0,
      missing.length === 0
        ? 'Đủ cột bắt buộc'
        : `Thiếu cột bắt buộc: ${missing.join(', ')}`,
    );
  }
  return results;
}

/** Kiểm tra điểm reviewer nhập theo barem và tổng hợp riêng severity/quality. */
export function evaluateRubric(
  criteria: RubricCriterion[],
  grades: RubricGrade[],
): RubricSummary {
  const byKey = new Map(criteria.map((c) => [c.key, c]));
  const seen = new Set<string>();
  for (const g of grades) {
    const criterion = g && byKey.get(g.key);
    if (!criterion) {
      throw new BadRequestException(`Tiêu chí không tồn tại: ${g?.key}`);
    }
    if (seen.has(g.key)) {
      throw new BadRequestException(`Tiêu chí bị chấm trùng: ${g.key}`);
    }
    seen.add(g.key);
    if (
      typeof g.score !== 'number' ||
      !Number.isFinite(g.score) ||
      g.score < 0 ||
      g.score > criterion.maxScore
    ) {
      throw new BadRequestException(
        `Điểm "${criterion.label}" phải trong khoảng 0-${criterion.maxScore}`,
      );
    }
  }
  if (seen.size !== criteria.length) {
    throw new BadRequestException('Phải chấm đủ tất cả tiêu chí rubric');
  }

  const sum = (kind: RubricCriterion['kind'], field: 'score' | 'max') =>
    criteria
      .filter((c) => c.kind === kind)
      .reduce(
        (acc, c) =>
          acc +
          (field === 'max'
            ? c.maxScore
            : (grades.find((g) => g.key === c.key) as RubricGrade).score),
        0,
      );

  const severityScore = sum('severity', 'score');
  const qualityScore = sum('quality', 'score');
  const severityMax = sum('severity', 'max');
  const qualityMax = sum('quality', 'max');
  return {
    grades,
    severityScore,
    severityMax,
    qualityScore,
    qualityMax,
    total: severityScore + qualityScore,
    max: severityMax + qualityMax,
  };
}
