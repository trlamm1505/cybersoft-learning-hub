const test = require('node:test');
const assert = require('node:assert/strict');
const { classifyExercise } = require('./exercise-classifier');

test('bankBand đã có thì giữ nguyên, không đổi', () => {
  assert.deepEqual(classifyExercise({ bankBand: '10-12', gradeBand: '6-9' }), { band: '10-12', reason: 'đã có bankBand', changed: false });
});

test('nhãn do con người đặt thắng nội dung: targetGroup rồi gradeBand', () => {
  assert.equal(classifyExercise({ targetGroup: 'K6_9', tags: ['dp'] }).band, '6-9');
  assert.equal(classifyExercise({ targetGroup: 'K10_12' }).band, '10-12');
  assert.equal(classifyExercise({ gradeBand: '9-12' }).band, '10-12');
  assert.equal(classifyExercise({ gradeBand: '10-12' }).band, '10-12');
  assert.equal(classifyExercise({ gradeBand: '6-9', tags: ['graph'] }).band, '6-9');
});

test('chưa có nhãn: dấu hiệu nâng cao -> 10-12', () => {
  for (const tags of [['dp'], ['graph', 'bfs'], ['binary-search-on-answer'], ['heap'], ['custom-comparator'], ['union-find']]) {
    assert.equal(classifyExercise({ slug: 'x', tags }).band, '10-12', tags.join());
  }
  assert.equal(classifyExercise({ slug: 'quy-hoach-dong-balo', tags: [] }).band, '10-12');
});

test('chưa có nhãn: vòng lặp, chuỗi, mảng 1 chiều, if-else -> 6-9', () => {
  for (const tags of [['loops'], ['arrays', 'loops'], ['string'], ['if-else'], []]) {
    assert.equal(classifyExercise({ slug: 'x', difficulty: 'EASY', tags }).band, '6-9', tags.join());
  }
});

test('chưa có nhãn: HARD không có dấu hiệu căn bản -> 10-12; HARD kèm tag căn bản -> 6-9', () => {
  assert.equal(classifyExercise({ slug: 'x', difficulty: 'HARD', tags: ['recursion'] }).band, '10-12');
  assert.equal(classifyExercise({ slug: 'x', difficulty: 'HARD', tags: ['loop', 'matrix'] }).band, '6-9');
});

test('mọi bài đều có khối (không còn chưa phân loại)', () => {
  for (const ex of [{}, { slug: 'demo-dash-ex-sql', topic: 'sql' }, { title: 'Bài lạ' }]) {
    assert.ok(['6-9', '10-12'].includes(classifyExercise(ex).band));
  }
});
