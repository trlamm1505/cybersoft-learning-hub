import { cleanupDemo, DEMO_CLASS_NAME } from './demo-cleanup';
import { fakeModel } from './fake-model';

const REAL_U1 = '64b000000000000000000001';
const DEMO_U1 = '64b0000000000000000000d1';
const DEMO_U2 = '64b0000000000000000000d2';

function build(opts: { realClassHasDemoUser?: boolean } = {}) {
  const m = {
    users: fakeModel([
      { _id: REAL_U1, email: 'hocvien@thuc.com', role: 'STUDENT' },
      { _id: 't1', email: 'teacher@gmail.com', role: 'TEACHER' },
      { _id: DEMO_U1, email: 'demo.dashboard.s1@example.com', role: 'STUDENT' },
      { _id: DEMO_U2, email: 'demo.dashboard.s2@example.com', role: 'STUDENT' },
    ]),
    exercises: fakeModel([
      { _id: 'e-real', slug: 'python-basics' },
      { _id: 'e-demo1', slug: 'demo-dash-ex-loops' },
      { _id: 'e-demo2', slug: 'demo-dash-ex-sql' },
    ]),
    submissions: fakeModel([
      { userId: REAL_U1, exerciseId: 'e-real', status: 'AC' }, // thật
      { userId: REAL_U1, exerciseId: 'e-demo1', status: 'AC' }, // bài demo (làm trên bài demo)
      { userId: DEMO_U1, exerciseId: 'e-real', status: 'WA' }, // tài khoản demo
      { userId: DEMO_U1, exerciseId: 'e-demo1', status: 'AC' },
    ]),
    hints: fakeModel([
      { userId: REAL_U1, exerciseSlug: 'python-basics' },
      { userId: DEMO_U1, exerciseSlug: 'demo-dash-ex-loops' },
    ]),
    daLabs: fakeModel([
      { userId: REAL_U1, exerciseSlug: 'da-sql-01' },
      { userId: DEMO_U2, exerciseSlug: 'da-sql-01' },
    ]),
    aiLabs: fakeModel([{ userId: REAL_U1, exerciseSlug: 'ai-lab-01' }]),
    classes: fakeModel([
      {
        _id: 'c-demo',
        name: DEMO_CLASS_NAME,
        teacherId: 't1',
        studentIds: [DEMO_U1],
        exerciseSlugs: ['demo-dash-ex-loops'],
      },
      {
        _id: 'c-demo-renamed',
        name: 'Tên khác',
        teacherId: 't1',
        studentIds: [],
        exerciseSlugs: ['demo-dash-ex-sql'],
      },
      {
        _id: 'c-real',
        name: 'Lớp Python 01',
        teacherId: 't1',
        studentIds: opts.realClassHasDemoUser ? [REAL_U1, DEMO_U2] : [REAL_U1],
        exerciseSlugs: ['python-basics'],
      },
      {
        _id: 'c-real-empty',
        name: 'Lớp mới',
        teacherId: 't1',
        studentIds: [],
        exerciseSlugs: [],
      },
    ]),
  };
  return m;
}

describe('cleanupDemo', () => {
  it('xóa lớp, tài khoản, bài, bài nộp, gợi ý demo; giữ nguyên toàn bộ dữ liệu thật', async () => {
    const m = build();
    const report = await cleanupDemo(m as never);

    expect(report).toMatchObject({
      dryRun: false,
      users: 2,
      exercises: 2,
      classes: 2,
    });
    expect(m.users.rows.map((u) => u.email).sort()).toEqual([
      'hocvien@thuc.com',
      'teacher@gmail.com',
    ]);
    expect(m.exercises.rows.map((e) => e.slug)).toEqual(['python-basics']);
    expect(m.classes.rows.map((c) => c._id).sort()).toEqual([
      'c-real',
      'c-real-empty',
    ]);
    // Bài nộp thật của học viên thật trên bài thật còn nguyên.
    expect(m.submissions.rows).toEqual([
      { userId: REAL_U1, exerciseId: 'e-real', status: 'AC' },
    ]);
    expect(m.hints.rows).toEqual([
      { userId: REAL_U1, exerciseSlug: 'python-basics' },
    ]);
    expect(m.daLabs.rows).toEqual([
      { userId: REAL_U1, exerciseSlug: 'da-sql-01' },
    ]);
    expect(m.aiLabs.rows).toHaveLength(1);
  });

  it('--dry-run chỉ đếm, không xóa gì', async () => {
    const m = build();
    const snapshot = JSON.stringify(Object.values(m).map((x) => x.rows));
    const report = await cleanupDemo(m as never, { dryRun: true });
    expect(report).toMatchObject({
      dryRun: true,
      users: 2,
      exercises: 2,
      classes: 2,
      submissions: 3,
      hintUsages: 1,
      labSubmissions: 1,
    });
    expect(JSON.stringify(Object.values(m).map((x) => x.rows))).toBe(snapshot);
    expect(m.users.deleteMany).not.toHaveBeenCalled();
    expect(m.submissions.deleteMany).not.toHaveBeenCalled();
  });

  it('chạy lại là vô hại (idempotent) và báo 0', async () => {
    const m = build();
    await cleanupDemo(m as never);
    const again = await cleanupDemo(m as never);
    expect(again).toMatchObject({
      users: 0,
      exercises: 0,
      classes: 0,
      submissions: 0,
      hintUsages: 0,
      labSubmissions: 0,
    });
    expect(m.users.rows).toHaveLength(2);
  });

  it('học viên demo lỡ nằm trong lớp thật thì chỉ bị gỡ khỏi lớp, lớp thật không bị xóa', async () => {
    const m = build({ realClassHasDemoUser: true });
    await cleanupDemo(m as never);
    const real = m.classes.rows.find((c) => c._id === 'c-real');
    expect(real?.studentIds).toEqual([REAL_U1]);
  });

  it('không có dữ liệu demo thì không xóa gì cả', async () => {
    const m = build();
    m.users.rows.splice(2, 2);
    m.exercises.rows.splice(1, 2);
    m.classes.rows.splice(0, 2);
    m.submissions.rows.splice(1);
    m.hints.rows.splice(1);
    m.daLabs.rows.splice(1);
    const report = await cleanupDemo(m as never);
    expect(report).toMatchObject({
      users: 0,
      exercises: 0,
      classes: 0,
      submissions: 0,
      hintUsages: 0,
      labSubmissions: 0,
    });
    expect(m.users.rows).toHaveLength(2);
    expect(m.classes.rows).toHaveLength(2);
  });
});
