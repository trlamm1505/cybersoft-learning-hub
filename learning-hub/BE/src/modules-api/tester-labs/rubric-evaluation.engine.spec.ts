import { BadRequestException } from '@nestjs/common';
import { INITIAL_TESTER_LABS } from '../../data/initial-tester-labs';
import { evaluateRubric, runAutoChecks } from './rubric-evaluation.engine';

const csvSpec = {
  allowedFileTypes: ['csv' as const],
  requiredColumns: ['ID', 'Expected', 'Actual'],
};

describe('runAutoChecks', () => {
  it('pass khi CSV đủ cột (có BOM và dấu nháy)', () => {
    const buf = Buffer.from('﻿"ID",Expected,Actual,Extra\n1,a,b');
    const results = runAutoChecks(csvSpec, 'csv', buf);

    expect(results.every((r) => r.passed)).toBe(true);
  });

  it('báo thiếu cột bắt buộc của CSV', () => {
    const results = runAutoChecks(csvSpec, 'csv', Buffer.from('ID,Expected\n1,a'));
    const check = results.find((r) => r.check === 'required-columns');

    expect(check?.passed).toBe(false);
    expect(check?.message).toContain('Actual');
  });

  it('báo sai định dạng khi lab không nhận loại file này', () => {
    const results = runAutoChecks(csvSpec, 'pdf', Buffer.from('%PDF-1.4'));

    expect(results.find((r) => r.check === 'file-type')?.passed).toBe(false);
  });

  it('kiểm tra cột bắt buộc của JSON object và JSON array', () => {
    const spec = { allowedFileTypes: ['json' as const], requiredColumns: ['info', 'item'] };
    const ok = runAutoChecks(spec, 'json', Buffer.from('{"info":{},"item":[]}'));
    const arr = runAutoChecks(spec, 'json', Buffer.from('[{"info":1}]'));

    expect(ok.every((r) => r.passed)).toBe(true);
    expect(arr.find((r) => r.check === 'required-columns')?.passed).toBe(false);
  });

  it('báo JSON không hợp lệ', () => {
    const spec = { allowedFileTypes: ['json' as const], requiredColumns: ['info'] };
    const results = runAutoChecks(spec, 'json', Buffer.from('{oops'));

    expect(results).toEqual([
      expect.objectContaining({ check: 'file-type', passed: true }),
      expect.objectContaining({ check: 'json-syntax', passed: false }),
    ]);
  });

  it('kiểm tra chữ ký file PDF/XLSX', () => {
    const spec = { allowedFileTypes: ['pdf' as const, 'xlsx' as const], requiredColumns: [] };

    expect(runAutoChecks(spec, 'pdf', Buffer.from('%PDF-1.7')).every((r) => r.passed)).toBe(true);
    expect(runAutoChecks(spec, 'pdf', Buffer.from('not pdf')).some((r) => !r.passed)).toBe(true);
    expect(runAutoChecks(spec, 'xlsx', Buffer.from('PK\u0003\u0004')).every((r) => r.passed)).toBe(true);
  });

  it('header của template seed luôn qua auto-check của chính lab đó', () => {
    for (const lab of INITIAL_TESTER_LABS.filter((l) => l.allowedFileTypes.includes('csv'))) {
      const header = Buffer.from(lab.requiredColumns.join(',') + '\n');
      expect(runAutoChecks(lab, 'csv', header).every((r) => r.passed)).toBe(true);
    }
  });
});

describe('evaluateRubric', () => {
  const criteria = INITIAL_TESTER_LABS[0].rubricCriteria;
  const grade = (score: number) => criteria.map((c) => ({ key: c.key, score }));

  it('tổng hợp riêng severity và quality trên thang 10', () => {
    const grades = criteria.map((c) => ({
      key: c.key,
      score: c.kind === 'severity' ? 1 : 2,
    }));
    const summary = evaluateRubric(criteria, grades);

    expect(summary).toMatchObject({
      severityScore: 1,
      severityMax: 2,
      qualityScore: 8,
      qualityMax: 8,
      total: 9,
      max: 10,
    });
  });

  it('cho điểm tối đa và tối thiểu', () => {
    expect(evaluateRubric(criteria, grade(2)).total).toBe(10);
    expect(evaluateRubric(criteria, grade(0)).total).toBe(0);
  });

  it('từ chối điểm vượt maxScore hoặc âm', () => {
    expect(() => evaluateRubric(criteria, grade(3))).toThrow(BadRequestException);
    expect(() => evaluateRubric(criteria, grade(-1))).toThrow(BadRequestException);
  });

  it('từ chối điểm không phải số hữu hạn', () => {
    const grades = grade(1);
    grades[0].score = NaN;
    expect(() => evaluateRubric(criteria, grades)).toThrow(BadRequestException);
  });

  it('từ chối tiêu chí lạ, chấm trùng hoặc thiếu', () => {
    expect(() => evaluateRubric(criteria, [...grade(1), { key: 'x', score: 1 }])).toThrow(
      BadRequestException,
    );
    expect(() => evaluateRubric(criteria, [...grade(1), grade(1)[0]])).toThrow(
      BadRequestException,
    );
    expect(() => evaluateRubric(criteria, grade(1).slice(1))).toThrow(BadRequestException);
  });

  it('seed có đúng 10 lab, mỗi rubric 10 điểm với 1 tiêu chí severity', () => {
    expect(INITIAL_TESTER_LABS).toHaveLength(10);
    for (const lab of INITIAL_TESTER_LABS) {
      expect(lab.rubricCriteria.reduce((s, c) => s + c.maxScore, 0)).toBe(10);
      expect(lab.rubricCriteria.filter((c) => c.kind === 'severity')).toHaveLength(1);
    }
  });
});
