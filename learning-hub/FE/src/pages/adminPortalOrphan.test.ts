import { describe, expect, it } from 'vitest';
import { canRemoveTeacherTag, liveTeacherIds, toggleTeacher } from './adminPortalModel';

/** Day 29: id giảng viên "ma" không được làm kẹt phân công lớp. */
describe('liveTeacherIds / canRemoveTeacherTag', () => {
  const ghostClass = { teachers: [{ id: 'ghost', name: 'Giảng viên không còn tồn tại' }], missingTeacherIds: ['ghost'] };

  it('bỏ id ma khỏi danh sách gửi lên khi tick thêm giảng viên', () => {
    expect(liveTeacherIds(ghostClass)).toEqual([]);
    expect(toggleTeacher(liveTeacherIds(ghostClass), 'new')).toEqual(['new']);
    expect(liveTeacherIds({ teachers: [{ id: 'a' }, { id: 'ghost' }], missingTeacherIds: ['ghost'] })).toEqual(['a']);
    expect(liveTeacherIds({ teachers: [{ id: 'a' }] })).toEqual(['a']);
  });

  it('thẻ duy nhất gỡ được nếu là id ma hoặc tài khoản đã khóa; giảng viên hoạt động duy nhất thì không', () => {
    expect(canRemoveTeacherTag(ghostClass, 'ghost')).toBe(true);
    expect(canRemoveTeacherTag({ teachers: [{ id: 'l', locked: true }] }, 'l')).toBe(true);
    expect(canRemoveTeacherTag({ teachers: [{ id: 'a' }] }, 'a')).toBe(false);
    expect(canRemoveTeacherTag({ teachers: [{ id: 'a' }, { id: 'b' }] }, 'a')).toBe(true);
  });
});
