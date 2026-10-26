const test = require('node:test');
const assert = require('node:assert/strict');
const { outOfSequenceIds } = require('./playground-sequence');

const ids = ['a', 'b', 'c', 'd', 'e'];

test('tiến độ liên tục #1..#k: không bài nào bị coi là nhảy cóc', () => {
  assert.deepEqual(outOfSequenceIds(ids, new Set()), []);
  assert.deepEqual(outOfSequenceIds(ids, new Set(['a', 'b'])), []);
  assert.deepEqual(outOfSequenceIds(ids, new Set(ids)), []);
});

test('nhảy cóc: mọi bài đã giải SAU chỗ đứt đầu tiên bị gắn cờ (vd #3 và #5 khi #1, #2 chưa làm)', () => {
  assert.deepEqual(outOfSequenceIds(ids, new Set(['c', 'e'])), ['c', 'e']);
  assert.deepEqual(outOfSequenceIds(ids, new Set(['a', 'c', 'd'])), ['c', 'd']);
  assert.deepEqual(outOfSequenceIds(ids, new Set(['a', 'b', 'd'])), ['d']);
});

test('sau khi gắn cờ, chạy lại không còn gì để gắn (idempotent)', () => {
  const solved = new Set(['a', 'c', 'e']);
  const flagged = new Set(outOfSequenceIds(ids, solved));
  const remaining = new Set([...solved].filter((x) => !flagged.has(x)));
  assert.deepEqual([...remaining], ['a']);
  assert.deepEqual(outOfSequenceIds(ids, remaining), []);
});
