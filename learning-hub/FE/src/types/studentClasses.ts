export type AssignmentStatus = 'NOT_STARTED' | 'ATTEMPTED' | 'PASSED';

export interface MyClassExercise {
  slug: string;
  title: string;
  type: string | null;
  difficulty: string | null;
  tags: string[];
  status: AssignmentStatus;
  attempts: number;
  lastAt: string | null;
}

export interface MyClass {
  id: string;
  name: string;
  description: string;
  teacher: { name: string } | null;
  progress: { total: number; passed: number; attempted: number };
  exercises: MyClassExercise[];
}

export type EnrollmentStatus = 'IN_PROGRESS' | 'COMPLETED' | 'ENDED';
export type CertificateGrade = 'Xuất sắc' | 'Giỏi' | 'Khá';

/** Dữ liệu in trên chứng chỉ hoàn thành khóa học (chỉ có khi lớp đã hoàn thành). */
export interface EnrollmentCertificate {
  studentName: string;
  className: string;
  teacherName: string | null;
  /** Điểm tổng kết quy về thang 100. */
  finalScore: number;
  earned: number;
  max: number;
  grade: CertificateGrade;
  completedAt: string;
  code: string;
}

/** Lớp/khóa học học viên đã tham gia (trang Hồ sơ). */
export interface MyEnrollment {
  classId: string;
  className: string;
  classCode: string | null;
  teacherName: string | null;
  status: EnrollmentStatus;
  totalAssignments: number;
  doneCount: number;
  earned: number;
  max: number;
  percent: number;
  certificate: EnrollmentCertificate | null;
}
