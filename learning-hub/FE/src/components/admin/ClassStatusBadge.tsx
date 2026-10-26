import React from 'react';
import { CLASS_STATUS, type ClassStatusKey } from '../../pages/adminPortalModel';
import { Pill } from './AdminUi';

/**
 * Badge trạng thái lớp kèm tooltip giải thích nghiệp vụ (title cho chuột, aria-label cho trình đọc màn hình).
 * `fixed`: nhãn ngắn trong khung rộng cố định w-28 căn giữa, để "Hoạt động" và "Lưu trữ" không làm lệch cột kế bên.
 */
export const ClassStatusBadge: React.FC<{ status: ClassStatusKey; fixed?: boolean }> = ({ status, fixed }) => {
  const s = CLASS_STATUS[status];
  return (
    <span title={s.hint} aria-label={`${s.label}. ${s.hint}`} className="inline-flex cursor-help">
      <Pill tone={s.tone} className={fixed ? 'w-28 justify-center text-center' : ''}>
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${status === 'OPEN' ? 'bg-emerald-500' : 'bg-slate-400'}`} aria-hidden="true" />
        {fixed ? s.short : s.label}
      </Pill>
    </span>
  );
};
