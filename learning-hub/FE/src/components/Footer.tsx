import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer style={{ borderTop: '1px solid var(--border-color)', background: 'var(--bg-card)', padding: '2rem 1rem', marginTop: '3rem' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', textAlign: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-main)' }}>
          ⚡ CyberSoft Learning & Contest Hub (FE Student UI v0.1)
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '600px' }}>
          Hệ thống đào tạo Lập trình Thực chiến CyberSoft Academy. Tối ưu giao diện trải nghiệm học viên trên cả nền tảng Desktop và Thiết bị di động.
        </p>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          © 2026 CyberSoft Academy. All rights reserved. Đạt chuẩn Accessibility (WCAG 2.1 AA).
        </div>
      </div>
    </footer>
  );
};
