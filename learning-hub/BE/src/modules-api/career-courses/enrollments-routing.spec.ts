import { StudentClassAssignmentsController } from '../class-assignments/class-assignments.controller';

describe('GET /student/enrollments theo nhóm đối tượng', () => {
  const build = () => {
    const classes = { myEnrollments: jest.fn().mockResolvedValue(['lop-pho-thong']) };
    const career = { myEnrollments: jest.fn().mockResolvedValue(['khoa-chuyen-nganh']) };
    return { ctrl: new StudentClassAssignmentsController(classes as never, career as never), classes, career };
  };

  it('Người đi làm / Trái ngành (CAREER_ADULT): trả 3 khóa học chuyên ngành, không truy vấn lớp phổ thông', async () => {
    const { ctrl, classes, career } = build();
    const out = await ctrl.enrollments({ sub: 'u1', email: 'a@b.c', role: 'STUDENT', ageGroup: 'CAREER_ADULT' } as never);
    expect(out).toEqual(['khoa-chuyen-nganh']);
    expect(career.myEnrollments).toHaveBeenCalledWith('u1');
    expect(classes.myEnrollments).not.toHaveBeenCalled();
  });

  it('học sinh phổ thông vẫn lấy lớp học như cũ', async () => {
    const { ctrl, classes, career } = build();
    const user = { sub: 'u2', email: 'a@b.c', role: 'STUDENT', ageGroup: '6-9' } as never;
    expect(await ctrl.enrollments(user)).toEqual(['lop-pho-thong']);
    expect(classes.myEnrollments).toHaveBeenCalledWith(user);
    expect(career.myEnrollments).not.toHaveBeenCalled();
  });
});
