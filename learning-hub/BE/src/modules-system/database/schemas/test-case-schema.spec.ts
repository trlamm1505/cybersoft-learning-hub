import mongoose from 'mongoose';
import { LessonSchema } from './lesson.schema';
import { ExerciseSchema } from './exercise.schema';

// Day 30: test case có stdin rỗng (bài không đọc input) trước đây làm Mongoose ném ValidationError → 500 khi xuất bản lesson.
describe('Test case: input / expectedOutput rỗng là hợp lệ', () => {
  const Lesson = mongoose.model('LessonTcSpec', LessonSchema);
  const Exercise = mongoose.model('ExerciseTcSpec', ExerciseSchema);

  const errorsOf = (doc: mongoose.Document) => doc.validate().then(() => ({}) as Record<string, unknown>, (e: mongoose.Error.ValidationError) => e.errors ?? {});

  it('lesson coding có test case input "" không lỗi validate', async () => {
    const doc = new Lesson({ title: 'In 1', slug: 'in-1', type: 'coding', testCases: [{ input: '', expectedOutput: '1' }] });
    expect((await errorsOf(doc))['testCases.0.input']).toBeUndefined();
  });

  it('exercise có test case input "" không lỗi validate; thiếu hẳn input thì mặc định ""', async () => {
    const doc = new Exercise({ title: 'In 1', slug: 'in-1', description: 'x', testCases: [{ input: '', expectedOutput: '1' }, { expectedOutput: '2' }] });
    expect((await errorsOf(doc))['testCases.0.input']).toBeUndefined();
    expect(doc.testCases[1].input).toBe('');
  });
});

// Day 31: bài do Giảng viên/Admin tạo (có authorId) luôn bankOnly, không thể lọt ra Playground dù code tạo bài quên cờ.
describe('Exercise: bài có authorId luôn là bankOnly', () => {
  const Exercise = mongoose.model('ExerciseBankSpec', ExerciseSchema);

  it('tạo bài có authorId mà không đặt bankOnly (hoặc đặt false) → bị ép bankOnly: true khi validate', async () => {
    const a = new Exercise({ title: 'A', slug: 'a', description: 'x', authorId: 't1' });
    await a.validate();
    expect(a.bankOnly).toBe(true);
    const b = new Exercise({ title: 'B', slug: 'b', description: 'x', authorId: 't1', bankOnly: false });
    await b.validate();
    expect(b.bankOnly).toBe(true);
  });

  it('bài hệ thống (không authorId) giữ nguyên: không bị ép bankOnly', async () => {
    const c = new Exercise({ title: 'C', slug: 'c', description: 'x' });
    await c.validate();
    expect(c.bankOnly).toBeFalsy();
  });
});
