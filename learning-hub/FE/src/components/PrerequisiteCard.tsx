import React from 'react';
import type { PrerequisiteItem } from '../types/course';

interface PrerequisiteCardProps {
  prerequisites: PrerequisiteItem[];
}

export const PrerequisiteCard: React.FC<PrerequisiteCardProps> = ({ prerequisites }) => {
  if (!prerequisites || prerequisites.length === 0) {
    return <p style={{ color: 'var(--text-muted)' }}>Khóa học này không yêu cầu điều kiện tiên quyết.</p>;
  }

  return (
    <div className="prereq-list" aria-label="Danh sách điều kiện tiên quyết">
      {prerequisites.map((item) => (
        <div key={item.id} className="prereq-card">
          <div
            className={`prereq-icon ${item.isCompleted ? 'completed' : 'pending'}`}
            title={item.isCompleted ? 'Đã hoàn thành' : 'Khuyên dùng trước khi học'}
            aria-label={item.isCompleted ? 'Đã đáp ứng điều kiện' : 'Chưa đáp ứng điều kiện'}
          >
            {item.isCompleted ? '✓' : '!'}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.925rem' }}>
              {item.title}
              {item.isCompleted && (
                <span style={{ fontSize: '0.75rem', color: 'var(--success)', marginLeft: '0.5rem' }}>
                  (Đã đáp ứng)
                </span>
              )}
            </div>
            {item.description && (
              <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                {item.description}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
