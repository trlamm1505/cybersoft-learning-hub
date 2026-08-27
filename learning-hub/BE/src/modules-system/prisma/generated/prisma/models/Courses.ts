export enum CourseLevel {
  KID = 'KID',
  TEEN = 'TEEN',
  PRO = 'PRO',
  ADULT = 'ADULT',
}

export class Courses {
  id: string;
  title: string;
  slug: string;
  description?: string;
  thumbnail?: string;
  level: CourseLevel;
  isPublished: boolean;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}
