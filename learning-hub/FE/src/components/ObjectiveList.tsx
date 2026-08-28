import React from 'react';

interface ObjectiveListProps {
  objectives: string[];
}

export const ObjectiveList: React.FC<ObjectiveListProps> = ({ objectives }) => {
  if (!objectives || objectives.length === 0) {
    return <p className="text-[var(--text-muted)] text-sm">Chưa có thông tin mục tiêu bài học.</p>;
  }

  return (
    <ul className="flex flex-col gap-2.5" aria-label="Danh sách mục tiêu bài học">
      {objectives.map((obj, index) => (
        <li key={index} className="flex items-start gap-3 text-sm leading-relaxed text-[var(--text-main)]">
          <span className="text-indigo-600 dark:text-cyan-400 font-bold shrink-0 mt-0.5" aria-hidden="true">✓</span>
          <span>{obj}</span>
        </li>
      ))}
    </ul>
  );
};
