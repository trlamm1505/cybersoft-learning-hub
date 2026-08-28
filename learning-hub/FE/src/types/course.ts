export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface PrerequisiteItem {
  id: string;
  title: string;
  isCompleted?: boolean;
  description?: string;
}

export interface Lesson {
  id: string;
  lessonNumber: number;
  title: string;
  slug: string;
  category: string;
  summary: string;
  difficulty: DifficultyLevel;
  durationMinutes: number; // e.g. 45
  durationText: string;    // e.g. "45 phút"
  objectives: string[];    // Mục tiêu bài học
  prerequisites: PrerequisiteItem[]; // Điều kiện tiên quyết
  videoUrl?: string;
  contentMarkdown: string; // Nội dung bài học chi tiết
  instructor: {
    name: string;
    avatar: string;
    role: string;
  };
  tags: string[];
}
