import { describe, expect, it } from 'vitest';
import { apiMessage, BANK_DELETE_BLOCKED, bandLabel, diffUpdate, formFromDetail, sourceLabel, usageLabel, validateEditForm } from './questionBankModel';
import type { QuestionBankDetail } from '../types/questionBank';

const detail: QuestionBankDetail = {
  slug: 'bai-1', title: 'Bài 1', description: 'Mô tả', difficulty: 'EASY', tags: [], points: 10, band: '6-9', source: 'BANK', editable: true,
  usage: { classes: 0, contests: 0 }, inUse: false,
  testCases: [{ input: '1', expectedOutput: '1', isHidden: false }, { input: '2', expectedOutput: '2', isHidden: true }],
};

describe('questionBankModel', () => {
  it('nhãn khối, nguồn và mức sử dụng', () => {
    expect(bandLabel('6-9')).toBe('Khối 6–9');
    expect(bandLabel('10-12')).toBe('Khối 10–12');
    expect(bandLabel(null)).toBe('Chưa phân loại');
    expect(sourceLabel('PLAYGROUND')).toContain('cố định');
    expect(usageLabel({ classes: 2, contests: 1 })).toBe('Đang dùng: 2 lớp, 1 cuộc thi');
    expect(usageLabel({ classes: 0, contests: 0 })).toBe('');
  });

  it('kiểm tra form sửa: tiêu đề, mô tả, số test, test hiện', () => {
    const ok = formFromDetail(detail);
    expect(validateEditForm(ok)).toBeNull();
    expect(validateEditForm({ ...ok, title: ' ' })).toMatch(/Tiêu đề/);
    expect(validateEditForm({ ...ok, description: '' })).toMatch(/Mô tả/);
    expect(validateEditForm({ ...ok, testCases: ok.testCases.slice(0, 1) })).toMatch(/2 test case/);
    expect(validateEditForm({ ...ok, testCases: ok.testCases.map((t) => ({ ...t, isHidden: true })) })).toMatch(/test case hiện/);
  });

  it('chỉ gửi trường thay đổi', () => {
    const f = formFromDetail(detail);
    expect(diffUpdate(detail, f)).toEqual({});
    expect(diffUpdate(detail, { ...f, title: 'Mới', band: '10-12', difficulty: 'HARD' })).toEqual({ title: 'Mới', band: '10-12', difficulty: 'HARD' });
    const changed = { ...f, testCases: [...f.testCases, { input: '3', expectedOutput: '3', isHidden: true }] };
    expect(Object.keys(diffUpdate(detail, changed))).toEqual(['testCases']);
  });

  it('thông báo lỗi từ API; câu dự phòng khi không có', () => {
    expect(apiMessage({ response: { data: { message: BANK_DELETE_BLOCKED } } }, 'x')).toBe('Không thể xóa bài tập đang được sử dụng trong Lớp học hoặc Cuộc thi');
    expect(apiMessage(new Error('net'), 'Dự phòng')).toBe('Dự phòng');
  });
});
