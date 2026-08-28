import React from 'react';
import type { DifficultyLevel } from '../types/course';

interface DifficultyBadgeProps {
  difficulty: DifficultyLevel;
}

export const DifficultyBadge: React.FC<DifficultyBadgeProps> = ({ difficulty }) => {
  const getBadgeClass = (level: DifficultyLevel) => {
    switch (level) {
      case 'Beginner':
        return 'badge-beginner';
      case 'Intermediate':
        return 'badge-intermediate';
      case 'Advanced':
        return 'badge-advanced';
      default:
        return 'badge-beginner';
    }
  };

  const getLabelVi = (level: DifficultyLevel) => {
    switch (level) {
      case 'Beginner':
        return 'Cơ bản';
      case 'Intermediate':
        return 'Trung bình';
      case 'Advanced':
        return 'Nâng cao';
      default:
        return level;
    }
  };

  return (
    <span
      className={`badge ${getBadgeClass(difficulty)}`}
      aria-label={`Độ khó: ${getLabelVi(difficulty)}`}
    >
      <span aria-hidden="true">•</span> {getLabelVi(difficulty)}
    </span>
  );
};
