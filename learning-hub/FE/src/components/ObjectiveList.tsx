import React from 'react';

interface ObjectiveListProps {
  objectives: string[];
}

export const ObjectiveList: React.FC<ObjectiveListProps> = ({ objectives }) => {
  if (!objectives || objectives.length === 0) {
    return <p style={{ color: 'var(--text-muted)' }}>Chưa có thông tin mục tiêu bài học.</p>;
  }

  return (
    <ul className="objective-list" aria-label="Danh sách mục tiêu bài học">
      {objectives.map((obj, index) => (
        <li key={index} className="objective-item">
          <span className="objective-check" aria-hidden="true">✓</span>
          <span>{obj}</span>
        </li>
      ))}
    </ul>
  );
};
