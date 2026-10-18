const test = require('node:test');
const assert = require('node:assert/strict');
const { repairClassRefs, teacherList } = require('./class-integrity');

const alive = (...ids) => (id) => ids.includes(id);

test('teacherList ưu tiên teacherIds, không thì teacherId cũ', () => {
  assert.deepEqual(teacherList({ teacherId: 'a', teacherIds: ['b', 'c', 'b'] }), ['b', 'c']);
  assert.deepEqual(teacherList({ teacherId: 'a' }), ['a']);
  assert.deepEqual(teacherList({}), []);
});

test('repairClassRefs: gỡ id ma khỏi teacherIds và chuyển giảng viên chính sang người còn lại', () => {
  const u = repairClassRefs({ teacherId: 'ghost', teacherIds: ['ghost', 't1'], studentIds: ['s1'] }, alive('t1', 's1'));
  assert.deepEqual(u, { $set: { teacherIds: ['t1'], teacherId: 't1' } });
});

test('repairClassRefs: lớp chỉ còn id ma (tIds rỗng) thì bỏ teacherId, gỡ cả học viên đã xóa', () => {
  const u = repairClassRefs({ teacherId: 'ghost', teacherIds: ['ghost'], studentIds: ['s1', 'gone'] }, alive('s1'));
  assert.deepEqual(u, { $set: { studentIds: ['s1'], teacherIds: [] }, $unset: { teacherId: 1 } });
});

test('repairClassRefs: lớp sạch → null; giảng viên đã bị hạ quyền tính là không còn hợp lệ', () => {
  assert.equal(repairClassRefs({ teacherId: 't1', teacherIds: ['t1'], studentIds: ['s1'] }, alive('t1', 's1')), null);
  const u = repairClassRefs({ teacherId: 'x', teacherIds: ['x', 't1'] }, alive('x', 't1'), alive('t1'));
  assert.deepEqual(u, { $set: { teacherIds: ['t1'], teacherId: 't1' } });
});

test('repairClassRefs: học viên đã đổi khối khỏi lớp cũ bị gỡ, người cùng khối giữ nguyên', () => {
  const age = { s1: 'CAREER_ADULT', s2: '3-5', s3: undefined };
  const fits = (id, c) => !c.ageGroup || !age[id] || age[id] === c.ageGroup;
  const u = repairClassRefs({ ageGroup: '3-5', teacherId: 't1', teacherIds: ['t1'], studentIds: ['s1', 's2', 's3'] }, () => true, () => true, fits);
  assert.deepEqual(u, { $set: { studentIds: ['s2', 's3'] } });
  assert.equal(repairClassRefs({ teacherId: 't1', teacherIds: ['t1'], studentIds: ['s1'] }, () => true, () => true, fits), null);
});
